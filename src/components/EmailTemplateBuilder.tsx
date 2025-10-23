import React, { useState, useEffect } from 'react';
import { EmailTemplate, CustomFieldDefinition, ContactCustomFieldDefinition } from '../types';
import { PlusIcon } from './icons';

interface EmailTemplateBuilderProps {
  onSave: (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'companyId'> | EmailTemplate) => void;
  onBack: () => void;
  template: EmailTemplate | null;
  customFieldDefinitions: CustomFieldDefinition[];
  contactCustomFieldDefinitions: ContactCustomFieldDefinition[];
}

const getEmptyTemplate = (): Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'companyId'> => ({
    name: 'New Email Template',
    subject: 'A message about {{deal.name}}',
    body: `<h1>Hello {{contact.name}}!</h1>\n<p>This is an email regarding your deal: <strong>{{deal.name}}</strong>.</p>\n<p>Valued at: {{deal.value}}</p>`,
});

const PlaceholderList: React.FC<{ customFieldDefinitions: CustomFieldDefinition[], contactCustomFieldDefinitions: ContactCustomFieldDefinition[] }> = ({ customFieldDefinitions, contactCustomFieldDefinitions }) => {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const PlaceholderItem: React.FC<{ text: string }> = ({ text }) => (
        <li className="flex justify-between items-center text-sm py-1">
            <code className="text-gray-300">{text}</code>
            <button onClick={() => copyToClipboard(text)} className="text-xs bg-gray-600 hover:bg-gray-500 text-white font-semibold py-0.5 px-2 rounded">Copy</button>
        </li>
    );

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 h-full overflow-y-auto">
            <h3 className="text-lg font-bold mb-3 text-gray-200">Placeholders</h3>
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-gray-400 mb-1">Contact</h4>
                    <ul className="space-y-1">
                        <PlaceholderItem text="{{contact.name}}" />
                        <PlaceholderItem text="{{contact.email}}" />
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-400 mb-1">Deal</h4>
                    <ul className="space-y-1">
                        <PlaceholderItem text="{{deal.name}}" />
                        <PlaceholderItem text="{{deal.value}}" />
                    </ul>
                </div>
                 {contactCustomFieldDefinitions.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-gray-400 mb-1">Contact Custom Fields</h4>
                        <ul className="space-y-1">
                            {contactCustomFieldDefinitions.map(def => <PlaceholderItem key={def.id} text={`{{contact.custom.${def.name}}}`} />)}
                        </ul>
                    </div>
                )}
                {customFieldDefinitions.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-gray-400 mb-1">Deal Custom Fields</h4>
                        <ul className="space-y-1">
                            {customFieldDefinitions.map(def => <PlaceholderItem key={def.id} text={`{{custom.${def.name}}}`} />)}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};


const EmailTemplateBuilder: React.FC<EmailTemplateBuilderProps> = ({ onSave, onBack, template, customFieldDefinitions, contactCustomFieldDefinitions }) => {
    const [formData, setFormData] = useState(getEmptyTemplate());

    useEffect(() => {
        if (template) {
            setFormData(JSON.parse(JSON.stringify(template)));
        } else {
            setFormData(getEmptyTemplate());
        }
    }, [template]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 text-white h-[calc(100vh-4rem)] flex flex-col">
             <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                <div className="flex-shrink-0 flex justify-between items-center mb-6">
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="text-3xl font-bold bg-transparent focus:bg-gray-800 rounded-md p-2 -m-2 outline-none focus:ring-2 focus:ring-blue-500 w-1/2"
                        required
                    />
                    <div className="flex space-x-3">
                        <button type="button" onClick={onBack} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Back</button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Save Template</button>
                    </div>
                </div>

                <div className="flex-grow grid grid-cols-12 gap-6 overflow-hidden">
                    <div className="col-span-3 h-full">
                        <PlaceholderList 
                          customFieldDefinitions={customFieldDefinitions} 
                          contactCustomFieldDefinitions={contactCustomFieldDefinitions} 
                        />
                    </div>
                    <div className="col-span-9 h-full flex flex-col space-y-4">
                       <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">Email Subject</label>
                            <input
                                type="text"
                                name="subject"
                                id="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3"
                                required
                            />
                       </div>
                       <div className="flex-grow grid grid-cols-2 gap-4 overflow-hidden">
                          <div className="flex flex-col">
                              <label htmlFor="body" className="block text-sm font-medium text-gray-300 mb-1">HTML Body</label>
                              <textarea
                                name="body"
                                id="body"
                                value={formData.body}
                                onChange={handleChange}
                                className="w-full flex-grow bg-gray-900/50 border border-gray-600 rounded-md p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Write your email HTML here..."
                              />
                          </div>
                          <div className="flex flex-col">
                               <label className="block text-sm font-medium text-gray-300 mb-1">Live Preview</label>
                               <div className="flex-grow bg-white rounded-md border border-gray-600 overflow-hidden">
                                  <iframe
                                    srcDoc={formData.body}
                                    title="Email Preview"
                                    className="w-full h-full border-none"
                                    sandbox="allow-same-origin"
                                  />
                               </div>
                          </div>
                       </div>
                    </div>
                </div>
             </form>
        </div>
    );
};

export default EmailTemplateBuilder;
