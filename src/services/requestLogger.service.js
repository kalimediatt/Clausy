const fs = require('fs');
const path = require('path');
const { createStream } = require('rotating-file-stream');
const os = require('os');

// Na Vercel, o sistema de arquivos é read-only, então não podemos criar logs em arquivo
const isVercel = process.env.VERCEL === '1';
let requestLogStream = null;

if (!isVercel) {
    // Configurar diretório de logs apenas se não estiver na Vercel
    const LOG_DIR = path.join(__dirname, '../../logs');
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    // Configurar stream de logs de requisições
    requestLogStream = createStream('requests.log', {
        interval: '1d',
        path: LOG_DIR,
        maxSize: '20M',
        maxFiles: 14
    });
}

// Função para obter informações do sistema
const getSystemInfo = () => {
    return {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        uptime: os.uptime(),
        loadAvg: os.loadavg(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length
    };
};

// Função para formatar o timestamp
const formatTimestamp = () => {
    return new Date().toISOString();
};

// Função para extrair informações relevantes do request
const extractRequestInfo = (req) => {
    return {
        method: req.method,
        url: req.originalUrl || req.url,
        headers: {
            'user-agent': req.headers['user-agent'],
            'referer': req.headers['referer'],
            'content-type': req.headers['content-type'],
            'accept': req.headers['accept']
        },
        ip: req.ip || req.connection.remoteAddress,
        body: req.method !== 'GET' ? req.body : undefined,
        query: req.query,
        params: req.params
    };
};

// Função para extrair informações do usuário
const extractUserInfo = (req) => {
    if (!req.user) return null;
    
    return {
        user_id: req.user.user_id,
        email: req.user.email,
        role: req.user.role,
        company_id: req.user.company_id
    };
};

// Função principal de logging
const logRequest = (req, res, next) => {
    const timestamp = formatTimestamp();
    const requestInfo = extractRequestInfo(req);
    const userInfo = extractUserInfo(req);
    const systemInfo = getSystemInfo();

    const logEntry = {
        timestamp,
        request: requestInfo,
        user: userInfo,
        system: systemInfo
    };

    // Log para arquivo
    if (requestLogStream) {
        requestLogStream.write(JSON.stringify(logEntry) + '\n');
    }

    // Log para console em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
        console.log('\n=== Nova Requisição ===');
        console.log('Timestamp:', timestamp);
        console.log('Método:', requestInfo.method);
        console.log('URL:', requestInfo.url);
        console.log('IP:', requestInfo.ip);
        if (userInfo) {
            console.log('Usuário:', userInfo.email);
            console.log('Role:', userInfo.role);
            console.log('Company ID:', userInfo.company_id);
        }
        console.log('=====================\n');
    }

    // Adicionar informações de performance
    const start = process.hrtime();
    res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(start);
        const duration = seconds * 1000 + nanoseconds / 1000000; // em milissegundos

        const performanceLog = {
            ...logEntry,
            response: {
                statusCode: res.statusCode,
                duration: `${duration.toFixed(2)}ms`
            }
        };

        // Log de performance para arquivo
        if (requestLogStream) {
            requestLogStream.write(JSON.stringify(performanceLog) + '\n');
        }

        // Log de performance para console em desenvolvimento
        if (process.env.NODE_ENV !== 'production') {
            console.log('\n=== Resposta da Requisição ===');
            console.log('Status:', res.statusCode);
            console.log('Duração:', `${duration.toFixed(2)}ms`);
            console.log('=============================\n');
        }
    });

    next();
};

module.exports = {
    logRequest
}; 