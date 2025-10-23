
import React, { useState, useEffect } from 'react';
import { Task, Contact, Deal } from '../types';
import Modal from './Modal';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'isCompleted' | 'companyId'> | Task) => void;
  task: Partial<Task> | null;
  contacts: Contact[];
  deals: Deal[];
  defaultDate?: string;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, task, contacts, deals, defaultDate }) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [contactId, setContactId] = useState<string | undefined>(undefined);
  const [dealId, setDealId] = useState<string | undefined>(undefined);

  const isEditing = task && 'id' in task;

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title || '');
        setDueDate(task.dueDate);
        setContactId(task.contactId);
        setDealId(task.dealId);
      } else {
        setTitle('');
        setDueDate(defaultDate);
        setContactId(undefined);
        setDealId(undefined);
      }
    }
  }, [task, isOpen, defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData = {
      ...task,
      title,
      dueDate: dueDate || undefined,
      contactId: contactId || undefined,
      dealId: dealId || undefined,
    };
    
    // Ensure we don't send an empty object as a full task
    const finalTaskData = isEditing ? taskData : { title: taskData.title, dueDate: taskData.dueDate, contactId: taskData.contactId, dealId: taskData.dealId };

    onSave(finalTaskData as Task);
  };



  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Task' : 'New Task'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="task-title" className="block text-sm font-medium text-gray-300">Title</label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="task-dueDate" className="block text-sm font-medium text-gray-300">Due Date (Optional)</label>
          <input
            id="task-dueDate"
            type="date"
            value={dueDate || ''}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
          />
        </div>

        <div>
          <label htmlFor="task-contact" className="block text-sm font-medium text-gray-300">Link to Contact (Optional)</label>
          <select
            id="task-contact"
            value={contactId || ''}
            onChange={(e) => {
              setContactId(e.target.value || undefined);
              if (e.target.value) setDealId(undefined);
            }}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
            disabled={!!dealId}
          >
            <option value="">None</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="task-deal" className="block text-sm font-medium text-gray-300">Link to Deal (Optional)</label>
          <select
            id="task-deal"
            value={dealId || ''}
            onChange={(e) => {
              setDealId(e.target.value || undefined);
              if (e.target.value) setContactId(undefined);
            }}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
            disabled={!!contactId}
          >
            <option value="">None</option>
            {deals.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
            Cancel
          </button>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
            Save Task
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;
