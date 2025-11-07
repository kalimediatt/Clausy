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
const crypto = require('crypto');
const dbService = require('../services/db.service');

// Função para gerar UUID único (fallback caso não venha do frontend)
function generateUniqueChatId() {
  try {
    return crypto.randomUUID();
  } catch (error) {
    // Fallback para gerar UUID v4 manualmente
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

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
    
    // Obter informações do usuário do banco de dados
    const user = await dbService.executeQuery(
      'SELECT u.user_id, u.role, u.plan_id, p.max_tokens_per_hour FROM users u LEFT JOIN subscription_plans p ON u.plan_id = p.plan_id WHERE u.user_id = ?',
      [user_id]
    );
    
    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    const userData = user[0];
    
    // Verificar se é superadmin (sem limite)
    if (userData.role === 'superadmin') {
      req.tokenUsage = {
        current: 0,
        limit: Infinity
      };
      return next();
    }
    
    // Obter plano do usuário (Redis ou banco)
    let plan = PLANS.FREE_TRIAL;
    try {
      // Tentar obter do Redis primeiro
      const userPlan = await redis.get(`user:${user_id}:plan`);
      if (userPlan) {
        plan = JSON.parse(userPlan);
      } else {
        // Se não estiver no Redis, usar o plan_id do banco
        const planId = userData.plan_id;
        if (planId && PLANS[planId]) {
          plan = PLANS[planId];
        } else if (userData.max_tokens_per_hour) {
          // Usar limite do banco se disponível
          plan = {
            ...PLANS.FREE_TRIAL,
            tokenLimit: userData.max_tokens_per_hour
          };
        }
      }
      
      // Verificar limites temporários
      const tempLimits = await redis.get(`user:${user_id}:temp_limits`);
      if (tempLimits) {
        const limits = JSON.parse(tempLimits);
        if (limits.expiresAt > Date.now()) {
          plan = {
            ...plan,
            tokenLimit: limits.tokenLimit
          };
        }
      }
    } catch (error) {
      console.error('Erro ao obter plano do usuário (não crítico):', error.message);
      // Continua com plano padrão
    }
    
    // Obter uso atual de tokens do Redis
    const tokenKey = `user:${user_id}:tokens`;
    const currentUsage = parseInt(await redis.get(tokenKey) || '0', 10);
    const tokenLimit = Number(plan.tokenLimit) || PLANS.FREE_TRIAL.tokenLimit;
    
    // Verificar se excedeu o limite
    if (currentUsage >= tokenLimit) {
      return res.status(429).json({
        success: false,
        message: 'Limite de tokens excedido para seu plano. Tente novamente em uma hora.'
      });
    }
    
    // Adicionar informações de uso no request
    req.tokenUsage = {
      current: currentUsage,
      limit: tokenLimit === -1 ? Infinity : tokenLimit
    };
    
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
    const { user_id, chat_name, session_id, chat_unique_id } = req.body;
    
    // Log de debug para verificar os dados recebidos
    console.log('🔍 [DEBUG] Dados recebidos na rota /lab-chats/save:', {
      user_id,
      chat_name,
      session_id,
      chat_unique_id,
      chat_unique_id_type: typeof chat_unique_id,
      chat_unique_id_value: chat_unique_id
    });
    
    if (!user_id || !chat_name || !session_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id, chat_name e session_id são obrigatórios'
      });
    }
    
    // Salvar no Redis - chave baseada no nome do chat
    const chatKey = `lab_chat:${chat_name}`;
    
    // Verificar se já existe um chat com essa chave
    let finalChatUniqueId;
    let existingData = null;
    let shouldUpdate = false;
    
    try {
      existingData = await redis.get(chatKey);
      if (existingData) {
        try {
          const parsedExisting = JSON.parse(existingData);
          console.log('⚠️ [DEBUG] Já existe um chat com essa chave:', {
            chatKey,
            existing_chat_unique_id: parsedExisting.chat_unique_id,
            existing_user_id: parsedExisting.user_id,
            new_user_id: user_id
          });
          
          // Se já existe e tem chat_unique_id válido, preservá-lo
          if (parsedExisting.chat_unique_id && parsedExisting.chat_unique_id !== null && parsedExisting.chat_unique_id !== '') {
            console.log('ℹ️ [DEBUG] Preservando chat_unique_id existente:', parsedExisting.chat_unique_id);
            finalChatUniqueId = parsedExisting.chat_unique_id;
            shouldUpdate = true; // Vamos atualizar o chat existente
          } else {
            // Existe mas não tem chat_unique_id, vamos usar o novo ou gerar um
            if (chat_unique_id !== undefined && chat_unique_id !== null && chat_unique_id !== '') {
              finalChatUniqueId = chat_unique_id;
            } else {
              finalChatUniqueId = generateUniqueChatId();
              console.log('⚠️ [DEBUG] Chat existente sem chat_unique_id, gerando novo:', finalChatUniqueId);
            }
            shouldUpdate = true;
          }
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse do dado existente:', parseError);
          // Se der erro no parse, tratar como se não existisse
          existingData = null;
        }
      }
    } catch (redisGetError) {
      console.error('❌ Erro ao verificar dados existentes no Redis:', redisGetError);
      existingData = null;
    }
    
    // Se não existe, determinar o chat_unique_id a usar
    if (!existingData) {
      if (chat_unique_id !== undefined && chat_unique_id !== null && chat_unique_id !== '') {
        finalChatUniqueId = chat_unique_id;
        console.log('✅ [DEBUG] Usando chat_unique_id fornecido pelo frontend:', finalChatUniqueId);
      } else {
        // Gerar UUID se não foi fornecido
        finalChatUniqueId = generateUniqueChatId();
        console.log('⚠️ [DEBUG] chat_unique_id não foi fornecido, gerando novo UUID:', finalChatUniqueId);
      }
    }
    
    // Criar objeto com os dados a serem salvos
    const chatData = {
      user_id,
      chat_name,
      session_id,
      chat_unique_id: finalChatUniqueId, // ID único que nunca se repete
      created_at: existingData ? (JSON.parse(existingData).created_at || new Date().toISOString()) : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Log de debug antes de salvar no Redis
    console.log('💾 [DEBUG] Dados que serão salvos no Redis:', {
      chatKey,
      chatData,
      chat_unique_id_salvo: chatData.chat_unique_id,
      isUpdate: shouldUpdate,
      json_stringify: JSON.stringify(chatData)
    });
    
    try {
      // Salvar no Redis com tratamento de erro explícito
      const redisResult = await redis.setex(chatKey, 86400 * 7, JSON.stringify(chatData));
      console.log('💾 [DEBUG] Resultado do setex no Redis:', redisResult);
      
      // Verificar se foi salvo corretamente
      const savedData = await redis.get(chatKey);
      if (savedData) {
        const parsedSaved = JSON.parse(savedData);
        console.log('✅ [DEBUG] Dados salvos no Redis (verificação):', {
          chatKey,
          chat_unique_id_no_redis: parsedSaved.chat_unique_id,
          chat_unique_id_esperado: finalChatUniqueId,
          chat_unique_id_igual: parsedSaved.chat_unique_id === finalChatUniqueId,
          todos_os_dados: parsedSaved
        });
        
        if (parsedSaved.chat_unique_id !== finalChatUniqueId) {
          console.error('❌ [ERRO CRÍTICO] chat_unique_id não foi salvo corretamente!', {
            esperado: finalChatUniqueId,
            salvo: parsedSaved.chat_unique_id
          });
        }
      } else {
        console.error('❌ [ERRO CRÍTICO] Não foi possível recuperar os dados após salvar no Redis!');
      }
    } catch (redisError) {
      console.error('❌ [ERRO CRÍTICO] Erro ao salvar no Redis:', redisError);
      throw redisError;
    }
    
    // Garantir que o chatData tem o chat_unique_id antes de retornar
    const responseData = {
      success: true,
      message: 'Chat salvo com sucesso',
      chat: {
        ...chatData,
        chat_unique_id: finalChatUniqueId // Garantir que está presente
      }
    };
    
    console.log('📤 [DEBUG] Resposta que será enviada ao frontend:', {
      chat_unique_id_na_resposta: responseData.chat.chat_unique_id,
      todos_os_dados: responseData.chat
    });
    
    res.json(responseData);
  } catch (error) {
    console.error('❌ Erro ao salvar chat:', error);
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
    
    console.log(`🔍 [DEBUG] Buscando chats para user_id: ${user_id}, encontradas ${keys.length} chaves`);
    
    for (const key of keys) {
      const chatData = await redis.get(key);
      if (chatData) {
        try {
          const parsed = JSON.parse(chatData);
          
          // Log de debug para cada chat encontrado
          console.log(`📋 [DEBUG] Chat encontrado - Key: ${key}, chat_unique_id: ${parsed.chat_unique_id}, user_id: ${parsed.user_id}`);
          
          if (parsed.user_id === parseInt(user_id)) {
            // Garantir que chat_unique_id está presente (mesmo que seja null)
            const chatToAdd = {
              ...parsed,
              chat_unique_id: parsed.chat_unique_id !== undefined ? parsed.chat_unique_id : null
            };
            
            console.log(`✅ [DEBUG] Chat adicionado à lista:`, {
              chat_name: chatToAdd.chat_name,
              chat_unique_id: chatToAdd.chat_unique_id,
              session_id: chatToAdd.session_id
            });
            
            chats.push(chatToAdd);
          }
        } catch (parseError) {
          console.error(`❌ Erro ao fazer parse do chat da chave ${key}:`, parseError);
        }
      }
    }
    
    console.log(`📊 [DEBUG] Total de chats retornados: ${chats.length}`);
    chats.forEach((chat, index) => {
      console.log(`  [${index + 1}] ${chat.chat_name} - chat_unique_id: ${chat.chat_unique_id}`);
    });
    
    res.json({
      success: true,
      chats: chats
    });
  } catch (error) {
    console.error('❌ Erro ao listar chats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Rota para obter mensagens de um chat (busca do n8n)
router.post('/lab-chats/messages', async (req, res) => {
  try {
    const { chat_name, chat_unique_id } = req.body;
    
    if (!chat_name) {
      return res.status(400).json({
        success: false,
        message: 'chat_name é obrigatório'
      });
    }
    
    console.log('📥 [DEBUG] Buscando histórico do n8n:', {
      chat_name,
      chat_unique_id,
      url: 'https://n8n.aiclausy.xyz/webhook/3fd8a637-8e69-430b-ad61-11edf3846ae9'
    });
    
    // Buscar mensagens do n8n
    try {
      const requestBody = {
        chat_name,
        chat_unique_id
      };
      
      console.log('📤 [DEBUG] Body enviado ao n8n:', JSON.stringify(requestBody));
      
      const n8nResponse = await fetch('https://n8n.aiclausy.xyz/webhook/3fd8a637-8e69-430b-ad61-11edf3846ae9', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!n8nResponse.ok) {
        console.error('❌ Erro ao buscar histórico do n8n:', {
          status: n8nResponse.status,
          statusText: n8nResponse.statusText
        });
        
        // Retornar array vazio em vez de erro
        return res.json({
          success: true,
          messages: []
        });
      }
      
      const data = await n8nResponse.json();
      
      console.log('✅ Resposta do n8n recebida:', {
        chat_name,
        data: typeof data,
        isArray: Array.isArray(data),
        dataKeys: data ? Object.keys(data) : []
      });
      
      // Processar resposta do n8n
      let messages = [];
      
      if (Array.isArray(data)) {
        messages = data;
      } else if (data.messages && Array.isArray(data.messages)) {
        messages = data.messages;
      } else if (data.history && Array.isArray(data.history)) {
        messages = data.history;
      } else if (data.data && Array.isArray(data.data)) {
        messages = data.data;
      }
      
      console.log(`✅ Total de mensagens processadas: ${messages.length}`);
      
      res.json({
        success: true,
        messages: messages
      });
      
    } catch (fetchError) {
      console.error('❌ Erro ao buscar histórico do n8n:', {
        error: fetchError.message,
        chat_name,
        chat_unique_id
      });
      
      // Retornar array vazio em vez de erro (não quebrar o frontend)
      res.json({
        success: true,
        messages: []
      });
    }
  } catch (error) {
    console.error('❌ Erro geral ao buscar mensagens:', error);
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
    // Extrair variáveis do body para garantir que sejam enviadas explicitamente
    const { chat_name, session_id, chat_unique_id } = req.body;
    
    const response = await fetch('https://n8n.aiclausy.xyz/webhook/prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ...req.body,
        chat_name, // Garantir que chat_name está presente explicitamente
        session_id, // Garantir que session_id está presente explicitamente
        chat_unique_id, // Garantir que chat_unique_id está presente explicitamente
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
    
    // Garantir que o chat existe no Redis (apenas metadados/configuração, NÃO mensagens)
    // chat_name, session_id e chat_unique_id já foram extraídos acima
    if (chat_name && session_id) {
      try {
        const chatKey = `lab_chat:${chat_name}`;
        const chatExists = await redis.exists(chatKey);
        
        if (!chatExists) {
          // Criar registro básico do chat se não existir (apenas configuração)
          const chatData = {
            user_id: parseInt(user_id),
            chat_name,
            session_id,
            chat_unique_id: req.body.chat_unique_id || generateUniqueChatId(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          await redis.setex(chatKey, 86400 * 7, JSON.stringify(chatData));
          console.log('✅ Chat criado automaticamente no Redis (apenas configuração):', {
            chatKey,
            chat_name,
            user_id
          });
        } else {
          // Atualizar timestamp do chat (apenas configuração)
          try {
            const existingChat = await redis.get(chatKey);
            if (existingChat) {
              const chatData = JSON.parse(existingChat);
              chatData.updated_at = new Date().toISOString();
              await redis.setex(chatKey, 86400 * 7, JSON.stringify(chatData));
            }
          } catch (error) {
            console.error('Erro ao atualizar timestamp do chat (não crítico):', error.message);
          }
        }
        
      } catch (error) {
        // Não falhar a requisição se houver erro ao salvar configuração
        console.error('⚠️ Erro ao salvar configuração do chat no Redis (não crítico):', error);
      }
    }
    
    // Adicionar informações de uso na resposta
    const responseWithUsage = {
      ...cleanedData,
      usage: {
        tokens_used: estimatedTokens,
        tokens_remaining: req.tokenUsage.limit === Infinity ? Infinity : req.tokenUsage.limit - (req.tokenUsage.current + estimatedTokens),
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