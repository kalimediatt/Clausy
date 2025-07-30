const axios = require('axios');
const PLANS = require('../config/plans');

// Carregar a chave da API do ambiente ou usar valor fixo para desenvolvimento
const API_KEY = process.env.API_KEY || 'sk-3lvu8Ld1LvgmzT7KCHTombq1VSsluOJi4mSTHjvGwBuvm2t-S4kblgx-nUxm5fyqS12WdSIWRQ0jZXEpi4Z_49FDft-f';
const BASE_URL = "https://openapi.monica.im/v1";

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
    try {
      // Limite máximo aceito pela Monica IA para gpt-4o
      const MAX_TOKENS_GPT4O = 16384;
      let model = "gpt-4o";
      // Garante que maxTokens nunca ultrapasse o limite do modelo
      let safeMaxTokens = Math.min(Number(maxTokens) || 1024, MAX_TOKENS_GPT4O);
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
          }
        }
      );

      // Obter o plano do usuário
      let plan = PLANS.FREE_TRIAL;
      if (user) {
        try {
          const userPlan = await redis.get(`user:${user.user_id}:plan`);
          if (userPlan) {
            plan = JSON.parse(userPlan);
          }
        } catch (error) {
          console.error('Erro ao obter plano do usuário:', error);
        }
      }

      // Obter os headers de rate limit do nosso próprio rate limiter
      const rateLimitInfo = {
        limit: plan.rateLimit.toString(),
        remaining: response.headers['x-ratelimit-remaining'] || (plan.rateLimit - 1).toString(),
        reset: new Date(Date.now() + 60 * 60 * 1000).toLocaleString() // 1 hora a partir de agora
      };

      console.log('Rate Limit Info:', rateLimitInfo);

      return {
        success: true,
        content: response.data.choices[0].message.content,
        usage: response.data.usage || { total_tokens: Math.ceil(userMessage.length / 4) + safeMaxTokens },
        rateLimit: rateLimitInfo
      };
    } catch (error) {
      console.error('Erro ao conectar com Monica IA:', error);
      console.error('Request details:', {
        url: `${BASE_URL}/chat/completions`,
        model: model,
        messageLength: userMessage.length,
        maxTokens: safeMaxTokens,
        errorResponse: error.response?.data
      });
      
      return {
        success: false,
        message: `Erro ao conectar com a IA: ${error.message}`,
        error: error.response?.data || error.message
      };
    }
  }
};

module.exports = monicaAIService; 