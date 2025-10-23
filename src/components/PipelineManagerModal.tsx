import React, { useState } from 'react';
import { Pipeline } from '../types';
import Modal from './Modal';
import { crmService } from '../services/crmService';
import { PlusIcon, EditIcon, TrashIcon } from './icons';

interface PipelineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelines: Pipeline[];
  refreshData: () => Promise<void>;
  onDeletePipeline: (pipelineId: string) => void;
}

const PipelineManagerModal: React.FC<PipelineManagerModalProps> = ({ isOpen, onClose, pipelines, refreshData, onDeletePipeline }) => {
  const [inputValue, setInputValue] = useState('');
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (editingPipeline) {
      await crmService.updatePipeline(editingPipeline.id, { name: inputValue });
    } else {
      await crmService.createPipeline(inputValue);
    }
    setInputValue('');
    setEditingPipeline(null);
    await refreshData();
  };

  const startEdit = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline);
    setInputValue(pipeline.name);
  };
  
  const cancelEdit = () => {
    setEditingPipeline(null);
    setInputValue('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Pipelines">
      <div className="space-y-4">
        <form onSubmit={handleSave} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={editingPipeline ? 'Rename pipeline' : 'New pipeline name'}
            className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
            required
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-lg">
            {editingPipeline ? 'Save' : <PlusIcon className="h-5 w-5" />}
          </button>
          {editingPipeline && (
            <button type="button" onClick={cancelEdit} className="bg-gray-600 hover:bg-gray-500 text-white font-bold p-2 rounded-lg">
              Cancel
            </button>
          )}
        </form>

        <ul className="divide-y divide-gray-700 max-h-80 overflow-y-auto">
          {pipelines.map(pipeline => (
            <li key={pipeline.id} className="py-2 flex justify-between items-center">
              <span>{pipeline.name}</span>
              <div className="space-x-2">
                <button onClick={() => startEdit(pipeline)} className="text-gray-400 hover:text-white"><EditIcon className="w-4 h-4" /></button>
                <button onClick={() => onDeletePipeline(pipeline.id)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};

export default PipelineManagerModal;