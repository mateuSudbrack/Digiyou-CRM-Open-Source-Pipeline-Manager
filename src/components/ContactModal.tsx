
import React, { useState, useEffect } from 'react';
import { Contact, ContactCustomFieldDefinition, ContactNote, Deal, Stage, DealStatus, Attachment, Task, ScheduledJob } from '../types';
import Modal from './Modal';
import { PlusIcon, TrashIcon, LinkIcon, ClockIcon } from './icons';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Omit<Contact, 'id' | 'history' | 'companyId'> | Contact) => Promise<{ success: boolean; message?: string; }>;
  contact: Contact | null;
  customFieldDefs: ContactCustomFieldDefinition[];
  deals: Deal[];
  stages: Stage[];
  tasks: Task[];
  onDealClick: (deal: Deal) => void;
  onAddTaskForContact: (contactId: string) => void;
  scheduledJobs: ScheduledJob[];
}

const formatDateTime = (isoString: string): string => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};


const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, onSave, contact, customFieldDefs, deals, stages, tasks, onDealClick, onAddTaskForContact, scheduledJobs }) => {
  const [formData, setFormData] = useState<Omit<Contact, 'id' | 'history' | 'companyId'>>(getEmptyContact());
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'history' | 'deals' | 'files' | 'tasks'>('details');
  const [newNote, setNewNote] = useState('');

  function getEmptyContact(): Omit<Contact, 'id' | 'history' | 'companyId'> {
      return {
        name: '', email: '', phones: [''], classification: undefined,
        observation: '', notes: [], customFields: {}, attachments: []
      };
  }

  useEffect(() => {
    if (isOpen) {
        if (contact) {
            setFormData(JSON.parse(JSON.stringify(contact)));
        } else {
            setFormData(getEmptyContact());
        }
        setError('');
        setCopiedLink(false);
        setActiveTab('details');
        setNewNote('');
    }
  }, [contact, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
        ...prev,
        customFields: { ...prev.customFields, [fieldId]: value }
    }));
  };

  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...formData.phones];
    newPhones[index] = value;
    setFormData(prev => ({...prev, phones: newPhones}));
  };

  const addPhone = () => setFormData(prev => ({...prev, phones: [...prev.phones, '']}));
  const removePhone = (index: number) => {
    if (formData.phones.length > 1) {
      setFormData(prev => ({...prev, phones: formData.phones.filter((_, i) => i !== index)}));
    }
  };
  
  const addNote = () => {
    if (newNote.trim() === '') return;
    const note: ContactNote = { id: `new_${Date.now()}`, content: newNote, createdAt: new Date().toISOString() };
    setFormData(prev => ({ ...prev, notes: [note, ...prev.notes]}));
    setNewNote('');
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const newAttachment: Attachment = {
                id: `new_${Date.now()}`,
                fileName: file.name,
                mimeType: file.type,
                data: event.target?.result as string,
                createdAt: new Date().toISOString(),
            };
            setFormData(prev => ({...prev, attachments: [...(prev.attachments || []), newAttachment]}));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
      setFormData(prev => ({...prev, attachments: prev.attachments.filter(a => a.id !== attachmentId)}));
  };

  const handleCopyLink = () => {
    if (!contact) return;
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isDealInAutomation = (dealId: string) => {
    return scheduledJobs.some(job => job.dealId === dealId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    
    const payload = contact ? { ...formData, id: contact.id } : formData;

    try {
        const result = await onSave(payload);
        if (result && !result.success) {
            setError(result.message || 'An unknown error occurred.');
        }
    } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  };
  
  const renderDetailsTab = () => (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-name" className="block text-sm font-medium text-gray-300">Name</label>
            <input id="contact-name" type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" required disabled={isSaving}/>
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium text-gray-300">Email</label>
            <input id="contact-email" type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white disabled:bg-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed" required disabled={!!contact || isSaving}/>
            {!!contact && <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>}
          </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Phones</label>
            {formData.phones.map((phone, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                    <input type="tel" aria-label={`Phone number ${index + 1}`} value={phone} onChange={(e) => handlePhoneChange(index, e.target.value)} className="block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" disabled={isSaving}/>
                    <button type="button" onClick={() => removePhone(index)} disabled={formData.phones.length <= 1 || isSaving} className="text-gray-400 hover:text-red-500 disabled:opacity-50" aria-label={`Remove phone number ${index + 1}`}><TrashIcon className="h-5 w-5" /></button>
                </div>
            ))}
             <button type="button" onClick={addPhone} disabled={isSaving} className="text-blue-400 hover:text-blue-300 flex items-center space-x-1 text-sm disabled:opacity-50"><PlusIcon className="h-4 w-4" /><span>Add phone</span></button>
        </div>
         <div>
            <label htmlFor="contact-classification" className="block text-sm font-medium text-gray-300">Classification</label>
            <select id="contact-classification" name="classification" value={formData.classification || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
                <option value="">(Undefined)</option>
                <option value="CLIENT">Client</option>
                <option value="PARTNER">Partner</option>
            </select>
         </div>
         <div>
            <label htmlFor="contact-observation" className="block text-sm font-medium text-gray-300">Observation</label>
            <textarea id="contact-observation" name="observation" value={formData.observation || ''} onChange={handleChange} rows={3} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"></textarea>
        </div>
        {customFieldDefs.length > 0 && (
          <div>
              <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-600 pb-2 mb-3">Custom Fields</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customFieldDefs.map((def) => (
                  <div key={def.id}>
                       <label htmlFor={`custom-field-${def.id}`} className="block text-sm font-medium text-gray-300">{def.name}</label>
                       <input id={`custom-field-${def.id}`} type="text" value={formData.customFields[def.id] || ''} onChange={(e) => handleCustomFieldChange(def.id, e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
                  </div>
              ))}
              </div>
          </div>
        )}
      </div>
  );
  
  const renderNotesTab = () => (
      <div>
            <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                {formData.notes.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(note => (
                    <div key={note.id} className="bg-gray-700/50 p-2 rounded">
                        <p className="text-sm text-gray-200 whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-gray-400 text-right">{formatDateTime(note.createdAt)}</p>
                    </div>
                ))}
            </div>
            <div className="flex space-x-2">
                <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a new note..." rows={3} className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"></textarea>
                <button type="button" onClick={addNote} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg self-start">Add</button>
            </div>
        </div>
  );

  const renderHistoryTab = () => (
      <div className="space-y-2 max-h-80 overflow-y-auto">
          {(contact?.history || []).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(entry => (
              <div key={entry.id} className="bg-gray-700/50 p-2 rounded">
                  <p className="text-sm text-gray-200 font-semibold">{entry.action}</p>
                  <p className="text-xs text-gray-400 text-right">{formatDateTime(entry.createdAt)}</p>
              </div>
          ))}
          {(!contact?.history || contact.history.length === 0) && <p className="text-gray-500 text-center py-4">No history recorded.</p>}
      </div>
  );

  const renderDealsTab = () => {
    if (!contact) return null;
    const contactDeals = deals.filter(d => d.contactId === contact.id);

    if (contactDeals.length === 0) {
        return <p className="text-gray-500 text-center py-4">No deals found for this contact.</p>;
    }
    
    return (
        <div className="space-y-2 max-h-80 overflow-y-auto">
            {contactDeals.map(deal => {
                const stageName = stages.find(s => s.id === deal.stageId)?.name || 'N/A';
                return (
                     <div key={deal.id} onClick={() => onDealClick(deal)} className="bg-gray-700/50 hover:bg-gray-700 p-3 rounded-md cursor-pointer transition-colors">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-gray-200 flex items-center space-x-2">
                              <span>{deal.name}</span>
                              {isDealInAutomation(deal.id) && (
                                <ClockIcon className="h-4 w-4 text-blue-400" title="In Automation" />
                              )}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                deal.status === DealStatus.WON ? 'bg-green-500/20 text-green-300' :
                                deal.status === DealStatus.LOST ? 'bg-red-500/20 text-red-300' :
                                'bg-blue-500/20 text-blue-300'
                            }`}>
                                {deal.status}
                            </span>
                        </div>
                        <div className="text-sm text-gray-400 mt-1 flex justify-between">
                             <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}</span>
                             <span>{stageName}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };
  
  const renderFilesTab = () => (
    <div>
        <div className="mb-4">
            <label htmlFor="file-upload" className="w-full text-center cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg block">Upload New File</label>
            <input id="file-upload" type="file" onChange={handleFileUpload} className="hidden" />
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
            {(formData.attachments || []).map(file => (
                <div key={file.id} className="bg-gray-700/50 p-2 rounded flex justify-between items-center">
                    <a href={file.data} download={file.fileName} className="text-sm text-blue-400 hover:underline truncate" title={file.fileName}>
                        {file.fileName}
                    </a>
                    <button type="button" onClick={() => handleRemoveAttachment(file.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-full"><TrashIcon className="h-4 w-4"/></button>
                </div>
            ))}
        </div>
        {(!formData.attachments || formData.attachments.length === 0) && <p className="text-gray-500 text-center py-4">No files attached.</p>}
    </div>
  );

  const renderTasksTab = () => {
    if (!contact) return null;
    const contactTasks = tasks.filter(t => t.contactId === contact.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div>
             <button type="button" onClick={() => onAddTaskForContact(contact.id)} className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mb-4 flex items-center justify-center space-x-2">
                <PlusIcon className="h-5 w-5"/>
                <span>Add Task for this Contact</span>
             </button>
             <div className="space-y-2 max-h-60 overflow-y-auto">
                {contactTasks.map(task => (
                    <div key={task.id} className={`p-2 rounded ${task.isCompleted ? 'bg-gray-700/50' : 'bg-gray-700'}`}>
                        <p className={`text-sm ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-200'}`}>{task.title}</p>
                        {task.dueDate && <p className="text-xs text-gray-400">Due: {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>}
                    </div>
                ))}
            </div>
            {contactTasks.length === 0 && <p className="text-gray-500 text-center py-4">No tasks for this contact.</p>}
        </div>
    );
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={contact ? 'Edit Contact' : 'New Contact'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                <button type="button" onClick={() => setActiveTab('details')} className={`${activeTab === 'details' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>Details</button>
                 {contact && <button type="button" onClick={() => setActiveTab('deals')} className={`${activeTab === 'deals' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>Deals</button>}
                 {contact && <button type="button" onClick={() => setActiveTab('tasks')} className={`${activeTab === 'tasks' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>Tasks</button>}
                <button type="button" onClick={() => setActiveTab('notes')} className={`${activeTab === 'notes' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>Notes</button>
                <button type="button" onClick={() => setActiveTab('files')} className={`${activeTab === 'files' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>Files</button>
                {contact && <button type="button" onClick={() => setActiveTab('history')} className={`${activeTab === 'history' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>History</button>}
            </nav>
        </div>

        <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
            {activeTab === 'details' && renderDetailsTab()}
            {activeTab === 'deals' && renderDealsTab()}
            {activeTab === 'tasks' && renderTasksTab()}
            {activeTab === 'notes' && renderNotesTab()}
            {activeTab === 'files' && renderFilesTab()}
            {activeTab === 'history' && renderHistoryTab()}
        </div>

        {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-md">{error}</p>}
        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
          <div>
            {contact && (
                <button type="button" onClick={handleCopyLink} className="text-gray-400 hover:text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 flex items-center space-x-2 transition-colors">
                  <LinkIcon className="h-5 w-5"/>
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
            )}
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-wait" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ContactModal;
