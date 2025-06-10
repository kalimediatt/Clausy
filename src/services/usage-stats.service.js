const db = require('./db.service');

// Obter estatísticas de uso de um usuário
async function getUserStats(userId) {
  const query = 'SELECT * FROM usage_stats WHERE user_id = ?';
  const results = await db.executeQuery(query, [userId]);
  return results.length ? results[0] : null;
}

// Inicializar estatísticas para um novo usuário
async function initializeUserStats(userId) {
  const query = `
    INSERT INTO usage_stats (user_id, queries_this_hour, tokens_this_hour)
    VALUES (?, 0, 0)
    ON DUPLICATE KEY UPDATE user_id = user_id
  `;
  
  try {
    await db.executeQuery(query, [userId]);
    return { success: true };
  } catch (error) {
    console.error('Erro ao inicializar estatísticas:', error);
    return { success: false, error: error.message };
  }
}

// Atualizar estatísticas de uso de um usuário
async function updateUserStats(userId, updates) {
  const { queries_delta = 0, tokens_delta = 0 } = updates;
  
  const query = `
    UPDATE usage_stats
    SET 
      queries_this_hour = queries_this_hour + ?,
      tokens_this_hour = tokens_this_hour + ?,
      last_query_timestamp = NOW()
    WHERE user_id = ?
  `;
  
  try {
    const result = await db.executeQuery(query, [queries_delta, tokens_delta, userId]);
    return { success: result.affectedRows > 0 };
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
    return { success: false, error: error.message };
  }
}

// Registrar uma consulta no histórico
async function addToQueryHistory(userId, estimatedTokens) {
  const query = `
    INSERT INTO query_history (user_id, estimated_tokens)
    VALUES (?, ?)
  `;
  
  try {
    const result = await db.executeQuery(query, [userId, estimatedTokens]);
    return { success: true, id: result.insertId };
  } catch (error) {
    console.error('Erro ao registrar consulta:', error);
    return { success: false, error: error.message };
  }
}

// Obter histórico de consultas de um usuário
async function getUserQueryHistory(userId, limit = 100) {
  const query = `
    SELECT * FROM query_history
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `;
  
  return await db.executeQuery(query, [userId, limit]);
}

// Limpar histórico antigo (baseado na política de retenção do plano)
async function cleanOldHistory(userId, retentionHours) {
  if (retentionHours === 0) {
    // Se a retenção for zero, limpar todo o histórico
    const query = 'DELETE FROM query_history WHERE user_id = ?';
    await db.executeQuery(query, [userId]);
  } else if (retentionHours < 2147483647) { // Se não for "infinito"
    const query = `
      DELETE FROM query_history
      WHERE user_id = ? AND timestamp < DATE_SUB(NOW(), INTERVAL ? HOUR)
    `;
    await db.executeQuery(query, [userId, retentionHours]);
  }
  
  return { success: true };
}

// Resetar contadores por hora
async function resetHourlyCounters(userId) {
  const query = `
    UPDATE usage_stats
    SET 
      queries_this_hour = 0,
      tokens_this_hour = 0,
      last_reset_timestamp = NOW()
    WHERE user_id = ?
  `;
  
  try {
    await db.executeQuery(query, [userId]);
    return { success: true };
  } catch (error) {
    console.error('Erro ao resetar contadores:', error);
    return { success: false, error: error.message };
  }
}

// Configurar um agendamento para resetar contadores a cada hora
function scheduleHourlyReset() {
  // Em um ambiente de produção, isso seria feito com um scheduler como node-cron
  // Aqui vamos simplesmente configurar um intervalo
  setInterval(async () => {
    try {
      // Resetar todos os contadores de hora em hora
      const query = `
        UPDATE usage_stats
        SET 
          queries_this_hour = 0,
          tokens_this_hour = 0,
          last_reset_timestamp = NOW()
      `;
      
      await db.executeQuery(query);
      console.log('Contadores de uso resetados com sucesso.');
    } catch (error) {
      console.error('Erro ao resetar contadores de uso:', error);
    }
  }, 60 * 60 * 1000); // 1 hora em milissegundos
}

module.exports = {
  getUserStats,
  initializeUserStats,
  updateUserStats,
  addToQueryHistory,
  getUserQueryHistory,
  cleanOldHistory,
  resetHourlyCounters,
  scheduleHourlyReset
}; 