const express = require('express');
const router = express.Router();
const pool = require('../config/postgres');
const fetch = require('node-fetch');
const redis = require('../config/redis.config');
const tokenUsageService = require('../services/tokenUsage.service');
const { cleanAIResponse } = require('../utils/messageCleaner');
const fileProcessor = require('../services/fileProcessor.service');
const PLANS = require('../config/plans');
const multer = require('multer');
const path = require('path');

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/plain',
      'text/csv',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'), false);
    }
  }
});

// Middleware para validar arquivo
const validateFile = (req, res, next) => {
  if (!req.file) {
    return next();
  }
  
  const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
  const fileExt = path.extname(req.file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(fileExt)) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de arquivo não suportado. Use: PDF, DOC, DOCX, TXT'
    });
  }
  
  next();
};

// Middleware para verificar limite de tokens
const checkTokenLimit = async (req, res, next) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id é obrigatório'
      });
    }
    
    // Buscar uso atual de tokens do usuário
    const tokenUsage = await tokenUsageService.getTokenUsage(user_id);
    req.tokenUsage = tokenUsage;
    
    next();
  } catch (error) {
    console.error('Erro ao verificar limite de tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Rota para obter histórico de chats
router.post('/lab-chats/history', async (req, res) => {
  try {
    const { chat_name } = req.body;
    
    if (!chat_name) {
      return res.status(400).json({
        success: false,
        message: 'chat_name é obrigatório'
      });
    }
    
    // Buscar histórico do Redis
    const historyKey = `lab_chat:${chat_name}`;
    const history = await redis.get(historyKey);
    
    if (history) {
      const parsedHistory = JSON.parse(history);
      res.json(parsedHistory);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Rota para salvar chat
router.post('/lab-chats/save', async (req, res) => {
  try {
    const { user_id, chat_name, session_id } = req.body;
    
    if (!user_id || !chat_name || !session_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id, chat_name e session_id são obrigatórios'
      });
    }
    
    // Salvar no Redis
    const chatKey = `lab_chat:${chat_name}`;
    const chatData = {
      user_id,
      chat_name,
      session_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await redis.setex(chatKey, 86400 * 7, JSON.stringify(chatData)); // 7 dias
    
    res.json({
      success: true,
      message: 'Chat salvo com sucesso',
      chat: chatData
    });
  } catch (error) {
    console.error('Erro ao salvar chat:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Rota para ocultar chat
router.post('/lab-chats/hide', async (req, res) => {
  try {
    const { user_id, session_id } = req.body;
    
    if (!user_id || !session_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id e session_id são obrigatórios'
      });
    }
    
    // Remover do Redis
    const pattern = `lab_chat:*`;
    const keys = await redis.keys(pattern);
    
    for (const key of keys) {
      const chatData = await redis.get(key);
      if (chatData) {
        const parsed = JSON.parse(chatData);
        if (parsed.user_id === parseInt(user_id) && parsed.session_id === session_id) {
          await redis.del(key);
          break;
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Chat ocultado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao ocultar chat:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Rota para listar todos os chats
router.get('/lab-chats/all', async (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id é obrigatório'
      });
    }
    
    // Buscar todos os chats do usuário
    const pattern = `lab_chat:*`;
    const keys = await redis.keys(pattern);
    const chats = [];
    
    for (const key of keys) {
      const chatData = await redis.get(key);
      if (chatData) {
        const parsed = JSON.parse(chatData);
        if (parsed.user_id === parseInt(user_id)) {
          chats.push(parsed);
        }
      }
    }
    
    res.json({
      success: true,
      chats: chats
    });
  } catch (error) {
    console.error('Erro ao listar chats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Rota para obter mensagens de um chat
router.post('/lab-chats/messages', async (req, res) => {
  try {
    const { chat_name } = req.body;
    
    if (!chat_name) {
      return res.status(400).json({
        success: false,
        message: 'chat_name é obrigatório'
      });
    }
    
    // Buscar mensagens do Redis
    const messagesKey = `lab_messages:${chat_name}`;
    const messages = await redis.get(messagesKey);
    
    if (messages) {
      const parsedMessages = JSON.parse(messages);
      res.json(parsedMessages);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Proxy route para enviar mensagens para o laboratório (PROCESSAMENTO LOCAL)
router.post('/lab-chats/send', upload.single('file'), validateFile, checkTokenLimit, async (req, res) => {
  try {
    const { user_id, conteudo } = req.body;
    const requestTimestamp = Date.now();
    
    let processedContext = null;
    let userPrompt = conteudo || '';
    
    // Processar arquivo localmente se existir
    if (req.file) {
      try {
        console.log('Processando arquivo localmente:', req.file.originalname);
        
        // Verificar se o arquivo pode ser processado
        if (!fileProcessor.canProcessFile(req.file.originalname)) {
          throw new Error(`Tipo de arquivo não suportado: ${req.file.originalname}`);
        }
        
        // Processar arquivo e criar contexto
        const fileContext = await fileProcessor.processFileForContext(
          req.file.buffer, 
          req.file.originalname
        );
        
        // Criar prompt contextual
        userPrompt = fileProcessor.createContextualPrompt(conteudo, fileContext);
        
        // Estimar tokens do contexto
        const contextTokens = fileProcessor.estimateContextTokens(fileContext);
        
        console.log('Contexto criado:', {
          fileName: fileContext.fileName,
          documentType: fileContext.documentType,
          summaryLength: fileContext.summary.length,
          keyPointsCount: fileContext.keyPoints.length,
          estimatedTokens: contextTokens
        });
        
        processedContext = fileContext;
        
      } catch (error) {
        console.error('Erro ao processar arquivo localmente:', error);
        return res.status(400).json({
          success: false,
          message: `Erro ao processar arquivo: ${error.message}`
        });
      }
    }
    
    // Enviar prompt contextual para a API externa (sem conteúdo do arquivo)
    const response = await fetch('https://n8n.aiclausy.xyz/webhook/prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ...req.body,
        conteudo: userPrompt, // Prompt contextual em vez do conteúdo do arquivo
        fileContext: processedContext ? {
          fileName: processedContext.fileName,
          documentType: processedContext.documentType,
          summary: processedContext.summary,
          keyPoints: processedContext.keyPoints
        } : null
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API externa retornou status ${response.status}`);
    }
    
    const data = await response.json();
    const responseTimestamp = Date.now();
    
    // Calcular tokens usados (baseado no contexto processado)
    const promptTokens = Math.ceil(userPrompt.length / 4);
    const estimatedTokens = promptTokens + 100; // Estimativa conservadora
    
    // Atualizar uso de tokens no Redis
    await tokenUsageService.updateTokenUsage(user_id, estimatedTokens, req.body.company_id || null, requestTimestamp, responseTimestamp);
    
    // Limpar a resposta da IA se contiver conteúdo de arquivo
    let cleanedData = { ...data };
    if (data.message && typeof data.message === 'string') {
      cleanedData.message = cleanAIResponse(data.message);
    }
    
    // Adicionar informações de uso na resposta
    const responseWithUsage = {
      ...cleanedData,
      usage: {
        tokens_used: estimatedTokens,
        tokens_remaining: req.tokenUsage.limit - (req.tokenUsage.current + estimatedTokens),
        tokens_limit: req.tokenUsage.limit,
        fileProcessed: !!processedContext,
        contextTokens: processedContext ? fileProcessor.estimateContextTokens(processedContext) : 0
      }
    };
    
    res.json(responseWithUsage);
    
  } catch (error) {
    console.error('Erro ao enviar mensagem para o laboratório:', error);
    res.status(500).json({ 
      error: 'Erro ao enviar mensagem para o laboratório',
      message: error.message 
    });
  }
});

module.exports = router;