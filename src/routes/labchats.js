const express = require('express');
const router = express.Router();
const pool = require('../config/postgres');
const fetch = require('node-fetch');
const redis = require('../config/redis.config');
const tokenUsageService = require('../services/tokenUsage.service');
const PLANS = require('../config/plans');
const multer = require('multer');
const path = require('path');
const { encode } = require('gpt-3-encoder');

// Configuração do Multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB
    }
});

// Validação de upload de arquivos
const validateFile = (req, res, next) => {
  if (req.file) {
    // Validar tipo MIME
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de arquivo não suportado'
      });
    }

    // Validar tamanho (20MB)
    const maxSize = 20 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande. Tamanho máximo: 20MB'
      });
    }
  }
  next();
};

// Função para obter o plano do usuário
async function getUserPlan(userId) {
  try {
    const userPlan = await redis.get(`user:${userId}:plan`);
    return userPlan ? JSON.parse(userPlan) : PLANS.FREE_TRIAL;
  } catch (error) {
    console.error('Erro ao obter plano do usuário:', error);
    return PLANS.FREE_TRIAL;
  }
}

// Middleware para verificar limite de tokens
const checkTokenLimit = async (req, res, next) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id é obrigatório' });
    }

    const plan = await getUserPlan(user_id);
    const tokenKey = `user:${user_id}:tokens`;
    
    // Obter uso atual de tokens
    const currentUsage = parseInt(await redis.get(tokenKey) || '0', 10);
    const tokenLimit = Number(plan.tokenLimit);
    
    if (currentUsage >= tokenLimit) {
      return res.status(429).json({
        success: false,
        message: 'Limite de tokens excedido para seu plano. Tente novamente em uma hora.'
      });
    }

    // Adicionar o uso de tokens ao request para uso posterior
    req.tokenUsage = {
      current: currentUsage,
      limit: plan.tokenLimit === -1 ? Infinity : plan.tokenLimit
    };

    next();
  } catch (error) {
    console.error('Erro no token limiter:', error);
    next(error);
  }
};

// Ajuste o nome da tabela e campos conforme seu banco!
router.get('/lab-chats', async (req, res) => {
  // Apenas retorna um placeholder ou lista vazia
  res.json({ success: true, data: [] });
});

// Proxy route para buscar histórico de chats da API externa
// IMPORTANTE: A API externa espera POST com body JSON, mesmo para buscas (não GET com body)
router.post('/lab-chats/history', async (req, res) => {
  try {
    const { chat_name } = req.body;
    
    const response = await fetch('https://n8n.aiclausy.xyz/webhook/3fd8a637-8e69-430b-ad61-11edf3846ae9', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_name: chat_name || "all"
      })
    });
    
    if (!response.ok) {
      throw new Error(`API externa retornou status ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar histórico de chats:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar histórico de chats',
      message: error.message 
    });
  }
});

// Proxy route para buscar mensagens de um chat específico
router.post('/lab-chats/messages', async (req, res) => {
  try {
    const { chat_name } = req.body;
    
    if (!chat_name) {
      return res.status(400).json({ error: 'chat_name é obrigatório' });
    }
    
    const response = await fetch('https://n8n.aiclausy.xyz/webhook/3fd8a637-8e69-430b-ad61-11edf3846ae9', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_name: chat_name
      })
    });
    
    if (!response.ok) {
      throw new Error(`API externa retornou status ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar mensagens do chat:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar mensagens do chat',
      message: error.message 
    });
  }
});

// Proxy route para enviar mensagens para o laboratório
router.post('/lab-chats/send', upload.single('file'), validateFile, checkTokenLimit, async (req, res) => {
  try {
    const { user_id, conteudo } = req.body;
    const requestTimestamp = Date.now();
    
    let fileContent = null;
    
    // Process file if it exists
    if (req.file) {
      try {
        console.log('Starting file processing for lab:', req.file.originalname);
        
        // Get file extension
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        console.log('File extension:', fileExt);
        
        // Process file based on type
        if (fileExt === '.pdf') {
          console.log('Processing PDF file for lab');
          console.log('Buffer length:', req.file.buffer.length);
          console.log('First 32 bytes:', req.file.buffer.slice(0, 32));
          const pdf = require('pdf-parse');
          const pdfData = await pdf(req.file.buffer);
          fileContent = pdfData.text;
          if (!fileContent || fileContent.trim().length === 0) {
            throw new Error('O PDF não contém texto extraível. Se for um PDF digitalizado (imagem), utilize um arquivo com texto pesquisável.');
          }
        } else if (fileExt === '.docx') {
          console.log('Processing DOCX file for lab');
          const mammoth = require('mammoth');
          const result = await mammoth.extractRawText({ buffer: req.file.buffer });
          fileContent = result.value;
        } else if (fileExt === '.doc') {
          console.log('Processing DOC file for lab');
          // Para arquivos DOC, tentar usar mammoth também
          const mammoth = require('mammoth');
          const result = await mammoth.extractRawText({ buffer: req.file.buffer });
          fileContent = result.value;
        } else if (fileExt === '.txt') {
          console.log('Processing text file for lab');
          fileContent = req.file.buffer.toString('utf-8');
        }

        if (!fileContent || fileContent.trim().length === 0) {
          throw new Error('File content is empty after processing');
        }

        console.log('File processed successfully for lab. Content length:', fileContent.length);

        // Validação de Tokens
        const TOKEN_LIMIT = 64000;
        const promptTokens = encode(conteudo || '').length;
        const fileTokens = encode(fileContent).length;
        const totalInputTokens = promptTokens + fileTokens;

        console.log(`Token estimation for lab: prompt=${promptTokens}, file=${fileTokens}, total=${totalInputTokens}`);

        if (totalInputTokens > TOKEN_LIMIT) {
          return res.status(400).json({
            success: false,
            message: `O arquivo é muito grande e excede o limite de ${TOKEN_LIMIT} tokens. (Estimativa: ${totalInputTokens} tokens)`,
            code: 'TOKEN_LIMIT_EXCEEDED'
          });
        }

        // Adicionar conteúdo do arquivo ao prompt
        const enhancedContent = `${conteudo || ''}\n\nConteúdo do arquivo "${req.file.originalname}":\n${fileContent}`;
        
        // Repasse todos os campos recebidos para a IA, incluindo o conteúdo do arquivo
        const response = await fetch('https://n8n.aiclausy.xyz/webhook/prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            ...req.body,
            conteudo: enhancedContent
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `API externa retornou status ${response.status}`);
        }
        
        const data = await response.json();
        const responseTimestamp = Date.now();
        
        // Calcular tokens usados (estimativa baseada no tamanho do conteúdo)
        const estimatedTokens = totalInputTokens + 100; // Estimativa conservadora
        
        // Atualizar uso de tokens no Redis
        await tokenUsageService.updateTokenUsage(user_id, estimatedTokens, req.body.company_id || null, requestTimestamp, responseTimestamp);
        
        // Adicionar informações de uso na resposta
        const responseWithUsage = {
          ...data,
          usage: {
            tokens_used: estimatedTokens,
            tokens_remaining: req.tokenUsage.limit - (req.tokenUsage.current + estimatedTokens),
            tokens_limit: req.tokenUsage.limit
          }
        };
        
        res.json(responseWithUsage);
      } catch (error) {
        console.error('Erro ao processar arquivo para laboratório:', error);
        res.status(500).json({ 
          error: 'Erro ao processar arquivo para laboratório',
          message: error.message 
        });
      }
    } else {
      // Processamento sem arquivo (como antes)
      const response = await fetch('https://n8n.aiclausy.xyz/webhook/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...req.body })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API externa retornou status ${response.status}`);
      }
      
      const data = await response.json();
      const responseTimestamp = Date.now();
      
      // Calcular tokens usados (estimativa baseada no tamanho do conteúdo)
      const estimatedTokens = Math.ceil((conteudo?.length || 0) / 4) + 100; // Estimativa conservadora
      
      // Atualizar uso de tokens no Redis
      await tokenUsageService.updateTokenUsage(user_id, estimatedTokens, req.body.company_id || null, requestTimestamp, responseTimestamp);
      
      // Adicionar informações de uso na resposta
      const responseWithUsage = {
        ...data,
        usage: {
          tokens_used: estimatedTokens,
          tokens_remaining: req.tokenUsage.limit - (req.tokenUsage.current + estimatedTokens),
          tokens_limit: req.tokenUsage.limit
        }
      };
      
      res.json(responseWithUsage);
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem para o laboratório:', error);
    res.status(500).json({ 
      error: 'Erro ao enviar mensagem para o laboratório',
      message: error.message 
    });
  }
});

// Salvar chat do laboratório no Redis
router.post('/lab-chats/save', async (req, res) => {
  try {
    const { user_id, chat_name, session_id } = req.body;
    if (!user_id || !chat_name || !session_id) {
      return res.status(400).json({ error: 'user_id, chat_name e session_id são obrigatórios' });
    }
    const key = `user:${user_id}:labchats`;
    const created_at = new Date().toISOString();
    // Buscar lista atual
    let chats = [];
    const existing = await redis.get(key);
    if (existing) {
      chats = JSON.parse(existing);
    }
    // Evitar duplicidade por session_id
    if (!chats.find(c => c.session_id === session_id)) {
      chats.push({ 
        chat_name, 
        session_id, 
        created_at,
        view: true // Flag para controlar visibilidade
      });
      await redis.set(key, JSON.stringify(chats));
    }
    res.json({ success: true, chats });
  } catch (error) {
    console.error('Erro ao salvar chat no Redis:', error);
    res.status(500).json({ error: 'Erro ao salvar chat no Redis', message: error.message });
  }
});

// Listar chats do laboratório do usuário no Redis (apenas os visíveis)
router.get('/lab-chats/list', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id é obrigatório' });
    }
    const key = `user:${user_id}:labchats`;
    const existing = await redis.get(key);
    let chats = [];
    if (existing) {
      chats = JSON.parse(existing);
      // Filtrar apenas chats com view: true
      chats = chats.filter(chat => chat.view !== false);
      
      // Ordenar por data de criação (mais recentes primeiro)
      chats.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    res.json({ success: true, chats });
  } catch (error) {
    console.error('Erro ao listar chats do Redis:', error);
    res.status(500).json({ error: 'Erro ao listar chats do Redis', message: error.message });
  }
});

// Rota para "soft delete" - marcar chat como não visível
router.post('/lab-chats/hide', async (req, res) => {
  try {
    const { user_id, session_id } = req.body;
    if (!user_id || !session_id) {
      return res.status(400).json({ error: 'user_id e session_id são obrigatórios' });
    }
    
    const key = `user:${user_id}:labchats`;
    const existing = await redis.get(key);
    
    if (existing) {
      let chats = JSON.parse(existing);
      const chatIndex = chats.findIndex(chat => chat.session_id === session_id);
      
      if (chatIndex !== -1) {
        chats[chatIndex].view = false; // Marcar como não visível
        await redis.set(key, JSON.stringify(chats));
        res.json({ success: true, message: 'Chat ocultado com sucesso' });
      } else {
        res.status(404).json({ error: 'Chat não encontrado' });
      }
    } else {
      res.status(404).json({ error: 'Nenhum chat encontrado' });
    }
  } catch (error) {
    console.error('Erro ao ocultar chat:', error);
    res.status(500).json({ error: 'Erro ao ocultar chat', message: error.message });
  }
});

// Rota para restaurar chat oculto
router.post('/lab-chats/restore', async (req, res) => {
  try {
    const { user_id, session_id } = req.body;
    if (!user_id || !session_id) {
      return res.status(400).json({ error: 'user_id e session_id são obrigatórios' });
    }
    
    const key = `user:${user_id}:labchats`;
    const existing = await redis.get(key);
    
    if (existing) {
      let chats = JSON.parse(existing);
      const chatIndex = chats.findIndex(chat => chat.session_id === session_id);
      
      if (chatIndex !== -1) {
        chats[chatIndex].view = true; // Marcar como visível
        await redis.set(key, JSON.stringify(chats));
        res.json({ success: true, message: 'Chat restaurado com sucesso' });
      } else {
        res.status(404).json({ error: 'Chat não encontrado' });
      }
    } else {
      res.status(404).json({ error: 'Nenhum chat encontrado' });
    }
  } catch (error) {
    console.error('Erro ao restaurar chat:', error);
    res.status(500).json({ error: 'Erro ao restaurar chat', message: error.message });
  }
});

// Rota para deletar um chat específico
router.delete('/lab-chats/delete', async (req, res) => {
  try {
    const { user_id, session_id } = req.body;
    if (!user_id || !session_id) {
      return res.status(400).json({ error: 'user_id e session_id são obrigatórios' });
    }
    
    const key = `user:${user_id}:labchats`;
    const existing = await redis.get(key);
    
    if (existing) {
      let chats = JSON.parse(existing);
      chats = chats.filter(chat => chat.session_id !== session_id);
      await redis.set(key, JSON.stringify(chats));
      res.json({ success: true, message: 'Chat removido com sucesso', chats });
    } else {
      res.json({ success: true, message: 'Nenhum chat encontrado' });
    }
  } catch (error) {
    console.error('Erro ao deletar chat:', error);
    res.status(500).json({ error: 'Erro ao deletar chat', message: error.message });
  }
});

// Rota para buscar todos os chats do usuário (incluindo sessões anteriores)
router.get('/lab-chats/all', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id é obrigatório' });
    }
    
    const key = `user:${user_id}:labchats`;
    const existing = await redis.get(key);
    let chats = [];
    
    if (existing) {
      chats = JSON.parse(existing);
      // Filtrar apenas chats com view: true
      chats = chats.filter(chat => chat.view !== false);
      
      // Ordenar por data de criação (mais recentes primeiro)
      chats.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Adicionar informação sobre sessão atual
      const currentSessionId = req.headers['x-current-session-id'];
      chats = chats.map(chat => ({
        ...chat,
        is_current_session: chat.session_id === currentSessionId
      }));
    }
    
    res.json({ success: true, chats });
  } catch (error) {
    console.error('Erro ao buscar todos os chats do Redis:', error);
    res.status(500).json({ error: 'Erro ao buscar todos os chats do Redis', message: error.message });
  }
});

module.exports = router;