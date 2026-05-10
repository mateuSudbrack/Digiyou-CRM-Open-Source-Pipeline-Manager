<div align="center">

# DigiYou CRM

**Open-source, self-hosted CRM with visual automation builder, customizable dashboards, and WhatsApp integration.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![SQLite](https://img.shields.io/badge/SQLite-embedded-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)

[Report Bug](../../issues) · [Request Feature](../../issues) · [Discussions](../../discussions)

</div>

---

## What is DigiYou CRM?

DigiYou CRM is a **complete, production-ready CRM** built for small and medium businesses that want full control over their data. No subscriptions, no vendor lock-in — just clone, configure, and run on your own server.

It covers the entire sales cycle: from lead capture via API, through pipeline management with Kanban boards, to automated follow-ups by e-mail or WhatsApp, all with a real-time customizable dashboard.

---

## Features

### Sales Pipeline
- **Visual Kanban board** with drag-and-drop deal cards
- Multiple named pipelines per company (Sales, Support, Onboarding…)
- Custom stages per pipeline with configurable ordering
- Deal value tracking, due dates, and win/loss status
- Advanced filtering by value, custom fields, due date, status, and more
- List view with sortable columns as an alternative to the board

### Contacts & Companies
- Full contact profiles with multiple phones, e-mail, and classification (Client / Partner)
- Attach files to contacts (images, PDFs, documents)
- Custom fields per contact, configurable per company
- Full history log of every change made to a contact
- Internal notes with timestamps

### Automation Builder
- Visual **no-code automation flow** editor
- Triggers: deal stage change, deal created, task created/completed, due date approaching, status update, note added
- Actions: send e-mail from template, send WhatsApp message, create deal, move deal to stage, add note, create task, create calendar note, call webhook, update deal status
- **Conditional branching** (if/else logic) inside flows
- **Wait steps** — pause by duration (minutes/hours/days) or wait until a condition is met
- Scheduled execution engine running in the background

### Dashboard
- Fully **customizable widget grid**
- Widget types: KPI cards, Funnel chart, Status pie chart, Tasks list, Team leaderboard
- KPI metrics: total open value, total won value, total lost value, expected revenue (next 30 days)
- Filter charts by pipeline
- Add, edit, reorder, and remove widgets freely

### Email
- HTML **email template builder** (subject + body)
- Dual SMTP configuration (company SMTP + system SMTP for transactional e-mails)
- Send e-mails via automations triggered by deal events
- E-mail confirmation and password reset flows out of the box

### WhatsApp Integration
- Native integration with **[Evolution API](https://github.com/EvolutionAPI/evolution-api)**
- Send WhatsApp messages as an automation action (per deal event)
- Configure instance name, API key, and URL from the settings panel

### Calendar & Tasks
- Unified calendar combining tasks and calendar notes
- To-do list with due dates linked to deals and contacts
- Calendar notes for scheduling reminders
- Overdue and upcoming task widgets on the dashboard

### Activity Notes
- Rich **Markdown notes** with [Mermaid](https://mermaid.js.org) diagram support
- Useful for meeting notes, process docs, or team runbooks inside the CRM

### REST API
- Full REST API with **API key authentication**
- Create contacts, deals, and move deals programmatically
- Webhook support — fire outbound HTTP calls from any automation
- Built-in API documentation view inside the app

### Multi-tenant & User Management
- Multi-company: isolated data per company, single server
- Role-based access: `superadmin` / `admin` / `user`
- Admin dashboard: create/edit/delete users, manage company SMTP config, Evolution API config
- JWT session authentication

### Bulk Import
- Import deals from CSV with auto-mapping of columns
- Auto-create pipelines, stages, and contacts that don't exist yet
- Map custom deal and contact fields during import

---

## Screenshots

### Login
<img width="1357" alt="Login page" src="https://github.com/user-attachments/assets/cd6d7c73-81cc-4c85-abe4-abba37f30535" />

### Pipeline (Kanban Board)
<img width="1358" alt="Pipeline kanban board" src="https://github.com/user-attachments/assets/1e869011-5132-407f-944b-90f2b5b6d8c2" />

### Settings
<img width="1354" alt="Settings panel" src="https://github.com/user-attachments/assets/15a002c5-684b-4ede-8f8c-23874eb4c1cf" />

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Charts | Recharts |
| Markdown | react-markdown + remark-gfm + Mermaid |
| Backend | Node.js, Express 5 |
| Database | SQLite (via `sqlite` / `sqlite3`) |
| Auth | JWT + express-session + cookie-parser |
| Email | Nodemailer |
| State | React hooks + Immer |
| Testing | Playwright |

> Everything runs in a **single Node.js process** — no external services required beyond your SMTP credentials.

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### 1. Clone & install

```bash
git clone https://github.com/mateusudbrack/digiyou-crm-open-source-pipeline-manager.git
cd digiyou-crm-open-source-pipeline-manager
npm install
```

### 2. Configure environment

Copy the example and fill in your SMTP credentials:

```bash
cp .env.example .env
```

```env
# SMTP used for outbound company e-mails (automations)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@example.com
SMTP_PASS=yourpassword

# SMTP used for system e-mails (registration, password reset)
SYSTEM_SMTP_HOST=smtp.example.com
SYSTEM_SMTP_PORT=587
SYSTEM_SMTP_SECURE=false
SYSTEM_SMTP_USER=system@example.com
SYSTEM_SMTP_PASS=yourpassword

# Optional
# PORT=4029
# DB_FILE=crm.db
```

> **Production tip:** set these variables directly in your server environment instead of using a `.env` file.

### 3. Run in development mode

Open two terminals:

```bash
# Terminal 1 — backend
npm start

# Terminal 2 — frontend dev server
npm run dev
```

Open `http://localhost:5173` and log in with **`ADMIN` / `1234`**.

### 4. Run in production mode

```bash
npm run build
npm start
```

The app will be available at `http://<your-ip>:4029`.

---

## Production Deployment

### PM2 (process manager)

```bash
npm install -g pm2
pm2 start server.js --name digiyou-crm
pm2 startup && pm2 save
```

### Nginx reverse proxy

Create `/etc/nginx/sites-available/digiyou-crm`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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

Enable and add SSL:

```bash
sudo ln -s /etc/nginx/sites-available/digiyou-crm /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## REST API

The CRM exposes a REST API secured by an API key (generated in **Settings → API**).

Send the key in the `x-api-key` header on every request.

Full interactive documentation is available inside the app under the **API** menu item. Example endpoints:

```
GET    /api/v1/contacts
POST   /api/v1/contacts
GET    /api/v1/deals
POST   /api/v1/deals
PATCH  /api/v1/deals/:id/stage
```

---

## Contributing

Contributions are welcome and appreciated.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push the branch: `git push origin feat/my-feature`
5. Open a Pull Request

Please open an issue first for larger changes so we can discuss the approach.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

Made with dedication by [@mateusudbrack](https://github.com/mateusudbrack). Free forever.
