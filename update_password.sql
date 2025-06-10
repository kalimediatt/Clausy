USE clausy;
UPDATE users SET password_hash = SHA2('Teste@123', 256) WHERE email not like '%super%'; 