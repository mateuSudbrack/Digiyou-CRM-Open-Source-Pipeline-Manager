import React from 'react';
import { ActivityNote } from '../types';
import { PlusIcon, ClipboardDocumentListIcon } from './icons';

interface ActivitiesViewProps {
  notes: ActivityNote[];
  onAddNote: () => void;
  onEditNote: (note: ActivityNote) => void;
}

const ActivitiesView: React.FC<ActivitiesViewProps> = ({ notes, onAddNote, onEditNote }) => {
    
  const sortedNotes = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
  const formatDateTime = (isoString: string): string => {
      if (!isoString) return '';
      return new Date(isoString).toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
      });
  };

  const getSnippet = (content: string) => {
    const stripped = content.replace(/#/g, '').replace(/```[\s\S]*?```/g, '[diagram]');
    return stripped.length > 100 ? stripped.substring(0, 100) + '...' : stripped;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Activities</h1>
        <button
          onClick={onAddNote}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Activity Note</span>
        </button>
      </div>

      {sortedNotes.length === 0 ? (
         <div className="text-center py-16 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-xl font-semibold text-white">No activity notes yet</h3>
            <p className="mt-1 text-sm text-gray-400">Get started by creating a new note for your team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedNotes.map(note => (
            <div 
                key={note.id}
                onClick={() => onEditNote(note)} 
                className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-5 flex flex-col justify-between hover:bg-gray-700/50 hover:border-blue-500/50 transition-all cursor-pointer"
            >
                <div>
                    <h2 className="font-bold text-xl truncate text-gray-100">{note.title}</h2>
                    <p className="text-gray-400 text-sm mt-2 h-16">{getSnippet(note.content)}</p>
                </div>
                <div className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-700">
                    Last updated: {formatDateTime(note.updatedAt)}
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivitiesView;
