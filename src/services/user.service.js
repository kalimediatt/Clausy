const crypto = require('crypto');
const db = require('./db.service');

// Função para hash de senha
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Obter todos os usuários de uma empresa (ou todos, se superadmin)
async function getAllUsers(company_id = null, isSuperadmin = false) {
  console.log('DEBUG: getAllUsers chamado com company_id:', company_id, 'isSuperadmin:', isSuperadmin);
  
  let query = `
    SELECT 
      u.user_id, 
      u.email, 
      u.name, 
      u.role, 
      u.credits, 
      u.plan_id, 
      u.last_login,
      u.company_id,
      p.name as plan_name, 
      p.color as plan_color,
      c.name as company_name
    FROM users u
    LEFT JOIN subscription_plans p ON u.plan_id = p.plan_id
    LEFT JOIN companies c ON u.company_id = c.company_id
  `;
  const params = [];
  if (!isSuperadmin && company_id) {
    query += ' WHERE u.company_id = ?';
    params.push(company_id);
    console.log('DEBUG: Adicionando filtro por company_id:', company_id);
  } else {
    console.log('DEBUG: Sem filtro por company_id - isSuperadmin:', isSuperadmin, 'company_id:', company_id);
  }
  query += ' ORDER BY u.name ASC';
  
  console.log('DEBUG: Query final:', query);
  console.log('DEBUG: Parâmetros:', params);
  
  const results = await db.executeQuery(query, params);
  console.log('DEBUG: Resultados da query:', results.length, 'usuários');
  
  // Log dos primeiros 3 usuários para debug
  if (results.length > 0) {
    console.log('DEBUG: Primeiros usuários:', results.slice(0, 3).map(u => ({ email: u.email, company_id: u.company_id, name: u.name })));
  }
  
  return results;
}

// Obter usuário por email (com isolamento opcional)
async function getUserByEmail(email, company_id = null, isSuperadmin = false) {
  let query = `
    SELECT u.user_id, u.email, u.password_hash, u.name, u.role, u.credits, u.plan_id, u.last_login, 
           p.name as plan_name, p.color as plan_color
    FROM users u
    JOIN subscription_plans p ON u.plan_id = p.plan_id
    WHERE u.email = ?
  `;
  const params = [email];
  if (!isSuperadmin && company_id) {
    query += ' AND u.company_id = ?';
    params.push(company_id);
  }
  const results = await db.executeQuery(query, params);
  return results.length ? results[0] : null;
}

// Verificar credenciais
async function verifyCredentials(email, password) {
  const hashedPassword = hashPassword(password);
  const query = 'SELECT * FROM users WHERE email = ? AND password_hash = ?';
  const results = await db.executeQuery(query, [email, hashedPassword]);
  return results.length > 0 ? results[0] : null;
}

// Criar usuário
async function createUser(userData) {
  const { email, password, name, role = 'user', credits = 0, plan_id = 'FREE_TRIAL', company_id } = userData;
  const hashedPassword = hashPassword(password);
  
  const query = `
    INSERT INTO users (email, password_hash, name, role, credits, plan_id, company_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  try {
    const result = await db.executeQuery(query, [
      email, hashedPassword, name, role, credits, plan_id, company_id
    ]);
    return { success: true, userId: result.insertId };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return { success: false, error: error.message };
  }
}

// Atualizar usuário
async function updateUser(email, updates) {
  const allowedFields = ['name', 'role', 'credits', 'plan_id'];
  const setValues = [];
  const params = [];
  
  // Construir a parte SET da query com os campos permitidos
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      setValues.push(`${field} = ?`);
      params.push(updates[field]);
    }
  });
  
  // Adicionar senha se fornecida
  if (updates.password) {
    setValues.push('password_hash = ?');
    params.push(hashPassword(updates.password));
  }
  
  // Se não houver nada para atualizar, retornar
  if (setValues.length === 0) {
    return { success: false, error: 'Nenhum campo válido para atualizar' };
  }
  
  // Adicionar o email para a cláusula WHERE
  params.push(email);
  
  const query = `UPDATE users SET ${setValues.join(', ')} WHERE email = ?`;
  
  try {
    const result = await db.executeQuery(query, params);
    return { success: result.affectedRows > 0, affectedRows: result.affectedRows };
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return { success: false, error: error.message };
  }
}

// Atualizar último login
async function updateLastLogin(email) {
  const query = 'UPDATE users SET last_login = NOW() WHERE email = ?';
  await db.executeQuery(query, [email]);
}

// Remover usuário
async function removeUser(email) {
  const query = 'DELETE FROM users WHERE email = ?';
  try {
    const result = await db.executeQuery(query, [email]);
    return { success: result.affectedRows > 0, affectedRows: result.affectedRows };
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    return { success: false, error: error.message };
  }
}

// Adicionar créditos
async function addCredits(email, amount) {
  const query = 'UPDATE users SET credits = credits + ? WHERE email = ?';
  try {
    const result = await db.executeQuery(query, [amount, email]);
    return { success: result.affectedRows > 0 };
  } catch (error) {
    console.error('Erro ao adicionar créditos:', error);
    return { success: false, error: error.message };
  }
}

// Alterar plano
async function changePlan(email, newPlan) {
  const query = 'UPDATE users SET plan_id = ? WHERE email = ?';
  try {
    const result = await db.executeQuery(query, [newPlan, email]);
    return { success: result.affectedRows > 0 };
  } catch (error) {
    console.error('Erro ao alterar plano:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obter usuário por ID
 * @param {number} userId - ID do usuário
 * @returns {Promise<object>} - Usuário encontrado ou null
 */
async function getUserById(userId) {
  const query = `
    SELECT u.user_id, u.email, u.name, u.role, u.credits, u.plan_id, u.last_login,
           u.company_id, c.name as company_name
    FROM users u
    LEFT JOIN companies c ON u.company_id = c.company_id
    WHERE u.user_id = ?
  `;
  
  const results = await db.executeQuery(query, [userId]);
  return results.length > 0 ? results[0] : null;
}

module.exports = {
  getAllUsers,
  getUserByEmail,
  verifyCredentials,
  createUser,
  updateUser,
  updateLastLogin,
  removeUser,
  addCredits,
  changePlan,
  hashPassword,
  getUserById
}; 