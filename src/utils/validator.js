const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('./errors');

// Regras de validação comuns
const commonRules = {
    id: param('id').isInt().withMessage('ID must be an integer'),
    page: query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    limit: query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    sort: query('sort').optional().isIn(['asc', 'desc']).withMessage('Sort must be either asc or desc'),
    search: query('search').optional().isString().trim().isLength({ min: 2 }).withMessage('Search must be at least 2 characters')
};

// Regras de validação de usuário
const userRules = {
    name: body('name')
        .isString()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s]*$/)
        .withMessage('Name can only contain letters and spaces'),

    email: body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Must be a valid email address'),

    password: body('password')
        .isString()
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),

    role: body('role')
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('Role must be either user or admin'),

    status: body('status')
        .optional()
        .isIn(['active', 'inactive', 'suspended'])
        .withMessage('Status must be either active, inactive or suspended')
};

// Regras de validação de arquivo
const fileRules = {
    file: body('file')
        .custom((value, { req }) => {
            if (!req.files || !req.files.file) {
                throw new Error('No file uploaded');
            }
            return true;
        })
        .custom((value, { req }) => {
            const file = req.files.file;
            const maxSize = 50 * 1024 * 1024; // 50MB
            if (file.size > maxSize) {
                throw new Error('File size must be less than 50MB');
            }
            return true;
        })
        .custom((value, { req }) => {
            const file = req.files.file;
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.mimetype)) {
                throw new Error('File type not allowed');
            }
            return true;
        }),

    filename: body('filename')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Filename must be between 1 and 255 characters')
        .matches(/^[a-zA-Z0-9\-\_\.]+$/)
        .withMessage('Filename can only contain letters, numbers, hyphens, underscores and dots'),

    description: body('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters')
};

// Regras de validação de autenticação
const authRules = {
    email: body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Must be a valid email address'),

    password: body('password')
        .isString()
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),

    refreshToken: body('refreshToken')
        .isString()
        .notEmpty()
        .withMessage('Refresh token is required')
};

// Regras de validação de configuração
const configRules = {
    key: body('key')
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Key must be between 1 and 100 characters')
        .matches(/^[a-zA-Z0-9\-\_\.]+$/)
        .withMessage('Key can only contain letters, numbers, hyphens, underscores and dots'),

    value: body('value')
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Value must be less than 1000 characters'),

    type: body('type')
        .isIn(['string', 'number', 'boolean', 'json', 'array'])
        .withMessage('Type must be one of: string, number, boolean, json, array')
};

// Função para validar resultados
function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', null, errors.array());
    }
    next();
}

// Função para validar esquema
function validateSchema(schema) {
    return async (req, res, next) => {
        try {
            await schema.validateAsync(req.body, { abortEarly: false });
            next();
        } catch (error) {
            if (error.isJoi) {
                const validationError = new ValidationError('Validation failed', null, error.details);
                next(validationError);
            } else {
                next(error);
            }
        }
    };
}

// Função para validar tipo
function validateType(value, type) {
    switch (type) {
        case 'string':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number' && !isNaN(value);
        case 'boolean':
            return typeof value === 'boolean';
        case 'array':
            return Array.isArray(value);
        case 'object':
            return typeof value === 'object' && value !== null && !Array.isArray(value);
        case 'date':
            return value instanceof Date && !isNaN(value);
        case 'email':
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        case 'url':
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        case 'uuid':
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
        case 'ip':
            return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value);
        case 'phone':
            return /^\+?[1-9]\d{1,14}$/.test(value);
        case 'password':
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
        default:
            return false;
    }
}

// Função para validar objeto
function validateObject(obj, schema) {
    const errors = [];

    for (const [key, rules] of Object.entries(schema)) {
        const value = obj[key];

        if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push({
                field: key,
                message: `${key} is required`
            });
            continue;
        }

        if (value !== undefined && value !== null) {
            if (rules.type && !validateType(value, rules.type)) {
                errors.push({
                    field: key,
                    message: `${key} must be of type ${rules.type}`
                });
            }

            if (rules.min !== undefined && value.length < rules.min) {
                errors.push({
                    field: key,
                    message: `${key} must be at least ${rules.min} characters`
                });
            }

            if (rules.max !== undefined && value.length > rules.max) {
                errors.push({
                    field: key,
                    message: `${key} must be at most ${rules.max} characters`
                });
            }

            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push({
                    field: key,
                    message: `${key} has invalid format`
                });
            }

            if (rules.enum && !rules.enum.includes(value)) {
                errors.push({
                    field: key,
                    message: `${key} must be one of: ${rules.enum.join(', ')}`
                });
            }
        }
    }

    return errors;
}

module.exports = {
    commonRules,
    userRules,
    fileRules,
    authRules,
    configRules,
    validate,
    validateSchema,
    validateType,
    validateObject
}; 