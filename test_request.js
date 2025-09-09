const fetch = require('node-fetch');

function createSeparator(char = '=', length = 60) {
  return char.repeat(length);
}

function formatJSON(obj, title = '') {
  if (title) console.log(`\n${title}:`);
  console.log(JSON.stringify(obj, null, 2));
}

function showRequestInfo() {
  console.log('\n' + createSeparator('=', 20));
  console.log('   REQUISIÇÃO DE TESTE');
  console.log(createSeparator('=', 20));
  
  console.log('\nURL:');
  console.log('   http://138.197.27.151:5000/api/lab-chats/messages');
  
  console.log('\nMétodo: PORRA');
  
  console.log('\nHeaders:');
  console.log('   Content-Type: application/json');
  console.log('   Authorization: Bearer [TOKEN]');
  
  console.log('\nBody:');
  console.log('   {"chat_name": "teeste de dragndrop"}');
  
  console.log('\n' + createSeparator('-', 40));
}

function showResponse(response, data) {
  console.log('\n' + createSeparator('=', 20));
  console.log('   RESPOSTA DO SERVIDOR');
  console.log(createSeparator('=', 20));
  
  console.log('\nStatus:', response.status, response.statusText);
  
  console.log('\nHeaders da Resposta:');
  const headers = Object.fromEntries(response.headers.entries());
  Object.entries(headers).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  
  console.log('\nInformações dos Dados:');
  console.log(`   Tipo: ${Array.isArray(data) ? 'array' : typeof data}`);
  console.log(`   Tamanho: ${Array.isArray(data) ? data.length : 'N/A'}`);
  
  if (Array.isArray(data) && data.length > 0) {
    console.log('\nEstrutura da Primeira Mensagem:');
    const firstMsg = data[0];
    console.log(`   ID: ${firstMsg.id || 'N/A'}`);
    console.log(`   Session ID: ${firstMsg.session_id || 'N/A'}`);
    console.log(`   Chat Name: ${firstMsg.chat_name || 'N/A'}`);
    console.log(`   Message Type: ${firstMsg.message?.type || 'N/A'}`);
    console.log(`   Message Content: ${firstMsg.message?.content ? 'Presente' : 'Ausente'}`);
    console.log(`   Last Update: ${firstMsg.last_update || 'N/A'}`);
    
    console.log('\nTodas as Mensagens:');
    data.forEach((msg, index) => {
      console.log(`\n${createSeparator('-', 30)}`);
      console.log(`MENSAGEM ${index + 1}/${data.length}`);
      console.log(createSeparator('-', 30));
      formatJSON(msg, `Mensagem ${index + 1}`);
    });
  } else {
    console.log('\nDados Completos:');
    formatJSON(data);
  }
}

async function testRequest() {
  showRequestInfo();
  
  try {
    console.log('\nEnviando requisição...');
    
    const response = await fetch('http://138.197.27.151:5000/api/lab-chats/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AUTH_TOKEN || 'SEU_TOKEN_AQUI'}`
      },
      body: JSON.stringify({
        chat_name: 'teeste de dragndrop'
      })
    });

    const data = await response.json();
    showResponse(response, data);

  } catch (error) {
    console.log('\n' + createSeparator('=', 20));
    console.log('   ERRO NA REQUISIÇÃO');
    console.log(createSeparator('=', 20));
    console.log('\nErro:', error.message);
    console.log('\nPossíveis causas:');
    console.log('   - Servidor não está rodando');
    console.log('   - Token de autenticação inválido');
    console.log('   - Problema de rede');
    console.log('   - Endpoint não existe');
  }
  
  console.log('\n' + createSeparator('=', 20));
  console.log('   TESTE CONCLUÍDO');
  console.log(createSeparator('=', 20));
}

testRequest();
