'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useEditorContext } from '@/contexts/EditorContext';
import { Area, AreaStyle } from '@/types';
import {
  Bold, Italic, Underline, Palette, Type, CornerUpLeft, RotateCcw, RotateCw,
  AlignLeft, AlignCenter, AlignRight, Pilcrow, X
} from 'lucide-react';

const toHex = (c: number) => `0${c.toString(16)}`.slice(-2);
const rgbaToHex = (rgbaString: string = ''): string => {
  if (rgbaString.startsWith('#')) return rgbaString;
  const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#000000';
  return `#${toHex(Number(match[1]))}${toHex(Number(match[2]))}${toHex(Number(match[3]))}`;
};

const TextEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const {
    areas, setAreas,
    selectedAreaId, setSelectedAreaId,
    undo, redo, canUndo, canRedo
  } = useEditorContext();

  const [editorPosition, setEditorPosition] = useState({ top: 10, left: 10 });

  const selectedArea = areas.find(area => area.id === selectedAreaId);

  if (!selectedAreaId || !selectedArea) {
    return null;
  }

  const updateStyle = (property: keyof AreaStyle, value: any) => {
    setAreas((prevAreas: Area[]) =>
      prevAreas.map((area: Area) =>
        area.id === selectedAreaId
          ? { ...area, style: { ...area.style, [property]: value } }
          : area
      )
    );
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value, 10);
    if (!isNaN(newSize) && newSize > 0) {
      // **【关键修复】** 传递纯数字，以匹配 AreaStyle['fontSize'] 的 number 类型
      updateStyle('fontSize', newSize);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateStyle('color', e.target.value);
  };

  const handleBgColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateStyle('backgroundColor', e.target.value);
  };

  const toggleBold = () => {
    updateStyle('fontWeight', selectedArea.style.fontWeight === 'bold' ? 'normal' : 'bold');
  };

  const currentFontSize = selectedArea.style.fontSize
    ? parseInt(String(selectedArea.style.fontSize), 10)
    : 16;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${editorPosition.top}px`,
        left: `${editorPosition.left}px`,
        zIndex: 1000,
      }}
      className="bg-gray-800 p-3 rounded-lg shadow-2xl border border-gray-700 flex items-center space-x-2"
      onClick={(e) => e.stopPropagation()}
      ref={editorRef}
    >
      <button
        onClick={() => setSelectedAreaId(null)}
        className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors mr-2"
        title="Close editor"
      >
        <X size={18} />
      </button>

      <div className="flex items-center">
        <Type size={18} className="text-gray-400 mr-1" />
        <input
          type="number"
          value={currentFontSize}
          onChange={handleFontSizeChange}
          className="w-16 bg-gray-700 text-white p-1 rounded text-sm focus:ring-brand-blue focus:border-brand-blue"
          min="1"
        />
      </div>

      <div className="flex items-center" title="Text Color">
         <Palette size={18} className="text-gray-400 mr-1" />
        <input
          type="color"
          value={rgbaToHex(selectedArea.style.color)}
          onChange={handleColorChange}
          className="w-8 h-8 bg-transparent border-none rounded cursor-pointer"
        />
      </div>

      <div className="flex items-center" title="Background Color">
        <div className="w-4 h-4 rounded border border-gray-500 mr-1" style={{backgroundColor: selectedArea.style.backgroundColor || 'transparent'}}></div>
        <input
          type="color"
          value={rgbaToHex(selectedArea.style.backgroundColor)}
          onChange={handleBgColorChange}
          className="w-8 h-8 bg-transparent border-none rounded cursor-pointer"
        />
      </div>

      <button
        onClick={toggleBold}
        title="Bold"
        className={`p-2 rounded hover:bg-gray-700 ${selectedArea.style.fontWeight === 'bold' ? 'bg-brand-blue text-white' : 'text-gray-400'}`}
      >
        <Bold size={18} />
      </button>

      <button
        onClick={() => updateStyle('fontStyle', selectedArea.style.fontStyle === 'italic' ? 'normal' : 'italic')}
        title="Italic"
        className={`p-2 rounded hover:bg-gray-700 ${selectedArea.style.fontStyle === 'italic' ? 'bg-brand-blue text-white' : 'text-gray-400'}`}
      >
        <Italic size={18} />
      </button>

      <button
        onClick={() => updateStyle('textDecoration', selectedArea.style.textDecoration === 'underline' ? 'none' : 'underline')}
        title="Underline"
        className={`p-2 rounded hover:bg-gray-700 ${selectedArea.style.textDecoration === 'underline' ? 'bg-brand-blue text-white' : 'text-gray-400'}`}
      >
        <Underline size={18} />
      </button>

      <div className="flex items-center space-x-1 bg-gray-700 rounded-md p-0.5">
        {(['left', 'center', 'right'] as const).map(align => (
          <button
            key={align}
            onClick={() => updateStyle('textAlign', align)}
            title={`Align ${align.charAt(0).toUpperCase() + align.slice(1)}`}
            className={`p-1.5 rounded hover:bg-gray-600 ${selectedArea.style.textAlign === align ? 'bg-brand-blue text-white' : 'text-gray-400'}`}
          >
            {align === 'left' && <AlignLeft size={16} />}
            {align === 'center' && <AlignCenter size={16} />}
            {align === 'right' && <AlignRight size={16} />}
          </button>
        ))}
      </div>

      <div className="flex items-center">
        <Pilcrow size={18} className="text-gray-400 mr-1" />
        <select
          value={selectedArea.style.fontFamily || "var(--font-inter), sans-serif"}
          onChange={(e) => updateStyle('fontFamily', e.target.value)}
          className="bg-gray-700 text-white p-1 rounded text-sm focus:ring-brand-blue focus:border-brand-blue appearance-none"
          style={{maxWidth: '100px'}}
        >
          <option value="var(--font-inter), sans-serif">Inter</option>
          <option value="Fira Code, monospace">Fira Code</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Times New Roman, serif">Times New Roman</option>
          <option value="Georgia, serif">Georgia</option>
        </select>
      </div>

      <button
        onClick={() => setSelectedAreaId(null)}
        title="Deselect"
        className="p-2 rounded hover:bg-gray-700 text-gray-400"
      >
        <CornerUpLeft size={18} />
      </button>

      <div className="ml-auto flex items-center space-x-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo"
          className="p-2 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo"
          className="p-2 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCw size={18} />
        </button>
      </div>
    </div>
  );
};

export default TextEditor;
