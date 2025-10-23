import React, { useState } from 'react';
import { DashboardWidget, KpiMetric, Pipeline } from '../types';
import Modal from './Modal';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (widget: Omit<DashboardWidget, 'id'>) => void;
  pipelines: Pipeline[];
}

type WidgetTypeOption = 'KPI' | 'FUNNEL_CHART' | 'STATUS_PIE_CHART' | 'TASKS_LIST' | 'LEADERBOARD';

const AddWidgetModal: React.FC<AddWidgetModalProps> = ({ isOpen, onClose, onAddWidget, pipelines }) => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<WidgetTypeOption | null>(null);
  
  // Config state
  const [kpiMetric, setKpiMetric] = useState<KpiMetric>('TOTAL_OPEN_VALUE');
  const [chartPipelineId, setChartPipelineId] = useState<string | null>(null);
  const [tasksFilter, setTasksFilter] = useState<'overdue' | 'upcoming'>('upcoming');
  const [leaderboardCount, setLeaderboardCount] = useState(5);

  const metricOptions: { value: KpiMetric, label: string }[] = [
      { value: 'TOTAL_OPEN_VALUE', label: 'Total Open Value' },
      { value: 'TOTAL_WON_VALUE', label: 'Total Won Value' },
      { value: 'TOTAL_LOST_VALUE', label: 'Total Lost Value' },
      { value: 'EXPECTED_30_DAYS', label: 'Expected Value (Next 30 Days)' },
  ];

  const handleSelectType = (type: WidgetTypeOption) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleAdd = () => {
    let newWidget: Omit<DashboardWidget, 'id'> | null = null;
    switch (selectedType) {
        case 'KPI':
            newWidget = {
                type: 'KPI',
                config: {
                    metric: kpiMetric,
                    title: metricOptions.find(m => m.value === kpiMetric)?.label || 'KPI',
                }
            };
            break;
        case 'FUNNEL_CHART':
             newWidget = {
                type: 'FUNNEL_CHART',
                config: {
                    pipelineId: chartPipelineId,
                    title: `Funnel: ${chartPipelineId ? pipelines.find(p => p.id === chartPipelineId)?.name : 'All Pipelines'}`,
                }
            };
            break;
        case 'STATUS_PIE_CHART':
             newWidget = {
                type: 'STATUS_PIE_CHART',
                config: {
                    pipelineId: chartPipelineId,
                    title: `Status: ${chartPipelineId ? pipelines.find(p => p.id === chartPipelineId)?.name : 'All Pipelines'}`,
                }
            };
            break;
        case 'TASKS_LIST':
            newWidget = {
                type: 'TASKS_LIST',
                config: {
                    title: tasksFilter === 'upcoming' ? 'Upcoming Tasks' : 'Overdue Tasks',
                    filter: tasksFilter,
                }
            };
            break;
        case 'LEADERBOARD':
            newWidget = {
                type: 'LEADERBOARD',
                config: {
                    title: 'Deals Leaderboard',
                    count: leaderboardCount,
                }
            };
            break;
    }
    
    if (newWidget) {
      onAddWidget(newWidget);
      resetState();
    }
  };
  
  const resetState = () => {
    setStep(1);
    setSelectedType(null);
    setKpiMetric('TOTAL_OPEN_VALUE');
    setChartPipelineId(null);
    setTasksFilter('upcoming');
    setLeaderboardCount(5);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };


  const renderStepOne = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => handleSelectType('KPI')} className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left">
            <h4 className="font-bold text-lg text-white">KPI Card</h4>
            <p className="text-sm text-gray-400">Display a single, important metric like total deal value.</p>
        </button>
        <button onClick={() => handleSelectType('FUNNEL_CHART')} className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left">
            <h4 className="font-bold text-lg text-white">Funnel Chart</h4>
            <p className="text-sm text-gray-400">Visualize deal distribution and value across stages.</p>
        </button>
        <button onClick={() => handleSelectType('STATUS_PIE_CHART')} className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left">
            <h4 className="font-bold text-lg text-white">Status Pie Chart</h4>
            <p className="text-sm text-gray-400">See the breakdown of deals by Open, Won, and Lost status.</p>
        </button>
        <button onClick={() => handleSelectType('TASKS_LIST')} className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left">
            <h4 className="font-bold text-lg text-white">Tasks List</h4>
            <p className="text-sm text-gray-400">Display a list of upcoming or overdue tasks.</p>
        </button>
        <button onClick={() => handleSelectType('LEADERBOARD')} className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left">
            <h4 className="font-bold text-lg text-white">Leaderboard</h4>
            <p className="text-sm text-gray-400">Rank deals by value.</p>
        </button>
      </div>
  );

  const renderStepTwo = () => (
      <div className="space-y-4">
        {selectedType === 'KPI' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Metric</label>
            <select value={kpiMetric} onChange={e => setKpiMetric(e.target.value as KpiMetric)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
              {metricOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        )}
        {(selectedType === 'FUNNEL_CHART' || selectedType === 'STATUS_PIE_CHART') && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Pipeline (Optional)</label>
            <select value={chartPipelineId || ''} onChange={e => setChartPipelineId(e.target.value || null)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
              <option value="">All Pipelines</option>
              {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        {selectedType === 'TASKS_LIST' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Filter Tasks</label>
            <select value={tasksFilter} onChange={e => setTasksFilter(e.target.value as 'overdue' | 'upcoming')} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
              <option value="upcoming">Upcoming Tasks</option>
              <option value="overdue">Overdue Tasks</option>
            </select>
          </div>
        )}
        {selectedType === 'LEADERBOARD' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Number of Deals</label>
            <input type="number" value={leaderboardCount} onChange={e => setLeaderboardCount(parseInt(e.target.value))} min="1" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
          </div>
        )}
      </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={step === 1 ? 'Select a Widget Type' : 'Configure Widget'}>
      <div className="space-y-4">
        {step === 1 ? renderStepOne() : renderStepTwo()}
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          {step === 2 && (
            <button type="button" onClick={() => setStep(1)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
              Back
            </button>
          )}
          <button type="button" onClick={handleClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
            Cancel
          </button>
          {step === 2 && (
             <button type="button" onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                Add Widget
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AddWidgetModal;