import React, { useState, useEffect } from 'react';
import { DashboardWidget, KpiMetric, Pipeline, TasksWidgetConfig, LeaderboardWidgetConfig, ChartWidgetConfig, KpiWidgetConfig } from '../types';
import Modal from './Modal';

interface EditWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (widget: DashboardWidget) => void;
  widget: DashboardWidget;
  pipelines: Pipeline[];
}

type WidgetTypeOption = 'KPI' | 'FUNNEL_CHART' | 'STATUS_PIE_CHART' | 'TASKS_LIST' | 'LEADERBOARD';

const EditWidgetModal: React.FC<EditWidgetModalProps> = ({ isOpen, onClose, onSave, widget, pipelines }) => {
  const [selectedType, setSelectedType] = useState<WidgetTypeOption>(widget.type);
  
  // Config state
  const [kpiMetric, setKpiMetric] = useState<KpiMetric>('TOTAL_OPEN_VALUE');
  const [chartPipelineId, setChartPipelineId] = useState<string | null>(null);
  const [tasksFilter, setTasksFilter] = useState<'overdue' | 'upcoming'>('upcoming');
  const [leaderboardCount, setLeaderboardCount] = useState(5);

  useEffect(() => {
    if (isOpen && widget) {
      setSelectedType(widget.type);
      if (widget.type === 'KPI') {
        setKpiMetric((widget.config as KpiWidgetConfig).metric);
      } else if (widget.type === 'FUNNEL_CHART' || widget.type === 'STATUS_PIE_CHART') {
        setChartPipelineId((widget.config as ChartWidgetConfig).pipelineId);
      } else if (widget.type === 'TASKS_LIST') {
        setTasksFilter((widget.config as TasksWidgetConfig).filter);
      } else if (widget.type === 'LEADERBOARD') {
        setLeaderboardCount((widget.config as LeaderboardWidgetConfig).count);
      }
    }
  }, [isOpen, widget]);

  const metricOptions: { value: KpiMetric, label: string }[] = [
      { value: 'TOTAL_OPEN_VALUE', label: 'Total Open Value' },
      { value: 'TOTAL_WON_VALUE', label: 'Total Won Value' },
      { value: 'TOTAL_LOST_VALUE', label: 'Total Lost Value' },
      { value: 'EXPECTED_30_DAYS', label: 'Expected Value (Next 30 Days)' },
  ];

  const handleSave = () => {
    let updatedConfig: any;
    switch (selectedType) {
        case 'KPI':
            updatedConfig = {
                metric: kpiMetric,
                title: metricOptions.find(m => m.value === kpiMetric)?.label || 'KPI',
            };
            break;
        case 'FUNNEL_CHART':
             updatedConfig = {
                pipelineId: chartPipelineId,
                title: `Funnel: ${chartPipelineId ? pipelines.find(p => p.id === chartPipelineId)?.name : 'All Pipelines'}`, 
            };
            break;
        case 'STATUS_PIE_CHART':
             updatedConfig = {
                pipelineId: chartPipelineId,
                title: `Status: ${chartPipelineId ? pipelines.find(p => p.id === chartPipelineId)?.name : 'All Pipelines'}`, 
            };
            break;
        case 'TASKS_LIST':
            updatedConfig = {
                title: tasksFilter === 'upcoming' ? 'Upcoming Tasks' : 'Overdue Tasks',
                filter: tasksFilter,
            };
            break;
        case 'LEADERBOARD':
            updatedConfig = {
                title: 'Deals Leaderboard',
                count: leaderboardCount,
            };
            break;
    }
    
    onSave({ ...widget, config: updatedConfig });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${widget.type} Widget`}>
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
        
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
          Cancel
        </button>
        <button type="button" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
          Save Changes
        </button>
      </div>
    </Modal>
  );
};

export default EditWidgetModal;