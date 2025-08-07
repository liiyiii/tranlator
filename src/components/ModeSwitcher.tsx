'use client';

import React from 'react';
import { useEditorContext } from '@/contexts/EditorContext';
import { MousePointer, Hand, PlusSquare } from 'lucide-react';

const ModeSwitcher: React.FC = () => {
  const { editorMode, setEditorMode } = useEditorContext();

  const buttons = [
    { mode: 'select', icon: MousePointer, label: 'Select & Edit' },
    { mode: 'pan', icon: Hand, label: 'Pan Canvas' },
    { mode: 'create', icon: PlusSquare, label: 'Create Text Area' },
  ];

  return (
    <div className="bg-gray-700 rounded-lg p-1 flex justify-between space-x-1">
      {buttons.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => setEditorMode(mode as any)}
          className={`w-full p-2 rounded-md transition-colors text-sm flex flex-col items-center space-y-1 ${
            editorMode === mode
              ? 'bg-brand-blue text-white'
              : 'text-gray-400 hover:bg-gray-600 hover:text-white'
          }`}
          title={label}
        >
          <Icon size={20} />
          <span>{label.split(' ')[0]}</span>
        </button>
      ))}
    </div>
  );
};

export default ModeSwitcher;
