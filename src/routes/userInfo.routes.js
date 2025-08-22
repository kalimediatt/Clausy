const express = require('express');
const router = express.Router();
const userInfoService = require('../services/userInfo.service');
const { authenticate } = require('../middlewares/auth');

/**
 * Rota para buscar informações completas do usuário após login
 * GET /api/user-info/complete
 */
router.get('/complete', authenticate, async (req, res) => {
  try {
    
    
    const userEmail = req.user.email;
    const completeInfo = await userInfoService.getUserCompleteInfo(userEmail);
    
    
    
    res.json({
      success: true,
      data: completeInfo,
      message: 'Informações do usuário obtidas com sucesso'
    });
    
  } catch (error) {
    console.error('❌ DEBUG: Erro na rota /user-info/complete:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar informações do usuário',
      error: error.message
    });
  }
});

/**
 * Rota para buscar apenas informações básicas do usuário
 * GET /api/user-info/basic
 */
router.get('/basic', authenticate, async (req, res) => {
  try {
  
    
    const userEmail = req.user.email;
    const userInfo = await userInfoService.getUserInfoAfterLogin(userEmail);
    
    if (!userInfo) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    
    
    res.json({
      success: true,
      data: userInfo,
      message: 'Informações básicas do usuário obtidas'
    });
    
  } catch (error) {
    console.error('❌ DEBUG: Erro na rota /user-info/basic:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar informações básicas do usuário',
      error: error.message
    });
  }
});

/**
 * Rota para buscar estatísticas do usuário
 * GET /api/user-info/stats
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
  
    
    const userId = req.user.user_id || req.user.id;
    const stats = await userInfoService.getUserStats(userId);
    
    
    
    res.json({
      success: true,
      data: stats,
      message: 'Estatísticas do usuário obtidas'
    });
    
  } catch (error) {
    console.error('❌ DEBUG: Erro na rota /user-info/stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas do usuário',
      error: error.message
    });
  }
});

/**
 * Rota para atualizar último login
 * POST /api/user-info/update-last-login
 */
router.post('/update-last-login', authenticate, async (req, res) => {
  try {
  
    
    const userEmail = req.user.email;
    const success = await userInfoService.updateUserLastLogin(userEmail);
    
    if (success) {

      res.json({
        success: true,
        message: 'Último login atualizado com sucesso'
      });
    } else {

      res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
  } catch (error) {
    console.error('❌ DEBUG: Erro na rota /user-info/update-last-login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar último login',
      error: error.message
    });
  }
});

module.exports = router;

