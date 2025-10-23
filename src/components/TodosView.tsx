
import React from 'react';
import { Task } from '../types';
import { PlusIcon, TrashIcon, EditIcon } from './icons';

interface TodosViewProps {
  tasks: Task[];
  onAddTask: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onEditTask: (task: Task) => void;
}

const TodosView: React.FC<TodosViewProps> = ({ tasks, onAddTask, onUpdateTask, onDeleteTask, onEditTask }) => {
    
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) {
            return a.isCompleted ? 1 : -1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    const completedCount = tasks.filter(t => t.isCompleted).length;
    const totalCount = tasks.length;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 text-white max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold">To-Do List</h1>
                 <button
                    onClick={onAddTask}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>New Task</span>
                </button>
            </div>
             <p className="text-gray-400 mb-6">{totalCount > 0 ? `${completedCount} of ${totalCount} tasks complete` : 'No tasks yet. Add one to get started!'}</p>

            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6">
                <ul className="divide-y divide-gray-700">
                    {sortedTasks.map(task => (
                        <li key={task.id} className="py-3 flex items-center justify-between group">
                            <div className="flex items-center space-x-3 flex-grow">
                                <input
                                    type="checkbox"
                                    checked={task.isCompleted}
                                    onChange={(e) => {
                                        onUpdateTask(task.id, { isCompleted: e.target.checked })
                                    }}
                                    className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600 flex-shrink-0"
                                    aria-label={`Mark task as complete: ${task.title}`}
                                />
                                <div className="flex-grow">
                                    <span className={`text-lg transition-text ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                                        {task.title}
                                    </span>
                                    {task.dueDate && (
                                        <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${task.isCompleted ? 'bg-gray-700 text-gray-400' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                            Due: {formatDate(task.dueDate)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEditTask(task)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-600" aria-label={`Edit task: ${task.title}`}>
                                    <EditIcon className="h-5 w-5"/>
                                </button>
                                <button onClick={() => onDeleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-600" aria-label={`Delete task: ${task.title}`}>
                                    <TrashIcon className="h-5 w-5"/>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
                {tasks.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Your to-do list is empty. Add a task to get started!</p>
                )}
            </div>
        </div>
    );
};

export default TodosView;
