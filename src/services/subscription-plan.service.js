const db = require('./db.service');

// Obter todos os planos de assinatura
async function getAllPlans() {
  const query = 'SELECT * FROM subscription_plans';
  return await db.executeQuery(query);
}

// Obter plano por ID
async function getPlanById(planId) {
  const query = 'SELECT * FROM subscription_plans WHERE plan_id = ?';
  const results = await db.executeQuery(query, [planId]);
  return results.length ? results[0] : null;
}

// Obter planos com contagem de usuários
async function getPlansWithUserCount() {
  const query = `
    SELECT p.*, COUNT(u.user_id) as user_count
    FROM subscription_plans p
    LEFT JOIN users u ON p.plan_id = u.plan_id
    GROUP BY p.plan_id
  `;
  return await db.executeQuery(query);
}

// Atualizar plano
async function updatePlan(planId, updates) {
  const allowedFields = [
    'name', 'max_queries_per_hour', 'max_tokens_per_hour', 
    'history_retention_hours', 'price', 'color', 'description'
  ];
  
  const setValues = [];
  const params = [];
  
  // Construir a parte SET da query
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      setValues.push(`${field} = ?`);
      params.push(updates[field]);
    }
  });
  
  // Se não houver nada para atualizar, retornar
  if (setValues.length === 0) {
    return { success: false, error: 'Nenhum campo válido para atualizar' };
  }
  
  // Adicionar o planId para a cláusula WHERE
  params.push(planId);
  
  const query = `UPDATE subscription_plans SET ${setValues.join(', ')} WHERE plan_id = ?`;
  
  try {
    const result = await db.executeQuery(query, params);
    return { success: result.affectedRows > 0 };
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return { success: false, error: error.message };
  }
}

// Converter os planos para o formato utilizado pelo frontend
function formatPlansForFrontend(plans) {
  const formattedPlans = {};
  
  plans.forEach(plan => {
    formattedPlans[plan.plan_id] = {
      name: plan.name,
      maxQueriesPerHour: plan.max_queries_per_hour === -1 ? Infinity : plan.max_queries_per_hour,
      maxTokensPerHour: plan.max_tokens_per_hour === -1 ? Infinity : plan.max_tokens_per_hour,
      historyRetention: plan.history_retention_hours === -1 ? Infinity : plan.history_retention_hours,
      price: plan.price.toFixed(2),
      color: plan.color,
      features: plan.description ? plan.description.split('\n') : []
    };
  });
  
  return formattedPlans;
}

module.exports = {
  getAllPlans,
  getPlanById,
  getPlansWithUserCount,
  updatePlan,
  formatPlansForFrontend
}; 