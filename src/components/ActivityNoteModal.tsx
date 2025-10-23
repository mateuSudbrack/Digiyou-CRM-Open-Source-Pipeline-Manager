import React, { useState, useEffect, useRef } from 'react';
import { ActivityNote } from '../types';
import { TrashIcon } from './icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';

interface ActivityNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Omit<ActivityNote, 'id' | 'createdAt' | 'updatedAt' | 'companyId'> | ActivityNote) => void;
  onDelete: (noteId: string) => void;
  note: ActivityNote | null;
}

const CodeBlock: React.FC<any> = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const [mermaidSvg, setMermaidSvg] = useState('');
    const [error, setError] = useState('');
    const mermaidId = `mermaid-svg-${useRef(Date.now() + Math.random()).current}`;

    useEffect(() => {
        if (match && match[1] === 'mermaid' && children) {
            const graphDefinition = String(children);
            try {
                // Ensure mermaid container exists, otherwise it might fail on fast re-renders
                 if (!document.getElementById(mermaidId)) {
                    const el = document.createElement('div');
                    el.id = mermaidId;
                    el.style.visibility = 'hidden';
                    el.style.position = 'absolute';
                    document.body.appendChild(el);
                 }

                mermaid.render(mermaidId, graphDefinition, (svg) => {
                    setMermaidSvg(svg);
                    setError('');
                });
            } catch (e) {
                setError('Invalid Mermaid syntax');
                console.error(e);
            }
        }
    }, [children, match, mermaidId]);

    if (match && match[1] === 'mermaid') {
        if (error) return <pre className="bg-red-900/50 text-red-300 p-2 rounded text-sm">{error}</pre>;
        return <div className="mermaid-container" dangerouslySetInnerHTML={{ __html: mermaidSvg }} />;
    }

    return !inline && match ? (
        <pre className="bg-gray-900/70 p-4 rounded-md overflow-x-auto text-sm">
            <code className={className} {...props}>
                {children}
            </code>
        </pre>
    ) : (
        <code className={`bg-gray-700 text-red-300 rounded-sm px-1 py-0.5 text-sm ${className}`} {...props}>
            {children}
        </code>
    );
};

const ActivityNoteModal: React.FC<ActivityNoteModalProps> = ({ isOpen, onClose, onSave, onDelete, note }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        mermaid.initialize({ startOnLoad: false, theme: 'dark', darkMode: true, securityLevel: 'loose' });
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (note) {
                setTitle(note.title);
                setContent(note.content);
            } else {
                setTitle('');
                setContent('# New Note\n\nStart writing here...');
            }
        }
    }, [note, isOpen]);

    const handleSave = async () => {
        setIsSaving(true);
        const noteData = { title, content };
        if (note) {
            await onSave({ ...note, ...noteData });
        } else {
            await onSave(noteData as Omit<ActivityNote, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>);
        }
        setIsSaving(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col border border-gray-700" onClick={(e) => e.stopPropagation()}>
                <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-700">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Note Title"
                        className="text-2xl font-bold bg-transparent focus:bg-gray-900/50 rounded-md p-2 -m-2 outline-none focus:ring-2 focus:ring-blue-500 w-1/2 text-white"
                        required
                    />
                    <div className="flex items-center space-x-3">
                        {note && (
                            <button onClick={() => onDelete(note.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-700" aria-label="Delete note">
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        )}
                        <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Close</button>
                        <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden">
                    <div className="flex flex-col h-full">
                        <label htmlFor="markdown-editor" className="text-sm font-semibold text-gray-400 mb-2">Editor</label>
                        <textarea
                            id="markdown-editor"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="flex-grow w-full bg-gray-900/50 border border-gray-600 rounded-md p-4 text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Write your markdown here..."
                        />
                    </div>
                    <div className="flex flex-col h-full overflow-hidden">
                        <label className="text-sm font-semibold text-gray-400 mb-2">Preview</label>
                         <div className="flex-grow w-full bg-gray-900/50 border border-gray-600 rounded-md p-4 overflow-y-auto prose prose-invert prose-sm max-w-none prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-table:w-full prose-th:bg-gray-700 prose-tr:border-gray-600 prose-td:border-gray-600">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{ code: CodeBlock }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityNoteModal;
