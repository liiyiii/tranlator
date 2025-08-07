'use client';

import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  show: boolean;
  onClose: () => void;
  menuItems: { label: string; action: () => void; }[];
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, show, onClose, menuItems }) => {
  if (!show) {
    return null;
  }

  return (
    <div
      className="absolute z-50 bg-gray-800 border border-gray-700 rounded-md shadow-lg"
      style={{ top: y, left: x }}
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ul>
        {menuItems.map((item, index) => (
          <li key={index}>
            <button
              className="w-full px-4 py-2 text-left text-white hover:bg-gray-700"
              onClick={item.action}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;
