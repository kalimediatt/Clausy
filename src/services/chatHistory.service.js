const db = require('../config/db');

// Função para salvar conversa no banco de dados
const saveChatConversation = async (userId, conversation) => {
  try {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Calcular data de expiração (7 dias)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Inserir conversa
      await connection.execute(
        'INSERT INTO chat_conversations (id, user_id, title, preview, expires_at) VALUES (?, ?, ?, ?, ?)',
        [
          conversation.id,
          userId,
          conversation.title || null,
          conversation.preview || null,
          expiresAt
        ]
      );
      
      // Inserir mensagens uma por uma
      if (conversation.messages && conversation.messages.length > 0) {
        for (const msg of conversation.messages) {
          await connection.execute(
            'INSERT INTO chat_messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)',
            [msg.id, conversation.id, msg.role, msg.content]
          );
        }
      }
      
      await connection.commit();
      console.log(`Conversa ${conversation.id} salva para usuário ${userId}`);
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao salvar conversa no banco:', error);
    return false;
  }
};

// Função para obter histórico de conversas do usuário
const getChatHistory = async (userId) => {
  try {
    // Limpar conversas expiradas primeiro
    await cleanupExpiredConversations(userId);
    
    // Buscar conversas ativas
    const conversations = await db.executeQuery(
      `SELECT id, user_id, title, preview, created_at, updated_at, expires_at, is_active 
       FROM chat_conversations 
       WHERE user_id = ? AND is_active = TRUE 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    // Para cada conversa, buscar as mensagens
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        const messages = await db.executeQuery(
          'SELECT id, role, content, created_at FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC',
          [conv.id]
        );
        
        return {
          ...conv,
          messages: messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.created_at
          }))
        };
      })
    );
    
    return conversationsWithMessages;
  } catch (error) {
    console.error('Erro ao obter histórico de conversas:', error);
    return [];
  }
};

// Função para atualizar conversa existente
const updateChatConversation = async (userId, conversationId, updatedMessages) => {
  try {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar se a conversa existe e pertence ao usuário
      const [conversation] = await connection.execute(
        'SELECT id FROM chat_conversations WHERE id = ? AND user_id = ? AND is_active = TRUE',
        [conversationId, userId]
      );
      
      if (conversation.length === 0) {
        await connection.rollback();
        return false;
      }
      
      // Remover mensagens antigas
      await connection.execute(
        'DELETE FROM chat_messages WHERE conversation_id = ?',
        [conversationId]
      );
      
      // Inserir novas mensagens uma por uma
      if (updatedMessages && updatedMessages.length > 0) {
        for (const msg of updatedMessages) {
          await connection.execute(
            'INSERT INTO chat_messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)',
            [msg.id, conversationId, msg.role, msg.content]
          );
        }
      }
      
      // Atualizar preview da conversa
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      const preview = lastMessage ? lastMessage.content.substring(0, 100) : null;
      
      await connection.execute(
        'UPDATE chat_conversations SET preview = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [preview, conversationId]
      );
      
      await connection.commit();
      console.log(`Conversa ${conversationId} atualizada para usuário ${userId}`);
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao atualizar conversa no banco:', error);
    return false;
  }
};

// Função para remover conversa
const removeChatConversation = async (userId, conversationId) => {
  try {
    console.log('Removendo conversa do banco:', { userId, conversationId });
    
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar se a conversa existe e pertence ao usuário
      const [conversation] = await connection.execute(
        'SELECT id FROM chat_conversations WHERE id = ? AND user_id = ? AND is_active = TRUE',
        [conversationId, userId]
      );
      
      if (conversation.length === 0) {
        await connection.rollback();
        return false;
      }
      
      // Marcar como inativa (soft delete)
      await connection.execute(
        'UPDATE chat_conversations SET is_active = FALSE WHERE id = ?',
        [conversationId]
      );
      
      await connection.commit();
      console.log(`Conversa ${conversationId} removida para usuário ${userId}`);
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao remover conversa do banco:', error);
    return false;
  }
};

// Função para limpar conversas expiradas
const cleanupExpiredConversations = async (userId) => {
  try {
    const currentTime = new Date();
    
    // Marcar conversas expiradas como inativas
    const result = await db.executeQuery(
      'UPDATE chat_conversations SET is_active = FALSE WHERE user_id = ? AND expires_at <= ? AND is_active = TRUE',
      [userId, currentTime]
    );
    
    if (result.affectedRows > 0) {
      console.log(`${result.affectedRows} conversas expiradas removidas para usuário ${userId}`);
    }
  } catch (error) {
    console.error('Erro ao limpar conversas expiradas:', error);
  }
};

// Função para obter conversa específica
const getChatConversation = async (userId, conversationId) => {
  try {
    // Buscar conversa
    const conversations = await db.executeQuery(
      'SELECT id, user_id, title, preview, created_at, updated_at, expires_at, is_active FROM chat_conversations WHERE id = ? AND user_id = ? AND is_active = TRUE',
      [conversationId, userId]
    );
    
    if (conversations.length === 0) {
      return null;
    }
    
    const conversation = conversations[0];
    
    // Verificar se não expirou
    if (conversation.expires_at <= new Date()) {
      await cleanupExpiredConversations(userId);
      return null;
    }
    
    // Buscar mensagens
    const messages = await db.executeQuery(
      'SELECT id, role, content, created_at FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversationId]
    );
    
    return {
      ...conversation,
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at
      }))
    };
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