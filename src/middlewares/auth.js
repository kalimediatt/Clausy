const jwt = require('jsonwebtoken');
const config = require('../config/jwt.config');

/**
 * Middleware de autenticação
 * Verifica se o token JWT é válido e adiciona as informações do usuário ao req
 */
const authenticate = async (req, res, next) => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação inválido'
      });
    }
    
    // Verificar e decodificar o token
    const decoded = jwt.verify(token, config.secret);
    
    // Adicionar informações do usuário ao req
    req.user = {
      user_id: decoded.user_id,
      id: decoded.user_id, // Alias para compatibilidade
      email: decoded.email,
      role: decoded.role,
      company_id: decoded.company_id
    };
    

    
    next();
    
  } catch (error) {
    console.error('❌ DEBUG: Erro de autenticação:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação expirado'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Erro interno de autenticação'
    });
  }
};

/**
 * Middleware de autorização
 * Verifica se o usuário tem as permissões necessárias
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }
    
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissões insuficientes.'
      });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};

