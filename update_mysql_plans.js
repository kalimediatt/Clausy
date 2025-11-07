const mysql = require('mysql2/promise');
const PLANS = require('./src/config/plans');

// Configurações do banco de dados
const dbConfig = {
    host: process.env.DB_HOST || '138.197.27.151',
    user: process.env.DB_USER || 'clausy_root',
    password: process.env.DB_PASSWORD || '@N4td55k7%+[',
    database: process.env.DB_NAME || 'clausy'
};

// Função para converter retenção de histórico para horas
function convertRetentionToHours(retention) {
    if (retention.includes('h')) {
        return parseInt(retention.replace('h', ''));
    } else if (retention.includes('d')) {
        return parseInt(retention.replace('d', '')) * 24;
    }
    return 24; // Default
}

async function updateMySQLPlans() {
    try {
        console.log('🔄 Iniciando atualização dos planos no MySQL...');
        
        // Conectar ao MySQL
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado ao MySQL');

        // Verificar planos atuais
        console.log('\n📋 Planos atuais no banco:');
        const [currentPlans] = await connection.execute(`
            SELECT plan_id, name, max_queries_per_hour, max_tokens_per_hour, 
                   history_retention_hours, price, color
            FROM subscription_plans 
            ORDER BY plan_id
        `);
        
        console.table(currentPlans);

        // Atualizar cada plano com os novos valores
        console.log('\n🔄 Atualizando planos com novos valores...');
        
        for (const [planId, planData] of Object.entries(PLANS)) {
            const historyHours = convertRetentionToHours(planData.historyRetention);
            
            const [result] = await connection.execute(`
                UPDATE subscription_plans 
                SET 
                    name = ?,
                    max_queries_per_hour = ?,
                    max_tokens_per_hour = ?,
                    history_retention_hours = ?,
                    price = ?,
                    color = ?
                WHERE plan_id = ?
            `, [
                planData.displayName,
                planData.rateLimit,
                planData.tokenLimit,
                historyHours,
                planData.price,
                planData.color,
                planId
            ]);

            if (result.affectedRows > 0) {
                console.log(`✅ Plano ${planId} atualizado:`);
                console.log(`   - Rate Limit: ${planData.rateLimit.toLocaleString()} req/hora`);
                console.log(`   - Token Limit: ${planData.tokenLimit.toLocaleString()} tokens`);
                console.log(`   - History Retention: ${planData.historyRetention}`);
                console.log(`   - Price: R$ ${planData.price}`);
            } else {
                console.log(`⚠️  Plano ${planId} não encontrado no banco`);
            }
        }

        // Verificar atualizações
        console.log('\n📋 Planos atualizados no banco:');
        const [updatedPlans] = await connection.execute(`
            SELECT plan_id, name, max_queries_per_hour, max_tokens_per_hour, 
                   history_retention_hours, price, color
            FROM subscription_plans 
            ORDER BY plan_id
        `);
        
        console.table(updatedPlans);

        // Fechar conexão
        await connection.end();

        console.log('\n🎉 Atualização do MySQL concluída com sucesso!');
        console.log('\n📋 Resumo das alterações:');
        console.log('   - FREE_TRIAL: 50k req/hora, 300M tokens');
        console.log('   - BASIC: 20k req/hora, 5B tokens');
        console.log('   - STANDARD: 150k req/hora, 150B tokens');
        console.log('   - PRO: 100k req/hora, 500B tokens');
        console.log('   - ENTERPRISE: 1M req/hora, 500T tokens');

    } catch (error) {
        console.error('❌ Erro durante a atualização:', error);
        process.exit(1);
    }
}

// Executar a atualização
updateMySQLPlans();
