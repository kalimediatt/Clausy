// Configurações do JWT
const JWT_SECRET = process.env.JWT_SECRET || 'clausy_secret_key_for_development';
const JWT_EXPIRATION = '24h';

module.exports = {
  JWT_SECRET,
  JWT_EXPIRATION
}; 