const mysql = require('mysql2/promise');
const Redis = require('ioredis');

// Configurações do banco de dados
const dbConfig = {
    host: process.env.DB_HOST || '138.197.27.151',
    user: process.env.DB_USER || 'clausy_root',
    password: process.env.DB_PASSWORD || '@N4td55k7%+[',
    database: process.env.DB_NAME || 'clausy'
};

// Configurações do Redis
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || 'ClausyRedis2024!'
});

async function updateEnterpriseRedis() {
    try {
        console.log('🔄 Iniciando atualização dos limites do plano ENTERPRISE...');
        
        // Conectar ao MySQL
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado ao MySQL');

        // 1. Atualizar os limites no banco de dados
        console.log('\n📝 Atualizando limites no banco de dados...');
        const [updateResult] = await connection.execute(`
            UPDATE subscription_plans 
            SET 
                max_queries_per_hour = 100000,
                max_tokens_per_hour = 5000000000
            WHERE plan_id = 'ENTERPRISE'
        `);
        
        console.log(`✅ ${updateResult.affectedRows} registro(s) atualizado(s) no banco de dados`);

        // 2. Verificar a atualização
        console.log('\n🔍 Verificando atualização no banco...');
        const [plans] = await connection.execute(`
            SELECT plan_id, name, max_queries_per_hour, max_tokens_per_hour, 
                   history_retention_hours, price, color
            FROM subscription_plans 
            WHERE plan_id = 'ENTERPRISE'
        `);
        
        if (plans.length > 0) {
            console.log('✅ Plano ENTERPRISE atualizado:');
            console.table(plans);
        } else {
            console.log('❌ Plano ENTERPRISE não encontrado!');
            await connection.end();
            process.exit(1);
        }

        // 3. Buscar todos os usuários com plano ENTERPRISE
        console.log('\n👥 Buscando usuários com plano ENTERPRISE...');
        const [users] = await connection.execute(`
            SELECT u.user_id, u.email, u.plan_id, p.name as plan_name, 
                   p.max_queries_per_hour, p.max_tokens_per_hour, 
                   p.history_retention_hours, p.color
            FROM users u
            JOIN subscription_plans p ON u.plan_id = p.plan_id
            WHERE u.plan_id = 'ENTERPRISE'
        `);

        console.log(`📊 Encontrados ${users.length} usuário(s) com plano ENTERPRISE`);

        // 4. Atualizar cada usuário no Redis
        console.log('\n🔄 Atualizando planos no Redis...');
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

            // Resetar o contador de tokens para aplicar os novos limites
            await redis.del(`user:${user.user_id}:tokens`);
            await redis.del(`user:${user.user_id}:queries`);

            console.log(`✅ Usuário ${user.email} atualizado no Redis`);
        }

        // 5. Verificar atualização no Redis
        console.log('\n🔍 Verificando atualização no Redis...');
        for (const user of users) {
            const planKey = `user:${user.user_id}:plan`;
            const planData = await redis.get(planKey);
            if (planData) {
                const plan = JSON.parse(planData);
                console.log(`\n📋 Plano do usuário ${user.email}:`);
                console.log(`   - Rate Limit: ${plan.rateLimit}`);
                console.log(`   - Token Limit: ${plan.tokenLimit}`);
                console.log(`   - History Retention: ${plan.historyRetention}`);
            }
        }

        // Fechar conexões
        await connection.end();
        await redis.quit();

        console.log('\n🎉 Atualização concluída com sucesso!');
        console.log('\n📋 Resumo das alterações:');
        console.log('   - max_queries_per_hour: 10.000 → 100.000');
        console.log('   - max_tokens_per_hour: 200.000 → 5.000.000.000');
        console.log(`   - ${users.length} usuário(s) atualizado(s) no Redis`);

    } catch (error) {
        console.error('❌ Erro durante a atualização:', error);
        process.exit(1);
    }
}

// Executar a atualização
updateEnterpriseRedis();
