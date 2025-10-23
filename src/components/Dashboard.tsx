import React, { useState, useMemo, useEffect } from 'react';
import { CrmData, DashboardWidget, Pipeline } from '../types';
import { PlusIcon, EditIcon, TrashIcon } from './icons';
import WidgetRenderer from './WidgetRenderer';
import AddWidgetModal from './AddWidgetModal';
import EditWidgetModal from './EditWidgetModal';
import { produce } from 'immer';


interface DashboardProps {
  data: CrmData;
  onSaveLayout: (layout: DashboardWidget[]) => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onSaveLayout }) => {
  const { pipelines, dashboardConfig } = data;
  const [isEditMode, setIsEditMode] = useState(false);
  const [draftConfig, setDraftConfig] = useState<DashboardWidget[]>(dashboardConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState(false);
  const [isEditWidgetModalOpen, setIsEditWidgetModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);

  useEffect(() => {
    // When the main data reloads, update the draft config if not in edit mode
    if (!isEditMode) {
        setDraftConfig(dashboardConfig);
    }
  }, [dashboardConfig, isEditMode]);

  const handleEdit = () => {
    setDraftConfig(JSON.parse(JSON.stringify(dashboardConfig))); // Deep copy for editing
    setIsEditMode(true);
  };
  
  const handleCancel = () => {
    setDraftConfig(dashboardConfig);
    setIsEditMode(false);
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    await onSaveLayout(draftConfig);
    setIsSaving(false);
    setIsEditMode(false);
  };
  
  const handleRemoveWidget = (widgetId: string) => {
    setDraftConfig(draftConfig.filter(w => w.id !== widgetId));
  };
  
  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
    const newConfig = produce(draftConfig, draft => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < draft.length) {
            const [movedWidget] = draft.splice(index, 1);
            draft.splice(targetIndex, 0, movedWidget);
        }
    });
    setDraftConfig(newConfig);
  };

  const handleAddWidget = (widget: Omit<DashboardWidget, 'id'>) => {
    const newWidget = { ...widget, id: `widget_${Date.now()}` } as DashboardWidget;
    setDraftConfig([...draftConfig, newWidget]);
    setIsAddWidgetModalOpen(false);
  };

  const handleEditWidget = (widgetId: string) => {
    const widgetToEdit = draftConfig.find(w => w.id === widgetId);
    if (widgetToEdit) {
      setEditingWidget(widgetToEdit);
      setIsEditWidgetModalOpen(true);
    }
  };

  const handleSaveEditedWidget = (updatedWidget: DashboardWidget) => {
    setDraftConfig(draftConfig.map(w => w.id === updatedWidget.id ? updatedWidget : w));
    setIsEditWidgetModalOpen(false);
    setEditingWidget(null);
  };

  const EditControls = ({ onSave, onCancel, onAddWidget }: { onSave: () => void, onCancel: () => void, onAddWidget: () => void }) => (
    <div className="flex items-center space-x-2">
      <button onClick={onAddWidget} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
        <PlusIcon className="h-5 w-5"/>
        <span>Add Widget</span>
      </button>
      <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
        Cancel
      </button>
      <button onClick={onSave} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {isEditMode ? (
            <EditControls onSave={handleSave} onCancel={handleCancel} onAddWidget={() => setIsAddWidgetModalOpen(true)} />
        ) : (
            <button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                <EditIcon className="h-5 w-5"/>
                <span>Edit Dashboard</span>
            </button>
        )}
      </div>
      
      {draftConfig.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg">
            <h3 className="mt-2 text-xl font-semibold text-white">Your dashboard is empty</h3>
            <p className="mt-1 text-sm text-gray-400">Click 'Edit Dashboard' to add your first widget.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {draftConfig.map((widget, index) => (
                <div key={widget.id} className={`relative group col-span-4 ${widget.type === 'KPI' ? 'md:col-span-1' : 'md:col-span-2'}`}>
                    {isEditMode && (
                        <div className="absolute top-2 right-2 z-10 bg-gray-900/80 p-1 rounded-md flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleMoveWidget(index, 'up')} disabled={index === 0} className="p-1 hover:bg-gray-700 rounded disabled:opacity-30"><ChevronUpIcon className="h-4 w-4"/></button>
                            <button onClick={() => handleMoveWidget(index, 'down')} disabled={index === draftConfig.length - 1} className="p-1 hover:bg-gray-700 rounded disabled:opacity-30"><ChevronDownIcon className="h-4 w-4"/></button>
                            <button onClick={() => handleRemoveWidget(widget.id)} className="p-1 hover:bg-gray-700 rounded"><TrashIcon className="h-4 w-4 text-red-400"/></button>
                        </div>
                    )}
                    <WidgetRenderer widget={widget} data={data} />
                    {isEditMode && (
                        <div className="absolute top-2 left-2 z-10 bg-gray-900/80 p-1 rounded-md flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditWidget(widget.id)} className="p-1 hover:bg-gray-700 rounded"><EditIcon className="h-4 w-4"/></button>
                        </div>
                    )}
                </div>
            ))}
        </div>
      )}

      <AddWidgetModal
        isOpen={isAddWidgetModalOpen}
        onClose={() => setIsAddWidgetModalOpen(false)}
        onAddWidget={handleAddWidget}
        pipelines={pipelines}
      />

      {editingWidget && (
        <EditWidgetModal
          isOpen={isEditWidgetModalOpen}
          onClose={() => setIsEditWidgetModalOpen(false)}
          onSave={handleSaveEditedWidget}
          widget={editingWidget}
          pipelines={pipelines}
        />
      )}
    </div>
  );
};

// A smaller ChevronUpIcon for the UI
const ChevronUpIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
    </svg>
);
// A smaller ChevronDownIcon for the UI
const ChevronDownIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);


export default Dashboard;