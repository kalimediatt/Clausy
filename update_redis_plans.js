const redis = require('./src/config/redis.config');
const mysql = require('mysql2/promise');

async function updateRedisPlans() {
    try {
        // Configuração do banco de dados
        const dbConfig = {
            host: process.env.DB_HOST || '138.197.27.151',
            user: process.env.DB_USER || 'clausy_root',
            password: process.env.DB_PASSWORD || '@N4td55k7%+[',
            database: process.env.DB_NAME || 'clausy'
        };

        // Conectar ao MySQL
        const connection = await mysql.createConnection(dbConfig);

        // Buscar todos os usuários com seus planos
        const [users] = await connection.execute(`
            SELECT u.user_id, u.plan_id, p.name as plan_name, p.max_queries_per_hour, 
                   p.max_tokens_per_hour, p.history_retention_hours, p.color
            FROM users u
            JOIN subscription_plans p ON u.plan_id = p.plan_id
        `);

        console.log(`Encontrados ${users.length} usuários para atualizar`);

        // Atualizar cada usuário no Redis
        for (const user of users) {
            const userPlan = {
                name: user.plan_id,
                displayName: user.plan_name,
                color: user.color,
                rateLimit: user.max_queries_per_hour,
                tokenLimit: user.max_tokens_per_hour,
                historyRetention: `${user.history_retention_hours}h`
            };

            // Atualizar o plano no Redis
            await redis.setex(
                `user:${user.user_id}:plan`,
                24 * 60 * 60, // 24 horas
                JSON.stringify(userPlan)
            );

            // Resetar o contador de tokens
            await redis.del(`user:${user.user_id}:tokens`);

            console.log(`Usuário ${user.user_id} atualizado para o plano ${user.plan_name}`);
        }

        console.log('Atualização concluída com sucesso!');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Erro ao atualizar planos:', error);
        process.exit(1);
    }
}

updateRedisPlans(); 