const path = require('path');
const envPath = path.resolve(__dirname, '.env');
require('dotenv').config({ path: envPath });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const { rateLimiter } = require('./src/middlewares/rateLimiter');
const { planMiddleware, checkPlanAccess } = require('./src/middlewares/planManager');
const PLANS = require('./src/config/plans');
const multer = require('multer');
const fileProcessor = require('./src/services/fileProcessor.service');
const hpp = require('hpp');
const xss = require('xss-clean');
const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const os = require('os');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const { createStream } = require('rotating-file-stream');
const aiRateLimiter = require('./src/middlewares/aiRateLimiter');
const { logRequest } = require('./src/services/requestLogger.service');
const logViewer = require('./src/services/logViewer.service');
const { tokenLimiter } = require('./src/middlewares/tokenLimiter');
const tokenUsageService = require('./src/services/tokenUsage.service');
const redis = require('./src/services/redis.service');
const { encode } = require('gpt-3-encoder');
const settingsService = require('./src/services/settings.service');
let heapdump;
try {
    heapdump = require('heapdump');
} catch (error) {
    console.warn('heapdump module not available, memory leak detection will be disabled');
    heapdump = {
        writeSnapshot: (filename, callback) => {
            console.warn('heapdump not available, skipping snapshot');
            callback(null);
        }
    };
}

// Log de todas as variáveis de ambiente para debug
console.log('Variáveis de ambiente carregadas:');
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('API_KEY:', process.env.API_KEY ? 'Disponível' : 'Não disponível');

// Verificar se a API_KEY está disponível
console.log('API_KEY disponível:', process.env.API_KEY ? 'Sim' : 'Não');
console.log('PORT do .env:', process.env.PORT);

// Definir chave JWT com fallback para desenvolvimento
const JWT_SECRET = process.env.JWT_SECRET || 'clausy_secret_key_for_development';

// Importar serviços
const authService = require('./src/services/authService');
const dbService = require('./src/services/db.service');
const userService = require('./src/services/user.service');
const monicaAIService = require('./src/services/monica-ai.service');
const labChatsRouter = require('./src/routes/labchats');
const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
console.log('Porta final que será usada:', PORT);
console.log('Host que será usado:', HOST);

// Configurar trust proxy antes de qualquer middleware
app.set('trust proxy', '127.0.0.1');  // Apenas confiar no proxy local

// Configurar stream de logs
const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Configurar stream de logs
const accessLogStream = createStream('access.log', {
    interval: '1d',
    path: LOG_DIR,
    maxSize: '20M',
    maxFiles: 14
});

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://openapi.monica.im"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));

// Proteção contra ataques de injeção de parâmetros
app.use(hpp());

// Proteção contra XSS
app.use(xss());

// Sanitização de HTML
const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a'],
  allowedAttributes: {
    'a': ['href']
  }
};

// Middleware de sanitização
app.use((req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key], sanitizeOptions);
      }
    });
  }
  next();
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'build')));
app.use('/static', express.static(path.join(__dirname, 'build/static')));

// Handle favicon.ico requests explicitly
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// CORS configuration
app.use(cors({
  credentials: true,
  origin: [
    'http://138.197.27.151:5000',
    'http://localhost:5000',
    'http://138.197.27.151:3000',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Forwarded-For', 'X-Forwarded-Proto', 'Accept', 'X-Current-Session-Id'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 24 horas
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Define charset para garantir que caracteres Unicode sejam tratados corretamente
app.use((req, res, next) => {
  res.charset = 'utf-8';
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token inválido' });
    }
    console.log('DEBUG: authenticateToken - User data:', user);
    req.user = user;
    next();
  });
};

// Middleware de logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware de plano
app.use(planMiddleware);

// Rotas de teste para diferentes planos
app.get('/api/test/free', (req, res) => {
  res.json({
    success: true,
    message: 'Rota de teste para plano Free Trial',
    plan: req.userPlan.name
  });
});

app.get('/api/test/standard', 
  authenticateToken,
  checkPlanAccess(PLANS.STANDARD),
  (req, res) => {
    res.json({
      success: true,
      message: 'Rota de teste para plano Standard',
      plan: req.userPlan.name
    });
  }
);

app.get('/api/test/pro', 
  authenticateToken,
  checkPlanAccess(PLANS.PRO),
  (req, res) => {
    res.json({
      success: true,
      message: 'Rota de teste para plano PRO',
      plan: req.userPlan.name
    });
  }
);

// Company access middleware
const checkCompanyAccess = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const requestUser = req.user;

    if (!requestUser) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    }

    // Se for superadmin, permite acesso
    if (requestUser.role === 'superadmin') {
      return next();
    }
    
    // Buscar o usuário alvo para verificar a empresa
    const targetUser = await dbService.executeQuery(
      'SELECT company_id FROM users WHERE user_id = ?',
      [userId]
    );
    
    if (targetUser.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }
    
    // Se for da mesma empresa, permite acesso
    if (requestUser.company_id === targetUser[0].company_id) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: 'Acesso negado: este recurso pertence a outra empresa' 
    });
  } catch (error) {
    console.error('Erro na verificação de acesso:', error);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: err.errors
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Não autorizado'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erro interno no servidor'
  });
});

// Health check endpoint (mover para antes da rota catch-all)
app.get('/test', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

// Rota catch-all movida para o final do arquivo

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios' });
  }

  const result = await authService.login(email, password, req);
  
  if (result.success) {
    res.json({
      success: true,
      token: result.token,
      user: result.user
    });
  } else {
    res.status(401).json(result);
  }
});

// Get authentication logs
app.get('/api/auth/logs', authenticateToken, async (req, res) => {
  try {
    // Only allow admin and superadmin to access logs
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso não autorizado'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 20; // Definido como número fixo
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        al.log_id as id,
        al.username,
        al.ip_address,
        al.success,
        al.success as status,
        al.timestamp,
        al.user_agent,
        al.additional_info,
        u.company_id
      FROM auth_logs al
      INNER JOIN users u ON al.username = u.email
    `;

    let countQuery = `
      SELECT COUNT(*) as total
      FROM auth_logs al
      INNER JOIN users u ON al.username = u.email
    `;

    const queryParams = [];
    const countParams = [];

    // Se não for superadmin, filtra por empresa
    if (req.user.role !== 'superadmin') {
      query += ` WHERE u.company_id = ?`;
      countQuery += ` WHERE u.company_id = ?`;
      const companyId = parseInt(req.user.company_id);
      queryParams.push(companyId);
      countParams.push(companyId);
    }

    // Sanitize limit and offset
    const limitNum = Math.max(1, Math.min(Number(limit), 100)); // limit between 1 and 100
    const offsetNum = Math.max(0, Number(offset));
    query += ` ORDER BY al.timestamp DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
    // Do NOT push limitNum and offsetNum to queryParams anymore
    
    let logs, totalCount;
    try {
      console.log('Executando queries com parâmetros:', {
        query,
        queryParams,
        countQuery,
        countParams
      });
      
      [logs, totalCount] = await Promise.all([
        dbService.executeQuery(query, queryParams),
        dbService.executeQuery(countQuery, countParams)
      ]);
    } catch (error) {
      console.error('Erro ao executar query:', error);
      throw error;
    }
    
    // Ensure logs is an array and handle empty results
    const formattedLogs = Array.isArray(logs) ? logs.map(log => ({
      id: log.id,
      username: log.username,
      ip_address: log.ip_address,
      success: log.success,
      status: log.success === 1 ? 'success' : 'failed',
      timestamp: log.timestamp,
      user_agent: log.user_agent,
      additional_info: log.additional_info
    })) : [];
    
    const total = totalCount[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: formattedLogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar logs de autenticação'
    });
  }
});

// Rota de logout
app.post('/api/auth/logout', (req, res) => {
  try {
    // Limpar o token do cliente
    res.clearCookie('auth_token');
    
    // Retornar resposta de sucesso
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
});

// Rota para verificar autenticação
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Rota para obter estatísticas de uso
app.get('/api/user/:userId/usage-stats', authenticateToken, checkCompanyAccess, (req, res) => {
  // Dados simulados para estatísticas de uso
  const usageStats = {
    queries_remaining: 220,
    queries_used: 80,
    tokens_remaining: 8500,
    tokens_used: 1500,
    quota_reset_date: "2023-06-01T00:00:00Z",
    history: [
      { date: "2023-05-20", queries: 12, tokens: 250 },
      { date: "2023-05-21", queries: 8, tokens: 180 },
      { date: "2023-05-22", queries: 15, tokens: 320 },
      { date: "2023-05-23", queries: 10, tokens: 200 },
      { date: "2023-05-24", queries: 20, tokens: 400 },
      { date: "2023-05-25", queries: 5, tokens: 100 },
      { date: "2023-05-26", queries: 10, tokens: 250 }
    ],
    last_query: {
      timestamp: "2023-05-26T15:30:00Z",
      prompt: "Pesquisa sobre direito tributário",
      tokens: 48
    }
  };
  
  res.json({ success: true, data: usageStats });
});

// Rota para obter membros da equipe
app.get('/api/team-members', authenticateToken, (req, res) => {
  // Dados simulados para membros da equipe
  const teamMembers = [
    {
      id: 1,
      name: 'Maria Silva',
      email: 'maria@alfa.com.br',
      role: 'Advogada',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      active: true,
      company_id: 1
    },
    {
      id: 2,
      name: 'João Pereira',
      email: 'joao@alfa.com.br',
      role: 'Advogado Associado',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      active: true,
      company_id: 1
    },
    {
      id: 3,
      name: 'Carlos Mendes',
      email: 'carlos@beta.com.br',
      role: 'Advogado Sênior',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
      active: true,
      company_id: 2
    }
  ];
  
  // Filtrar por empresa do usuário atual, exceto para superadmin
  const filteredMembers = req.user.role === 'superadmin' 
    ? teamMembers 
    : teamMembers.filter(member => member.company_id === req.user.company_id);
  
  res.json({ success: true, data: filteredMembers });
});

// Rota para obter distribuição de consultas
app.get('/api/user/:userId/query-distribution', authenticateToken, checkCompanyAccess, (req, res) => {
  // Dados simulados para distribuição de consultas
  const distribution = [
    { category: 'Contratos', count: 42, color: '#4299e1' },
    { category: 'Processos', count: 28, color: '#48bb78' },
    { category: 'Pareceres', count: 19, color: '#ed8936' },
    { category: 'Pesquisas', count: 15, color: '#9f7aea' },
    { category: 'Outros', count: 8, color: '#667eea' }
  ];
  
  res.json({ success: true, data: distribution });
});

// Rota para obter estatísticas do dashboard
app.get('/api/user/:userId/dashboard-stats', authenticateToken, checkCompanyAccess, (req, res) => {
  // Dados simulados para estatísticas do dashboard
  const stats = {
    totalQueries: 112,
    activeQueries: 8,
    savedPrompts: 24,
    creditsUsed: 780,
    creditsTotal: 1000,
    queryHistory: [
      { date: '2023-05-01', count: 8 },
      { date: '2023-05-02', count: 12 },
      { date: '2023-05-03', count: 15 },
      { date: '2023-05-04', count: 10 },
      { date: '2023-05-05', count: 20 },
      { date: '2023-05-06', count: 18 },
      { date: '2023-05-07', count: 5 }
    ],
    recentActivity: [
      { type: 'query', date: '2023-05-07T14:32:00Z', description: 'Busca por jurisprudência' },
      { type: 'document', date: '2023-05-06T11:20:00Z', description: 'Contrato de locação analisado' },
      { type: 'query', date: '2023-05-05T16:45:00Z', description: 'Pesquisa sobre legislação trabalhista' }
    ]
  };
  
  res.json({ success: true, data: stats });
});

// Rota para obter tarefas
app.get('/api/user/:userId/tasks', authenticateToken, checkCompanyAccess, (req, res) => {
  // Dados simulados para tarefas
  const tasks = [
    {
      id: 1,
      title: 'Revisão de contrato',
      description: 'Revisar contrato de prestação de serviços',
      status: 'pending',
      dueDate: '2023-05-15T23:59:59Z',
      priority: 'high',
      assignee: 'Maria Silva'
    },
    {
      id: 2,
      title: 'Elaborar parecer',
      description: 'Elaborar parecer sobre caso tributário',
      status: 'in-progress',
      dueDate: '2023-05-20T23:59:59Z',
      priority: 'medium',
      assignee: 'João Pereira'
    },
    {
      id: 3,
      title: 'Pesquisa jurisprudência',
      description: 'Pesquisar jurisprudência sobre tema XYZ',
      status: 'completed',
      dueDate: '2023-05-10T23:59:59Z',
      priority: 'low',
      assignee: 'Carlos Mendes'
    }
  ];
  
  res.json({ success: true, data: tasks });
});

// Protected routes
app.use('/api/user/:userId/', authenticateToken, checkCompanyAccess);
app.use('/api/admin/', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Acesso negado' });
  }
  next();
});

// Rota para listar usuários
app.get('/api/users', authenticateToken, async (req, res) => {
  let connection;
  try {
    console.log('DEBUG /api/users');
    console.log('req.user:', req.user);
    connection = await dbService.getConnection();
    // Se for superadmin, retorna todos os usuários
    if (req.user.role === 'superadmin') {
      const [users] = await connection.execute(
        'SELECT u.*, sp.name as plan_name, sp.color as plan_color, ' +
        'c.name as company_name, c.document as company_document ' +
        'FROM users u ' +
        'JOIN subscription_plans sp ON u.plan_id = sp.plan_id ' +
        'JOIN companies c ON u.company_id = c.company_id'
      );
      console.log('Resultado da query users (superadmin):', users);
      return res.json({ success: true, data: users });
    }
    // Se for admin, retorna apenas usuários da mesma empresa
    const [users] = await connection.execute(
      'SELECT u.*, sp.name as plan_name, sp.color as plan_color, ' +
      'c.name as company_name, c.document as company_document ' +
      'FROM users u ' +
      'JOIN subscription_plans sp ON u.plan_id = sp.plan_id ' +
      'JOIN companies c ON u.company_id = c.company_id ' +
      'WHERE u.company_id = ?',
      [req.user.company_id]
    );
    console.log('Resultado da query users (admin):', users);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
});

// Rota para listar empresas (apenas para superadmin)
app.get('/api/companies', authenticateToken, async (req, res) => {
  try {
    console.log('DEBUG /api/companies - Iniciando');
    console.log('req.user:', req.user);
    
    // Apenas superadmin pode listar empresas
    if (req.user.role !== 'superadmin') {
      console.log('DEBUG /api/companies - Acesso negado, role:', req.user.role);
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: Only superadmin can list companies' 
      });
    }
    
    console.log('DEBUG /api/companies - Executando query');
    const companies = await dbService.executeQuery(
      'SELECT company_id, name, document FROM companies ORDER BY name ASC'
    );
    
    console.log('DEBUG /api/companies - Query executada, resultado:', companies);
    console.log('DEBUG /api/companies - Número de empresas encontradas:', companies.length);
    
    res.json({ success: true, data: companies });
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
});

// Rota para criar novo usuário
app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    console.log('DEBUG /api/users (POST)');
    console.log('req.body:', req.body);
    console.log('req.user:', req.user);
    
    // Verificar se o usuário tem permissão para criar usuários
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: Only admins can create users' 
      });
    }
    
    const { email, password, name, role = 'user', credits = 0, plan = 'FREE_TRIAL' } = req.body;
    
    // Validações básicas
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, password and name are required' 
      });
    }
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }
    
    // Obter configuração de comprimento mínimo de senha
    const minPasswordLength = await settingsService.getSetting('minPasswordLength');
    
    // Validar senha usando a configuração do sistema
    if (password.length < minPasswordLength) {
      return res.status(400).json({ 
        success: false, 
        message: `Password must be at least ${minPasswordLength} characters long` 
      });
    }
    
    // Verificar se o email já existe
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    // Verificar se verificação de email é obrigatória
    // const requireEmailVerification = await settingsService.getSetting('requireEmailVerification');
    // if (requireEmailVerification) {
    //   // Aqui você pode implementar a lógica de verificação de email
    //   // Por enquanto, apenas simular que o usuário precisa verificar o email
    //   return res.status(400).json({ 
    //     success: false, 
    //     message: 'Email verification is required for new users. Please contact an administrator.' 
    //   });
    // }
    
    // Determinar a empresa do novo usuário
    let companyId = req.user.company_id;
    
    // Se for superadmin, pode criar usuário em qualquer empresa
    if (req.user.role === 'superadmin' && req.body.company_id) {
      companyId = req.body.company_id;
    }
    
    // Criar o usuário
    const userData = {
      email,
      password,
      name,
      role,
      credits: parseInt(credits) || 0,
      plan_id: plan,
      company_id: companyId
    };
    
    const result = await userService.createUser(userData);
    
    // Verificar se logs de auditoria estão ativados
    const auditLogs = await settingsService.getSetting('auditLogs');
    if (auditLogs) {
      // Log da ação de criação de usuário
      console.log(`[AUDIT LOG] User creation: Admin ${req.user.email} created user ${email} with role ${role}`);
    }
    
    if (result.success) {
      // Verificar se notificações de novos usuários estão ativadas
      const newUserNotifications = await settingsService.getSetting('newUserNotifications');
      if (newUserNotifications) {
        // Aqui você pode implementar o envio de notificações
        // Por exemplo, enviar email para administradores ou log no sistema
        console.log(`[NOTIFICATION] New user created: ${email} by admin: ${req.user.email}`);
      }
      
      res.status(201).json({ 
        success: true, 
        message: 'User created successfully',
        userId: result.userId
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: result.error || 'Failed to create user' 
      });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Rota para listar usuários por empresa
app.get('/api/company/:companyId/users', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const requestUser = req.user;
    
    console.log('DEBUG /api/company/:companyId/users');
    console.log('companyId param:', companyId);
    console.log('req.user:', requestUser);
    
    if (!requestUser) {
      console.error('User not authenticated');
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    // Se não for superadmin, só pode acessar a própria empresa
    if (requestUser.role !== 'superadmin' && requestUser.company_id !== parseInt(companyId)) {
      console.error('Access denied: User can only view users from their own company');
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: You can only view users from your own company' 
      });
    }
    
    // Se for superadmin, pode buscar qualquer empresa
    console.log('DEBUG: Chamando userService.getAllUsers');
    console.log('DEBUG: requestUser.role:', requestUser.role);
    console.log('DEBUG: requestUser.company_id:', requestUser.company_id);
    console.log('DEBUG: companyId param:', companyId);
    
    const targetCompanyId = requestUser.role === 'superadmin' ? parseInt(companyId) : requestUser.company_id;
    const isSuperadmin = requestUser.role === 'superadmin';
    
    console.log('DEBUG: targetCompanyId:', targetCompanyId);
    console.log('DEBUG: isSuperadmin:', isSuperadmin);
    
    const users = await userService.getAllUsers(targetCompanyId, isSuperadmin);
    
    console.log('Resultado da query users:', users);
    
    if (!users) {
      console.error('No users found or error in query');
      return res.status(500).json({ success: false, message: 'Error fetching users' });
    }
    
    console.log('DEBUG: Enviando resposta com', users.length, 'usuários');
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching company users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Adicionar rota para adicionar créditos a um usuário
app.post('/api/users/:userId/add-credits', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credit amount. Amount must be a positive number.'
      });
    }
    
    // Verificar se o usuário tem permissão para adicionar créditos
    // Admin pode adicionar créditos na própria empresa, superadmin pode adicionar em qualquer empresa
    const targetUser = await userService.getUserByEmail(userId);
    
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (req.user.role !== 'superadmin' && req.user.company_id !== targetUser.company_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: You can only add credits to users from your own company' 
      });
    }
    
    const result = await userService.addCredits(userId, parseInt(amount));
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: `${amount} credits added successfully`,
        user: { ...targetUser, credits: (targetUser.credits || 0) + parseInt(amount) }
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: result.error || 'Failed to add credits' 
      });
    }
  } catch (error) {
    console.error('Error adding credits:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Rota para atualizar informações do usuário
app.post('/api/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    console.log('DEBUG /api/users/:userId (UPDATE)');
    console.log('userId:', userId);
    console.log('updates:', updates);
    console.log('req.user:', req.user);
    
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No update data provided'
      });
    }
    
    // Verificar se o usuário tem permissão para atualizar
    const targetUser = await userService.getUserByEmail(userId);
    
    console.log('targetUser:', targetUser);
    
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Admin pode atualizar usuários da própria empresa, superadmin pode atualizar qualquer usuário
    if (req.user.role !== 'superadmin' && req.user.company_id !== targetUser.company_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: You can only update users from your own company' 
      });
    }
    
    // Impedir que usuários não-admin alterem o papel (role) de usuários
    if (updates.role && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: Only admins can change user roles' 
      });
    }
    
    const result = await userService.updateUser(userId, updates);
    console.log('Update result:', result);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'User updated successfully',
        user: { ...targetUser, ...updates }
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: result.error || 'Failed to update user' 
      });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Rota para deletar usuário
app.post('/api/users/:userId/delete', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('DEBUG /api/users/:userId/delete');
    console.log('userId:', userId);
    console.log('req.user:', req.user);
    
    // Verificar se o usuário tem permissão para deletar
    const targetUser = await userService.getUserByEmail(userId);
    
    console.log('targetUser:', targetUser);
    
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Admin pode deletar usuários da própria empresa, superadmin pode deletar qualquer usuário
    if (req.user.role !== 'superadmin' && req.user.company_id !== targetUser.company_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: You can only delete users from your own company' 
      });
    }
    
    // Impedir que o usuário delete a si mesmo
    if (req.user.email === userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You cannot delete your own account' 
      });
    }
    
    const result = await userService.removeUser(userId);
    console.log('Delete result:', result);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'User deleted successfully'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: result.error || 'Failed to delete user' 
      });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Rota para alterar plano do usuário
app.post('/api/users/:userId/change-plan', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan_id } = req.body;
    
    console.log('DEBUG /api/users/:userId/change-plan');
    console.log('userId:', userId);
    console.log('plan_id:', plan_id);
    console.log('req.user:', req.user);
    
    if (!plan_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Plan ID is required' 
      });
    }
    
    // Verificar se o usuário tem permissão para alterar plano
    const targetUser = await userService.getUserByEmail(userId);
    
    console.log('targetUser:', targetUser);
    
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Admin pode alterar plano de usuários da própria empresa, superadmin pode alterar qualquer usuário
    if (req.user.role !== 'superadmin' && req.user.company_id !== targetUser.company_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: You can only change plans for users from your own company' 
      });
    }
    
    const result = await userService.changePlan(userId, plan_id);
    console.log('Change plan result:', result);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'User plan changed successfully',
        user: { ...targetUser, plan_id }
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: result.error || 'Failed to change user plan' 
      });
    }
  } catch (error) {
    console.error('Error changing user plan:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Configuração do Multer
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB
    }
});

// Validação de upload de arquivos
const validateFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Nenhum arquivo foi enviado'
    });
  }

  // Validar tipo MIME
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de arquivo não suportado'
    });
  }

  // Validar tamanho (20MB)
  const maxSize = 20 * 1024 * 1024;
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: 'Arquivo muito grande. Tamanho máximo: 20MB'
    });
  }

  next();
};

// Rota para processar consultas à IA
app.post('/api/ai/query', 
  authenticateToken,
  upload.single('file'),
  aiRateLimiter,
  tokenLimiter,
  async (req, res) => {
  try {
    console.log('Received AI query request');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');

    const { prompt, maxTokens = 500 } = req.body;
    let setup = req.body.setup;
    let fileContent = null;
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (setup && typeof setup === 'string') {
      try {
        setup = JSON.parse(setup);
      } catch (e) {
        console.error('Erro ao fazer parse do JSON de setup:', e);
        return res.status(400).json({ success: false, message: 'Formato de setup inválido.' });
      }
    }

    // Process file if it exists
    if (req.file) {
      try {
        console.log('Starting file processing:', req.file.originalname);
        
        // Get file extension
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        console.log('File extension:', fileExt);
        
        // Process file based on type
        if (fileExt === '.pdf') {
          console.log('Processing PDF file');
          const pdf = require('pdf-parse');
          const pdfData = await pdf(req.file.buffer);
          fileContent = pdfData.text;
        } else if (fileExt === '.docx') {
          console.log('Processing DOCX file');
          const mammoth = require('mammoth');
          const result = await mammoth.extractRawText({ buffer: req.file.buffer });
          fileContent = result.value;
        } else if (fileExt === '.txt') {
          console.log('Processing text file');
          fileContent = req.file.buffer.toString('utf-8');
        }

        if (!fileContent || fileContent.trim().length === 0) {
          throw new Error('File content is empty after processing');
        }

        console.log('File processed successfully. Content length:', fileContent.length);

        // Validação de Tokens
        const TOKEN_LIMIT = 64000;
        const promptTokens = encode(prompt).length;
        const fileTokens = encode(fileContent).length;
        const setupTokens = setup ? encode(JSON.stringify(setup)).length : 0;
        const totalInputTokens = promptTokens + fileTokens + setupTokens;

        console.log(`Token estimation: prompt=${promptTokens}, file=${fileTokens}, setup=${setupTokens}, total=${totalInputTokens}`);

        if (totalInputTokens > TOKEN_LIMIT) {
          return res.status(400).json({
            success: false,
            message: `O arquivo é muito grande e excede o limite de ${TOKEN_LIMIT} tokens. (Estimativa: ${totalInputTokens} tokens)`,
            code: 'TOKEN_LIMIT_EXCEEDED'
          });
        }

        // Get user for credit calculation
        const user = await userService.getUserById(req.user.user_id);
        if (!user) {
          throw new Error('User not found');
        }
        
        // Process the query with the file content and setup
        const setupPrompt = setup ? `[Setup: ${setup.title}]\\n${setup.prompt}\\n\\n` : '';
        const requestTimestamp = Date.now();
        const aiResponse = await monicaAIService.sendQuery(
          `${setupPrompt}Conteúdo do arquivo "${req.file.originalname}":\\n${fileContent}\\n\\nPergunta do usuário: ${prompt}`,
          maxTokens
        );
        const responseTimestamp = Date.now();

        if (!aiResponse.success) {
          return res.status(500).json({
            success: false,
            message: aiResponse.message || 'Erro ao processar consulta com a IA'
          });
        }

        // Atualizar uso de tokens
        const estimatedTokens = totalInputTokens + (aiResponse.usage?.completion_tokens || Number(maxTokens));
        console.log('DEBUG: server.js - Antes de chamar updateTokenUsage', {
          userId: req.user.user_id,
          tokens: estimatedTokens,
          companyId: req.user.company_id,
          requestTimestamp,
          responseTimestamp
        });

        await tokenUsageService.updateTokenUsage(
          req.user.user_id, 
          estimatedTokens,
          req.user.company_id,
          requestTimestamp,
          responseTimestamp
        );

        console.log('DEBUG: server.js - Depois de chamar updateTokenUsage');

        // Return the response
        res.json({
          success: true,
          message: aiResponse.content,
          usage: {
            tokens: estimatedTokens,
            remaining_credits: isDevelopment ? 9999 : (user.credits - estimatedTokens),
            limit: req.tokenUsage.limit,
            used: req.tokenUsage.current + estimatedTokens,
            remaining: req.tokenUsage.limit === Infinity ? Infinity : req.tokenUsage.limit - (req.tokenUsage.current + estimatedTokens)
          }
        });

      } catch (error) {
        console.error('Error processing file:', error);
        return res.status(400).json({
          success: false,
          message: 'Erro ao processar o arquivo: ' + error.message
        });
      }
    } else {
      // Process query without file
      const user = await userService.getUserById(req.user.user_id);
      if (!user) {
        throw new Error('User not found');
      }

      // Include setup in the prompt if available
      const setupPrompt = setup ? `[Setup: ${setup.title}]\n${setup.prompt}\n\n` : '';
      const aiResponse = await monicaAIService.sendQuery(
        `${setupPrompt}${prompt}`,
        maxTokens
      );

      if (!aiResponse.success) {
        return res.status(500).json({
          success: false,
          message: aiResponse.message || 'Erro ao processar consulta com a IA'
        });
      }

      // Atualizar uso de tokens
      console.log('DEBUG: server.js - Antes de chamar updateTokenUsage (sem arquivo)', {
        userId: req.user.user_id,
        tokens: aiResponse.usage?.total_tokens || (encode(prompt).length + (setup ? encode(typeof setup === 'string' ? setup : (setup.title + (setup.prompt || ''))).length : 0) + Number(maxTokens)),
        companyId: req.user.company_id
      });

      await tokenUsageService.updateTokenUsage(
        req.user.user_id, 
        aiResponse.usage?.total_tokens || (encode(prompt).length + (setup ? encode(typeof setup === 'string' ? setup : (setup.title + (setup.prompt || ''))).length : 0) + Number(maxTokens)), 
        req.user.company_id
      );

      console.log('DEBUG: server.js - Depois de chamar updateTokenUsage (sem arquivo)');

      res.json({
        success: true,
        message: aiResponse.content,
        usage: {
          tokens: aiResponse.usage?.total_tokens || (encode(prompt).length + (setup ? encode(typeof setup === 'string' ? setup : (setup.title + (setup.prompt || ''))).length : 0) + Number(maxTokens)),
          remaining_credits: isDevelopment ? 9999 : (user.credits - (aiResponse.usage?.total_tokens || (encode(prompt).length + (setup ? encode(typeof setup === 'string' ? setup : (setup.title + (setup.prompt || ''))).length : 0) + Number(maxTokens)))),
          limit: req.tokenUsage.limit,
          used: req.tokenUsage.current + (aiResponse.usage?.total_tokens || (encode(prompt).length + (setup ? encode(typeof setup === 'string' ? setup : (setup.title + (setup.prompt || ''))).length : 0) + Number(maxTokens))),
          remaining: req.tokenUsage.limit - (req.tokenUsage.current + (aiResponse.usage?.total_tokens || (encode(prompt).length + (setup ? encode(typeof setup === 'string' ? setup : (setup.title + (setup.prompt || ''))).length : 0) + Number(maxTokens))))
        }
      });
    }
  } catch (error) {
    console.error('Erro ao processar consulta de IA:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no servidor: ' + error.message
    });
  }
});

// Rota para adicionar créditos de teste ao usuário atual (apenas em desenvolvimento)
app.post('/api/dev/add-credits', authenticateToken, async (req, res) => {
  try {
    // Verificar se estamos em ambiente de desenvolvimento
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (!isDevelopment) {
      return res.status(403).json({
        success: false,
        message: 'Esta função só está disponível em ambiente de desenvolvimento'
      });
    }

    const { amount = 1000 } = req.body;
    const userId = req.user.user_id;
    
    // Obter o usuário
    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Adicionar créditos usando o email do usuário
    const result = await userService.addCredits(user.email, amount);
    
    if (result.success) {
      return res.json({
        success: true,
        message: `${amount} créditos adicionados com sucesso`,
        newCredits: (user.credits || 0) + amount
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.error || 'Erro ao adicionar créditos'
      });
    }
  } catch (error) {
    console.error('Erro ao adicionar créditos de teste:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
});

// Rota para upload de arquivo com validação
app.post('/api/upload', 
  authenticateToken, 
  upload.single('file'),
  validateFile,
  async (req, res) => {
    try {
      // Processar o arquivo
      const result = await fileProcessor.processFile(req.file);

      res.json({
        success: true,
        content: result.content,
        pageCount: result.pageCount,
        fileType: result.fileType
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao processar o arquivo'
      });
    }
});

// Monica AI API proxy
app.use('/api/monica-ai', aiRateLimiter, createProxyMiddleware({
    target: 'https://openapi.monica.im',
    changeOrigin: true,
    pathRewrite: {
        '^/api/monica-ai': '/v1'
    },
    onProxyReq: (proxyReq, req, res) => {
        // Add API key to the request
        proxyReq.setHeader('Authorization', `Bearer ${process.env.API_KEY}`);
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({
            success: false,
            message: 'Erro ao conectar com a API da Monica AI'
        });
    },
    proxyTimeout: 300000, // 300 segundos
    timeout: 300000 // 300 segundos
}));

// Adicionar middleware para aumentar o timeout das requisições
app.use((req, res, next) => {
    req.setTimeout(300000); // 300 segundos
    res.setTimeout(300000); // 300 segundos
    next();
});

// System resource monitoring
function monitorSystemResources() {
    const cpuUsage = os.loadavg()[0];
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();
    const memoryUsage = process.memoryUsage();
    
    console.log('System Resources:', {
        cpuLoad: cpuUsage.toFixed(2),
        freeMemory: `${Math.round(freeMemory / 1024 / 1024)}MB`,
        totalMemory: `${Math.round(totalMemory / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
    });
    
    if (cpuUsage > 80) {
        console.warn('High CPU usage detected:', cpuUsage);
    }
    
    if (freeMemory < totalMemory * 0.2) {
        console.warn('Low memory available:', freeMemory);
    }
}

// Memory leak detection
let lastHeapSize = 0;
function checkForMemoryLeaks() {
    // Desativado para evitar criação de heapsnapshots
    return;
    /*
    const currentHeapSize = process.memoryUsage().heapUsed;
    if (currentHeapSize > lastHeapSize * 1.5) {
        console.warn('Possible memory leak detected');
        const filename = `heap-${Date.now()}.heapsnapshot`;
        heapdump.writeSnapshot(filename, (err) => {
            if (err) {
                console.error('Error writing heap snapshot:', err);
            } else {
                console.log('Heap snapshot written to:', filename);
            }
        });
    }
    lastHeapSize = currentHeapSize;
    */
}

// Set up monitoring intervals
setInterval(monitorSystemResources, 60000); // Every minute
// setInterval(checkForMemoryLeaks, 300000); // Every 5 minutes - Desativado

// Resource limits
const resourceLimits = {
    maxFileSize: 20 * 1024 * 1024, // 20MB
    maxConcurrentUploads: 5,
    maxProcessingTime: 30000, // 30 seconds
    maxMemory: Math.floor(os.totalmem() * 0.8) // 80% of total memory
};

// Add to your existing middleware
app.use((req, res, next) => {
    // Check system resources before processing request
    const cpuUsage = os.loadavg()[0];
    const freeMemory = os.freemem();
    
    if (cpuUsage > 90 || freeMemory < os.totalmem() * 0.1) {
        return res.status(503).json({
            success: false,
            message: 'Server is currently under heavy load. Please try again later.'
        });
    }
    next();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    // Close database connections
    // dbService.closePool()
    //   .then(() => {
    //     console.log('Database connections closed');
    //     process.exit(0);
    //   })
    //   .catch(err => {
    //     console.error('Error closing database connections:', err);
    //     process.exit(1);
    //   });
    console.log('Finalizando servidor...');
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em http://${HOST}:${PORT}`);
});

// Configurar timeout do servidor
server.timeout = 300000; // 300 segundos
server.keepAliveTimeout = 300000; // 300 segundos
server.headersTimeout = 300000; // 300 segundos

// Rotas para visualização de logs (apenas para admin e superadmin)
app.get('/api/logs/recent', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({
            success: false,
            message: 'Acesso não autorizado'
        });
    }

    const limit = parseInt(req.query.limit) || 100;
    const logs = await logViewer.getRecentLogs(limit);
    res.json({ success: true, data: logs });
});

app.get('/api/logs/filter', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({
            success: false,
            message: 'Acesso não autorizado'
        });
    }

    const filters = req.query;
    const logs = await logViewer.filterLogs(filters);
    res.json({ success: true, data: logs });
});

// Rota para alterar limites temporariamente (apenas para admin e superadmin)
app.post('/api/admin/limits/:userId', authenticateToken, async (req, res) => {
    try {
        // Verificar se é admin ou superadmin
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Acesso não autorizado'
            });
        }

        const { userId } = req.params;
        const { rateLimit, tokenLimit, duration } = req.body;

        // Validar parâmetros
        if (!rateLimit || !tokenLimit || !duration) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetros inválidos. Necessário: rateLimit, tokenLimit e duration (em minutos)'
            });
        }

        // Criar chave temporária no Redis
        const key = `user:${userId}:temp_limits`;
        const tempLimits = {
            rateLimit: parseInt(rateLimit),
            tokenLimit: parseInt(tokenLimit),
            expiresAt: Date.now() + (parseInt(duration) * 60 * 1000)
        };

        await redis.setex(key, parseInt(duration) * 60, JSON.stringify(tempLimits));

        res.json({
            success: true,
            message: 'Limites temporários definidos com sucesso',
            limits: tempLimits
        });
    } catch (error) {
        console.error('Erro ao definir limites temporários:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao definir limites temporários'
        });
    }
});

// Rota para remover limites temporários
app.delete('/api/admin/limits/:userId', authenticateToken, async (req, res) => {
    try {
        // Verificar se é admin ou superadmin
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Acesso não autorizado'
            });
        }

        const { userId } = req.params;
        const key = `user:${userId}:temp_limits`;

        await redis.del(key);

        res.json({
            success: true,
            message: 'Limites temporários removidos com sucesso'
        });
    } catch (error) {
        console.error('Erro ao remover limites temporários:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao remover limites temporários'
        });
    }
});

// Rotas para configurações do sistema
app.get('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin ou superadmin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso não autorizado'
      });
    }

    const settings = await settingsService.getAllSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar configurações'
    });
  }
});

app.post('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin ou superadmin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso não autorizado'
      });
    }

    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Configurações inválidas'
      });
    }

    const result = await settingsService.saveSettings(settings);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Configurações salvas com sucesso'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao salvar configurações'
      });
    }
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

app.post('/api/admin/settings/reset', authenticateToken, async (req, res) => {
  try {
    // Verificar se é superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas superadministradores podem resetar configurações'
      });
    }

    const result = await settingsService.resetSettings();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Configurações resetadas para padrão'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao resetar configurações'
      });
    }
  } catch (error) {
    console.error('Erro ao resetar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

app.get('/api/admin/settings/history', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin ou superadmin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso não autorizado'
      });
    }

    const history = await settingsService.getSettingsHistory();
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico'
    });
  }
});

// Rota para obter dados do dashboard de tokens
app.get('/api/report/token-history', authenticateToken, async (req, res) => {
  try {
    const { user_id, role, company_id } = req.user;
    let data = {};

    // Função para normalizar a data
    const normalizeDate = (entry) => {
      if (entry.localRequestTime) {
        // Formato brasileiro: "16/06/2025, 20:04:28"
        const [datePart, timePart] = entry.localRequestTime.split(', ');
        const [day, month, year] = datePart.split('/');
        const [hour, minute, second] = timePart.split(':');
        return new Date(year, month - 1, day, hour, minute, second).toISOString();
      } else if (entry.requestTimestamp) {
        return entry.requestTimestamp;
      } else if (entry.timestamp) {
        return entry.timestamp;
      } else {
        return new Date().toISOString(); // Fallback
      }
    };

    // Buscar dados do Redis baseado no papel do usuário
    if (role === 'superadmin') {
      // Superadmin vê dados de todas as empresas
      const companies = await dbService.executeQuery('SELECT company_id, name FROM companies');
      
      for (const company of companies) {
        const users = await dbService.executeQuery(
          'SELECT user_id, name, email FROM users WHERE company_id = ?',
          [company.company_id]
        );

        data[company.name] = await Promise.all(users.map(async (user) => {
          const history = await tokenUsageService.getPermanentTokenHistory(user.user_id);
          return {
            userId: user.user_id,
            name: user.name,
            email: user.email,
            data: history.map(h => ({
              date: normalizeDate(h),
              tokens: h.tokens
            }))
          };
        }));
      }
    } else if (role === 'admin') {
      // Admin vê dados da sua empresa
      const company = await dbService.executeQuery(
        'SELECT name FROM companies WHERE company_id = ?',
        [company_id]
      );

      const users = await dbService.executeQuery(
        'SELECT user_id, name, email FROM users WHERE company_id = ?',
        [company_id]
      );

      data[company[0].name] = await Promise.all(users.map(async (user) => {
        const history = await tokenUsageService.getPermanentTokenHistory(user.user_id);
        return {
          userId: user.user_id,
          name: user.name,
          email: user.email,
          data: history.map(h => ({
            date: normalizeDate(h),
            tokens: h.tokens
          }))
        };
      }));
    } else {
      // Usuário comum vê apenas seus dados
      const user = await dbService.executeQuery(
        'SELECT u.name, c.name as company_name FROM users u JOIN companies c ON u.company_id = c.company_id WHERE u.user_id = ?',
        [user_id]
      );

      const history = await tokenUsageService.getPermanentTokenHistory(user_id);
      data[user[0].company_name] = [{
        userId: user_id,
        name: user[0].name,
        data: history.map(h => ({
          date: normalizeDate(h),
          tokens: h.tokens
        }))
      }];
    }

    res.json({
      success: true,
      data: {
        companies: data,
        userRole: role
      }
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico de tokens',
      error: error.message
    });
  }
});

app.use('/api', labChatsRouter);