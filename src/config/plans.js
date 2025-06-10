// Definição dos planos e seus limites
const PLANS = {
  FREE_TRIAL: {
    name: 'FREE_TRIAL',
    displayName: 'Free Trial',
    color: '#64748b',
    rateLimit: 50, // 50 req/hora
    tokenLimit: 3000,
    historyRetention: '24h',
    price: 0
  },
  BASIC: {
    name: 'BASIC',
    displayName: 'Básico',
    color: '#3b82f6',
    rateLimit: 20, // 20 req/hora
    tokenLimit: 50000,
    historyRetention: '7d',
    price: 99.90
  },
  STANDARD: {
    name: 'STANDARD',
    displayName: 'Standard',
    color: '#3b82f6',
    rateLimit: 150, // 150 req/hora
    tokenLimit: 15000,
    historyRetention: '7d',
    price: 99.90
  },
  PRO: {
    name: 'PRO',
    displayName: 'Pro',
    color: '#10b981',
    rateLimit: 1000, // 1000 req/hora
    tokenLimit: 50000,
    historyRetention: '30d',
    price: 249.90
  },
  ENTERPRISE: {
    name: 'ENTERPRISE',
    displayName: 'Enterprise',
    color: '#f59e0b',
    rateLimit: 10000, // 10000 req/hora
    tokenLimit: 200000,
    historyRetention: '90d',
    price: 499.90
  }
};

module.exports = PLANS; 