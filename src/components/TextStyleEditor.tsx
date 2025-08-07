'use client';

import React from 'react';
import { useEditorContext } from '@/contexts/EditorContext';
import { Area, AreaStyle } from '@/types';
import {
  Bold, Italic, Underline, Palette, Type, AlignLeft, AlignCenter, AlignRight, Pilcrow
} from 'lucide-react';

const toHex = (c: number) => `0${c.toString(16)}`.slice(-2);
const rgbaToHex = (rgbaString: string = ''): string => {
  if (rgbaString.startsWith('#')) return rgbaString;
  const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#000000';
  return `#${toHex(Number(match[1]))}${toHex(Number(match[2]))}${toHex(Number(match[3]))}`;
};

// This component is responsible for editing the style of the selected text area(s).
const TextStyleEditor: React.FC = () => {
  const { areas, setAreas, selectedAreaIds, targetLang } = useEditorContext();

  const primarySelectedArea = areas.find(area => area.id === selectedAreaIds[0]);

  if (selectedAreaIds.length === 0 || !primarySelectedArea) {
    return (
        <div className="text-gray-500 text-sm">
            Select an object on the canvas to see its properties.
        </div>
    );
  }

  const updateStyle = (property: keyof AreaStyle, value: any) => {
    setAreas((prevAreas: Area[]) =>
      prevAreas.map((area: Area) =>
        selectedAreaIds.includes(area.id)
          ? { ...area, style: { ...area.style, [property]: value } }
          : area
      )
    );
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value, 10);
    if (!isNaN(newSize) && newSize > 0) {
      updateStyle('fontSize', newSize);
    }
  };

  const currentFontSize = primarySelectedArea.style.fontSize
    ? parseInt(String(primarySelectedArea.style.fontSize), 10)
    : 16;

  return (
    <div className="space-y-4">
      {/* Font Family */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Font</label>
        <select
          value={primarySelectedArea.style.fontFamily || "var(--font-inter), sans-serif"}
          onChange={(e) => updateStyle('fontFamily', e.target.value)}
          className="w-full bg-gray-700 text-white p-2 rounded text-sm focus:ring-brand-blue focus:border-brand-blue"
        >
          {targetLang === 'zh' ? (
            <>
              <option value="SimSun, sans-serif">宋体</option>
              <option value="SimHei, sans-serif">黑体</option>
              <option value="KaiTi, sans-serif">楷体</option>
              <option value="FangSong, sans-serif">仿宋</option>
              <option value="Microsoft YaHei, sans-serif">微软雅黑</option>
            </>
          ) : (
            <>
              <option value="var(--font-inter), sans-serif">Inter</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Times New Roman, serif">Times New Roman</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="Fira Code, monospace">Fira Code</option>
            </>
          )}
        </select>
      </div>

      {/* Font Size & Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Style</label>
        <div className="flex space-x-2">
          <input
            type="number"
            value={currentFontSize}
            onChange={handleFontSizeChange}
            className="w-20 bg-gray-700 text-white p-2 rounded text-sm focus:ring-brand-blue focus:border-brand-blue"
            min="1"
          />
          <div className="flex items-center bg-gray-700 rounded-md">
            <button
              onClick={() => updateStyle('fontWeight', primarySelectedArea.style.fontWeight === 'bold' ? 'normal' : 'bold')}
              title="Bold"
              className={`p-2 rounded-l-md hover:bg-gray-600 ${primarySelectedArea.style.fontWeight === 'bold' ? 'bg-brand-blue text-white' : 'text-gray-400'}`}
            ><Bold size={18} /></button>
            <button
              onClick={() => updateStyle('fontStyle', primarySelectedArea.style.fontStyle === 'italic' ? 'normal' : 'italic')}
              title="Italic"
              className={`p-2 hover:bg-gray-600 ${primarySelectedArea.style.fontStyle === 'italic' ? 'bg-brand-blue text-white' : 'text-gray-400'}`}
            ><Italic size={18} /></button>
            <button
              onClick={() => updateStyle('textDecoration', primarySelectedArea.style.textDecoration === 'underline' ? 'none' : 'underline')}
              title="Underline"
              className={`p-2 rounded-r-md hover:bg-gray-600 ${primarySelectedArea.style.textDecoration === 'underline' ? 'bg-brand-blue text-white' : 'text-gray-400'}`}
            ><Underline size={18} /></button>
          </div>
        </div>
      </div>

      {/* Text Alignment */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Alignment</label>
        <div className="flex items-center bg-gray-700 rounded-md w-min">
            {(['left', 'center', 'right'] as const).map(align => (
              <button
                key={align}
                onClick={() => updateStyle('textAlign', align)}
                title={`Align ${align.charAt(0).toUpperCase() + align.slice(1)}`}
                className={`p-2 rounded hover:bg-gray-600 ${primarySelectedArea.style.textAlign === align ? 'bg-brand-blue text-white' : 'text-gray-400'}`}
              >
                {align === 'left' && <AlignLeft size={18} />}
                {align === 'center' && <AlignCenter size={18} />}
                {align === 'right' && <AlignRight size={18} />}
              </button>
            ))}
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Colors</label>
        <div className="flex space-x-4">
            <div className="flex items-center space-x-2" title="Text Color">
                <Palette size={18} className="text-gray-400" />
                <input
                  type="color"
                  value={rgbaToHex(primarySelectedArea.style.color)}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  className="w-8 h-8 bg-transparent border-none rounded cursor-pointer"
                />
            </div>
            <div className="flex items-center space-x-2" title="Background Color">
                <div className="w-4 h-4 rounded border border-gray-500" style={{backgroundColor: primarySelectedArea.style.backgroundColor || 'transparent'}}></div>
                <input
                  type="color"
                  value={rgbaToHex(primarySelectedArea.style.backgroundColor)}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="w-8 h-8 bg-transparent border-none rounded cursor-pointer"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default TextStyleEditor;
