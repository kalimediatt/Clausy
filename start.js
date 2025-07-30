const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');
const http = require('http');
const os = require('os');

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Configuração dos serviços
const services = {
  backend: {
    command: 'npm',
    args: ['run', 'server'],
    color: colors.green,
    name: 'Backend',
    healthCheck: {
      url: 'http://138.197.27.151:5000/test',
      interval: 2000,
      maxRetries: 30,
      timeout: 5000
    }
  },
  frontend: {
    command: 'npm',
    args: ['start'],
    env: { PORT: '3000' },
    color: colors.cyan,
    name: 'Frontend',
    dependsOn: ['backend'],
    healthCheck: {
      url: 'http://138.197.27.151:3000',
      interval: 2000,
      maxRetries: 60,
      timeout: 10000
    }
  }
};

// Array para armazenar os processos em execução
const runningProcesses = new Map();

// Função para calcular limites de recursos dinamicamente
function calculateResourceLimits() {
  const totalMemory = os.totalmem();
  const cpuCount = os.cpus().length;
  
  return {
    maxMemory: Math.floor(totalMemory * 0.7), // 70% da memória total
    maxCPU: Math.max(1, cpuCount - 1), // Deixar um CPU livre
    maxConcurrentProcesses: Math.max(1, cpuCount - 1),
    memoryWarningThreshold: Math.floor(totalMemory * 0.8), // 80% para aviso
    memoryCriticalThreshold: Math.floor(totalMemory * 0.9) // 90% para ação crítica
  };
}

// Atualizar limites de recursos periodicamente
let resourceLimits = calculateResourceLimits();
setInterval(() => {
  resourceLimits = calculateResourceLimits();
}, 5 * 60 * 1000); // A cada 5 minutos

// Função para verificar a saúde do serviço com retry e backoff
async function checkServiceHealth(url, timeout = 5000, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const isHealthy = await new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          resolve(false);
        }, timeout);

        http.get(url, (res) => {
          clearTimeout(timeoutId);
          resolve(res.statusCode === 200);
        }).on('error', () => {
          clearTimeout(timeoutId);
          resolve(false);
        });
      });

      if (isHealthy) {
        return true;
      }

      // Backoff exponencial
      await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, i), 10000)));
    } catch (error) {
      console.error(`Health check attempt ${i + 1} failed:`, error);
    }
  }
  return false;
}

// Função para monitorar recursos do processo
function monitorProcessResources(process, serviceName, serviceColor) {
  const monitorInterval = setInterval(() => {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Verificar uso de memória
      if (memoryUsage.heapUsed > resourceLimits.memoryCriticalThreshold) {
        console.warn(formatLog(serviceName, 'Critical memory usage detected, restarting...', colors.red));
        process.kill();
        clearInterval(monitorInterval);
        return;
      }
      
      if (memoryUsage.heapUsed > resourceLimits.memoryWarningThreshold) {
        console.warn(formatLog(serviceName, 'High memory usage warning', colors.yellow));
      }
      
      // Verificar uso de CPU
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convertendo para segundos
      if (cpuPercent > resourceLimits.maxCPU * 0.9) {
        console.warn(formatLog(serviceName, 'High CPU usage warning', colors.yellow));
      }
      
      // Log de recursos a cada 5 minutos
      if (Date.now() % (5 * 60 * 1000) < 1000) {
        console.log(formatLog(serviceName, `Resource usage - Memory: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB, CPU: ${cpuPercent.toFixed(2)}%`, serviceColor));
      }
    } catch (error) {
      console.error(formatLog(serviceName, `Error monitoring process: ${error.message}`, colors.red));
    }
  }, 30000);

  return monitorInterval;
}

// Função para iniciar um serviço
async function startService(serviceKey) {
  const service = services[serviceKey];
  
  // Verificar dependências
  if (service.dependsOn) {
    for (const dependency of service.dependsOn) {
      if (!runningProcesses.has(dependency)) {
        console.log(formatLog('Sistema', `${service.name} aguardando ${dependency}...`, colors.yellow));
        return false;
      }
      
      const isHealthy = await waitForService(dependency);
      if (!isHealthy) {
        console.log(formatLog('Sistema', `ERRO: Dependência ${dependency} não está saudável`, colors.red));
        return false;
      }
    }
  }
  
  console.log(formatLog(service.name, 'Iniciando...', service.color));
  
  try {
    const process = spawn(service.command, service.args, {
      stdio: 'pipe',
      shell: true,
      env: { 
        ...process.env, 
        ...service.env,
        NODE_OPTIONS: `--max-old-space-size=${Math.floor(resourceLimits.maxMemory / 1024 / 1024)}`,
        UV_THREADPOOL_SIZE: resourceLimits.maxConcurrentProcesses.toString()
      },
      cwd: __dirname
    });
    
    runningProcesses.set(serviceKey, process);

    // Gerenciar stdout com buffer
    let stdoutBuffer = '';
    process.stdout.on('data', (data) => {
      stdoutBuffer += data.toString();
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop();
      
      lines.forEach(line => {
        if (line.trim()) {
          console.log(formatLog(service.name, line, service.color));
        }
      });
    });

    // Gerenciar stderr com buffer
    let stderrBuffer = '';
    process.stderr.on('data', (data) => {
      stderrBuffer += data.toString();
      const lines = stderrBuffer.split('\n');
      stderrBuffer = lines.pop();
      
      lines.forEach(line => {
        if (line.trim()) {
          console.log(formatLog(service.name, `${colors.red}${line}${colors.reset}`, service.color));
        }
      });
    });

    // Monitorar recursos do processo
    const monitorInterval = monitorProcessResources(process, service.name, service.color);

    // Gerenciar encerramento do processo
    process.on('close', (code) => {
      console.log(formatLog(
        service.name,
        `Processo encerrado com código ${code}`,
        code === 0 ? colors.green : colors.red
      ));
      
      clearInterval(monitorInterval);
      process.stdout.removeAllListeners();
      process.stderr.removeAllListeners();
      
      runningProcesses.delete(serviceKey);
      
      // Verificar dependências
      for (const [otherServiceKey, otherService] of Object.entries(services)) {
        if (otherService.dependsOn?.includes(serviceKey)) {
          if (runningProcesses.has(otherServiceKey)) {
            console.log(formatLog('Sistema', `Encerrando ${otherService.name} porque a dependência ${service.name} caiu`, colors.yellow));
            const otherProcess = runningProcesses.get(otherServiceKey);
            if (otherProcess) {
              otherProcess.kill();
            }
          }
        }
      }
    });

    // Se o serviço tiver verificação de saúde, aguardar estar pronto
    if (service.healthCheck) {
      const isHealthy = await waitForService(serviceKey);
      if (!isHealthy) {
        console.log(formatLog('Sistema', `ERRO: Encerrando ${service.name} por falha na verificação de saúde`, colors.red));
        process.kill();
        return false;
      }
    }

    return true;
  } catch (error) {
    console.log(formatLog('Sistema', `ERRO ao iniciar ${service.name}: ${error.message}`, colors.red));
    return false;
  }
}

// Função para formatar logs
function formatLog(service, message, color) {
  const timestamp = new Date().toISOString();
  return `${color}[${timestamp}] ${service}: ${message}${colors.reset}`;
}

// Função para aguardar serviço estar saudável
async function waitForService(serviceKey) {
  const service = services[serviceKey];
  if (!service.healthCheck) return true;

  const { url, interval, maxRetries, timeout } = service.healthCheck;
  let retries = 0;

  while (retries < maxRetries) {
    const isHealthy = await checkServiceHealth(url, timeout);
    if (isHealthy) return true;
    
    retries++;
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return false;
}

// Iniciar serviços
async function startServices() {
  for (const serviceKey of Object.keys(services)) {
    await startService(serviceKey);
  }
}

// Tratamento de sinais do sistema
process.on('SIGTERM', () => {
  console.log(formatLog('Sistema', 'Recebido sinal SIGTERM, encerrando serviços...', colors.yellow));
  for (const [serviceKey, process] of runningProcesses) {
    process.kill();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(formatLog('Sistema', 'Recebido sinal SIGINT, encerrando serviços...', colors.yellow));
  for (const [serviceKey, process] of runningProcesses) {
    process.kill();
  }
  process.exit(0);
});

// Iniciar aplicação
startServices().catch(error => {
  console.error(formatLog('Sistema', `Erro fatal: ${error.message}`, colors.red));
  process.exit(1);
}); 