const redis = require('../src/config/redis.config');

async function cleanupRedisChat() {
  try {
    console.log('🧹 Iniciando limpeza dos dados de chat do Redis...');
    
    // Obter todas as chaves de chat do Redis
    const keys = await redis.keys('chat:user:*:conversations');
    console.log(`📝 Encontradas ${keys.length} chaves de chat no Redis`);
    
    if (keys.length === 0) {
      console.log('✅ Nenhum dado de chat encontrado no Redis');
      return;
    }
    
    let deletedKeys = 0;
    
    for (const key of keys) {
      try {
        // Extrair user_id da chave
        const userId = key.split(':')[2];
        console.log(`🗑️  Removendo dados de chat do usuário ${userId}...`);
        
        // Remover a chave do Redis
        await redis.del(key);
        deletedKeys++;
        console.log(`✅ Dados do usuário ${userId} removidos`);
        
      } catch (error) {
        console.error(`❌ Erro ao remover dados do usuário:`, error.message);
      }
    }
    
    console.log('🎉 Limpeza concluída!');
    console.log(`✅ Chaves removidas: ${deletedKeys}`);
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Executar limpeza se chamado diretamente
if (require.main === module) {
  cleanupRedisChat();
}

module.exports = cleanupRedisChat;
