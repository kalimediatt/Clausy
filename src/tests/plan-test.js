const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  email: 'admin@alfa.com.br',
  password: 'admin123'
};

async function testPlans() {
  console.log('Iniciando testes de planos...\n');

  try {
    // 1. Teste sem autenticação (deve usar FREE_TRIAL)
    console.log('1. Testando rotas sem autenticação:');
    try {
      const response = await axios.get(`${BASE_URL}/api/test/free`);
      console.log('✓ /api/test/free:', response.status, response.data);
    } catch (error) {
      console.log('✗ /api/test/free:', error.response?.status, error.response?.data?.message || error.message);
    }

    try {
      const response = await axios.get(`${BASE_URL}/api/test/standard`);
      console.log('✓ /api/test/standard:', response.status, response.data);
    } catch (error) {
      console.log('✗ /api/test/standard:', error.response?.status, error.response?.data?.message || error.message);
    }

    try {
      const response = await axios.get(`${BASE_URL}/api/test/pro`);
      console.log('✓ /api/test/pro:', response.status, response.data);
    } catch (error) {
      console.log('✗ /api/test/pro:', error.response?.status, error.response?.data?.message || error.message);
    }

    // 2. Login para obter token
    console.log('\n2. Realizando login:');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
      const token = loginResponse.data.token;
      console.log('✓ Login realizado com sucesso');

      // Configurar headers com token
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // 3. Teste com autenticação
      console.log('\n3. Testando rotas com autenticação:');
      try {
        const response = await axios.get(`${BASE_URL}/api/test/free`, { headers });
        console.log('✓ /api/test/free:', response.status, response.data);
      } catch (error) {
        console.log('✗ /api/test/free:', error.response?.status, error.response?.data?.message || error.message);
      }

      try {
        const response = await axios.get(`${BASE_URL}/api/test/standard`, { headers });
        console.log('✓ /api/test/standard:', response.status, response.data);
      } catch (error) {
        console.log('✗ /api/test/standard:', error.response?.status, error.response?.data?.message || error.message);
      }

      try {
        const response = await axios.get(`${BASE_URL}/api/test/pro`, { headers });
        console.log('✓ /api/test/pro:', response.status, response.data);
      } catch (error) {
        console.log('✗ /api/test/pro:', error.response?.status, error.response?.data?.message || error.message);
      }

      // 4. Teste de rate limiting
      console.log('\n4. Testando rate limiting:');
      console.log('Enviando 60 requisições em sequência...');
      
      const requests = Array(60).fill().map(() => 
        axios.get(`${BASE_URL}/api/test/free`, { headers })
          .then(response => ({
            status: response.status,
            remaining: response.headers['x-ratelimit-remaining'],
            limit: response.headers['x-ratelimit-limit']
          }))
          .catch(error => ({
            status: error.response?.status,
            message: error.response?.data?.message || error.message
          }))
      );

      const results = await Promise.all(requests);
      const successCount = results.filter(r => r.status === 200).length;
      const blockedCount = results.filter(r => r.status === 429).length;

      console.log(`\nResultados do rate limiting:`);
      console.log(`- Requisições bem-sucedidas: ${successCount}`);
      console.log(`- Requisições bloqueadas: ${blockedCount}`);
      
      if (successCount > 0) {
        const lastSuccess = results.find(r => r.status === 200);
        console.log(`- Último limite restante: ${lastSuccess.remaining}/${lastSuccess.limit}`);
      }
    } catch (error) {
      console.log('✗ Erro no login:', error.response?.data?.message || error.message);
    }
  } catch (error) {
    console.error('Erro durante os testes:', error.message);
  }
}

// Executar os testes
testPlans(); 