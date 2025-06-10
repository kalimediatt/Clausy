const redis = require('./src/config/redis.config');
const mysql = require('mysql2/promise');

async function updateNewUsersRedis() {
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

        // Buscar as empresas recém-criadas
        const [companies] = await connection.execute(`
            SELECT c.company_id, c.name, c.plan_id, p.name as plan_name, 
                   p.max_queries_per_hour, p.max_tokens_per_hour, 
                   p.history_retention_hours, p.color
            FROM companies c
            JOIN subscription_plans p ON c.plan_id = p.plan_id
            WHERE c.name IN ('omega', 'romeu')
        `);

        console.log(`Encontradas ${companies.length} empresas para atualizar`);

        // Para cada empresa, buscar seus usuários
        for (const company of companies) {
            const [users] = await connection.execute(`
                SELECT user_id, email, name, role
                FROM users
                WHERE company_id = ?
            `, [company.company_id]);

            console.log(`\nAtualizando usuários da empresa ${company.name}:`);

            // Atualizar cada usuário no Redis
            for (const user of users) {
                const userPlan = {
                    name: company.plan_id,
                    displayName: company.plan_name,
                    color: company.color,
                    rateLimit: company.max_queries_per_hour,
                    tokenLimit: company.max_tokens_per_hour,
                    historyRetention: `${company.history_retention_hours}h`
                };

                // Atualizar o plano no Redis
                await redis.setex(
                    `user:${user.user_id}:plan`,
                    24 * 60 * 60, // 24 horas
                    JSON.stringify(userPlan)
                );

                // Resetar o contador de tokens
                await redis.del(`user:${user.user_id}:tokens`);

                console.log(`- Usuário ${user.name} (${user.email}) atualizado para o plano ${company.plan_name}`);
            }
        }

        console.log('\nAtualização concluída com sucesso!');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Erro ao atualizar usuários:', error);
        process.exit(1);
    }
}

updateNewUsersRedis(); 