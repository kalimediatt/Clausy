const redis = require('../config/redis.config');
const dbService = require('./db.service');

// Função para armazenar histórico permanente de tokens
const storePermanentTokenHistory = async (userId, companyId, tokens, requestTimestamp = Date.now(), responseTimestamp = Date.now()) => {
  try {
    console.log('DEBUG: storePermanentTokenHistory - Iniciando armazenamento', {
      userId,
      companyId,
      tokens,
      requestTimestamp,
      responseTimestamp
    });

    const key = `permanent:user:${userId}:tokens`;
    
    // Converter timestamps para o fuso horário local (Brasil/São Paulo)
    const requestDate = new Date(requestTimestamp);
    const responseDate = new Date(responseTimestamp);
    
    // Ajustar para o fuso horário local (UTC-3)
    requestDate.setHours(requestDate.getHours() - 3);
    responseDate.setHours(responseDate.getHours() - 3);

    const data = JSON.stringify({
      userId,
      companyId,
      tokens,
      requestTimestamp: requestDate.toISOString(),
      responseTimestamp: responseDate.toISOString(),
      processingTime: responseTimestamp - requestTimestamp,
      localRequestTime: requestDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      localResponseTime: responseDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    });

    console.log('DEBUG: storePermanentTokenHistory - Dados a serem armazenados:', {
      key,
      data
    });

    // Usar timestamp como score para ordenação
    await redis.zadd(key, requestTimestamp, data);
    
    // Manter apenas os últimos 1000 registros para cada usuário
    await redis.zremrangebyrank(key, 0, -1001);

    console.log('DEBUG: storePermanentTokenHistory - Armazenamento concluído com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao armazenar histórico permanente de tokens:', error);
    return false;
  }
};

// Função para obter histórico permanente de tokens
const getPermanentTokenHistory = async (userId, startTimestamp = 0, endTimestamp = Date.now()) => {
  try {
    const key = `permanent:user:${userId}:tokens`;
    const history = await redis.zrangebyscore(key, startTimestamp, endTimestamp);
    
    return history.map(item => JSON.parse(item));
  } catch (error) {
    console.error('Erro ao obter histórico permanente de tokens:', error);
    return [];
  }
};

// Função para atualizar o uso de tokens
const updateTokenUsage = async (userId, tokens, companyId) => {
  try {
    console.log('DEBUG: updateTokenUsage - Iniciando atualização', {
      userId,
      tokens,
      companyId
    });

    const key = `user:${userId}:tokens`;
    const multi = redis.multi();

    // Incrementar tokens usados
    multi.incrby(key, tokens);
    
    // Definir expiração de 1 hora se não existir
    multi.expire(key, 3600);

    await multi.exec();

    console.log('DEBUG: updateTokenUsage - Contador atualizado, armazenando histórico permanente');

    // Armazenar no histórico permanente
    const historyResult = await storePermanentTokenHistory(userId, companyId, tokens);
    
    console.log('DEBUG: updateTokenUsage - Resultado do armazenamento do histórico:', historyResult);

    // Atualizar estatísticas no banco de dados
    await dbService.executeQuery(
      `UPDATE usage_stats 
       SET tokens_this_hour = tokens_this_hour + ?,
           last_query_timestamp = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [tokens, userId]
    );

    console.log('DEBUG: updateTokenUsage - Atualização concluída com sucesso');
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
  resetCounters,
  storePermanentTokenHistory,
  getPermanentTokenHistory
}; 