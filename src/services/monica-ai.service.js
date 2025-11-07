const axios = require('axios');
const PLANS = require('../config/plans');
const redis = require('../config/redis.config');

// Carregar a chave da API do ambiente ou usar valor fixo para desenvolvimento
const API_KEY = process.env.API_KEY || 'sk-3lvu8Ld1LvgmzT7KCHTombq1VSsluOJi4mSTHjvGwBuvm2t-S4kblgx-nUxm5fyqS12WdSIWRQ0jZXEpi4Z_49FDft-f';
const BASE_URL = "https://openapi.monica.im/v1";

// Timeout para requisições (5 minutos)
const REQUEST_TIMEOUT = 300000;

// Serviço para interação com a Monica IA
const monicaAIService = {
  /**
   * Envia uma consulta para a API da Monica IA
   * @param {string} userMessage - Mensagem enviada pelo usuário
   * @param {number} maxTokens - Número máximo de tokens para resposta
   * @param {Object} user - Objeto do usuário para verificar o plano
   * @returns {Promise} - Promessa com a resposta da API
   */
  async sendQuery(userMessage, maxTokens = 1024, user = null) {
    // Validar API_KEY antes de fazer requisição
    if (!API_KEY || API_KEY === '') {
      console.error('ERRO CRÍTICO: API_KEY não configurada');
      return {
        success: false,
        message: 'API_KEY não configurada. Configure a variável de ambiente API_KEY.',
        error: 'API_KEY_MISSING'
      };
    }

    // Validar parâmetros
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === '') {
      return {
        success: false,
        message: 'Mensagem inválida ou vazia',
        error: 'INVALID_MESSAGE'
      };
    }

    // Limite máximo aceito pela Monica IA para gpt-4o
    const MAX_TOKENS_GPT4O = 16384;
    const model = "gpt-4o";
    // Garante que maxTokens nunca ultrapasse o limite do modelo
    const safeMaxTokens = Math.min(Number(maxTokens) || 1024, MAX_TOKENS_GPT4O);

    try {
      // Fazer requisição com timeout
      const response = await axios.post(
        `${BASE_URL}/chat/completions`,
        {
          model: model,
          messages: [
            { role: "user", content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: safeMaxTokens
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          timeout: REQUEST_TIMEOUT,
          validateStatus: (status) => status < 500 // Aceitar status < 500 para tratamento específico
        }
      );

      // Tratar erros de resposta da API
      if (response.status === 401) {
        console.error('ERRO: API_KEY inválida ou expirada');
        return {
          success: false,
          message: 'Erro de autenticação com a API da IA. Verifique a API_KEY.',
          error: 'AUTHENTICATION_ERROR',
          statusCode: 401
        };
      }

      if (response.status === 429) {
        console.error('ERRO: Rate limit excedido na API da Monica AI');
        return {
          success: false,
          message: 'Limite de requisições excedido na API da IA. Tente novamente mais tarde.',
          error: 'RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          retryAfter: response.headers['retry-after'] || 60
        };
      }

      if (response.status !== 200) {
        console.error('ERRO: Resposta não esperada da API:', response.status, response.data);
        return {
          success: false,
          message: `Erro na API da IA: Status ${response.status}`,
          error: response.data || 'UNKNOWN_ERROR',
          statusCode: response.status
        };
      }

      // Validar resposta
      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        console.error('ERRO: Resposta da API inválida:', response.data);
        return {
          success: false,
          message: 'Resposta inválida da API da IA',
          error: 'INVALID_RESPONSE'
        };
      }

      // Obter o plano do usuário
      let plan = PLANS.FREE_TRIAL;
      if (user && user.user_id) {
        try {
          const userPlan = await redis.get(`user:${user.user_id}:plan`);
          if (userPlan) {
            plan = JSON.parse(userPlan);
          }
        } catch (error) {
          console.error('Erro ao obter plano do usuário (não crítico):', error.message);
          // Não é crítico, continua com plano padrão
        }
      }

      // Obter os headers de rate limit do nosso próprio rate limiter
      const rateLimitInfo = {
        limit: plan.rateLimit.toString(),
        remaining: response.headers['x-ratelimit-remaining'] || (plan.rateLimit - 1).toString(),
        reset: new Date(Date.now() + 60 * 60 * 1000).toLocaleString() // 1 hora a partir de agora
      };

      // Log de sucesso (apenas em desenvolvimento)
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Requisição à API da IA bem-sucedida');
        console.log('Rate Limit Info:', rateLimitInfo);
      }

      return {
        success: true,
        content: response.data.choices[0].message.content,
        usage: response.data.usage || { 
          total_tokens: Math.ceil(userMessage.length / 4) + safeMaxTokens,
          prompt_tokens: Math.ceil(userMessage.length / 4),
          completion_tokens: safeMaxTokens
        },
        rateLimit: rateLimitInfo
      };
    } catch (error) {
      // Tratamento específico de erros
      let errorMessage = 'Erro ao conectar com a IA';
      let errorCode = 'UNKNOWN_ERROR';

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'Timeout ao conectar com a API da IA. A requisição demorou muito para responder.';
        errorCode = 'TIMEOUT_ERROR';
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        errorMessage = 'Não foi possível conectar com a API da IA. Verifique sua conexão com a internet.';
        errorCode = 'CONNECTION_ERROR';
      } else if (error.response) {
        // Erro de resposta da API
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          errorMessage = 'Erro de autenticação com a API da IA. Verifique a API_KEY.';
          errorCode = 'AUTHENTICATION_ERROR';
        } else if (status === 429) {
          errorMessage = 'Limite de requisições excedido na API da IA. Tente novamente mais tarde.';
          errorCode = 'RATE_LIMIT_EXCEEDED';
        } else if (status === 500) {
          errorMessage = 'Erro interno na API da IA. Tente novamente mais tarde.';
          errorCode = 'API_SERVER_ERROR';
        } else {
          errorMessage = `Erro na API da IA (Status ${status}): ${data?.error?.message || error.message}`;
          errorCode = `API_ERROR_${status}`;
        }
      }

      console.error('❌ Erro ao conectar com Monica IA:', {
        errorCode,
        message: errorMessage,
        originalError: error.message,
        url: `${BASE_URL}/chat/completions`,
        model: model,
        messageLength: userMessage ? userMessage.length : 0,
        maxTokens: safeMaxTokens,
        statusCode: error.response?.status,
        errorResponse: error.response?.data
      });
      
      return {
        success: false,
        message: errorMessage,
        error: errorCode,
        details: error.response?.data || error.message,
        statusCode: error.response?.status
      };
    }
  }
};

module.exports = monicaAIService; 