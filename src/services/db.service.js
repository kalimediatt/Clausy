// Serviço de conexão ao banco de dados MySQL
const db = require('../config/db');

// Função para executar queries
async function executeQuery(sql, params = []) {
  try {
    return await db.executeQuery(sql, params);
  } catch (error) {
    console.error('Erro ao executar query:', error);
    throw error;
  }
}

// Verificar conexão com o banco
async function testConnection() {
  return await db.testConnection();
}

// Exportar funções
module.exports = {
  executeQuery,
  testConnection,
  getConnection: db.getConnection,
  closePool: db.closePool
}; 