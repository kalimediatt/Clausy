const axios = require('axios');

async function testRateLimits() {
  console.log('Testando Rate Limits...\n');
  
  const BASE_URL = 'http://localhost:5000';
  const TEST_USER = {
    email: 'test@example.com',
    password: 'test123'
  };

  try {
    // 1. Teste sem autenticação (rate limit por IP)
    console.log('1. Testando rate limit por IP (sem autenticação):');
    const response = await axios.get(`${BASE_URL}/api/test/free`);
    
    console.log('Headers de Rate Limit:');
    console.log(`- Limite total: ${response.headers['x-ratelimit-limit']}`);
    console.log(`- Requisições restantes: ${response.headers['x-ratelimit-remaining']}`);
    console.log(`- Reset em: ${response.headers['x-ratelimit-reset']} segundos\n`);

    // 2. Teste com autenticação (rate limit por usuário)
    console.log('2. Testando rate limit por usuário (com autenticação):');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
    const token = loginResponse.data.token;

    const authResponse = await axios.get(`${BASE_URL}/api/user/16/dashboard-stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Headers de Rate Limit (usuário):');
    console.log(`- Limite total: ${authResponse.headers['x-ratelimit-limit']}`);
    console.log(`- Requisições restantes: ${authResponse.headers['x-ratelimit-remaining']}`);
    console.log(`- Reset em: ${authResponse.headers['x-ratelimit-reset']} segundos\n`);

    // 3. Teste de múltiplas requisições
    console.log('3. Testando múltiplas requisições:');
    const requests = Array(10).fill().map(() => 
      axios.get(`${BASE_URL}/api/test/free`)
        .then(response => ({
          status: response.status,
          remaining: response.headers['x-ratelimit-remaining'],
          limit: response.headers['x-ratelimit-limit']
        }))
        .catch(error => ({
          status: error.response?.status,
          message: error.response?.data?.message
        }))
    );

    const results = await Promise.all(requests);
    console.log('Resultados das requisições:');
    results.forEach((result, index) => {
      console.log(`Requisição ${index + 1}:`);
      console.log(`- Status: ${result.status}`);
      if (result.remaining) {
        console.log(`- Restantes: ${result.remaining}/${result.limit}`);
      }
      if (result.message) {
        console.log(`- Mensagem: ${result.message}`);
      }
      console.log('---');
    });

  } catch (error) {
    console.error('Erro durante o teste:', error.message);
  }
}

testRateLimits(); 