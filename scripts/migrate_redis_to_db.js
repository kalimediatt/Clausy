const redis = require('../src/config/redis.config');
const db = require('../src/config/db');

async function migrateRedisToDatabase() {
  try {
    console.log('🔄 Iniciando migração do Redis para o banco de dados...');
    
    // Obter todas as chaves de chat do Redis
    const keys = await redis.keys('chat:user:*:conversations');
    console.log(`📝 Encontradas ${keys.length} chaves de chat no Redis`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const key of keys) {
      try {
        // Extrair user_id da chave
        const userId = key.split(':')[2];
        console.log(`Migrando conversas do usuário ${userId}...`);
        
        // Obter todas as conversas do usuário
        const conversations = await redis.hgetall(key);
        
        if (!conversations || Object.keys(conversations).length === 0) {
          console.log(`Nenhuma conversa encontrada para usuário ${userId}`);
          continue;
        }
        
        // Migrar cada conversa
        for (const [conversationId, conversationData] of Object.entries(conversations)) {
          try {
            const conversation = JSON.parse(conversationData);
            
            // Verificar se a conversa não expirou
            if (conversation.expiresAt <= Date.now()) {
              console.log(`Conversa ${conversationId} expirada, pulando...`);
              continue;
            }
            
            // Calcular nova data de expiração
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            
            const connection = await db.getConnection();
            
            try {
              await connection.beginTransaction();
              
              // Inserir conversa
              await connection.execute(
                'INSERT INTO chat_conversations (id, user_id, title, preview, expires_at) VALUES (?, ?, ?, ?, ?)',
                [
                  conversation.id,
                  userId,
                  conversation.title || null,
                  conversation.preview || null,
                  expiresAt
                ]
              );
              
              // Inserir mensagens
              if (conversation.messages && conversation.messages.length > 0) {
                const messageValues = conversation.messages.map(msg => [
                  msg.id,
                  conversation.id,
                  msg.role,
                  msg.content
                ]);
                
                await connection.execute(
                  'INSERT INTO chat_messages (id, conversation_id, role, content) VALUES ?',
                  [messageValues]
                );
              }
              
              await connection.commit();
              migratedCount++;
              console.log(`✅ Conversa ${conversationId} migrada com sucesso`);
              
            } catch (error) {
              await connection.rollback();
              console.error(`❌ Erro ao migrar conversa ${conversationId}:`, error.message);
              errorCount++;
            } finally {
              connection.release();
            }
            
          } catch (error) {
            console.error(`❌ Erro ao processar conversa ${conversationId}:`, error.message);
            errorCount++;
          }
        }
        
      } catch (error) {
        console.error(`❌ Erro ao processar usuário:`, error.message);
        errorCount++;
      }
    }
    
    console.log('🎉 Migração concluída!');
    console.log(`✅ Conversas migradas: ${migratedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  migrateRedisToDatabase();
}

module.exports = migrateRedisToDatabase;
