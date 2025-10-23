import React, { useState, useMemo } from 'react';
import { Deal } from '../types';
import Modal from './Modal';

interface ScheduleDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (dealId: string) => void;
  deals: Deal[]; // unscheduled deals
  date: string | null;
}

const ScheduleDealModal: React.FC<ScheduleDealModalProps> = ({ isOpen, onClose, onSchedule, deals, date }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDeals = useMemo(() => {
        if (!searchTerm) return deals;
        return deals.filter(deal => deal.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [deals, searchTerm]);
    
    if (!isOpen) return null;

    const formattedDate = date ? new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }) : '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Schedule a Deal for ${formattedDate}`}>
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="Search for a deal..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
                    autoFocus
                />
                <ul className="divide-y divide-gray-700 max-h-80 overflow-y-auto">
                    {filteredDeals.length > 0 ? filteredDeals.map(deal => (
                        <li key={deal.id} className="py-2 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-white">{deal.name}</p>
                                <p className="text-sm text-gray-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}</p>
                            </div>
                            <button
                                onClick={() => onSchedule(deal.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-sm"
                            >
                                Schedule
                            </button>
                        </li>
                    )) : (
                        <li className="py-4 text-center text-gray-500">
                            {deals.length === 0 ? "All deals are already scheduled." : "No unscheduled deals match your search."}
                        </li>
                    )}
                </ul>
                 <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ScheduleDealModal;