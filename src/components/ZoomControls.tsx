'use client';

import React from 'react';
import { useEditorContext } from '@/contexts/EditorContext';
import { ZoomIn, ZoomOut, Expand } from 'lucide-react';

const ZoomControls: React.FC = () => {
  const { zoom, zoomIn, zoomOut, zoomToFit } = useEditorContext();

  return (
    <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-gray-400">Zoom</label>
        <div className="flex items-center bg-gray-700 rounded-md w-min">
            <button onClick={zoomOut} title="Zoom Out" className="p-2 rounded-l-md hover:bg-gray-600 text-gray-400">
                <ZoomOut size={18} />
            </button>
            <div className="px-3 text-sm text-white">
                {Math.round(zoom * 100)}%
            </div>
            <button onClick={zoomIn} title="Zoom In" className="p-2 hover:bg-gray-600 text-gray-400">
                <ZoomIn size={18} />
            </button>
            <button onClick={zoomToFit} title="Zoom to Fit" className="p-2 rounded-r-md hover:bg-gray-600 text-gray-400">
                <Expand size={18} />
            </button>
        </div>
    </div>
  );
};

export default ZoomControls;
