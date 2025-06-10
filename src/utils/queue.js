const Bull = require('bull');
const { promisify } = require('util');
const logging = require('./logger');
const config = require('../config/config');

// Configurações de fila
const QUEUE_CONFIG = {
    redis: {
        host: config.get('redis.host', 'localhost'),
        port: config.get('redis.port', 6379),
        password: config.get('redis.password', ''),
        db: config.get('redis.db', 1)
    },
    default: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: true,
        removeOnFail: false
    },
    limiter: {
        max: 1000,
        duration: 5000
    },
    monitor: {
        interval: 5000
    }
};

// Filas
const queues = new Map();

// Funções de fila
const queueUtils = {
    // Cria fila
    create: (name, options = {}) => {
        try {
            if (queues.has(name)) {
                return queues.get(name);
            }
            const queue = new Bull(name, {
                redis: QUEUE_CONFIG.redis,
                defaultJobOptions: {
                    ...QUEUE_CONFIG.default,
                    ...options
                },
                limiter: QUEUE_CONFIG.limiter
            });
            queues.set(name, queue);
            return queue;
        } catch (error) {
            logging.error('Error creating queue', { error, name });
            throw error;
        }
    },

    // Obtém fila
    get: (name) => {
        try {
            if (!queues.has(name)) {
                return queueUtils.create(name);
            }
            return queues.get(name);
        } catch (error) {
            logging.error('Error getting queue', { error, name });
            throw error;
        }
    },

    // Adiciona job
    add: async (name, data, options = {}) => {
        try {
            const queue = queueUtils.get(name);
            const job = await queue.add(data, options);
            return job;
        } catch (error) {
            logging.error('Error adding job to queue', { error, name });
            throw error;
        }
    },

    // Processa jobs
    process: (name, handler, concurrency = 1) => {
        try {
            const queue = queueUtils.get(name);
            queue.process(concurrency, async (job) => {
                try {
                    return await handler(job);
                } catch (error) {
                    logging.error('Error processing job', { error, job });
                    throw error;
                }
            });
        } catch (error) {
            logging.error('Error setting up queue processor', { error, name });
            throw error;
        }
    },

    // Obtém job
    getJob: async (name, id) => {
        try {
            const queue = queueUtils.get(name);
            const job = await queue.getJob(id);
            return job;
        } catch (error) {
            logging.error('Error getting job', { error, name, id });
            throw error;
        }
    },

    // Remove job
    removeJob: async (name, id) => {
        try {
            const queue = queueUtils.get(name);
            const job = await queue.getJob(id);
            if (job) {
                await job.remove();
            }
            return true;
        } catch (error) {
            logging.error('Error removing job', { error, name, id });
            throw error;
        }
    },

    // Limpa fila
    clean: async (name, type = 'completed', age = 3600000) => {
        try {
            const queue = queueUtils.get(name);
            await queue.clean(age, type);
            return true;
        } catch (error) {
            logging.error('Error cleaning queue', { error, name });
            throw error;
        }
    },

    // Pausa fila
    pause: async (name) => {
        try {
            const queue = queueUtils.get(name);
            await queue.pause();
            return true;
        } catch (error) {
            logging.error('Error pausing queue', { error, name });
            throw error;
        }
    },

    // Resuma fila
    resume: async (name) => {
        try {
            const queue = queueUtils.get(name);
            await queue.resume();
            return true;
        } catch (error) {
            logging.error('Error resuming queue', { error, name });
            throw error;
        }
    },

    // Obtém estatísticas da fila
    getStats: async (name) => {
        try {
            const queue = queueUtils.get(name);
            const [active, waiting, completed, failed, delayed] = await Promise.all([
                queue.getActiveCount(),
                queue.getWaitingCount(),
                queue.getCompletedCount(),
                queue.getFailedCount(),
                queue.getDelayedCount()
            ]);
            return {
                active,
                waiting,
                completed,
                failed,
                delayed
            };
        } catch (error) {
            logging.error('Error getting queue stats', { error, name });
            throw error;
        }
    }
};

// Funções de monitoramento
const monitoringUtils = {
    // Monitora fila
    monitor: (name) => {
        try {
            const queue = queueUtils.get(name);
            queue.on('global:completed', (jobId, result) => {
                logging.info('Job completed', { name, jobId, result });
            });
            queue.on('global:failed', (jobId, error) => {
                logging.error('Job failed', { name, jobId, error });
            });
            queue.on('global:stalled', (jobId) => {
                logging.warn('Job stalled', { name, jobId });
            });
            queue.on('global:error', (error) => {
                logging.error('Queue error', { name, error });
            });
        } catch (error) {
            logging.error('Error monitoring queue', { error, name });
            throw error;
        }
    },

    // Obtém métricas da fila
    metrics: async (name) => {
        try {
            const queue = queueUtils.get(name);
            const stats = await queueUtils.getStats(name);
            const metrics = {
                ...stats,
                processing_rate: await queue.getJobCounts('active') / QUEUE_CONFIG.monitor.interval,
                failure_rate: await queue.getJobCounts('failed') / QUEUE_CONFIG.monitor.interval
            };
            return metrics;
        } catch (error) {
            logging.error('Error getting queue metrics', { error, name });
            throw error;
        }
    }
};

// Funções de saúde
const healthUtils = {
    // Verifica saúde da fila
    check: async (name) => {
        try {
            const queue = queueUtils.get(name);
            await queue.isReady();
            return true;
        } catch (error) {
            logging.error('Error checking queue health', { error, name });
            return false;
        }
    },

    // Obtém status da fila
    status: async (name) => {
        try {
            const health = await healthUtils.check(name);
            const metrics = await monitoringUtils.metrics(name);
            return {
                health,
                metrics,
                config: QUEUE_CONFIG
            };
        } catch (error) {
            logging.error('Error getting queue status', { error, name });
            throw error;
        }
    }
};

// Funções de limpeza
const cleanupUtils = {
    // Limpa filas
    cleanup: async () => {
        try {
            for (const [name, queue] of queues) {
                await queue.clean(QUEUE_CONFIG.default.removeOnComplete ? 0 : 3600000, 'completed');
                await queue.clean(QUEUE_CONFIG.default.removeOnFail ? 0 : 3600000, 'failed');
            }
            return true;
        } catch (error) {
            logging.error('Error cleaning up queues', { error });
            return false;
        }
    },

    // Agenda limpeza das filas
    scheduleCleanup: (interval = 3600000) => {
        setInterval(async () => {
            await cleanupUtils.cleanup();
        }, interval);
    }
};

// Funções de shutdown
const shutdownUtils = {
    // Fecha fila
    close: async (name) => {
        try {
            const queue = queueUtils.get(name);
            await queue.close();
            queues.delete(name);
            return true;
        } catch (error) {
            logging.error('Error closing queue', { error, name });
            return false;
        }
    },

    // Fecha todas as filas
    closeAll: async () => {
        try {
            for (const [name, queue] of queues) {
                await queue.close();
            }
            queues.clear();
            return true;
        } catch (error) {
            logging.error('Error closing all queues', { error });
            return false;
        }
    }
};

module.exports = {
    QUEUE_CONFIG,
    queueUtils,
    monitoringUtils,
    healthUtils,
    cleanupUtils,
    shutdownUtils
}; 