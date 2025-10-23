import React, { ReactNode } from 'react';
import Modal from './Modal';
import { TrashIcon } from './icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-gray-300">
        {children}
      </div>
      <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-700">
        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Cancel
        </button>
        <button 
          type="button" 
          onClick={onConfirm} 
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
        >
          <TrashIcon className="h-5 w-5"/>
          <span>Confirm Delete</span>
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;