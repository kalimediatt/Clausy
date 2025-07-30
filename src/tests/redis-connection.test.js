const redis = require('../config/redis.config');

async function testRedisConnection() {
  try {
    console.log('Testando conexão com Redis...');
    
    // Teste de ping
    const pingResult = await redis.ping();
    console.log('Ping:', pingResult);
    
    // Teste de set/get
    await redis.set('test:connection', 'connected');
    const value = await redis.get('test:connection');
    console.log('Valor armazenado:', value);
    
    // Teste de incremento
    const count = await redis.incr('test:counter');
    console.log('Contador:', count);
    
    // Limpar dados de teste
    await redis.del('test:connection');
    await redis.del('test:counter');
    
    console.log('Teste concluído com sucesso!');
  } catch (error) {
    console.error('Erro no teste:', error);
  } finally {
    // Fechar conexão
    redis.quit();
  }
}

testRedisConnection(); 