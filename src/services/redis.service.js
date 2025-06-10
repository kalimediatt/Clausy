const Redis = require('ioredis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.new_env') });

// Configuração do Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// Criar cliente Redis
const redis = new Redis(redisConfig);

// Tratamento de erros
redis.on('error', (err) => {
  console.error('Erro na conexão com Redis:', err);
});

redis.on('connect', () => {
  console.log('Conectado ao Redis');
});

// Funções auxiliares
const get = async (key) => {
  try {
    return await redis.get(key);
  } catch (error) {
    console.error('Erro ao obter chave do Redis:', error);
    return null;
  }
};

const set = async (key, value, expireTime = null) => {
  try {
    if (expireTime) {
      return await redis.setex(key, expireTime, value);
    }
    return await redis.set(key, value);
  } catch (error) {
    console.error('Erro ao definir chave no Redis:', error);
    return null;
  }
};

const del = async (key) => {
  try {
    return await redis.del(key);
  } catch (error) {
    console.error('Erro ao deletar chave do Redis:', error);
    return null;
  }
};

const incr = async (key) => {
  try {
    return await redis.incr(key);
  } catch (error) {
    console.error('Erro ao incrementar chave no Redis:', error);
    return null;
  }
};

const decr = async (key) => {
  try {
    return await redis.decr(key);
  } catch (error) {
    console.error('Erro ao decrementar chave no Redis:', error);
    return null;
  }
};

const setex = async (key, seconds, value) => {
  try {
    return await redis.setex(key, seconds, value);
  } catch (error) {
    console.error('Erro ao definir chave com expiração no Redis:', error);
    return null;
  }
};

const multi = () => {
  return redis.multi();
};

module.exports = {
  redis,
  get,
  set,
  del,
  incr,
  decr,
  setex,
  multi
}; 