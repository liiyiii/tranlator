'use client';

import React, { ReactNode } from 'react';

interface EditorLayoutProps {
  toolbar: ReactNode;
  canvas: ReactNode;
}

const EditorLayout: React.FC<EditorLayoutProps> = ({ toolbar, canvas }) => {
  return (
    <div className="w-full h-screen bg-gray-900 flex text-white">
      {/* Sidebar for Tools */}
      <aside className="w-1/4 max-w-xs h-full bg-gray-800 p-4 overflow-y-auto">
        {toolbar}
      </aside>

      {/* Main Content Area for Canvas */}
      <main className="flex-1 h-full flex items-center justify-center p-4 bg-gray-900">
        {canvas}
      </main>
    </div>
  );
};

export default EditorLayout;
