const winston = require('winston');
const { createStream } = require('rotating-file-stream');
const path = require('path');
const os = require('os');

// Configurações
const LOG_DIR = path.join(__dirname, '../../logs');
const MAX_LOG_SIZE = '20M';
const MAX_LOG_FILES = 14;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const isVercel = process.env.VERCEL === '1';

// Criar diretório de logs se não existir apenas se não estiver na Vercel
const fs = require('fs');
if (!isVercel && !fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Formatos personalizados
const formats = {
    console: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
            let msg = `${timestamp} [${level}]: ${message}`;
            if (Object.keys(metadata).length > 0) {
                msg += ` ${JSON.stringify(metadata)}`;
            }
            return msg;
        })
    ),
    file: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    )
};

// Configurar streams de arquivo (apenas se não estiver na Vercel)
const streams = isVercel ? {} : {
    error: createStream('error.log', {
        interval: '1d',
        path: LOG_DIR,
        maxSize: MAX_LOG_SIZE,
        maxFiles: MAX_LOG_FILES,
        compress: true
    }),
    combined: createStream('combined.log', {
        interval: '1d',
        path: LOG_DIR,
        maxSize: MAX_LOG_SIZE,
        maxFiles: MAX_LOG_FILES,
        compress: true
    }),
    access: createStream('access.log', {
        interval: '1d',
        path: LOG_DIR,
        maxSize: MAX_LOG_SIZE,
        maxFiles: MAX_LOG_FILES,
        compress: true
    }),
    request: createStream('requests.log', {
        interval: '1d',
        path: LOG_DIR,
        maxSize: '20M',
        maxFiles: 14
    })
};

// Configurar transportes
const transports = [
    // Console para todos os ambientes
    new winston.transports.Console({
        format: formats.console,
        level: LOG_LEVEL
    })
];

if (!isVercel) {
    // Adicionar transportes de arquivo apenas localmente
    transports.push(
        new winston.transports.Stream({
            stream: streams.error,
            format: formats.file,
            level: 'error'
        }),
        new winston.transports.Stream({
            stream: streams.combined,
            format: formats.file,
            level: LOG_LEVEL
        })
    );
}

// Criar logger
const logger = winston.createLogger({
    level: LOG_LEVEL,
    format: formats.file,
    defaultMeta: { 
        service: 'clausy',
        hostname: os.hostname(),
        pid: process.pid
    },
    transports,
    // Não sair em caso de erro
    exitOnError: false
});

if (!isVercel) {
    // Adicionar handler para erros não capturados apenas localmente
    logger.exceptions.handle(
        new winston.transports.Stream({
            stream: streams.error,
            format: formats.file
        })
    );

    // Adicionar handler para rejeições não capturadas apenas localmente
    logger.rejections.handle(
        new winston.transports.Stream({
            stream: streams.error,
            format: formats.file
        })
    );
}

// Funções de log com contexto
const logWithContext = (level, message, context = {}) => {
    const metadata = {
        ...context,
        timestamp: new Date().toISOString()
    };
    
    logger.log(level, message, metadata);
};

// Interface de logging
const logging = {
    // Log de erro
    error(message, error = null, context = {}) {
        const metadata = {
            ...context,
            error: error ? {
                message: error.message,
                stack: error.stack,
                code: error.code
            } : null
        };
        
        logWithContext('error', message, metadata);
    },
    
    // Log de aviso
    warn(message, context = {}) {
        logWithContext('warn', message, context);
    },
    
    // Log de informação
    info(message, context = {}) {
        logWithContext('info', message, context);
    },
    
    // Log de debug
    debug(message, context = {}) {
        logWithContext('debug', message, context);
    },
    
    // Log de acesso HTTP
    access(req, res, responseTime) {
        const metadata = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            responseTime,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };
        
        logWithContext('info', 'HTTP Request', metadata);
    },
    
    // Log de performance
    performance(operation, duration, context = {}) {
        const metadata = {
            ...context,
            operation,
            duration
        };
        
        if (duration > 1000) {
            logWithContext('warn', 'Slow operation', metadata);
        } else {
            logWithContext('debug', 'Operation completed', metadata);
        }
    },
    
    // Log de segurança
    security(event, context = {}) {
        const metadata = {
            ...context,
            event
        };
        
        logWithContext('warn', 'Security event', metadata);
    },
    
    // Log de banco de dados
    database(operation, query, duration, context = {}) {
        const metadata = {
            ...context,
            operation,
            query,
            duration
        };
        
        if (duration > 1000) {
            logWithContext('warn', 'Slow database operation', metadata);
        } else {
            logWithContext('debug', 'Database operation', metadata);
        }
    },
    
    // Log de cache
    cache(operation, key, hit, duration, context = {}) {
        const metadata = {
            ...context,
            operation,
            key,
            hit,
            duration
        };
        
        logWithContext('debug', 'Cache operation', metadata);
    },
    
    // Log de sistema
    system(event, context = {}) {
        const metadata = {
            ...context,
            event,
            memory: process.memoryUsage(),
            cpu: process.cpuUsage()
        };
        
        logWithContext('info', 'System event', metadata);
    }
};

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('Shutting down logger...');
    logger.end();
});

module.exports = logging; 