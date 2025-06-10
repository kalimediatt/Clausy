const logging = require('./logger');

// Códigos de erro
const ErrorCodes = {
    // Erros de autenticação (1000-1999)
    AUTHENTICATION_FAILED: 1000,
    INVALID_TOKEN: 1001,
    TOKEN_EXPIRED: 1002,
    INSUFFICIENT_PERMISSIONS: 1003,
    INVALID_CREDENTIALS: 1004,
    ACCOUNT_LOCKED: 1005,
    INVALID_REFRESH_TOKEN: 1006,

    // Erros de validação (2000-2999)
    VALIDATION_ERROR: 2000,
    INVALID_INPUT: 2001,
    MISSING_REQUIRED_FIELD: 2002,
    INVALID_FORMAT: 2003,
    INVALID_LENGTH: 2004,
    INVALID_TYPE: 2005,
    INVALID_RANGE: 2006,

    // Erros de recurso (3000-3999)
    RESOURCE_NOT_FOUND: 3000,
    RESOURCE_ALREADY_EXISTS: 3001,
    RESOURCE_LOCKED: 3002,
    RESOURCE_EXPIRED: 3003,
    RESOURCE_DELETED: 3004,
    RESOURCE_IN_USE: 3005,

    // Erros de banco de dados (4000-4999)
    DATABASE_ERROR: 4000,
    CONNECTION_ERROR: 4001,
    QUERY_ERROR: 4002,
    TRANSACTION_ERROR: 4003,
    DUPLICATE_ENTRY: 4004,
    FOREIGN_KEY_VIOLATION: 4005,

    // Erros de cache (5000-5999)
    CACHE_ERROR: 5000,
    CACHE_CONNECTION_ERROR: 5001,
    CACHE_KEY_NOT_FOUND: 5002,
    CACHE_WRITE_ERROR: 5003,
    CACHE_READ_ERROR: 5004,

    // Erros de arquivo (6000-6999)
    FILE_ERROR: 6000,
    FILE_NOT_FOUND: 6001,
    FILE_ACCESS_DENIED: 6002,
    FILE_TOO_LARGE: 6003,
    INVALID_FILE_TYPE: 6004,
    FILE_UPLOAD_ERROR: 6005,
    FILE_DELETE_ERROR: 6006,

    // Erros de sistema (7000-7999)
    SYSTEM_ERROR: 7000,
    CONFIGURATION_ERROR: 7001,
    SERVICE_ERROR: 7002,
    MEMORY_ERROR: 7003,
    CPU_ERROR: 7004,
    DISK_ERROR: 7005,
    NETWORK_ERROR: 7006,

    // Erros de API (8000-8999)
    API_ERROR: 8000,
    RATE_LIMIT_EXCEEDED: 8001,
    TIMEOUT_ERROR: 8002,
    BAD_REQUEST: 8003,
    UNAUTHORIZED: 8004,
    FORBIDDEN: 8005,
    NOT_FOUND: 8006,
    METHOD_NOT_ALLOWED: 8007,
    CONFLICT: 8008,
    TOO_MANY_REQUESTS: 8009,
    INTERNAL_SERVER_ERROR: 8010
};

// Classe base para erros personalizados
class AppError extends Error {
    constructor(message, code, status = 500, details = null) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.status = status;
        this.details = details;
        this.timestamp = new Date();
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
        logging.error(this.message, {
            code: this.code,
            status: this.status,
            details: this.details,
            stack: this.stack
        });
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            status: this.status,
            details: this.details,
            timestamp: this.timestamp
        };
    }
}

// Erros de autenticação
class AuthenticationError extends AppError {
    constructor(message, code = ErrorCodes.AUTHENTICATION_FAILED, details = null) {
        super(message, code, 401, details);
    }
}

class InvalidTokenError extends AuthenticationError {
    constructor(message = 'Invalid token', details = null) {
        super(message, ErrorCodes.INVALID_TOKEN, details);
    }
}

class TokenExpiredError extends AuthenticationError {
    constructor(message = 'Token expired', details = null) {
        super(message, ErrorCodes.TOKEN_EXPIRED, details);
    }
}

class InsufficientPermissionsError extends AuthenticationError {
    constructor(message = 'Insufficient permissions', details = null) {
        super(message, ErrorCodes.INSUFFICIENT_PERMISSIONS, details);
    }
}

// Erros de validação
class ValidationError extends AppError {
    constructor(message, code = ErrorCodes.VALIDATION_ERROR, details = null) {
        super(message, code, 400, details);
    }
}

class InvalidInputError extends ValidationError {
    constructor(message = 'Invalid input', details = null) {
        super(message, ErrorCodes.INVALID_INPUT, details);
    }
}

class MissingRequiredFieldError extends ValidationError {
    constructor(field, details = null) {
        super(`Missing required field: ${field}`, ErrorCodes.MISSING_REQUIRED_FIELD, details);
    }
}

// Erros de recurso
class ResourceError extends AppError {
    constructor(message, code = ErrorCodes.RESOURCE_ERROR, details = null) {
        super(message, code, 404, details);
    }
}

class ResourceNotFoundError extends ResourceError {
    constructor(resource, id, details = null) {
        super(`${resource} not found: ${id}`, ErrorCodes.RESOURCE_NOT_FOUND, details);
    }
}

class ResourceAlreadyExistsError extends ResourceError {
    constructor(resource, id, details = null) {
        super(`${resource} already exists: ${id}`, ErrorCodes.RESOURCE_ALREADY_EXISTS, details);
    }
}

// Erros de banco de dados
class DatabaseError extends AppError {
    constructor(message, code = ErrorCodes.DATABASE_ERROR, details = null) {
        super(message, code, 500, details);
    }
}

class ConnectionError extends DatabaseError {
    constructor(message = 'Database connection error', details = null) {
        super(message, ErrorCodes.CONNECTION_ERROR, details);
    }
}

class QueryError extends DatabaseError {
    constructor(message = 'Database query error', details = null) {
        super(message, ErrorCodes.QUERY_ERROR, details);
    }
}

// Erros de cache
class CacheError extends AppError {
    constructor(message, code = ErrorCodes.CACHE_ERROR, details = null) {
        super(message, code, 500, details);
    }
}

class CacheConnectionError extends CacheError {
    constructor(message = 'Cache connection error', details = null) {
        super(message, ErrorCodes.CACHE_CONNECTION_ERROR, details);
    }
}

class CacheKeyNotFoundError extends CacheError {
    constructor(key, details = null) {
        super(`Cache key not found: ${key}`, ErrorCodes.CACHE_KEY_NOT_FOUND, details);
    }
}

// Erros de arquivo
class FileError extends AppError {
    constructor(message, code = ErrorCodes.FILE_ERROR, details = null) {
        super(message, code, 500, details);
    }
}

class FileNotFoundError extends FileError {
    constructor(path, details = null) {
        super(`File not found: ${path}`, ErrorCodes.FILE_NOT_FOUND, details);
    }
}

class FileAccessDeniedError extends FileError {
    constructor(path, details = null) {
        super(`Access denied to file: ${path}`, ErrorCodes.FILE_ACCESS_DENIED, details);
    }
}

// Erros de sistema
class SystemError extends AppError {
    constructor(message, code = ErrorCodes.SYSTEM_ERROR, details = null) {
        super(message, code, 500, details);
    }
}

class ConfigurationError extends SystemError {
    constructor(message = 'Configuration error', details = null) {
        super(message, ErrorCodes.CONFIGURATION_ERROR, details);
    }
}

class ServiceError extends SystemError {
    constructor(message = 'Service error', details = null) {
        super(message, ErrorCodes.SERVICE_ERROR, details);
    }
}

// Erros de API
class APIError extends AppError {
    constructor(message, code = ErrorCodes.API_ERROR, details = null) {
        super(message, code, 500, details);
    }
}

class RateLimitExceededError extends APIError {
    constructor(message = 'Rate limit exceeded', details = null) {
        super(message, ErrorCodes.RATE_LIMIT_EXCEEDED, details);
    }
}

class TimeoutError extends APIError {
    constructor(message = 'Request timeout', details = null) {
        super(message, ErrorCodes.TIMEOUT_ERROR, details);
    }
}

// Função para converter erros do sistema em erros da aplicação
function handleError(error) {
    if (error instanceof AppError) {
        return error;
    }

    // Erros do Node.js
    if (error instanceof TypeError) {
        return new ValidationError(error.message);
    }

    if (error instanceof RangeError) {
        return new ValidationError(error.message);
    }

    // Erros do banco de dados
    if (error.code === '23505') { // PostgreSQL unique violation
        return new ResourceAlreadyExistsError('Resource', error.detail);
    }

    if (error.code === '23503') { // PostgreSQL foreign key violation
        return new ValidationError('Foreign key violation', ErrorCodes.FOREIGN_KEY_VIOLATION);
    }

    // Erros de rede
    if (error.code === 'ECONNREFUSED') {
        return new ConnectionError('Connection refused');
    }

    if (error.code === 'ETIMEDOUT') {
        return new TimeoutError('Connection timeout');
    }

    // Erros de arquivo
    if (error.code === 'ENOENT') {
        return new FileNotFoundError(error.path);
    }

    if (error.code === 'EACCES') {
        return new FileAccessDeniedError(error.path);
    }

    // Erro genérico
    return new SystemError(error.message);
}

// Middleware de erro para Express
function errorHandler(err, req, res, next) {
    const error = handleError(err);
    
    // Log do erro
    logging.error(error.message, {
        code: error.code,
        status: error.status,
        details: error.details,
        stack: error.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    // Resposta ao cliente
    res.status(error.status).json({
        error: {
            name: error.name,
            message: error.message,
            code: error.code,
            details: error.details
        }
    });
}

module.exports = {
    ErrorCodes,
    AppError,
    AuthenticationError,
    InvalidTokenError,
    TokenExpiredError,
    InsufficientPermissionsError,
    ValidationError,
    InvalidInputError,
    MissingRequiredFieldError,
    ResourceError,
    ResourceNotFoundError,
    ResourceAlreadyExistsError,
    DatabaseError,
    ConnectionError,
    QueryError,
    CacheError,
    CacheConnectionError,
    CacheKeyNotFoundError,
    FileError,
    FileNotFoundError,
    FileAccessDeniedError,
    SystemError,
    ConfigurationError,
    ServiceError,
    APIError,
    RateLimitExceededError,
    TimeoutError,
    handleError,
    errorHandler
}; 