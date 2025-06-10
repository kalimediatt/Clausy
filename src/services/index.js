const fs = require('fs');
const path = require('path');
const logging = require('../utils/logger');
const config = require('../config/config');

class ServiceManager {
    constructor() {
        this.services = new Map();
        this.initialized = false;
        this.shuttingDown = false;
    }

    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            // Carrega todos os serviços do diretório
            const serviceFiles = fs.readdirSync(__dirname)
                .filter(file => file.endsWith('.service.js'));

            for (const file of serviceFiles) {
                const serviceName = path.basename(file, '.service.js');
                const service = require(path.join(__dirname, file));

                if (typeof service.initialize === 'function') {
                    await service.initialize();
                }

                this.services.set(serviceName, service);
                logging.info(`Service initialized: ${serviceName}`);
            }

            this.initialized = true;
            logging.info('All services initialized successfully');
        } catch (error) {
            logging.error('Error initializing services', error);
            throw error;
        }
    }

    async shutdown() {
        if (this.shuttingDown) {
            return;
        }

        this.shuttingDown = true;
        logging.info('Starting service shutdown...');

        try {
            // Desliga os serviços na ordem inversa de inicialização
            const services = Array.from(this.services.entries()).reverse();

            for (const [name, service] of services) {
                if (typeof service.shutdown === 'function') {
                    await service.shutdown();
                    logging.info(`Service shut down: ${name}`);
                }
            }

            this.services.clear();
            this.initialized = false;
            this.shuttingDown = false;
            logging.info('All services shut down successfully');
        } catch (error) {
            logging.error('Error during service shutdown', error);
            throw error;
        }
    }

    getService(name) {
        if (!this.initialized) {
            throw new Error('Service manager not initialized');
        }

        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service not found: ${name}`);
        }

        return service;
    }

    async healthCheck() {
        if (!this.initialized) {
            return {
                status: 'not_initialized',
                services: []
            };
        }

        const health = {
            status: 'ok',
            services: []
        };

        for (const [name, service] of this.services) {
            try {
                const serviceHealth = typeof service.healthCheck === 'function'
                    ? await service.healthCheck()
                    : { status: 'unknown' };

                health.services.push({
                    name,
                    ...serviceHealth
                });

                if (serviceHealth.status !== 'ok') {
                    health.status = 'degraded';
                }
            } catch (error) {
                health.services.push({
                    name,
                    status: 'error',
                    error: error.message
                });
                health.status = 'error';
            }
        }

        return health;
    }

    async restartService(name) {
        if (!this.initialized) {
            throw new Error('Service manager not initialized');
        }

        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service not found: ${name}`);
        }

        try {
            if (typeof service.shutdown === 'function') {
                await service.shutdown();
            }

            const serviceModule = require(path.join(__dirname, `${name}.service.js`));
            if (typeof serviceModule.initialize === 'function') {
                await serviceModule.initialize();
            }

            this.services.set(name, serviceModule);
            logging.info(`Service restarted: ${name}`);
        } catch (error) {
            logging.error(`Error restarting service: ${name}`, error);
            throw error;
        }
    }
}

// Cria uma única instância do gerenciador de serviços
const serviceManager = new ServiceManager();

// Configura o desligamento gracioso
process.on('SIGTERM', async () => {
    logging.info('Received SIGTERM signal');
    await serviceManager.shutdown();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logging.info('Received SIGINT signal');
    await serviceManager.shutdown();
    process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', async (error) => {
    logging.error('Uncaught exception', error);
    await serviceManager.shutdown();
    process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
    logging.error('Unhandled rejection', { reason, promise });
    await serviceManager.shutdown();
    process.exit(1);
});

module.exports = serviceManager; 