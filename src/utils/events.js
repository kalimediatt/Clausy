const EventEmitter = require('events');
const { promisify } = require('util');
const logging = require('./logger');
const config = require('../config/config');

// Configurações de eventos
const EVENTS_CONFIG = {
    maxListeners: 10,
    timeout: 5000,
    retries: 3,
    delay: 1000,
    monitor: {
        interval: 5000
    }
};

// Emissor de eventos
const emitter = new EventEmitter();
emitter.setMaxListeners(EVENTS_CONFIG.maxListeners);

// Funções de eventos
const eventUtils = {
    // Emite evento
    emit: async (event, data) => {
        try {
            emitter.emit(event, data);
            return true;
        } catch (error) {
            logging.error('Error emitting event', { error, event });
            return false;
        }
    },

    // Emite evento com retry
    emitWithRetry: async (event, data, options = {}) => {
        const {
            retries = EVENTS_CONFIG.retries,
            delay = EVENTS_CONFIG.delay,
            timeout = EVENTS_CONFIG.timeout
        } = options;

        let lastError;
        for (let i = 0; i < retries; i++) {
            try {
                await Promise.race([
                    eventUtils.emit(event, data),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Event timeout')), timeout)
                    )
                ]);
                return true;
            } catch (error) {
                lastError = error;
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    },

    // Escuta evento
    on: (event, handler) => {
        try {
            emitter.on(event, async (data) => {
                try {
                    await handler(data);
                } catch (error) {
                    logging.error('Error handling event', { error, event });
                }
            });
            return true;
        } catch (error) {
            logging.error('Error listening to event', { error, event });
            return false;
        }
    },

    // Escuta evento uma vez
    once: (event, handler) => {
        try {
            emitter.once(event, async (data) => {
                try {
                    await handler(data);
                } catch (error) {
                    logging.error('Error handling event', { error, event });
                }
            });
            return true;
        } catch (error) {
            logging.error('Error listening to event once', { error, event });
            return false;
        }
    },

    // Remove escuta de evento
    off: (event, handler) => {
        try {
            emitter.off(event, handler);
            return true;
        } catch (error) {
            logging.error('Error removing event listener', { error, event });
            return false;
        }
    },

    // Remove todas as escutas de evento
    removeAllListeners: (event) => {
        try {
            emitter.removeAllListeners(event);
            return true;
        } catch (error) {
            logging.error('Error removing all event listeners', { error, event });
            return false;
        }
    },

    // Obtém número de escutas de evento
    listenerCount: (event) => {
        try {
            return emitter.listenerCount(event);
        } catch (error) {
            logging.error('Error getting event listener count', { error, event });
            return 0;
        }
    },

    // Obtém escutas de evento
    listeners: (event) => {
        try {
            return emitter.listeners(event);
        } catch (error) {
            logging.error('Error getting event listeners', { error, event });
            return [];
        }
    },

    // Obtém eventos
    eventNames: () => {
        try {
            return emitter.eventNames();
        } catch (error) {
            logging.error('Error getting event names', { error });
            return [];
        }
    }
};

// Funções de monitoramento
const monitoringUtils = {
    // Monitora eventos
    monitor: () => {
        try {
            emitter.on('newListener', (event, listener) => {
                logging.info('New event listener', { event });
            });
            emitter.on('removeListener', (event, listener) => {
                logging.info('Removed event listener', { event });
            });
            emitter.on('error', (error) => {
                logging.error('Event error', { error });
            });
        } catch (error) {
            logging.error('Error monitoring events', { error });
            throw error;
        }
    },

    // Obtém métricas de eventos
    metrics: () => {
        try {
            const events = eventUtils.eventNames();
            const metrics = {
                total_events: events.length,
                total_listeners: events.reduce((count, event) => count + eventUtils.listenerCount(event), 0),
                events: events.reduce((acc, event) => {
                    acc[event] = {
                        listeners: eventUtils.listenerCount(event),
                        handlers: eventUtils.listeners(event).length
                    };
                    return acc;
                }, {})
            };
            return metrics;
        } catch (error) {
            logging.error('Error getting event metrics', { error });
            throw error;
        }
    }
};

// Funções de saúde
const healthUtils = {
    // Verifica saúde dos eventos
    check: () => {
        try {
            const metrics = monitoringUtils.metrics();
            return metrics.total_events >= 0;
        } catch (error) {
            logging.error('Error checking event health', { error });
            return false;
        }
    },

    // Obtém status dos eventos
    status: () => {
        try {
            const health = healthUtils.check();
            const metrics = monitoringUtils.metrics();
            return {
                health,
                metrics,
                config: EVENTS_CONFIG
            };
        } catch (error) {
            logging.error('Error getting event status', { error });
            throw error;
        }
    }
};

// Funções de limpeza
const cleanupUtils = {
    // Limpa eventos
    cleanup: () => {
        try {
            const events = eventUtils.eventNames();
            for (const event of events) {
                eventUtils.removeAllListeners(event);
            }
            return true;
        } catch (error) {
            logging.error('Error cleaning up events', { error });
            return false;
        }
    },

    // Agenda limpeza dos eventos
    scheduleCleanup: (interval = 3600000) => {
        setInterval(() => {
            cleanupUtils.cleanup();
        }, interval);
    }
};

// Funções de shutdown
const shutdownUtils = {
    // Fecha eventos
    close: () => {
        try {
            cleanupUtils.cleanup();
            return true;
        } catch (error) {
            logging.error('Error closing events', { error });
            return false;
        }
    }
};

module.exports = {
    EVENTS_CONFIG,
    eventUtils,
    monitoringUtils,
    healthUtils,
    cleanupUtils,
    shutdownUtils
}; 