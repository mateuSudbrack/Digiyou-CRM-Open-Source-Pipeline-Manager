# DigiYou CRM - Gerenciador de Pipeline

Este projeto é um CRM moderno focado em um gerenciador de pipeline estilo Kanban, inspirado no ActiveCampaign. Ele permite o gerenciamento abrangente de funis, etapas e negócios, com análises de painel.

---

## Capturas de Tela

### Página de Login
<img width="1357" height="636" alt="image" src="https://github.com/user-attachments/assets/cd6d7c73-81cc-4c85-abe4-abba37f30535" />

### Página de Pipeline
<img width="1358" height="625" alt="image" src="https://github.com/user-attachments/assets/1e869011-5132-407f-944b-90f2b5b6d8c2" />

### Página de Configurações
<img width="1354" height="630" alt="image" src="https://github.com/user-attachments/assets/15a002c5-684b-4ede-8f8c-23874eb4c1cf" />

---

## Funcionalidades Principais

- **Gerenciamento de Pipeline**: Crie e gerencie pipelines de vendas com etapas personalizáveis.
- **Campos Personalizados**: Gerencie campos de contato e negócio de acordo com sua necessidade.
- **Rastreamento de Negócios**: Acompanhe os negócios através de várias etapas, incluindo valor, contato e status.
- **Gerenciamento de Contatos**: Armazene e gerencie informações de contato, incluindo campos personalizados e histórico de interação.
- **Mecanismo de Automação**: Configure ações automatizadas baseadas em eventos (enviar e-mails, criar tarefas, webhooks, mensagens do WhatsApp).
- **Modelos de E-mail**: Crie e gerencie modelos de e-mail reutilizáveis para automações.
- **Gerenciamento de Tarefas**: Crie e atribua tarefas, vincule-as a negócios ou contatos e acompanhe a conclusão.
- **Notas de Calendário**: Agende e gerencie notas e eventos importantes.
- **Gerenciamento de Usuários**: Adicione e remova usuários com acesso à conta do CRM.
- **Análise de Painel**: Visualize os principais indicadores de desempenho e a distribuição de negócios.
- **Integração SMTP**: Configure as configurações SMTP para envio de e-mails, tanto em nível de sistema quanto por empresa.
- **Integração do WhatsApp**: Conecte-se ao WhatsApp via Evolution API para mensagens automatizadas.
- **API Completa**: Tudo que você faz no front, pode fazer por API, permitindo automação total do CRM.

---

## Como Rodar a Aplicação

### Instalação e Configuração

```bash
git clone <seu-repositorio>
cd digiyou-crm
npm install
```

Crie um arquivo `.env` na raiz do projeto:

```env
# SMTP específico da empresa
SMTP_HOST=seu_servidor_smtp
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_usuario_smtp
SMTP_PASS=sua_senha_smtp

# SMTP do sistema (registro, redefinição de senha)
SYSTEM_SMTP_HOST=seu_servidor_smtp_sistema
SYSTEM_SMTP_PORT=587
SYSTEM_SMTP_SECURE=false
SYSTEM_SMTP_USER=seu_usuario_smtp_sistema
SYSTEM_SMTP_PASS=sua_senha_smtp_sistema

# Opcional
# PORT=4029
# DB_FILE=crm.db
```

> **⚠️ Produção**: Defina as variáveis de ambiente diretamente no servidor ao invés de usar arquivo `.env`.

---

### Modo Desenvolvimento

**Terminal 1 - Backend:**
```bash
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Acesse `http://localhost:5173` com as credenciais: `ADMIN` / `1234`

---

### Modo Produção

```bash
npm run build
npm start
```

A aplicação estará disponível em `http://<seu-ip>:4029`

---

## Gerenciamento com PM2

```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start server.js --name "digiyou-crm"

# Configurar inicialização automática
pm2 startup
pm2 save


---

## Configuração SSL com Nginx

Crie `/etc/nginx/sites-available/digiyou-crm`:

```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    location / {
        proxy_pass http://localhost:4029;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ative e configure SSL:

```bash
sudo ln -s /etc/nginx/sites-available/digiyou-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

---

## Suporte

Para dúvidas ou problemas, abra uma issue no repositório do projeto.
