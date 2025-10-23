import React, { useState } from 'react';
import { Stage } from '../types';
import Modal from './Modal';
import { crmService } from '../services/crmService';
import { PlusIcon, EditIcon, TrashIcon } from './icons';

interface StageModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineId: string | null;
  stages: Stage[];
  refreshData: () => Promise<void>;
  onDeleteStage: (stageId: string) => void;
}

const StageModal: React.FC<StageModalProps> = ({ isOpen, onClose, pipelineId, stages, refreshData, onDeleteStage }) => {
  const [inputValue, setInputValue] = useState('');
  const [editingStage, setEditingStage] = useState<Stage | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !pipelineId) return;

    if (editingStage) {
      await crmService.updateStage(editingStage.id, { name: inputValue });
    } else {
      await crmService.createStage(pipelineId, inputValue);
    }
    setInputValue('');
    setEditingStage(null);
    await refreshData();
  };

  const startEdit = (stage: Stage) => {
    setEditingStage(stage);
    setInputValue(stage.name);
  };
  
  const cancelEdit = () => {
    setEditingStage(null);
    setInputValue('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Stages">
      <div className="space-y-4">
        <form onSubmit={handleSave} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={editingStage ? 'Rename stage' : 'New stage name'}
            className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
            required
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-lg">
            {editingStage ? 'Save' : <PlusIcon className="h-5 w-5" />}
          </button>
          {editingStage && (
            <button type="button" onClick={cancelEdit} className="bg-gray-600 hover:bg-gray-500 text-white font-bold p-2 rounded-lg">
              Cancel
            </button>
          )}
        </form>

        <ul className="divide-y divide-gray-700 max-h-80 overflow-y-auto">
          {stages.sort((a,b) => a.order - b.order).map(stage => (
            <li key={stage.id} className="py-2 flex justify-between items-center">
              <span>{stage.name}</span>
              <div className="space-x-2">
                <button onClick={() => startEdit(stage)} className="text-gray-400 hover:text-white"><EditIcon className="w-4 h-4" /></button>
                <button onClick={() => onDeleteStage(stage.id)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};

export default StageModal;