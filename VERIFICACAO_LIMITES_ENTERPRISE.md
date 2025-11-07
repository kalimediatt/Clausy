# 🔍 Guia de Verificação - Limites do Plano ENTERPRISE

## 📋 **Onde Verificar se Está Tudo Correto**

### 1. **✅ Arquivos de Configuração (Já Verificado)**

#### **Backend - `/src/config/plans.js`**
```bash
# Verificar se os valores estão corretos
grep -A 10 "ENTERPRISE:" /opt/Clausy-current/Clausy/src/config/plans.js
```
**Valores esperados:**
- `rateLimit: 100000`
- `tokenLimit: 5000000000`

#### **Frontend - `/src/contexts/AuthContext.js`**
```bash
# Verificar se os valores estão corretos
grep -A 15 "ENTERPRISE:" /opt/Clausy-current/Clausy/src/contexts/AuthContext.js
```
**Valores esperados:**
- `maxQueriesPerHour: 100000`
- `maxTokensPerHour: 5000000000`

### 2. **🗄️ Banco de Dados MySQL**

#### **Opção A: Script de Verificação**
```bash
cd /opt/Clausy-current/Clausy
node check_enterprise_limits.js
```

#### **Opção B: Comando SQL Direto**
```bash
mysql -u clausy_root -p'@N4td55k7%+[' -h 138.197.27.151 clausy -e "
SELECT plan_id, name, max_queries_per_hour, max_tokens_per_hour, price 
FROM subscription_plans 
WHERE plan_id = 'ENTERPRISE';"
```

**Valores esperados no banco:**
- `max_queries_per_hour: 100000`
- `max_tokens_per_hour: 5000000000`

### 3. **🔄 Cache Redis**

#### **Verificar Redis**
```bash
cd /opt/Clausy-current/Clausy
node update_enterprise_redis.js
```

### 4. **🌐 Interface Web**

#### **Verificar no Frontend:**
1. Acesse a aplicação web
2. Faça login com um usuário ENTERPRISE
3. Vá para **Configurações** ou **Plano**
4. Verifique se mostra:
   - **100.000 consultas por hora**
   - **5.000.000.000 tokens por hora**

### 5. **🧪 Teste de Funcionamento**

#### **Teste de Rate Limiting:**
1. Faça login com usuário ENTERPRISE
2. Execute várias consultas de IA
3. Verifique se não há bloqueio prematuro
4. Monitore os logs do servidor

#### **Verificar Logs:**
```bash
# Verificar logs da aplicação
pm2 logs clausy
# ou
tail -f /var/log/clausy/app.log
```

## 🚨 **Se Algo Estiver Incorreto**

### **Problema: Banco de Dados não atualizado**
```bash
# Executar script SQL
mysql -u clausy_root -p'@N4td55k7%+[' -h 138.197.27.151 clausy < update_enterprise_limits.sql
```

### **Problema: Redis não sincronizado**
```bash
# Executar script de sincronização
cd /opt/Clausy-current/Clausy
node update_enterprise_redis.js
```

### **Problema: Aplicação não refletindo mudanças**
```bash
# Reiniciar aplicação
pm2 restart clausy
# ou
npm restart
```

## 📊 **Checklist de Verificação**

- [ ] **Arquivos de configuração** - Valores corretos nos arquivos JS
- [ ] **Banco de dados** - Valores corretos na tabela `subscription_plans`
- [ ] **Cache Redis** - Usuários ENTERPRISE com limites corretos
- [ ] **Interface web** - Mostra os novos limites
- [ ] **Rate limiting** - Funciona com os novos limites
- [ ] **Logs** - Sem erros relacionados aos limites

## 🎯 **Valores Finais Esperados**

| Campo | Valor Anterior | Valor Novo | Status |
|-------|----------------|------------|--------|
| `max_queries_per_hour` | 10.000 | **100.000** | ✅ |
| `max_tokens_per_hour` | 200.000 | **5.000.000.000** | ✅ |

## 📞 **Suporte**

Se encontrar problemas:
1. Verifique os logs da aplicação
2. Confirme se o banco de dados foi atualizado
3. Reinicie a aplicação
4. Teste com um usuário ENTERPRISE

---

**Última atualização**: $(date)
**Status**: ✅ Configuração concluída
