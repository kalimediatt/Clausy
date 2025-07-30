const redis = require('../config/redis.config');

async function testRedisKeys() {
  try {
    console.log('Testando chaves do Redis...');
    
    // Listar todas as chaves
    const keys = await redis.keys('*');
    console.log('Chaves encontradas:', keys);
    
    // Verificar valores das chaves
    for (const key of keys) {
      const value = await redis.get(key);
      const ttl = await redis.ttl(key);
      console.log(`Chave: ${key}, Valor: ${value}, TTL: ${ttl}s`);
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  } finally {
    redis.quit();
  }
}

testRedisKeys(); 