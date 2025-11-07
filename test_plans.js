const mysql = require('mysql2/promise');
const Redis = require('ioredis');

// Configurações do banco de dados
const dbConfig = {
    host: 'localhost',
    user: 'clausy_root',
    password: '@N4td55k7%+[',
    database: 'clausy'
};

// Configurações do Redis
const redis = new Redis({
    host: 'localhost',
    port: 6379,
    password: 'ClausyRedis2024!'
});

async function testPlans() {
    try {
        // Conectar ao MySQL
        const connection = await mysql.createConnection(dbConfig);

        // 1. Verificar planos no banco
        console.log('\n=== Verificando planos no banco de dados ===');
        const [plans] = await connection.execute('SELECT * FROM subscription_plans');
        console.table(plans);

        // 2. Verificar usuários e seus planos
        console.log('\n=== Verificando usuários e seus planos ===');
        const [users] = await connection.execute(`
            SELECT u.user_id, u.email, u.plan_id, sp.name as plan_name, 
                   sp.max_queries_per_hour, sp.max_tokens_per_hour, 
                   sp.history_retention_hours
            FROM users u
            JOIN subscription_plans sp ON u.plan_id = sp.plan_id
        `);
        console.table(users);

        // 3. Verificar planos no Redis
        console.log('\n=== Verificando planos no Redis ===');
        for (const user of users) {
            const planKey = `user:${user.user_id}:plan`;
            const planData = await redis.get(planKey);
            console.log(`\nPlano do usuário ${user.email}:`);
            console.log(planData ? JSON.parse(planData) : 'Não encontrado no Redis');
        }

        // 4. Atualizar planos no Redis
        console.log('\n=== Atualizando planos no Redis ===');
        for (const user of users) {
            const planKey = `user:${user.user_id}:plan`;
            const userPlan = {
                name: user.plan_id,
                displayName: user.plan_name,
                color: user.plan_color,
                rateLimit: user.max_queries_per_hour,
                tokenLimit: user.max_tokens_per_hour,
                historyRetention: `${user.history_retention_hours}h`
            };
            await redis.setex(planKey, 24 * 60 * 60, JSON.stringify(userPlan));
            console.log(`Plano atualizado para ${user.email}`);
        }

        // Fechar conexões
        await connection.end();
        await redis.quit();

        console.log('\n=== Teste concluído ===');

    } catch (error) {
        console.error('Erro durante o teste:', error);
    }
}

// Executar o teste
testPlans(); 