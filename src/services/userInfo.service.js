const db = require('./db.service');

/**
 * Busca informações completas do usuário após login
 * @param {string} email - Email do usuário
 * @returns {Promise<object>} - Informações completas do usuário
 */
async function getUserInfoAfterLogin(email) {
  try {
  
    
    const query = `
      SELECT 
        u.user_id,
        u.email,
        u.name,
        u.role,
        u.credits,
        u.plan_id,
        u.last_login,
        u.created_at,
        u.updated_at,
        u.company_id,
        p.name as plan_name,
        p.color as plan_color,
        p.max_queries_per_hour,
        p.max_tokens_per_hour,
        p.history_retention_hours,
        p.features,
        c.name as company_name,
        c.domain as company_domain,
        c.status as company_status
      FROM users u
      LEFT JOIN subscription_plans p ON u.plan_id = p.plan_id
      LEFT JOIN companies c ON u.company_id = c.company_id
      WHERE u.email = ?
    `;
    
    const results = await db.executeQuery(query, [email]);
    
    if (results.length === 0) {

      return null;
    }
    
    const userInfo = results[0];

    
    // Formatar dados para melhor uso
    const formattedUserInfo = {
      // Informações básicas
      id: userInfo.user_id,
      email: userInfo.email,
      name: userInfo.name,
      role: userInfo.role,
      
      // Créditos e plano
      credits: userInfo.credits,
      plan: {
        id: userInfo.plan_id,
        name: userInfo.plan_name,
        color: userInfo.plan_color,
        maxQueriesPerHour: userInfo.max_queries_per_hour,
        maxTokensPerHour: userInfo.max_tokens_per_hour,
        historyRetentionHours: userInfo.history_retention_hours,
        features: userInfo.features ? JSON.parse(userInfo.features) : []
      },
      
      // Empresa
      company: {
        id: userInfo.company_id,
        name: userInfo.company_name,
        domain: userInfo.company_domain,
        status: userInfo.company_status
      },
      
      // Timestamps
      lastLogin: userInfo.last_login,
      createdAt: userInfo.created_at,
      updatedAt: userInfo.updated_at,
      
      // Informações calculadas
      isAdmin: userInfo.role === 'admin' || userInfo.role === 'superadmin',
      isSuperAdmin: userInfo.role === 'superadmin',
      hasCredits: userInfo.credits > 0,
      planFeatures: userInfo.features ? JSON.parse(userInfo.features) : []
    };
    

    
    return formattedUserInfo;
    
  } catch (error) {
    console.error('❌ DEBUG: Erro ao buscar informações do usuário:', error);
    throw new Error(`Erro ao buscar informações do usuário: ${error.message}`);
  }
}

/**
 * Atualiza o último login do usuário
 * @param {string} email - Email do usuário
 * @returns {Promise<boolean>} - Sucesso da operação
 */
async function updateUserLastLogin(email) {
  try {

    
    const query = 'UPDATE users SET last_login = NOW() WHERE email = ?';
    const result = await db.executeQuery(query, [email]);
    
    if (result.affectedRows > 0) {

      return true;
    } else {

      return false;
    }
    
  } catch (error) {
    console.error('❌ DEBUG: Erro ao atualizar último login:', error);
    throw new Error(`Erro ao atualizar último login: ${error.message}`);
  }
}

/**
 * Busca estatísticas do usuário (uso de créditos, consultas, etc.)
 * @param {number} userId - ID do usuário
 * @returns {Promise<object>} - Estatísticas do usuário
 */
async function getUserStats(userId) {
  try {

    
    // Buscar estatísticas de uso de tokens
    const tokenQuery = `
      SELECT 
        COUNT(*) as total_queries,
        SUM(tokens_used) as total_tokens,
        MAX(created_at) as last_query_date
      FROM token_usage 
      WHERE user_id = ? 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    
    const tokenResults = await db.executeQuery(tokenQuery, [userId]);
    const tokenStats = tokenResults[0] || { total_queries: 0, total_tokens: 0, last_query_date: null };
    
    // Buscar estatísticas de chat
    const chatQuery = `
      SELECT 
        COUNT(*) as total_chats,
        MAX(created_at) as last_chat_date
      FROM chat_conversations 
      WHERE user_id = ?
    `;
    
    const chatResults = await db.executeQuery(chatQuery, [userId]);
    const chatStats = chatResults[0] || { total_chats: 0, last_chat_date: null };
    
    const stats = {
      tokens: {
        totalQueries: parseInt(tokenStats.total_queries) || 0,
        totalTokens: parseInt(tokenStats.total_tokens) || 0,
        lastQueryDate: tokenStats.last_query_date
      },
      chats: {
        totalChats: parseInt(chatStats.total_chats) || 0,
        lastChatDate: chatStats.last_chat_date
      },
      period: '30_days'
    };
    

    
    return stats;
    
  } catch (error) {
    console.error('❌ DEBUG: Erro ao buscar estatísticas:', error);
    return {
      tokens: { totalQueries: 0, totalTokens: 0, lastQueryDate: null },
      chats: { totalChats: 0, lastChatDate: null },
      period: '30_days'
    };
  }
}

/**
 * Função principal que busca todas as informações do usuário após login
 * @param {string} email - Email do usuário
 * @returns {Promise<object>} - Informações completas do usuário
 */
async function getUserCompleteInfo(email) {
  try {

    
    // Buscar informações básicas do usuário
    const userInfo = await getUserInfoAfterLogin(email);
    
    if (!userInfo) {
      throw new Error('Usuário não encontrado');
    }
    
    // Atualizar último login
    await updateUserLastLogin(email);
    
    // Buscar estatísticas
    const stats = await getUserStats(userInfo.id);
    
    // Combinar todas as informações
    const completeInfo = {
      ...userInfo,
      stats
    };
    

    
    return completeInfo;
    
  } catch (error) {
    console.error('❌ DEBUG: Erro ao buscar informações completas:', error);
    throw error;
  }
}

module.exports = {
  getUserInfoAfterLogin,
  updateUserLastLogin,
  getUserStats,
  getUserCompleteInfo
};

