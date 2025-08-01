const redis = require('../config/redis.config');

// Função para salvar conversa no Redis
const saveChatConversation = async (userId, conversation) => {
  try {
    const key = `chat:user:${userId}:conversations`;
    const conversationData = {
      ...conversation,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 dias
    };

    // Salvar conversa no Redis com expiração
    await redis.hset(key, conversation.id, JSON.stringify(conversationData));
    
    // Definir expiração para a chave do usuário (7 dias)
    await redis.expire(key, 7 * 24 * 60 * 60);

    console.log(`Conversa ${conversation.id} salva para usuário ${userId}`);
    return true;
  } catch (error) {
    console.error('Erro ao salvar conversa no Redis:', error);
    return false;
  }
};

// Função para obter histórico de conversas do usuário
const getChatHistory = async (userId) => {
  try {
    const key = `chat:user:${userId}:conversations`;
    const conversations = await redis.hgetall(key);
    
    if (!conversations || Object.keys(conversations).length === 0) {
      return [];
    }

    // Converter e filtrar conversas válidas
    const validConversations = Object.values(conversations)
      .map(conv => JSON.parse(conv))
      .filter(conv => {
        // Verificar se não expirou
        return conv.expiresAt > Date.now();
      })
      .sort((a, b) => b.createdAt - a.createdAt); // Ordenar por data de criação (mais recente primeiro)

    return validConversations;
  } catch (error) {
    console.error('Erro ao obter histórico de conversas:', error);
    return [];
  }
};

// Função para atualizar conversa existente
const updateChatConversation = async (userId, conversationId, updatedMessages) => {
  try {
    const key = `chat:user:${userId}:conversations`;
    
    // Obter conversa existente
    const existingConversation = await redis.hget(key, conversationId);
    if (!existingConversation) {
      return false;
    }

    const conversation = JSON.parse(existingConversation);
    
    // Atualizar mensagens e timestamp
    conversation.messages = updatedMessages;
    conversation.updatedAt = Date.now();
    conversation.preview = updatedMessages[updatedMessages.length - 1]?.content?.substring(0, 100) || 'Sem preview';

    // Salvar conversa atualizada
    await redis.hset(key, conversationId, JSON.stringify(conversation));
    
    console.log(`Conversa ${conversationId} atualizada para usuário ${userId}`);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar conversa no Redis:', error);
    return false;
  }
};

// Função para remover conversa
const removeChatConversation = async (userId, conversationId) => {
  try {
    const key = `chat:user:${userId}:conversations`;
    console.log('Removendo conversa do Redis:', { key, conversationId });
    
    const result = await redis.hdel(key, conversationId);
    console.log('Resultado do HDEL:', result);
    
    console.log(`Conversa ${conversationId} removida para usuário ${userId}`);
    return true;
  } catch (error) {
    console.error('Erro ao remover conversa do Redis:', error);
    return false;
  }
};

// Função para limpar conversas expiradas
const cleanupExpiredConversations = async (userId) => {
  try {
    const key = `chat:user:${userId}:conversations`;
    const conversations = await redis.hgetall(key);
    
    if (!conversations || Object.keys(conversations).length === 0) {
      return;
    }

    const currentTime = Date.now();
    const expiredIds = [];

    // Verificar conversas expiradas
    for (const [id, convData] of Object.entries(conversations)) {
      const conversation = JSON.parse(convData);
      if (conversation.expiresAt <= currentTime) {
        expiredIds.push(id);
      }
    }

    // Remover conversas expiradas
    if (expiredIds.length > 0) {
      await redis.hdel(key, ...expiredIds);
      console.log(`${expiredIds.length} conversas expiradas removidas para usuário ${userId}`);
    }
  } catch (error) {
    console.error('Erro ao limpar conversas expiradas:', error);
  }
};

// Função para obter conversa específica
const getChatConversation = async (userId, conversationId) => {
  try {
    const key = `chat:user:${userId}:conversations`;
    const conversationData = await redis.hget(key, conversationId);
    
    if (!conversationData) {
      return null;
    }

    const conversation = JSON.parse(conversationData);
    
    // Verificar se não expirou
    if (conversation.expiresAt <= Date.now()) {
      await redis.hdel(key, conversationId);
      return null;
    }

    return conversation;
  } catch (error) {
    console.error('Erro ao obter conversa específica:', error);
    return null;
  }
};

module.exports = {
  saveChatConversation,
  getChatHistory,
  updateChatConversation,
  removeChatConversation,
  cleanupExpiredConversations,
  getChatConversation
}; 