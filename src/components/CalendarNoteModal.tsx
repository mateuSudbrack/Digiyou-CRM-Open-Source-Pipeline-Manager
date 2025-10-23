import React, { useState, useEffect } from 'react';
import { CalendarNote } from '../types';
import Modal from './Modal';
import { TrashIcon } from './icons';

interface CalendarNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Omit<CalendarNote, 'id' | 'createdAt'> | CalendarNote) => void;
  onDelete: (noteId: string) => void;
  note: CalendarNote | null;
  defaultDate?: string;
}

const CalendarNoteModal: React.FC<CalendarNoteModalProps> = ({ isOpen, onClose, onSave, onDelete, note, defaultDate }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setDate(note.date);
      } else {
        setTitle('');
        setContent('');
        setDate(defaultDate || '');
      }
    }
  }, [note, isOpen, defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const noteData = { title, content, date };

    if (note) {
      onSave({ ...note, ...noteData });
    } else {
      onSave(noteData as Omit<CalendarNote, 'id' | 'createdAt'>);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={note ? 'Edit Note' : 'New Calendar Note'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="note-title" className="block text-sm font-medium text-gray-300">Title</label>
          <input
            id="note-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
            required
          />
        </div>
         <div>
          <label htmlFor="note-date" className="block text-sm font-medium text-gray-300">Date</label>
          <input
            id="note-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="note-content" className="block text-sm font-medium text-gray-300">Content (Optional)</label>
          <textarea
            id="note-content"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
          />
        </div>
        <div className="flex justify-between items-center pt-4">
            <div>
              {note && (
                <button type="button" onClick={() => onDelete(note.id)} className="text-red-500 hover:text-red-400 font-bold py-2 px-4 rounded-lg hover:bg-red-500/10 flex items-center space-x-2">
                  <TrashIcon className="h-5 w-5"/>
                  <span>Delete</span>
                </button>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
                Cancel
              </button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                Save Note
              </button>
            </div>
        </div>
      </form>
    </Modal>
  );
};

export default CalendarNoteModal;