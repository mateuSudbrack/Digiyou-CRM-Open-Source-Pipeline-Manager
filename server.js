import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';

dotenv.config();

import session from 'express-session';

const app = express();

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using https
}));
const PORT = process.env.PORT || 4029;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Database Setup ---
let db;

const DB_FILE = process.env.DB_FILE || 'crm.db';

const openDb = async () => {
    if (db) return db;
    db = await open({
        filename: DB_FILE,
        driver: sqlite3.Database
    });
    await db.exec('PRAGMA journal_mode = WAL;');
    await db.exec('PRAGMA foreign_keys = ON;');
    return db;
};

const getDateInFuture = (days) => {
    const futureDate = new Date();
    futureDate.setDate(new Date().getDate() + days);
    return futureDate.toISOString().split('T')[0]; // YYYY-MM-DD
};

const createHistoryEntry = (action, details = {}) => ({
    id: generateId(),
    action,
    details,
    createdAt: new Date().toISOString(),
});

const defaultDashboardConfig = [
    { id: 'kpi_open', type: 'KPI', config: { metric: 'TOTAL_OPEN_VALUE', title: 'Open Value' } },
    { id: 'kpi_won', type: 'KPI', config: { metric: 'TOTAL_WON_VALUE', title: 'Won Value' } },
    { id: 'kpi_lost', type: 'KPI', config: { metric: 'TOTAL_LOST_VALUE', title: 'Lost Value' } },
    { id: 'kpi_exp', type: 'KPI', config: { metric: 'EXPECTED_30_DAYS', title: 'Expected (Next 30d)' } },
    { id: 'funnel_main', type: 'FUNNEL_CHART', config: { title: 'Open Deals Funnel', pipelineId: null } },
    { id: 'pie_main', type: 'STATUS_PIE_CHART', config: { title: 'Deals by Status', pipelineId: null } },
];

const getInitialData = () => {
  const initialCompanyId = generateId();
  const initialContactEmail = 'contato@exemplo.com';
  const secondContactEmail = 'contato@solucoestech.com';
  const initialPipelineId = generateId();
  
  const initialStages = [
    { id: generateId(), name: 'Lead In', pipelineId: initialPipelineId, order: 0, companyId: initialCompanyId },
    { id: generateId(), name: 'Contact Made', pipelineId: initialPipelineId, order: 1, companyId: initialCompanyId },
    { id: generateId(), name: 'Demo Scheduled', pipelineId: initialPipelineId, order: 2, companyId: initialCompanyId },
    { id: generateId(), name: 'Proposal Made', pipelineId: initialPipelineId, order: 3, companyId: initialCompanyId },
    { id: generateId(), name: 'Negotiations', pipelineId: initialPipelineId, order: 4, companyId: initialCompanyId },
  ];
  
  const initialCustomFieldDefs = [
      { id: generateId(), name: 'Source', companyId: initialCompanyId },
      { id: generateId(), name: 'Urgency', companyId: initialCompanyId }
  ];

  const defaultSmtpConfig = process.env.SMTP_HOST ? JSON.stringify({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
  }) : '{}';

  return {
    companies: [{
      id: initialCompanyId, 
      name: 'DigiYou CRM (Default)',
      webhookUrl: '', 
      dashboardConfig: defaultDashboardConfig,
      smtpConfig: defaultSmtpConfig,
      evolutionInstanceName: null,
      evolutionApiKey: null,
      evolutionApiUrl: null,
    }],
    pipelines: [{ id: initialPipelineId, name: 'Sales Pipeline', companyId: initialCompanyId }],
    stages: initialStages,
    contacts: [
        { id: initialContactEmail, name: 'Empresa Exemplo Ltda', email: initialContactEmail, phones: ['(11) 99999-8888'], classification: 'CLIENT', observation: 'Long-time client.', notes: [], history: [createHistoryEntry('Contact Created')], customFields: {}, attachments: [], companyId: initialCompanyId },
        { id: secondContactEmail, name: 'Soluções Tech', email: secondContactEmail, phones: ['(21) 98877-6655', '(21) 2345-6789'], classification: 'PARTNER', observation: '', notes: [], history: [createHistoryEntry('Contact Created')], customFields: {}, attachments: [], companyId: initialCompanyId }
    ],
    customFieldDefinitions: initialCustomFieldDefs,
    contactCustomFieldDefinitions: [{ id: generateId(), name: 'Region', companyId: initialCompanyId }],
    deals: [
      { id: generateId(), name: 'Website Redesign Project', value: 15000, contactId: initialContactEmail, stageId: initialStages[0].id, status: 'OPEN', customFields: { [initialCustomFieldDefs[0].id]: 'Web Referral' }, notes: [{id: generateId(), content: 'Initial call was positive.', createdAt: new Date().toISOString()}], history: [createHistoryEntry('Deal Created')], observation: 'Client needs a quick turnaround.', data_vencimento: getDateInFuture(10), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), companyId: initialCompanyId },
      { id: generateId(), name: 'Digital Marketing Campaign', value: 7500, contactId: initialContactEmail, stageId: initialStages[1].id, status: 'OPEN', customFields: {}, notes: [], history: [createHistoryEntry('Deal Created')], observation: '', data_vencimento: getDateInFuture(25), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), companyId: initialCompanyId },
      { id: generateId(), name: 'E-commerce Platform', value: 45000, contactId: secondContactEmail, stageId: initialStages[4].id, status: 'WON', customFields: {}, notes: [], history: [createHistoryEntry('Deal Created')], observation: 'Closed deal on Q2.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), companyId: initialCompanyId },
    ],
    automations: [],
    emailTemplates: [],
    tasks: [
        { id: generateId(), title: 'Follow up with Empresa Exemplo', isCompleted: false, createdAt: new Date().toISOString(), dueDate: getDateInFuture(2), companyId: initialCompanyId, contactId: initialContactEmail },
        { id: generateId(), title: 'Prepare Q3 marketing proposal', isCompleted: true, createdAt: new Date().toISOString(), companyId: initialCompanyId },
        { id: generateId(), title: 'Schedule demo with Soluções Tech', isCompleted: false, createdAt: new Date().toISOString(), dueDate: getDateInFuture(7), companyId: initialCompanyId },
    ],
    users: [ { username: 'ADMIN', password: '1234', companyId: initialCompanyId }],
    pendingUsers: [],
    calendarNotes: [
        { id: generateId(), title: 'Team Meeting', content: 'Discuss Q3 goals', date: getDateInFuture(3), createdAt: new Date().toISOString(), companyId: initialCompanyId }
    ],
    activityNotes: [],
    scheduledJobs: [],
  };
};

const initializeDb = async () => {
    const db = await openDb();
    const tables = [
        `CREATE TABLE IF NOT EXISTS companies (id TEXT PRIMARY KEY, name TEXT, apiKey TEXT, webhookUrl TEXT, dashboardConfig TEXT, smtpConfig TEXT, evolutionInstanceName TEXT, evolutionApiKey TEXT, evolutionApiUrl TEXT)`,
        `CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT NOT NULL, companyId TEXT NOT NULL, resetToken TEXT, resetTokenExpiry INTEGER, FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE)`,
        `CREATE TABLE IF NOT EXISTS pendingUsers (username TEXT PRIMARY KEY, password TEXT, companyName TEXT, confirmationCode TEXT, tokenExpiry INTEGER)`,
        `CREATE TABLE IF NOT EXISTS pipelines (id TEXT PRIMARY KEY, name TEXT NOT NULL, companyId TEXT NOT NULL, FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE)`,
        `CREATE TABLE IF NOT EXISTS stages (id TEXT PRIMARY KEY, name TEXT NOT NULL, pipelineId TEXT NOT NULL, "order" INTEGER, companyId TEXT NOT NULL, FOREIGN KEY(pipelineId) REFERENCES pipelines(id) ON DELETE CASCADE)`,
        `CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phones TEXT, classification TEXT, observation TEXT, notes TEXT, history TEXT, customFields TEXT, attachments TEXT, companyId TEXT NOT NULL, UNIQUE(email, companyId), FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE)`,
        `CREATE TABLE IF NOT EXISTS deals (id TEXT PRIMARY KEY, name TEXT NOT NULL, value REAL, contactId TEXT NOT NULL, stageId TEXT NOT NULL, status TEXT, customFields TEXT, notes TEXT, history TEXT, observation TEXT, data_vencimento TEXT, createdAt TEXT, updatedAt TEXT, companyId TEXT NOT NULL, FOREIGN KEY(stageId) REFERENCES stages(id) ON DELETE CASCADE, FOREIGN KEY(contactId) REFERENCES contacts(id) ON DELETE CASCADE)`,
        `CREATE TABLE IF NOT EXISTS customFieldDefinitions (id TEXT PRIMARY KEY, name TEXT NOT NULL, companyId TEXT NOT NULL, FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE)`,
        `CREATE TABLE IF NOT EXISTS contactCustomFieldDefinitions (id TEXT PRIMARY KEY, name TEXT NOT NULL, companyId TEXT NOT NULL, FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE)`,
        `CREATE TABLE IF NOT EXISTS automations (id TEXT PRIMARY KEY, name TEXT NOT NULL, triggerType TEXT, triggerConfig TEXT, steps TEXT, companyId TEXT NOT NULL, FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE)`,
        `CREATE TABLE IF NOT EXISTS emailTemplates (id TEXT PRIMARY KEY, name TEXT NOT NULL, subject TEXT, body TEXT, createdAt TEXT, updatedAt TEXT, companyId TEXT NOT NULL, FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE)`,
        `CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, title TEXT NOT NULL, isCompleted INTEGER DEFAULT 0, createdAt TEXT, dueDate TEXT, companyId TEXT NOT NULL, contactId TEXT, dealId TEXT, FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE, FOREIGN KEY(dealId) REFERENCES deals(id) ON DELETE CASCADE)`,
        `CREATE TABLE IF NOT EXISTS calendarNotes (id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT, date TEXT, createdAt TEXT, companyId TEXT NOT NULL, FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE)`,
        `CREATE TABLE IF NOT EXISTS scheduledJobs (id TEXT PRIMARY KEY, companyId TEXT NOT NULL, dealId TEXT, automationId TEXT, executeAt TEXT, condition TEXT, remainingSteps TEXT, FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE, FOREIGN KEY(automationId) REFERENCES automations(id) ON DELETE CASCADE, FOREIGN KEY(dealId) REFERENCES deals(id) ON DELETE CASCADE)`,
    ];
    await Promise.all(tables.map(table => db.exec(table)));

    // Seed initial data if the database is empty
    const companyCount = await db.get('SELECT COUNT(*) as count FROM companies');
    if (companyCount.count === 0) {
        console.log('Database is empty. Seeding with initial data...');
        const initialData = getInitialData();
        for (const company of initialData.companies) {
            await db.run('INSERT INTO companies (id, name, apiKey, webhookUrl, dashboardConfig, smtpConfig, evolutionInstanceName, evolutionApiKey, evolutionApiUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                company.id, company.name, `api_key_${generateId()}`, company.webhookUrl, JSON.stringify(company.dashboardConfig), company.smtpConfig, company.evolutionInstanceName, company.evolutionApiKey, company.evolutionApiUrl);
        }
        for (const user of initialData.users) await db.run('INSERT INTO users (username, password, companyId) VALUES (?, ?, ?)', user.username, user.password, user.companyId);
        for (const pipeline of initialData.pipelines) await db.run('INSERT INTO pipelines (id, name, companyId) VALUES (?, ?, ?)', pipeline.id, pipeline.name, pipeline.companyId);
        for (const stage of initialData.stages) await db.run('INSERT INTO stages (id, name, pipelineId, "order", companyId) VALUES (?, ?, ?, ?, ?)', stage.id, stage.name, stage.pipelineId, stage.order, stage.companyId);
        for (const contact of initialData.contacts) await db.run('INSERT INTO contacts (id, name, email, phones, classification, observation, notes, history, customFields, attachments, companyId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            contact.id, contact.name, contact.email, JSON.stringify(contact.phones), contact.classification, contact.observation, JSON.stringify(contact.notes), JSON.stringify(contact.history), JSON.stringify(contact.customFields), JSON.stringify(contact.attachments), contact.companyId);
        for (const deal of initialData.deals) await db.run('INSERT INTO deals (id, name, value, contactId, stageId, status, customFields, notes, history, observation, data_vencimento, createdAt, updatedAt, companyId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            deal.id, deal.name, deal.value, deal.contactId, deal.stageId, deal.status, JSON.stringify(deal.customFields), JSON.stringify(deal.notes), JSON.stringify(deal.history), deal.observation, deal.data_vencimento, deal.createdAt, deal.updatedAt, deal.companyId);
        for (const def of initialData.customFieldDefinitions) await db.run('INSERT INTO customFieldDefinitions (id, name, companyId) VALUES (?, ?, ?)', def.id, def.name, def.companyId);
        for (const def of initialData.contactCustomFieldDefinitions) await db.run('INSERT INTO contactCustomFieldDefinitions (id, name, companyId) VALUES (?, ?, ?)', def.id, def.name, def.companyId);
        for (const task of initialData.tasks) await db.run('INSERT INTO tasks (id, title, isCompleted, createdAt, dueDate, companyId, contactId) VALUES (?, ?, ?, ?, ?, ?, ?)',
            task.id, task.title, task.isCompleted ? 1 : 0, task.createdAt, task.dueDate, task.companyId, task.contactId);
        for (const note of initialData.calendarNotes) await db.run('INSERT INTO calendarNotes (id, title, content, date, createdAt, companyId) VALUES (?, ?, ?, ?, ?, ?)',
            note.id, note.title, note.content, note.date, note.createdAt, note.companyId);

        console.log('Seeding complete.');
    }
};

const jsonParseFields = (entity, fields) => {
    if (!entity) return entity;
    const newEntity = { ...entity };
    fields.forEach(field => {
        try {
            newEntity[field] = JSON.parse(newEntity[field]);
        } catch (e) {
            newEntity[field] = Array.isArray(newEntity[field]) ? [] : {};
        }
    });
    return newEntity;
};

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
    console.log('Request Headers:', req.headers);
    const companyId = req.headers['x-company-id'];
    if (companyId) {
        req.companyId = companyId;
    }
    next();
});

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'dist')));


// --- Helpers ---
const generateId = () => `id_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;

const parseCurrencyValue = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return NaN;
    
    let str = value.trim();
    if (str === '') return NaN;

    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');

    let thousands, decimal;
    if (lastComma > lastDot) { // Assumes comma is decimal separator
        thousands = '.';
        decimal = ',';
    } else { // Assumes dot is decimal separator or no separator
        thousands = ',';
        decimal = '.';
    }
    
    let cleaned = str.replace(new RegExp(`\${thousands}`, 'g'), '');
    cleaned = cleaned.replace(new RegExp(`\${decimal}`, 'g'), '.');
    cleaned = cleaned.replace(/[^0-9.-]/g, '');

    const num = parseFloat(cleaned);
    return isNaN(num) ? NaN : num;
};

const parseImportDate = (dateString) => {
  if (typeof dateString !== 'string' || !dateString.trim()) return undefined;

  const trimmedDate = dateString.trim();
  
  const parts = trimmedDate.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  
  if (parts) {
    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10);
    const year = parseInt(parts[3], 10);

    if (year > 1900 && year < 3000 && month > 0 && month <= 12 && day > 0 && day <= 31) {
      const date = new Date(Date.UTC(year, month - 1, day));
      if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
        return date.toISOString().split('T')[0];
      }
    }
  }
}


// Helper function to apply formatting
const applyFormatting = (value, format) => {
    if (typeof value !== 'string') return value; // Return non-string values as is

    const trimmedValue = value.trim();

    // Debugging log for value field
    if (format && (format.startsWith('number') || format.startsWith('date'))) {
        console.log(`[applyFormatting Debug] Value: '${trimmedValue}', Format: '${format}'`);
    }

    if (trimmedValue === '') {
        if (format && format.startsWith('date')) return null; // Empty date string should be null
        if (format && format.startsWith('number')) return 0; // Empty number string should be 0
        return ''; // For other formats (like text), empty string remains empty
    }

    switch (format) {
        case 'date_dd_mm_yyyy': {
            const parts = trimmedValue.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10);
                const year = parseInt(parts[2], 10);
                const date = new Date(Date.UTC(year, month - 1, day));
                if (!isNaN(date.getTime()) && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
                    return date.toISOString().split('T')[0];
                }
            }
            return null;
        }
        case 'date_mm_dd_yyyy': {
            const parts = trimmedValue.split('/');
            if (parts.length === 3) {
                const month = parseInt(parts[0], 10);
                const day = parseInt(parts[1], 10);
                const year = parseInt(parts[2], 10);
                const date = new Date(Date.UTC(year, month - 1, day));
                if (!isNaN(date.getTime()) && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
                    return date.toISOString().split('T')[0];
                }
            }
            return null;
        }
        case 'number_dot_decimal': {
            let cleaned = trimmedValue.replace(/,/g, ''); // Remove thousands commas
            cleaned = cleaned.replace(/[^0-9.-]/g, ''); // Remove non-numeric except dot and sign
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        }
        case 'number_comma_decimal': {
            let cleaned = trimmedValue.replace(/\./g, ''); // Remove thousands dots
            cleaned = cleaned.replace(/,/g, '.'); // Replace comma decimal with dot decimal
            cleaned = cleaned.replace(/[^0-9.-]/g, ''); // Remove non-numeric except dot and sign
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        }
        case 'none':
        default:
            return trimmedValue;
    }
};


const normalizeEvolutionUrl = (url) => {
    if (typeof url !== 'string' || !url) return '';
    let cleaned = url.trim();
    if (cleaned.endsWith('/')) {
        cleaned = cleaned.slice(0, -1);
    }
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
        cleaned = 'https://' + cleaned;
    }
    return cleaned;
};

// --- History Logging is handled directly in endpoints ---

// --- Nodemailer Helper ---
const getTransporterForCompany = async (companyId) => {
    const db = await openDb();
    const company = await db.get('SELECT smtpConfig FROM companies WHERE id = ?', companyId);
    if (!company || !company.smtpConfig) return null;
    const smtpConfig = JSON.parse(company.smtpConfig);
    const { host, port, secure, user, pass } = smtpConfig;
    if (!host || !port || !user || !pass) return null;
    return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
};

const getSystemTransporter = async () => {
    const host = process.env.SYSTEM_SMTP_HOST || process.env.SMTP_HOST;
    const port = parseInt(process.env.SYSTEM_SMTP_PORT || process.env.SMTP_PORT || '587', 10);
    const secure = (process.env.SYSTEM_SMTP_SECURE || process.env.SMTP_SECURE) === 'true';
    const user = process.env.SYSTEM_SMTP_USER || process.env.SMTP_USER;
    const pass = process.env.SYSTEM_SMTP_PASS || process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
        console.warn("System SMTP not fully configured in environment variables. Falling back to company config if available.");
        const db = await openDb();
        const company = await db.get('SELECT smtpConfig FROM companies WHERE smtpConfig IS NOT NULL AND smtpConfig != "" LIMIT 1');
        if (!company || !company.smtpConfig) {
            return null;
        }
        const companySmtpConfig = JSON.parse(company.smtpConfig);
        return nodemailer.createTransport({ host: companySmtpConfig.host, port: companySmtpConfig.port, secure: companySmtpConfig.secure, auth: { user: companySmtpConfig.user, pass: companySmtpConfig.pass } });
    }
    return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
};


// --- Automation Engine (COMPANY SCOPED & DB-AWARE) ---
const resolvePlaceholders = async (text, context, companyId) => {
    if (typeof text !== 'string') return text;
    const db = await openDb();
    let resolvedText = text;

    const contact = context.deal ? await db.get('SELECT * FROM contacts WHERE companyId = ? AND id = ?', companyId, context.deal.contactId) : null;
    
    if (context.deal) {
        resolvedText = resolvedText.replace(/\{\{deal\.name\}\\/gi, context.deal.name).replace(/\{\{deal\.value\}\\/gi, String(context.deal.value)).replace(/\{\{deal\.id\}\\/gi, context.deal.id);
        const dealCustomFields = JSON.parse(context.deal.customFields || '{}');
        const customFieldDefs = await db.all('SELECT * FROM customFieldDefinitions WHERE companyId = ?', companyId);
        const customFieldDefsByName = new Map(customFieldDefs.map(def => [def.name.toLowerCase(), def.id]));

        resolvedText = resolvedText.replace(/\{\{custom\.([^}]+)\\}\\/gi, (match, fieldName) => {
            const fieldId = customFieldDefsByName.get(fieldName.trim().toLowerCase());
            return (fieldId && dealCustomFields[fieldId] !== undefined) ? dealCustomFields[fieldId] : match;
        });
    }

    if (contact) {
        const contactPhones = JSON.parse(contact.phones || '[]');
        resolvedText = resolvedText.replace(/\{\{contact\.name\}\\/gi, contact.name || '').replace(/\{\{contact\.email\}\\/gi, contact.email || '').replace(/\{\{contact\.phone\}\\/gi, contactPhones.length > 0 ? contactPhones[0] : '');

        const contactCustomFields = JSON.parse(contact.customFields || '{}');
        const contactCustomFieldDefs = await db.all('SELECT * FROM contactCustomFieldDefinitions WHERE companyId = ?', companyId);
        const contactCustomFieldDefsByName = new Map(contactCustomFieldDefs.map(def => [def.name.toLowerCase(), def.id]));
        
        resolvedText = resolvedText.replace(/\{\{contact\.custom\.([^}]+)\\}\\/gi, (match, fieldName) => {
            const fieldId = contactCustomFieldDefsByName.get(fieldName.trim().toLowerCase());
            return (fieldId && contactCustomFields[fieldId] !== undefined) ? contactCustomFields[fieldId] : match;
        });
    }

    if (context.task) {
        resolvedText = resolvedText.replace(/\{\{task\.title\}\\/gi, context.task.title);
    }
    return resolvedText;
};

const parseDateOffset = (offset) => {
    if (!offset || isNaN(parseInt(offset, 10))) return undefined;
    const days = parseInt(offset, 10);
    return getDateInFuture(days);
};

const evaluateCondition = async (condition, context, companyId) => {
    const db = await openDb();
    const { field, operator, value, customFieldId } = condition;
    const { deal } = context;

    if (!deal) return false;
    let dealValue;
    switch (field) {
        case 'DEAL_VALUE': dealValue = deal.value; break;
        case 'DEAL_STATUS': dealValue = deal.status; break;
        case 'DEAL_PIPELINE': {
             const stage = await db.get('SELECT pipelineId FROM stages WHERE companyId = ? AND id = ?', companyId, deal.stageId);
             dealValue = stage ? stage.pipelineId : null;
             break;
        }
        case 'DEAL_CUSTOM_FIELD': {
            const customFields = JSON.parse(deal.customFields || '{}');
            if (!customFieldId || !customFields) return false;
            dealValue = customFields[customFieldId];
            break;
        }
        case 'DEAL_DUE_DATE': dealValue = deal.data_vencimento; break;
        default: return false;
    }

    if (field === 'DEAL_DUE_DATE') {
        if (!dealValue || !value) return false;
        const dealDate = new Date(dealValue).getTime();
        const conditionDate = new Date(value).getTime();
        if (isNaN(dealDate) || isNaN(conditionDate)) return false;
        switch(operator) {
            case 'EQUALS': return dealDate === conditionDate;
            case 'NOT_EQUALS': return dealDate !== conditionDate;
            case 'ON_OR_AFTER': return dealDate >= conditionDate;
            case 'ON_OR_BEFORE': return dealDate <= conditionDate;
            default: return false;
        }
    }

    const isNumeric = (field === 'DEAL_VALUE' || typeof dealValue === 'number') && operator !== 'EQUALS' && operator !== 'NOT_EQUALS';
    const conditionValue = isNumeric ? Number(value) : value;
    const effectiveDealValue = (isNumeric && typeof dealValue !== 'number') ? parseFloat(dealValue) : dealValue;

    switch (operator) {
        case 'EQUALS': return effectiveDealValue == conditionValue; 
        case 'NOT_EQUALS': return effectiveDealValue != conditionValue;
        case 'GREATER_THAN': return effectiveDealValue > conditionValue;
        case 'LESS_THAN': return effectiveDealValue < conditionValue;
        default: return false;
    }
};

const processAutomationSteps = async (steps, context, companyId, automationId) => {
    const db = await openDb();
    for (const [index, step] of steps.entries()) {
        if (step.type === 'ACTION') {
            const { actionType, actionConfig } = step;
            console.log(`%cEXECUTING ACTION: ${actionType}`, 'color: #38bdf8; font-weight: bold;');

            switch(actionType) {
                 case 'CREATE_DEAL': {
                    const { pipelineId, stageId, dealName, dealValue } = actionConfig;
                    if (!pipelineId || !stageId || !dealName || dealValue === undefined) continue;
                    
                    const resolvedName = await resolvePlaceholders(dealName, context, companyId);
                    const resolvedValue = typeof dealValue === 'string' && /\{\{deal\.value\}\}/gi.test(dealValue)
                        ? context.deal?.value || 0
                        : Number(dealValue) || 0;

                    const contactId = context.deal ? context.deal.contactId : null;
                    if (!contactId) continue;

                    const newDealId = generateId();
                    await db.run('INSERT INTO deals (id, name, value, contactId, stageId, status, customFields, notes, history, observation, companyId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        newDealId, resolvedName, resolvedValue, contactId, stageId, 'OPEN', '{}', '[]', JSON.stringify([createHistoryEntry('Deal Created via Automation')]), `Created by automation`, companyId, new Date().toISOString(), new Date().toISOString()
                    );
                    break;
                }
                case 'ADD_NOTE': {
                    if (!actionConfig.noteContent || !context.deal) continue;
                    const deal = await db.get('SELECT notes, history FROM deals WHERE id = ?', context.deal.id);
                    if (!deal) continue;

                    const resolvedContent = await resolvePlaceholders(actionConfig.noteContent, context, companyId);
                    const notes = JSON.parse(deal.notes || '[]');
                    notes.push({ id: generateId(), content: resolvedContent, createdAt: new Date().toISOString() });
                    const history = JSON.parse(deal.history || '[]');
                    history.unshift(createHistoryEntry('Note Added via Automation', { content: resolvedContent }));

                    await db.run('UPDATE deals SET notes = ?, history = ? WHERE id = ?', JSON.stringify(notes), JSON.stringify(history), context.deal.id);
                    break;
                }
                case 'UPDATE_DEAL_STATUS': {
                    if (!actionConfig.status || !context.deal) continue;
                    const deal = await db.get('SELECT status, history FROM deals WHERE id = ?', context.deal.id);
                    if (!deal) continue;

                    const history = JSON.parse(deal.history || '[]');
                    history.unshift(createHistoryEntry('Status Updated via Automation', { from: deal.status, to: actionConfig.status }));
                    await db.run('UPDATE deals SET status = ?, history = ? WHERE id = ?', actionConfig.status, JSON.stringify(history), context.deal.id);
                    break;
                }
                case 'MOVE_DEAL_TO_STAGE': {
                    if (!actionConfig.stageId || !context.deal) continue;
                    const deal = await db.get('SELECT stageId, history FROM deals WHERE id = ?', context.deal.id);
                    if (!deal) continue;
                    
                    const oldStage = await db.get('SELECT name FROM stages WHERE id = ?', deal.stageId);
                    const newStage = await db.get('SELECT name FROM stages WHERE id = ?', actionConfig.stageId);

                    const history = JSON.parse(deal.history || '[]');
                    history.unshift(createHistoryEntry('Stage Changed via Automation', { from: oldStage?.name || 'N/A', to: newStage?.name || 'N/A' }));
                    await db.run('UPDATE deals SET stageId = ?, history = ? WHERE id = ?', actionConfig.stageId, JSON.stringify(history), context.deal.id);
                    break;
                }
                case 'WAIT': {
                    const { waitMode, waitDuration, waitUnit, waitCondition, waitDays } = actionConfig;
                    const remainingSteps = steps.slice(index + 1);
                    if (!context.deal || remainingSteps.length === 0) continue;

                    let newJobData;
                    if (waitMode === 'CONDITION') {
                        if (!waitCondition) continue;
                        newJobData = { condition: JSON.stringify(waitCondition) };
                        console.log(`Automation for deal ${context.deal.id} paused until condition is met.`);
                    } else { // DURATION
                        const duration = waitDuration || waitDays || 0;
                        if (duration <= 0) continue;
                        const executeAt = new Date();
                        const unit = waitUnit || 'DAYS';
                        if (unit === 'MINUTES') executeAt.setMinutes(executeAt.getMinutes() + duration);
                        else if (unit === 'HOURS') executeAt.setHours(executeAt.getHours() + duration);
                        else executeAt.setDate(executeAt.getDate() + duration);
                        newJobData = { executeAt: executeAt.toISOString() };
                        console.log(`Automation paused for ${duration} ${unit}. Resuming at ${newJobData.executeAt}`);
                    }
                    
                    await db.run('INSERT INTO scheduledJobs (id, companyId, dealId, automationId, remainingSteps, executeAt, condition) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        generateId(), companyId, context.deal.id, automationId, JSON.stringify(remainingSteps), newJobData.executeAt, newJobData.condition
                    );
                    return; // Stop processing this automation's steps for now
                }
                case 'SEND_WEBHOOK': {
                    if (!actionConfig.webhookUrl) continue;
                    const resolvedUrl = await resolvePlaceholders(actionConfig.webhookUrl, context, companyId);
                    console.log(`%cWEBHOOK (from Automation): POST to ${resolvedUrl}`, 'color: #ea580c; font-weight: bold;');
                    fetch(resolvedUrl, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ triggerEvent: context.event, context: context.deal || context.task }) }).catch(e => console.error(`Automation webhook failed:`, e.message));
                    break;
                }
                case 'SEND_WHATSAPP': {
                    const company = await db.get('SELECT evolutionInstanceName, evolutionApiKey, evolutionApiUrl FROM companies WHERE id = ?', companyId);
                    if (!actionConfig.whatsappNumber || !actionConfig.whatsappText || !company || !company.evolutionInstanceName || !company.evolutionApiUrl || !company.evolutionApiKey) {
                        console.error("WhatsApp automation failed: Missing number, text, or full Evolution API configuration.");
                        continue;
                    }
                    
                    const resolvedNumber = (await resolvePlaceholders(actionConfig.whatsappNumber, context, companyId)).replace(/\D/g, '');
                    const resolvedText = await resolvePlaceholders(actionConfig.whatsappText, context, companyId);
                    const evolutionUrl = normalizeEvolutionUrl(company.evolutionApiUrl);

                    console.log(`%cWHATSAPP (from Automation): Sending to ${resolvedNumber}`, 'color: #22c55e; font-weight: bold;');
                    try {
                        await fetch(`${evolutionUrl}/message/sendText/${company.evolutionInstanceName}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'apikey': company.evolutionApiKey },
                            body: JSON.stringify({ number: resolvedNumber, text: resolvedText }),
                        });
                    } catch (e) { console.error(`Automation WhatsApp message failed:`, e.message); }
                    break;
                }
                case 'SEND_EMAIL': {
                    if (!actionConfig.templateId || !context.deal) continue;
                    const template = await db.get('SELECT * FROM emailTemplates WHERE companyId = ? AND id = ?', companyId, actionConfig.templateId);
                    if (!template) {
                        console.error(`Automation: Email template ID ${actionConfig.templateId} not found.`);
                        continue;
                    }
                    const contact = await db.get('SELECT * FROM contacts WHERE companyId = ? AND id = ?', companyId, context.deal.contactId);
                    if (!contact || !contact.email) {
                        console.error(`Automation: No contact or email for deal ${context.deal.id}`);
                        continue;
                    }

                    const transporter = await getTransporterForCompany(companyId);
                    if (!transporter) {
                        console.error(`Automation email failed: No valid SMTP configuration for company ${companyId}.`);
                        continue;
                    }
                    
                    const senderEmail = transporter.options.auth.user;
                    if (!senderEmail) {
                         console.error(`Automation email failed: SMTP user not configured for company ${companyId}.`);
                         continue;
                    }

                    const resolvedSubject = await resolvePlaceholders(template.subject, context, companyId);
                    const resolvedBody = await resolvePlaceholders(template.body, context, companyId);
                    
                    const mailOptions = { from: `"${senderEmail.split('@')[0]}" <${senderEmail}>`, to: contact.email, subject: resolvedSubject, html: resolvedBody };
                    
                    console.log(`%cEMAIL (from Automation): Sending template "${template.name}" to ${contact.email}`, 'color: #9333ea; font-weight: bold;');
                    try {
                        await transporter.sendMail(mailOptions);
                        const deal = await db.get('SELECT history FROM deals WHERE id = ?', context.deal.id);
                        const history = JSON.parse(deal.history || '[]');
                        history.unshift(createHistoryEntry('Email Sent via Automation', { to: contact.email, subject: resolvedSubject }));
                        await db.run('UPDATE deals SET history = ? WHERE id = ?', JSON.stringify(history), context.deal.id);
                    } catch(e) { console.error(`Automation email failed to send:`, e.message); }
                    break;
                }
                case 'CREATE_TASK': {
                     if (!actionConfig.taskTitle || !context.deal) continue;
                     const resolvedTitle = await resolvePlaceholders(actionConfig.taskTitle, context, companyId);
                     const dueDate = parseDateOffset(actionConfig.taskDueDateOffsetDays);
                     await db.run('INSERT INTO tasks (id, title, isCompleted, createdAt, companyId, dueDate, dealId, contactId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        generateId(), resolvedTitle, 0, new Date().toISOString(), companyId, dueDate, context.deal.id, context.deal.contactId
                     );
                     break;
                }
                case 'CREATE_CALENDAR_NOTE': {
                    if (!actionConfig.noteTitle || !actionConfig.noteDateOffsetDays) continue;
                    const resolvedTitle = await resolvePlaceholders(actionConfig.noteTitle, context, companyId);
                    const resolvedContent = await resolvePlaceholders(actionConfig.calendarNoteContent || '', context, companyId);
                    const date = parseDateOffset(actionConfig.noteDateOffsetDays);
                    if (date) {
                        await db.run('INSERT INTO calendarNotes (id, title, content, date, createdAt, companyId) VALUES (?, ?, ?, ?, ?, ?)',
                            generateId(), resolvedTitle, resolvedContent, date, new Date().toISOString(), companyId
                        );
                    }
                    break;
                }
            }
        } else if (step.type === 'CONDITION') {
            const conditionResult = await evaluateCondition(step.condition, context, companyId);
            console.log(`%cEVALUATING CONDITION: ${step.condition.field} ${step.condition.operator} ${step.condition.value} -> ${conditionResult}`, 'color: #f59e0b; font-weight: bold;');
            const branchToProcess = conditionResult ? step.onTrue : step.onFalse;
            await processAutomationSteps(branchToProcess, context, companyId);
        }
    }
};

const triggerAutomations = async (event, companyId, dealId = null, taskId = null) => {
    const db = await openDb();
    
    let automationsForCompany = await db.all('SELECT * FROM automations WHERE companyId = ?', companyId);
    automationsForCompany = automationsForCompany.map(a => jsonParseFields(a, ['triggerConfig', 'steps']));

    let matchingAutomations = [];
    if (event.type === 'DEAL_STAGE_CHANGED') matchingAutomations = automationsForCompany.filter(a => a.triggerType === 'DEAL_STAGE_CHANGED' && a.triggerConfig.stageId === event.newStageId);
    else if (event.type === 'DEAL_STATUS_UPDATED') matchingAutomations = automationsForCompany.filter(a => a.triggerType === 'DEAL_STATUS_UPDATED' && a.triggerConfig.status === event.newStatus);
    else if (event.type === 'DEAL_CREATED') matchingAutomations = automationsForCompany.filter(a => a.triggerType === 'DEAL_CREATED');
    else if (event.type === 'DEAL_ENTERED_PIPELINE') matchingAutomations = automationsForCompany.filter(a => a.triggerType === 'DEAL_ENTERED_PIPELINE' && a.triggerConfig.pipelineId === event.pipelineId);
    else if (event.type === 'NOTE_ADDED_TO_DEAL') matchingAutomations = automationsForCompany.filter(a => a.triggerType === 'NOTE_ADDED_TO_DEAL');
    else if (event.type === 'TASK_CREATED' || event.type === 'TASK_COMPLETED') matchingAutomations = automationsForCompany.filter(a => a.triggerType === event.type);

    const deal = dealId ? await db.get('SELECT * FROM deals WHERE id = ?', dealId) : null;
    const task = taskId ? await db.get('SELECT * FROM tasks WHERE id = ?', taskId) : null;

    for (const auto of matchingAutomations) {
        console.log(`--- Triggering automation: ${auto.name} ---`);
        const context = { event: event.type, deal, task };
        await processAutomationSteps(auto.steps, context, companyId, auto.id);
    }
};

const resumeConditionalAutomations = async (dealId, companyId) => {
    const db = await openDb();
    const updatedDeal = await db.get('SELECT * FROM deals WHERE id = ? AND companyId = ?', dealId, companyId);
    if (!updatedDeal) return;

    const conditionalJobsForDeal = (await db.all('SELECT * FROM scheduledJobs WHERE companyId = ? AND dealId = ? AND condition IS NOT NULL', companyId, dealId))
        .map(job => jsonParseFields(job, ['condition', 'remainingSteps']));

    if (conditionalJobsForDeal.length === 0) return; 
    
    console.log(`Found ${conditionalJobsForDeal.length} conditional automations for deal ${updatedDeal.name}`);
    
    for (const job of conditionalJobsForDeal) {
        const context = { event: 'AUTOMATION_RESUMED_CONDITIONALLY', deal: updatedDeal };
        if (await evaluateCondition(job.condition, context, companyId)) {
            console.log(`Condition met for deal ${updatedDeal.name}. Resuming automation.`);
            await db.run('DELETE FROM scheduledJobs WHERE id = ?', job.id);
            await processAutomationSteps(job.remainingSteps, context, companyId, job.automationId);
        }
    }
};


// --- API Endpoints ---
const apiRouter = express.Router();
console.log('API Router initialized.');

// Middleware to enforce company ID
const companyScoped = (req, res, next) => {
    console.log(`CompanyScoped middleware hit for path: ${req.path}`);
    console.log('Request Headers:', req.headers);
    const companyId = req.headers['x-company-id'];
  if (!companyId) {
    console.log('CompanyScoped middleware hit for path:', req.path, ' - No X-Company-ID header');
    return res.status(400).json({ error: 'X-Company-ID header is required' });
  }
    req.companyId = companyId;
    next();
};

// --- GET ALL DATA ---
apiRouter.get('/data', companyScoped, async (req, res) => {
  const { companyId } = req;
  const db = await openDb();

  const company = await db.get('SELECT * FROM companies WHERE id = ?', companyId);
  if (!company) return res.status(404).json({ message: 'Company not found' });
  
  const companyUsers = await db.all('SELECT username, companyId FROM users WHERE companyId = ?', companyId);
  
  const companyData = {
      pipelines: await db.all('SELECT * FROM pipelines WHERE companyId = ?', companyId),
      stages: await db.all('SELECT * FROM stages WHERE companyId = ?', companyId),
      deals: (await db.all('SELECT * FROM deals WHERE companyId = ?', companyId)).map(d => jsonParseFields(d, ['customFields', 'notes', 'history'])),
      contacts: (await db.all('SELECT * FROM contacts WHERE companyId = ?', companyId)).map(c => jsonParseFields(c, ['phones', 'notes', 'history', 'customFields', 'attachments'])),
      customFieldDefinitions: await db.all('SELECT * FROM customFieldDefinitions WHERE companyId = ?', companyId),
      contactCustomFieldDefinitions: await db.all('SELECT * FROM contactCustomFieldDefinitions WHERE companyId = ?', companyId),
      automations: (await db.all('SELECT * FROM automations WHERE companyId = ?', companyId)).map(a => jsonParseFields(a, ['triggerConfig', 'steps'])),
      tasks: await db.all('SELECT * FROM tasks WHERE companyId = ?', companyId),
      calendarNotes: await db.all('SELECT * FROM calendarNotes WHERE companyId = ?', companyId),
      emailTemplates: await db.all('SELECT * FROM emailTemplates WHERE companyId = ?', companyId),
      users: companyUsers,
      webhookUrl: company.webhookUrl || '',
      apiKey: company.apiKey || '',
      smtpConfig: JSON.parse(company.smtpConfig || '{}'),
      dashboardConfig: JSON.parse(company.dashboardConfig || '[]'),
      evolutionInstanceName: company.evolutionInstanceName || null,
      evolutionApiKey: company.evolutionApiKey || null,
      evolutionApiUrl: company.evolutionApiUrl || null,
      scheduledJobs: (await db.all('SELECT * FROM scheduledJobs WHERE companyId = ?', companyId)).map(job => jsonParseFields(job, ['condition', 'remainingSteps'])),
  };
  res.json(companyData);
});

// --- AUTH ---
apiRouter.post('/register', async (req, res) => {
    const { username, password, companyName } = req.body;
    if (!username || !password || !companyName) return res.status(400).json({ message: 'Username, password, and company name are required.' });
    
    const db = await openDb();
    const existingUser = await db.get('SELECT 1 FROM users WHERE lower(username) = lower(?)', username);
    const pendingUser = await db.get('SELECT 1 FROM pendingUsers WHERE lower(username) = lower(?)', username);
    if (existingUser || pendingUser) return res.status(409).json({ message: 'Username already exists.' });
    const existingCompany = await db.get('SELECT 1 FROM companies WHERE lower(name) = lower(?)', companyName);
    if (existingCompany) return res.status(409).json({ message: 'A company with this name already exists.' });

    const transporter = await getSystemTransporter();
    if (!transporter) return res.status(500).json({ message: "Email service is not configured on the server." });

    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpiry = Date.now() + 3600000; // 1 hour

    await db.run('INSERT INTO pendingUsers (username, password, companyName, confirmationCode, tokenExpiry) VALUES (?, ?, ?, ?, ?)', username, password, companyName, confirmationCode, tokenExpiry);

    try {
        await transporter.sendMail({
            from: `"DigiYou CRM" <${transporter.options.auth.user}>`, to: username, subject: 'Your DigiYou CRM Verification Code',
            html: `<p>Welcome! Your verification code is:</p><h2 style="font-size: 24px; letter-spacing: 2px;">${confirmationCode}</h2><p>This code will expire in 1 hour.</p>`
        });
        res.status(200).json({ message: 'Registration successful. Please check your email for a verification code.' });
    } catch (error) {
        console.error("Failed to send verification email:", error);
        await db.run('DELETE FROM pendingUsers WHERE username = ?', username);
        res.status(500).json({ message: 'Failed to send verification email. Please try again later.' });
    }
});

apiRouter.post('/verify-code', async (req, res) => {
    const { username, code } = req.body;
    if (!username || !code) return res.status(400).json({ message: 'Username and verification code are required.' });
    
    const db = await openDb();
    const pendingUser = await db.get('SELECT * FROM pendingUsers WHERE lower(username) = lower(?)', username);
    if (!pendingUser) return res.status(400).json({ message: 'No pending registration found for this user.' });

    if (pendingUser.tokenExpiry < Date.now()) {
        await db.run('DELETE FROM pendingUsers WHERE username = ?', pendingUser.username);
        return res.status(400).json({ message: 'Expired verification code. Please register again.' });
    }
    if (pendingUser.confirmationCode !== code) return res.status(400).json({ message: 'Invalid verification code.' });
    
    await db.run('DELETE FROM pendingUsers WHERE username = ?', pendingUser.username);
    
    const newCompanyId = generateId();
    const defaultSmtpConfig = process.env.SMTP_HOST ? JSON.stringify({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }) : '{}';

    await db.run('INSERT INTO companies (id, name, apiKey, dashboardConfig, smtpConfig) VALUES (?, ?, ?, ?, ?)',
        newCompanyId, pendingUser.companyName, `api_key_${generateId()}`, JSON.stringify(defaultDashboardConfig), defaultSmtpConfig);
    await db.run('INSERT INTO users (username, password, companyId) VALUES (?, ?, ?)', pendingUser.username, pendingUser.password, newCompanyId);

    res.status(200).json({ message: 'Account verified successfully. You can now log in.' });
});

apiRouter.post('/forgot-password', async (req, res) => {
    const { username } = req.body;
    const db = await openDb();
    const user = await db.get('SELECT * FROM users WHERE lower(username) = lower(?)', username);

    if (user) {
        const transporter = await getSystemTransporter();
        if (!transporter) return res.status(500).json({ message: "Email service is not configured." });
        
        const resetToken = generateId();
        const resetTokenExpiry = Date.now() + 3600000;
        await db.run('UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE username = ?', resetToken, resetTokenExpiry, user.username);

        try {
            const resetUrl = `${req.get('origin') || `http://${req.get('host')}`}/reset-password/${resetToken}`;
            await transporter.sendMail({
                from: `"DigiYou CRM" <${transporter.options.auth.user}>`, to: username, subject: 'Password Reset Request for DigiYou CRM',
                html: `<p>Click this link to set a new password: <a href="${resetUrl}">${resetUrl}</a></p><p>This link is valid for 1 hour.</p>`
            });
        } catch (error) { console.error("Failed to send password reset email:", error); }
    }
    res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
});

apiRouter.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    if (!password || password.length < 4) return res.status(400).json({ message: 'Password must be at least 4 characters long.' });
    
    const db = await openDb();
    const user = await db.get('SELECT * FROM users WHERE resetToken = ?', token);

    if (!user) return res.status(400).json({ message: 'Invalid password reset token.' });
    if (user.resetTokenExpiry < Date.now()) return res.status(400).json({ message: 'Expired password reset token.' });

    await db.run('UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE username = ?', password, user.username);
    res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });
});

apiRouter.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`[LOGIN] Attempting login for username: ${username}, password: ${password}`);
    const db = await openDb();
    const user = await db.get('SELECT * FROM users WHERE lower(username) = lower(?) AND password = ?', username, password);
    console.log(`[LOGIN] Query result for ${username}:`, user ? 'User found' : 'User not found');
    if (user) {
        req.session.user = { username: user.username, companyId: user.companyId };
        res.json(req.session.user);
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

apiRouter.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out, please try again' });
        }
        res.status(200).json({ message: 'Logged out successfully' });
    });
});

apiRouter.get('/check-session', (req, res) => {
    if (req.session && req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json(null);
    }
});


// --- ENTITY CRUD (now company scoped) ---
const createCrudEndpoints = (entityName, pluralEntityName, jsonFields = []) => {
    const tableName = pluralEntityName;
    // GET ALL
    apiRouter.get(`/${pluralEntityName}`, companyScoped, async (req, res) => {
        const db = await openDb();
        let items = await db.all(`SELECT * FROM ${tableName} WHERE companyId = ?`, req.companyId);
        if (jsonFields.length > 0) items = items.map(item => jsonParseFields(item, jsonFields));
        res.json(items);
    });
    // GET ONE
    apiRouter.get(`/${pluralEntityName}/:id`, companyScoped, async (req, res) => {
        const db = await openDb();
        let item = await db.get(`SELECT * FROM ${tableName} WHERE id = ? AND companyId = ?`, req.params.id, req.companyId);
        if (item) {
            if (jsonFields.length > 0) item = jsonParseFields(item, jsonFields);
            res.json(item);
        } else {
            res.status(404).json({ message: `${entityName} not found` });
        }
    });
    // CREATE
    apiRouter.post(`/${pluralEntityName}`, companyScoped, async (req, res) => {
        const db = await openDb();
        const { companyId } = req;
        const newItem = { ...req.body, id: generateId(), companyId };
        
        // Entity specific logic
        if (entityName === 'Deal') {
            newItem.history = [createHistoryEntry('Deal Created')];
            newItem.createdAt = new Date().toISOString();
            newItem.updatedAt = new Date().toISOString();
            const { id, name, value, contactId, stageId, status, customFields, notes, history, observation, data_vencimento, createdAt, updatedAt } = newItem;
            await db.run('INSERT INTO deals (id, name, value, contactId, stageId, status, customFields, notes, history, observation, data_vencimento, createdAt, updatedAt, companyId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                id, name, value, contactId, stageId, status, JSON.stringify(customFields), JSON.stringify(notes), JSON.stringify(history), observation, data_vencimento, createdAt, updatedAt, companyId);
            
            const contact = await db.get('SELECT history FROM contacts WHERE id = ?', contactId);
            if (contact) {
                const contactHistory = JSON.parse(contact.history || '[]');
                contactHistory.unshift(createHistoryEntry('Deal Created for Contact', { dealId: id, dealName: name }));
                await db.run('UPDATE contacts SET history = ? WHERE id = ?', JSON.stringify(contactHistory), contactId);
            }
            const stage = await db.get('SELECT pipelineId FROM stages WHERE id = ?', stageId);
            if (stage) {
                await triggerAutomations({ type: 'DEAL_CREATED' }, companyId, id);
                await triggerAutomations({ type: 'DEAL_ENTERED_PIPELINE', pipelineId: stage.pipelineId }, companyId, id);
            }
        } else if (entityName === 'Contact') {
            const existing = await db.get('SELECT 1 FROM contacts WHERE companyId = ? AND lower(email) = lower(?)', companyId, newItem.email);
            if (existing) return res.status(409).json({ message: 'A contact with this email already exists.' });
            
            newItem.id = newItem.email; // Use email as ID
            newItem.history = [createHistoryEntry('Contact Created')];
            await db.run('INSERT INTO contacts (id, name, email, phones, classification, observation, notes, history, customFields, attachments, companyId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                newItem.id, newItem.name, newItem.email, JSON.stringify(newItem.phones || []), newItem.classification, newItem.observation, JSON.stringify(newItem.notes || []), JSON.stringify(newItem.history), JSON.stringify(newItem.customFields || {}), JSON.stringify(newItem.attachments || []), companyId);
        } else if (entityName === 'Stage') {
            const { count } = await db.get('SELECT COUNT(*) as count FROM stages WHERE companyId = ? AND pipelineId = ?', companyId, newItem.pipelineId);
            newItem.order = count;
            await db.run('INSERT INTO stages (id, name, pipelineId, "order", companyId) VALUES (?, ?, ?, ?, ?)', newItem.id, newItem.name, newItem.pipelineId, newItem.order, companyId);
        } else if (entityName === 'Task') {
            newItem.isCompleted = 0;
            newItem.createdAt = new Date().toISOString();
            await db.run('INSERT INTO tasks (id, title, isCompleted, createdAt, dueDate, contactId, dealId, companyId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                newItem.id, newItem.title, newItem.isCompleted, newItem.createdAt, newItem.dueDate, newItem.contactId, newItem.dealId, companyId);
            await triggerAutomations({ type: 'TASK_CREATED' }, companyId, null, newItem.id);
        } else if (entityName === 'Automation') {
            await db.run('INSERT INTO automations (id, name, triggerType, triggerConfig, steps, companyId) VALUES (?, ?, ?, ?, ?, ?)',
                newItem.id, newItem.name, newItem.triggerType, JSON.stringify(newItem.triggerConfig), JSON.stringify(newItem.steps), companyId);
        } else if (entityName === 'EmailTemplate') {
            newItem.createdAt = new Date().toISOString();
            newItem.updatedAt = new Date().toISOString();
            await db.run('INSERT INTO emailTemplates (id, name, subject, body, createdAt, updatedAt, companyId) VALUES (?, ?, ?, ?, ?, ?, ?)',
                newItem.id, newItem.name, newItem.subject, newItem.body, newItem.createdAt, newItem.updatedAt, companyId);
        } else if (entityName === 'CalendarNote') {
            newItem.createdAt = new Date().toISOString();
            await db.run('INSERT INTO calendarNotes (id, title, content, date, createdAt, companyId) VALUES (?, ?, ?, ?, ?, ?)',
                newItem.id, newItem.title, newItem.content, newItem.date, newItem.createdAt, companyId);
        } else if (entityName === 'Pipeline' || entityName === 'CustomFieldDefinition' || entityName === 'ContactCustomFieldDefinition') {
            await db.run(`INSERT INTO ${tableName} (id, name, companyId) VALUES (?, ?, ?)`, newItem.id, newItem.name, companyId);
        }
        
        res.status(201).json(newItem);
    });

    // IMPORT DEALS
    apiRouter.post('/import/deals', companyScoped, async (req, res) => {
        const db = await openDb();
        const { companyId } = req;
        const { deals, newDealFields, newContactFields, defaultPipelineId, defaultStageId } = req.body;

            console.log('Incoming deal import data:', JSON.stringify(deals, null, 2));

        let successCount = 0;
        const errors = [];

        try {
            // 1. Create new custom fields if they don't exist
            for (const fieldName of newDealFields) {
                const existing = await db.get('SELECT 1 FROM customFieldDefinitions WHERE companyId = ? AND name = ?', companyId, fieldName);
                if (!existing) {
                    await db.run('INSERT INTO customFieldDefinitions (id, name, companyId) VALUES (?, ?, ?)', generateId(), fieldName, companyId);
                }
            }
            for (const fieldName of newContactFields) {
                const existing = await db.get('SELECT 1 FROM contactCustomFieldDefinitions WHERE companyId = ? AND name = ?', companyId, fieldName);
                if (!existing) {
                    await db.run('INSERT INTO contactCustomFieldDefinitions (id, name, companyId) VALUES (?, ?, ?)', generateId(), fieldName, companyId);
                }
            }

            // Fetch all pipelines and stages for the company
            const pipelines = await db.all('SELECT id, name FROM pipelines WHERE companyId = ?', companyId);
            const stages = await db.all('SELECT id, name, pipelineId FROM stages WHERE companyId = ?', companyId);

            for (const dealData of deals) {
                try {
                    // More robust contact email and name extraction
                    let contactEmail = dealData.contactEmail?.value || dealData.contactEmail || dealData.email?.value || dealData.email;
                    let contactName = dealData.contactName?.value || dealData.contactName || dealData.name?.value || dealData.name;

                    // Ensure contactEmail is a string and trim it
                    if (typeof contactEmail === 'string') {
                        contactEmail = contactEmail.trim();
                    } else {
                        contactEmail = undefined; // Ensure it's undefined if not a string
                    }

                    // Ensure contactName is a string and trim it
                    if (typeof contactName === 'string') {
                        contactName = contactName.trim();
                    } else {
                        contactName = undefined; // Ensure it's undefined if not a string
                    }

                    let contactId = contactEmail; // Default to email as ID

                    // 2. Handle Contact
                    if (contactEmail) {
                        let contact = await db.get('SELECT * FROM contacts WHERE companyId = ? AND lower(email) = lower(?)', companyId, contactEmail);
                        if (!contact) {
                            // Create new contact
                            contactId = contactEmail; // Use email as ID
                            const newContact = {
                                id: contactId,
                                name: contactName || contactEmail,
                                email: contactEmail,
                                phones: JSON.stringify([]),
                                classification: '',
                                observation: '',
                                notes: JSON.stringify([]),
                                history: JSON.stringify([createHistoryEntry('Contact Created via Import')]),
                                customFields: JSON.stringify({}),
                                attachments: JSON.stringify([]),
                                companyId: companyId
                            };
                            await db.run('INSERT INTO contacts (id, name, email, phones, classification, observation, notes, history, customFields, attachments, companyId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                                newContact.id, newContact.name, newContact.email, newContact.phones, newContact.classification, newContact.observation, newContact.notes, newContact.history, newContact.customFields, newContact.attachments, newContact.companyId);
                        } else {
                            // Update existing contact if name is provided and different
                            contactId = contact.id;
                            if (contactName && contact.name !== contactName) { // Compare with existing contact's name
                                const contactHistory = JSON.parse(contact.history || '[]');
                                contactHistory.unshift(createHistoryEntry('Contact Name Updated via Import', { from: contact.name, to: contactName }));
                                await db.run('UPDATE contacts SET name = ?, history = ? WHERE id = ?', contactName, JSON.stringify(contactHistory), contactId);
                            }
                        }
                    } else {
                        errors.push(`Deal "${dealData.dealName?.value || dealData.name?.value || 'Unnamed Deal'}" skipped: Contact Email is required.`);
                        continue; // Skip deal if no contact email
                    }

                    // 3. Handle Deal
                    let pipelineId = defaultPipelineId;
                    let stageId = defaultStageId;

                    if (dealData.pipelineName?.value || dealData.pipelineName) {
                        const pipelineName = dealData.pipelineName?.value || dealData.pipelineName;
                        const pipeline = pipelines.find(p => p.name.toLowerCase() === pipelineName.toLowerCase());
                        if (pipeline) {
                            pipelineId = pipeline.id;
                            if (dealData.stageName?.value || dealData.stageName) {
                                const stageName = dealData.stageName?.value || dealData.stageName;
                                const stage = stages.find(s => s.pipelineId === pipelineId && s.name.toLowerCase() === stageName.toLowerCase());
                                if (stage) {
                                    stageId = stage.id;
                                } else {
                                    errors.push(`Deal "${dealData.dealName?.value || dealData.name?.value || 'Unnamed Deal'}" error: Stage "${stageName}" not found in pipeline "${pipelineName}". Using default stage.`);
                                }
                            }
                        } else {
                            errors.push(`Deal "${dealData.dealName?.value || dealData.name?.value || 'Unnamed Deal'}" error: Pipeline "${pipelineName}" not found. Using default pipeline/stage.`);
                        }
                    }

                    if (!pipelineId || !stageId) {
                        errors.push(`Deal "${dealData.dealName?.value || dealData.name?.value || 'Unnamed Deal'}" error: Default pipeline or stage not set or found.`);
                        continue;
                    }

                    const newDeal = {
                        id: generateId(),
                        name: applyFormatting(
                            dealData.dealName?.value || dealData.dealName || dealData.name?.value || dealData.name,
                            dealData.dealName?.format || dealData.name?.format || 'none'
                        ) || 'Unnamed Deal',
                        value: applyFormatting(
                            dealData.dealValue?.value || dealData.dealValue || dealData.value?.value || dealData.value,
                            dealData.dealValue?.format || dealData.value?.format || 'none'
                        ) || 0,
                        contactId: contactId,
                        stageId: stageId,
                        status: 'Open', // Default status
                        customFields: JSON.stringify(
                            Object.entries(dealData.customFields || {}).reduce((acc, [key, { value, format }]) => {
                                acc[key] = applyFormatting(value, format || 'none');
                                return acc;
                            }, {})
                        ),
                        notes: JSON.stringify([]),
                        history: JSON.stringify([createHistoryEntry('Deal Created via Import')]),
                        observation: '',
                        data_vencimento: applyFormatting(
                            dealData.data_vencimento?.value || dealData.data_vencimento || dealData.dataVencimento?.value || dealData.dataVencimento,
                            dealData.data_vencimento?.format || dealData.dataVencimento?.format || 'none'
                        ) || null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        companyId: companyId
                    };

                    await db.run('INSERT INTO deals (id, name, value, contactId, stageId, status, customFields, notes, history, observation, data_vencimento, createdAt, updatedAt, companyId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        newDeal.id, newDeal.name, newDeal.value, newDeal.contactId, newDeal.stageId, newDeal.status, newDeal.customFields, newDeal.notes, newDeal.history, newDeal.observation, newDeal.data_vencimento, newDeal.createdAt, newDeal.updatedAt, newDeal.companyId);

                    // Trigger automations for new deal
                    const stage = await db.get('SELECT pipelineId FROM stages WHERE id = ?', newDeal.stageId);
                    if (stage) {
                        await triggerAutomations({ type: 'DEAL_CREATED' }, companyId, newDeal.id);
                        await triggerAutomations({ type: 'DEAL_ENTERED_PIPELINE', pipelineId: stage.pipelineId }, companyId, newDeal.id);
                    }

                    successCount++;

                } catch (dealError) {
                    errors.push(`Error importing deal "${dealData.dealName?.value || dealData.name?.value || 'Unnamed Deal'}": ${dealError.message}`);
                }
            }

            res.status(200).json({ successCount, errorCount: errors.length, errors });

        } catch (mainError) {
            console.error('Error during bulk deal import:', mainError);
            res.status(500).json({ successCount, errorCount: errors.length + 1, errors: [...errors, mainError.message] });
        }
    });
    // UPDATE
    apiRouter.patch(`/${pluralEntityName}/:id`, companyScoped, async (req, res) => {
        const db = await openDb();
        const { id } = req.params;
        const { companyId } = req;
        const updates = req.body;

        let originalItem = await db.get(`SELECT * FROM ${tableName} WHERE id = ? AND companyId = ?`, id, companyId);
        if (!originalItem) return res.status(404).json({ message: `${entityName} not found` });

        if (jsonFields.length > 0) originalItem = jsonParseFields(originalItem, jsonFields);
        
        const updatedItem = { ...originalItem, ...updates };
        
        let shouldTriggerAutomation = false;
        let automationEvent = {};

        if (entityName === 'Deal') {
            updatedItem.updatedAt = new Date().toISOString();
            updatedItem.history = updatedItem.history || [];
            if (updates.stageId && originalItem.stageId !== updates.stageId) {
                const oldStage = await db.get('SELECT name FROM stages WHERE id = ?', originalItem.stageId);
                const newStage = await db.get('SELECT name FROM stages WHERE id = ?', updates.stageId);
                updatedItem.history.unshift(createHistoryEntry('Stage Changed', { from: oldStage?.name || 'N/A', to: newStage?.name || 'N/A' }));

                // Send webhook for stage change
                const companySettings = await db.get('SELECT webhookUrl FROM companies WHERE id = ?', companyId);
                const webhookUrl = companySettings?.webhookUrl;

                if (webhookUrl) {
                    let contact = null;
                    if (updatedItem.contactId) {
                        contact = await db.get('SELECT * FROM contacts WHERE id = ? AND companyId = ?', updatedItem.contactId, companyId);
                        if (contact && jsonFields.includes('customFields')) { // Assuming customFields might be a JSON field for contacts too
                            contact = jsonParseFields(contact, ['customFields']);
                        }
                    }

                    const webhookPayload = {
                        event: 'DEAL_STAGE_CHANGED',
                        deal: updatedItem,
                        contact: contact,
                        oldStage: oldStage?.name || 'N/A',
                        newStage: newStage?.name || 'N/A',
                        timestamp: new Date().toISOString()
                    };

                    fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(webhookPayload)
                    }).catch(e => console.error('Error sending webhook for deal stage change:', e.message));
                }

                automationEvent = { type: 'DEAL_STAGE_CHANGED', deal: updatedItem, oldStageId: originalItem.stageId, newStageId: updates.stageId };
                shouldTriggerAutomation = true;
            }
             if (updates.status && originalItem.status !== updates.status) {
                updatedItem.history.unshift(createHistoryEntry('Status Updated via Automation', { from: originalItem.status, to: updates.status }));
                automationEvent = { type: 'DEAL_STATUS_UPDATED', newStatus: updates.status };
                shouldTriggerAutomation = true;
            }
            if (updates.notes && JSON.stringify(originalItem.notes) !== JSON.stringify(updates.notes) && updates.notes.length > originalItem.notes.length) {
                updatedItem.history.unshift(createHistoryEntry('Notes Updated'));
                automationEvent = { type: 'NOTE_ADDED_TO_DEAL' };
                shouldTriggerAutomation = true;
            }
            const { name, value, contactId, stageId, status, customFields, notes, history, observation, data_vencimento, updatedAt } = updatedItem;
            await db.run('UPDATE deals SET name=?, value=?, contactId=?, stageId=?, status=?, customFields=?, notes=?, history=?, observation=?, data_vencimento=?, updatedAt=? WHERE id=?',
                name, value, contactId, stageId, status, JSON.stringify(customFields), JSON.stringify(notes), JSON.stringify(history), observation, data_vencimento, updatedAt, id);
        
            if (shouldTriggerAutomation) {
                await triggerAutomations(automationEvent, companyId, updatedItem.id, null);
            }
        
        } else if (entityName === 'Contact') {
            updatedItem.history = updatedItem.history || [];
            // Track changes and build history
            ['name', 'phones', 'classification', 'observation', 'customFields', 'attachments', 'notes'].forEach(key => {
                if (updates.hasOwnProperty(key) && JSON.stringify(originalItem[key]) !== JSON.stringify(updates[key])) {
                    updatedItem.history.unshift(createHistoryEntry(`${key.charAt(0).toUpperCase() + key.slice(1)} Updated`, { from: originalItem[key], to: updates[key] }));
                }
            });
            await db.run('UPDATE contacts SET name=?, phones=?, classification=?, observation=?, notes=?, history=?, customFields=?, attachments=? WHERE id=?',
                updatedItem.name, JSON.stringify(updatedItem.phones), updatedItem.classification, updatedItem.observation, JSON.stringify(updatedItem.notes), JSON.stringify(updatedItem.history), JSON.stringify(updatedItem.customFields), JSON.stringify(updatedItem.attachments), id);
        } else if (entityName === 'Task') {
            if (updates.isCompleted && !originalItem.isCompleted) {
                automationEvent = { type: 'TASK_COMPLETED' };
                shouldTriggerAutomation = true;
            }
            await db.run('UPDATE tasks SET title=?, isCompleted=?, dueDate=?, contactId=?, dealId=? WHERE id=?',
                updatedItem.title, updatedItem.isCompleted ? 1 : 0, updatedItem.dueDate, updatedItem.contactId, updatedItem.dealId, id);
        } else if (entityName === 'Automation') {
            await db.run('UPDATE automations SET name=?, triggerType=?, triggerConfig=?, steps=? WHERE id=?',
                updatedItem.name, updatedItem.triggerType, JSON.stringify(updatedItem.triggerConfig), JSON.stringify(updatedItem.steps), id);
        }
        
        if (shouldTriggerAutomation) {
            if (entityName === 'Deal') {
                await resumeConditionalAutomations(id, companyId);
                await triggerAutomations(automationEvent, companyId, id);
            } else if (entityName === 'Task') {
                await triggerAutomations(automationEvent, companyId, null, id);
            }
        }
        
        // Return the final state after automations may have run
        let finalItem = await db.get(`SELECT * FROM ${tableName} WHERE id = ?`, id);
        if (jsonFields.length > 0) finalItem = jsonParseFields(finalItem, jsonFields);

        res.json(finalItem);
    });
    // DELETE
    apiRouter.delete(`/${pluralEntityName}/:id`, companyScoped, async (req, res) => {
        const db = await openDb();
        const { id } = req.params;
        const { companyId } = req;
        console.log(`[DELETE /${tableName}/:id] Attempting to delete ${entityName} with ID: ${id} for companyId: ${companyId}`);
        const item = await db.get(`SELECT * FROM ${tableName} WHERE id = ? AND companyId = ?`, id, companyId);
        console.log(`[DELETE /${tableName}/:id] Query result for ${entityName} with ID ${id}:`, item);
        if (!item) return res.status(404).json({ message: 'Not found or access denied' });

        const deleteResult = await db.run(`DELETE FROM ${tableName} WHERE id = ? AND companyId = ?`, id, companyId);
        console.log(`[DELETE /${tableName}/:id] Deleted ${deleteResult.changes} row(s) for ${entityName} with ID: ${id}`);
        
        // Cascade delete logic (SQLite foreign keys with ON DELETE CASCADE handle most of this now)
        if (entityName === 'CustomFieldDefinition') {
            const deals = await db.all('SELECT id, customFields FROM deals WHERE companyId = ?', companyId);
            for (const deal of deals) {
                const customFields = JSON.parse(deal.customFields || '{}');
                if (customFields[id]) {
                    delete customFields[id];
                    await db.run('UPDATE deals SET customFields = ? WHERE id = ?', JSON.stringify(customFields), deal.id);
                }
            }
        }
        
        res.status(204).send();
    });
};

createCrudEndpoints('Pipeline', 'pipelines');
createCrudEndpoints('Stage', 'stages');


createCrudEndpoints('Deal', 'deals', ['customFields', 'notes', 'history']);
createCrudEndpoints('Contact', 'contacts', ['phones', 'notes', 'history', 'customFields', 'attachments']);
createCrudEndpoints('CustomFieldDefinition', 'customFieldDefinitions');
createCrudEndpoints('ContactCustomFieldDefinition', 'contactCustomFieldDefinitions');
createCrudEndpoints('Automation', 'automations', ['triggerConfig', 'steps']);
createCrudEndpoints('EmailTemplate', 'emailTemplates');
createCrudEndpoints('Task', 'tasks');
createCrudEndpoints('CalendarNote', 'calendarNotes');



// --- Company Settings Endpoints ---
apiRouter.post('/smtp-settings', companyScoped, async (req, res) => {
    const db = await openDb();
    const { companyId } = req;
    const { host, port, secure, user, pass } = req.body;

    if (!host || !port || !user || !pass) return res.status(400).json({ message: 'All SMTP fields are required.' });

    const smtpConfig = JSON.stringify({ host, port: Number(port), secure: Boolean(secure), user, pass });
    await db.run('UPDATE companies SET smtpConfig = ? WHERE id = ?', smtpConfig, companyId);
    res.status(200).json({ message: 'SMTP settings updated successfully.' });
});

apiRouter.post('/evolution-settings', companyScoped, async (req, res) => {
    const db = await openDb();
    const { companyId } = req;
    const { apiKey, apiUrl } = req.body;

    if (!apiKey || !apiUrl) return res.status(400).json({ message: 'All Evolution API fields are required.' });

    const normalizedUrl = normalizeEvolutionUrl(apiUrl);
    await db.run('UPDATE companies SET evolutionApiKey = ?, evolutionApiUrl = ? WHERE id = ?',
        apiKey, normalizedUrl, companyId);
    res.status(200).json({ message: 'Evolution API settings updated successfully.' });
});

apiRouter.post('/evolution/instance', companyScoped, async (req, res) => {
    const { instanceName, qrcode = false } = req.body;
    const db = await openDb();
    const company = await db.get('SELECT evolutionApiUrl, evolutionApiKey FROM companies WHERE id = ?', req.companyId);
    if (!company || !company.evolutionApiUrl || !company.evolutionApiKey) return res.status(400).json({ message: 'WhatsApp Evolution API not configured.' });

    const evolutionUrl = normalizeEvolutionUrl(company.evolutionApiUrl);
    let externalApiResponse;

    try {
        externalApiResponse = await fetch(`${evolutionUrl}/instance/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': company.evolutionApiKey },
            body: JSON.stringify({
                instanceName: instanceName,
                qrcode: qrcode,
                integration: "WHATSAPP-BAILEYS"
            })
        });

        const data = await externalApiResponse.json();
        if (!externalApiResponse.ok) {
            return res.status(externalApiResponse.status).json(data);
        }

        await db.run('UPDATE companies SET evolutionInstanceName = ? WHERE id = ?', instanceName, req.companyId);

        res.status(201).json(data);
    } catch (error) {
        console.error("Error creating Evolution instance:", error);
        res.status(500).json({ message: "Failed to create instance." });
    }
});

apiRouter.delete('/evolution/instance', companyScoped, async (req, res) => {
    const { companyId } = req;
    const db = await openDb();
    const company = await db.get('SELECT evolutionInstanceName, evolutionApiUrl, evolutionApiKey FROM companies WHERE id = ?', companyId);

    if (!company || !company.evolutionInstanceName || !company.evolutionApiUrl || !company.evolutionApiKey) {
        return res.status(400).json({ message: "Instance or API credentials not configured for this company." });
    }

    try {
        const evolutionUrl = normalizeEvolutionUrl(company.evolutionApiUrl);
        const response = await fetch(`${evolutionUrl}/instance/delete/${company.evolutionInstanceName}`, {
            method: 'DELETE',
            headers: { 'apikey': company.evolutionApiKey }
        });

        if (!response.ok) {
            console.warn(`Evolution API returned ${response.status} on instance deletion, but proceeding with local cleanup.`);
        }
        
        await db.run('UPDATE companies SET evolutionInstanceName = NULL WHERE id = ?', companyId);

        res.status(200).json({ deleted: true });
    } catch (error) {
        console.error("Error deleting Evolution instance:", error);
        await db.run('UPDATE companies SET evolutionInstanceName = NULL WHERE id = ?', companyId);
        res.status(500).json({ message: "Failed to delete instance." });
    }
});

apiRouter.get('/evolution/connect', companyScoped, async (req, res) => {
    const { companyId } = req;
    const db = await openDb();
    const company = await db.get('SELECT evolutionInstanceName, evolutionApiUrl, evolutionApiKey FROM companies WHERE id = ?', companyId);
    if (!company || !company.evolutionInstanceName || !company.evolutionApiUrl || !company.evolutionApiKey) {
        return res.status(400).json({ message: "Instance or API credentials not configured for this company." });
    }

    try {
        const evolutionUrl = normalizeEvolutionUrl(company.evolutionApiUrl);
        const response = await fetch(`${evolutionUrl}/instance/connect/${company.evolutionInstanceName}`, {
            headers: { 'apikey': company.evolutionApiKey }
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ message: "Failed to connect to instance." });
    }
});

apiRouter.get('/evolution/status', companyScoped, async (req, res) => {
    const { companyId } = req;
    const db = await openDb();
    const company = await db.get('SELECT evolutionInstanceName, evolutionApiUrl, evolutionApiKey FROM companies WHERE id = ?', companyId);
    if (!company || !company.evolutionInstanceName || !company.evolutionApiUrl || !company.evolutionApiKey) {
        return res.status(400).json({ message: "Instance or API credentials not configured for this company." });
    }
    
    try {
        const evolutionUrl = normalizeEvolutionUrl(company.evolutionApiUrl);
        const response = await fetch(`${evolutionUrl}/instance/connectionState/${company.evolutionInstanceName}`, {
            headers: { 'apikey': company.evolutionApiKey }
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ message: "Failed to get instance status." });
    }
});

apiRouter.post('/webhook-settings', companyScoped, async (req, res) => {
    const db = await openDb();
    const { companyId } = req;
    const { webhookUrl } = req.body;

    await db.run('UPDATE companies SET webhookUrl = ? WHERE id = ?', webhookUrl, companyId);
    res.status(200).json({ message: 'Webhook URL updated successfully.' });
});

apiRouter.post('/dashboard-settings', companyScoped, async (req, res) => {
    const db = await openDb();
    const { companyId } = req;
    const { dashboardConfig } = req.body;

    if (!dashboardConfig) return res.status(400).json({ message: 'Dashboard configuration is required.' });

    await db.run('UPDATE companies SET dashboardConfig = ? WHERE id = ?', JSON.stringify(dashboardConfig), companyId);
    res.status(200).json({ message: 'Dashboard configuration updated successfully.' });
});

apiRouter.post('/send-test-email', companyScoped, async (req, res) => {
    const { companyId } = req;
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) return res.status(400).json({ message: 'Recipient, subject, and HTML body are required.' });

    const transporter = await getTransporterForCompany(companyId);
    if (!transporter) return res.status(500).json({ message: 'SMTP not configured for this company.' });

    try {
        const info = await transporter.sendMail({ from: transporter.options.auth.user, to, subject, html });
        res.status(200).json({ message: 'Test email sent successfully.', info });
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({ message: 'Failed to send test email.', error: error.message });
    }
});

apiRouter.post('/evolution/send-message', companyScoped, async (req, res) => {
    const db = await openDb();
    const { companyId } = req;
    const { number, text } = req.body;

    if (!number || !text) return res.status(400).json({ message: 'Number and text are required.' });

    const company = await db.get('SELECT evolutionInstanceName, evolutionApiKey, evolutionApiUrl FROM companies WHERE id = ?', companyId);
    if (!company || !company.evolutionInstanceName || !company.evolutionApiUrl || !company.evolutionApiKey) {
        return res.status(500).json({ message: 'Evolution API not configured for this company.' });
    }

    const evolutionUrl = normalizeEvolutionUrl(company.evolutionApiUrl);

    try {
        const response = await fetch(`${evolutionUrl}/message/sendText/${company.evolutionInstanceName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': company.evolutionApiKey },
            body: JSON.stringify({ number, text }),
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        res.status(500).json({ message: 'Failed to send WhatsApp message.', error: error.message });
    }
});

apiRouter.post('/evolution/webhook', async (req, res) => {
    console.log('Evolution Webhook Received:', req.body);
    // Here you would process the incoming webhook from Evolution API
    // e.g., update contact status, create a note, trigger automations
    res.status(200).json({ received: true });
});


// --- User Management Endpoints ---
apiRouter.post('/users', companyScoped, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || password.length < 4) return res.status(400).json({ message: 'Username and a password of at least 4 characters are required.' });
    
    const db = await openDb();
    const existing = await db.get('SELECT 1 FROM users WHERE lower(username) = lower(?)', username);
    if (existing) return res.status(409).json({ message: 'Username already exists.' });
    
    await db.run('INSERT INTO users (username, password, companyId) VALUES (?, ?, ?)', username, password, req.companyId);
    res.status(201).json({ username, companyId: req.companyId });
});

apiRouter.delete('/users/:username', companyScoped, async (req, res) => {
    const { username } = req.params;
    const db = await openDb();
    
    const userToDelete = await db.get('SELECT * FROM users WHERE lower(username) = lower(?) AND companyId = ?', username, req.companyId);
    if (!userToDelete) return res.status(404).json({ message: 'User not found or access denied.' });

    const { count } = await db.get('SELECT COUNT(*) as count FROM users WHERE companyId = ?', req.companyId);
    if (count <= 1) return res.status(400).json({ message: 'Cannot delete the last user of a company.' });

    await db.run('DELETE FROM users WHERE username = ?', userToDelete.username);
    res.status(204).send();
});


// --- Special Endpoints ---

// Bulk Delete Deals (must be before generic CRUD for deals)
apiRouter.delete('/deals/bulk', companyScoped, async (req, res) => {
    const db = await openDb();
    const { companyId } = req;
    const { ids } = req.body;

    console.log(`[DELETE /deals/bulk] Received request for companyId: ${companyId}, IDs:`, ids);
    console.log('[DELETE /deals/bulk] Request Body:', req.body);
    console.log('[DELETE /deals/bulk] Request Body:', req.body);
    console.log('[DELETE /deals/bulk] Request Body:', req.body);

    if (!Array.isArray(ids) || ids.length === 0) {
        console.log('[DELETE /deals/bulk] Invalid IDs array received.');
        return res.status(400).json({ message: 'Array of deal IDs is required.' });
    }

    try {
        const placeholders = ids.map(() => '?').join(',');
        const sql = `DELETE FROM deals WHERE id IN (${placeholders}) AND companyId = ?`;
        console.log(`[DELETE /deals/bulk] Executing SQL: ${sql} with params:`, [...ids, companyId]);
        const result = await db.run(sql, ...ids, companyId);
        console.log(`[DELETE /deals/bulk] Deleted ${result.changes} deal(s) for companyId: ${companyId}, IDs:`, ids);
        console.log('[DELETE /deals/bulk] SQL execution result:', result);
        
        if (result.changes === 0) {
            console.log('[DELETE /deals/bulk] No deals deleted. IDs might not exist or belong to company.');
        }

        res.status(204).send();
    } catch (error) {
        console.error('[DELETE /deals/bulk] Error during bulk delete:', error);
        res.status(500).json({ message: 'Failed to bulk delete deals.', error: error.message });
    }
});


apiRouter.get('/automations/:id/scheduledJobs', companyScoped, async (req, res) => {
    const db = await openDb();
    const { companyId } = req;
    const { id: automationId } = req.params;
    let jobs = await db.all('SELECT * FROM scheduledJobs WHERE companyId = ? AND automationId = ?', companyId, automationId);
    jobs = jobs.map(job => jsonParseFields(job, ['condition', 'remainingSteps']));
    res.json(jobs);
});

app.use('/api', apiRouter);

// This middleware should be the last one.
// It catches all other GET requests that are not for static files or API endpoints,
// and serves the React app, enabling client-side routing.
app.get(/^(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Catch-all for any unmatched requests (404 Not Found)
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found.' });
});


// --- Server Start ---
const startServer = async () => {
    await initializeDb();
    app.listen(PORT, () => {
        console.log(`CRM backend server is running on http://localhost:${PORT}`);
        // setInterval(checkScheduledAutomations, 1 * 60 * 1000); // Re-enable if needed
    });
};

startServer();