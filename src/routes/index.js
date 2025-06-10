const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const authService = require('../services/authService');
const fileService = require('../services/fileProcessor.service');
const cacheService = require('../services/cache.service');
const monitor = require('../utils/monitor');
const logging = require('../utils/logger');
const config = require('../config/config');

// Middleware de validação
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Middleware de autenticação
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        const decoded = await authService.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        logging.error('Authentication error', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Middleware de autorização
const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        
        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        next();
    };
};

// Middleware de cache
const cache = (duration) => {
    return async (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }
        
        const key = `cache:${req.originalUrl}`;
        const cached = await cacheService.get(key);
        
        if (cached) {
            return res.json(cached);
        }
        
        res.sendResponse = res.json;
        res.json = (body) => {
            cacheService.set(key, body, duration);
            res.sendResponse(body);
        };
        
        next();
    };
};

// Middleware de rate limiting
const rateLimit = (req, res, next) => {
    const key = `ratelimit:${req.ip}`;
    const limit = config.get('security.rateLimit.max');
    const window = config.get('security.rateLimit.windowMs');
    
    cacheService.get(key).then(count => {
        if (count && count >= limit) {
            return res.status(429).json({
                message: 'Too many requests',
                retryAfter: window
            });
        }
        
        cacheService.set(key, (count || 0) + 1, window / 1000);
        next();
    });
};

// Rotas de autenticação
router.post('/auth/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 })
    ],
    validate,
    async (req, res) => {
        try {
            const { email, password } = req.body;
            const result = await authService.authenticate(email, password);
            res.json(result);
        } catch (error) {
            logging.error('Login error', error);
            res.status(401).json({ message: 'Invalid credentials' });
        }
    }
);

router.post('/auth/refresh',
    [
        body('refreshToken').notEmpty()
    ],
    validate,
    async (req, res) => {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refreshToken(refreshToken);
            res.json(result);
        } catch (error) {
            logging.error('Token refresh error', error);
            res.status(401).json({ message: 'Invalid refresh token' });
        }
    }
);

router.post('/auth/logout',
    authenticate,
    [
        body('refreshToken').notEmpty()
    ],
    validate,
    async (req, res) => {
        try {
            const { refreshToken } = req.body;
            await authService.revokeToken(refreshToken);
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            logging.error('Logout error', error);
            res.status(500).json({ message: 'Error logging out' });
        }
    }
);

// Rotas de usuário
router.get('/users',
    authenticate,
    authorize(['admin']),
    cache(300),
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('sort').optional().isIn(['name', 'email', 'createdAt']),
        query('order').optional().isIn(['asc', 'desc'])
    ],
    validate,
    async (req, res) => {
        try {
            const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
            const users = await userService.getUsers({ page, limit, sort, order });
            res.json(users);
        } catch (error) {
            logging.error('Error fetching users', error);
            res.status(500).json({ message: 'Error fetching users' });
        }
    }
);

router.get('/users/:id',
    authenticate,
    [
        param('id').isInt()
    ],
    validate,
    async (req, res) => {
        try {
            const user = await userService.getUser(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            logging.error('Error fetching user', error);
            res.status(500).json({ message: 'Error fetching user' });
        }
    }
);

router.put('/users/:id',
    authenticate,
    [
        param('id').isInt(),
        body('name').optional().isLength({ min: 2 }),
        body('email').optional().isEmail().normalizeEmail(),
        body('role').optional().isIn(['user', 'admin'])
    ],
    validate,
    async (req, res) => {
        try {
            const user = await userService.updateUser(req.params.id, req.body);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            logging.error('Error updating user', error);
            res.status(500).json({ message: 'Error updating user' });
        }
    }
);

router.delete('/users/:id',
    authenticate,
    authorize(['admin']),
    [
        param('id').isInt()
    ],
    validate,
    async (req, res) => {
        try {
            const success = await userService.deleteUser(req.params.id);
            if (!success) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            logging.error('Error deleting user', error);
            res.status(500).json({ message: 'Error deleting user' });
        }
    }
);

// Rotas de arquivo
router.post('/files/upload',
    authenticate,
    async (req, res) => {
        try {
            if (!req.files || !req.files.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }
            
            const file = req.files.file;
            const result = await fileService.processFile(file);
            res.json(result);
        } catch (error) {
            logging.error('Error processing file', error);
            res.status(500).json({ message: 'Error processing file' });
        }
    }
);

router.get('/files/:id',
    authenticate,
    [
        param('id').isInt()
    ],
    validate,
    async (req, res) => {
        try {
            const file = await fileService.getFile(req.params.id);
            if (!file) {
                return res.status(404).json({ message: 'File not found' });
            }
            res.json(file);
        } catch (error) {
            logging.error('Error fetching file', error);
            res.status(500).json({ message: 'Error fetching file' });
        }
    }
);

router.delete('/files/:id',
    authenticate,
    [
        param('id').isInt()
    ],
    validate,
    async (req, res) => {
        try {
            const success = await fileService.deleteFile(req.params.id);
            if (!success) {
                return res.status(404).json({ message: 'File not found' });
            }
            res.json({ message: 'File deleted successfully' });
        } catch (error) {
            logging.error('Error deleting file', error);
            res.status(500).json({ message: 'Error deleting file' });
        }
    }
);

// Rotas de sistema
router.get('/system/health',
    async (req, res) => {
        try {
            const health = {
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                load: os.loadavg()
            };
            
            res.json(health);
        } catch (error) {
            logging.error('Error checking system health', error);
            res.status(500).json({ message: 'Error checking system health' });
        }
    }
);

router.get('/system/metrics',
    authenticate,
    authorize(['admin']),
    async (req, res) => {
        try {
            const metrics = {
                system: monitor.getSystemStats(),
                process: monitor.getProcessStats(),
                network: monitor.getNetworkStats(),
                current: monitor.getCurrentMetrics()
            };
            
            res.json(metrics);
        } catch (error) {
            logging.error('Error fetching system metrics', error);
            res.status(500).json({ message: 'Error fetching system metrics' });
        }
    }
);

// Middleware de erro
router.use((err, req, res, next) => {
    logging.error('Route error', err);
    res.status(500).json({ message: 'Internal server error' });
});

module.exports = router; 