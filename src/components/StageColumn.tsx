import React, { useState } from 'react';
import { Stage, Deal, Contact } from '../types';
import DealCard from './DealCard';
import { EditIcon, TrashIcon, PlusIcon } from './icons';

interface StageColumnProps {
  stage: Stage;
  deals: Deal[];
  contacts: Contact[];
  draggedDealInfo: { id: string; stageId: string } | null;
  onDrop: (stageId: string) => void;
  onDealDragStart: (dealId: string, stageId: string) => void;
  onDealDragEnd: () => void;
  onDealClick: (deal: Deal) => void;
  onEditStage: (stage: Stage) => void;
  onDeleteStage: (stageId: string) => void;
  onAddNewDeal: (stageId: string) => void;
}

const StageColumn: React.FC<StageColumnProps> = ({ 
    stage, 
    deals, 
    contacts, 
    draggedDealInfo,
    onDrop, 
    onDealDragStart,
    onDealDragEnd,
    onDealClick, 
    onEditStage, 
    onDeleteStage, 
    onAddNewDeal
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedDealInfo && draggedDealInfo.stageId !== stage.id) {
        setIsDragOver(true);
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedDealInfo && draggedDealInfo.stageId !== stage.id) {
        onDrop(stage.id);
    }
    setIsDragOver(false);
  };

  const totalValue = deals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);
  const formatCurrency = (value: number) => {
    if (isNaN(value)) {
        return 'R$ 0,00'; // Or some other default value
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div
      className={`bg-gray-900 rounded-lg p-3 w-80 flex-shrink-0 flex flex-col transition-all duration-200 ${isDragOver ? 'bg-blue-900/50 border border-dashed border-blue-400' : 'border border-transparent'}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex justify-between items-center mb-4 px-1">
        <div>
            <h3 className="font-bold text-lg text-white">{stage.name}</h3>
            <p className="text-sm text-gray-400">{deals.length} deals - {formatCurrency(totalValue)}</p>
        </div>
        <div className="flex items-center space-x-2">
            <button onClick={() => onAddNewDeal(stage.id)} className="text-gray-400 hover:text-white" aria-label={`Add new deal to ${stage.name}`}><PlusIcon className="w-5 h-5" /></button>
            <button onClick={() => onEditStage(stage)} className="text-gray-400 hover:text-white" aria-label={`Edit stage ${stage.name}`}><EditIcon className="w-4 h-4" /></button>
            <button onClick={() => onDeleteStage(stage.id)} className="text-gray-400 hover:text-red-500" aria-label={`Delete stage ${stage.name}`}><TrashIcon className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto pr-2" style={{maxHeight: 'calc(100vh - 250px)'}}>
        {deals.map(deal => (
          <DealCard
            key={deal.id}
            deal={deal}
            contact={contacts.find(c => c.id === deal.contactId)}
            onDragStart={onDealDragStart}
            onDragEnd={onDealDragEnd}
            onClick={() => onDealClick(deal)}
          />
        ))}
      </div>
    </div>
  );
};

export default StageColumn;
