# DigiYou CRM - Gerenciador de Pipeline

Este projeto é um CRM moderno focado em um gerenciador de pipeline estilo Kanban, inspirado no ActiveCampaign. Ele permite o gerenciamento abrangente de funis, etapas e negócios, com análises de painel.

---

## Capturas de Tela

### Página de Login

![Página de Login](./.playwright-mcp/login-page.png)

### Página de Pipeline

![Página de Pipeline](./.playwright-mcp/pipeline-page.png)

### Página de Configurações

![Página de Configurações](./.playwright-mcp/settings-page.png)

---

## Funcionalidades Principais

*   **Gerenciamento de Pipeline**: Crie e gerencie pipelines de vendas com etapas personalizáveis.
*   **Rastreamento de Negócios**: Acompanhe os negócios através de várias etapas, incluindo valor, contato e status.
*   **Gerenciamento de Contatos**: Armazene e gerencie informações de contato, incluindo campos personalizados e histórico de interação.
*   **Mecanismo de Automação**: Configure ações automatizadas baseadas em eventos de negócios ou tarefas (por exemplo, enviar e-mails, criar tarefas, enviar webhooks, mensagens do WhatsApp).
*   **Modelos de E-mail**: Crie e gerencie modelos de e-mail reutilizáveis para automações.
*   **Gerenciamento de Tarefas**: Crie e atribua tarefas, vincule-as a negócios ou contatos e acompanhe a conclusão.
*   **Notas de Calendário**: Agende e gerencie notas e eventos importantes.
*   **Gerenciamento de Usuários**: Adicione e remova usuários com acesso à conta do CRM.
*   **Análise de Painel**: Visualize os principais indicadores de desempenho e a distribuição de negócios.
*   **Integração SMTP**: Configure as configurações SMTP para envio de e-mails, tanto em nível de sistema quanto por empresa.
*   **Integração do WhatsApp (Evolution API)**: Conecte-se ao WhatsApp para mensagens automatizadas.

---

## Como Rodar a Aplicação

Existem duas maneiras principais de rodar esta aplicação: para desenvolvimento e para produção.

### Desenvolvimento

Para desenvolvimento, você precisa rodar o servidor de API (backend) e o servidor de desenvolvimento do frontend em **dois terminais separados**. Isso permite funcionalidades como recarregamento instantâneo (hot-reloading) no frontend.

**1. Iniciar o Servidor Backend:**

*   Instale as dependências:
    ```bash
    npm install
    ```
*   **Configure as Variáveis de Ambiente**: Crie um arquivo `.env` na raiz do projeto com o seguinte (substitua pelos seus dados SMTP reais):
    ```
    # Configurações SMTP específicas da empresa (podem ser substituídas por empresa nas configurações do CRM)
    SMTP_HOST=seu_servidor_smtp
    SMTP_PORT=587
    SMTP_SECURE=false
    SMTP_USER=seu_usuario_smtp
    SMTP_PASS=sua_senha_smtp

    # Configurações SMTP em nível de sistema para registro, redefinição de senha, etc.
    # Estas são usadas para funcionalidades centrais do CRM e têm precedência sobre SMTP_HOST/PORT/USER/PASS
    SYSTEM_SMTP_HOST=seu_servidor_smtp_sistema
    SYSTEM_SMTP_PORT=587
    SYSTEM_SMTP_SECURE=false
    SYSTEM_SMTP_USER=seu_usuario_smtp_sistema
    SYSTEM_SMTP_PASS=sua_senha_smtp_sistema

    # Outras variáveis de ambiente opcionais
    # PORT=4029
    # DB_FILE=crm.db
    ```
*   Inicie o servidor de API:
    ```bash
    npm start
    ```
*   O servidor será iniciado em `http://localhost:4029` e criará um arquivo `crm.db` se ele não existir. Mantenha este terminal em execução.

**2. Iniciar o Servidor Frontend:**

*   Abra um **novo terminal** no mesmo diretório do projeto.
*   Instale as dependências (se ainda não o fez):
    ```bash
    npm install
    ```
*   Inicie o servidor de desenvolvimento Vite:
    ```bash
    npm run dev
    ```
*   O Vite fornecerá uma URL local, tipicamente `http://localhost:5173`. Abra esta URL no seu navegador.

As credenciais de login padrão para a empresa inicial são `ADMIN` / `1234`.

---

### Implantação em Produção no Linux

Para um ambiente de produção, você deve construir a aplicação React em arquivos estáticos e ter um único servidor Node.js que sirva tanto a API quanto o frontend.

**1. Pré-requisitos:**

*   Um servidor Linux com Node.js e npm instalados.
*   Git (para clonar o repositório).

**2. Instalação:**

*   Clone o repositório do seu projeto para o servidor.
*   Navegue até o diretório do projeto e instale todas as dependências:
    ```bash
    npm install
    ```

**3. Configuração (Essencial para a Funcionalidade de E-mail):**

*   **Variáveis de Ambiente**: Crie um arquivo `.env` na raiz do projeto com o seguinte (substitua pelos seus dados SMTP reais):
    ```
    # Configurações SMTP específicas da empresa (podem ser substituídas por empresa nas configurações do CRM)
    SMTP_HOST=seu_servidor_smtp
    SMTP_PORT=587
    SMTP_SECURE=false
    SMTP_USER=seu_usuario_smtp
    SMTP_PASS=sua_senha_smtp

    # Configurações SMTP em nível de sistema para registro, redefinição de senha, etc.
    # Estas são usadas para funcionalidades centrais do CRM e têm precedência sobre SMTP_HOST/PORT/USER/PASS
    SYSTEM_SMTP_HOST=seu_servidor_smtp_sistema
    SYSTEM_SMTP_PORT=587
    SYSTEM_SMTP_SECURE=false
    SYSTEM_SMTP_USER=seu_usuario_smtp_sistema
    SYSTEM_SMTP_PASS=sua_senha_smtp_sistema

    # Outras variáveis de ambiente opcionais
    # PORT=4029
    # DB_FILE=crm.db
    ```
    **Importante**: Para produção, é altamente recomendável definir essas variáveis de ambiente diretamente em seu ambiente de hospedagem (por exemplo, usando comandos `export`, um arquivo `.env` gerenciado pelo seu processo de implantação ou um gerenciador de segredos) em vez de enviá-las para o controle de versão.

**4. Construir o Frontend:**

*   Execute o script de construção para compilar a aplicação React em uma pasta `dist` otimizada:
    ```bash
    npm run build
    ```

**5. Iniciar o Servidor de Produção:**

*   Execute o script `start`. Este único comando iniciará o servidor pronto para produção, que serve tanto a sua API quanto o frontend compilado.
    ```bash
    npm start
    ```
*   A aplicação estará acessível em `http://<seu-ip-do-servidor>:<PORT>`.

**6. Gerenciamento de Processos (Recomendado):**

*   Para garantir que sua aplicação seja executada continuamente e reinicie automaticamente se falhar, use um gerenciador de processos como o **PM2**.

*   Instale o PM2 globalmente:
    ```bash
    npm install -g pm2
    ```

*   Inicie sua aplicação com PM2:
    ```bash
    pm2 start server.js --name "digiyou-crm"
    ```

*   Para fazer a aplicação iniciar automaticamente na reinicialização do servidor, execute:
    ```bash
    pm2 startup
    ```
    (Isso fornecerá um comando que você precisa copiar e executar com privilégios de sudo).

*   Salve a lista de processos atual para ser restaurada na reinicialização:
    ```bash
    pm2 save
    ```

*   Você pode monitorar sua aplicação com `pm2 list` ou `pm2 monit`.

---

## Testando a Configuração SMTP

### Desenvolvimento Local

1.  **Configurar `.env`**: Certifique-se de que `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` (para a empresa) e `SYSTEM_SMTP_HOST`, `SYSTEM_SMTP_PORT`, `SYSTEM_SMTP_SECURE`, `SYSTEM_SMTP_USER`, `SYSTEM_SMTP_PASS` (para o sistema) estejam configurados corretamente em seu arquivo `.env`.
2.  **Iniciar Servidores**: Execute `npm start` (backend) e `npm run dev` (frontend).
3.  **Testar SMTP do Sistema**:
    *   Navegue até a página de registro (`/register`). Tente registrar um novo usuário. Se o SMTP do sistema estiver configurado corretamente, você deverá receber um e-mail de verificação.
    *   Navegue até a página de redefinição de senha (`/forgot-password`). Digite o e-mail de um usuário existente. Se configurado corretamente, você deverá receber um e-mail de redefinição de senha.
4.  **Testar SMTP Específico da Empresa**:
    *   Faça login no CRM.
    *   Vá para "Configurações" -> "Configuração de E-mail (SMTP)".
    *   Os campos devem ser preenchidos automaticamente a partir de suas variáveis `SMTP_` do `.env`. Você pode modificá-los aqui, se necessário.
    *   Digite um e-mail de destinatário na seção "Testar Conexão" e clique em "Testar". Você deverá receber um e-mail de teste.
    *   Crie uma automação que envie um e-mail e ative-a para verificar.

### Ambiente de Produção

1.  **Configurar Variáveis de Ambiente**: Certifique-se de que `SYSTEM_SMTP_HOST`, `SYSTEM_SMTP_PORT`, `SYSTEM_SMTP_SECURE`, `SYSTEM_SMTP_USER`, `SYSTEM_SMTP_PASS` e `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` estejam definidos em seu ambiente de produção.
2.  **Deploy e Iniciar**: Siga as etapas de "Implantação em Produção no Linux" para construir e iniciar sua aplicação.
3.  **Testar SMTP do Sistema**:
    *   Acesse a página de registro do seu CRM implantado. Registre um novo usuário para verificar a entrega do e-mail de verificação.
    *   Use a funcionalidade de redefinição de senha para um usuário existente para verificar a entrega do e-mail de redefinição de senha.
4.  **Testar SMTP Específico da Empresa**:
    *   Faça login no CRM implantado.
    *   Navegue até "Configurações" -> "Configuração de E-mail (SMTP)".
    *   Verifique se os campos refletem as variáveis de ambiente `SMTP_` definidas em produção.
    *   Envie um e-mail de teste a partir desta seção.
    *   Ative uma automação de e-mail para confirmar que funciona.