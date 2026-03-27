const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const settingsService = require('./settings.service');

// Configurações de segurança
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 horas
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutos
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Configuração do Redis para tokens
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

// Gerenciamento de chaves JWT
class JWTKeyManager {
    constructor() {
        this.keys = new Map();
        this.currentKeyId = null;
        this.initializeKeys();
    }

    async initializeKeys() {
        // Gerar chave inicial
        const keyId = crypto.randomBytes(16).toString('hex');
        const key = crypto.randomBytes(32).toString('hex');
        this.keys.set(keyId, key);
        this.currentKeyId = keyId;

        // Rotacionar chaves a cada 24 horas
        setInterval(() => this.rotateKeys(), 24 * 60 * 60 * 1000);
    }

    async rotateKeys() {
        const newKeyId = crypto.randomBytes(16).toString('hex');
        const newKey = crypto.randomBytes(32).toString('hex');
        
        this.keys.set(newKeyId, newKey);
        this.currentKeyId = newKeyId;

        // Manter apenas as últimas 3 chaves
        if (this.keys.size > 3) {
            const oldestKey = Array.from(this.keys.keys())[0];
            this.keys.delete(oldestKey);
        }
    }

    getCurrentKey() {
        return {
            keyId: this.currentKeyId,
            key: this.keys.get(this.currentKeyId)
        };
    }

    getKey(keyId) {
        return this.keys.get(keyId);
    }
}

const keyManager = new JWTKeyManager();

// Cache de tentativas de login
const loginAttempts = new Map();

// Função para limpar tentativas de login antigas
function cleanupLoginAttempts() {
    const now = Date.now();
    for (const [key, value] of loginAttempts.entries()) {
        if (now - value.timestamp > LOGIN_ATTEMPT_WINDOW) {
            loginAttempts.delete(key);
        }
    }
}

// Limpar tentativas antigas a cada 5 minutos
setInterval(cleanupLoginAttempts, 5 * 60 * 1000);

// Função para verificar tentativas de login
async function checkLoginAttempts(email, ip) {
    const key = `${email}:${ip}`;
    const now = Date.now();
    const attempt = loginAttempts.get(key) || { count: 0, timestamp: now };

    // Obter configuração de tentativas de login do sistema
    const maxLoginAttempts = await settingsService.getSetting('loginAttempts') || MAX_LOGIN_ATTEMPTS;

    // Limpar tentativas antigas
    if (now - attempt.timestamp > LOGIN_ATTEMPT_WINDOW) {
        attempt.count = 0;
        attempt.timestamp = now;
    }

    return attempt;
}

// Função para registrar tentativa de login
function recordLoginAttempt(email, ip, success) {
    const key = `${email}:${ip}`;
    const attempt = loginAttempts.get(key) || { count: 0, timestamp: Date.now() };

    if (success) {
        loginAttempts.delete(key);
    } else {
        attempt.count++;
        attempt.timestamp = Date.now();
        loginAttempts.set(key, attempt);
    }

    // A chamada abaixo foi comentada para evitar a duplicação de logs.
    // A função login() agora é a única responsável por registrar os logs.
    // logAuthAttempt(email, success, `IP: ${ip}`);
}

// Função para criar um hash de senha usando bcrypt
async function hashPassword(password, isLegacyPassword = false) {
    if (!isLegacyPassword) {
        if (password.length < PASSWORD_MIN_LENGTH) {
            throw new Error(`A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`);
        }
        if (!PASSWORD_PATTERN.test(password)) {
            throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character');
        }
    }
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

// Função para gerar senha forte
function generateStrongPassword() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '@$!%*?&';
    
    // Garantir pelo menos um de cada tipo
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Adicionar mais caracteres aleatórios para atingir o tamanho mínimo
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < PASSWORD_MIN_LENGTH; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Embaralhar a senha
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Função para fazer login
async function login(email, password, req) {
    let connection;
    let success = false;
    let user = null;
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    try {
        console.log('Iniciando processo de login para:', email);

        // Verificar tentativas de login
        const attempt = await checkLoginAttempts(email, clientIP);
        const maxLoginAttempts = await settingsService.getSetting('loginAttempts') || MAX_LOGIN_ATTEMPTS;
        
        if (attempt.count >= maxLoginAttempts) {
            const timeLeft = Math.ceil((LOGIN_ATTEMPT_WINDOW - (Date.now() - attempt.timestamp)) / 1000 / 60);
            return {
                success: false,
                message: `Muitas tentativas de login. Tente novamente em ${timeLeft} minutos.`
            };
        }

        connection = await db.getClient();

        // Buscar usuário
        const [rows] = await connection.execute(
            `SELECT u.*, c.name as company_name, c.document as company_document, 
                    c.license_count as company_license_count,
                    p.name as plan_name, p.color as plan_color,
                    p.max_queries_per_hour, p.max_tokens_per_hour, p.history_retention_hours
             FROM users u
             JOIN companies c ON u.company_id = c.company_id
             JOIN subscription_plans p ON u.plan_id = p.plan_id
             WHERE u.email = ?`,
            [email]
        );

        if (rows.length === 0) {
            recordLoginAttempt(email, clientIP, false);
            return { success: false, message: 'Credenciais inválidas' };
        }

        user = rows[0];
        let passwordMatch = false;

        // Verificar senha
        try {
            if (user.password_hash.startsWith('$2')) {
                passwordMatch = await bcrypt.compare(password, user.password_hash);
            } else {
                const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
                passwordMatch = (hashedPassword === user.password_hash);

                if (passwordMatch) {
                    const bcryptHash = await bcrypt.hash(password, 12);
                    await connection.execute('UPDATE users SET password_hash = ? WHERE user_id = ?', [bcryptHash, user.user_id]);
                }
            }
        } catch (error) {
            console.error('Erro ao verificar senha:', error);
            return { success: false, message: 'Erro ao verificar credenciais' };
        }

        if (!passwordMatch) {
            recordLoginAttempt(email, clientIP, false);
            return { success: false, message: 'Credenciais inválidas' };
        }

        // Se chegou aqui, o login foi bem-sucedido
        success = true;
        recordLoginAttempt(email, clientIP, true);

        // Atualizar último login
        await connection.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?', [user.user_id]);

        // Gerar token, etc.
        const token = jwt.sign(
            { user_id: user.user_id, email: user.email, role: user.role, company_id: user.company_id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        const userData = {
            user_id: user.user_id, email: user.email, name: user.name, role: user.role, credits: user.credits,
            plan_id: user.plan_id, plan_name: user.plan_name, plan_color: user.plan_color,
            company_id: user.company_id, company_name: user.company_name, company_document: user.company_document,
            company_license_count: user.company_license_count, created_at: user.created_at,
            updated_at: user.updated_at, last_login: user.last_login,
            maxQueriesPerHour: user.max_queries_per_hour, maxTokensPerHour: user.max_tokens_per_hour,
            historyRetention: user.history_retention_hours
        };

        return { success: true, user: userData, token, expiresIn: SESSION_TIMEOUT };

    } catch (error) {
        console.error('Erro no processo de login:', error);
        return { success: false, message: 'Erro interno no servidor' };
    } finally {
        // Registrar o log de autenticação uma única vez
        if (connection) {
            await connection.execute(
                'INSERT INTO auth_logs (username, ip_address, success, user_agent) VALUES (?, ?, ?, ?)',
                [email, clientIP, success, userAgent]
            );
            await connection.release();
        }
    }
}

// Função para validar token
function validateToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Validar força da senha
function validatePassword(password) {
    if (password.length < PASSWORD_MIN_LENGTH) {
        throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
    }
    
    if (!PASSWORD_PATTERN.test(password)) {
        throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character');
    }
    
    return true;
}

// Gerar hash da senha
async function hashPassword(password) {
    validatePassword(password);
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
}

// Verificar senha
async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

// Gerar tokens
async function generateTokens(user) {
    const { keyId, key } = keyManager.getCurrentKey();
    
    const accessToken = jwt.sign(
        { 
            sub: user.id,
            email: user.email,
            role: user.role,
            keyId
        },
        key,
        { expiresIn: '1h' }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    // Armazenar refresh token no Redis
    await redis.setex(
        `refresh_token:${refreshToken}`,
        Math.floor(7 * 24 * 60 * 60), // 7 dias em segundos
        JSON.stringify({
            userId: user.id,
            keyId
        })
    );

    return {
        accessToken,
        refreshToken,
        expiresIn: 3600 // 1 hora em segundos
    };
}

// Verificar token
async function verifyToken(token) {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.keyId) {
            throw new Error('Invalid token format');
        }

        const key = keyManager.getKey(decoded.keyId);
        if (!key) {
            throw new Error('Token key not found');
        }

        return jwt.verify(token, key);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        }
        throw error;
    }
}

// Renovar token
async function refreshToken(refreshToken) {
    const tokenData = await redis.get(`refresh_token:${refreshToken}`);
    if (!tokenData) {
        throw new Error('Invalid refresh token');
    }

    const { userId, keyId } = JSON.parse(tokenData);
    const key = keyManager.getKey(keyId);
    if (!key) {
        throw new Error('Token key not found');
    }

    // Gerar novo access token
    const { keyId: newKeyId, key: newKey } = keyManager.getCurrentKey();
    const accessToken = jwt.sign(
        { 
            sub: userId,
            keyId: newKeyId
        },
        newKey,
        { expiresIn: '1h' }
    );

    return {
        accessToken,
        expiresIn: 3600
    };
}

// Revogar token
async function revokeToken(refreshToken) {
    await redis.del(`refresh_token:${refreshToken}`);
}

// Exportar todas as funções como um objeto
module.exports = {
    login,
    validateToken,
    validatePassword,
    hashPassword,
    verifyPassword,
    generateTokens,
    verifyToken,
    refreshToken,
    revokeToken,
    checkLoginAttempts
};