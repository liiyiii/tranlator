'use client';

import React from 'react';
import ModeSwitcher from './ModeSwitcher';
import TextStyleEditor from './TextStyleEditor';
import HistoryLayerControls from './HistoryLayerControls';
import ZoomControls from './ZoomControls';
import ActionButtons from './ActionButtons';

// This is the main container for all the editor controls.
// It will be composed of smaller, more focused components.
const SideToolbar = () => {
  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Tools</h3>
        <ModeSwitcher />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Properties</h3>
        <TextStyleEditor />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Actions</h3>
        <div className="space-y-4">
          <HistoryLayerControls />
          <ZoomControls />
        </div>
      </div>
      <div className="mt-auto pt-6">
         <ActionButtons />
      </div>
    </div>
  );
};

export default SideToolbar;
