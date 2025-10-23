import React, { useState, useMemo, useEffect } from 'react';
import { DealImportPayload, CustomFieldDefinition, ContactCustomFieldDefinition, Pipeline, Stage, DealImportData } from '../types';
import Modal from './Modal';
import { CheckCircleIcon, XMarkIcon, PlusIcon, TrashIcon } from './icons';

interface ImportDealsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (payload: DealImportPayload) => Promise<{ successCount: number; errorCount: number; errors: string[] }>;
  customFieldDefs: CustomFieldDefinition[];
  contactCustomFieldDefs: ContactCustomFieldDefinition[];
  pipelines: Pipeline[];
  stages: Stage[];
}

type ImportStep = 'upload' | 'map' | 'preview' | 'result';
type MappingTarget = {
    crmField: string; // e.g., 'dealName', 'ignore', '__new_deal_field__'
    newFieldName?: string;
    format?: string; // Added for formatting
};

const formattingOptions = [
    { value: 'none', label: 'None' },
    { value: 'date_dd_mm_yyyy', label: 'Date (DD/MM/YYYY)' },
    { value: 'date_mm_dd_yyyy', label: 'Date (MM/DD/YYYY)' },
    { value: 'number_dot_decimal', label: 'Number (Dot as Decimal)' },
    { value: 'number_comma_decimal', label: 'Number (Comma as Decimal)' },
];

const parseCSV = (csvText: string): { headers: string[]; data: string[][] } => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    // Normalize line endings
    const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < normalizedText.length; i++) {
        const char = normalizedText[i];

        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < normalizedText.length && normalizedText[i + 1] === '"') {
                    currentField += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentRow.push(currentField.trim());
                currentField = '';
            } else if (char === '\n') {
                currentRow.push(currentField.trim());
                if (currentRow.length > 0 && currentRow.some(f => f)) {
                   rows.push(currentRow);
                }
                currentRow = [];
                currentField = '';
            } else {
                currentField += char;
            }
        }
    }
    // Add the last field and row if the file doesn't end with a newline
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f)) {
            rows.push(currentRow);
        }
    }
    
    if (rows.length === 0) return { headers: [], data: [] };
    
    const headers = rows[0];
    const data = rows.slice(1);
    
    return { headers, data };
};


const ImportDealsModal: React.FC<ImportDealsModalProps> = ({ isOpen, onClose, onImport, customFieldDefs, contactCustomFieldDefs, pipelines, stages }) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<{ [columnIndex: number]: MappingTarget[] }>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number; errorCount: number; errors: string[] } | null>(null);
  const [fileName, setFileName] = useState('');
  const [defaultPipelineId, setDefaultPipelineId] = useState<string>(pipelines[0]?.id || '');
  const [defaultStageId, setDefaultStageId] = useState<string>('');

  const requiredFields = ['dealName', 'dealValue', 'contactEmail'];
  const requiredFieldLabels: { [key: string]: string } = {
      dealName: 'Deal Name', dealValue: 'Deal Value', contactEmail: 'Contact Email'
  };

  const availableCrmFields = useMemo(() => [
    { value: 'dealName', label: 'Deal Name' },
    { value: 'dealValue', label: 'Deal Value' },
    { value: 'contactEmail', label: 'Contact Email' },
    { value: 'contactName', label: 'Contact Name' },
    { value: 'pipelineName', label: 'Pipeline Name' },
    { value: 'stageName', label: 'Stage Name' },
    { value: 'data_vencimento', label: 'Due Date (dd/MM/yyyy)' },
    ...customFieldDefs.map(def => ({ value: def.name, label: `Deal Field: ${def.name}` })),
    ...contactCustomFieldDefs.map(def => ({ value: def.name, label: `Contact Field: ${def.name}` })),
  ], [customFieldDefs, contactCustomFieldDefs]);

  const aliasMap: { [key: string]: string } = {
      'email': 'contactEmail', 'e-mail': 'contactEmail', 'correio eletrônico': 'contactEmail',
      'valor': 'dealValue', 'value': 'dealValue',
      'nome do negócio': 'dealName', 'deal name': 'dealName', 'negócio': 'dealName',
      'nome do contato': 'contactName', 'contato': 'contactName', 'contact': 'contactName', 'empresa': 'contactName',
      'pipeline': 'pipelineName', 'funil': 'pipelineName',
      'etapa': 'stageName', 'stage': 'stageName',
      'vencimento': 'data_vencimento', 'due date': 'data_vencimento'
  };

  useEffect(() => {
    if (defaultPipelineId) {
        const firstStage = stages.find(s => s.pipelineId === defaultPipelineId);
        setDefaultStageId(firstStage?.id || '');
    } else {
        setDefaultStageId('');
    }
  }, [defaultPipelineId, stages]);

  const handleClose = () => {
    setStep('upload');
    setCsvHeaders([]);
    setCsvData([]);
    setMappings({});
    setFileName('');
    setImportResult(null);
    setIsImporting(false);
    setDefaultPipelineId(pipelines[0]?.id || '');
    onClose();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const { headers, data } = parseCSV(text);
        setCsvHeaders(headers);
        setCsvData(data);
        const initialMappings: { [columnIndex: number]: MappingTarget[] } = {};
        headers.forEach((header, index) => {
            const cleanHeader = header.toLowerCase().trim();
            const aliasMatch = aliasMap[cleanHeader];
            const foundField = availableCrmFields.find(f => 
                aliasMatch === f.value ||
                f.value.toLowerCase() === cleanHeader ||
                f.label.toLowerCase() === cleanHeader ||
                f.label.toLowerCase().includes(cleanHeader)
            );
            initialMappings[index] = [{
                crmField: foundField ? foundField.value : 'ignore'
            }];
        });
        setMappings(initialMappings);
        setStep('preview');
      };
      reader.readAsText(file);
    }
  };
  
  const handleMappingChange = (columnIndex: number, mappingIndex: number, newMappingTarget: Partial<MappingTarget>) => {
    setMappings(prev => {
        const newMappingsForColumn = [...(prev[columnIndex] || [])];
        const currentTarget = newMappingsForColumn[mappingIndex];
        const updatedTarget = { ...currentTarget, ...newMappingTarget };

        if (newMappingTarget.crmField && !newMappingTarget.crmField.startsWith('__new_')) {
            delete updatedTarget.newFieldName;
        }
        
        // If crmField changes, reset format to 'none'
        if (newMappingTarget.crmField && newMappingTarget.crmField !== currentTarget.crmField) {
            updatedTarget.format = 'none';
        }

        newMappingsForColumn[mappingIndex] = updatedTarget;

        return {
            ...prev,
            [columnIndex]: newMappingsForColumn
        };
    });
  };

  const addMapping = (columnIndex: number) => {
    setMappings(prev => ({
        ...prev,
        [columnIndex]: [...(prev[columnIndex] || []), { crmField: 'ignore' }]
    }));
  };

  const removeMapping = (columnIndex: number, mappingIndex: number) => {
      setMappings(prev => {
          const currentMappings = prev[columnIndex] || [];
          if (currentMappings.length <= 1) return prev;
          
          const newMappingsForColumn = currentMappings.filter((_, index) => index !== mappingIndex);
          
          return { ...prev, [columnIndex]: newMappingsForColumn };
      });
  };
  
  const handleImportClick = async () => {
    const newDealFieldsSet = new Set<string>();
    const newContactFieldsSet = new Set<string>();

    Object.values(mappings).flat().forEach(target => {
        if (target.crmField === '__new_deal_field__' && target.newFieldName) {
            newDealFieldsSet.add(target.newFieldName);
        }
        if (target.crmField === '__new_contact_field__' && target.newFieldName) {
            newContactFieldsSet.add(target.newFieldName);
        }
    });
        
    const mappedData = csvData.map(row => {
        const dealObject: { [key: string]: any } = {};
        csvHeaders.forEach((header, columnIndex) => {
            const mappingTargets = mappings[columnIndex] || [];
            const cellValue = row[columnIndex];

            mappingTargets.forEach(target => {
                let crmFieldKey = target.crmField;
                if (crmFieldKey && crmFieldKey !== 'ignore') {
                    if (crmFieldKey.startsWith('__new_')) {
                        crmFieldKey = target.newFieldName || `unnamed_new_field_${columnIndex}`;
                    }
                    // Include format in the mapped data
                    dealObject[crmFieldKey] = { value: cellValue, format: target.format || 'none' };
                }
            });
        });
        return dealObject as DealImportData;
    });
    
    setIsImporting(true);
    const result = await onImport({
        deals: mappedData,
        newDealFields: Array.from(newDealFieldsSet),
        newContactFields: Array.from(newContactFieldsSet),
        defaultPipelineId,
        defaultStageId,
    });
    setImportResult(result);
    setIsImporting(false);
    setStep('result');
  };
  
  const handleDownloadTemplate = () => {
    const standardHeaders = ['dealName', 'dealValue', 'contactEmail', 'pipelineName', 'stageName', 'contactName', 'data_vencimento'];
    const allCustomHeaders = [
        ...customFieldDefs.map(def => `"${def.name.replace(/"/g, '""')}"`),
        ...contactCustomFieldDefs.map(def => `"${def.name.replace(/"/g, '""')}"`)
    ];
    const headers = [...standardHeaders, ...allCustomHeaders];

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "deals_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mappedCrmFields = useMemo(() => {
      const fields = new Set<string>();
      Object.values(mappings).forEach(targets => {
          targets.forEach(target => {
              fields.add(target.crmField);
          });
      });
      return fields;
  }, [mappings]);
  
  const unmappedRequiredFields = requiredFields.filter(rf => !mappedCrmFields.has(rf));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Deals from CSV">
      <div className="space-y-4">
        {step === 'upload' && (
          <div>
            <p className="text-gray-400 mb-2">Select a CSV file. The first row should contain headers. We'll try to auto-map columns like "Email" and "Value" for you.</p>
            <button onClick={handleDownloadTemplate} className="text-blue-400 hover:text-blue-300 text-sm font-semibold mb-4">
                Download Template CSV
            </button>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                        <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500">CSV file</p>
                    </div>
                    <input id="csv-upload" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                </label>
            </div> 
          </div>
        )}
        
        {step === 'preview' && (
             <div>
                <h3 className="text-lg font-semibold text-gray-200">Data Preview</h3>
                <p className="text-sm text-gray-400 mb-4">Here's a preview of the first 5 rows from your file ({fileName}). If it looks correct, proceed to map columns.</p>
                <div className="max-h-60 overflow-y-auto overflow-x-auto border border-gray-700 rounded-md">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                            <tr>{csvHeaders.map((h, i) => <th key={`${h}-${i}`} scope="col" className="px-4 py-2">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {csvData.slice(0, 5).map((row, i) => (
                                <tr key={i} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600/50">
                                    {row.map((cell, j) => <td key={j} className="px-4 py-2 truncate max-w-xs">{cell}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {step === 'map' && (
          <div>
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-200 mb-2">Target Stage for Unspecified Deals</h4>
                <p className="text-xs text-gray-400 mb-2">Deals in your CSV without a 'Pipeline' or 'Stage' column will be added here.</p>
                <div className="grid grid-cols-2 gap-2">
                     <select value={defaultPipelineId} onChange={e => setDefaultPipelineId(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
                        {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                     <select value={defaultStageId} onChange={e => setDefaultStageId(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" disabled={!defaultPipelineId}>
                         {stages.filter(s => s.pipelineId === defaultPipelineId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                     </select>
                </div>
            </div>

            {(unmappedRequiredFields.length > 0 && !mappedCrmFields.has('pipelineName')) && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm rounded-md p-3 mb-4">
                    <p className="font-semibold">Missing Required Mappings:</p>
                    <ul className="list-disc list-inside">
                        {unmappedRequiredFields.map(f => <li key={f}>{requiredFieldLabels[f]}</li>)}
                    </ul>
                     <p className="text-xs mt-1">Note: If you do not map 'Pipeline Name' and 'Stage Name', deals will be added to the default stage selected above.</p>
                </div>
            )}
            
            <h3 className="text-lg font-semibold text-gray-200">Map CSV Columns to CRM Fields</h3>
            <p className="text-sm text-gray-400 mb-4">Match columns from {fileName} to CRM fields. You can map a single column to multiple CRM fields.</p>

            <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
            {csvHeaders.map((header, columnIndex) => (
              <div key={columnIndex} className="bg-gray-900/50 p-3 rounded-md border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold text-gray-300 truncate" title={header}>{header}</div>
                    <button type="button" onClick={() => addMapping(columnIndex)} className="text-blue-400 hover:text-blue-300 text-xs flex items-center space-x-1">
                        <PlusIcon className="h-4 w-4"/>
                        <span>Add Mapping</span>
                    </button>
                </div>
                <div className="space-y-2">
                    {(mappings[columnIndex] || []).map((mapping, mappingIndex) => (
                        <div key={mappingIndex} className="flex gap-2 items-center">
                            <select 
                              value={mapping.crmField || 'ignore'}
                              onChange={(e) => handleMappingChange(columnIndex, mappingIndex, { crmField: e.target.value })}
                              className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white w-full"
                            >
                                <option value="ignore">-- Ignore this column --</option>
                                <optgroup label="CRM Fields">
                                    {availableCrmFields.map(field => <option key={field.value} value={field.value}>{field.label}</option>)}
                                </optgroup>
                                <optgroup label="Actions">
                                    <option value="__new_deal_field__">Create New Deal Field...</option>
                                    <option value="__new_contact_field__">Create New Contact Field...</option>
                                </optgroup>
                            </select>

                            {/* Formatting Select */}
                            {mapping.crmField !== 'ignore' && !mapping.crmField.startsWith('__new_') && (
                                <select
                                    value={mapping.format || 'none'}
                                    onChange={(e) => handleMappingChange(columnIndex, mappingIndex, { format: e.target.value })}
                                    className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white w-full"
                                >
                                    {formattingOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            )}

                            {mapping.crmField.startsWith('__new_') && (
                                <input type="text" placeholder="New Field Name" value={mapping.newFieldName || ''} onChange={e => handleMappingChange(columnIndex, mappingIndex, { newFieldName: e.target.value })} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white w-full" required />
                            )}
                            <button type="button" onClick={() => removeMapping(columnIndex, mappingIndex)} disabled={(mappings[columnIndex] || []).length <= 1} className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed">
                                <TrashIcon className="h-4 w-4"/>
                            </button>
                        </div>
                    ))}
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

        {step === 'result' && importResult && (
           <div className={`p-4 rounded-md ${importResult.errorCount > 0 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                <h3 className={`font-bold text-xl flex items-center space-x-2 ${importResult.errorCount > 0 ? 'text-red-300' : 'text-green-300'}`}>
                    {importResult.errorCount > 0 ? <XMarkIcon className="h-6 w-6"/> : <CheckCircleIcon className="h-6 w-6"/>}
                    <span>Import Complete</span>
                </h3>
                <p className="text-sm text-gray-300 mt-2">
                    Successfully imported: {importResult.successCount} deal(s). <br/>
                    Failed: {importResult.errorCount} deal(s).
                </p>
                {importResult.errors.length > 0 && (
                    <ul className="list-disc list-inside mt-2 text-xs text-red-300 max-h-40 overflow-y-auto bg-gray-900/50 p-2 rounded">
                        {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                )}
            </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
          <div>
            {step === 'preview' && (
                <button type="button" onClick={() => setStep('upload')} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
                    Back
                </button>
            )}
            {step === 'map' && (
                <button type="button" onClick={() => setStep('preview')} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
                    Back
                </button>
            )}
            {step === 'result' && importResult && importResult.errorCount > 0 && (
                <button
                    type="button"
                    onClick={() => setStep('map')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                    Go Back &amp; Fix
                </button>
            )}
          </div>
          <div className="flex justify-end space-x-3">
              <button type="button" onClick={handleClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
                {step === 'result' ? 'Close' : 'Cancel'}
              </button>
              {step === 'preview' && (
                <button type="button" onClick={() => setStep('map')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Proceed to Mapping</button>
              )}
              {step === 'map' && (
                <button 
                  type="button" 
                  onClick={handleImportClick} 
                  disabled={isImporting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? 'Importing...' : `Import ${csvData.length} Deals`}
                </button>
              )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ImportDealsModal;