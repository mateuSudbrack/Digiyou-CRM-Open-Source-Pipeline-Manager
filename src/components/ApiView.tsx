import React, { useState } from 'react';
import { CrmData } from '../types';
import { crmService } from '../services/crmService';

interface ApiViewProps {
  data: CrmData;
  refreshData: () => Promise<void>;
  companyId: string;
}

const ApiEndpoint: React.FC<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    curlExample: string;
    responseExample?: string;
  }> = ({ method, path, description, curlExample, responseExample }) => {
    const methodColors = {
        GET: 'text-blue-400 border-blue-400',
        POST: 'text-green-400 border-green-400',
        PUT: 'text-yellow-400 border-yellow-400',
        DELETE: 'text-red-400 border-red-400',
        PATCH: 'text-orange-400 border-orange-400',
    };

    return (
        <div className="mb-8 p-4 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-4 mb-2">
                 <span className={`px-2 py-1 text-sm font-bold rounded-md border ${methodColors[method]}`}>{method}</span>
                 <code className="text-md font-mono bg-gray-700 px-2 py-1 rounded">{path}</code>
            </div>
            <p className="text-gray-400 mb-4">{description}</p>
            <div>
                <h4 className="font-semibold text-gray-200 mb-1">Example Request (cURL):</h4>
                <pre className="bg-gray-900 p-3 rounded-md text-sm text-gray-300 overflow-x-auto"><code>{curlExample}</code></pre>
            </div>
            {responseExample && <div className="mt-4">
                <h4 className="font-semibold text-gray-200 mb-1">Example Success Response:</h4>
                <pre className="bg-gray-900 p-3 rounded-md text-sm text-gray-300 overflow-x-auto"><code>{responseExample}</code></pre>
            </div>}
        </div>
    );
  };

const ApiView: React.FC<ApiViewProps> = ({ data, refreshData, companyId }) => {
  const { apiKey } = data;
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleRegenerateKey = async () => {
      if (window.confirm("Are you sure you want to regenerate your API key? Your old key will stop working immediately.")) {
          await crmService.regenerateApiKey();
          await refreshData();
          setShowKey(true);
      }
  };
  
  const API_BASE = `http://${window.location.hostname}:4029`;


  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">API & Documentation</h1>
      <p className="text-gray-400 mb-6">Integrate your CRM data with other applications using our REST API.</p>

      {/* Authentication Section */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8">
        <h2 className="text-xl font-bold mb-3">Authentication & Identification</h2>
        <p className="text-gray-400 mb-4">
          All API requests must include your Company ID in the <code className="bg-gray-700 px-1 py-0.5 rounded">X-Company-ID</code> header to identify which account's data to access. The Base URL for all endpoints is <code className="bg-gray-700 px-1 py-0.5 rounded">{API_BASE}</code>.
        </p>
        <div className="space-y-3">
            <div>
                <label htmlFor="company-id" className="block text-sm font-medium text-gray-300">Your Company ID:</label>
                <div className="flex items-center space-x-2 mt-1">
                    <input
                      id="company-id"
                      type="text"
                      readOnly
                      value={companyId}
                      className="flex-grow bg-gray-900/50 border border-gray-600 rounded-md py-2 px-3 text-white font-mono"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mt-4">Your API Key:</label>
                <p className="text-xs text-gray-500 mb-1">This key can be used for external services that require a unique API key for webhook authentication or other integrations.</p>
                <div className="flex items-center space-x-2">
                    <input
                      id="api-key"
                      type={showKey ? 'text' : 'password'}
                      readOnly
                      value={apiKey}
                      className="flex-grow bg-gray-900/50 border border-gray-600 rounded-md py-2 px-3 text-white font-mono"
                    />
                    <button onClick={() => setShowKey(!showKey)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">{showKey ? 'Hide' : 'Show'}</button>
                    <button onClick={handleCopyKey} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{copied ? 'Copied!' : 'Copy'}</button>
                </div>
                <button onClick={handleRegenerateKey} className="text-sm text-red-400 hover:text-red-300 hover:underline mt-2">Regenerate Key</button>
            </div>
        </div>
      </div>
      
       {/* Endpoints */}
      <div>
        <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Endpoints</h2>
        
        {/* DATA */}
        <h3 className="text-xl font-bold text-gray-300 mb-4">Data</h3>
        <ApiEndpoint
          method="GET"
          path="/api/data"
          description="Retrieves a single JSON object containing all CRM data (pipelines, deals, contacts, etc.) for your company."
          curlExample={`curl -X GET "${API_BASE}/api/data" \\\n-H "X-Company-ID: ${companyId}"`}
          responseExample={`{\n  "pipelines": [...],\n  "stages": [...],\n  "deals": [...],\n  "contacts": [...]\n  ...\n}`}
        />

        {/* DEALS */}
        <h3 className="text-xl font-bold text-blue-300 mt-12 mb-4">Deals</h3>
        <ApiEndpoint method="GET" path="/api/deals" description="Retrieves a list of all deals for your company." curlExample={`curl -X GET "${API_BASE}/api/deals" \\\n-H "X-Company-ID: ${companyId}"`} />
        <ApiEndpoint method="GET" path="/api/deals/{id}" description="Retrieves a single deal by its ID." curlExample={`curl -X GET "${API_BASE}/api/deals/deal_123" \\\n-H "X-Company-ID: ${companyId}"`} />
        <ApiEndpoint
          method="POST"
          path="/api/deals"
          description="Creates a new deal. See the data model in the Types section for all possible fields."
          curlExample={`curl -X POST "${API_BASE}/api/deals" \\\n-H "Content-Type: application/json" \\\n-H "X-Company-ID: ${companyId}" \\\n-d '{\n  "name": "New Service Contract",\n  "value": 25000,\n  "contactId": "ceo@globex.com",\n  "stageId": "stage_123"\n}'`}
        />
        <ApiEndpoint
          method="PATCH"
          path="/api/deals/{id}"
          description="Updates an existing deal. Provide only the fields you want to change."
          curlExample={`curl -X PATCH "${API_BASE}/api/deals/deal_123" \\\n-H "Content-Type: application/json" \\\n-H "X-Company-ID: ${companyId}" \\\n-d '{\n  "value": 30000,\n  "status": "WON"\n}'`}
        />
        <ApiEndpoint method="DELETE" path="/api/deals/{id}" description="Deletes a deal by its ID." curlExample={`curl -X DELETE "${API_BASE}/api/deals/deal_123" \\\n-H "X-Company-ID: ${companyId}"`} />
        
        {/* CONTACTS */}
        <h3 className="text-xl font-bold text-green-300 mt-12 mb-4">Contacts</h3>
        <ApiEndpoint method="GET" path="/api/contacts" description="Retrieves a list of all contacts for your company." curlExample={`curl -X GET "${API_BASE}/api/contacts" \\\n-H "X-Company-ID: ${companyId}"`} />
        <ApiEndpoint method="GET" path="/api/contacts/{id}" description="Retrieves a single contact by their email ID." curlExample={`curl -X GET "${API_BASE}/api/contacts/user@example.com" \\\n-H "X-Company-ID: ${companyId}"`} />
        <ApiEndpoint
          method="POST"
          path="/api/contacts"
          description="Creates a new contact. Email is required and used as the ID."
          curlExample={`curl -X POST "${API_BASE}/api/contacts" \\\n-H "Content-Type: application/json" \\\n-H "X-Company-ID: ${companyId}" \\\n-d '{\n  "name": "John Doe",\n  "email": "john.doe@example.com",\n  "phones": ["555-1234"]\n}'`}
        />
        <ApiEndpoint
          method="PATCH"
          path="/api/contacts/{id}"
          description="Updates an existing contact. Note: The email ID cannot be changed."
          curlExample={`curl -X PATCH "${API_BASE}/api/contacts/john.doe@example.com" \\\n-H "Content-Type: application/json" \\\n-H "X-Company-ID: ${companyId}" \\\n-d '{\n  "name": "Johnathan Doe",\n  "observation": "Prefers morning calls."\n}'`}
        />
        <ApiEndpoint method="DELETE" path="/api/contacts/{id}" description="Deletes a contact and all their associated deals." curlExample={`curl -X DELETE "${API_BASE}/api/contacts/john.doe@example.com" \\\n-H "X-Company-ID: ${companyId}"`} />

        {/* PIPELINES AND STAGES */}
        <h3 className="text-xl font-bold text-yellow-300 mt-12 mb-4">Pipelines & Stages</h3>
        <ApiEndpoint method="GET" path="/api/pipelines" description="Retrieves all pipelines for your company." curlExample={`curl -X GET "${API_BASE}/api/pipelines" \\\n-H "X-Company-ID: ${companyId}"`} />
        <ApiEndpoint method="POST" path="/api/pipelines" description="Creates a new pipeline." curlExample={`curl -X POST "${API_BASE}/api/pipelines" \\\n-H "Content-Type: application/json" \\\n-H "X-Company-ID: ${companyId}" \\\n-d '{"name": "Support Pipeline"}'`} />
        <ApiEndpoint method="DELETE" path="/api/pipelines/{id}" description="Deletes a pipeline and all its stages and deals." curlExample={`curl -X DELETE "${API_BASE}/api/pipelines/pipeline_123" \\\n-H "X-Company-ID: ${companyId}"`} />
        <ApiEndpoint method="POST" path="/api/stages" description="Creates a new stage within a pipeline." curlExample={`curl -X POST "${API_BASE}/api/stages" \\\n-H "Content-Type: application/json" \\\n-H "X-Company-ID: ${companyId}" \\\n-d '{"name": "Tier 1", "pipelineId": "pipeline_123"}'`} />
        <ApiEndpoint method="DELETE" path="/api/stages/{id}" description="Deletes a stage. Deals in it are moved to the first stage of the pipeline." curlExample={`curl -X DELETE "${API_BASE}/api/stages/stage_123" \\\n-H "X-Company-ID: ${companyId}"`} />

        {/* CUSTOM FIELDS */}
        <h3 className="text-xl font-bold text-purple-300 mt-12 mb-4">Custom Fields</h3>
        <ApiEndpoint method="GET" path="/api/customFieldDefinitions" description="Retrieves all custom field definitions for Deals." curlExample={`curl -X GET "${API_BASE}/api/customFieldDefinitions" \\\n-H "X-Company-ID: ${companyId}"`} />
        <ApiEndpoint method="POST" path="/api/customFieldDefinitions" description="Creates a new custom field for Deals." curlExample={`curl -X POST "${API_BASE}/api/customFieldDefinitions" \\\n-H "Content-Type: application/json" \\\n-H "X-Company-ID: ${companyId}" \\\n-d '{"name": "Lead Source"}'`} />
        <ApiEndpoint method="GET" path="/api/contactCustomFieldDefinitions" description="Retrieves all custom field definitions for Contacts." curlExample={`curl -X GET "${API_BASE}/api/contactCustomFieldDefinitions" \\\n-H "X-Company-ID: ${companyId}"`} />
        <ApiEndpoint method="POST" path="/api/contactCustomFieldDefinitions" description="Creates a new custom field for Contacts." curlExample={`curl -X POST "${API_BASE}/api/contactCustomFieldDefinitions" \\\n-H "Content-Type: application/json" \\\n-H "X-Company-ID: ${companyId}" \\\n-d '{"name": "Region"}'`} />

        {/* OTHER RESOURCES */}
        <h3 className="text-xl font-bold text-orange-300 mt-12 mb-4">Other Resources</h3>
        <ApiEndpoint method="GET" path="/api/tasks" description="Retrieves a list of all tasks." curlExample={`curl -X GET "${API_BASE}/api/tasks" \\\n-H "X-Company-ID: ${companyId}"`} />
        <ApiEndpoint method="POST" path="/api/tasks" description="Creates a new task." curlExample={`curl -X POST "${API_BASE}/api/tasks" \\\n-H "Content-Type: application/json" \\\n-H "X-Company-ID: ${companyId}" \\\n-d '{"title": "Follow up with Acme", "dueDate": "2024-12-31"}'`} />
        <ApiEndpoint method="GET" path="/api/automations" description="Retrieves all automations." curlExample={`curl -X GET "${API_BASE}/api/automations" \\\n-H "X-Company-ID: ${companyId}"`} />
      </div>
    </div>
  );
};

export default ApiView;