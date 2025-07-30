# Clausy - Sistema Jurídico Inteligente

Sistema de inteligência artificial especializado em análise jurídica, desenvolvido com as mais modernas tecnologias web.

## 🚀 Tecnologias

- Node.js
- React
- MySQL
- Redis
- Docker
- Express
- JWT Authentication

## 📋 Pré-requisitos

- Docker e Docker Compose
- Node.js 18+
- npm ou yarn

## 🔧 Configuração do Ambiente

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/Clausy.git
cd Clausy
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas configurações.

3. Inicie os containers:
```bash
docker-compose up -d
```

4. Instale as dependências do projeto:
```bash
npm install
```

5. Execute as migrações do banco de dados:
```bash
npm run migrate
```

## 🏃‍♂️ Executando o Projeto

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## 🔐 Segurança

- Autenticação JWT
- Rate Limiting
- CORS configurado
- Senhas criptografadas
- Headers de segurança com Helmet

## 📦 Estrutura do Projeto

```
clausy/
├── src/                    # Código fonte do frontend
├── server.js              # Servidor Express
├── docker-compose.yml     # Configuração Docker
├── Dockerfile            # Configuração de build
└── database.sql          # Schema do banco de dados
```

## 🔄 CI/CD

O projeto utiliza GitHub Actions para:
- Testes automatizados
- Build e deploy
- Análise de código
- Verificação de segurança

## 📝 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request 