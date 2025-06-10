const cacheService = require('../services/cache.service');

async function testRedis() {
  console.log('Iniciando teste do Redis...');

  // Teste de armazenamento
  const testData = {
    id: 1,
    name: 'Teste Redis',
    timestamp: new Date().toISOString()
  };

  console.log('Armazenando dados de teste...');
  await cacheService.set('test:key', testData, 60);

  // Teste de recuperação
  console.log('Recuperando dados de teste...');
  const retrievedData = await cacheService.get('test:key');
  console.log('Dados recuperados:', retrievedData);

  // Teste de verificação
  console.log('Verificando existência da chave...');
  const exists = await cacheService.exists('test:key');
  console.log('Chave existe:', exists);

  // Teste de remoção
  console.log('Removendo dados de teste...');
  await cacheService.del('test:key');

  // Verificação final
  const finalCheck = await cacheService.exists('test:key');
  console.log('Chave ainda existe:', finalCheck);

  console.log('Teste do Redis concluído!');
}

// Executar o teste
testRedis().catch(console.error); 