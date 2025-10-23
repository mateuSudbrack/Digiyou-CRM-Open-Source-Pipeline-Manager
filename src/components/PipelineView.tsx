import React, { useState, useMemo } from 'react';
import { CrmData, Deal, Stage, CustomFieldDefinition, DealFilter, FilterOperator } from '../types';
import StageColumn from './StageColumn';
import { crmService } from '../services/crmService';
import { PlusIcon, EditIcon, TrashIcon, FilterIcon } from './icons';

interface PipelineViewProps {
  data: CrmData;
  refreshData: () => void;
  onDealClick: (deal: Deal) => void;
  onAddNewDeal: (stageId?: string) => void;
  onManagePipelines: () => void;
  onAddNewStage: (pipelineId: string) => void;
  onEditStage: (stage: Stage) => void;
  onDeleteStage: (stageId: string) => void;
  optimisticallyUpdateDeal: (dealId: string, updates: Partial<Deal>) => void;
}

const PipelineView: React.FC<PipelineViewProps> = ({ 
    data, 
    refreshData, 
    onDealClick, 
    onAddNewDeal,
    onManagePipelines,
    onAddNewStage,
    onEditStage,
    onDeleteStage,
    optimisticallyUpdateDeal,
}) => {
  const { pipelines, stages, deals, contacts, customFieldDefinitions } = data;
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(pipelines[0]?.id || null);
  const [draggedDealInfo, setDraggedDealInfo] = useState<{id: string, stageId: string} | null>(null);
  
  // New dynamic filter state
  const [filters, setFilters] = useState<DealFilter[]>([]);
  const [showFilters, setShowFilters] = useState(false);


  const handleDealDrop = async (newStageId: string) => {
    if (!draggedDealInfo) return;

    const { id: dealId, stageId: oldStageId } = draggedDealInfo;
    
    if (dealId && oldStageId !== newStageId) {
        // 1. Optimistic UI update for instant feedback
        optimisticallyUpdateDeal(dealId, { stageId: newStageId });

        try {
            // 2. API call in the background. It returns the final state of the deal,
            // including any modifications from automations on the deal itself.
            const finalDealState = await crmService.updateDeal(dealId, { stageId: newStageId });
            
            // 3. Replace the deal in our local state with the authoritative version from the server.
            // This prevents flickering by avoiding a full data refresh. This trade-off
            // is made to fix the user-reported flickering issue, and means side-effects
            // on other entities (e.g., new tasks from automations) may not appear immediately.
            optimisticallyUpdateDeal(dealId, finalDealState);
        } catch (error) {
            console.error("Failed to move deal", error);
            // On failure, revert the change by refreshing data from the server
            alert("An error occurred while moving the deal. Reverting the change.");
            await refreshData();
        }
    }
  };

  const handleDealDragStart = (dealId: string, stageId: string) => {
    setDraggedDealInfo({ id: dealId, stageId });
  };

  const handleDealDragEnd = () => {
    setDraggedDealInfo(null);
  };

  const filteredDeals = useMemo(() => {
    if (filters.length === 0) return deals;

    return deals.filter(deal => {
      return filters.every(filter => {
        let dealValue: any;
        if (filter.field.startsWith('custom_')) {
            const fieldId = filter.field.replace('custom_', '');
            dealValue = deal.customFields[fieldId];
        } else {
            dealValue = (deal as any)[filter.field];
        }

        const filterValue = filter.value;

        switch (filter.operator) {
            case FilterOperator.CONTAINS:
                return dealValue && String(dealValue).toLowerCase().includes(String(filterValue).toLowerCase());
            case FilterOperator.NOT_CONTAINS:
                return !dealValue || !String(dealValue).toLowerCase().includes(String(filterValue).toLowerCase());
            case FilterOperator.EQUALS:
                return String(dealValue).toLowerCase() == String(filterValue).toLowerCase();
            case FilterOperator.NOT_EQUALS:
                 return String(dealValue).toLowerCase() != String(filterValue).toLowerCase();
            case FilterOperator.GREATER_THAN:
                return dealValue && parseFloat(dealValue) > parseFloat(String(filterValue));
            case FilterOperator.LESS_THAN:
                return dealValue && parseFloat(dealValue) < parseFloat(String(filterValue));
            case FilterOperator.IS_EMPTY:
                return dealValue === null || dealValue === undefined || dealValue === '';
            case FilterOperator.IS_NOT_EMPTY:
                return dealValue !== null && dealValue !== undefined && dealValue !== '';
            default:
                return true;
        }
      });
    });
  }, [deals, filters]);

  const currentStages = useMemo(() => {
    if (!selectedPipelineId) return [];
    return stages
      .filter(stage => stage.pipelineId === selectedPipelineId)
      .sort((a, b) => a.order - b.order);
  }, [stages, selectedPipelineId]);
  
  const handleDuplicatePipeline = async () => {
    if (!selectedPipelineId) return;
    const originalPipelineName = pipelines.find(p => p.id === selectedPipelineId)?.name;
    const newPipelineName = prompt(`Enter a name for the duplicated pipeline:`, `${originalPipelineName} (Copy)`);

    if (newPipelineName) {
        const dealIdsToDuplicate = filteredDeals
            .filter(d => currentStages.some(s => s.id === d.stageId))
            .map(d => d.id);
        
        try {
            await crmService.duplicatePipeline(selectedPipelineId, newPipelineName, dealIdsToDuplicate);
            await refreshData();
            alert("Pipeline duplicated successfully!");
        } catch (error) {
            console.error("Failed to duplicate pipeline:", error);
            alert("Error duplicating pipeline.");
        }
    }
  };
  
  // --- Filter Handlers ---
  const addFilter = () => {
    const newFilter: DealFilter = {
        id: `filter_${Date.now()}`,
        field: 'name',
        operator: FilterOperator.CONTAINS,
        value: ''
    };
    setFilters([...filters, newFilter]);
  };
  const updateFilter = (id: string, updates: Partial<DealFilter>) => {
    setFilters(filters.map(f => f.id === id ? {...f, ...updates} : f));
  };
  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };
  
  const filterableFields = [
    { id: 'name', name: 'Deal Name' },
    { id: 'value', name: 'Deal Value' },
    ...customFieldDefinitions.map(def => ({ id: `custom_${def.id}`, name: def.name })),
  ];


  if (!pipelines || pipelines.length === 0) {
    return (
        <div className="p-8 text-white text-center">
            <h2 className="text-2xl mb-4">No pipelines found.</h2>
            <button 
                onClick={onManagePipelines}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
            >
                Create Your First Pipeline
            </button>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-white overflow-hidden">
      <div className="p-4 sm:p-6 lg:p-8 flex-shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Pipeline Manager</h1>
            <div className="flex items-center space-x-2 mt-2">
                <select
                    value={selectedPipelineId || ''}
                    onChange={(e) => setSelectedPipelineId(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button onClick={onManagePipelines} className="text-gray-300 hover:text-white p-2 rounded-md hover:bg-gray-700" aria-label="Manage pipelines">
                    <EditIcon className="h-5 w-5" />
                </button>
            </div>
          </div>
          <div className="flex items-center space-x-3">
              <button onClick={() => setShowFilters(!showFilters)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                <FilterIcon className="h-5 w-5"/>
                <span>Filter</span>
              </button>
              <button onClick={handleDuplicatePipeline} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
                Duplicate Pipeline
              </button>
              <button 
                onClick={() => onAddNewDeal()}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5"/>
                <span>New Deal</span>
              </button>
          </div>
        </div>
         {showFilters && (
            <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-3">
                {filters.map(filter => (
                    <div key={filter.id} className="flex items-center space-x-2">
                        <select
                            value={filter.field}
                            onChange={e => updateFilter(filter.id, { field: e.target.value })}
                            className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-sm w-1/4"
                        >
                            {filterableFields.map(field => <option key={field.id} value={field.id}>{field.name}</option>)}
                        </select>
                        <select
                            value={filter.operator}
                            onChange={e => updateFilter(filter.id, { operator: e.target.value as FilterOperator })}
                            className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-sm w-1/4"
                        >
                             <option value={FilterOperator.CONTAINS}>contains</option>
                             <option value={FilterOperator.NOT_CONTAINS}>does not contain</option>
                             <option value={FilterOperator.EQUALS}>equals</option>
                             <option value={FilterOperator.NOT_EQUALS}>not equal to</option>
                             <option value={FilterOperator.IS_EMPTY}>is empty</option>
                             <option value={FilterOperator.IS_NOT_EMPTY}>is not empty</option>
                             <option value={FilterOperator.GREATER_THAN}>&gt;</option>
                             <option value={FilterOperator.LESS_THAN}>&lt;</option>
                        </select>
                        <input
                            type="text"
                            value={filter.value || ''}
                            onChange={e => updateFilter(filter.id, { value: e.target.value })}
                            className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-sm"
                            disabled={filter.operator === FilterOperator.IS_EMPTY || filter.operator === FilterOperator.IS_NOT_EMPTY}
                        />
                        <button onClick={() => removeFilter(filter.id)} className="p-2 text-gray-400 hover:text-red-500"><TrashIcon className="h-5 w-5"/></button>
                    </div>
                ))}
                <button onClick={addFilter} className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center space-x-1">
                    <PlusIcon className="h-4 w-4"/>
                    <span>Add Filter</span>
                </button>
            </div>
        )}
      </div>
      <div className="flex-grow flex space-x-4 p-4 sm:p-6 lg:p-8 overflow-x-auto bg-gray-800">
        {currentStages.map(stage => (
          <StageColumn
            key={stage.id}
            stage={stage}
            deals={filteredDeals.filter(deal => deal.stageId === stage.id)}
            contacts={contacts}
            draggedDealInfo={draggedDealInfo}
            onDrop={handleDealDrop}
            onDealDragStart={handleDealDragStart}
            onDealDragEnd={handleDealDragEnd}
            onDealClick={onDealClick}
            onEditStage={onEditStage}
            onDeleteStage={onDeleteStage}
            onAddNewDeal={onAddNewDeal}
          />
        ))}
        {selectedPipelineId && (
            <div className="w-80 flex-shrink-0">
                <button onClick={() => onAddNewStage(selectedPipelineId)} className="w-full text-left p-3 rounded-lg bg-gray-900 hover:bg-gray-700 transition-colors flex items-center space-x-2">
                    <PlusIcon className="h-5 w-5 text-gray-400"/>
                    <span className="font-semibold text-gray-300">Add new stage</span>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default PipelineView;