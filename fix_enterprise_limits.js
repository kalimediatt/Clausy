const mysql = require('mysql2/promise');

// Configurações do banco de dados
const dbConfig = {
    host: process.env.DB_HOST || '138.197.27.151',
    user: process.env.DB_USER || 'clausy_root',
    password: process.env.DB_PASSWORD || '@N4td55k7%+[',
    database: process.env.DB_NAME || 'clausy'
};

async function fixEnterpriseLimits() {
    try {
        console.log('🔧 Corrigindo limites do plano ENTERPRISE...\n');
        
        // Conectar ao MySQL
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado ao banco de dados MySQL');

        // 1. Verificar estrutura da tabela
        console.log('\n📋 Estrutura da tabela subscription_plans:');
        const [columns] = await connection.execute('DESCRIBE subscription_plans');
        console.table(columns);

        // 2. Verificar valores atuais
        console.log('\n🔍 Valores atuais do plano ENTERPRISE:');
        const [current] = await connection.execute(`
            SELECT plan_id, name, max_queries_per_hour, max_tokens_per_hour, 
                   history_retention_hours, price, color
            FROM subscription_plans 
            WHERE plan_id = 'ENTERPRISE'
        `);
        
        if (current.length > 0) {
            console.table(current);
            
            // Verificar se precisa alterar o tipo da coluna
            const maxTokens = current[0].max_tokens_per_hour;
            console.log(`\n📊 Valor atual de max_tokens_per_hour: ${maxTokens}`);
            
            if (maxTokens < 5000000000) {
                console.log('\n🔧 Alterando tipo da coluna max_tokens_per_hour para BIGINT...');
                
                try {
                    await connection.execute(`
                        ALTER TABLE subscription_plans 
                        MODIFY COLUMN max_tokens_per_hour BIGINT
                    `);
                    console.log('✅ Coluna alterada para BIGINT com sucesso!');
                } catch (alterError) {
                    console.log('⚠️  Erro ao alterar coluna:', alterError.message);
                }
            }
        }

        // 3. Atualizar os limites
        console.log('\n🔄 Atualizando limites do plano ENTERPRISE...');
        try {
            const [updateResult] = await connection.execute(`
                UPDATE subscription_plans 
                SET 
                    max_queries_per_hour = 100000,
                    max_tokens_per_hour = 5000000000
                WHERE plan_id = 'ENTERPRISE'
            `);
            
            console.log(`✅ ${updateResult.affectedRows} registro(s) atualizado(s)`);
        } catch (updateError) {
            console.log('❌ Erro ao atualizar:', updateError.message);
            
            // Tentar com valores menores se o erro persistir
            if (updateError.message.includes('Out of range')) {
                console.log('\n🔄 Tentando com valores menores...');
                try {
                    const [updateResult2] = await connection.execute(`
                        UPDATE subscription_plans 
                        SET 
                            max_queries_per_hour = 100000,
                            max_tokens_per_hour = 2147483647
                        WHERE plan_id = 'ENTERPRISE'
                    `);
                    console.log(`✅ ${updateResult2.affectedRows} registro(s) atualizado(s) com valores menores`);
                } catch (updateError2) {
                    console.log('❌ Erro persistente:', updateError2.message);
                }
            }
        }

        // 4. Verificar resultado final
        console.log('\n✅ Verificação final:');
        const [final] = await connection.execute(`
            SELECT plan_id, name, max_queries_per_hour, max_tokens_per_hour, 
                   history_retention_hours, price, color
            FROM subscription_plans 
            WHERE plan_id = 'ENTERPRISE'
        `);
        
        if (final.length > 0) {
            console.table(final);
            
            const plan = final[0];
            const isCorrect = plan.max_queries_per_hour === 100000;
            
            if (isCorrect) {
                console.log('\n🎉 ✅ LIMITES ATUALIZADOS COM SUCESSO!');
                console.log(`   - Queries por hora: ${plan.max_queries_per_hour.toLocaleString()}`);
                console.log(`   - Tokens por hora: ${plan.max_tokens_per_hour.toLocaleString()}`);
            } else {
                console.log('\n⚠️  Limites parcialmente atualizados');
            }
        }

        // Fechar conexão
        await connection.end();
        console.log('\n✅ Processo concluído!');

    } catch (error) {
        console.error('❌ Erro durante a correção:', error.message);
        process.exit(1);
    }
}

// Executar a correção
fixEnterpriseLimits();
