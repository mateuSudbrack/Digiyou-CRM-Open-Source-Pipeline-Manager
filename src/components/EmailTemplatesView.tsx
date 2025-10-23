import React from 'react';
import { EmailTemplate } from '../types';
import { PlusIcon, EditIcon, TrashIcon, ClipboardDocumentListIcon } from './icons';

interface EmailTemplatesViewProps {
  templates: EmailTemplate[];
  onAddTemplate: () => void;
  onEditTemplate: (template: EmailTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
}

const EmailTemplatesView: React.FC<EmailTemplatesViewProps> = ({ templates, onAddTemplate, onEditTemplate, onDeleteTemplate }) => {
    
  const formatDateTime = (isoString: string): string => {
      if (!isoString) return '';
      return new Date(isoString).toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
      });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <button
          onClick={onAddTemplate}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Template</span>
        </button>
      </div>
        
      {templates.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-xl font-semibold text-white">No email templates yet</h3>
            <p className="mt-1 text-sm text-gray-400">Create your first reusable email template for automations.</p>
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
          <ul className="divide-y divide-gray-700">
            {templates.map(template => (
              <li key={template.id} className="p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors">
                <div>
                  <p className="font-bold text-lg">{template.name}</p>
                  <p className="text-sm text-gray-400 mt-1">Subject: {template.subject}</p>
                   <p className="text-xs text-gray-500 mt-2">Last updated: {formatDateTime(template.updatedAt)}</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => onEditTemplate(template)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-600" aria-label={`Edit ${template.name}`}>
                    <EditIcon />
                  </button>
                  <button onClick={() => onDeleteTemplate(template.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-600" aria-label={`Delete ${template.name}`}>
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EmailTemplatesView;
