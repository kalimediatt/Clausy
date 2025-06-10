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

-- Inserir empresas de exemplo
INSERT INTO companies (name, document, plan_id, license_count)
VALUES
    ('ALFA Advocacia', '12345678000190', 'STANDARD', 3),
    ('BETA Jurídico', '98765432000190', 'PRO', 5),
    ('ROMA Consultoria', '45678912000190', 'PRO', 7);

-- Adicionar coluna company_id à tabela users
ALTER TABLE users ADD COLUMN company_id INT;
ALTER TABLE users ADD FOREIGN KEY (company_id) REFERENCES companies(company_id);

-- Atualizar usuários existentes para pertencer à empresa ALFA (ID 1)
UPDATE users SET company_id = 1;

-- Inserir novos usuários para as empresas
-- ALFA (já temos os usuários atualizados)
-- BETA
INSERT INTO users (email, password_hash, name, role, credits, plan_id, company_id)
VALUES 
    ('admin1@beta.com.br', SHA2('admin123', 256), 'Administrador 1 BETA', 'admin', 2000, 'PRO', 2),
    ('user1@beta.com.br', SHA2('teste123', 256), 'Usuário 1 BETA', 'user', 200, 'PRO', 2),
    ('user2@beta.com.br', SHA2('teste123', 256), 'Usuário 2 BETA', 'user', 200, 'PRO', 2),
    ('user3@beta.com.br', SHA2('teste123', 256), 'Usuário 3 BETA', 'user', 200, 'PRO', 2),
    ('admin2@beta.com.br', SHA2('admin123', 256), 'Administrador 2 BETA', 'admin', 2000, 'PRO', 2);

-- ROMA
INSERT INTO users (email, password_hash, name, role, credits, plan_id, company_id)
VALUES
    ('admin1@roma.com.br', SHA2('admin123', 256), 'Administrador 1 ROMA', 'admin', 3000, 'PRO', 3),
    ('user1@roma.com.br', SHA2('teste123', 256), 'Usuário 1 ROMA', 'user', 300, 'PRO', 3),
    ('user2@roma.com.br', SHA2('teste123', 256), 'Usuário 2 ROMA', 'user', 300, 'PRO', 3),
    ('user3@roma.com.br', SHA2('teste123', 256), 'Usuário 3 ROMA', 'user', 300, 'PRO', 3),
    ('admin2@roma.com.br', SHA2('admin123', 256), 'Administrador 2 ROMA', 'admin', 3000, 'PRO', 3),
    ('admin3@roma.com.br', SHA2('admin123', 256), 'Administrador 3 ROMA', 'admin', 3000, 'PRO', 3),
    ('user4@roma.com.br', SHA2('teste123', 256), 'Usuário 4 ROMA', 'user', 300, 'PRO', 3);

-- Adicionar um super administrador
INSERT INTO users (email, password_hash, name, role, credits, plan_id, company_id)
VALUES
    ('superadmin@clausy.com.br', SHA2('super123', 256), 'Super Administrador', 'superadmin', 9999, 'PRO', 1);

-- Modificar role para incluir superadmin
ALTER TABLE users MODIFY role ENUM('user', 'admin', 'superadmin') NOT NULL DEFAULT 'user';

-- Adicionar coluna company_id à tabela usage_stats
ALTER TABLE usage_stats ADD COLUMN company_id INT;
ALTER TABLE usage_stats ADD FOREIGN KEY (company_id) REFERENCES companies(company_id);

-- Atualizar estatísticas existentes para a empresa ALFA
UPDATE usage_stats SET company_id = 1;

-- Adicionar coluna company_id à tabela query_history
ALTER TABLE query_history ADD COLUMN company_id INT;
ALTER TABLE query_history ADD FOREIGN KEY (company_id) REFERENCES companies(company_id);

-- Atualizar histórico existente para a empresa ALFA
UPDATE query_history SET company_id = 1; 