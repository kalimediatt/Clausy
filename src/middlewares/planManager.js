const PLANS = require('../config/plans');
const redis = require('../config/redis.config');

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

// Middleware para adicionar o plano do usuário ao request
const planMiddleware = async (req, res, next) => {
  try {
    req.userPlan = await getUserPlan(req);
    next();
  } catch (error) {
    console.error('Erro no middleware de plano:', error);
    req.userPlan = PLANS.FREE_TRIAL;
    next();
  }
};

// Hierarquia dos planos para verificação de acesso
const planHierarchy = {
  [PLANS.FREE_TRIAL.name]: 1,
  [PLANS.STANDARD.name]: 2,
  [PLANS.PRO.name]: 3
};

// Função para verificar acesso a recursos baseado no plano
const checkPlanAccess = (requiredPlan) => {
  return async (req, res, next) => {
    try {
      const userPlan = await getUserPlan(req);
      const userPlanLevel = planHierarchy[userPlan.name];
      const requiredPlanLevel = planHierarchy[requiredPlan.name];

      if (userPlanLevel >= requiredPlanLevel) {
        next();
      } else {
        res.status(403).json({
          success: false,
          message: `Acesso negado. Plano ${requiredPlan.name} ou superior necessário.`
        });
      }
    } catch (error) {
      console.error('Erro ao verificar acesso ao plano:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar acesso ao plano'
      });
    }
  };
};

module.exports = {
  planMiddleware,
  checkPlanAccess,
  getUserPlan
}; 