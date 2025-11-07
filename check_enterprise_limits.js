const mysql = require('mysql2/promise');

// Configurações do banco de dados
const dbConfig = {
    host: process.env.DB_HOST || '138.197.27.151',
    user: process.env.DB_USER || 'clausy_root',
    password: process.env.DB_PASSWORD || '@N4td55k7%+[',
    database: process.env.DB_NAME || 'ClausyRedis2024!'
};

async function checkEnterpriseLimits() {
    try {
        console.log('🔍 Verificando limites do plano ENTERPRISE...\n');
        
        // Conectar ao MySQL
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado ao banco de dados MySQL');

        // 1. Verificar plano ENTERPRISE no banco
        console.log('\n📋 Verificando plano ENTERPRISE no banco de dados:');
        const [plans] = await connection.execute(`
            SELECT plan_id, name, max_queries_per_hour, max_tokens_per_hour, 
                   history_retention_hours, price, color
            FROM subscription_plans 
            WHERE plan_id = 'ENTERPRISE'
        `);
        
        if (plans.length > 0) {
            const plan = plans[0];
            console.log('✅ Plano ENTERPRISE encontrado:');
            console.log(`   - Plan ID: ${plan.plan_id}`);
            console.log(`   - Nome: ${plan.name}`);
            console.log(`   - Max Queries/Hour: ${plan.max_queries_per_hour.toLocaleString()}`);
            console.log(`   - Max Tokens/Hour: ${plan.max_tokens_per_hour.toLocaleString()}`);
            console.log(`   - History Retention: ${plan.history_retention_hours} horas`);
            console.log(`   - Preço: R$ ${plan.price}`);
            console.log(`   - Cor: ${plan.color}`);
            
            // Verificar se os valores estão corretos
            const isCorrect = plan.max_queries_per_hour === 100000 && 
                             plan.max_tokens_per_hour === 5000000000;
            
            if (isCorrect) {
                console.log('\n🎉 ✅ LIMITES CORRETOS! Os valores estão atualizados conforme solicitado.');
            } else {
                console.log('\n❌ ⚠️  LIMITES INCORRETOS! Os valores não estão atualizados.');
                console.log('   Esperado: 100.000 queries/hora e 5.000.000.000 tokens/hora');
            }
        } else {
            console.log('❌ Plano ENTERPRISE não encontrado no banco de dados!');
        }

        // 2. Verificar todos os planos para comparação
        console.log('\n📊 Todos os planos disponíveis:');
        const [allPlans] = await connection.execute(`
            SELECT plan_id, name, max_queries_per_hour, max_tokens_per_hour, price
            FROM subscription_plans 
            ORDER BY plan_id
        `);
        
        console.table(allPlans.map(plan => ({
            'Plan ID': plan.plan_id,
            'Nome': plan.name,
            'Queries/Hora': plan.max_queries_per_hour.toLocaleString(),
            'Tokens/Hora': plan.max_tokens_per_hour.toLocaleString(),
            'Preço': `R$ ${plan.price}`
        })));

        // 3. Verificar usuários com plano ENTERPRISE
        console.log('\n👥 Usuários com plano ENTERPRISE:');
        const [users] = await connection.execute(`
            SELECT u.user_id, u.email, u.name, u.plan_id
            FROM users u
            WHERE u.plan_id = 'ENTERPRISE'
        `);
        
        if (users.length > 0) {
            console.log(`✅ Encontrados ${users.length} usuário(s) com plano ENTERPRISE:`);
            console.table(users.map(user => ({
                'ID': user.user_id,
                'Email': user.email,
                'Nome': user.name,
                'Plano': user.plan_id
            })));
        } else {
            console.log('ℹ️  Nenhum usuário encontrado com plano ENTERPRISE');
        }

        // Fechar conexão
        await connection.end();
        console.log('\n✅ Verificação concluída!');

    } catch (error) {
        console.error('❌ Erro durante a verificação:', error.message);
        process.exit(1);
    }
}

// Executar a verificação
checkEnterpriseLimits();
