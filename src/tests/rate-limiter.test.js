const axios = require('axios');

async function testRateLimiter() {
  console.log('Iniciando teste do Rate Limiter...');
  
  const baseURL = 'http://localhost:5000';
  const testEndpoint = '/api/test';
  
  try {
    // Teste de limite por IP
    console.log('\nTestando limite por IP...');
    let ipLimitReached = false;
    
    for (let i = 1; i <= 105; i++) {
      try {
        const response = await axios.get(`${baseURL}${testEndpoint}`);
        console.log(`Requisição ${i}: Status ${response.status}`);
        console.log('Headers:', response.data.headers);
        
        if (response.data.headers['X-RateLimit-Remaining'] === '0') {
          console.log('Limite por IP atingido!');
          ipLimitReached = true;
          break;
        }
      } catch (error) {
        if (error.response && error.response.status === 429) {
          console.log(`Requisição ${i}: Rate limit atingido!`);
          ipLimitReached = true;
          break;
        }
      }
    }

    if (!ipLimitReached) {
      console.log('AVISO: Limite por IP não foi atingido como esperado');
    }

    // Aguardar 1 minuto para resetar o contador
    console.log('\nAguardando 1 minuto para resetar o contador...');
    await new Promise(resolve => setTimeout(resolve, 60000));

    // Teste de limite por usuário (simulando autenticação)
    console.log('\nTestando limite por usuário...');
    const token = 'seu_token_jwt_aqui'; // Substitua por um token válido
    let userLimitReached = false;
    
    for (let i = 1; i <= 1005; i++) {
      try {
        const response = await axios.get(`${baseURL}${testEndpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log(`Requisição ${i}: Status ${response.status}`);
        console.log('Headers:', response.data.headers);
        
        if (response.data.headers['X-RateLimit-Remaining'] === '0') {
          console.log('Limite por usuário atingido!');
          userLimitReached = true;
          break;
        }
      } catch (error) {
        if (error.response && error.response.status === 429) {
          console.log(`Requisição ${i}: Rate limit atingido!`);
          userLimitReached = true;
          break;
        }
      }
    }

    if (!userLimitReached) {
      console.log('AVISO: Limite por usuário não foi atingido como esperado');
    }

  } catch (error) {
    console.error('Erro no teste:', error.message);
  }
}

// Executar o teste
testRateLimiter(); 