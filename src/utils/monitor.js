const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const logging = require('./logger');

// Configurações
const CHECK_INTERVAL = 60000; // 1 minuto
const ALERT_THRESHOLDS = {
    cpu: 80, // 80% de uso de CPU
    memory: 85, // 85% de uso de memória
    disk: 90, // 90% de uso de disco
    responseTime: 1000, // 1 segundo
    errorRate: 5 // 5% de taxa de erro
};

// Métricas
const metrics = {
    cpu: {
        current: 0,
        history: [],
        maxHistory: 60 // 1 hora de histórico
    },
    memory: {
        current: 0,
        history: [],
        maxHistory: 60
    },
    disk: {
        current: 0,
        history: [],
        maxHistory: 60
    },
    responseTime: {
        current: 0,
        history: [],
        maxHistory: 60
    },
    errors: {
        count: 0,
        total: 0,
        history: [],
        maxHistory: 60
    }
};

// Funções de monitoramento
const monitor = {
    // Iniciar monitoramento
    start() {
        this.checkResources();
        setInterval(() => this.checkResources(), CHECK_INTERVAL);
        
        logging.info('Resource monitoring started', {
            interval: CHECK_INTERVAL,
            thresholds: ALERT_THRESHOLDS
        });
    },
    
    // Verificar recursos do sistema
    async checkResources() {
        try {
            // CPU
            const cpuUsage = await this.getCpuUsage();
            this.updateMetric('cpu', cpuUsage);
            
            // Memória
            const memoryUsage = this.getMemoryUsage();
            this.updateMetric('memory', memoryUsage);
            
            // Disco
            const diskUsage = await this.getDiskUsage();
            this.updateMetric('disk', diskUsage);
            
            // Verificar alertas
            this.checkAlerts();
            
        } catch (error) {
            logging.error('Error checking system resources', error);
        }
    },
    
    // Obter uso de CPU
    async getCpuUsage() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        
        for (const cpu of cpus) {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        }
        
        return {
            idle: totalIdle / cpus.length,
            total: totalTick / cpus.length
        };
    },
    
    // Obter uso de memória
    getMemoryUsage() {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        
        return {
            total,
            free,
            used,
            percentage: (used / total) * 100
        };
    },
    
    // Obter uso de disco
    async getDiskUsage() {
        const { stdout } = await exec('df -k .');
        const lines = stdout.split('\n');
        const diskInfo = lines[1].split(/\s+/);
        
        return {
            total: parseInt(diskInfo[1]) * 1024,
            used: parseInt(diskInfo[2]) * 1024,
            free: parseInt(diskInfo[3]) * 1024,
            percentage: parseInt(diskInfo[4])
        };
    },
    
    // Atualizar métrica
    updateMetric(type, value) {
        metrics[type].current = value;
        metrics[type].history.push({
            timestamp: Date.now(),
            value
        });
        
        // Manter histórico limitado
        if (metrics[type].history.length > metrics[type].maxHistory) {
            metrics[type].history.shift();
        }
    },
    
    // Registrar tempo de resposta
    recordResponseTime(duration) {
        this.updateMetric('responseTime', duration);
    },
    
    // Registrar erro
    recordError() {
        metrics.errors.count++;
        metrics.errors.total++;
        
        const errorRate = (metrics.errors.count / metrics.errors.total) * 100;
        this.updateMetric('errors', errorRate);
    },
    
    // Verificar alertas
    checkAlerts() {
        // CPU
        if (metrics.cpu.current > ALERT_THRESHOLDS.cpu) {
            logging.warn('High CPU usage', {
                current: metrics.cpu.current,
                threshold: ALERT_THRESHOLDS.cpu
            });
        }
        
        // Memória
        if (metrics.memory.current.percentage > ALERT_THRESHOLDS.memory) {
            logging.warn('High memory usage', {
                current: metrics.memory.current.percentage,
                threshold: ALERT_THRESHOLDS.memory
            });
        }
        
        // Disco
        if (metrics.disk.current.percentage > ALERT_THRESHOLDS.disk) {
            logging.warn('High disk usage', {
                current: metrics.disk.current.percentage,
                threshold: ALERT_THRESHOLDS.disk
            });
        }
        
        // Tempo de resposta
        if (metrics.responseTime.current > ALERT_THRESHOLDS.responseTime) {
            logging.warn('High response time', {
                current: metrics.responseTime.current,
                threshold: ALERT_THRESHOLDS.responseTime
            });
        }
        
        // Taxa de erro
        if (metrics.errors.current > ALERT_THRESHOLDS.errorRate) {
            logging.warn('High error rate', {
                current: metrics.errors.current,
                threshold: ALERT_THRESHOLDS.errorRate
            });
        }
    },
    
    // Obter métricas atuais
    getCurrentMetrics() {
        return {
            cpu: metrics.cpu.current,
            memory: metrics.memory.current,
            disk: metrics.disk.current,
            responseTime: metrics.responseTime.current,
            errors: metrics.errors.current
        };
    },
    
    // Obter histórico de métricas
    getMetricHistory(type, duration = 3600000) { // 1 hora por padrão
        const now = Date.now();
        return metrics[type].history.filter(
            point => now - point.timestamp <= duration
        );
    },
    
    // Obter estatísticas do sistema
    getSystemStats() {
        return {
            uptime: os.uptime(),
            loadAvg: os.loadavg(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            cpus: os.cpus().length,
            platform: os.platform(),
            release: os.release(),
            hostname: os.hostname()
        };
    },
    
    // Obter estatísticas de rede
    getNetworkStats() {
        const interfaces = os.networkInterfaces();
        const stats = {};
        
        for (const [name, nets] of Object.entries(interfaces)) {
            stats[name] = nets.map(net => ({
                address: net.address,
                netmask: net.netmask,
                family: net.family,
                mac: net.mac,
                internal: net.internal
            }));
        }
        
        return stats;
    },
    
    // Obter estatísticas de processo
    getProcessStats() {
        const usage = process.memoryUsage();
        return {
            memory: {
                rss: usage.rss,
                heapTotal: usage.heapTotal,
                heapUsed: usage.heapUsed,
                external: usage.external
            },
            cpu: process.cpuUsage(),
            uptime: process.uptime(),
            pid: process.pid,
            version: process.version
        };
    }
};

// Middleware de monitoramento para Express
monitor.middleware = (req, res, next) => {
    const start = process.hrtime();
    
    res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(start);
        const duration = seconds * 1000 + nanoseconds / 1000000;
        
        monitor.recordResponseTime(duration);
        
        if (res.statusCode >= 400) {
            monitor.recordError();
        }
    });
    
    next();
};

// Graceful shutdown
process.on('SIGTERM', () => {
    logging.info('Shutting down monitoring...');
});

module.exports = monitor; 