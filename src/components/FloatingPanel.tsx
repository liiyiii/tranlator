'use client';

import React, { useState, useRef } from 'react';
import { Minus, ChevronsUpDown } from 'lucide-react';

interface FloatingPanelProps {
  title: string;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
}

const FloatingPanel: React.FC<FloatingPanelProps> = ({ title, children, initialPosition = { x: 20, y: 80 } }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && panelRef.current) {
      setPosition({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={panelRef}
      className="absolute bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-20"
      style={{ top: position.y, left: position.x, minWidth: '250px' }}
    >
      <div
        className="flex items-center justify-between p-2 bg-gray-900 rounded-t-lg cursor-move"
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-white"
          >
            {isMinimized ? <ChevronsUpDown size={16} /> : <Minus size={16} />}
          </button>
        </div>
      </div>
      {!isMinimized && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default FloatingPanel;
