const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const swagger = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const logging = require('../utils/logger');
const config = require('../config/config');

// Configurações de documentação
const DOCS_CONFIG = {
    swagger: {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'API Documentation',
                version: '1.0.0',
                description: 'API documentation generated automatically',
                contact: {
                    name: 'API Support',
                    email: 'support@example.com'
                },
                license: {
                    name: 'MIT',
                    url: 'https://opensource.org/licenses/MIT'
                }
            },
            servers: [
                {
                    url: 'http://localhost:3000',
                    description: 'Development server'
                },
                {
                    url: 'https://api.example.com',
                    description: 'Production server'
                }
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            }
        },
        apis: ['./src/routes/*.js']
    },
    redoc: {
        title: 'API Documentation',
        version: '1.0.0',
        description: 'API documentation generated automatically',
        theme: {
            colors: {
                primary: {
                    main: '#32329f'
                }
            }
        }
    }
};

// Funções de documentação
const docsUtils = {
    // Gera documentação Swagger
    generateSwaggerDocs: () => {
        try {
            const swaggerSpec = swagger(DOCS_CONFIG.swagger);
            return swaggerSpec;
        } catch (error) {
            logging.error('Error generating Swagger documentation', { error });
            throw error;
        }
    },

    // Gera documentação ReDoc
    generateReDocDocs: () => {
        try {
            const swaggerSpec = docsUtils.generateSwaggerDocs();
            return {
                ...swaggerSpec,
                ...DOCS_CONFIG.redoc
            };
        } catch (error) {
            logging.error('Error generating ReDoc documentation', { error });
            throw error;
        }
    },

    // Gera documentação Markdown
    generateMarkdownDocs: () => {
        try {
            const swaggerSpec = docsUtils.generateSwaggerDocs();
            let markdown = `# ${swaggerSpec.info.title}\n\n`;
            markdown += `${swaggerSpec.info.description}\n\n`;
            markdown += `## Version: ${swaggerSpec.info.version}\n\n`;
            markdown += `## Contact\n\n`;
            markdown += `- Name: ${swaggerSpec.info.contact.name}\n`;
            markdown += `- Email: ${swaggerSpec.info.contact.email}\n\n`;
            markdown += `## License\n\n`;
            markdown += `- Name: ${swaggerSpec.info.license.name}\n`;
            markdown += `- URL: ${swaggerSpec.info.license.url}\n\n`;
            markdown += `## Servers\n\n`;
            swaggerSpec.servers.forEach(server => {
                markdown += `- ${server.description}: ${server.url}\n`;
            });
            markdown += `\n## Endpoints\n\n`;
            Object.entries(swaggerSpec.paths).forEach(([path, methods]) => {
                markdown += `### ${path}\n\n`;
                Object.entries(methods).forEach(([method, details]) => {
                    markdown += `#### ${method.toUpperCase()}\n\n`;
                    markdown += `${details.summary}\n\n`;
                    if (details.description) {
                        markdown += `${details.description}\n\n`;
                    }
                    if (details.parameters) {
                        markdown += `##### Parameters\n\n`;
                        details.parameters.forEach(param => {
                            markdown += `- ${param.name} (${param.in}): ${param.description}\n`;
                        });
                        markdown += `\n`;
                    }
                    if (details.responses) {
                        markdown += `##### Responses\n\n`;
                        Object.entries(details.responses).forEach(([code, response]) => {
                            markdown += `- ${code}: ${response.description}\n`;
                        });
                        markdown += `\n`;
                    }
                });
            });
            return markdown;
        } catch (error) {
            logging.error('Error generating Markdown documentation', { error });
            throw error;
        }
    },

    // Gera documentação YAML
    generateYamlDocs: () => {
        try {
            const swaggerSpec = docsUtils.generateSwaggerDocs();
            return yaml.dump(swaggerSpec);
        } catch (error) {
            logging.error('Error generating YAML documentation', { error });
            throw error;
        }
    },

    // Gera documentação JSON
    generateJsonDocs: () => {
        try {
            const swaggerSpec = docsUtils.generateSwaggerDocs();
            return JSON.stringify(swaggerSpec, null, 2);
        } catch (error) {
            logging.error('Error generating JSON documentation', { error });
            throw error;
        }
    }
};

// Funções de validação
const validationUtils = {
    // Valida documentação Swagger
    validateSwaggerDocs: (docs) => {
        try {
            // Implementar validação de documentação Swagger
            return true;
        } catch (error) {
            logging.error('Error validating Swagger documentation', { error });
            return false;
        }
    },

    // Valida documentação ReDoc
    validateReDocDocs: (docs) => {
        try {
            // Implementar validação de documentação ReDoc
            return true;
        } catch (error) {
            logging.error('Error validating ReDoc documentation', { error });
            return false;
        }
    },

    // Valida documentação Markdown
    validateMarkdownDocs: (docs) => {
        try {
            // Implementar validação de documentação Markdown
            return true;
        } catch (error) {
            logging.error('Error validating Markdown documentation', { error });
            return false;
        }
    },

    // Valida documentação YAML
    validateYamlDocs: (docs) => {
        try {
            // Implementar validação de documentação YAML
            return true;
        } catch (error) {
            logging.error('Error validating YAML documentation', { error });
            return false;
        }
    },

    // Valida documentação JSON
    validateJsonDocs: (docs) => {
        try {
            // Implementar validação de documentação JSON
            return true;
        } catch (error) {
            logging.error('Error validating JSON documentation', { error });
            return false;
        }
    }
};

// Funções de exportação
const exportUtils = {
    // Exporta documentação para arquivo
    exportToFile: (docs, format, filepath) => {
        try {
            let content;
            switch (format) {
                case 'markdown':
                    content = docsUtils.generateMarkdownDocs();
                    break;
                case 'yaml':
                    content = docsUtils.generateYamlDocs();
                    break;
                case 'json':
                    content = docsUtils.generateJsonDocs();
                    break;
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }
            fs.writeFileSync(filepath, content);
            return true;
        } catch (error) {
            logging.error('Error exporting documentation to file', { error });
            return false;
        }
    },

    // Exporta documentação para diretório
    exportToDirectory: (docs, format, dirpath) => {
        try {
            const filepath = path.join(dirpath, `docs.${format}`);
            return exportUtils.exportToFile(docs, format, filepath);
        } catch (error) {
            logging.error('Error exporting documentation to directory', { error });
            return false;
        }
    }
};

// Funções de middleware
const middlewareUtils = {
    // Middleware Swagger UI
    swaggerUiMiddleware: () => {
        const swaggerSpec = docsUtils.generateSwaggerDocs();
        return swaggerUi.serve;
    },

    // Middleware Swagger UI setup
    swaggerUiSetup: () => {
        const swaggerSpec = docsUtils.generateSwaggerDocs();
        return swaggerUi.setup(swaggerSpec);
    },

    // Middleware ReDoc
    redocMiddleware: () => {
        const redocSpec = docsUtils.generateReDocDocs();
        return (req, res) => {
            res.send(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>${redocSpec.title}</title>
                        <meta charset="utf-8"/>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
                    </head>
                    <body>
                        <redoc spec='${JSON.stringify(redocSpec)}'></redoc>
                        <script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"> </script>
                    </body>
                </html>
            `);
        };
    }
};

module.exports = {
    DOCS_CONFIG,
    docsUtils,
    validationUtils,
    exportUtils,
    middlewareUtils
}; 