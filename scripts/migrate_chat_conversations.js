const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function migrateChatConversations() {
  try {
    console.log('🔄 Iniciando migração da tabela chat_conversations...');
    
    // Ler o arquivo SQL
    const sqlFile = path.join(__dirname, '../database/chat_conversations.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Dividir em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          await db.query(command);
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        } catch (error) {
          if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_DUP_FIELDNAME') {
            console.log(`⚠️  Comando ${i + 1} ignorado (já existe): ${error.message}`);
          } else {
            console.error(`❌ Erro no comando ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }
    
    console.log('🎉 Migração concluída com sucesso!');
    
    // Verificar se a tabela foi criada
    const [tables] = await db.query("SHOW TABLES LIKE 'chat_conversations'");
    if (tables.length > 0) {
      console.log('✅ Tabela chat_conversations criada/verificada');
      
      // Verificar estrutura da tabela
      const [columns] = await db.query("DESCRIBE chat_conversations");
      console.log('📋 Estrutura da tabela:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      console.error('❌ Tabela chat_conversations não foi criada');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  migrateChatConversations();
}

module.exports = migrateChatConversations; 