-- Inserir empresas
INSERT INTO companies (name, plan_id, document) VALUES 
('omega', 'ENTERPRISE', '12345678901235'),
('romeu', 'FREE', '98765432109877');

-- Inserir usuários da empresa omega (ENTERPRISE)
INSERT INTO users (email, password_hash, name, role, company_id, plan_id) VALUES
-- Administradores
('admin1@omega.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5Yx', 'Admin 1 Omega', 'admin', LAST_INSERT_ID(), 'ENTERPRISE'),
('admin2@omega.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5Yx', 'Admin 2 Omega', 'admin', LAST_INSERT_ID(), 'ENTERPRISE'),
-- Colaboradores
('colab1@omega.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5Yx', 'Colab 1 Omega', 'user', LAST_INSERT_ID(), 'ENTERPRISE'),
('colab2@omega.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5Yx', 'Colab 2 Omega', 'user', LAST_INSERT_ID(), 'ENTERPRISE'),
('colab3@omega.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5Yx', 'Colab 3 Omega', 'user', LAST_INSERT_ID(), 'ENTERPRISE'),
('colab4@omega.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5Yx', 'Colab 4 Omega', 'user', LAST_INSERT_ID(), 'ENTERPRISE');

-- Inserir usuários da empresa romeu (FREE)
INSERT INTO users (email, password_hash, name, role, company_id, plan_id) VALUES
-- Administrador
('admin@romeu.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5Yx', 'Admin Romeu', 'admin', LAST_INSERT_ID(), 'FREE'),
-- Colaboradores
('colab1@romeu.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5Yx', 'Colab 1 Romeu', 'user', LAST_INSERT_ID(), 'FREE'),
('colab2@romeu.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5Yx', 'Colab 2 Romeu', 'user', LAST_INSERT_ID(), 'FREE'); 