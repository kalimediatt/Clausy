// Configurações do JWT
const JWT_SECRET = process.env.JWT_SECRET || 'IkttY9U89HmcwVu42HO7GSTv8QzxWcTG1ClGLjQ66HFrEeKjSp';
const JWT_EXPIRATION = '24h';

module.exports = {
  JWT_SECRET,
  JWT_EXPIRATION
}; 