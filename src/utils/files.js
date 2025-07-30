const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const crypto = require('crypto');
const mime = require('mime-types');
const logging = require('./logger');
const config = require('../config/config');

// Promisify fs functions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const appendFile = promisify(fs.appendFile);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);
const access = promisify(fs.access);
const chmod = promisify(fs.chmod);
const chown = promisify(fs.chown);
const rename = promisify(fs.rename);
const copyFile = promisify(fs.copyFile);
const symlink = promisify(fs.symlink);
const readlink = promisify(fs.readlink);
const realpath = promisify(fs.realpath);
const lstat = promisify(fs.lstat);

// Configurações de arquivos
const FILES_CONFIG = {
    upload: {
        dir: config.get('files.upload.dir', 'uploads'),
        maxSize: config.get('files.upload.maxSize', 50 * 1024 * 1024),
        allowedTypes: config.get('files.upload.allowedTypes', [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]),
        maxFiles: config.get('files.upload.maxFiles', 10)
    },
    temp: {
        dir: config.get('files.temp.dir', 'temp'),
        maxAge: config.get('files.temp.maxAge', 3600)
    },
    backup: {
        dir: config.get('files.backup.dir', 'backups'),
        maxAge: config.get('files.backup.maxAge', 7 * 24 * 3600),
        compression: config.get('files.backup.compression', true)
    },
    permissions: {
        file: 0o644,
        dir: 0o755
    }
};

// Funções de arquivos
const fileUtils = {
    // Cria diretório
    createDir: async (dirpath) => {
        try {
            await mkdir(dirpath, { recursive: true });
            return true;
        } catch (error) {
            logging.error('Error creating directory', { error, dirpath });
            return false;
        }
    },

    // Remove diretório
    removeDir: async (dirpath) => {
        try {
            await fs.promises.rmdir(dirpath, { recursive: true });
            return true;
        } catch (error) {
            logging.error('Error removing directory', { error, dirpath });
            return false;
        }
    },

    // Lista diretório
    listDir: async (dirpath) => {
        try {
            const files = await readdir(dirpath);
            const stats = await Promise.all(
                files.map(async (file) => {
                    const filepath = path.join(dirpath, file);
                    const stat = await lstat(filepath);
                    return {
                        name: file,
                        path: filepath,
                        size: stat.size,
                        type: stat.isDirectory() ? 'dir' : 'file',
                        mtime: stat.mtime,
                        ctime: stat.ctime,
                        mode: stat.mode,
                        uid: stat.uid,
                        gid: stat.gid
                    };
                })
            );
            return stats;
        } catch (error) {
            logging.error('Error listing directory', { error, dirpath });
            return [];
        }
    },

    // Lê arquivo
    readFile: async (filepath) => {
        try {
            const content = await readFile(filepath);
            return content;
        } catch (error) {
            logging.error('Error reading file', { error, filepath });
            return null;
        }
    },

    // Escreve arquivo
    writeFile: async (filepath, content) => {
        try {
            await writeFile(filepath, content);
            return true;
        } catch (error) {
            logging.error('Error writing file', { error, filepath });
            return false;
        }
    },

    // Adiciona conteúdo ao arquivo
    appendFile: async (filepath, content) => {
        try {
            await appendFile(filepath, content);
            return true;
        } catch (error) {
            logging.error('Error appending to file', { error, filepath });
            return false;
        }
    },

    // Remove arquivo
    removeFile: async (filepath) => {
        try {
            await unlink(filepath);
            return true;
        } catch (error) {
            logging.error('Error removing file', { error, filepath });
            return false;
        }
    },

    // Move arquivo
    moveFile: async (src, dest) => {
        try {
            await rename(src, dest);
            return true;
        } catch (error) {
            logging.error('Error moving file', { error, src, dest });
            return false;
        }
    },

    // Copia arquivo
    copyFile: async (src, dest) => {
        try {
            await copyFile(src, dest);
            return true;
        } catch (error) {
            logging.error('Error copying file', { error, src, dest });
            return false;
        }
    },

    // Cria link simbólico
    createSymlink: async (target, linkpath) => {
        try {
            await symlink(target, linkpath);
            return true;
        } catch (error) {
            logging.error('Error creating symlink', { error, target, linkpath });
            return false;
        }
    },

    // Lê link simbólico
    readSymlink: async (linkpath) => {
        try {
            const target = await readlink(linkpath);
            return target;
        } catch (error) {
            logging.error('Error reading symlink', { error, linkpath });
            return null;
        }
    },

    // Obtém caminho real
    getRealPath: async (filepath) => {
        try {
            const realpath = await realpath(filepath);
            return realpath;
        } catch (error) {
            logging.error('Error getting real path', { error, filepath });
            return null;
        }
    },

    // Obtém estatísticas do arquivo
    getStats: async (filepath) => {
        try {
            const stats = await stat(filepath);
            return {
                size: stats.size,
                type: stats.isDirectory() ? 'dir' : 'file',
                mtime: stats.mtime,
                ctime: stats.ctime,
                mode: stats.mode,
                uid: stats.uid,
                gid: stats.gid
            };
        } catch (error) {
            logging.error('Error getting file stats', { error, filepath });
            return null;
        }
    },

    // Verifica permissões do arquivo
    checkAccess: async (filepath, mode = fs.constants.F_OK) => {
        try {
            await access(filepath, mode);
            return true;
        } catch (error) {
            logging.error('Error checking file access', { error, filepath });
            return false;
        }
    },

    // Define permissões do arquivo
    setPermissions: async (filepath, mode) => {
        try {
            await chmod(filepath, mode);
            return true;
        } catch (error) {
            logging.error('Error setting file permissions', { error, filepath });
            return false;
        }
    },

    // Define dono do arquivo
    setOwner: async (filepath, uid, gid) => {
        try {
            await chown(filepath, uid, gid);
            return true;
        } catch (error) {
            logging.error('Error setting file owner', { error, filepath });
            return false;
        }
    }
};

// Funções de validação
const validationUtils = {
    // Valida tipo de arquivo
    validateType: (filepath, allowedTypes = FILES_CONFIG.upload.allowedTypes) => {
        try {
            const type = mime.lookup(filepath);
            return allowedTypes.includes(type);
        } catch (error) {
            logging.error('Error validating file type', { error, filepath });
            return false;
        }
    },

    // Valida tamanho do arquivo
    validateSize: async (filepath, maxSize = FILES_CONFIG.upload.maxSize) => {
        try {
            const stats = await stat(filepath);
            return stats.size <= maxSize;
        } catch (error) {
            logging.error('Error validating file size', { error, filepath });
            return false;
        }
    },

    // Valida arquivo
    validate: async (filepath, options = {}) => {
        try {
            const {
                allowedTypes = FILES_CONFIG.upload.allowedTypes,
                maxSize = FILES_CONFIG.upload.maxSize
            } = options;

            const [typeValid, sizeValid] = await Promise.all([
                validationUtils.validateType(filepath, allowedTypes),
                validationUtils.validateSize(filepath, maxSize)
            ]);

            return typeValid && sizeValid;
        } catch (error) {
            logging.error('Error validating file', { error, filepath });
            return false;
        }
    }
};

// Funções de upload
const uploadUtils = {
    // Processa upload
    processUpload: async (file, options = {}) => {
        try {
            const {
                dir = FILES_CONFIG.upload.dir,
                allowedTypes = FILES_CONFIG.upload.allowedTypes,
                maxSize = FILES_CONFIG.upload.maxSize
            } = options;

            const filepath = path.join(dir, file.originalname);
            await fileUtils.createDir(dir);
            await fileUtils.writeFile(filepath, file.buffer);

            const valid = await validationUtils.validate(filepath, {
                allowedTypes,
                maxSize
            });

            if (!valid) {
                await fileUtils.removeFile(filepath);
                return null;
            }

            return {
                path: filepath,
                name: file.originalname,
                type: file.mimetype,
                size: file.size
            };
        } catch (error) {
            logging.error('Error processing upload', { error, file });
            return null;
        }
    },

    // Processa múltiplos uploads
    processUploads: async (files, options = {}) => {
        try {
            const {
                maxFiles = FILES_CONFIG.upload.maxFiles
            } = options;

            if (files.length > maxFiles) {
                throw new Error(`Too many files. Maximum allowed: ${maxFiles}`);
            }

            const uploads = await Promise.all(
                files.map(file => uploadUtils.processUpload(file, options))
            );

            return uploads.filter(Boolean);
        } catch (error) {
            logging.error('Error processing uploads', { error, files });
            return [];
        }
    }
};

// Funções de backup
const backupUtils = {
    // Cria backup
    createBackup: async (filepath, options = {}) => {
        try {
            const {
                dir = FILES_CONFIG.backup.dir,
                compression = FILES_CONFIG.backup.compression
            } = options;

            const filename = path.basename(filepath);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(dir, `${filename}.${timestamp}.bak`);

            await fileUtils.createDir(dir);
            await fileUtils.copyFile(filepath, backupPath);

            if (compression) {
                // Implementar compressão
            }

            return backupPath;
        } catch (error) {
            logging.error('Error creating backup', { error, filepath });
            return null;
        }
    },

    // Restaura backup
    restoreBackup: async (backupPath, destPath) => {
        try {
            await fileUtils.copyFile(backupPath, destPath);
            return true;
        } catch (error) {
            logging.error('Error restoring backup', { error, backupPath, destPath });
            return false;
        }
    },

    // Lista backups
    listBackups: async (dir = FILES_CONFIG.backup.dir) => {
        try {
            const files = await fileUtils.listDir(dir);
            return files.filter(file => file.name.endsWith('.bak'));
        } catch (error) {
            logging.error('Error listing backups', { error, dir });
            return [];
        }
    },

    // Remove backups antigos
    cleanupBackups: async (options = {}) => {
        try {
            const {
                dir = FILES_CONFIG.backup.dir,
                maxAge = FILES_CONFIG.backup.maxAge
            } = options;

            const files = await fileUtils.listDir(dir);
            const now = Date.now();

            for (const file of files) {
                if (file.name.endsWith('.bak')) {
                    const age = now - file.mtime.getTime();
                    if (age > maxAge * 1000) {
                        await fileUtils.removeFile(file.path);
                    }
                }
            }

            return true;
        } catch (error) {
            logging.error('Error cleaning up backups', { error });
            return false;
        }
    }
};

// Funções de limpeza
const cleanupUtils = {
    // Limpa arquivos temporários
    cleanupTemp: async (options = {}) => {
        try {
            const {
                dir = FILES_CONFIG.temp.dir,
                maxAge = FILES_CONFIG.temp.maxAge
            } = options;

            const files = await fileUtils.listDir(dir);
            const now = Date.now();

            for (const file of files) {
                const age = now - file.mtime.getTime();
                if (age > maxAge * 1000) {
                    await fileUtils.removeFile(file.path);
                }
            }

            return true;
        } catch (error) {
            logging.error('Error cleaning up temp files', { error });
            return false;
        }
    },

    // Agenda limpeza
    scheduleCleanup: (interval = 3600000) => {
        setInterval(async () => {
            await cleanupUtils.cleanupTemp();
            await backupUtils.cleanupBackups();
        }, interval);
    }
};

module.exports = {
    FILES_CONFIG,
    fileUtils,
    validationUtils,
    uploadUtils,
    backupUtils,
    cleanupUtils
}; 