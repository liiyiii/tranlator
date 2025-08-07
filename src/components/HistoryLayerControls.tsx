'use client';

import React from 'react';
import { useEditorContext } from '@/contexts/EditorContext';
import { RotateCcw, RotateCw, ChevronsUp, ChevronsDown } from 'lucide-react';

const HistoryLayerControls: React.FC = () => {
  const {
    undo, redo, canUndo, canRedo,
    areas, setAreas, selectedAreaIds
  } = useEditorContext();

  const handleBringToFront = () => {
    if (selectedAreaIds.length === 0) return;
    setAreas((prevAreas) => {
      const selected = prevAreas.filter(a => selectedAreaIds.includes(a.id));
      const others = prevAreas.filter(a => !selectedAreaIds.includes(a.id));
      return [...others, ...selected];
    });
  };

  const handleSendToBack = () => {
    if (selectedAreaIds.length === 0) return;
    setAreas((prevAreas) => {
      const selected = prevAreas.filter(a => selectedAreaIds.includes(a.id));
      const others = prevAreas.filter(a => !selectedAreaIds.includes(a.id));
      return [...selected, ...others];
    });
  };

  const hasSelection = selectedAreaIds.length > 0;

  return (
    <div className="flex flex-col space-y-2">
       {/* History Buttons */}
       <div className="flex items-center bg-gray-700 rounded-md w-min">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo"
            className="p-2 rounded-l-md hover:bg-gray-600 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo"
            className="p-2 rounded-r-md hover:bg-gray-600 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCw size={18} />
          </button>
       </div>
       {/* Layer Buttons */}
       <div className="flex items-center bg-gray-700 rounded-md w-min">
          <button
            onClick={handleBringToFront}
            disabled={!hasSelection}
            title="Bring to Front"
            className="p-2 rounded-l-md hover:bg-gray-600 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsUp size={18} />
          </button>
          <button
            onClick={handleSendToBack}
            disabled={!hasSelection}
            title="Send to Back"
            className="p-2 rounded-r-md hover:bg-gray-600 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsDown size={18} />
          </button>
       </div>
    </div>
  );
};

export default HistoryLayerControls;
