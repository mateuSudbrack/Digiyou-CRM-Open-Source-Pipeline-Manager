import React from 'react';
import { Deal, Contact, DealStatus } from '../types';
import { DollarSignIcon, UserIcon } from './icons';

interface DealCardProps {
  deal: Deal;
  contact?: Contact;
  onDragStart: (dealId: string, stageId: string) => void;
  onDragEnd: () => void;
  onClick: () => void;
}

const DealCard: React.FC<DealCardProps> = ({ deal, contact, onDragStart, onDragEnd, onClick }) => {

  const statusBorders: { [key in DealStatus]: string } = {
    [DealStatus.OPEN]: 'border-l-4 border-blue-500',
    [DealStatus.WON]: 'border-l-4 border-green-500',
    [DealStatus.LOST]: 'border-l-4 border-red-500',
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDateTime = (isoString: string): string => {
      if (!isoString) return '';
      return new Date(isoString).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
      });
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    // This is a shim required by Firefox to initiate the drag operation.
    // The actual deal data is managed by React state in the parent component, not here.
    e.dataTransfer.setData('text/plain', deal.id);
    e.dataTransfer.effectAllowed = "move";
    onDragStart(deal.id, deal.stageId);
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`bg-gray-800 p-4 rounded-lg shadow-md mb-3 cursor-pointer hover:bg-gray-700 transition-colors duration-200 ${statusBorders[deal.status]}`}
    >
      <h4 className="font-bold text-md text-white">{deal.name}</h4>
      <div className="text-sm text-gray-400 mt-2 space-y-1">
        <div className="flex items-center space-x-2">
            <DollarSignIcon className="h-4 w-4 text-green-400" />
            <span>{formatCurrency(deal.value)}</span>
        </div>
        {contact && (
            <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4 text-gray-400"/>
                <span>{contact.name}</span>
            </div>
        )}
      </div>
      <div className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-700">
        Last updated: {formatDateTime(deal.updatedAt)}
      </div>
    </div>
  );
};

export default DealCard;
