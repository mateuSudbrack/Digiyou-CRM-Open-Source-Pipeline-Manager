

import React, { useState, useEffect, useMemo } from 'react';
import { produce } from 'immer';
import { Automation, Pipeline, Stage, TriggerType, ActionType, DealStatus, AutomationStep, ConditionField, ConditionOperator, ActionStep, ConditionStep, CustomFieldDefinition, EmailTemplate, Condition } from '../types';
import { PlusIcon, TrashIcon, MousePointerClickIcon, SparklesIcon, ScaleIcon } from './icons';
import EmailPreviewModal from './EmailPreviewModal';

interface AutomationBuilderViewProps {
  onSave: (automation: Omit<Automation, 'id' | 'companyId'> | Automation) => void;
  onBack: () => void;
  automation: Automation | null;
  pipelines: Pipeline[];
  stages: Stage[];
  customFieldDefinitions: CustomFieldDefinition[];
  emailTemplates: EmailTemplate[];
}

const getEmptyAction = (): ActionStep => ({
    id: `step_${Date.now()}_${Math.random()}`,
    type: 'ACTION',
    actionType: ActionType.CREATE_TASK,
    actionConfig: {
        taskTitle: 'Follow up on {{deal.name}}',
        taskDueDateOffsetDays: '3',
    },
});

const getEmptyCondition = (): ConditionStep => ({
    id: `step_${Date.now()}_${Math.random()}`,
    type: 'CONDITION',
    condition: {
        field: ConditionField.DEAL_VALUE,
        operator: ConditionOperator.GREATER_THAN,
        value: 1000,
    },
    onTrue: [],
    onFalse: [],
});


const getEmptyAutomation = (pipelines: Pipeline[], stages: Stage[]): Omit<Automation, 'id' | 'companyId'> => {
    const firstPipelineId = pipelines[0]?.id || '';
    const firstStageId = stages.filter(s => s.pipelineId === firstPipelineId)[0]?.id || '';

    return {
        name: 'New Automation',
        triggerType: TriggerType.DEAL_STAGE_CHANGED,
        triggerConfig: { pipelineId: firstPipelineId, stageId: firstStageId },
        steps: [getEmptyAction()],
    };
};

const PlaceholderHelp = () => (
    <p className="text-xs text-gray-400 mt-1">
        Placeholders like <code>{"{{deal.name}}"}</code>, <code>{"{{contact.name}}"}</code>, <code>{"{{custom.FieldName}}"}</code>, and <code>{"{{contact.custom.FieldName}}"}</code> are supported.
    </p>
);

const WhatsAppPlaceholderHelp = () => (
    <p className="text-xs text-gray-400 mt-1">
        Use <code>{"{{contact.phone}}"}</code> for the deal's contact phone number. Other placeholders like <code>{"{{deal.name}}"}</code> are also supported in the message body.
    </p>
);


const AutomationBuilderView: React.FC<AutomationBuilderViewProps> = ({ onSave, onBack, automation, pipelines, stages, customFieldDefinitions, emailTemplates }) => {
  const [formData, setFormData] = useState<Omit<Automation, 'id' | 'companyId'> | Automation>(getEmptyAutomation(pipelines, stages));
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    if (automation) {
      setFormData(JSON.parse(JSON.stringify(automation)));
    } else {
      setFormData(getEmptyAutomation(pipelines, stages));
    }
  }, [automation, pipelines, stages]);

  const triggerStages = useMemo(() => {
    if (formData.triggerType !== TriggerType.DEAL_STAGE_CHANGED || !formData.triggerConfig.pipelineId) return [];
    return stages.filter(s => s.pipelineId === formData.triggerConfig.pipelineId).sort((a, b) => a.order - b.order);
  }, [stages, formData.triggerConfig.pipelineId, formData.triggerType]);

  const handleUpdateStep = (path: (string | number)[], newStepData: Partial<AutomationStep>) => {
      setFormData(
          produce((draft: any) => {
              let current: any = draft;
              for (let i = 0; i < path.length - 1; i++) {
                  current = current[path[i]];
              }
              const lastKey = path[path.length - 1];
              const index = typeof lastKey === 'number' ? lastKey : parseInt(String(lastKey), 10);
              if(current[index]) {
                  // This is a shallow merge, for nested objects like actionConfig, we need to merge deeply
                  const existingStep = current[index];
                  for(const key in newStepData) {
                      if (typeof (newStepData as any)[key] === 'object' && (newStepData as any)[key] !== null && !Array.isArray((newStepData as any)[key])) {
                           (existingStep as any)[key] = { ...(existingStep as any)[key], ...(newStepData as any)[key] };
                      } else {
                          (existingStep as any)[key] = (newStepData as any)[key];
                      }
                  }
              }
          })
      );
  };

  const handleAddStep = (path: (string | number)[], newStep: AutomationStep) => {
    setFormData(
        produce((draft: any) => {
            let parent: any = draft;
            for (const key of path) {
                parent = parent[key];
            }
            parent.push(newStep);
        })
    );
  };
  
  const handleDeleteStep = (path: (string | number)[]) => {
     setFormData(
        produce((draft: any) => {
            let current: any = draft;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            const lastKey = path[path.length - 1];
            current.splice(lastKey, 1);
        })
    );
  }

  const handlePreview = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (!template) return;

    let previewContent = template.body
        .replace(/\{\{deal\.name\}\}/gi, 'Sample Deal: Website Redesign')
        .replace(/\{\{deal\.value\}\}/gi, 'R$ 5.000,00')
        .replace(/\{\{contact\.name\}\}/gi, 'John Doe')
        .replace(/\{\{contact\.email\}\}/gi, 'john.doe@example.com')
        .replace(/\{\{custom\.([^}]+)\}\}/gi, '(Custom Deal Field)')
        .replace(/\{\{contact\.custom\.([^}]+)\}\}/gi, '(Contact Custom Field)');
    
    setPreviewHtml(previewContent);
    setIsPreviewOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white max-w-5xl mx-auto">
      <form onSubmit={handleSubmit}>
         <div className="flex justify-between items-center mb-6">
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="text-3xl font-bold bg-transparent focus:bg-gray-800 rounded-md p-2 -m-2 outline-none focus:ring-2 focus:ring-blue-500 w-1/2" required />
            <div className="flex space-x-3">
                <button type="button" onClick={onBack} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Back</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Save Automation</button>
            </div>
        </div>
        <div className="space-y-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <TriggerNode formData={formData} setFormData={setFormData} pipelines={pipelines} stages={stages} triggerStages={triggerStages} />
            <StepSequence steps={formData.steps} path={['steps']} onUpdate={handleUpdateStep} onAdd={handleAddStep} onDelete={handleDeleteStep} pipelines={pipelines} stages={stages} customFieldDefinitions={customFieldDefinitions} emailTemplates={emailTemplates} onPreview={handlePreview} />
        </div>
      </form>
       <EmailPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        htmlContent={previewHtml}
      />
    </div>
  );
};

// --- Sub-components for the Builder ---

const TriggerNode: React.FC<{formData: any, setFormData: any, pipelines: Pipeline[], stages: Stage[], triggerStages: Stage[]}> = ({ formData, setFormData, pipelines, triggerStages }) => {
    const handleTriggerChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        const [section, key] = name.split('.');
        if (section === 'triggerConfig') {
            setFormData(produce((draft: any) => { draft.triggerConfig[key] = value; }));
        }
    };
    
    const handleTriggerTypeChange = (newType: TriggerType) => {
        const newConfig = {};
        setFormData({...formData, triggerType: newType, triggerConfig: newConfig});
    }

    return (
        <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-4">
                <MousePointerClickIcon className="h-6 w-6 text-blue-400"/>
                <h3 className="text-lg font-semibold text-blue-400">Trigger</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select value={formData.triggerType} onChange={e => handleTriggerTypeChange(e.target.value as TriggerType)} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3">
                    <option value={TriggerType.DEAL_STAGE_CHANGED}>Deal enters a stage</option>
                    <option value={TriggerType.DEAL_CREATED}>Deal is created</option>
                    <option value={TriggerType.DEAL_ENTERED_PIPELINE}>Deal enters a pipeline</option>
                    <option value={TriggerType.NOTE_ADDED_TO_DEAL}>Note is added to deal</option>
                    <option value={TriggerType.TASK_CREATED}>Task is created</option>
                    <option value={TriggerType.TASK_COMPLETED}>Task is completed</option>
                    <option value={TriggerType.DEAL_DUE_DATE_APPROACHING}>Deal due date is approaching</option>
                    <option value={TriggerType.DEAL_STATUS_UPDATED}>Deal status is updated</option>
                </select>
                {formData.triggerType === TriggerType.DEAL_STAGE_CHANGED && (
                     <>
                        <select name="triggerConfig.pipelineId" value={formData.triggerConfig.pipelineId} onChange={handleTriggerChange} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3">
                            {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select name="triggerConfig.stageId" value={formData.triggerConfig.stageId} onChange={handleTriggerChange} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3" disabled={triggerStages.length === 0}>
                            {triggerStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                     </>
                )}
                {formData.triggerType === TriggerType.DEAL_ENTERED_PIPELINE && (
                    <select name="triggerConfig.pipelineId" value={formData.triggerConfig.pipelineId || ''} onChange={handleTriggerChange} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3">
                        <option value="" disabled>Select a pipeline</option>
                        {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                )}
                {formData.triggerType === TriggerType.DEAL_DUE_DATE_APPROACHING && (
                    <div className="flex items-center space-x-2">
                        <input name="triggerConfig.daysBefore" type="number" value={formData.triggerConfig.daysBefore || ''} onChange={handleTriggerChange} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 w-24" min="0" required />
                        <span className="text-gray-300">days before the due date.</span>
                    </div>
                )}
                {formData.triggerType === TriggerType.DEAL_STATUS_UPDATED && (
                    <select name="triggerConfig.status" value={formData.triggerConfig.status || ''} onChange={handleTriggerChange} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3">
                        <option value="" disabled>Select a status</option>
                        <option value={DealStatus.WON}>Won</option>
                        <option value={DealStatus.LOST}>Lost</option>
                    </select>
                )}
            </div>
        </div>
    )
};

const StepSequence: React.FC<{steps: AutomationStep[], path: (string|number)[], onUpdate: any, onAdd: any, onDelete: any, pipelines: Pipeline[], stages: Stage[], customFieldDefinitions: CustomFieldDefinition[], emailTemplates: EmailTemplate[], onPreview: (templateId: string) => void}> = ({ steps, path, onUpdate, onAdd, onDelete, pipelines, stages, customFieldDefinitions, emailTemplates, onPreview }) => {
    return (
        <div className="space-y-2">
            {steps.map((step, index) => (
                <div key={step.id}>
                    <AddStepButton onAdd={(type) => onAdd(path, type === 'ACTION' ? getEmptyAction() : getEmptyCondition())} />
                    {step.type === 'ACTION' ? (
                        <ActionNode step={step} path={[...path, index]} onUpdate={onUpdate} onDelete={onDelete} pipelines={pipelines} stages={stages} emailTemplates={emailTemplates} onPreview={onPreview} customFieldDefinitions={customFieldDefinitions} />
                    ) : (
                        <ConditionNode step={step} path={[...path, index]} onUpdate={onUpdate} onDelete={onDelete} onAdd={onAdd} pipelines={pipelines} stages={stages} customFieldDefinitions={customFieldDefinitions} emailTemplates={emailTemplates} onPreview={onPreview} />
                    )}
                </div>
            ))}
            <AddStepButton onAdd={(type) => onAdd(path, type === 'ACTION' ? getEmptyAction() : getEmptyCondition())} />
        </div>
    )
};

const ActionNode: React.FC<{step: ActionStep, path: (string|number)[], onUpdate: any, onDelete: any, pipelines: Pipeline[], stages: Stage[], emailTemplates: EmailTemplate[], onPreview: (templateId: string) => void, customFieldDefinitions: CustomFieldDefinition[]}> = ({ step, path, onUpdate, onDelete, pipelines, stages, emailTemplates, onPreview, customFieldDefinitions }) => {
    const handleActionChange = (newConfig: any) => onUpdate(path, { actionConfig: newConfig });
    const handleActionTypeChange = (newType: ActionType) => onUpdate(path, { actionType: newType, actionConfig: {} });

    const actionStages = useMemo(() => {
        if (!step.actionConfig.pipelineId) return [];
        return stages.filter(s => s.pipelineId === step.actionConfig.pipelineId).sort((a,b) => a.order - b.order);
    }, [stages, step.actionConfig.pipelineId]);

    return (
        <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 relative">
             <button type="button" onClick={() => onDelete(path)} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400"><TrashIcon className="h-4 w-4" /></button>
            <div className="flex items-center space-x-3 mb-4">
                <SparklesIcon className="h-6 w-6 text-green-400"/>
                <h3 className="text-lg font-semibold text-green-400">Action</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select value={step.actionType} onChange={e => handleActionTypeChange(e.target.value as ActionType)} className="sm:col-span-2 bg-gray-700 border border-gray-600 rounded-md py-2 px-3">
                    <option value={ActionType.SEND_WHATSAPP}>Send WhatsApp Message</option>
                    <option value={ActionType.WAIT}>Wait</option>
                    <option value={ActionType.MOVE_DEAL_TO_STAGE}>Move Deal to Stage</option>
                    <option value={ActionType.CREATE_TASK}>Create Task</option>
                    <option value={ActionType.ADD_NOTE}>Add Note to Deal</option>
                    <option value={ActionType.SEND_EMAIL}>Send Email</option>
                    <option value={ActionType.UPDATE_DEAL_STATUS}>Update Deal Status</option>
                    <option value={ActionType.SEND_WEBHOOK}>Send a Webhook</option>
                    <option value={ActionType.CREATE_DEAL}>Create a new Deal</option>
                    <option value={ActionType.CREATE_CALENDAR_NOTE}>Create Calendar Note</option>
                </select>

                {/* --- ACTION CONFIG FIELDS --- */}
                {step.actionType === 'SEND_WHATSAPP' && (
                    <>
                        <div>
                            <input type="text" value={step.actionConfig.whatsappNumber || ''} onChange={e => handleActionChange({ ...step.actionConfig, whatsappNumber: e.target.value })} placeholder="Recipient Phone Number" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3" />
                             <WhatsAppPlaceholderHelp />
                        </div>
                        <div className="sm:col-span-2">
                           <textarea value={step.actionConfig.whatsappText || ''} onChange={e => handleActionChange({ ...step.actionConfig, whatsappText: e.target.value })} placeholder="Message content..." className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3" rows={3}/>
                           <PlaceholderHelp />
                        </div>
                    </>
                )}
                {step.actionType === 'WAIT' && (
                     <div className="sm:col-span-2 space-y-3">
                        <select value={step.actionConfig.waitMode || 'DURATION'} onChange={e => handleActionChange({ ...step.actionConfig, waitMode: e.target.value, waitDuration: 1, waitUnit: 'DAYS', waitCondition: undefined })} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 w-full">
                            <option value="DURATION">Wait for a set amount of time</option>
                            <option value="CONDITION">Wait until conditions are met</option>
                        </select>
                        
                        {(!step.actionConfig.waitMode || step.actionConfig.waitMode === 'DURATION') && (
                            <div className="flex items-center space-x-2">
                                <input type="number" value={step.actionConfig.waitDuration || 1} onChange={e => handleActionChange({ ...step.actionConfig, waitDuration: parseInt(e.target.value, 10) || 1 })} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 w-24" min="1" required />
                                <select value={step.actionConfig.waitUnit || 'DAYS'} onChange={e => handleActionChange({ ...step.actionConfig, waitUnit: e.target.value })} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3">
                                    <option value="MINUTES">Minutes</option>
                                    <option value="HOURS">Hours</option>
                                    <option value="DAYS">Days</option>
                                </select>
                            </div>
                        )}

                        {step.actionConfig.waitMode === 'CONDITION' && (
                             <ConditionBuilder 
                                condition={step.actionConfig.waitCondition || getEmptyCondition().condition} 
                                onConditionChange={(newCondition) => handleActionChange({ ...step.actionConfig, waitCondition: newCondition })}
                                pipelines={pipelines}
                                customFieldDefinitions={customFieldDefinitions}
                            />
                        )}
                    </div>
                )}
                {step.actionType === 'MOVE_DEAL_TO_STAGE' && (
                    <>
                        <select value={step.actionConfig.pipelineId || ''} onChange={e => handleActionChange({ ...step.actionConfig, pipelineId: e.target.value, stageId: '' })} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3">
                            <option value="" disabled>Select Pipeline</option>
                            {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select value={step.actionConfig.stageId || ''} onChange={e => handleActionChange({ ...step.actionConfig, stageId: e.target.value })} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3" disabled={!step.actionConfig.pipelineId}>
                            <option value="" disabled>Select Stage</option>
                            {actionStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </>
                )}
                {step.actionType === 'CREATE_TASK' && (
                    <>
                        <div>
                            <input type="text" value={step.actionConfig.taskTitle || ''} onChange={e => handleActionChange({ ...step.actionConfig, taskTitle: e.target.value })} placeholder="Task Title" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3" />
                            <PlaceholderHelp />
                        </div>
                        <input type="number" value={step.actionConfig.taskDueDateOffsetDays || ''} onChange={e => handleActionChange({ ...step.actionConfig, taskDueDateOffsetDays: e.target.value })} placeholder="Days until due" className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3" />
                    </>
                )}
                 {step.actionType === 'ADD_NOTE' && (
                     <div className="sm:col-span-2">
                        <textarea value={step.actionConfig.noteContent || ''} onChange={e => handleActionChange({ ...step.actionConfig, noteContent: e.target.value })} placeholder="Note content..." className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3" rows={3}/>
                        <PlaceholderHelp />
                     </div>
                )}
                 {step.actionType === 'SEND_EMAIL' && (
                    <div className="sm:col-span-2 flex items-center space-x-2">
                        <select 
                            value={step.actionConfig.templateId || ''} 
                            onChange={e => handleActionChange({ ...step.actionConfig, templateId: e.target.value })} 
                            className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3"
                        >
                            <option value="" disabled>Select an email template</option>
                            {emailTemplates.map(template => (
                                <option key={template.id} value={template.id}>{template.name}</option>
                            ))}
                        </select>
                        <button 
                            type="button" 
                            onClick={() => onPreview(step.actionConfig.templateId || '')} 
                            className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-3 rounded-md text-sm"
                            disabled={!step.actionConfig.templateId}
                        >
                            Preview
                        </button>
                    </div>
                )}
                 {step.actionType === 'UPDATE_DEAL_STATUS' && (
                    <select value={step.actionConfig.status || ''} onChange={e => handleActionChange({ ...step.actionConfig, status: e.target.value })} className="sm:col-span-2 bg-gray-700 border border-gray-600 rounded-md py-2 px-3">
                        <option value="" disabled>Select Status</option>
                        <option value={DealStatus.WON}>Won</option>
                        <option value={DealStatus.LOST}>Lost</option>
                    </select>
                )}
                {step.actionType === 'SEND_WEBHOOK' && (
                     <div className="sm:col-span-2">
                        <input type="url" value={step.actionConfig.webhookUrl || ''} onChange={e => handleActionChange({ ...step.actionConfig, webhookUrl: e.target.value })} placeholder="Webhook URL" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3" />
                        <p className="text-xs text-gray-400 mt-1">The full deal object will be sent. You can use placeholders in the URL.</p>
                     </div>
                )}
                {step.actionType === 'CREATE_DEAL' && (
                    <>
                        <div>
                           <input type="text" value={step.actionConfig.dealName || ''} onChange={e => handleActionChange({ ...step.actionConfig, dealName: e.target.value })} placeholder="New Deal Name" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3" />
                           <p className="text-xs text-gray-400 mt-1">e.g., Follow-up for {"{{deal.name}}"} </p>
                        </div>
                         <div>
                           <input type="text" value={step.actionConfig.dealValue || ''} onChange={e => handleActionChange({ ...step.actionConfig, dealValue: e.target.value })} placeholder="Value" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3" />
                           <p className="text-xs text-gray-400 mt-1">e.g., 1000 or {"{{deal.value}}"} to copy</p>
                        </div>
                        <select value={step.actionConfig.pipelineId || ''} onChange={e => handleActionChange({ ...step.actionConfig, pipelineId: e.target.value, stageId: '' })} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3">
                            <option value="">Select Pipeline</option>
                            {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select value={step.actionConfig.stageId || ''} onChange={e => handleActionChange({ ...step.actionConfig, stageId: e.target.value })} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3" disabled={!step.actionConfig.pipelineId}>
                            <option value="">Select Stage</option>
                            {actionStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <p className="text-xs text-gray-400 sm:col-span-2 -mt-2">The new deal will be linked to the same contact as the triggering deal.</p>
                    </>
                )}
                {step.actionType === 'CREATE_CALENDAR_NOTE' && (
                    <>
                        <div className="sm:col-span-2">
                            <input type="text" value={step.actionConfig.noteTitle || ''} onChange={e => handleActionChange({ ...step.actionConfig, noteTitle: e.target.value })} placeholder="Note Title" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3" />
                            <PlaceholderHelp />
                        </div>
                        <textarea value={step.actionConfig.calendarNoteContent || ''} onChange={e => handleActionChange({ ...step.actionConfig, calendarNoteContent: e.target.value })} placeholder="Note Content (optional)" className="sm:col-span-2 bg-gray-700 border border-gray-600 rounded-md py-2 px-3" rows={2}/>
                        <div className="sm:col-span-2">
                            <input type="number" value={step.actionConfig.noteDateOffsetDays || ''} onChange={e => handleActionChange({ ...step.actionConfig, noteDateOffsetDays: e.target.value })} placeholder="Days in future for note" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3" />
                            <p className="text-xs text-gray-400 mt-1">e.g., 7 would schedule the note for one week from today.</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const ConditionNode: React.FC<{step: ConditionStep, path: any, onUpdate: any, onDelete: any, onAdd: any, pipelines: Pipeline[], stages: Stage[], customFieldDefinitions: CustomFieldDefinition[], emailTemplates: EmailTemplate[], onPreview: (templateId: string) => void}> = ({ step, path, onUpdate, onDelete, onAdd, pipelines, stages, customFieldDefinitions, emailTemplates, onPreview }) => {
    const handleConditionChange = (newCondition: Partial<Condition>) => {
        onUpdate(path, { condition: newCondition });
    };

    return (
         <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 relative">
             <button type="button" onClick={() => onDelete(path)} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400"><TrashIcon className="h-4 w-4" /></button>
            <div className="flex items-center space-x-3 mb-4">
                <ScaleIcon className="h-6 w-6 text-yellow-400"/>
                <h3 className="text-lg font-semibold text-yellow-400">If / Then</h3>
            </div>
            {/* Condition Config */}
            <ConditionBuilder 
                condition={step.condition} 
                onConditionChange={handleConditionChange}
                pipelines={pipelines}
                customFieldDefinitions={customFieldDefinitions}
            />

            {/* Branches */}
            <div className="grid grid-cols-2 gap-4 mt-4">
                {/* YES Branch */}
                <div className="border-t-2 border-green-500 pt-3">
                    <h4 className="text-md font-bold text-green-400 mb-2">If Yes</h4>
                    <StepSequence steps={step.onTrue} path={[...path, 'onTrue']} onUpdate={onUpdate} onAdd={onAdd} onDelete={onDelete} pipelines={pipelines} stages={stages} customFieldDefinitions={customFieldDefinitions} emailTemplates={emailTemplates} onPreview={onPreview} />
                </div>
                {/* NO Branch */}
                 <div className="border-t-2 border-red-500 pt-3">
                    <h4 className="text-md font-bold text-red-400 mb-2">If No</h4>
                    <StepSequence steps={step.onFalse} path={[...path, 'onFalse']} onUpdate={onUpdate} onAdd={onAdd} onDelete={onDelete} pipelines={pipelines} stages={stages} customFieldDefinitions={customFieldDefinitions} emailTemplates={emailTemplates} onPreview={onPreview} />
                </div>
            </div>
        </div>
    );
};

const ConditionBuilder: React.FC<{condition: Condition, onConditionChange: (newCondition: Partial<Condition>) => void, pipelines: Pipeline[], customFieldDefinitions: CustomFieldDefinition[]}> = ({ condition, onConditionChange, pipelines, customFieldDefinitions }) => {
     const handleFieldChange = (selectedValue: string) => {
        let newField: ConditionField;
        let newCustomFieldId: string | undefined;

        if (selectedValue.startsWith('custom_')) {
            newField = ConditionField.DEAL_CUSTOM_FIELD;
            newCustomFieldId = selectedValue.replace('custom_', '');
        } else {
            newField = selectedValue as ConditionField;
            newCustomFieldId = undefined;
        }

        // Reset operator and value when field changes
        onConditionChange({
            field: newField,
            customFieldId: newCustomFieldId,
            operator: newField === ConditionField.DEAL_DUE_DATE ? ConditionOperator.ON_OR_AFTER : ConditionOperator.EQUALS,
            value: ''
        });
    };
    
    const selectedValue = condition.field === ConditionField.DEAL_CUSTOM_FIELD 
        ? `custom_${condition.customFieldId}` 
        : condition.field;

    const operatorOptions = useMemo(() => {
        switch (condition.field) {
            case ConditionField.DEAL_DUE_DATE:
                return [
                    { value: ConditionOperator.ON_OR_AFTER, label: 'is on or after' },
                    { value: ConditionOperator.ON_OR_BEFORE, label: 'is on or before' },
                    { value: ConditionOperator.EQUALS, label: 'is equal to' },
                    { value: ConditionOperator.NOT_EQUALS, label: 'is not equal to' },
                ];
            case ConditionField.DEAL_VALUE:
                return [
                    { value: ConditionOperator.GREATER_THAN, label: 'is greater than' },
                    { value: ConditionOperator.LESS_THAN, label: 'is less than' },
                    { value: ConditionOperator.EQUALS, label: 'is equal to' },
                    { value: ConditionOperator.NOT_EQUALS, label: 'is not equal to' },
                ];
            default:
                return [
                    { value: ConditionOperator.EQUALS, label: 'is equal to' },
                    { value: ConditionOperator.NOT_EQUALS, label: 'is not equal to' },
                ];
        }
    }, [condition.field]);
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center p-2 rounded-md bg-gray-800/50">
            <select value={selectedValue} onChange={e => handleFieldChange(e.target.value)} className="bg-gray-700 border-gray-600 rounded-md py-2 px-3">
                <optgroup label="Standard Fields">
                    <option value={ConditionField.DEAL_VALUE}>Deal Value</option>
                    <option value={ConditionField.DEAL_STATUS}>Deal Status</option>
                    <option value={ConditionField.DEAL_PIPELINE}>Deal Pipeline</option>
                    <option value={ConditionField.DEAL_DUE_DATE}>Deal Due Date</option>
                </optgroup>
                {customFieldDefinitions.length > 0 && (
                    <optgroup label="Custom Fields">
                        {customFieldDefinitions.map(def => (
                            <option key={def.id} value={`custom_${def.id}`}>{def.name}</option>
                        ))}
                    </optgroup>
                )}
            </select>
            <select value={condition.operator} onChange={e => onConditionChange({...condition, operator: e.target.value as ConditionOperator})} className="bg-gray-700 border-gray-600 rounded-md py-2 px-3">
                {operatorOptions.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
            </select>
            
            {condition.field === 'DEAL_DUE_DATE' && (
                <input 
                    type="date" 
                    value={condition.value} 
                    onChange={e => onConditionChange({...condition, value: e.target.value})} 
                    className="bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" 
                />
            )}
            {condition.field === 'DEAL_VALUE' && <input type="number" value={condition.value} onChange={e => onConditionChange({...condition, value: e.target.value})} className="bg-gray-700 border-gray-600 rounded-md py-2 px-3" />}
            {condition.field === 'DEAL_STATUS' && <select value={condition.value} onChange={e => onConditionChange({...condition, value: e.target.value})} className="bg-gray-700 border-gray-600 rounded-md py-2 px-3"><option value="OPEN">Open</option><option value="WON">Won</option><option value="LOST">Lost</option></select>}
            {condition.field === 'DEAL_PIPELINE' && <select value={condition.value} onChange={e => onConditionChange({...condition, value: e.target.value})} className="bg-gray-700 border-gray-600 rounded-md py-2 px-3">{pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
            {condition.field === 'DEAL_CUSTOM_FIELD' && <input type="text" value={condition.value} onChange={e => onConditionChange({...condition, value: e.target.value})} placeholder="Value to check" className="bg-gray-700 border-gray-600 rounded-md py-2 px-3" />}
        </div>
    );
};

const AddStepButton: React.FC<{ onAdd: (type: 'ACTION' | 'CONDITION') => void }> = ({ onAdd }) => (
  <div className="flex justify-center items-center my-2 group relative h-8">
    <div className="h-full w-0.5 bg-gray-600"></div>
    <div className="absolute">
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button type="button" onClick={() => onAdd('ACTION')} className="bg-green-600 hover:bg-green-700 p-2 rounded-l-full text-white z-10" title="Add Action"><PlusIcon className="h-5 w-5"/></button>
        <div className="h-px w-8 bg-gray-600"></div>
        <button type="button" onClick={() => onAdd('CONDITION')} className="bg-yellow-600 hover:bg-yellow-700 p-2 rounded-r-full text-white z-10" title="Add Condition"><ScaleIcon className="h-5 w-5"/></button>
      </div>
    </div>
  </div>
);


export default AutomationBuilderView;