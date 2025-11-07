# Correções do Sistema de Histórico de Chats

## 📋 Problema Identificado

Quando havia múltiplos chats com o mesmo nome:
1. **Seleção visual incorreta**: Todos os chats com o mesmo nome ficavam destacados ao clicar em um
2. **Histórico compartilhado**: Chats com nomes idênticos mostravam o mesmo histórico
3. **Mensagens não apareciam**: Ao abrir um chat, as mensagens não eram exibidas mesmo com o n8n retornando dados

## 🔍 Causa Raiz

O sistema estava usando `chat_name` ou `session_id` como chave de identificação em vez de `chat_unique_id`, causando conflitos quando havia chats com nomes duplicados.

## ✅ Correções Implementadas

### 1. **Seleção Visual de Chats** (`src/pages/Home.js`)

**Antes:**
```javascript
// Linha 2777 - Sidebar
labSelectedConversation === (session.session_id || session.id)

// Linha 3962 - Modal de histórico
const isActive = labSelectedConversation === (session.session_id || session.id);
```

**Depois:**
```javascript
// Linha 2777 - Sidebar
labSelectedChatUniqueId === session.chat_unique_id

// Linha 3962 - Modal de histórico
const isActive = labSelectedChatUniqueId === session.chat_unique_id;
```

**Resultado:** Apenas o chat clicado fica destacado, mesmo com nomes duplicados.

---

### 2. **Função de Chave do Chat** (`src/pages/Home.js`)

**Antes:**
```javascript
const getCurrentLabChatKey = () => {
  const key = labSelectedChatName || labSelectedConversation || 'default';
  return key;
};
```

**Depois:**
```javascript
const getCurrentLabChatKey = () => {
  // Priorizar chat_unique_id para permitir múltiplos chats com mesmo nome
  const key = labSelectedChatUniqueId || labSelectedChatName || labSelectedConversation || 'default';
  return key;
};
```

**Resultado:** Chats com o mesmo nome têm chaves únicas no cache.

---

### 3. **Carregamento de Mensagens** (`src/pages/Home.js`)

**Antes:**
```javascript
// Linha 2596 - loadChatMessages
const chatKey = chatName || labSelectedConversation || 'default';
```

**Depois:**
```javascript
// Linha 2613 - loadChatMessages
const chatKey = labSelectedChatUniqueId || chatName || labSelectedConversation || 'default';
```

**Resultado:** Cada chat carrega seu próprio histórico baseado no ID único.

---

### 4. **Mudança de Chat** (`src/pages/Home.js`)

**Antes:**
```javascript
// Linhas 766-778
useEffect(() => {
  if (labSelectedChatName && activeItem === 'laboratory') {
    setLabMessagesByChat(prev => {
      const newState = { ...prev };
      const currentChatMessages = newState[labSelectedChatName] || [];
      return { [labSelectedChatName]: currentChatMessages };
    });
    // ...
  }
}, [labSelectedChatName, activeItem]);
```

**Depois:**
```javascript
// Linhas 764-792
useEffect(() => {
  if (labSelectedChatName && activeItem === 'laboratory') {
    const currentChatKey = labSelectedChatUniqueId || labSelectedChatName;
    
    setLabMessagesByChat(prev => {
      const newState = { ...prev };
      const currentChatMessages = newState[currentChatKey] || [];
      return { [currentChatKey]: currentChatMessages };
    });
    // ...
  }
}, [labSelectedChatName, labSelectedChatUniqueId, activeItem]);
```

**Resultado:** O cache de mensagens é gerenciado corretamente por ID único.

---

### 5. **Envio de Mensagens** (`src/pages/Home.js`)

**Antes:**
```javascript
// Linhas 1504-1508
if (!labSelectedChatName) {
  chatKey = chat_name; // ❌ ERRO: usa nome em vez de ID único
}
```

**Depois:**
```javascript
// Linhas 1504-1511
chatKey = currentChatUniqueId; // ✅ CORREÇÃO: sempre usa ID único

console.log('🔑 [FRONTEND] Chave de cache para mensagem:', {
  chatKey,
  chat_name,
  chat_unique_id: currentChatUniqueId
});
```

**Resultado:** Mensagens são armazenadas na chave correta.

---

### 6. **Cache de Novo Chat** (`src/pages/Home.js`)

**Antes:**
```javascript
// Linhas 1772-1783
// Limpar cache de mensagens para o novo chat
setLabMessagesByChat(prev => {
  const newState = { ...prev };
  delete newState[chatKey]; // ❌ ERRO: apaga mensagens que acabaram de ser criadas
  return newState;
});
```

**Depois:**
```javascript
// Linhas 1771-1778
// ✅ NÃO limpar cache - as mensagens já foram adicionadas corretamente acima
// O cache já contém a mensagem do usuário e a resposta da IA

console.log('✅ [FRONTEND] Chat criado e mensagens armazenadas:', {
  chatKey,
  chat_name,
  chat_unique_id: currentChatUniqueId
});
```

**Resultado:** Mensagens de novos chats não são perdidas.

---

### 7. **Auto-scroll do Chat** (`src/pages/Home.js`)

**Antes:**
```javascript
// Linha 562
const chatScrollRef = useAutoScroll([safeGet(labMessagesByChat, labSelectedChatName || labSelectedConversation || 'default', [])]);
```

**Depois:**
```javascript
// Linha 562
const chatScrollRef = useAutoScroll([safeGet(labMessagesByChat, getCurrentLabChatKey(), [])]);
```

**Resultado:** O scroll funciona corretamente usando a chave baseada em `chat_unique_id`.

---

### 8. **Dependências do useEffect de Scroll** (`src/pages/Home.js`)

**Antes:**
```javascript
// Linha 719
}, [labMessagesByChat, labSelectedChatName, labSelectedConversation, scrollToBottomMobile]);
```

**Depois:**
```javascript
// Linha 719
}, [labMessagesByChat, labSelectedChatName, labSelectedChatUniqueId, labSelectedConversation, scrollToBottomMobile]);
```

**Resultado:** O scroll é acionado corretamente quando `chat_unique_id` muda.

---

### 9. **Logs de Debug** (`src/routes/labchats.js` e `src/pages/Home.js`)

**Frontend:**
```javascript
console.log('🔍 [FRONTEND] Iniciando loadChatMessages:', { ... });
console.log('📦 [FRONTEND] Resposta recebida do backend:', { ... });
console.log('🔑 [FRONTEND] Chave de cache utilizada:', { ... });
```

**Backend:**
```javascript
console.log('✅ [BACKEND] Resposta do n8n recebida:', { ... });
console.log('📦 [BACKEND] Formato: ...', { ... });
console.log('📝 [BACKEND] Primeira mensagem (amostra):', { ... });
```

**Resultado:** Melhor rastreabilidade do fluxo de dados.

---

## 🎯 Fluxo Correto Agora

### Criação de Novo Chat:
1. Gerar `chat_unique_id` único
2. Usar `chat_unique_id` como `chatKey`
3. Salvar mensagens em `labMessagesByChat[chat_unique_id]`
4. Persistir `chat_unique_id` no Redis

### Seleção de Chat Existente:
1. Restaurar `labSelectedChatUniqueId` do chat clicado
2. Buscar histórico do n8n usando `chat_unique_id`
3. Armazenar mensagens em `labMessagesByChat[chat_unique_id]`
4. Destacar apenas o chat com o `chat_unique_id` correspondente

### Envio de Mensagem em Chat Existente:
1. Usar `labSelectedChatUniqueId` como `chatKey`
2. Adicionar mensagem em `labMessagesByChat[chat_unique_id]`
3. Enviar para n8n com `chat_unique_id`

---

## 📊 Estrutura de Dados

### Redis:
```
labchats:{chat_unique_id} = {
  chat_name: "teste",
  chat_unique_id: "02a0a600-6fbd-480c-ad56-ae16f156008b",
  session_id: "user_16_session_20251105_1452_1cr64smgo2s",
  user_id: 16,
  created_at: "2025-11-06T...",
  updated_at: "2025-11-06T..."
}
```

### Frontend State:
```javascript
labMessagesByChat = {
  "02a0a600-6fbd-480c-ad56-ae16f156008b": [
    { role: "user", content: "...", timestamp: "..." },
    { role: "assistant", content: "...", timestamp: "..." }
  ],
  "9de7685d-3601-414e-9cd3-70ed35bd910f": [
    { role: "user", content: "...", timestamp: "..." }
  ]
}
```

---

## ✅ Resultado Final

- ✅ Chats com nomes idênticos são completamente independentes
- ✅ Cada chat mantém seu próprio histórico único
- ✅ Seleção visual funciona corretamente
- ✅ Mensagens são exibidas ao abrir qualquer chat
- ✅ Sistema totalmente funcional com `chat_unique_id`

---

## 🧪 Como Testar

1. Criar 3 chats com o nome "teste"
2. Adicionar mensagens diferentes em cada um
3. Clicar em cada chat e verificar:
   - ✅ Apenas o chat clicado fica destacado
   - ✅ Histórico correto é exibido
   - ✅ Mensagens aparecem imediatamente
4. Verificar logs do console para debug

---

**Data da Correção:** 07/11/2025  
**Arquivos Modificados:**
- `src/pages/Home.js` (9 correções)
- `src/routes/labchats.js` (1 correção)

**Total de Correções:** 10

**Build Status:** ✅ Compilado com sucesso (apenas warnings não críticos)

