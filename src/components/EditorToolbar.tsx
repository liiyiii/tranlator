'use client';

import React from 'react';
import { useEditorContext } from '@/contexts/EditorContext';
import { MousePointer, Hand, PlusSquare } from 'lucide-react';

const EditorToolbar: React.FC = () => {
  const { editorMode, setEditorMode } = useEditorContext();

  const buttons = [
    { mode: 'select', icon: MousePointer, label: 'Select' },
    { mode: 'pan', icon: Hand, label: 'Pan' },
    { mode: 'create', icon: PlusSquare, label: 'Create Area' },
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-gray-800 p-2 rounded-lg shadow-lg flex items-center space-x-2">
      {buttons.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => setEditorMode(mode as any)}
          className={`p-2 rounded-md transition-colors ${
            editorMode === mode
              ? 'bg-brand-blue text-white'
              : 'text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
          title={label}
        >
          <Icon size={20} />
        </button>
      ))}
    </div>
  );
};

export default EditorToolbar;
