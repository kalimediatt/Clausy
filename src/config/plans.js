// Definição dos planos e seus limites
const PLANS = {
  FREE_TRIAL: {
    name: 'FREE_TRIAL',
    displayName: 'Free Trial',
    color: '#64748b',
    rateLimit: 50000, // 50 req/hora
    tokenLimit: 300000000,
    historyRetention: '24h',
    price: 0
  },
  BASIC: {
    name: 'BASIC',
    displayName: 'Básico',
    color: '#3b82f6',
    rateLimit: 20000, // 20 req/hora
    tokenLimit: 5000000000,
    historyRetention: '7d',
    price: 99.90
  },
  STANDARD: {
    name: 'STANDARD',
    displayName: 'Standard',
    color: '#3b82f6',
    rateLimit: 150000, // 150 req/hora
    tokenLimit: 150000000000,
    historyRetention: '7d',
    price: 99.90
  },
  PRO: {
    name: 'PRO',
    displayName: 'Pro',
    color: '#10b981',
    rateLimit: 100000, // 1000 req/hora
    tokenLimit: 500000000000,
    historyRetention: '30d',
    price: 249.90
  },
  ENTERPRISE: {
    name: 'ENTERPRISE',
    displayName: 'Enterprise',
    color: '#f59e0b',
    rateLimit: 1000000, // 100000 req/hora
    tokenLimit: 500000000000000,
    historyRetention: '90d',
    price: 499.90
  }
};

module.exports = PLANS; 