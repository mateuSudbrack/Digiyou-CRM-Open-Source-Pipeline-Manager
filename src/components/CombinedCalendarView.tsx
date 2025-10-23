import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Deal, Task, CalendarNote } from '../types';
import { PlusIcon } from './icons';

interface CombinedCalendarViewProps {
  deals: Deal[];
  tasks: Task[];
  notes: CalendarNote[];
  onDealClick: (deal: Deal) => void;
  onTaskClick: (task: Task) => void;
  onNoteClick: (note: CalendarNote) => void;
  onAddNewItem: (date: string, itemType: 'deal' | 'task' | 'note') => void;
  onScheduleExistingDeal: (date: string) => void;
}

type CalendarViewTab = 'deals' | 'tasks';

const CombinedCalendarView: React.FC<CombinedCalendarViewProps> = ({ 
    deals, tasks, notes, 
    onDealClick, onTaskClick, onNoteClick, 
    onAddNewItem, onScheduleExistingDeal 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<CalendarViewTab>('deals');
  const [addMenuDate, setAddMenuDate] = useState<string | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
            setAddMenuDate(null);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
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
  
  const tasksByDate = useMemo(() => {
      const map = new Map<string, Task[]>();
      tasks.forEach(task => {
        if (task.dueDate) {
          if (!map.has(task.dueDate)) map.set(task.dueDate, []);
          map.get(task.dueDate)!.push(task);
        }
      });
      return map;
  }, [tasks]);

  const notesByDate = useMemo(() => {
      const map = new Map<string, CalendarNote[]>();
      notes.forEach(note => {
        if (!map.has(note.date)) map.set(note.date, []);
        map.get(note.date)!.push(note);
      });
      return map;
  }, [notes]);

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  
  const handleAddClick = (e: React.MouseEvent, date: string) => {
    e.stopPropagation();
    setAddMenuDate(date);
  };
  
  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="border-r border-b border-gray-700"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = date.toISOString().split('T')[0];
    const dealsForDay = dealsByDate.get(dateKey) || [];
    const tasksForDay = tasksByDate.get(dateKey) || [];
    const notesForDay = notesByDate.get(dateKey) || [];

    calendarDays.push(
      <div key={day} className="relative group border-r border-b border-gray-700 p-2 min-h-[140px] flex flex-col">
        <div className="flex justify-between items-center">
            <span className="font-bold text-sm">{day}</span>
            <button onClick={(e) => handleAddClick(e, dateKey)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-600">
                <PlusIcon className="h-4 w-4" />
            </button>
        </div>
        
        {addMenuDate === dateKey && (
            <div ref={addMenuRef} className="absolute z-20 right-2 top-8 w-56 bg-gray-800 border border-gray-600 rounded-md shadow-lg py-1">
                {activeTab === 'deals' && (
                    <>
                        <button onClick={() => { onAddNewItem(addMenuDate, 'deal'); setAddMenuDate(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Add New Deal</button>
                        <div className="border-t border-gray-700 my-1"></div>
                        <button onClick={() => { onScheduleExistingDeal(addMenuDate); setAddMenuDate(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Schedule Existing Deal</button>
                    </>
                )}
                 {activeTab === 'tasks' && (
                    <>
                        <button onClick={() => { onAddNewItem(addMenuDate, 'task'); setAddMenuDate(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Add Task</button>
                        <button onClick={() => { onAddNewItem(addMenuDate, 'note'); setAddMenuDate(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Add Note</button>
                    </>
                 )}
            </div>
        )}

        <div className="flex-grow overflow-y-auto mt-1 space-y-1 text-xs">
            {activeTab === 'deals' && dealsForDay.map(deal => (
                <div key={deal.id} onClick={() => onDealClick(deal)} className="bg-blue-600/50 hover:bg-blue-500/80 p-1 rounded-md cursor-pointer">
                    <p className="font-semibold truncate">{deal.name}</p>
                    <p className="text-blue-200">{formatCurrency(deal.value)}</p>
                </div>
            ))}
            {activeTab === 'tasks' && (
                <>
                    {notesForDay.map(note => (
                        <div key={note.id} onClick={() => onNoteClick(note)} className="bg-purple-600/50 hover:bg-purple-500/80 p-1 rounded-md cursor-pointer">
                            <p className="font-semibold truncate">{note.title}</p>
                        </div>
                    ))}
                    {tasksForDay.map(task => (
                        <div key={task.id} onClick={() => onTaskClick(task)} className={`p-1 rounded-md cursor-pointer ${task.isCompleted ? 'bg-gray-600/50 hover:bg-gray-500/80' : 'bg-yellow-600/50 hover:bg-yellow-500/80'}`}>
                            <p className={`font-semibold truncate ${task.isCompleted ? 'line-through' : ''}`}>{task.title}</p>
                        </div>
                    ))}
                </>
            )}
        </div>
      </div>
    );
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const viewTitle = activeTab === 'deals' ? "Deal Closing Calendar" : "Task & Note Calendar";

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div className="flex items-baseline space-x-4">
            <h1 className="text-3xl font-bold">{viewTitle}</h1>
            <div className="border-b border-gray-700">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button onClick={() => setActiveTab('deals')} className={`${activeTab === 'deals' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>
                        Fechamentos Previstos
                    </button>
                    <button onClick={() => setActiveTab('tasks')} className={`${activeTab === 'tasks' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>
                        Tasks & Notes
                    </button>
                </nav>
            </div>
        </div>
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

export default CombinedCalendarView;