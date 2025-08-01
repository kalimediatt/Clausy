const express = require('express');
const router = express.Router();
const chatHistoryService = require('../services/chatHistory.service');

// Obter histórico de conversas do usuário
router.get('/user/:userId/chat-history', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário tem permissão para acessar este histórico
    if (req.user.user_id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado' 
      });
    }

    // Limpar conversas expiradas
    await chatHistoryService.cleanupExpiredConversations(userId);
    
    // Obter histórico
    const history = await chatHistoryService.getChatHistory(userId);
    
    res.json({
      success: true,
      history: history
    });
  } catch (error) {
    console.error('Erro ao obter histórico de chats:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Salvar nova conversa
router.post('/user/:userId/chat-history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { conversation } = req.body;
    
    // Verificar se o usuário tem permissão
    if (req.user.user_id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado' 
      });
    }

    if (!conversation || !conversation.id || !conversation.messages) {
      return res.status(400).json({
        success: false,
        message: 'Dados da conversa inválidos'
      });
    }

    const success = await chatHistoryService.saveChatConversation(userId, conversation);
    
    if (success) {
      res.json({
        success: true,
        message: 'Conversa salva com sucesso'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao salvar conversa'
      });
    }
  } catch (error) {
    console.error('Erro ao salvar conversa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar conversa existente
router.put('/user/:userId/chat-history/:conversationId', async (req, res) => {
  try {
    const { userId, conversationId } = req.params;
    const { messages } = req.body;
    
    // Verificar se o usuário tem permissão
    if (req.user.user_id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado' 
      });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'Mensagens inválidas'
      });
    }

    const success = await chatHistoryService.updateChatConversation(userId, conversationId, messages);
    
    if (success) {
      res.json({
        success: true,
        message: 'Conversa atualizada com sucesso'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar conversa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Remover conversa
router.delete('/user/:userId/chat-history/:conversationId', async (req, res) => {
  try {
    const { userId, conversationId } = req.params;
    
    console.log('Tentando remover conversa:', { userId, conversationId });
    
    // Verificar se o usuário tem permissão
    if (req.user.user_id !== parseInt(userId) && req.user.role !== 'admin') {
      console.log('Acesso negado para usuário:', req.user.user_id);
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado' 
      });
    }

    console.log('Chamando serviço de remoção...');
    const success = await chatHistoryService.removeChatConversation(userId, conversationId);
    console.log('Resultado da remoção:', success);
    
    if (success) {
      res.json({
        success: true,
        message: 'Conversa removida com sucesso'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }
  } catch (error) {
    console.error('Erro ao remover conversa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter conversa específica
router.get('/user/:userId/chat-history/:conversationId', async (req, res) => {
  try {
    const { userId, conversationId } = req.params;
    
    // Verificar se o usuário tem permissão
    if (req.user.user_id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado' 
      });
    }

    const conversation = await chatHistoryService.getChatConversation(userId, conversationId);
    
    if (conversation) {
      res.json({
        success: true,
        conversation: conversation
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }
  } catch (error) {
    console.error('Erro ao obter conversa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router; 