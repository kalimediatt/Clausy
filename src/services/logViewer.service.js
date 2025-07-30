const fs = require('fs');
const path = require('path');
const readline = require('readline');

class LogViewer {
    constructor() {
        this.logFile = path.join(__dirname, '../../logs/requests.log');
    }

    // Obter logs recentes
    async getRecentLogs(limit = 100) {
        try {
            const fileStream = fs.createReadStream(this.logFile);
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            const logs = [];
            for await (const line of rl) {
                try {
                    const logEntry = JSON.parse(line);
                    logs.push(logEntry);
                } catch (error) {
                    console.error('Erro ao parsear log:', error);
                }
            }

            return logs.slice(-limit);
        } catch (error) {
            console.error('Erro ao ler logs recentes:', error);
            return [];
        }
    }

    // Filtrar logs
    async filterLogs(filters = {}) {
        try {
            const fileStream = fs.createReadStream(this.logFile);
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            const logs = [];
            for await (const line of rl) {
                try {
                    const logEntry = JSON.parse(line);
                    
                    // Aplicar filtros
                    let matches = true;
                    for (const [key, value] of Object.entries(filters)) {
                        if (key.includes('.')) {
                            // Filtro aninhado (ex: 'user.email')
                            const [parent, child] = key.split('.');
                            if (!logEntry[parent] || logEntry[parent][child] !== value) {
                                matches = false;
                                break;
                            }
                        } else {
                            // Filtro simples
                            if (logEntry[key] !== value) {
                                matches = false;
                                break;
                            }
                        }
                    }

                    if (matches) {
                        logs.push(logEntry);
                    }
                } catch (error) {
                    console.error('Erro ao parsear log:', error);
                }
            }

            return logs;
        } catch (error) {
            console.error('Erro ao filtrar logs:', error);
            return [];
        }
    }
}

module.exports = new LogViewer(); 