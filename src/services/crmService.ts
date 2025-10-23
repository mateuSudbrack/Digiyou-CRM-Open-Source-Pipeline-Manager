import { CrmData, Pipeline, Stage, Deal, Contact, DealStatus, CustomFieldDefinition, DealImportData, Automation, Task, User, CalendarNote, ContactCustomFieldDefinition, UserProfile, DashboardWidget, SmtpConfig, EmailTemplate, DealImportPayload, ScheduledJob } from '../types';

const API_URL = "/api"; // The backend server URL

let companyId: string | null = null;

const apiRequest = async <T>(endpoint: string, options: RequestInit = {}, requestCompanyId?: string): Promise<T> => {
    try {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        const idToUse = requestCompanyId || companyId;
        console.log('Making API request with companyId:', idToUse);
        if (idToUse) {
            headers['X-Company-ID'] = idToUse;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            const errorMessage = errorBody?.message || errorBody?.error || response.statusText;
            const errorDetails = errorBody?.details;
            const fullErrorMessage = errorDetails ? `${errorMessage} (Details: ${errorDetails})` : errorMessage;
            throw new Error(fullErrorMessage || 'An API error occurred');
        }
        // Handle cases with no response body (e.g., DELETE 204)
        if (response.status === 204) {
            return undefined as T;
        }
        return response.json();
    } catch (err: any) {
        console.error(`API request failed for endpoint ${endpoint}: ${err.message}`);
        throw err;
    }
};

class CrmApiService {
    // Auth & Users
    public register(username: string, password: string, companyName: string): Promise<{ message: string }> {
        return apiRequest('/register', { method: 'POST', body: JSON.stringify({ username, password, companyName }) });
    }
    public login(username: string, password: string): Promise<{ username: string; companyId: string; } | null> {
        return apiRequest('/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    }
    public logout(): Promise<void> {
        return apiRequest('/logout', { method: 'POST' });
    }

    public checkSession(): Promise<{ username: string; companyId: string; } | null> {
        return apiRequest('/check-session', { method: 'GET' });
    }
    public verifyCode(username: string, code: string): Promise<{ message: string }> {
        return apiRequest('/verify-code', { method: 'POST', body: JSON.stringify({ username, code }) });
    }
    public confirmEmail(token: string): Promise<{ message: string }> {
        // This endpoint does not exist on the server. The current registration flow uses a verification code.
        // This method is a stub to fix a compilation error in the unused ConfirmEmailView component.
        return Promise.reject(new Error('Email confirmation by token is not supported.'));
    }
    public forgotPassword(username: string): Promise<{ message: string }> {
        return apiRequest('/forgot-password', { method: 'POST', body: JSON.stringify({ username }) });
    }
    public resetPassword(token: string, password: string): Promise<{ message: string }> {
        return apiRequest('/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
    }
    public setCompanyId(id: string | null) {
        console.log('[crmService] Setting companyId:', id);
        companyId = id;
    }
     public createUser(username: string, password: string): Promise<UserProfile> {
        return apiRequest('/users', { method: 'POST', body: JSON.stringify({ username, password }) });
    }
    public deleteUser(username: string, companyId: string): Promise<void> {
        return apiRequest(`/users/${encodeURIComponent(username)}`, { method: 'DELETE' }, companyId);
    }
    // Data
    public getAllData(): Promise<CrmData> {
        return apiRequest('/data');
    }
    // Pipelines
    public createPipeline(name: string): Promise<Pipeline> {
        return apiRequest('/pipelines', { method: 'POST', body: JSON.stringify({ name }) });
    }
    public updatePipeline(pipelineId: string, updates: Partial<Pipeline>): Promise<Pipeline> {
        return apiRequest(`/pipelines/${pipelineId}`, { method: 'PATCH', body: JSON.stringify(updates) });
    }
    public deletePipeline(pipelineId: string): Promise<void> {
        return apiRequest(`/pipelines/${pipelineId}`, { method: 'DELETE' });
    }
    public duplicatePipeline(pipelineId: string, newPipelineName: string, dealIds: string[]): Promise<Pipeline> {
        return apiRequest(`/pipelines/${pipelineId}/duplicate`, { method: 'POST', body: JSON.stringify({ newPipelineName, dealIds }) });
    }
    // Stages
    public createStage(pipelineId: string, name: string): Promise<Stage> {
        return apiRequest('/stages', { method: 'POST', body: JSON.stringify({ pipelineId, name }) });
    }
    public updateStage(stageId: string, updates: Partial<Stage>): Promise<Stage> {
        return apiRequest(`/stages/${stageId}`, { method: 'PATCH', body: JSON.stringify(updates) });
    }
    public deleteStage(stageId: string): Promise<void> {
        return apiRequest(`/stages/${stageId}`, { method: 'DELETE' });
    }
    // Deals
    public createDeal(dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'companyId'>): Promise<Deal> {
        return apiRequest('/deals', { method: 'POST', body: JSON.stringify(dealData) });
    }
    public updateDeal(dealId: string, updates: Partial<Deal>): Promise<Deal> {
        return apiRequest(`/deals/${dealId}`, { method: 'PATCH', body: JSON.stringify(updates) });
    }
    public deleteDeal(dealId: string): Promise<void> {
        return apiRequest(`/deals/${dealId}`, { method: 'DELETE' });
    }

    // Contacts
    public getContacts(searchTerm?: string, filterBy?: string, filterValue?: string): Promise<Contact[]> {
        const params = new URLSearchParams();
        if (searchTerm) params.append('q', searchTerm);
        if (filterBy) params.append('filterBy', filterBy);
        if (filterValue) params.append('filterValue', filterValue);
        const queryString = params.toString();
        return apiRequest(`/contacts${queryString ? `?${queryString}` : ''}`);
    }
    public createContact(contactData: Omit<Contact, 'id' | 'history' | 'companyId'>, companyId: string): Promise<Contact> {
        return apiRequest('/contacts', { method: 'POST', body: JSON.stringify(contactData) }, companyId);
    }
    public updateContact(contactId: string, updates: Partial<Contact>): Promise<Contact> {
        return apiRequest(`/contacts/${contactId}`, { method: 'PATCH', body: JSON.stringify(updates) });
    }
    public deleteContact(contactId: string): Promise<void> {
        return apiRequest(`/contacts/${contactId}`, { method: 'DELETE' });
    }
    // Custom Fields (Deals)
    public createCustomFieldDefinition(name: string): Promise<CustomFieldDefinition> {
        return apiRequest('/customFieldDefinitions', { method: 'POST', body: JSON.stringify({ name }) });
    }
    public updateCustomFieldDefinition(defId: string, updates: Partial<CustomFieldDefinition>): Promise<CustomFieldDefinition> {
        return apiRequest(`/customFieldDefinitions/${defId}`, { method: 'PATCH', body: JSON.stringify(updates) });
    }
    public deleteCustomFieldDefinition(defId: string): Promise<void> {
        return apiRequest(`/customFieldDefinitions/${defId}`, { method: 'DELETE' });
     }
     // Custom Fields (Contacts)
    public createContactCustomFieldDefinition(name: string): Promise<ContactCustomFieldDefinition> {
        return apiRequest('/contactCustomFieldDefinitions', { method: 'POST', body: JSON.stringify({ name }) });
    }
    public updateContactCustomFieldDefinition(defId: string, updates: Partial<ContactCustomFieldDefinition>): Promise<ContactCustomFieldDefinition> {
        return apiRequest(`/contactCustomFieldDefinitions/${defId}`, { method: 'PATCH', body: JSON.stringify(updates) });
    }
    public deleteContactCustomFieldDefinition(defId: string): Promise<void> {
        return apiRequest(`/contactCustomFieldDefinitions/${defId}`, { method: 'DELETE' });
    }
    // Webhook, API Key, and Dashboard
    public updateWebhookUrl(companyId: string, webhookUrl: string): Promise<void> {
        return apiRequest(`/webhook-settings`, { method: 'POST', body: JSON.stringify({ webhookUrl }) }, companyId);
    }
    public regenerateApiKey(): Promise<{ apiKey: string }> {
        return apiRequest('/config/api-key', { method: 'POST' });
    }
    public updateDashboardConfig(companyId: string, config: DashboardWidget[]): Promise<void> {
        return apiRequest(`/dashboard-settings`, { method: 'POST', body: JSON.stringify({ dashboardConfig: config }) }, companyId);
    }
    public updateSmtpConfig(companyId: string, config: SmtpConfig): Promise<void> {
        return apiRequest(`/smtp-settings`, { method: 'POST', body: JSON.stringify(config) }, companyId);
    }
    public testSmtpConnection(to: string, subject: string, html: string): Promise<{ message: string }> {
        return apiRequest('/send-test-email', { method: 'POST', body: JSON.stringify({ to, subject, html }) });
    }
    // Automations
    public createAutomation(automationData: Omit<Automation, 'id' | 'companyId'>): Promise<Automation> {
        return apiRequest('/automations', { method: 'POST', body: JSON.stringify(automationData) });
    }
    public updateAutomation(automationId: string, updates: Partial<Automation>): Promise<Automation> {
        return apiRequest(`/automations/${automationId}`, { method: 'PATCH', body: JSON.stringify(updates) });
    }
    public deleteAutomation(automationId: string): Promise<void> {
        return apiRequest(`/automations/${automationId}`, { method: 'DELETE' });
    }
    // Email Templates
    public createEmailTemplate(templateData: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>): Promise<EmailTemplate> {
        return apiRequest('/emailTemplates', { method: 'POST', body: JSON.stringify(templateData) });
    }
    public updateEmailTemplate(templateId: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
        return apiRequest(`/emailTemplates/${templateId}`, { method: 'PATCH', body: JSON.stringify(updates) });
    }
    public deleteEmailTemplate(templateId: string): Promise<void> {
        return apiRequest(`/emailTemplates/${templateId}`, { method: 'DELETE' });
    }
    // Tasks
    public createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'isCompleted' | 'companyId'>): Promise<Task> {
        return apiRequest('/tasks', { method: 'POST', body: JSON.stringify(taskData) });
    }
    public updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
        return apiRequest(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(updates) });
    }
    public deleteTask(taskId: string): Promise<void> {
        return apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });
    }
    // Calendar Notes
    public createCalendarNote(noteData: Omit<CalendarNote, 'id' | 'createdAt' | 'companyId'>): Promise<CalendarNote> {
        return apiRequest('/calendarNotes', { method: 'POST', body: JSON.stringify(noteData) });
    }
    public updateCalendarNote(noteId: string, updates: Partial<CalendarNote>): Promise<CalendarNote> {
        return apiRequest(`/calendarNotes/${noteId}`, { method: 'PATCH', body: JSON.stringify(updates) });
    }
    public deleteCalendarNote(noteId: string): Promise<void> {
        return apiRequest(`/calendarNotes/${noteId}`, { method: 'DELETE' });
    }
    // Import
    public async importDeals(payload: DealImportPayload): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
        return apiRequest('/import/deals', { method: 'POST', body: JSON.stringify(payload) });
    }
    public getScheduledJobs(): Promise<ScheduledJob[]> {
        return apiRequest('/scheduledJobs');
    }
    public getScheduledJobsForAutomation(automationId: string): Promise<ScheduledJob[]> {
        return apiRequest(`/automations/${automationId}/scheduledJobs`);
    }
    // WhatsApp Evolution API
    public saveEvolutionConfig(companyId: string, apiUrl: string, apiKey: string): Promise<void> {
        return apiRequest(`/evolution-settings`, { method: 'POST', body: JSON.stringify({ apiUrl, apiKey }) }, companyId);
    }
    public createEvolutionInstance(instanceName: string, generateQrCode: boolean, companyId: string): Promise<any> {
        return apiRequest('/evolution/instance', { method: 'POST', body: JSON.stringify({ instanceName, qrcode: generateQrCode }) }, companyId);
    }
    public deleteEvolutionInstance(companyId: string): Promise<{ deleted: true }> {
        return apiRequest('/evolution/instance', { method: 'DELETE' }, companyId);
    }
    public getEvolutionConnection(companyId: string): Promise<any> {
        if (!companyId) {
            throw new Error('Company ID is not set. Please log in.');
        }
        return apiRequest('/evolution/connect', { method: 'GET' }, companyId);
    }
    public getEvolutionStatus(companyId: string): Promise<any> {
        if (!companyId) {
            throw new Error('Company ID is not set. Please log in.');
        }
        return apiRequest('/evolution/status', {}, companyId);
    }


}

export const crmService = new CrmApiService();