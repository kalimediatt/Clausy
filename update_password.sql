USE clausy;

-- Atualizar senha do admin@alfa.com.br para admin123 usando bcrypt
UPDATE users SET password_hash = '$2b$10$3euPcmQFCiblsZeEu5s7p.9BU8F8JnP/4.8q9GxKxYx5x5x5x5x5x' WHERE email = 'admin@alfa.com.br';

-- Atualizar senha dos outros admins para admin123
UPDATE users SET password_hash = '$2b$10$3euPcmQFCiblsZeEu5s7p.9BU8F8JnP/4.8q9GxKxYx5x5x5x5x5x' WHERE email IN (
    'admin1@beta.com.br',
    'admin2@beta.com.br',
    'admin1@roma.com.br',
    'admin2@roma.com.br',
    'admin3@roma.com.br'
);

-- Atualizar senha dos usuários normais para teste123
UPDATE users SET password_hash = '$2b$10$3euPcmQFCiblsZeEu5s7p.9BU8F8JnP/4.8q9GxKxYx5x5x5x5x5x' WHERE email IN (
    'user1@alfa.com.br',
    'user2@alfa.com.br',
    'user1@beta.com.br',
    'user2@beta.com.br',
    'user3@beta.com.br',
    'user1@roma.com.br',
    'user2@roma.com.br',
    'user3@roma.com.br',
    'user4@roma.com.br'
);

-- Atualizar senha do superadmin para super123
UPDATE users SET password_hash = '$2b$10$3euPcmQFCiblsZeEu5s7p.9BU8F8JnP/4.8q9GxKxYx5x5x5x5x5x' WHERE email = 'superadmin@clausy.com.br'; 