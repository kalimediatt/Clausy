const redis = require('./src/config/redis.config');
const tokenUsageService = require('./src/services/tokenUsage.service');

async function validateTelemetry() {
  try {
    console.log('🔍 Validando Telemetrias do Sistema\n');
    
    // 1. Verificar dados do usuário 1
    console.log('📊 Dados do Usuário 1:');
    const user1History = await tokenUsageService.getPermanentTokenHistory(1);
    console.log(`   Total de registros: ${user1History.length}`);
    
    if (user1History.length > 0) {
      const totalTokens = user1History.reduce((sum, entry) => sum + entry.tokens, 0);
      const avgTokens = totalTokens / user1History.length;
      console.log(`   Total de tokens: ${totalTokens}`);
      console.log(`   Média por consulta: ${avgTokens.toFixed(2)}`);
      
      // Verificar formato dos dados
      const sampleEntry = user1History[0];
      console.log(`   Formato dos dados: ${Object.keys(sampleEntry).join(', ')}`);
      
      // Verificar se tem localRequestTime
      const hasLocalTime = user1History.some(h => h.localRequestTime);
      console.log(`   Tem localRequestTime: ${hasLocalTime}`);
      
      // Verificar se tem requestTimestamp
      const hasTimestamp = user1History.some(h => h.requestTimestamp);
      console.log(`   Tem requestTimestamp: ${hasTimestamp}`);
    }
    
    // 2. Verificar dados de outros usuários
    console.log('\n👥 Verificando outros usuários:');
    const users = [2, 3, 4, 5];
    for (const userId of users) {
      const history = await tokenUsageService.getPermanentTokenHistory(userId);
      if (history.length > 0) {
        const totalTokens = history.reduce((sum, entry) => sum + entry.tokens, 0);
        console.log(`   Usuário ${userId}: ${history.length} registros, ${totalTokens} tokens`);
      }
    }
    
    // 3. Verificar processamento de dados (simular frontend)
    console.log('\n📈 Simulando processamento do frontend:');
    if (user1History.length > 0) {
      const allTokens = user1History.map(h => ({
        tokens: h.tokens,
        date: new Date(h.localRequestTime || h.requestTimestamp),
        user: 'Usuário 1'
      }));
      
      // Agrupar por hora
      const hourlyData = {};
      allTokens.forEach(entry => {
        const hour = entry.date.getHours();
        if (!hourlyData[hour]) hourlyData[hour] = [];
        hourlyData[hour].push(entry.tokens);
      });
      
      console.log('   Consumo por hora:');
      Object.keys(hourlyData).sort().forEach(hour => {
        const avg = hourlyData[hour].reduce((a, b) => a + b, 0) / hourlyData[hour].length;
        console.log(`     ${hour}h: ${hourlyData[hour].length} consultas, média ${avg.toFixed(2)} tokens`);
      });
      
      // Agrupar por dia da semana
      const dailyData = {};
      allTokens.forEach(entry => {
        const day = entry.date.getDay();
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dayName = dayNames[day];
        if (!dailyData[dayName]) dailyData[dayName] = [];
        dailyData[dayName].push(entry.tokens);
      });
      
      console.log('   Consumo por dia da semana:');
      ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].forEach(day => {
        if (dailyData[day] && dailyData[day].length > 0) {
          const avg = dailyData[day].reduce((a, b) => a + b, 0) / dailyData[day].length;
          console.log(`     ${day}: ${dailyData[day].length} consultas, média ${avg.toFixed(2)} tokens`);
        }
      });
    }
    
    // 4. Verificar possíveis problemas
    console.log('\n⚠️ Verificando possíveis problemas:');
    
    // Verificar se há dados com formato inconsistente
    const inconsistentData = user1History.filter(h => !h.localRequestTime && !h.requestTimestamp);
    if (inconsistentData.length > 0) {
      console.log(`   ❌ ${inconsistentData.length} registros sem timestamp válido`);
    } else {
      console.log('   ✅ Todos os registros têm timestamp válido');
    }
    
    // Verificar se há tokens negativos ou zero
    const invalidTokens = user1History.filter(h => h.tokens <= 0);
    if (invalidTokens.length > 0) {
      console.log(`   ❌ ${invalidTokens.length} registros com tokens inválidos (≤ 0)`);
    } else {
      console.log('   ✅ Todos os registros têm tokens válidos (> 0)');
    }
    
    // Verificar se há datas futuras
    const futureDates = user1History.filter(h => {
      const date = new Date(h.localRequestTime || h.requestTimestamp);
      return date > new Date();
    });
    if (futureDates.length > 0) {
      console.log(`   ❌ ${futureDates.length} registros com datas futuras`);
    } else {
      console.log('   ✅ Nenhum registro com data futura');
    }
    
    console.log('\n✅ Validação concluída!');
    
  } catch (error) {
    console.error('❌ Erro na validação:', error);
  } finally {
    process.exit(0);
  }
}

validateTelemetry(); 