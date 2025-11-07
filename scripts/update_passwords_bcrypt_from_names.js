const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcrypt');
const db = require('../src/services/db.service');

// Util: remover acentos e caracteres não alfanuméricos
function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9 ]+/g, '')
    .trim();
}

function toPasswordFromName(name) {
  const clean = normalizeName(name);
  const parts = clean.split(/\s+/).filter(Boolean);
  const joined = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
  return `${joined}@2025!`;
}

const users = [
  { name: 'Pedro Lacerda', email: 'pedro.lacerda@lacerdadiniz.com.br' },
  { name: 'Fernando Oliveira', email: 'fernando.oliveira@lacerdadiniz.com.br' },
  { name: 'Nathália Freitas', email: 'nathalia.freitas@lacerdadiniz.com.br' },
  { name: 'Davi Ribeiro', email: 'davi.ribeiro@lacerdadiniz.com.br' },
  { name: 'Matheus Resende', email: 'matheus.resende@lacerdadiniz.com.br' },
  { name: 'Luana Santiago', email: 'luana.santiago@lacerdadiniz.com.br' },
  { name: 'Renato Figueiredo', email: 'renato.figueiredo@lacerdadiniz.com.br' },
  { name: 'Renato Lima', email: 'renato.lima@lacerdadiniz.com.br' },
  { name: 'Thaynna Maciel', email: 'thaynna.maciel@lacerdadiniz.com.br' },
  { name: 'Gustavo Costa', email: 'gustavo.costa@lacerdadiniz.com.br' }
];

async function main() {
  const saltRounds = 10;
  const updated = [];

  for (const u of users) {
    const plain = toPasswordFromName(u.name);
    const hash = await bcrypt.hash(plain, saltRounds);

    const sql = 'UPDATE users SET password_hash = ? WHERE email = ?';
    try {
      await db.executeQuery(sql, [hash, u.email]);
      updated.push({ ...u, password: plain, hash });
      console.log(`[OK] Senha atualizada para ${u.email}`);
    } catch (err) {
      console.error(`[ERRO] Falha ao atualizar ${u.email}:`, err.message);
    }
  }

  console.log('\n=== Novas senhas (bcrypt) ===');
  updated.forEach(u => {
    console.log(`- ${u.name} <${u.email}> | senha: ${u.password}`);
  });
  console.log('\nATENÇÃO: distribua as senhas com segurança e recomende troca no primeiro acesso.');
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Falha na atualização de senhas:', err);
  process.exit(1);
});


