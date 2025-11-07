const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const userService = require('../src/services/user.service');

// Configurações
const DEFAULT_COMPANY_ID = process.env.SEED_COMPANY_ID ? parseInt(process.env.SEED_COMPANY_ID) : 1;
const DEFAULT_PLAN_ID = process.env.SEED_PLAN_ID || 'STANDARD';

function generateTempPassword() {
  // 16 chars, incluindo maiúsculas, minúsculas, dígitos e símbolos
  const base = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
  const pw = `${base.slice(0, 5)}!${base.slice(5, 9)}@${base.slice(9, 13)}#${Math.floor(100+Math.random()*900)}`;
  return pw;
}

const users = [
  // Super admin
  { name: 'Pedro Lacerda', email: 'pedro.lacerda@lacerdadiniz.com.br', role: 'superadmin' },

  // Societário
  { name: 'Fernando Oliveira', email: 'fernando.oliveira@lacerdadiniz.com.br', role: 'admin' },
  { name: 'Nathália Freitas', email: 'nathalia.freitas@lacerdadiniz.com.br', role: 'user' },

  // Contencioso de Escala
  { name: 'Davi Ribeiro', email: 'davi.ribeiro@lacerdadiniz.com.br', role: 'admin' },
  { name: 'Matheus Resende', email: 'matheus.resende@lacerdadiniz.com.br', role: 'user' },

  // Trabalhista
  { name: 'Luana Santiago', email: 'luana.santiago@lacerdadiniz.com.br', role: 'admin' },
  { name: 'Renato Figueiredo', email: 'renato.figueiredo@lacerdadiniz.com.br', role: 'user' },

  // Cível
  { name: 'Renato Lima', email: 'renato.lima@lacerdadiniz.com.br', role: 'user' },
  { name: 'Thaynna Maciel', email: 'thaynna.maciel@lacerdadiniz.com.br', role: 'user' },

  // Tributário
  { name: 'Gustavo Costa', email: 'gustavo.costa@lacerdadiniz.com.br', role: 'user' }
];

async function main() {
  const created = [];
  for (const u of users) {
    const password = generateTempPassword();
    const payload = {
      email: u.email,
      password,
      name: u.name,
      role: u.role,
      credits: 0,
      plan_id: DEFAULT_PLAN_ID,
      company_id: DEFAULT_COMPANY_ID
    };

    try {
      const existing = await userService.getUserByEmailNoIsolation(u.email);
      if (existing) {
        console.log(`[SKIP] Já existe: ${u.email}`);
        continue;
      }

      const result = await userService.createUser(payload);
      if (result.success) {
        created.push({ email: u.email, name: u.name, role: u.role, password });
        console.log(`[OK] Criado: ${u.email} (id=${result.userId})`);
      } else {
        console.error(`[ERRO] Falha ao criar ${u.email}: ${result.error}`);
      }
    } catch (err) {
      console.error(`[ERRO] Exceção ao criar ${u.email}:`, err.message);
    }
  }

  if (created.length) {
    console.log('\n=== Contas criadas (senhas temporárias) ===');
    created.forEach(c => {
      console.log(`- ${c.name} <${c.email}> [${c.role}] | senha: ${c.password}`);
    });
    console.log('\nATENÇÃO: envie as senhas temporárias aos usuários e recomende troca no primeiro acesso.');
  } else {
    console.log('Nenhuma conta criada.');
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Falha no seed:', err);
  process.exit(1);
});


