

export interface Company {
    id: string;
    name: string;
}

export enum DealStatus {
  OPEN = 'OPEN',
  WON = 'WON',
  LOST = 'LOST',
}

export interface User {
    username: string;
    password?: string;
    companyId: string;
    resetToken?: string;
    resetTokenExpiry?: number;
}

export type UserProfile = Omit<User, 'password' | 'resetToken' | 'resetTokenExpiry'>;

export interface ContactNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface ContactHistory {
    id:string;
    action: string;
    createdAt: string;
    details?: any; // e.g., { field: 'phone', oldValue: '123', newValue: '456' }
}

export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  data: string; // base64 encoded
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phones: string[];
  classification?: 'CLIENT' | 'PARTNER';
  observation?: string;
  notes: ContactNote[];
  history: ContactHistory[];
  customFields: CustomFieldValue;
  attachments: Attachment[];
  companyId: string;
}

// Stored on the deal/contact itself
export interface CustomFieldValue {
 [key: string]: string | number | null;
}

// Global definition for a custom field
export interface CustomFieldDefinition {
    id: string;
    name:string;
    companyId: string;
}
export interface ContactCustomFieldDefinition {
    id: string;
    name: string;
    companyId: string;
}

export interface DealNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface DealHistory {
    id: string;
    action: string;
    createdAt: string;
    details?: any;
}


export interface Deal {
  id: string;
  name: string;
  value: number;
  contactId: string;
  stageId: string;
  status: DealStatus;
  customFields: CustomFieldValue;
  notes: DealNote[];
  history: DealHistory[];
  observation: string;
  data_vencimento?: string; // YYYY-MM-DD format
  createdAt: string;
  updatedAt: string;
  companyId: string;
}

export interface Stage {
  id: string;
  name: string;
  pipelineId: string;
  order: number;
  companyId: string;
}

export interface Pipeline {
  id: string;
  name: string;
  companyId: string;
}

// --- Automations ---
export enum TriggerType {
    DEAL_STAGE_CHANGED = 'DEAL_STAGE_CHANGED',
    TASK_CREATED = 'TASK_CREATED',
    TASK_COMPLETED = 'TASK_COMPLETED',
    DEAL_CREATED = 'DEAL_CREATED',
    DEAL_ENTERED_PIPELINE = 'DEAL_ENTERED_PIPELINE',
    NOTE_ADDED_TO_DEAL = 'NOTE_ADDED_TO_DEAL',
    DEAL_DUE_DATE_APPROACHING = 'DEAL_DUE_DATE_APPROACHING',
    DEAL_STATUS_UPDATED = 'DEAL_STATUS_UPDATED',
}

export enum ActionType {
    CREATE_DEAL = 'CREATE_DEAL',
    ADD_NOTE = 'ADD_NOTE',
    SEND_WEBHOOK = 'SEND_WEBHOOK',
    SEND_EMAIL = 'SEND_EMAIL',
    UPDATE_DEAL_STATUS = 'UPDATE_DEAL_STATUS',
    MOVE_DEAL_TO_STAGE = 'MOVE_DEAL_TO_STAGE',
    WAIT = 'WAIT',
    CREATE_TASK = 'CREATE_TASK',
    CREATE_CALENDAR_NOTE = 'CREATE_CALENDAR_NOTE',
    SEND_WHATSAPP = 'SEND_WHATSAPP',
}

export enum ConditionField {
    DEAL_VALUE = 'DEAL_VALUE',
    DEAL_STATUS = 'DEAL_STATUS',
    DEAL_PIPELINE = 'DEAL_PIPELINE',
    DEAL_CUSTOM_FIELD = 'DEAL_CUSTOM_FIELD',
    DEAL_DUE_DATE = 'DEAL_DUE_DATE',
}

export enum ConditionOperator {
    EQUALS = 'EQUALS',
    NOT_EQUALS = 'NOT_EQUALS',
    GREATER_THAN = 'GREATER_THAN',
    LESS_THAN = 'LESS_THAN',
    ON_OR_AFTER = 'ON_OR_AFTER',
    ON_OR_BEFORE = 'ON_OR_BEFORE',
}

export interface Condition {
    field: ConditionField;
    operator: ConditionOperator;
    value: string | number;
    customFieldId?: string;
}

export interface ActionStep {
    id: string;
    type: 'ACTION';
    actionType: ActionType;
    actionConfig: {
        // Shared
        pipelineId?: string;
        stageId?: string;
        // CREATE_DEAL
        dealName?: string;
        dealValue?: string | number;
        // ADD_NOTE
        noteContent?: string;
        // SEND_WEBHOOK
        webhookUrl?: string;
        // SEND_EMAIL (Updated)
        templateId?: string;
        // UPDATE_DEAL_STATUS
        status?: DealStatus.WON | DealStatus.LOST;
        // CREATE_TASK
        taskTitle?: string;
        taskDueDateOffsetDays?: string;
        // CREATE_CALENDAR_NOTE
        noteTitle?: string;
        calendarNoteContent?: string;
        noteDateOffsetDays?: string;
        // WAIT (new structure)
        waitMode?: 'DURATION' | 'CONDITION';
        waitDuration?: number;
        waitUnit?: 'MINUTES' | 'HOURS' | 'DAYS';
        waitCondition?: Condition;
        waitDays?: number; // Kept for backward compatibility during migration
        // SEND_WHATSAPP
        whatsappNumber?: string;
        whatsappText?: string;
    };
}

export interface ConditionStep {
    id: string;
    type: 'CONDITION';
    condition: Condition;
    onTrue: AutomationStep[];
    onFalse: AutomationStep[];
}

export type AutomationStep = ActionStep | ConditionStep;

export interface Automation {
    id: string;
    name: string;
    triggerType: TriggerType;
    triggerConfig: {
        // DEAL_STAGE_CHANGED, DEAL_ENTERED_PIPELINE
        pipelineId?: string;
        stageId?: string;
        // DEAL_DUE_DATE_APPROACHING
        daysBefore?: number;
        // DEAL_STATUS_UPDATED
        status?: DealStatus;
    };
    steps: AutomationStep[];
    companyId: string;
}


export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
  dueDate?: string; // YYYY-MM-DD
  companyId: string;
  contactId?: string;
  dealId?: string;
}

export interface CalendarNote {
    id: string;
    title: string;
    content: string;
    date: string; // YYYY-MM-DD
    createdAt: string;
    companyId: string;
}

export interface ActivityNote {
  id: string;
  title: string;
  content: string; // Markdown content with mermaid support
  createdAt: string;
  updatedAt: string;
  companyId: string;
}

// --- Email Templates ---
export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string; // HTML content
    createdAt: string;
    updatedAt: string;
    companyId: string;
}

// --- Dashboard ---
export type DashboardWidgetType = 'KPI' | 'FUNNEL_CHART' | 'STATUS_PIE_CHART' | 'TASKS_LIST' | 'LEADERBOARD';
export type KpiMetric = 'TOTAL_OPEN_VALUE' | 'TOTAL_WON_VALUE' | 'TOTAL_LOST_VALUE' | 'EXPECTED_30_DAYS';

export interface KpiWidgetConfig {
    metric: KpiMetric;
    title: string;
}

export interface ChartWidgetConfig {
    title: string;
    pipelineId: string | null; // null for all pipelines
}

export interface TasksWidgetConfig {
    title: string;
    filter: 'overdue' | 'upcoming';
}

export interface LeaderboardWidgetConfig {
    title: string;
    count: number;
}

export interface DashboardWidget {
    id: string;
    type: DashboardWidgetType;
    config: KpiWidgetConfig | ChartWidgetConfig | TasksWidgetConfig | LeaderboardWidgetConfig;
}

export interface SmtpConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
}

export interface CrmData {
  pipelines: Pipeline[];
  stages: Stage[];
  deals: Deal[];
  contacts: Contact[];
  customFieldDefinitions: CustomFieldDefinition[];
  contactCustomFieldDefinitions: ContactCustomFieldDefinition[];
  webhookUrl: string;
  automations: Automation[];
  apiKey: string;
  tasks: Task[];
  users: UserProfile[];
  calendarNotes: CalendarNote[];
  activityNotes: ActivityNote[];
  emailTemplates: EmailTemplate[];
  dashboardConfig: DashboardWidget[];
  smtpConfig: SmtpConfig;
  evolutionInstanceName: string | null;
  evolutionApiKey: string | null;
  evolutionApiUrl: string | null;
  companyId: string;
  scheduledJobs: ScheduledJob[];
}

export interface DealImportData {
  dealName: string;
  dealValue: number | string;
  contactEmail: string;
  pipelineName: string;
  stageName: string;
  contactName?: string;
  data_vencimento?: string;
  // Allows for arbitrary custom fields by name
  [customFieldName: string]: any;
}

export interface DealImportPayload {
  deals: DealImportData[];
  newDealFields: string[];
  newContactFields: string[];
  defaultPipelineId: string | null;
  defaultStageId: string | null;
}

// --- Pipeline Filtering ---
export enum FilterOperator {
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  IS_EMPTY = 'IS_EMPTY',
  IS_NOT_EMPTY = 'IS_NOT_EMPTY',
  ON_OR_AFTER = 'ON_OR_AFTER',
  ON_OR_BEFORE = 'ON_OR_BEFORE',
}

export interface DealFilter {
  id: string;
  field: string; // Can be a standard field like 'name' or 'value', or a custom field ID
  operator: FilterOperator;
  value: string | number | null;
}

export interface ScheduledJob {
  id: string;
  companyId: string;
  dealId?: string;
  executeAt?: string; // ISO string for date/time
  condition?: string; // JSON string of the condition
  remainingSteps: string; // JSON string of remaining automation steps
}