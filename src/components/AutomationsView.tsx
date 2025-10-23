import React, { useState } from 'react';
import { CrmData, Automation, TriggerType, AutomationStep, ScheduledJob } from '../types';
import { PlusIcon, EditIcon, TrashIcon, BoltIcon, ClockIcon } from './icons';
import { crmService } from '../services/crmService';

interface AutomationsViewProps {
  data: CrmData;
  onAddAutomation: () => void;
  onEditAutomation: (automation: Automation) => void;
  onDeleteAutomation: (automationId: string) => void;
}

const getWorkflowSummary = (steps: AutomationStep[]): string => {
    if (!steps || steps.length === 0) return 'No actions defined';
    if (steps.length === 1) return '1 step';
    return `${steps.length} steps`;
};


const AutomationsView: React.FC<AutomationsViewProps> = ({ data, onAddAutomation, onEditAutomation, onDeleteAutomation }) => {
  const { automations, pipelines, stages } = data;
  const [selectedAutomationIdForJobs, setSelectedAutomationIdForJobs] = useState<string | null>(null);
  const [automationScheduledJobs, setAutomationScheduledJobs] = useState<ScheduledJob[]>([]);

  const closeScheduledJobsView = () => {
    setSelectedAutomationIdForJobs(null);
    setAutomationScheduledJobs([]);
  };

  const fetchScheduledJobsForAutomation = async (automationId: string) => {
    try {
      const jobs = await crmService.getScheduledJobsForAutomation(automationId);
      setAutomationScheduledJobs(jobs);
      setSelectedAutomationIdForJobs(automationId);
    } catch (error) {
      console.error("Failed to fetch scheduled jobs for automation:", error);
      setAutomationScheduledJobs([]);
      setSelectedAutomationIdForJobs(null);
    }
  };

  const getTriggerDescription = (automation: Automation): string => {
    switch (automation.triggerType) {
        case TriggerType.DEAL_STAGE_CHANGED: {
            const pipeline = pipelines.find(p => p.id === automation.triggerConfig.pipelineId);
            const stage = stages.find(s => s.id === automation.triggerConfig.stageId);
            if (pipeline && stage) {
                return `When a deal enters stage "${stage.name}" in pipeline "${pipeline.name}"`;
            }
            return 'When a deal stage is changed (invalid config)';
        }
        case TriggerType.TASK_CREATED:
            return 'When a new task is created';
        case TriggerType.TASK_COMPLETED:
            return 'When a task is marked as complete';
        default:
            return 'Unknown Trigger';
    }
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Automations</h1>
        <button
          onClick={onAddAutomation}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Automation</span>
        </button>
      </div>
        
      {automations.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg">
            <BoltIcon className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-xl font-semibold text-white">No automations yet</h3>
            <p className="mt-1 text-sm text-gray-400">Get started by creating a new automation.</p>
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
          <ul className="divide-y divide-gray-700">
            {automations.map(automation => (
              <li key={automation.id} className="p-4 flex flex-col sm:flex-row items-start justify-between hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start space-x-4 w-full sm:w-auto">
                  <div className="bg-gray-700 p-3 rounded-full mt-1">
                    <BoltIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{automation.name}</p>
                    <div className="text-sm text-gray-400 mt-2 space-y-1">
                        <p><span className="font-semibold text-gray-300">Trigger:</span> {getTriggerDescription(automation)}</p>
                        <p><span className="font-semibold text-gray-300">Workflow:</span> {getWorkflowSummary(automation.steps)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4 sm:mt-0 self-center sm:self-auto ml-auto sm:ml-0 pl-0 sm:pl-4">
                  <button onClick={() => fetchScheduledJobsForAutomation(automation.id)} className="p-2 text-gray-400 hover:text-blue-400 rounded-full hover:bg-gray-600" aria-label={`View scheduled jobs for ${automation.name}`}>
                    <ClockIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => onEditAutomation(automation)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-600" aria-label={`Edit ${automation.name}`}>
                    <EditIcon />
                  </button>
                  <button onClick={() => onDeleteAutomation(automation.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-600" aria-label={`Delete ${automation.name}`}>
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedAutomationIdForJobs && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-lg w-full relative">
            <h2 className="text-2xl font-bold mb-4">Scheduled Jobs for Automation</h2>
            <button onClick={closeScheduledJobsView} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              &times;
            </button>
            {automationScheduledJobs.length === 0 ? (
              <p className="text-gray-400">No scheduled jobs for this automation.</p>
            ) : (
              <ul className="space-y-2 max-h-80 overflow-y-auto">
                {automationScheduledJobs.map(job => {
                  const deal = data.deals.find(d => d.id === job.dealId);
                  return (
                    <li key={job.id} className="bg-gray-700/50 p-3 rounded-md">
                      <p className="font-semibold text-gray-200">Deal: {deal?.name || job.dealId}</p>
                      {job.executeAt && <p className="text-sm text-gray-400">Resumes: {new Date(job.executeAt).toLocaleString()}</p>}
                      {job.condition && <p className="text-sm text-gray-400">Condition: {job.condition}</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationsView;