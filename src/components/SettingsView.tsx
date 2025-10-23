

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CrmData, CustomFieldDefinition, ContactCustomFieldDefinition, UserProfile, SmtpConfig } from '../types';
import { crmService } from '../services/crmService';
import { PlusIcon, EditIcon, TrashIcon, UserIcon } from './icons';

interface SettingsViewProps {
  data: CrmData;
  refreshData: () => Promise<void>;
  onManagePipelines: () => void;
  onManageStages: (pipelineId: string) => void;
  onDeleteCustomField: (fieldId: string) => void;
  onDeleteContactCustomField: (fieldId: string) => void;
  onDeleteUser: (username: string) => void;
}

const UserManagement: React.FC<{ users: UserProfile[], refreshData: () => Promise<void>, onDeleteUser: (username: string) => void }> = ({ users, refreshData, onDeleteUser }) => {
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 4) {
            setError('Password must be at least 4 characters long.');
            return;
        }
        try {
            await crmService.createUser(newUsername, newPassword);
            setNewUsername('');
            setNewPassword('');
            await refreshData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4">User Management</h2>
            <p className="text-sm text-gray-400 mb-3">Add or remove users who can access this company's account.</p>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 items-end">
                <div className="sm:col-span-1">
                    <label htmlFor="new-username" className="block text-xs font-medium text-gray-400 mb-1">Username</label>
                    <input id="new-username" type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="New username" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" required />
                </div>
                <div className="sm:col-span-1">
                    <label htmlFor="new-password"  className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                    <input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Password (min 4 chars)" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" required />
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-lg h-10 flex items-center justify-center space-x-2">
                    <PlusIcon className="h-5 w-5"/>
                    <span>Add User</span>
                </button>
            </form>
            {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded-md">{error}</p>}
             <ul className="divide-y divide-gray-700 max-h-60 overflow-y-auto">
              {users.map(user => (
                  <li key={user.username} className="py-2 flex justify-between items-center group">
                      <div className="flex items-center space-x-3">
                        <UserIcon className="h-5 w-5 text-gray-400"/>
                        <span>{user.username}</span>
                      </div>
                      <button onClick={() => onDeleteUser(user.username)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Delete user ${user.username}`}>
                        <TrashIcon className="w-4 h-4" />
                      </button>
                  </li>
              ))}
          </ul>
        </div>
    );
};

const SmtpSettings: React.FC<{ initialConfig: SmtpConfig, refreshData: () => Promise<void>, companyId: string }> = ({ initialConfig, refreshData, companyId }) => {
    const [config, setConfig] = useState<SmtpConfig>(initialConfig || { host: '', port: 587, secure: false, user: '', pass: '' });
    const [testEmail, setTestEmail] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setConfig(initialConfig || { host: '', port: 587, secure: false, user: '', pass: '' });
    }, [initialConfig]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleTest = async () => {
        if (!testEmail) {
            setStatus({ type: 'error', message: 'Please enter an email address to send a test to.' });
            return;
        }
        setIsTesting(true);
        setStatus({ type: '', message: '' });
        try {
            const result = await crmService.testSmtpConnection(testEmail, 'Test Email', 'This is a test email from the CRM.');
            setStatus({ type: 'success', message: result.message });
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setStatus({ type: '', message: '' });
        try {
            await crmService.updateSmtpConfig(companyId, config);
            await refreshData();
            setStatus({ type: 'success', message: 'SMTP settings saved successfully!' });
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Email (SMTP) Configuration</h2>
            <p className="text-sm text-gray-400 mb-4">Configure the SMTP server used to send emails from automations.</p>
            <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">SMTP Host</label>
                        <input type="text" name="host" value={config.host} onChange={handleChange} className="mt-1 w-full bg-gray-700 border-gray-600 rounded p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">SMTP Port</label>
                        <input type="number" name="port" value={config.port} onChange={handleChange} className="mt-1 w-full bg-gray-700 border-gray-600 rounded p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">SMTP User</label>
                        <input type="text" name="user" value={config.user} onChange={handleChange} className="mt-1 w-full bg-gray-700 border-gray-600 rounded p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">SMTP Password</label>
                        <input type="password" name="pass" value={config.pass} onChange={handleChange} className="mt-1 w-full bg-gray-700 border-gray-600 rounded p-2" required />
                    </div>
                </div>
                <div className="flex items-center">
                    <input type="checkbox" id="secure" name="secure" checked={config.secure} onChange={handleChange} className="h-4 w-4 bg-gray-700 border-gray-600 rounded" />
                    <label htmlFor="secure" className="ml-2 block text-sm text-gray-300">Use Secure Connection (SSL/TLS)</label>
                </div>
                <div className="flex justify-end">
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
            <div className="mt-6 border-t border-gray-700 pt-4">
                <h3 className="text-lg font-semibold mb-2">Test Connection</h3>
                <div className="flex items-center space-x-2">
                    <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="Email to send test to" className="flex-grow bg-gray-700 border-gray-600 rounded p-2" />
                    <button onClick={handleTest} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg" disabled={isTesting}>
                        {isTesting ? 'Testing...' : 'Test'}
                    </button>
                </div>
            </div>
            {status.message && (
                <div className={`mt-4 p-3 rounded-md text-sm ${status.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {status.message}
                </div>
            )}
        </div>
    );
};

const StatusDisplay: React.FC<{ status: string }> = ({ status }) => {
    const statusInfo: { [key: string]: { text: string; color: string } } = {
        open: { text: 'Connected', color: 'bg-green-500/30 text-green-300' },
        connecting: { text: 'Connecting', color: 'bg-yellow-500/30 text-yellow-300' },
        qrcode: { text: 'Scan QR Code', color: 'bg-blue-500/30 text-blue-300' },
        close: { text: 'Disconnected', color: 'bg-red-500/30 text-red-300' },
        disconnected: { text: 'Disconnected', color: 'bg-red-500/30 text-red-300' },
        checking: { text: 'Checking...', color: 'bg-gray-500/30 text-gray-300' }
    };

    const info = statusInfo[status.toLowerCase()] || { text: status, color: 'bg-gray-500/30 text-gray-300' };

    return (
        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${info.color}`}>
            {info.text}
        </span>
    );
};


const WhatsAppEvolutionSettings: React.FC<{ 
    initialInstanceName: string | null; 
    initialApiKey: string | null;
    initialApiUrl: string | null;
    refreshData: () => Promise<void>; 
    companyId: string;
}> = ({ initialInstanceName, initialApiKey, initialApiUrl, refreshData, companyId }) => {
    const [apiUrl, setApiUrl] = useState(initialApiUrl || '');
    const [apiKey, setApiKey] = useState(initialApiKey || '');
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [configStatus, setConfigStatus] = useState({ type: '', message: ''});

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingConfig(true);
        setConfigStatus({ type: '', message: '' });
        try {
            await crmService.saveEvolutionConfig(companyId, apiUrl, apiKey);
            await refreshData();
            setConfigStatus({ type: 'success', message: 'WhatsApp API credentials saved successfully!' });
        } catch (err: any) {
            setConfigStatus({ type: 'error', message: err.message || 'Failed to save WhatsApp API credentials.' });
        } finally {
            setIsSavingConfig(false);
        }
    };
    
    const [instanceName, setInstanceName] = useState('');
    const [status, setStatus] = useState<string>('checking');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [instanceError, setInstanceError] = useState('');

    const statusIntervalRef = useRef<number | null>(null);
    
    const checkStatus = useCallback(async () => {
        try {
            const result = await crmService.getEvolutionStatus(companyId);
            // The API response is { instance: { state: '...' } }
            if (result && result.instance?.state) {
                const newState = result.instance.state.trim().toLowerCase();
                setStatus(newState);

                if (newState === 'open') {
                    setQrCode(null);
                    // Stop polling once connected.
                    if (statusIntervalRef.current) {
                        clearInterval(statusIntervalRef.current);
                        statusIntervalRef.current = null;
                    }
                }
            } else {
                console.warn("Received malformed status from Evolution API:", result);
            }
        } catch (e) {
            console.error("Status check failed, will retry:", e);
        }
    }, []);
    
    useEffect(() => {
        if (statusIntervalRef.current) {
            clearInterval(statusIntervalRef.current);
            statusIntervalRef.current = null;
        }

        if (initialInstanceName && initialApiKey && initialApiUrl) {
            checkStatus(); // Initial check
            // Start polling only if not already connected
            if (status.toLowerCase() !== 'open') {
                statusIntervalRef.current = setInterval(checkStatus, 4000) as unknown as number;
            }
        } else {
            setStatus('disconnected');
        }

        return () => {
            if (statusIntervalRef.current) {
                clearInterval(statusIntervalRef.current);
            }
        };
    }, [initialInstanceName, initialApiKey, initialApiUrl, checkStatus, status]);
    
    useEffect(() => {
        if (companyId) {
            crmService.setCompanyId(companyId);
        }
    }, [companyId]);

    const [generateQrCode, setGenerateQrCode] = useState(true);

    const handleCreateInstance = async (e: React.FormEvent) => {
        e.preventDefault();
        setInstanceError('');
        setIsLoading(true);
        try {
            const result = await crmService.createEvolutionInstance(instanceName, generateQrCode, companyId);
            if (generateQrCode && (result.base64 || result.qrcode?.base64)) {
                setQrCode(result.base64 || result.qrcode.base64);
                setStatus('qrcode');
            }
            await refreshData();
        } catch (err: any) {
            setInstanceError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeleteInstance = async () => {
        if (window.confirm("Are you sure you want to delete this instance? This action cannot be undone.")) {
            setIsLoading(true);
            setInstanceError('');
            try {
                await crmService.deleteEvolutionInstance(companyId);
                await refreshData();
                setQrCode(null);
            } catch (err: any) {
                setInstanceError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleConnect = async () => {
        setIsLoading(true);
        setInstanceError('');
        setQrCode(null);
        setStatus('connecting');
        try {
            console.log('Initiating connection...');
            const result = await crmService.getEvolutionConnection(companyId);
            if (result.base64 || result.qrcode?.base64) {
                setQrCode(result.base64 || result.qrcode.base64);
                setStatus('qrcode');
            } else {
                setInstanceError('Failed to retrieve QR code from the server.');
                setStatus('disconnected');
            }
        } catch (e: any) {
            console.error("Failed to connect", e);
            setInstanceError(e.message || "Failed to initiate connection.");
            setStatus('disconnected');
        } finally {
            setIsLoading(false);
        }
    };

    const credentialsAreSet = !!initialApiUrl && !!initialApiKey;
    const qrCodeSrc = qrCode && (qrCode.startsWith('data:image') ? qrCode : `data:image/png;base64,${qrCode}`);

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4">WhatsApp Evolution API</h2>
            
            <form onSubmit={handleSaveConfig} className="space-y-4 mb-6 pb-6 border-b border-gray-700">
                 <div>
                    <label className="block text-sm font-medium text-gray-300">API URL</label>
                    <input type="url" value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="e.g., https://api.yourdomain.com" className="mt-1 w-full bg-gray-700 border-gray-600 rounded p-2" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">API Key</label>
                    <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Your Evolution API Key" className="mt-1 w-full bg-gray-700 border-gray-600 rounded p-2" required />
                </div>
                <div className="flex justify-end">
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg" disabled={isSavingConfig}>
                        {isSavingConfig ? 'Saving...' : 'Save Credentials'}
                    </button>
                </div>
                {configStatus.message && (
                    <div className={`p-2 rounded-md text-sm ${configStatus.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {configStatus.message}
                    </div>
                )}
            </form>
            
            <div className={!credentialsAreSet ? 'opacity-50 pointer-events-none' : ''}>
                <h3 className="text-lg font-semibold mb-2">Instance Management</h3>
                {!initialInstanceName ? (
                    <>
                        <p className="text-sm text-gray-400 mb-3">Create an instance to connect your WhatsApp account.</p>
                        <form onSubmit={handleCreateInstance} className="space-y-3">
                            <input type="text" value={instanceName} onChange={e => setInstanceName(e.target.value)} placeholder="Instance Name (e.g., my-company)" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" required />
                            <div className="flex items-center">
                                <input id="generate-qrcode" type="checkbox" checked={generateQrCode} onChange={e => setGenerateQrCode(e.target.checked)} className="h-4 w-4 bg-gray-700 border-gray-600 rounded" />
                                <label htmlFor="generate-qrcode" className="ml-2 text-sm text-gray-300">Generate QR Code immediately</label>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 px-4 rounded-lg" disabled={isLoading}>
                                {isLoading ? 'Creating...' : 'Create Instance'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="font-semibold">Instance: <span className="font-mono bg-gray-700 p-1 rounded">{initialInstanceName}</span></p>
                                <p className="font-semibold mt-1 flex items-center">Status: <StatusDisplay status={status} /></p>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={handleConnect} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-3 rounded-lg text-sm" disabled={isLoading}>
                                    {isLoading ? 'Connecting...' : 'Connect / New QR Code'}
                                </button>
                                <button onClick={handleDeleteInstance} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg text-sm" disabled={isLoading}>
                                    Delete Instance
                                </button>
                            </div>
                        </div>

                        {qrCodeSrc && status !== 'open' && (
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Scan this QR Code with your WhatsApp app. The status will update automatically.</p>
                                <img key={qrCodeSrc} src={qrCodeSrc} alt="WhatsApp QR Code" className="rounded-lg border border-gray-600" />
                            </div>
                        )}
                         {status === 'open' && (
                            <p className="text-green-400">Your WhatsApp is connected and ready for automations.</p>
                        )}
                    </div>
                )}
                {instanceError && <p className="text-red-400 text-sm mt-2 bg-red-500/10 p-2 rounded-md">{instanceError}</p>}
                {!credentialsAreSet && <p className="text-xs text-yellow-400 mt-2">You must save your API credentials before managing an instance.</p>}
            </div>
        </div>
    );
};

const SettingsView: React.FC<SettingsViewProps> = ({ data, refreshData, onManagePipelines, onManageStages, onDeleteCustomField, onDeleteContactCustomField, onDeleteUser }) => {
  const { pipelines, customFieldDefinitions, contactCustomFieldDefinitions, webhookUrl, smtpConfig, evolutionInstanceName, evolutionApiKey, evolutionApiUrl } = data;
  
  const [webhookUrlInput, setWebhookUrlInput] = useState(webhookUrl);

  useEffect(() => {
    if (data && data.companyId) {
      crmService.setCompanyId(data.companyId);
    }
  }, [data]);

  const handleSaveWebhook = async (e: React.FormEvent) => {
      e.preventDefault();
      await crmService.updateWebhookUrl(data.companyId, webhookUrlInput);
      await refreshData();
      alert("Webhook URL updated!");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Management & Webhooks */}
        <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h2 className="text-xl font-bold mb-4">Pipelines & Stages</h2>
                <div className="space-y-4">
                    <button onClick={onManagePipelines} className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                        Manage All Pipelines
                    </button>
                    {pipelines.map(p => (
                         <div key={p.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-md">
                            <span className="font-semibold">{p.name}</span>
                            <button onClick={() => onManageStages(p.id)} className="text-sm bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded-lg">
                                Manage Stages
                            </button>
                        </div>
                    ))}
                </div>
            </div>
             <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h2 className="text-xl font-bold mb-4">Webhook Endpoint</h2>
                <p className="text-sm text-gray-400 mb-3">The CRM will send a POST request to this URL when a deal's stage is changed.</p>
                <form onSubmit={handleSaveWebhook} className="flex space-x-2">
                    <input type="url" value={webhookUrlInput} onChange={e => setWebhookUrlInput(e.target.value)} placeholder="https://your-endpoint.com/webhook" className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 px-4 rounded-lg">Save</button>
                </form>
            </div>
            <SmtpSettings initialConfig={smtpConfig} refreshData={refreshData} companyId={data.companyId} />
            <WhatsAppEvolutionSettings 
                initialInstanceName={evolutionInstanceName} 
                initialApiKey={evolutionApiKey || null}
                initialApiUrl={evolutionApiUrl || null}
                refreshData={refreshData}
                companyId={data.companyId}
            />
        </div>

        {/* Custom Fields */}
        <div className="space-y-6">
            <CustomFieldManager 
                title="Custom Fields for Deals"
                definitions={customFieldDefinitions}
                onDelete={onDeleteCustomField}
                onSave={async (name, id) => {
                    if (id) await crmService.updateCustomFieldDefinition(id, { name });
                    else await crmService.createCustomFieldDefinition(name);
                }}
                refreshData={refreshData}
            />
            <CustomFieldManager 
                title="Custom Fields for Contacts"
                definitions={contactCustomFieldDefinitions}
                onDelete={onDeleteContactCustomField}
                onSave={async (name, id) => {
                    if (id) await crmService.updateContactCustomFieldDefinition(id, { name });
                    else await crmService.createContactCustomFieldDefinition(name);
                }}
                refreshData={refreshData}
            />
            <UserManagement
                users={data.users}
                refreshData={refreshData}
                onDeleteUser={onDeleteUser}
            />
        </div>
      </div>
    </div>
  );
};

interface CustomFieldManagerProps {
    title: string;
    definitions: CustomFieldDefinition[] | ContactCustomFieldDefinition[];
    onDelete: (id: string) => void;
    onSave: (name: string, id?: string) => Promise<void>;
    refreshData: () => Promise<void>;
}

const CustomFieldManager: React.FC<CustomFieldManagerProps> = ({ title, definitions, onDelete, onSave, refreshData }) => {
    const [editingField, setEditingField] = useState<CustomFieldDefinition | ContactCustomFieldDefinition | null>(null);
    const [inputValue, setInputValue] = useState('');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        await onSave(inputValue, editingField?.id);
        setInputValue('');
        setEditingField(null);
        await refreshData();
    };
    
    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4">{title}</h2>
            <form onSubmit={handleSave} className="flex space-x-2 mb-4">
                <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder={editingField ? 'Rename field' : 'New field name'} className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-lg" aria-label={editingField ? 'Save field name' : 'Add new custom field'}>{editingField ? 'Save' : <PlusIcon className="h-5 w-5"/>}</button>
                {editingField && <button type="button" onClick={() => {setEditingField(null); setInputValue('')}} className="bg-gray-600 hover:bg-gray-500 text-white font-bold p-2 rounded-lg">Cancel</button>}
            </form>
             <ul className="divide-y divide-gray-700 max-h-60 overflow-y-auto">
              {definitions.map(item => (
                  <li key={item.id} className="py-2 flex justify-between items-center">
                      <span>{item.name}</span>
                      <div className="space-x-2">
                          <button onClick={() => { setEditingField(item); setInputValue(item.name); }} className="text-gray-400 hover:text-white"><EditIcon className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(item.id)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                      </div>
                  </li>
              ))}
          </ul>
        </div>
    );
};


export default SettingsView;
