
import React, { useState, useMemo } from 'react';
import { Deal, Contact, Stage, DealStatus, DealFilter, FilterOperator, Pipeline, CustomFieldDefinition, ScheduledJob } from '../types';
import { TrashIcon, PlusIcon, FilterIcon, ClockIcon } from './icons';

interface DealsListViewProps {
  deals: Deal[];
  contacts: Contact[];
  stages: Stage[];
  pipelines: Pipeline[];
  customFieldDefinitions: CustomFieldDefinition[];
  onEditDeal: (deal: Deal) => void;
  onDeleteDeal: (dealId: string) => void;
  onAddDeal: () => void;
  onImportDeals: () => void;

  scheduledJobs: ScheduledJob[];
}

type SortKey = 'name' | 'value' | 'contactName' | 'stageName' | 'status' | 'updatedAt' | 'data_vencimento' | 'createdAt';


const DealsListView: React.FC<DealsListViewProps> = ({ deals, contacts, stages, pipelines, customFieldDefinitions, onEditDeal, onDeleteDeal, onAddDeal, onImportDeals, scheduledJobs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<DealFilter[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Helper functions
  const getContactName = (contactId: string) => contacts.find(c => c.id === contactId)?.name || 'N/A';
  const getStageName = (stageId: string) => stages.find(s => s.id === stageId)?.name || 'N/A';
  const getPipelineIdForStage = (stageId: string) => stages.find(s => s.id === stageId)?.pipelineId;
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatDateTime = (isoString: string) => new Date(isoString).toLocaleDateString('pt-BR');
  const formatBrazilianDate = (isoDateString?: string): string => {
    if (!isoDateString) return '–';
    const [year, month, day] = isoDateString.split('-');
    if (!year || !month || !day) return '–';
    return `${day}/${month}/${year}`;
  };

  // Filterable fields configuration
  const filterableFields = useMemo(() => [
    { id: 'name', name: 'Deal Name', type: 'text' },
    { id: 'value', name: 'Deal Value', type: 'number' },
    { id: 'status', name: 'Status', type: 'select', options: Object.values(DealStatus) },
    { id: 'contactId', name: 'Contact', type: 'select', options: contacts.map(c => ({ label: c.name, value: c.id })) },
    { id: 'pipelineId', name: 'Pipeline', type: 'select', options: pipelines.map(p => ({ label: p.name, value: p.id })) },
    { id: 'createdAt', name: 'Creation Date', type: 'date' },
    { id: 'data_vencimento', name: 'Due Date', type: 'date' },
    ...customFieldDefinitions.map(def => ({ id: `custom_${def.id}`, name: `Custom: ${def.name}`, type: 'text' })),
  ], [contacts, pipelines, customFieldDefinitions]);

  const getFieldType = (fieldId: string) => {
    return filterableFields.find(f => f.id === fieldId)?.type || 'text';
  };

  // Filtering logic
  const sortedAndFilteredDeals = useMemo(() => {
    const dataWithNames = deals.map(deal => ({
      ...deal,
      contactName: getContactName(deal.contactId),
      stageName: getStageName(deal.stageId),
      pipelineId: getPipelineIdForStage(deal.stageId)
    }));

    let filtered = dataWithNames;

    // Search term filter
    if (searchTerm) {
        filtered = filtered.filter(deal =>
          deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deal.contactName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    // Advanced filters
    if (filters.length > 0) {
      filtered = filtered.filter(deal => {
        return filters.every(filter => {
          let dealValue: any;
          if (filter.field.startsWith('custom_')) {
            const fieldId = filter.field.replace('custom_', '');
            dealValue = deal.customFields[fieldId];
          } else {
            dealValue = (deal as any)[filter.field];
          }

          const filterValue = filter.value;
          const fieldType = getFieldType(filter.field);

          switch (filter.operator) {
            case FilterOperator.IS_EMPTY: return dealValue === null || dealValue === undefined || dealValue === '';
            case FilterOperator.IS_NOT_EMPTY: return dealValue !== null && dealValue !== undefined && dealValue !== '';
            
            // From here on, if dealValue is empty, it can't match.
            if (dealValue === null || dealValue === undefined || dealValue === '') return false;
            
            if (fieldType === 'date' && typeof filterValue === 'string' && filterValue) {
                const dealDate = new Date(dealValue).setHours(0,0,0,0);
                const filterDate = new Date(filterValue).setHours(24,0,0,0);
                if (filter.operator === FilterOperator.EQUALS) return dealDate === filterDate;
                if (filter.operator === FilterOperator.ON_OR_AFTER) return dealDate >= filterDate;
                if (filter.operator === FilterOperator.ON_OR_BEFORE) return dealDate <= filterDate;
                return false;
            }
            if (fieldType === 'number' && (typeof filterValue === 'number' || typeof filterValue === 'string')) {
                const numDealValue = parseFloat(dealValue);
                const numFilterValue = parseFloat(String(filterValue));
                if (isNaN(numDealValue) || isNaN(numFilterValue)) return false;

                if (filter.operator === FilterOperator.EQUALS) return numDealValue === numFilterValue;
                if (filter.operator === FilterOperator.NOT_EQUALS) return numDealValue !== numFilterValue;
                if (filter.operator === FilterOperator.GREATER_THAN) return numDealValue > numFilterValue;
                if (filter.operator === FilterOperator.LESS_THAN) return numDealValue < numFilterValue;
                return false;
            }

            if (filter.operator === FilterOperator.CONTAINS) return String(dealValue).toLowerCase().includes(String(filterValue).toLowerCase());
            if (filter.operator === FilterOperator.NOT_CONTAINS) return !String(dealValue).toLowerCase().includes(String(filterValue).toLowerCase());
            if (filter.operator === FilterOperator.EQUALS) return String(dealValue).toLowerCase() == String(filterValue).toLowerCase();
            if (filter.operator === FilterOperator.NOT_EQUALS) return String(dealValue).toLowerCase() != String(filterValue).toLowerCase();
            
            return true;
          }
        });
      });
    }

    // Sorting
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      let comparison = 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (aVal > bVal) comparison = 1;
      else if (aVal < bVal) comparison = -1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [deals, contacts, stages, pipelines, searchTerm, sortKey, sortOrder, filters, filterableFields]);



  // Sort handler
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Filter handlers
  const addFilter = () => {
    const newFilter: DealFilter = { id: `filter_${Date.now()}`, field: 'name', operator: FilterOperator.CONTAINS, value: '' };
    setFilters([...filters, newFilter]);
  };
  const updateFilter = (id: string, updates: Partial<DealFilter>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  };
  const removeFilter = (id: string) => setFilters(filters.filter(f => f.id !== id));

  // Render helpers
  const SortableHeader = ({ label, sortKeyName }: { label: string, sortKeyName: SortKey }) => (
      <th onClick={() => handleSort(sortKeyName)} className="p-3 cursor-pointer hover:bg-gray-700 select-none">
          {label} {sortKey === sortKeyName && (sortOrder === 'asc' ? '▲' : '▼')}
      </th>
  );
  
  const renderFilterInput = (filter: DealFilter) => {
      const fieldType = getFieldType(filter.field);
      const fieldConfig = filterableFields.find(f => f.id === filter.field);
      
      if (filter.operator === FilterOperator.IS_EMPTY || filter.operator === FilterOperator.IS_NOT_EMPTY) {
          return <div className="flex-grow h-10" />;
      }

      switch (fieldType) {
          case 'date':
              return <input type="date" value={filter.value as string || ''} onChange={e => updateFilter(filter.id, { value: e.target.value })} className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-sm h-10" />;
          case 'number':
              return <input type="number" value={filter.value as number | string || ''} onChange={e => updateFilter(filter.id, { value: e.target.value })} className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-sm h-10" />;
          case 'select':
              return (
                  <select value={filter.value || ''} onChange={e => updateFilter(filter.id, { value: e.target.value })} className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-sm h-10">
                      <option value="" disabled>Select...</option>
                      {Array.isArray(fieldConfig?.options) && fieldConfig.options.map((opt: any) => 
                          typeof opt === 'string' 
                          ? <option key={opt} value={opt}>{opt}</option> 
                          : <option key={opt.value} value={opt.value}>{opt.label}</option>
                      )}
                  </select>
              );
          default:
              return <input type="text" value={filter.value as string || ''} onChange={e => updateFilter(filter.id, { value: e.target.value })} className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-sm h-10" />;
      }
  };

  const getOperatorsForField = (fieldId: string) => {
      const fieldType = getFieldType(fieldId);
      const common = [FilterOperator.IS_EMPTY, FilterOperator.IS_NOT_EMPTY];
      const text = [FilterOperator.CONTAINS, FilterOperator.NOT_CONTAINS, FilterOperator.EQUALS, FilterOperator.NOT_EQUALS];
      const numeric = [FilterOperator.EQUALS, FilterOperator.NOT_EQUALS, FilterOperator.GREATER_THAN, FilterOperator.LESS_THAN];
      const date = [FilterOperator.EQUALS, FilterOperator.ON_OR_AFTER, FilterOperator.ON_OR_BEFORE];
      
      switch (fieldType) {
          case 'text': return [...text, ...common];
          case 'number': return [...numeric, ...common];
          case 'date': return [...date, ...common];
          case 'select': return [FilterOperator.EQUALS, FilterOperator.NOT_EQUALS, ...common];
          default: return text;
      }
  };

  const isDealInAutomation = (dealId: string) => {
    return scheduledJobs.some(job => job.dealId === dealId);
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Deals</h1>
        <div className="flex space-x-2">

            <button onClick={() => setShowFilters(!showFilters)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                <FilterIcon className="h-5 w-5"/>
                <span>Filter{filters.length > 0 ? ` (${filters.length})` : ''}</span>
            </button>
            <button onClick={onImportDeals} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
                Import
            </button>
            <button onClick={onAddDeal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                <PlusIcon className="h-5 w-5"/>
                <span>New Deal</span>
            </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4 p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-3">
          {filters.map(filter => (
            <div key={filter.id} className="flex items-center space-x-2">
              <select value={filter.field} onChange={e => updateFilter(filter.id, { field: e.target.value, value: '', operator: getOperatorsForField(e.target.value)[0] })} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-sm w-48 h-10">
                {filterableFields.map(field => <option key={field.id} value={field.id}>{field.name}</option>)}
              </select>
              <select value={filter.operator} onChange={e => updateFilter(filter.id, { operator: e.target.value as FilterOperator })} className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-sm w-48 h-10">
                {getOperatorsForField(filter.field).map(op => <option key={op} value={op}>{op.replace(/_/g, ' ').toLowerCase()}</option>)}
              </select>
              {renderFilterInput(filter)}
              <button onClick={() => removeFilter(filter.id)} className="p-2 text-gray-400 hover:text-red-500"><TrashIcon className="h-5 w-5"/></button>
            </div>
          ))}
          <button onClick={addFilter} className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center space-x-1 pt-2">
            <PlusIcon className="h-4 w-4"/>
            <span>Add Filter Condition</span>
          </button>
        </div>
      )}

      <input type="text" placeholder="Search by deal or contact name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 mb-4 text-white" />
      
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-900">
            <tr>

              <SortableHeader label="Deal Name" sortKeyName="name" />
              <SortableHeader label="Value" sortKeyName="value" />
              <SortableHeader label="Contact" sortKeyName="contactName" />
              <SortableHeader label="Stage" sortKeyName="stageName" />
              <SortableHeader label="Vencimento" sortKeyName="data_vencimento" />
              <SortableHeader label="Status" sortKeyName="status" />
              <SortableHeader label="Created" sortKeyName="createdAt" />
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {sortedAndFilteredDeals.map(deal => (
              <tr key={deal.id} className="hover:bg-gray-700/50">

                <td className="p-3 cursor-pointer" onClick={() => onEditDeal(deal)}>
                  <div className="flex items-center space-x-2">
                    <span>{deal.name}</span>
                    {isDealInAutomation(deal.id) && (
                      <ClockIcon className="h-4 w-4 text-blue-400" title="In Automation" />
                    )}
                  </div>
                </td>
                <td className="p-3">{formatCurrency(deal.value)}</td>
                <td className="p-3">{deal.contactName}</td>
                <td className="p-3">{deal.stageName}</td>
                <td className="p-3">{formatBrazilianDate(deal.data_vencimento)}</td>
                <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        deal.status === DealStatus.WON ? 'bg-green-500/20 text-green-300' :
                        deal.status === DealStatus.LOST ? 'bg-red-500/20 text-red-300' :
                        'bg-blue-500/20 text-blue-300'
                    }`}>
                        {deal.status}
                    </span>
                </td>
                <td className="p-3">{formatDateTime(deal.createdAt)}</td>
                <td className="p-3 text-right">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDeal(deal.id);
                        }} 
                        className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-900/50"
                        aria-label={`Delete deal ${deal.name}`}
                    >
                        <TrashIcon className="h-5 w-5"/>
                    </button>
                </td>
              </tr>
            ))}
             {sortedAndFilteredDeals.length === 0 && (
                <tr>
                    <td colSpan={9} className="text-center p-8 text-gray-500">
                        No deals match the current filters.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DealsListView;
