const Redis = require('ioredis');
const { promisify } = require('util');
const logging = require('./logger');
const config = require('../config/config');

// Configurações de cache
const CACHE_CONFIG = {
    redis: {
        host: config.get('redis.host', 'localhost'),
        port: config.get('redis.port', 6379),
        password: config.get('redis.password', ''),
        db: config.get('redis.db', 0),
        keyPrefix: config.get('redis.keyPrefix', 'cache:'),
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        }
    },
    ttl: {
        default: 3600,
        short: 300,
        medium: 1800,
        long: 86400,
        infinite: -1
    },
    maxSize: 1000,
    compression: {
        enabled: true,
        threshold: 1024
    }
};

// Cliente Redis
const redis = new Redis(CACHE_CONFIG.redis);

// Funções de cache
const cacheUtils = {
    // Obtém valor do cache
    get: async (key) => {
        try {
            const value = await redis.get(key);
            if (!value) {
                return null;
            }
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            logging.error('Error getting cache value', { error, key });
            return null;
        }
    },

    // Define valor no cache
    set: async (key, value, ttl = CACHE_CONFIG.ttl.default) => {
        try {
            const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
            if (ttl === CACHE_CONFIG.ttl.infinite) {
                await redis.set(key, serialized);
            } else {
                await redis.setex(key, ttl, serialized);
            }
            return true;
        } catch (error) {
            logging.error('Error setting cache value', { error, key });
            return false;
        }
    },

    // Remove valor do cache
    del: async (key) => {
        try {
            await redis.del(key);
            return true;
        } catch (error) {
            logging.error('Error deleting cache value', { error, key });
            return false;
        }
    },

    // Verifica se chave existe no cache
    exists: async (key) => {
        try {
            return await redis.exists(key);
        } catch (error) {
            logging.error('Error checking cache key existence', { error, key });
            return false;
        }
    },

    // Define tempo de expiração do cache
    expire: async (key, ttl) => {
        try {
            return await redis.expire(key, ttl);
        } catch (error) {
            logging.error('Error setting cache expiration', { error, key });
            return false;
        }
    },

    // Obtém tempo de expiração do cache
    ttl: async (key) => {
        try {
            return await redis.ttl(key);
        } catch (error) {
            logging.error('Error getting cache TTL', { error, key });
            return -2;
        }
    },

    // Incrementa valor no cache
    incr: async (key) => {
        try {
            return await redis.incr(key);
        } catch (error) {
            logging.error('Error incrementing cache value', { error, key });
            return null;
        }
    },

    // Decrementa valor no cache
    decr: async (key) => {
        try {
            return await redis.decr(key);
        } catch (error) {
            logging.error('Error decrementing cache value', { error, key });
            return null;
        }
    },

    // Obtém múltiplos valores do cache
    mget: async (keys) => {
        try {
            const values = await redis.mget(keys);
            return values.map(value => {
                if (!value) {
                    return null;
                }
                try {
                    return JSON.parse(value);
                } catch {
                    return value;
                }
            });
        } catch (error) {
            logging.error('Error getting multiple cache values', { error, keys });
            return keys.map(() => null);
        }
    },

    // Define múltiplos valores no cache
    mset: async (entries, ttl = CACHE_CONFIG.ttl.default) => {
        try {
            const pipeline = redis.pipeline();
            for (const [key, value] of Object.entries(entries)) {
                const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
                if (ttl === CACHE_CONFIG.ttl.infinite) {
                    pipeline.set(key, serialized);
                } else {
                    pipeline.setex(key, ttl, serialized);
                }
            }
            await pipeline.exec();
            return true;
        } catch (error) {
            logging.error('Error setting multiple cache values', { error });
            return false;
        }
    },

    // Remove múltiplos valores do cache
    mdel: async (keys) => {
        try {
            await redis.del(keys);
            return true;
        } catch (error) {
            logging.error('Error deleting multiple cache values', { error, keys });
            return false;
        }
    },

    // Limpa cache
    clear: async () => {
        try {
            await redis.flushdb();
            return true;
        } catch (error) {
            logging.error('Error clearing cache', { error });
            return false;
        }
    },

    // Obtém estatísticas do cache
    stats: async () => {
        try {
            const info = await redis.info();
            const stats = {};
            for (const line of info.split('\n')) {
                const [key, value] = line.split(':');
                if (key && value) {
                    stats[key.trim()] = value.trim();
                }
            }
            return stats;
        } catch (error) {
            logging.error('Error getting cache stats', { error });
            return null;
        }
    }
};

// Funções de invalidação
const invalidationUtils = {
    // Invalida cache por padrão
    invalidateByPattern: async (pattern) => {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(keys);
            }
            return true;
        } catch (error) {
            logging.error('Error invalidating cache by pattern', { error, pattern });
            return false;
        }
    },

    // Invalida cache por prefixo
    invalidateByPrefix: async (prefix) => {
        try {
            return await invalidationUtils.invalidateByPattern(`${prefix}*`);
        } catch (error) {
            logging.error('Error invalidating cache by prefix', { error, prefix });
            return false;
        }
    },

    // Invalida cache por sufixo
    invalidateBySuffix: async (suffix) => {
        try {
            return await invalidationUtils.invalidateByPattern(`*${suffix}`);
        } catch (error) {
            logging.error('Error invalidating cache by suffix', { error, suffix });
            return false;
        }
    },

    // Invalida cache por expressão regular
    invalidateByRegex: async (regex) => {
        try {
            const keys = await redis.keys('*');
            const pattern = new RegExp(regex);
            const matchingKeys = keys.filter(key => pattern.test(key));
            if (matchingKeys.length > 0) {
                await redis.del(matchingKeys);
            }
            return true;
        } catch (error) {
            logging.error('Error invalidating cache by regex', { error, regex });
            return false;
        }
    }
};

// Funções de middleware
const middlewareUtils = {
    // Middleware de cache
    cache: (ttl = CACHE_CONFIG.ttl.default) => {
        return async (req, res, next) => {
            if (req.method !== 'GET') {
                return next();
            }
            const key = `cache:${req.originalUrl}`;
            try {
                const cached = await cacheUtils.get(key);
                if (cached) {
                    return res.json(cached);
                }
                res.sendResponse = res.json;
                res.json = (body) => {
                    cacheUtils.set(key, body, ttl);
                    res.sendResponse(body);
                };
                next();
            } catch (error) {
                logging.error('Error in cache middleware', { error });
                next();
            }
        };
    },

    // Middleware de invalidação
    invalidate: (pattern) => {
        return async (req, res, next) => {
            try {
                await invalidationUtils.invalidateByPattern(pattern);
                next();
            } catch (error) {
                logging.error('Error in invalidation middleware', { error });
                next();
            }
        };
    }
};

// Funções de monitoramento
const monitoringUtils = {
    // Monitora cache
    monitor: () => {
        redis.monitor((err, monitor) => {
            if (err) {
                logging.error('Error monitoring cache', { error: err });
                return;
            }
            monitor.on('monitor', (time, args) => {
                logging.debug('Cache command', { time, args });
            });
        });
    },

    // Obtém métricas do cache
    metrics: async () => {
        try {
            const stats = await cacheUtils.stats();
            const metrics = {
                connected_clients: parseInt(stats.connected_clients),
                used_memory: parseInt(stats.used_memory),
                used_memory_peak: parseInt(stats.used_memory_peak),
                total_connections_received: parseInt(stats.total_connections_received),
                total_commands_processed: parseInt(stats.total_commands_processed),
                instantaneous_ops_per_sec: parseInt(stats.instantaneous_ops_per_sec),
                hit_rate: parseFloat(stats.keyspace_hits) / (parseFloat(stats.keyspace_hits) + parseFloat(stats.keyspace_misses))
            };
            return metrics;
        } catch (error) {
            logging.error('Error getting cache metrics', { error });
            return null;
        }
    }
};

// Funções de saúde
const healthUtils = {
    // Verifica saúde do cache
    check: async () => {
        try {
            await redis.ping();
            return true;
        } catch (error) {
            logging.error('Error checking cache health', { error });
            return false;
        }
    },

    // Obtém status do cache
    status: async () => {
        try {
            const health = await healthUtils.check();
            const metrics = await monitoringUtils.metrics();
            return {
                health,
                metrics,
                config: CACHE_CONFIG
            };
        } catch (error) {
            logging.error('Error getting cache status', { error });
            return null;
        }
    }
};

// Funções de limpeza
const cleanupUtils = {
    // Limpa cache expirado
    cleanup: async () => {
        try {
            await redis.eval(`
                local keys = redis.call('keys', '${CACHE_CONFIG.redis.keyPrefix}*')
                for i=1,#keys do
                    local ttl = redis.call('ttl', keys[i])
                    if ttl < 0 then
                        redis.call('del', keys[i])
                    end
                end
            `);
            return true;
        } catch (error) {
            logging.error('Error cleaning up cache', { error });
            return false;
        }
    },

    // Agenda limpeza do cache
    scheduleCleanup: (interval = 3600000) => {
        setInterval(async () => {
            await cleanupUtils.cleanup();
        }, interval);
    }
};

// Funções de shutdown
const shutdownUtils = {
    // Fecha conexão com cache
    close: async () => {
        try {
            await redis.quit();
            return true;
        } catch (error) {
            logging.error('Error closing cache connection', { error });
            return false;
        }
    },

    // Fecha conexão com cache forçadamente
    forceClose: async () => {
        try {
            await redis.disconnect();
            return true;
        } catch (error) {
            logging.error('Error force closing cache connection', { error });
            return false;
        }
    }
};

module.exports = {
    CACHE_CONFIG,
    cacheUtils,
    invalidationUtils,
    middlewareUtils,
    monitoringUtils,
    healthUtils,
    cleanupUtils,
    shutdownUtils
}; 