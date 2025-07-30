const redis = require('./src/config/redis.config');
const tokenUsageService = require('./src/services/tokenUsage.service');

async function checkAllUsers() {
  try {
    console.log('🔍 Verificando dados de todos os usuários\n');
    
    // Verificar todos os usuários com dados
    const users = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    for (const userId of users) {
      const history = await tokenUsageService.getPermanentTokenHistory(userId);
      if (history.length > 0) {
        const totalTokens = history.reduce((sum, entry) => sum + entry.tokens, 0);
        console.log(`👤 Usuário ${userId}: ${history.length} registros, ${totalTokens} tokens`);
      }
    }
    
    // Verificar chaves no Redis
    console.log('\n📊 Verificando chaves no Redis:');
    const keys = await redis.keys('permanent:user:*:tokens');
    console.log(`   Chaves encontradas: ${keys.length}`);
    
    keys.forEach(key => {
      const userId = key.split(':')[2];
      console.log(`   - ${key} (Usuário ${userId})`);
    });
    
    // Verificar se há dados de múltiplos usuários
    const usersWithData = keys.length;
    if (usersWithData > 1) {
      console.log(`\n✅ Sistema funcionando corretamente! Há dados de ${usersWithData} usuários.`);
      console.log('   O dashboard deve mostrar dados agregados de todos os usuários por padrão.');
    } else if (usersWithData === 1) {
      console.log(`\n⚠️ Apenas 1 usuário tem dados. Isso pode ser normal se só um usuário usou o sistema.`);
    } else {
      console.log(`\n❌ Nenhum usuário tem dados. Verifique se o sistema está sendo usado.`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
  } finally {
    process.exit(0);
  }
}

checkAllUsers(); 