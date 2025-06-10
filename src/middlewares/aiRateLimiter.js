const rateLimit = require('express-rate-limit');
const redis = require('../config/redis.config');
const PLANS = require('../config/plans');

// Função para obter o plano do usuário
async function getUserPlan(req) {
  if (!req.user) {
    return PLANS.FREE_TRIAL;
  }

  try {
    // Verificar se existem limites temporários
    const tempLimits = await redis.get(`user:${req.user.user_id}:temp_limits`);
    if (tempLimits) {
      const limits = JSON.parse(tempLimits);
      // Verificar se os limites temporários ainda são válidos
      if (limits.expiresAt > Date.now()) {
        return {
          ...PLANS.PRO, // Usar PRO como base
          rateLimit: limits.rateLimit,
          tokenLimit: limits.tokenLimit
        };
      }
    }

    // Se não houver limites temporários, usar o plano normal
    const userPlan = await redis.get(`user:${req.user.user_id}:plan`);
    return userPlan ? JSON.parse(userPlan) : PLANS.FREE_TRIAL;
  } catch (error) {
    console.error('Erro ao obter plano do usuário:', error);
    // Em caso de erro, retornar um plano mais permissivo
    return {
      ...PLANS.PRO,
      rateLimit: 1000, // Limite alto em caso de erro
      tokenLimit: 1000000
    };
  }
}

// Função para verificar se é superadmin
const isSuperAdmin = (req) => {
  return req.user?.role === 'superadmin';
};

// Rate limiter específico para a API da IA
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: async (req) => {
    try {
      if (isSuperAdmin(req)) {
        return 1000000; // Ilimitado para superadmin
      }

      const plan = await getUserPlan(req);
      return plan.rateLimit || 100; // Fallback para 100 requisições/hora
    } catch (error) {
      console.error('Erro ao determinar limite:', error);
      return 100; // Fallback em caso de erro
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Limite de requisições à IA excedido para seu plano. Tente novamente em uma hora.'
  },
  skip: (req) => {
    try {
      return isSuperAdmin(req);
    } catch (error) {
      console.error('Erro ao verificar superadmin:', error);
      return false;
    }
  },
  keyGenerator: (req) => {
    try {
      return req.user ? `ai:${req.user.user_id}` : `ai:${req.ip}`;
    } catch (error) {
      console.error('Erro ao gerar chave:', error);
      return `ai:${req.ip}`;
    }
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Limite de requisições à IA excedido para seu plano. Tente novamente em uma hora.'
    });
  },
  store: {
    // Implementação personalizada do store usando Redis com tratamento de erros
    increment: async (key) => {
      try {
        const multi = redis.multi();
        multi.incr(key);
        multi.expire(key, 3600); // Expira em 1 hora
        const results = await multi.exec();
        if (!results || !results[0] || !results[0][1]) {
          throw new Error('Invalid Redis response');
        }
        return {
          totalHits: results[0][1],
          resetTime: new Date(Date.now() + 3600000)
        };
      } catch (error) {
        console.error('Erro ao incrementar contador:', error);
        return {
          totalHits: 1,
          resetTime: new Date(Date.now() + 3600000)
        };
      }
    },
    decrement: async (key) => {
      try {
        await redis.decr(key);
      } catch (error) {
        console.error('Erro ao decrementar contador:', error);
      }
    },
    resetKey: async (key) => {
      try {
        await redis.del(key);
      } catch (error) {
        console.error('Erro ao resetar contador:', error);
      }
    }
  }
});

module.exports = aiRateLimiter; 