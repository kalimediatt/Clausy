const mysql = require('mysql2/promise');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
const path = require('path');

// Tenta carregar as variáveis de ambiente
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Configurações
const DB_CONFIG = {
    user: process.env.DB_USER || 'clausy_root',
    host: process.env.DB_HOST || '138.197.27.151',
    database: process.env.DB_NAME || 'clausy',
    password: process.env.DB_PASSWORD || '@N4td55k7%+[',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// Criar pool de conexões
const pool = mysql.createPool(DB_CONFIG);

// Estratégia de retry
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;

async function withRetry(operation, retries = MAX_RETRIES) {
    let lastError;
    
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            
            // Verificar se é um erro de conexão
            if (error.code === 'ECONNREFUSED' || 
                error.code === 'ETIMEDOUT' || 
                error.code === 'ECONNRESET') {
                
                const delay = INITIAL_RETRY_DELAY * Math.pow(2, i);
                console.warn(`Database connection failed. Retrying in ${delay}ms...`);
                await sleep(delay);
                continue;
            }
            
            // Se não for erro de conexão, não tenta novamente
            throw error;
        }
    }
    
    throw lastError;
}

const db = {
    // Executar query com retry
    async executeQuery(query, params = []) {
        return withRetry(async () => {
            const [rows] = await pool.execute(query, params);
            return rows;
        });
    },

    // Obter conexão do pool
    async getConnection() {
        return withRetry(async () => {
            const connection = await pool.getConnection();
            return connection;
        });
    },

    // Testar conexão
    async testConnection() {
        return withRetry(async () => {
            const connection = await pool.getConnection();
            await connection.ping();
            connection.release();
            return true;
        });
    },

    // Obter cliente do pool
    async getClient() {
        return withRetry(async () => {
            const connection = await pool.getConnection();
            return connection;
        });
    },

    // Obter estatísticas do pool
    getPoolStats() {
        return {
            totalCount: pool.pool ? pool.pool.config.connectionLimit : 0,
            idleCount: pool.pool ? pool.pool._freeConnections.length : 0,
            waitingCount: pool.pool ? pool.pool._connectionQueue.length : 0
        };
    },

    // Fechar pool
    async close() {
        try {
            await pool.end();
            console.log('Database pool closed');
        } catch (error) {
            console.error('Error closing database pool:', error);
            throw error;
        }
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Closing database pool...');
    await db.close();
    process.exit(0);
});

module.exports = db; 