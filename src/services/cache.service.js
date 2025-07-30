const Redis = require('ioredis');
const os = require('os');
const zlib = require('zlib');
const { promisify } = require('util');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Funções promisificadas
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// Configuração do Redis com estratégia de backoff e reconexão
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxMemory: '200mb', // Aumentado para 200MB
    maxMemoryPolicy: 'allkeys-lru',
    connectTimeout: 10000,
    commandTimeout: 5000,
    keepAlive: 10000,
    reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
            return true;
        }
        return false;
    },
    // Adicionar estratégia de backoff para reconexões
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
};

const redis = new Redis(redisConfig);

// Monitor Redis memory usage com compressão
async function monitorCacheSize() {
    try {
        const info = await redis.info();
        const usedMemory = parseInt(info.match(/used_memory:(\d+)/)[1]);
        const maxMemory = 200 * 1024 * 1024; // 200MB
        const memoryUsage = Math.round(usedMemory / 1024 / 1024);

        console.log(`Redis memory usage: ${memoryUsage}MB`);

        if (usedMemory > maxMemory * 0.8) { // 80% do limite
            console.warn(`Redis memory usage high: ${memoryUsage}MB`);
            
            // Comprimir chaves grandes
            const keys = await redis.keys('*');
            for (const key of keys) {
                const value = await redis.get(key);
                if (value && value.length > 1024) { // Comprimir apenas valores grandes
                    const compressed = await gzip(value);
                    await redis.set(key, compressed);
                }
            }
            
            // Limpar chaves antigas
            await redis.evict('lru');
            await redis.evict('volatile-ttl');
        }

        // Verificar conexões ativas
        const connectedClients = parseInt(info.match(/connected_clients:(\d+)/)[1]);
        if (connectedClients > 10) {
            console.warn(`High number of Redis connections: ${connectedClients}`);
        }
    } catch (error) {
        console.error('Error monitoring Redis memory:', error);
    }
}

// Run memory monitoring every 5 minutes
setInterval(monitorCacheSize, 5 * 60 * 1000);

// Limpar cache periodicamente (a cada 6 horas)
setInterval(async () => {
    try {
        const info = await redis.info();
        const usedMemory = parseInt(info.match(/used_memory:(\d+)/)[1]);
        const maxMemory = 200 * 1024 * 1024; // 200MB

        if (usedMemory > maxMemory * 0.9) { // 90% do limite
            console.log('Performing periodic cache cleanup');
            await redis.evict('lru');
        }
    } catch (error) {
        console.error('Error in periodic cache cleanup:', error);
    }
}, 6 * 60 * 60 * 1000);

const cacheService = {
    // Armazenar dados no cache com compressão
    async set(key, value, expireTime = 3600) {
        try {
            const stringValue = JSON.stringify(value);
            
            // Comprimir valores grandes
            let finalValue = stringValue;
            if (stringValue.length > 1024) {
                finalValue = await gzip(stringValue);
            }
            
            if (expireTime) {
                await redis.setex(key, expireTime, finalValue);
            } else {
                await redis.set(key, finalValue);
            }
            return true;
        } catch (error) {
            console.error('Erro ao armazenar no cache:', error);
            return false;
        }
    },

    // Recuperar dados do cache com descompressão
    async get(key) {
        try {
            const value = await redis.get(key);
            if (!value) return null;
            
            // Tentar descomprimir se necessário
            try {
                const decompressed = await gunzip(value);
                return JSON.parse(decompressed.toString());
            } catch {
                // Se falhar a descompressão, assume que não está comprimido
                return JSON.parse(value);
            }
        } catch (error) {
            console.error('Erro ao recuperar do cache:', error);
            return null;
        }
    },

    // Remover dados do cache
    async del(key) {
        try {
            await redis.del(key);
            return true;
        } catch (error) {
            console.error('Erro ao remover do cache:', error);
            return false;
        }
    },

    // Verificar se uma chave existe
    async exists(key) {
        try {
            return await redis.exists(key);
        } catch (error) {
            console.error('Erro ao verificar existência no cache:', error);
            return false;
        }
    },

    // Limpar todo o cache
    async clear() {
        try {
            await redis.flushall();
            return true;
        } catch (error) {
            console.error('Erro ao limpar cache:', error);
            return false;
        }
    },

    // Get cache statistics
    async getStats() {
        try {
            const info = await redis.info();
            return {
                usedMemory: parseInt(info.match(/used_memory:(\d+)/)[1]),
                connectedClients: parseInt(info.match(/connected_clients:(\d+)/)[1]),
                totalKeys: parseInt(info.match(/db0:keys=(\d+)/)[1]),
                lastSaveTime: parseInt(info.match(/last_save_time:(\d+)/)[1]),
                uptimeInSeconds: parseInt(info.match(/uptime_in_seconds:(\d+)/)[1]),
                memoryPolicy: info.match(/maxmemory-policy:(\w+)/)[1],
                maxMemory: parseInt(info.match(/maxmemory:(\d+)/)[1])
            };
        } catch (error) {
            console.error('Error getting cache stats:', error);
            return null;
        }
    },

    // Limpar chaves antigas
    async cleanup() {
        try {
            await redis.evict('lru');
            return true;
        } catch (error) {
            console.error('Error cleaning up cache:', error);
            return false;
        }
    }
};

// Handle Redis connection errors with backoff
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;

redis.on('error', (error) => {
    console.error('Redis connection error:', error);
    reconnectAttempts++;
    
    if (reconnectAttempts > maxReconnectAttempts) {
        console.error('Max reconnection attempts reached, exiting...');
        process.exit(1);
    }
});

redis.on('ready', () => {
    console.log('Redis connection established');
    reconnectAttempts = 0;
});

redis.on('reconnecting', () => {
    console.log('Redis reconnecting...');
});

redis.on('end', () => {
    console.log('Redis connection ended');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Closing Redis connection...');
    await redis.quit();
    process.exit(0);
});

module.exports = cacheService; 