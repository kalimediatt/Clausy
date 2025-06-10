-- Primeiro, vamos desabilitar as chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 0;

-- Agora podemos limpar a tabela
TRUNCATE TABLE subscription_plans;

-- Agora vamos inserir os novos planos
INSERT INTO subscription_plans (plan_id, name, max_queries_per_hour, max_tokens_per_hour, history_retention_hours, price, color, description)
VALUES 
    ('FREE_TRIAL', 'Free Trial', 50, 3000, 24, 0.00, '#64748b', 'Plano gratuito com recursos limitados'),
    ('STANDARD', 'Standard', 150, 15000, 168, 99.90, '#3b82f6', 'Plano intermediário com bom custo-benefício'),
    ('PRO', 'Pro', 1000, 50000, 720, 249.90, '#10b981', 'Plano profissional com recursos avançados'),
    ('ENTERPRISE', 'Enterprise', 10000, 200000, 2160, 499.90, '#f59e0b', 'Plano empresarial com recursos ilimitados');

-- Reabilitar as chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1; 