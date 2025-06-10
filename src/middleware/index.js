const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const { promisify } = require('util');
const config = require('../config/config');
const logging = require('../utils/logger');
const security = require('../utils/security');
const { errorHandler } = require('../utils/errors');

// Middleware de segurança
const securityMiddleware = {
    // Configuração do Helmet
    helmet: helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        },
        crossOriginEmbedderPolicy: true,
        crossOriginOpenerPolicy: true,
        crossOriginResourcePolicy: { policy: 'same-site' },
        dnsPrefetchControl: { allow: false },
        frameguard: { action: 'deny' },
        hidePoweredBy: true,
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        },
        ieNoOpen: true,
        noSniff: true,
        originAgentCluster: true,
        permittedCrossDomainPolicies: { permittedPolicies: 'none' },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        xssFilter: true
    }),

    // Configuração do CORS
    cors: cors({
        origin: config.get('security.cors.origin'),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        credentials: true,
        maxAge: 86400
    }),

    // Configuração do Rate Limit
    rateLimit: rateLimit({
        windowMs: config.get('security.rateLimit.windowMs'),
        max: config.get('security.rateLimit.max'),
        message: 'Too many requests from this IP, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => req.path === '/health'
    })
};

// Middleware de compressão
const compressionMiddleware = compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024
});

// Middleware de logging
const loggingMiddleware = {
    // Configuração do Morgan
    morgan: morgan('combined', {
        stream: {
            write: (message) => {
                logging.info(message.trim());
            }
        }
    }),

    // Logging de requisição
    requestLogger: (req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            logging.info('Request completed', {
                method: req.method,
                path: req.path,
                status: res.statusCode,
                duration,
                ip: req.ip,
                userAgent: req.get('user-agent')
            });
        });
        next();
    },

    // Logging de erro
    errorLogger: (err, req, res, next) => {
        logging.error('Request error', {
            error: err.message,
            stack: err.stack,
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });
        next(err);
    }
};

// Middleware de validação
const validationMiddleware = {
    // Validação de corpo
    validateBody: (schema) => {
        return async (req, res, next) => {
            try {
                await schema.validateAsync(req.body, { abortEarly: false });
                next();
            } catch (error) {
                next(error);
            }
        };
    },

    // Validação de parâmetros
    validateParams: (schema) => {
        return async (req, res, next) => {
            try {
                await schema.validateAsync(req.params, { abortEarly: false });
                next();
            } catch (error) {
                next(error);
            }
        };
    },

    // Validação de query
    validateQuery: (schema) => {
        return async (req, res, next) => {
            try {
                await schema.validateAsync(req.query, { abortEarly: false });
                next();
            } catch (error) {
                next(error);
            }
        };
    }
};

// Middleware de autenticação
const authMiddleware = {
    // Verifica token
    verifyToken: async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ message: 'No token provided' });
            }

            const decoded = await security.jwtUtils.verifyToken(token);
            req.user = decoded;
            next();
        } catch (error) {
            next(error);
        }
    },

    // Verifica permissões
    checkPermissions: (permissions) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            const hasPermission = permissions.every(permission =>
                req.user.permissions.includes(permission)
            );

            if (!hasPermission) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }

            next();
        };
    },

    // Verifica roles
    checkRoles: (roles) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            if (!roles.includes(req.user.role)) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }

            next();
        };
    }
};

// Middleware de sanitização
const sanitizationMiddleware = {
    // Sanitiza corpo
    sanitizeBody: (req, res, next) => {
        req.body = security.sanitization.sanitizeObject(req.body);
        next();
    },

    // Sanitiza parâmetros
    sanitizeParams: (req, res, next) => {
        req.params = security.sanitization.sanitizeObject(req.params);
        next();
    },

    // Sanitiza query
    sanitizeQuery: (req, res, next) => {
        req.query = security.sanitization.sanitizeObject(req.query);
        next();
    }
};

// Middleware de cache
const cacheMiddleware = {
    // Cache de resposta
    responseCache: (duration) => {
        return async (req, res, next) => {
            if (req.method !== 'GET') {
                return next();
            }

            const key = `cache:${req.originalUrl}`;
            const cached = await config.get('cache').get(key);

            if (cached) {
                return res.json(cached);
            }

            res.sendResponse = res.json;
            res.json = (body) => {
                config.get('cache').set(key, body, duration);
                res.sendResponse(body);
            };

            next();
        };
    }
};

// Middleware de monitoramento
const monitoringMiddleware = {
    // Monitora tempo de resposta
    responseTime: (req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            config.get('monitor').recordResponseTime(req.path, duration);
        });
        next();
    },

    // Monitora uso de memória
    memoryUsage: (req, res, next) => {
        const usage = process.memoryUsage();
        config.get('monitor').recordMemoryUsage(usage);
        next();
    },

    // Monitora erros
    errorMonitoring: (err, req, res, next) => {
        config.get('monitor').recordError(err);
        next(err);
    }
};

// Middleware de performance
const performanceMiddleware = {
    // Timeout de requisição
    requestTimeout: (timeout) => {
        return (req, res, next) => {
            res.setTimeout(timeout, () => {
                next(new Error('Request timeout'));
            });
            next();
        };
    },

    // Limite de tamanho de corpo
    bodySizeLimit: (limit) => {
        return (req, res, next) => {
            if (req.headers['content-length'] > limit) {
                return res.status(413).json({ message: 'Request entity too large' });
            }
            next();
        };
    }
};

// Middleware de manutenção
const maintenanceMiddleware = {
    // Modo de manutenção
    maintenanceMode: (req, res, next) => {
        if (config.get('maintenance.enabled')) {
            return res.status(503).json({
                message: 'Service temporarily unavailable for maintenance',
                estimatedTime: config.get('maintenance.estimatedTime')
            });
        }
        next();
    }
};

// Aplica todos os middlewares
function applyMiddlewares(app) {
    // Segurança
    app.use(securityMiddleware.helmet);
    app.use(securityMiddleware.cors);
    app.use(securityMiddleware.rateLimit);

    // Compressão
    app.use(compressionMiddleware);

    // Logging
    app.use(loggingMiddleware.morgan);
    app.use(loggingMiddleware.requestLogger);

    // Sanitização
    app.use(sanitizationMiddleware.sanitizeBody);
    app.use(sanitizationMiddleware.sanitizeParams);
    app.use(sanitizationMiddleware.sanitizeQuery);

    // Monitoramento
    app.use(monitoringMiddleware.responseTime);
    app.use(monitoringMiddleware.memoryUsage);

    // Performance
    app.use(performanceMiddleware.requestTimeout(30000));
    app.use(performanceMiddleware.bodySizeLimit('10mb'));

    // Manutenção
    app.use(maintenanceMiddleware.maintenanceMode);

    // Tratamento de erros
    app.use(loggingMiddleware.errorLogger);
    app.use(monitoringMiddleware.errorMonitoring);
    app.use(errorHandler);
}

module.exports = {
    securityMiddleware,
    compressionMiddleware,
    loggingMiddleware,
    validationMiddleware,
    authMiddleware,
    sanitizationMiddleware,
    cacheMiddleware,
    monitoringMiddleware,
    performanceMiddleware,
    maintenanceMiddleware,
    applyMiddlewares
}; 