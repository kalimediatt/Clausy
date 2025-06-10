# Guia de Escalabilidade - Clausy

Este documento contém recomendações e diretrizes para escalar o sistema Clausy para suportar um maior número de usuários simultâneos.

## Capacidade Atual

Com a configuração atual, o sistema tem as seguintes limitações:

1. **Pool de Conexões do Banco de Dados**:
   - 10 conexões simultâneas
   - Suporta 50-100 usuários simultâneos ativos
   - Sem limite de fila de espera

2. **Rate Limiting**:
   - 100 requisições por IP a cada 15 minutos
   - Aproximadamente 6-7 requisições por minuto por usuário
   - Suporta 15-20 usuários simultâneos por IP

3. **Servidor Express**:
   - Single-threaded por padrão
   - Sem clustering
   - Suporta 100-200 conexões simultâneas

## Recomendações de Otimização

### 1. Otimização do Pool de Conexões

```javascript
// src/config/db.js
const dbConfig = {
  waitForConnections: true,
  connectionLimit: 50,     // Aumentado de 10 para 50
  queueLimit: 100,        // Adicionado limite de fila
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  acquireTimeout: 30000,  // 30 segundos
  timeout: 10000,         // 10 segundos
  idleTimeout: 60000      // 60 segundos
};
```

### 2. Implementação de Clustering

```javascript
// cluster.js
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const app = require('./server');

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    console.log('Starting a new worker');
    cluster.fork();
  });
} else {
  // Workers can share any TCP connection
  const server = app.listen(process.env.PORT || 5000, () => {
    console.log(`Worker ${process.pid} started`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log(`Worker ${process.pid} received SIGTERM`);
    server.close(() => {
      process.exit(0);
    });
  });
}
```

### 3. Rate Limiting Otimizado

```javascript
// middleware/rateLimiting.js
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 50,                   // limite para autenticação
  message: 'Muitas tentativas de login. Por favor, tente novamente em 15 minutos.'
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 300,                  // limite para API geral
  message: 'Limite de requisições excedido. Por favor, tente novamente em 15 minutos.'
});

const queryLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minuto
  max: 30,                  // 30 requisições por minuto
  message: 'Limite de consultas excedido. Por favor, aguarde um momento.'
});

module.exports = {
  authLimiter,
  apiLimiter,
  queryLimiter
};
```

### 4. Sistema de Cache com Redis

```javascript
// services/cache.js
const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

class CacheService {
  async get(key) {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, expireSeconds = 3600) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', expireSeconds);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async invalidate(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache invalidate error:', error);
      return false;
    }
  }
}

module.exports = new CacheService();
```

### 5. Otimizações de Banco de Dados

```sql
-- Índices recomendados
ALTER TABLE users ADD INDEX idx_email (email);
ALTER TABLE users ADD INDEX idx_company_role (company_id, role);
ALTER TABLE queries ADD INDEX idx_user_timestamp (user_id, created_at);
ALTER TABLE usage_stats ADD INDEX idx_user_hour (user_id, hour);

-- Particionamento de tabelas grandes
ALTER TABLE queries
PARTITION BY RANGE (UNIX_TIMESTAMP(created_at)) (
    PARTITION p_2024_01 VALUES LESS THAN (UNIX_TIMESTAMP('2024-02-01 00:00:00')),
    PARTITION p_2024_02 VALUES LESS THAN (UNIX_TIMESTAMP('2024-03-01 00:00:00')),
    PARTITION p_max VALUES LESS THAN MAXVALUE
);
```

## Capacidade Após Otimizações

Com todas as otimizações implementadas, o sistema poderá suportar:

- **500-1000 usuários simultâneos**: Performance excelente
- **1000-2000 usuários simultâneos**: Performance boa
- **2000+ usuários simultâneos**: Performance aceitável

## Próximos Passos para Maior Escalabilidade

Para suportar mais de 2000 usuários simultâneos, considerar:

1. **Load Balancing**:
   - Implementar Nginx ou HAProxy
   - Distribuir carga entre múltiplos servidores
   - Configurar sticky sessions

2. **Microsserviços**:
   - Separar funcionalidades em serviços independentes
   - Usar message queues para comunicação assíncrona
   - Implementar service discovery

3. **Banco de Dados**:
   - Implementar sharding
   - Considerar migração para banco de dados mais robusto
   - Configurar réplicas de leitura

4. **CDN e Otimização de Conteúdo**:
   - Implementar CDN para arquivos estáticos
   - Otimizar e comprimir assets
   - Implementar lazy loading

5. **Monitoramento e Alertas**:
   - Implementar APM (Application Performance Monitoring)
   - Configurar alertas de performance
   - Monitorar métricas de sistema

## Requisitos de Infraestrutura Recomendados

Para suportar as otimizações:

- **Servidor Web**: 4+ CPUs, 16GB+ RAM
- **Banco de Dados**: 8+ CPUs, 32GB+ RAM
- **Redis**: 2+ CPUs, 8GB+ RAM
- **Storage**: SSD com alta IOPS
- **Rede**: Banda larga dedicada com baixa latência

## Considerações de Custo

Estimar aumento nos custos de infraestrutura:
- Servidores adicionais
- Licenças de software
- Banda de rede
- Serviços de monitoramento
- Equipe de operações

## Plano de Implementação

1. **Fase 1** (1-2 semanas):
   - Implementar clustering
   - Otimizar pool de conexões
   - Configurar rate limiting

2. **Fase 2** (2-3 semanas):
   - Implementar Redis
   - Otimizar banco de dados
   - Configurar índices

3. **Fase 3** (3-4 semanas):
   - Implementar load balancing
   - Configurar monitoramento
   - Realizar testes de carga

4. **Fase 4** (4+ semanas):
   - Migrar para microsserviços
   - Implementar sharding
   - Configurar CDN 