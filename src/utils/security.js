const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../config/config');
const logging = require('./logger');

// Configurações de segurança
const SECURITY_CONFIG = {
    // Criptografia
    encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16,
        saltLength: 64,
        tagLength: 16,
        iterations: 100000
    },

    // Hash
    hash: {
        saltRounds: 12,
        minLength: 8
    },

    // JWT
    jwt: {
        algorithm: 'HS512',
        expiresIn: '1h',
        refreshExpiresIn: '7d',
        issuer: 'clausy',
        audience: 'clausy-api'
    },

    // Sanitização
    sanitization: {
        maxLength: 1000,
        allowedTags: ['b', 'i', 'em', 'strong', 'a'],
        allowedAttributes: {
            a: ['href', 'title']
        }
    }
};

// Funções de criptografia
const encryption = {
    // Gera uma chave de criptografia
    generateKey: async (password, salt) => {
        return promisify(crypto.pbkdf2)(
            password,
            salt,
            SECURITY_CONFIG.encryption.iterations,
            SECURITY_CONFIG.encryption.keyLength,
            'sha512'
        );
    },

    // Criptografa dados
    encrypt: async (data, password) => {
        try {
            const salt = crypto.randomBytes(SECURITY_CONFIG.encryption.saltLength);
            const iv = crypto.randomBytes(SECURITY_CONFIG.encryption.ivLength);
            const key = await encryption.generateKey(password, salt);

            const cipher = crypto.createCipheriv(
                SECURITY_CONFIG.encryption.algorithm,
                key,
                iv
            );

            const encrypted = Buffer.concat([
                cipher.update(JSON.stringify(data), 'utf8'),
                cipher.final()
            ]);

            const tag = cipher.getAuthTag();

            return {
                encrypted: encrypted.toString('base64'),
                iv: iv.toString('base64'),
                salt: salt.toString('base64'),
                tag: tag.toString('base64')
            };
        } catch (error) {
            logging.error('Encryption error', error);
            throw error;
        }
    },

    // Descriptografa dados
    decrypt: async (encryptedData, password) => {
        try {
            const {
                encrypted,
                iv,
                salt,
                tag
            } = encryptedData;

            const key = await encryption.generateKey(
                password,
                Buffer.from(salt, 'base64')
            );

            const decipher = crypto.createDecipheriv(
                SECURITY_CONFIG.encryption.algorithm,
                key,
                Buffer.from(iv, 'base64')
            );

            decipher.setAuthTag(Buffer.from(tag, 'base64'));

            const decrypted = Buffer.concat([
                decipher.update(Buffer.from(encrypted, 'base64')),
                decipher.final()
            ]);

            return JSON.parse(decrypted.toString('utf8'));
        } catch (error) {
            logging.error('Decryption error', error);
            throw error;
        }
    }
};

// Funções de hash
const hash = {
    // Gera hash de senha
    generateHash: async (password) => {
        try {
            const salt = await bcrypt.genSalt(SECURITY_CONFIG.hash.saltRounds);
            return bcrypt.hash(password, salt);
        } catch (error) {
            logging.error('Hash generation error', error);
            throw error;
        }
    },

    // Verifica senha
    verifyHash: async (password, hash) => {
        try {
            return bcrypt.compare(password, hash);
        } catch (error) {
            logging.error('Hash verification error', error);
            throw error;
        }
    }
};

// Funções de JWT
const jwtUtils = {
    // Gera token
    generateToken: (payload) => {
        try {
            return jwt.sign(payload, config.get('jwt.secret'), {
                algorithm: SECURITY_CONFIG.jwt.algorithm,
                expiresIn: SECURITY_CONFIG.jwt.expiresIn,
                issuer: SECURITY_CONFIG.jwt.issuer,
                audience: SECURITY_CONFIG.jwt.audience
            });
        } catch (error) {
            logging.error('Token generation error', error);
            throw error;
        }
    },

    // Gera refresh token
    generateRefreshToken: (payload) => {
        try {
            return jwt.sign(payload, config.get('jwt.refreshSecret'), {
                algorithm: SECURITY_CONFIG.jwt.algorithm,
                expiresIn: SECURITY_CONFIG.jwt.refreshExpiresIn,
                issuer: SECURITY_CONFIG.jwt.issuer,
                audience: SECURITY_CONFIG.jwt.audience
            });
        } catch (error) {
            logging.error('Refresh token generation error', error);
            throw error;
        }
    },

    // Verifica token
    verifyToken: (token) => {
        try {
            return jwt.verify(token, config.get('jwt.secret'), {
                algorithms: [SECURITY_CONFIG.jwt.algorithm],
                issuer: SECURITY_CONFIG.jwt.issuer,
                audience: SECURITY_CONFIG.jwt.audience
            });
        } catch (error) {
            logging.error('Token verification error', error);
            throw error;
        }
    },

    // Verifica refresh token
    verifyRefreshToken: (token) => {
        try {
            return jwt.verify(token, config.get('jwt.refreshSecret'), {
                algorithms: [SECURITY_CONFIG.jwt.algorithm],
                issuer: SECURITY_CONFIG.jwt.issuer,
                audience: SECURITY_CONFIG.jwt.audience
            });
        } catch (error) {
            logging.error('Refresh token verification error', error);
            throw error;
        }
    },

    // Decodifica token
    decodeToken: (token) => {
        try {
            return jwt.decode(token);
        } catch (error) {
            logging.error('Token decoding error', error);
            throw error;
        }
    }
};

// Funções de sanitização
const sanitization = {
    // Sanitiza string
    sanitizeString: (str) => {
        if (typeof str !== 'string') {
            return '';
        }

        // Remove caracteres especiais
        str = str.replace(/[^\w\s-]/g, '');

        // Remove espaços extras
        str = str.trim().replace(/\s+/g, ' ');

        // Limita tamanho
        if (str.length > SECURITY_CONFIG.sanitization.maxLength) {
            str = str.substring(0, SECURITY_CONFIG.sanitization.maxLength);
        }

        return str;
    },

    // Sanitiza objeto
    sanitizeObject: (obj) => {
        if (typeof obj !== 'object' || obj === null) {
            return {};
        }

        const sanitized = {};

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = sanitization.sanitizeString(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitization.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    },

    // Sanitiza array
    sanitizeArray: (arr) => {
        if (!Array.isArray(arr)) {
            return [];
        }

        return arr.map(item => {
            if (typeof item === 'string') {
                return sanitization.sanitizeString(item);
            } else if (typeof item === 'object' && item !== null) {
                return sanitization.sanitizeObject(item);
            } else {
                return item;
            }
        });
    }
};

// Funções de validação de segurança
const validation = {
    // Valida senha
    validatePassword: (password) => {
        if (typeof password !== 'string' || password.length < SECURITY_CONFIG.hash.minLength) {
            return false;
        }

        // Verifica complexidade
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    },

    // Valida email
    validateEmail: (email) => {
        if (typeof email !== 'string') {
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Valida URL
    validateUrl: (url) => {
        if (typeof url !== 'string') {
            return false;
        }

        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    // Valida IP
    validateIp: (ip) => {
        if (typeof ip !== 'string') {
            return false;
        }

        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip);
    }
};

// Funções de segurança de arquivo
const fileSecurity = {
    // Valida tipo de arquivo
    validateFileType: (file, allowedTypes) => {
        if (!file || !file.mimetype) {
            return false;
        }

        return allowedTypes.includes(file.mimetype);
    },

    // Valida tamanho de arquivo
    validateFileSize: (file, maxSize) => {
        if (!file || !file.size) {
            return false;
        }

        return file.size <= maxSize;
    },

    // Gera nome seguro para arquivo
    generateSecureFilename: (filename) => {
        if (typeof filename !== 'string') {
            return '';
        }

        // Remove caracteres especiais
        filename = filename.replace(/[^\w\s-]/g, '');

        // Remove espaços extras
        filename = filename.trim().replace(/\s+/g, '-');

        // Adiciona timestamp
        const timestamp = Date.now();
        const extension = filename.split('.').pop();

        return `${filename}-${timestamp}.${extension}`;
    }
};

module.exports = {
    SECURITY_CONFIG,
    encryption,
    hash,
    jwtUtils,
    sanitization,
    validation,
    fileSecurity
}; 