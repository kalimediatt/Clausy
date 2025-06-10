const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// Configurações
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_EXTRACTED_SIZE = 100 * 1024 * 1024; // 100MB
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas
const TEMP_DIR = path.join(os.tmpdir(), 'clausy_temp');

// Criar diretório temporário se não existir
async function ensureTempDir() {
    try {
        await fs.mkdir(TEMP_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating temp directory:', error);
        throw error;
    }
}

// Limpar arquivos antigos
async function cleanupOldFiles() {
    try {
        const files = await fs.readdir(TEMP_DIR);
        const now = Date.now();
        
        for (const file of files) {
            const filePath = path.join(TEMP_DIR, file);
            const stats = await fs.stat(filePath);
            
            // Remover arquivos mais antigos que 24 horas
            if (now - stats.mtime.getTime() > CLEANUP_INTERVAL) {
                await fs.unlink(filePath);
                console.log(`Cleaned up old file: ${file}`);
            }
        }
    } catch (error) {
        console.error('Error cleaning up old files:', error);
    }
}

// Verificar espaço em disco
async function checkDiskSpace() {
    try {
        const { stdout } = await exec('df -k .');
        const lines = stdout.split('\n');
        const diskInfo = lines[1].split(/\s+/);
        const availableSpace = parseInt(diskInfo[3]) * 1024; // Convert to bytes
        
        if (availableSpace < MAX_EXTRACTED_SIZE * 2) {
            throw new Error('Insufficient disk space');
        }
    } catch (error) {
        console.error('Error checking disk space:', error);
        throw error;
    }
}

// Iniciar limpeza periódica
setInterval(cleanupOldFiles, CLEANUP_INTERVAL);

const fileProcessor = {
    // Processar arquivo com limites de tamanho
    async processFile(filePath, options = {}) {
        try {
            await ensureTempDir();
            await checkDiskSpace();
            
            const stats = await fs.stat(filePath);
            if (stats.size > MAX_FILE_SIZE) {
                throw new Error(`File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
            }
            
            const fileExt = path.extname(filePath).toLowerCase();
            const tempPath = path.join(TEMP_DIR, `${Date.now()}-${path.basename(filePath)}`);
            
            // Copiar arquivo para diretório temporário
            await fs.copyFile(filePath, tempPath);
            
            let content = '';
            let extractedSize = 0;
            
            // Processar baseado na extensão
            switch (fileExt) {
                case '.txt':
                    content = await fs.readFile(tempPath, 'utf8');
                    break;
                    
                case '.pdf':
                    const { stdout } = await exec(`pdftotext "${tempPath}" -`);
                    content = stdout;
                    break;
                    
                case '.doc':
                case '.docx':
                    const { stdout: docText } = await exec(`antiword "${tempPath}"`);
                    content = docText;
                    break;
                    
                default:
                    throw new Error(`Unsupported file type: ${fileExt}`);
            }
            
            // Verificar tamanho do conteúdo extraído
            extractedSize = Buffer.byteLength(content);
            if (extractedSize > MAX_EXTRACTED_SIZE) {
                throw new Error(`Extracted content size exceeds limit of ${MAX_EXTRACTED_SIZE / 1024 / 1024}MB`);
            }
            
            // Limpar arquivo temporário
            await fs.unlink(tempPath);
            
            return {
                content,
                size: extractedSize,
                type: fileExt,
                processedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error processing file:', error);
            throw error;
        }
    },
    
    // Verificar se arquivo é válido
    async validateFile(filePath) {
        try {
            const stats = await fs.stat(filePath);
            
            if (!stats.isFile()) {
                throw new Error('Not a file');
            }
            
            if (stats.size > MAX_FILE_SIZE) {
                throw new Error(`File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
            }
            
            const fileExt = path.extname(filePath).toLowerCase();
            const supportedTypes = ['.txt', '.pdf', '.doc', '.docx'];
            
            if (!supportedTypes.includes(fileExt)) {
                throw new Error(`Unsupported file type: ${fileExt}`);
            }
            
            return true;
        } catch (error) {
            console.error('Error validating file:', error);
            throw error;
        }
    },
    
    // Obter estatísticas de processamento
    async getStats() {
        try {
            const files = await fs.readdir(TEMP_DIR);
            const stats = {
                totalFiles: files.length,
                totalSize: 0,
                oldestFile: null,
                newestFile: null
            };
            
            for (const file of files) {
                const filePath = path.join(TEMP_DIR, file);
                const fileStats = await fs.stat(filePath);
                
                stats.totalSize += fileStats.size;
                
                if (!stats.oldestFile || fileStats.mtime < stats.oldestFile) {
                    stats.oldestFile = fileStats.mtime;
                }
                
                if (!stats.newestFile || fileStats.mtime > stats.newestFile) {
                    stats.newestFile = fileStats.mtime;
                }
            }
            
            return stats;
        } catch (error) {
            console.error('Error getting file stats:', error);
            throw error;
        }
    },
    
    // Forçar limpeza de arquivos
    async forceCleanup() {
        try {
            await cleanupOldFiles();
            return true;
        } catch (error) {
            console.error('Error forcing cleanup:', error);
            throw error;
        }
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Cleaning up temporary files...');
    try {
        await cleanupOldFiles();
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
    process.exit(0);
});

module.exports = fileProcessor; 
module.exports = fileProcessor; 