const axios = require('axios');

async function testRateLimiter() {
  console.log('Iniciando teste do Rate Limiter...');
  
  const baseURL = 'http://localhost:5000';
  const testEndpoint = '/api/test';
  
  try {
    // Teste de limite por IP
    console.log('\nTestando limite por IP...');
    for (let i = 1; i <= 105; i++) {
      try {
        const response = await axios.get(`${baseURL}${testEndpoint}`);
        console.log(`Requisição ${i}: Status ${response.status}`);
      } catch (error) {
        if (error.response && error.response.status === 429) {
          console.log(`Requisição ${i}: Rate limit atingido!`);
          break;
        }
      }
    }

    // Teste de limite por usuário (simulando autenticação)
    console.log('\nTestando limite por usuário...');
    const token = 'seu_token_jwt_aqui'; // Substitua por um token válido
    
    for (let i = 1; i <= 1005; i++) {
      try {
        const response = await axios.get(`${baseURL}${testEndpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log(`Requisição ${i}: Status ${response.status}`);
      } catch (error) {
        if (error.response && error.response.status === 429) {
          console.log(`Requisição ${i}: Rate limit atingido!`);
          break;
        }
      }
    }

  } catch (error) {
    console.error('Erro no teste:', error.message);
  }
}

// Executar o teste
testRateLimiter(); 