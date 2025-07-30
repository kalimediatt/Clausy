const db = require('./db.service');

// Obter todos os logs de autenticação
async function getAllLogs(limit = 100) {
  const query = `
    SELECT * FROM auth_logs
    ORDER BY timestamp DESC
    LIMIT ?
  `;
  return await db.executeQuery(query, [limit]);
}

// Adicionar log de autenticação
async function addLog(logData) {
  const { username, ip_address, success, user_agent, additional_info } = logData;
  
  const query = `
    INSERT INTO auth_logs (username, ip_address, success, user_agent, additional_info)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  try {
    const result = await db.executeQuery(query, [
      username, ip_address, success ? 1 : 0, user_agent, additional_info || null
    ]);
    return { success: true, id: result.insertId };
  } catch (error) {
    console.error('Erro ao registrar log:', error);
    return { success: false, error: error.message };
  }
}

// Obter o endereço IP do cliente
async function getClientIP() {
  // Esta função é um placeholder. No ambiente de produção, use um método mais robusto
  // para obter o IP, considerando proxies e cabeçalhos como 'x-forwarded-for'.
  return '127.0.0.1'; // IP de exemplo
}

// Limpar logs antigos (manter apenas os últimos X dias)
async function cleanOldLogs(daysToKeep = 30) {
  const query = `
    DELETE FROM auth_logs
    WHERE timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)
  `;
  
  try {
    const result = await db.executeQuery(query, [daysToKeep]);
    return { success: true, deletedCount: result.affectedRows };
  } catch (error) {
    console.error('Erro ao limpar logs antigos:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getAllLogs,
  addLog,
  getClientIP,
  cleanOldLogs
}; 