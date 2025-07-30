const axios = require('axios');

async function testSimpleRateLimit() {
  console.log('Iniciando teste simples do Rate Limiter...');
  
  const baseURL = 'http://localhost:5000';
  const testEndpoint = '/api/test';
  
  try {
    // Fazer 5 requisições e verificar os headers
    for (let i = 1; i <= 5; i++) {
      try {
        console.log(`\nFazendo requisição ${i}...`);
        const response = await axios.get(`${baseURL}${testEndpoint}`);
        console.log(`Requisição ${i}:`);
        console.log('Status:', response.status);
        console.log('Headers:', response.data.headers);
      } catch (error) {
        console.error(`Erro na requisição ${i}:`, error.message);
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Data:', error.response.data);
        }
      }
    }
    
  } catch (error) {
    console.error('Erro no teste:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Executar o teste
testSimpleRateLimit(); 