const Redis = require('ioredis');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  retryStrategy: function(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

const redis = new Redis(redisConfig);

redis.on('connect', () => {
  console.log('Redis conectado com sucesso!');
});

redis.on('error', (error) => {
  console.error('Erro na conexão com Redis:', error);
});

module.exports = redis; 