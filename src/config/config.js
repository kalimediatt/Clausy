const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const logging = require('../utils/logger');

// Configurações padrão
const defaultConfig = {
    app: {
        name: 'clausy',
        env: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost',
        trustProxy: process.env.TRUST_PROXY || '127.0.0.1',
        cors: {
            origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Forwarded-For', 'X-Forwarded-Proto', 'Accept'],
            exposedHeaders: ['X-Total-Count', 'Authorization'],
            credentials: true,
            maxAge: 86400
        }
    },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'clausy',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true',
        pool: {
            min: 4,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            maxUses: 7500
        }
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || '',
        db: process.env.REDIS_DB || 0,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        }
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        dir: process.env.LOG_DIR || 'logs',
        maxSize: process.env.LOG_MAX_SIZE || '20m',
        maxFiles: process.env.LOG_MAX_FILES || 14,
        compress: process.env.LOG_COMPRESS !== 'false'
    },
    monitoring: {
        enabled: process.env.MONITORING_ENABLED !== 'false',
        interval: process.env.MONITORING_INTERVAL || 60000,
        thresholds: {
            cpu: process.env.CPU_THRESHOLD || 80,
            memory: process.env.MEMORY_THRESHOLD || 85,
            disk: process.env.DISK_THRESHOLD || 90,
            responseTime: process.env.RESPONSE_TIME_THRESHOLD || 1000,
            errorRate: process.env.ERROR_RATE_THRESHOLD || 5
        }
    },
    security: {
        rateLimit: {
            windowMs: process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000,
            max: process.env.RATE_LIMIT_MAX || 100
        },
        bcrypt: {
            saltRounds: process.env.BCRYPT_SALT_ROUNDS || 12
        },
        password: {
            minLength: process.env.PASSWORD_MIN_LENGTH || 8,
            requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
            requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
            requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
            requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false'
        }
    },
    cache: {
        ttl: process.env.CACHE_TTL || 3600,
        maxSize: process.env.CACHE_MAX_SIZE || '200mb',
        compression: process.env.CACHE_COMPRESSION !== 'false'
    },
    file: {
        maxSize: process.env.FILE_MAX_SIZE || 50 * 1024 * 1024,
        allowedTypes: process.env.FILE_ALLOWED_TYPES ? 
            process.env.FILE_ALLOWED_TYPES.split(',') : 
            ['.txt', '.pdf', '.doc', '.docx'],
        tempDir: process.env.FILE_TEMP_DIR || 'temp',
        cleanupInterval: process.env.FILE_CLEANUP_INTERVAL || 24 * 60 * 60 * 1000
    }
};

// Esquema de validação
const configSchema = {
    app: {
        name: 'string',
        env: ['development', 'production', 'test'],
        port: 'number',
        host: 'string',
        trustProxy: 'string',
        cors: {
            origin: ['string', 'array'],
            methods: 'array',
            allowedHeaders: 'array',
            exposedHeaders: 'array',
            credentials: 'boolean',
            maxAge: 'number'
        }
    },
    db: {
        host: 'string',
        port: 'number',
        name: 'string',
        user: 'string',
        password: 'string',
        ssl: 'boolean',
        pool: {
            min: 'number',
            max: 'number',
            idleTimeoutMillis: 'number',
            connectionTimeoutMillis: 'number',
            maxUses: 'number'
        }
    },
    redis: {
        host: 'string',
        port: 'number',
        password: 'string',
        db: 'number',
        maxRetriesPerRequest: 'number',
        enableReadyCheck: 'boolean',
        retryStrategy: 'function'
    },
    jwt: {
        secret: 'string',
        expiresIn: 'string',
        refreshExpiresIn: 'string'
    },
    logging: {
        level: ['debug', 'info', 'warn', 'error'],
        dir: 'string',
        maxSize: 'string',
        maxFiles: 'number',
        compress: 'boolean'
    },
    monitoring: {
        enabled: 'boolean',
        interval: 'number',
        thresholds: {
            cpu: 'number',
            memory: 'number',
            disk: 'number',
            responseTime: 'number',
            errorRate: 'number'
        }
    },
    security: {
        rateLimit: {
            windowMs: 'number',
            max: 'number'
        },
        bcrypt: {
            saltRounds: 'number'
        },
        password: {
            minLength: 'number',
            requireUppercase: 'boolean',
            requireLowercase: 'boolean',
            requireNumbers: 'boolean',
            requireSpecialChars: 'boolean'
        }
    },
    cache: {
        ttl: 'number',
        maxSize: 'string',
        compression: 'boolean'
    },
    file: {
        maxSize: 'number',
        allowedTypes: 'array',
        tempDir: 'string',
        cleanupInterval: 'number'
    }
};

// Função para validar tipo
function validateType(value, type) {
    if (Array.isArray(type)) {
        return type.includes(value);
    }
    
    switch (type) {
        case 'string':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number' && !isNaN(value);
        case 'boolean':
            return typeof value === 'boolean';
        case 'array':
            return Array.isArray(value);
        case 'function':
            return typeof value === 'function';
        default:
            return false;
    }
}

// Função para validar objeto
function validateObject(obj, schema) {
    for (const [key, type] of Object.entries(schema)) {
        if (!(key in obj)) {
            throw new Error(`Missing required config key: ${key}`);
        }
        
        if (typeof type === 'object' && !Array.isArray(type)) {
            validateObject(obj[key], type);
        } else if (!validateType(obj[key], type)) {
            throw new Error(`Invalid type for config key ${key}: ${typeof obj[key]}`);
        }
    }
}

// Função para carregar configuração do arquivo
function loadConfigFile(filePath) {
    try {
        const ext = path.extname(filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        
        switch (ext) {
            case '.json':
                return JSON.parse(content);
            case '.yaml':
            case '.yml':
                return yaml.load(content);
            default:
                throw new Error(`Unsupported config file format: ${ext}`);
        }
    } catch (error) {
        logging.error('Error loading config file', error);
        return {};
    }
}

// Função para mesclar configurações
function mergeConfigs(base, override) {
    const result = { ...base };
    
    for (const [key, value] of Object.entries(override)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            result[key] = mergeConfigs(result[key] || {}, value);
        } else {
            result[key] = value;
        }
    }
    
    return result;
}

// Carregar configuração
let config = { ...defaultConfig };

// Carregar configuração do arquivo
const configPath = process.env.CONFIG_PATH || path.join(__dirname, '../../config');
const env = process.env.NODE_ENV || 'development';

try {
    // Carregar configuração base
    const baseConfig = loadConfigFile(path.join(configPath, 'config.yaml'));
    
    // Carregar configuração específica do ambiente
    const envConfig = loadConfigFile(path.join(configPath, `config.${env}.yaml`));
    
    // Mesclar configurações
    config = mergeConfigs(config, baseConfig);
    config = mergeConfigs(config, envConfig);
    
    // Validar configuração
    validateObject(config, configSchema);
    
    logging.info('Configuration loaded successfully', {
        env: config.app.env,
        configPath
    });
} catch (error) {
    logging.error('Error loading configuration', error);
    process.exit(1);
}

// Função para obter configuração
function get(key) {
    return key.split('.').reduce((obj, k) => obj && obj[k], config);
}

// Função para definir configuração
function set(key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    const obj = keys.reduce((o, k) => o[k] = o[k] || {}, config);
    obj[lastKey] = value;
}

// Função para recarregar configuração
function reload() {
    try {
        const baseConfig = loadConfigFile(path.join(configPath, 'config.yaml'));
        const envConfig = loadConfigFile(path.join(configPath, `config.${env}.yaml`));
        
        config = mergeConfigs(defaultConfig, baseConfig);
        config = mergeConfigs(config, envConfig);
        
        validateObject(config, configSchema);
        
        logging.info('Configuration reloaded successfully');
        return true;
    } catch (error) {
        logging.error('Error reloading configuration', error);
        return false;
    }
}

// Exportar interface de configuração
module.exports = {
    get,
    set,
    reload,
    config
}; 