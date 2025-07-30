const redis = require('../config/redis.config');
const PLANS = require('../config/plans');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt.config');

// Função para obter o plano do usuário
async function getUserPlan(req) {
  if (!req.user) {
    return PLANS.FREE_TRIAL;
  }

  try {
    const userPlan = await redis.get(`user:${req.user.user_id}:plan`);
    return userPlan ? JSON.parse(userPlan) : PLANS.FREE_TRIAL;
  } catch (error) {
    console.error('Erro ao obter plano do usuário:', error);
    return PLANS.FREE_TRIAL;
  }
}

// Função para verificar se é superadmin
const isSuperAdmin = (req) => {
  if (req.user?.role === 'superadmin') {
    return true;
  }
  
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded.role === 'superadmin';
    } catch (err) {
      return false;
    }
  }
  return false;
};

// Função para obter o limite baseado no plano
const getPlanLimit = async (req) => {
  if (isSuperAdmin(req)) {
    return -1; // Ilimitado para superadmin
  }

  const plan = await getUserPlan(req);
  return plan.rateLimit; // Retorna o rateLimit definido no plano
};

// Rate limiter para usuários
const userLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: async (req) => {
    const limit = await getPlanLimit(req);
    return limit === -1 ? 1000000 : limit; // Se for ilimitado, usa um número muito alto
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Limite de requisições excedido para seu plano'
  },
  skip: (req) => {
    return isSuperAdmin(req) || getPlanLimit(req).then(limit => limit === -1);
  }
});

// Rate limiter para IP
const ipLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: async (req) => {
    const planLimit = await getPlanLimit(req);
    if (planLimit === -1) return 2000000; // Se for ilimitado, usa um número muito alto
    return planLimit * 2; // Limite de IP é o dobro do limite do plano
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Limite de requisições excedido para seu IP'
  },
  skip: (req) => {
    return isSuperAdmin(req) || getPlanLimit(req).then(limit => limit === -1);
  }
});

module.exports = {
  rateLimiter: {
    ipLimiter: (req, res, next) => next(),
    userLimiter: (req, res, next) => next()
  }
}; 