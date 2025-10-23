import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Deal } from '../types';
import { PlusIcon } from './icons';

interface CalendarViewProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onAddNewItem: (date: string, itemType: 'deal') => void;
  onScheduleExistingDeal: (date: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ deals, onDealClick, onAddNewItem, onScheduleExistingDeal }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [addMenuDate, setAddMenuDate] = useState<string | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const daysInMonth = lastDayOfMonth.getDate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
            setAddMenuDate(null);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [addMenuRef]);

  const dealsByDate = useMemo(() => {
    const map = new Map<string, Deal[]>();
    deals.forEach(deal => {
      if (deal.data_vencimento) {
        if (!map.has(deal.data_vencimento)) map.set(deal.data_vencimento, []);
        map.get(deal.data_vencimento)!.push(deal);
      }
    });
    return map;
  }, [deals]);


  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  
  const handleAddClick = (e: React.MouseEvent, date: string) => {
    e.stopPropagation();
    setAddMenuDate(date);
  };
  
  const handleAddNewDeal = () => {
    if (addMenuDate) {
        onAddNewItem(addMenuDate, 'deal');
        setAddMenuDate(null);
    }
  };
  
  const handleScheduleExistingDeal = () => {
    if (addMenuDate) {
        onScheduleExistingDeal(addMenuDate);
        setAddMenuDate(null);
    }
  };

  const calendarDays = [];
  // Add empty cells for days before the 1st of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="border-r border-b border-gray-700"></div>);
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = date.toISOString().split('T')[0];
    const dealsForDay = dealsByDate.get(dateKey) || [];

    calendarDays.push(
      <div key={day} className="relative group border-r border-b border-gray-700 p-2 min-h-[140px] flex flex-col">
        <div className="flex justify-between items-center">
            <span className="font-bold text-sm">{day}</span>
            <button onClick={(e) => handleAddClick(e, dateKey)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-600">
                <PlusIcon className="h-4 w-4" />
            </button>
        </div>
        
        {addMenuDate === dateKey && (
            <div ref={addMenuRef} className="absolute z-20 right-2 top-8 w-48 bg-gray-800 border border-gray-600 rounded-md shadow-lg py-1">
                <button onClick={handleAddNewDeal} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Add New Deal</button>
                <div className="border-t border-gray-700 my-1"></div>
                <button onClick={handleScheduleExistingDeal} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Schedule Existing Deal</button>
            </div>
        )}

        <div className="flex-grow overflow-y-auto mt-1 space-y-1 text-xs">
            {dealsForDay.map(deal => (
                <div key={deal.id} onClick={() => onDealClick(deal)} className="bg-blue-600/50 hover:bg-blue-500/80 p-1 rounded-md cursor-pointer">
                    <p className="font-semibold truncate">{deal.name}</p>
                    <p className="text-blue-200">{formatCurrency(deal.value)}</p>
                </div>
            ))}
        </div>
      </div>
    );
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Fechamentos Previstos</h1>
        <div className="flex items-center space-x-4">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-md hover:bg-gray-700">&lt;</button>
          <span className="text-xl font-semibold w-48 text-center">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-md hover:bg-gray-700">&gt;</button>
        </div>
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-lg">
        <div className="grid grid-cols-7">
          {weekdays.map(day => (
            <div key={day} className="text-center font-bold p-3 border-b border-r border-gray-700 bg-gray-900">{day}</div>
          ))}
          {calendarDays}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;