# Instruções para Configuração e Execução do Clausy

## Pré-requisitos
- Node.js (versão recomendada: 18.x ou superior)
- MySQL (versão 8.0 ou superior)
- NPM ou Yarn

## Configuração do Banco de Dados
1. Crie o banco de dados executando o script SQL:
   ```
   mysql -u root -p < database.sql
   ```

2. Se necessário, execute os scripts adicionais de migração:
   ```
   mysql -u root -p clausy < create_company_tables.sql
   mysql -u root -p clausy < add_company_id.sql
   ```

## Configuração do Ambiente
1. Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:
   ```
   # Configurações do Banco de Dados
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=sua_senha_mysql
   DB_NAME=clausy

   # Configurações do Servidor
   PORT=3000
   CORS_ORIGIN=http://localhost:3000

   # Configurações de Segurança
   JWT_SECRET=clausy_secret_key_for_development
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=1000

   # Configurações da Aplicação
   NODE_ENV=development
   ```

2. Instale as dependências do projeto:
   ```
   npm install
   ```

## Execução do Projeto
1. Para executar o frontend e o backend simultaneamente:
   ```
   npm run start:all
   ```

2. Para executar apenas o backend:
   ```
   npm run server
   ```

3. Para executar apenas o frontend:
   ```
   npm start
   ```

## Credenciais de Acesso Padrão
- Superadmin: 
  - Email: superadmin@clausy.com.br
  - Senha: super123

- Admin: 
  - Email: admin@alfa.com.br
  - Senha: admin123

- Usuário: 
  - Email: user1@alfa.com.br
  - Senha: teste123

## Solução de Problemas
- Se o servidor não iniciar, verifique se o MySQL está rodando e as configurações no arquivo `.env` estão corretas.
- Certifique-se de que as portas 3000 (frontend) e 5000 (backend) não estão sendo usadas por outros aplicativos.
- Para mais detalhes, consulte os logs no console. 