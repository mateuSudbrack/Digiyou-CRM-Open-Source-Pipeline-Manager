import React, { useState, useEffect } from 'react';
import { Deal, Contact, Stage, DealNote, DealStatus, CustomFieldDefinition, Pipeline, Task } from '../types';
import Modal from './Modal';
import { PlusIcon, TrashIcon, LinkIcon } from './icons';

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'companyId'> | Deal) => void;
  onDelete: (dealId: string) => void;
  deal: Deal | null;
  contacts: Contact[];
  pipelines: Pipeline[];
  stages: Stage[];
  customFieldDefs: CustomFieldDefinition[];
  tasks: Task[];
  defaultDataVencimento?: string;
  defaultStageId?: string;
  onAddNewContact: () => Promise<Contact | null>;
  onAddTaskForDeal: (dealId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

const getEmptyDeal = (stages: Stage[], contacts: Contact[]): Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'companyId'> => ({
  name: '',
  value: 0,
  contactId: contacts[0]?.id || '',
  stageId: stages[0]?.id || '',
  status: DealStatus.OPEN,
  customFields: {},
  notes: [],
  observation: '',
  data_vencimento: undefined,
});

const formatDateTime = (isoString: string): string => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const DealModal: React.FC<DealModalProps> = ({ isOpen, onClose, onSave, onDelete, deal, contacts, pipelines, stages, customFieldDefs, tasks, defaultDataVencimento, defaultStageId, onAddNewContact, onAddTaskForDeal, onUpdateTask }) => {
  const [formData, setFormData] = useState(getEmptyDeal(stages, contacts));
  const [newNote, setNewNote] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'history' | 'tasks'>('details');
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initialFormData = deal ? JSON.parse(JSON.stringify(deal)) : getEmptyDeal(stages, contacts);
      if (!deal && defaultDataVencimento) {
        initialFormData.data_vencimento = defaultDataVencimento;
      }
      if (!deal && defaultStageId) {
        initialFormData.stageId = defaultStageId;
      }
      setFormData(initialFormData);

      const stage = stages.find(s => s.id === initialFormData.stageId);
      setSelectedPipelineId(stage?.pipelineId || pipelines[0]?.id || null);
      
      setCopiedLink(false);
      setActiveTab('details');
      setNewNote('');
    }
  }, [deal, isOpen, stages, contacts, pipelines, defaultDataVencimento, defaultStageId]);
  
  const handlePipelineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newPipelineId = e.target.value;
      setSelectedPipelineId(newPipelineId);
      const firstStageOfNewPipeline = stages.find(s => s.pipelineId === newPipelineId);
      setFormData(prev => ({
          ...prev,
          stageId: firstStageOfNewPipeline?.id || ''
      }));
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'data_vencimento') {
      setFormData(prev => ({ ...prev, data_vencimento: value || undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: name === 'value' ? parseFloat(value) || 0 : value }));
    }
  };
  
  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
        ...prev,
        customFields: {
            ...prev.customFields,
            [fieldId]: value,
        }
    }));
  };

  const addNote = () => {
    if (newNote.trim() === '') return;
    const note: DealNote = { id: `new_${Date.now()}`, content: newNote, createdAt: new Date().toISOString() };
    setFormData(prev => ({ ...prev, notes: [note, ...(prev.notes || [])]}));
    setNewNote('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  const handleCopyLink = () => {
    if (!deal) return;
    const url = `${window.location.origin}/deals/${deal.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;
  
  const stagesForSelectedPipeline = stages.filter(s => s.pipelineId === selectedPipelineId).sort((a,b) => a.order - b.order);

  const renderDetailsTab = () => (
     <div className="space-y-4">
        {/* Core Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="deal-name" className="block text-sm font-medium text-gray-300">Deal Name</label>
              <input id="deal-name" type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" required/>
            </div>
            <div>
              <label htmlFor="deal-value" className="block text-sm font-medium text-gray-300">Value (BRL)</label>
              <input id="deal-value" type="number" name="value" value={formData.value} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" required/>
            </div>
            <div>
              <label htmlFor="deal-contact" className="block text-sm font-medium text-gray-300">Contact</label>
              <div className="flex items-center space-x-2">
                <select id="deal-contact" name="contactId" value={formData.contactId} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" required>
                  <option value="" disabled>Select a contact</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" onClick={async () => {
                  const newContact = await onAddNewContact();
                  if (newContact) {
                    setFormData(prev => ({ ...prev, contactId: newContact.id }));
                  }
                }} className="mt-1 p-2 bg-gray-600 hover:bg-gray-500 rounded-md">
                  <PlusIcon className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
             <div>
              <label htmlFor="deal-pipeline" className="block text-sm font-medium text-gray-300">Pipeline</label>
              <select id="deal-pipeline" name="pipelineId" value={selectedPipelineId || ''} onChange={handlePipelineChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" required>
                 {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="deal-stage" className="block text-sm font-medium text-gray-300">Stage</label>
              <select id="deal-stage" name="stageId" value={formData.stageId} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" required>
                 {stagesForSelectedPipeline.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="deal-status" className="block text-sm font-medium text-gray-300">Status</label>
              <select id="deal-status" name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" required>
                {Object.values(DealStatus).map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="deal-data_vencimento" className="block text-sm font-medium text-gray-300">Data de Vencimento (Opcional)</label>
              <input id="deal-data_vencimento" type="date" name="data_vencimento" value={formData.data_vencimento || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
            </div>
        </div>
        {/* Custom Fields */}
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
        {/* Observation */}
         <div>
            <label htmlFor="deal-observation" className="block text-sm font-medium text-gray-300">Observation</label>
            <textarea id="deal-observation" name="observation" value={formData.observation} onChange={handleChange} rows={3} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"></textarea>
        </div>
      </div>
  );
  
  const renderNotesTab = () => (
      <div>
        <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
            {(formData.notes || []).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(note => (
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
          {(deal?.history || []).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(entry => (
              <div key={entry.id} className="bg-gray-700/50 p-2 rounded">
                  <p className="text-sm text-gray-200 font-semibold">{entry.action}</p>
                  <p className="text-xs text-gray-400 text-right">{formatDateTime(entry.createdAt)}</p>
              </div>
          ))}
          {(!deal?.history || deal.history.length === 0) && <p className="text-gray-500 text-center py-4">No history recorded.</p>}
      </div>
  );

  const renderTasksTab = () => {
    const dealTasks = deal ? tasks.filter(t => t.dealId === deal.id) : [];
    return (
      <div>
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={() => onAddTaskForDeal(deal!.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>New Task</span>
          </button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {dealTasks.map(task => (
            <div key={task.id} className="bg-gray-700/50 p-3 rounded-md flex items-center justify-between">
              <div>
                <p className={`text-sm ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-200'}`}>{task.title}</p>
                {task.dueDate && <p className="text-xs text-gray-400">Due: {task.dueDate}</p>}
              </div>
              <input
                type="checkbox"
                checked={task.isCompleted}
                onChange={() => onUpdateTask(task.id, { isCompleted: !task.isCompleted })}
                className="form-checkbox h-5 w-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
          ))}
          {dealTasks.length === 0 && <p className="text-gray-500 text-center py-4">No tasks for this deal.</p>}
        </div>
      </div>
    );
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={deal ? 'Edit Deal' : 'New Deal'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                <button type="button" onClick={() => setActiveTab('details')} className={`${activeTab === 'details' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>Details</button>
                <button type="button" onClick={() => setActiveTab('notes')} className={`${activeTab === 'notes' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>Notes</button>
                {deal && <button type="button" onClick={() => setActiveTab('tasks')} className={`${activeTab === 'tasks' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>Tasks</button>}
                {deal && <button type="button" onClick={() => setActiveTab('history')} className={`${activeTab === 'history' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>History</button>}
            </nav>
        </div>
        
        <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
          {activeTab === 'details' && renderDetailsTab()}
          {activeTab === 'notes' && renderNotesTab()}
          {activeTab === 'tasks' && renderTasksTab()}
          {activeTab === 'history' && renderHistoryTab()}
        </div>


        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
            <div className="flex items-center space-x-2">
              {deal && (
                <>
                    <button type="button" onClick={() => onDelete(deal.id)} className="text-red-500 hover:text-red-400 font-bold py-2 px-4 rounded-lg hover:bg-red-500/10 flex items-center space-x-2">
                      <TrashIcon className="h-5 w-5"/>
                      <span>Delete</span>
                    </button>
                    <button type="button" onClick={handleCopyLink} className="text-gray-400 hover:text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 flex items-center space-x-2 transition-colors">
                      <LinkIcon className="h-5 w-5"/>
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                </>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {deal && <span className="text-sm text-gray-400">Last updated: {formatDateTime(deal.updatedAt)}</span>}
              <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Save Deal</button>
            </div>
        </div>
      </form>
    </Modal>
  );
};
export default DealModal;
