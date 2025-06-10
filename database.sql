-- Criação do banco de dados (se ainda não existir)
CREATE DATABASE IF NOT EXISTS clausy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE clausy;

-- Tabela de planos de assinatura
CREATE TABLE IF NOT EXISTS subscription_plans (
    plan_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    max_queries_per_hour INT NOT NULL,
    max_tokens_per_hour INT NOT NULL,
    history_retention_hours INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    color VARCHAR(10) NOT NULL,
    description TEXT
);

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS companies (
    company_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    document VARCHAR(20) NOT NULL UNIQUE,
    plan_id VARCHAR(20) NOT NULL,
    license_count INT NOT NULL DEFAULT 1,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(plan_id)
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('user', 'admin', 'superadmin') NOT NULL DEFAULT 'user',
    credits INT NOT NULL DEFAULT 0,
    plan_id VARCHAR(20) NOT NULL,
    company_id INT NOT NULL,
    last_login DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(plan_id),
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- Tabela de logs de autenticação
CREATE TABLE IF NOT EXISTS auth_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NOT NULL,
    success BOOLEAN NOT NULL,
    user_agent TEXT,
    additional_info TEXT
);

-- Tabela de estatísticas de uso
CREATE TABLE IF NOT EXISTS usage_stats (
    stat_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    queries_this_hour INT NOT NULL DEFAULT 0,
    tokens_this_hour INT NOT NULL DEFAULT 0,
    last_query_timestamp DATETIME,
    last_reset_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- Tabela de histórico de consultas (apenas metadados, não o conteúdo)
CREATE TABLE IF NOT EXISTS query_history (
    query_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    estimated_tokens INT NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- Inserir planos de assinatura padrão
INSERT INTO subscription_plans (plan_id, name, max_queries_per_hour, max_tokens_per_hour, history_retention_hours, price, color, description)
VALUES 
    ('FREE_TRIAL', 'Free Trial', 5, 10000, 24, 0.00, '#64748b', 'Plano gratuito com recursos limitados'),
    ('BASIC', 'Basic', 20, 50000, 168, 99.90, '#3b82f6', 'Plano básico com recursos moderados'),
    ('STANDARD', 'Standard', 50, 100000, 720, 199.90, '#8b5cf6', 'Plano intermediário com bom custo-benefício'),
    ('PRO', 'Profissional', 200, 1000000, 2160, 299.90, '#10b981', 'Plano profissional com recursos avançados'),
    ('PREMIUM', 'Premium', 500, 2000000, 4320, 499.90, '#f59e0b', 'Plano premium com recursos ilimitados')
ON DUPLICATE KEY UPDATE
    max_queries_per_hour = VALUES(max_queries_per_hour),
    max_tokens_per_hour = VALUES(max_tokens_per_hour),
    history_retention_hours = VALUES(history_retention_hours),
    price = VALUES(price),
    color = VALUES(color),
    description = VALUES(description);

-- Inserir empresas de exemplo
INSERT INTO companies (name, document, plan_id, license_count)
VALUES
    ('ALFA Advocacia', '12345678000190', 'STANDARD', 3),
    ('BETA Jurídico', '98765432000190', 'PRO', 5),
    ('ROMA Consultoria', '45678912000190', 'PRO', 7);

-- Inserir usuários padrão (senha: admin123 e teste123)
-- Nota: Em produção, usar funções de hash adequadas como bcrypt
INSERT INTO users (email, password_hash, name, role, credits, plan_id, company_id)
VALUES 
    ('admin@alfa.com.br', SHA2('admin123', 256), 'Administrador ALFA', 'admin', 1000, 'STANDARD', 1),
    ('user1@alfa.com.br', SHA2('teste123', 256), 'Usuário 1 ALFA', 'user', 100, 'STANDARD', 1),
    ('user2@alfa.com.br', SHA2('teste123', 256), 'Usuário 2 ALFA', 'user', 100, 'STANDARD', 1),
    
    ('admin1@beta.com.br', SHA2('admin123', 256), 'Administrador 1 BETA', 'admin', 2000, 'PRO', 2),
    ('user1@beta.com.br', SHA2('teste123', 256), 'Usuário 1 BETA', 'user', 200, 'PRO', 2),
    ('user2@beta.com.br', SHA2('teste123', 256), 'Usuário 2 BETA', 'user', 200, 'PRO', 2),
    ('user3@beta.com.br', SHA2('teste123', 256), 'Usuário 3 BETA', 'user', 200, 'PRO', 2),
    ('admin2@beta.com.br', SHA2('admin123', 256), 'Administrador 2 BETA', 'admin', 2000, 'PRO', 2),
    
    ('admin1@roma.com.br', SHA2('admin123', 256), 'Administrador 1 ROMA', 'admin', 3000, 'PRO', 3),
    ('user1@roma.com.br', SHA2('teste123', 256), 'Usuário 1 ROMA', 'user', 300, 'PRO', 3),
    ('user2@roma.com.br', SHA2('teste123', 256), 'Usuário 2 ROMA', 'user', 300, 'PRO', 3),
    ('user3@roma.com.br', SHA2('teste123', 256), 'Usuário 3 ROMA', 'user', 300, 'PRO', 3),
    ('admin2@roma.com.br', SHA2('admin123', 256), 'Administrador 2 ROMA', 'admin', 3000, 'PRO', 3),
    ('admin3@roma.com.br', SHA2('admin123', 256), 'Administrador 3 ROMA', 'admin', 3000, 'PRO', 3),
    ('user4@roma.com.br', SHA2('teste123', 256), 'Usuário 4 ROMA', 'user', 300, 'PRO', 3),
    
    ('superadmin@clausy.com.br', SHA2('super123', 256), 'Super Administrador', 'superadmin', 9999, 'PRO', 1); 