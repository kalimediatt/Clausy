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
    return PLANS.FREE_TRIAL;
  }
}

// Função para verificar se é superadmin
const isSuperAdmin = (req) => {
  return req.user?.role === 'superadmin';
};

// Middleware para controlar limite de tokens
const tokenLimiter = async (req, res, next) => {
  if (isSuperAdmin(req)) {
    req.tokenUsage = {
      current: 0,
      limit: Infinity
    };
    return next();
  }

  try {
    const plan = await getUserPlan(req);
    const userId = req.user.user_id;
    const tokenKey = `user:${userId}:tokens`;
    
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

// Função para atualizar o uso de tokens
const updateTokenUsage = async (userId, tokens) => {
  try {
    const key = `user:${userId}:tokens`;
    const multi = redis.multi();

    // Incrementar tokens usados
    multi.incrby(key, tokens);
    
    // Definir expiração de 1 hora se não existir
    multi.expire(key, 3600);

    await multi.exec();
  } catch (error) {
    console.error('Erro ao atualizar uso de tokens:', error);
  }
};

module.exports = {
  tokenLimiter,
  updateTokenUsage
}; 