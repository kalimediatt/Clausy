const redis = require('../config/redis.config');
const dbService = require('./db.service');

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

    // Atualizar estatísticas no banco de dados
    await dbService.executeQuery(
      `UPDATE usage_stats 
       SET tokens_this_hour = tokens_this_hour + ?,
           last_query_timestamp = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [tokens, userId]
    );

    return true;
  } catch (error) {
    console.error('Erro ao atualizar uso de tokens:', error);
    return false;
  }
};

// Função para obter estatísticas de uso
const getUsageStats = async (userId) => {
  try {
    // Obter estatísticas do Redis
    const tokensUsed = await redis.get(`user:${userId}:tokens`);
    const currentTokens = tokensUsed ? parseInt(tokensUsed) : 0;

    // Obter estatísticas do banco de dados
    const [stats] = await dbService.executeQuery(
      `SELECT * FROM usage_stats WHERE user_id = ?`,
      [userId]
    );

    return {
      tokens_this_hour: currentTokens,
      last_query_timestamp: stats?.last_query_timestamp,
      last_reset_timestamp: stats?.last_reset_timestamp
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas de uso:', error);
    return null;
  }
};

// Função para resetar contadores
const resetCounters = async (userId) => {
  try {
    const multi = redis.multi();

    // Resetar tokens
    multi.del(`user:${userId}:tokens`);

    await multi.exec();

    // Resetar no banco de dados
    await dbService.executeQuery(
      `UPDATE usage_stats 
       SET tokens_this_hour = 0,
           last_reset_timestamp = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [userId]
    );

    return true;
  } catch (error) {
    console.error('Erro ao resetar contadores:', error);
    return false;
  }
};

module.exports = {
  updateTokenUsage,
  getUsageStats,
  resetCounters
}; 