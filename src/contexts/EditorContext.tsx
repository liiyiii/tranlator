// image-translator-new/src/contexts/EditorContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { Area } from '@/types'; 

interface EditorContextType {
  areas: Area[];
  setAreas: (newAreasOrCallback: SetStateAction<Area[]>, storeInHistory?: boolean) => void;
  selectedAreaIds: string[];
  setSelectedAreaIds: Dispatch<SetStateAction<string[]>>;
  backgroundImageUrl: string | null;
  setBackgroundImageUrl: Dispatch<SetStateAction<string | null>>;
  originalImageFile: File | null;
  setOriginalImageFile: Dispatch<SetStateAction<File | null>>;
  estimatedFontSize: number | null;
  setEstimatedFontSize: Dispatch<SetStateAction<number | null>>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  triggerJPGExport: () => string | null;
  setFabricCanvasInstance: (canvas: fabric.Canvas | null) => void;
  sourceLang: string;
  targetLang: string;
  editorMode: 'pan' | 'select' | 'create';
  setEditorMode: Dispatch<SetStateAction<'pan' | 'select' | 'create'>>;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  zoom: number;
  setZoom: Dispatch<SetStateAction<number>>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

let fabricInstance: fabric.Canvas | null = null;

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
  const [areasInternal, setAreasInternal] = useState<Area[]>([]);
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [estimatedFontSize, setEstimatedFontSize] = useState<number | null>(16);
  const [editorMode, setEditorMode] = useState<'pan' | 'select' | 'create'>('select');
  const [zoom, setZoom] = useState(1);

  const [history, setHistory] = useState<Area[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const MAX_HISTORY_LENGTH = 30;

  const setAreas = (newAreasOrCallback: SetStateAction<Area[]>, storeInHistory: boolean = true) => {
    setAreasInternal((currentAreas: Area[]) => {
      const newAreas = typeof newAreasOrCallback === 'function' 
        ? newAreasOrCallback(currentAreas) 
        : newAreasOrCallback;

      if (storeInHistory) {
        const currentHistorySnapshot = history[historyIndex];
        if (JSON.stringify(currentHistorySnapshot) !== JSON.stringify(newAreas)) {
            const newHistorySlice = history.slice(0, historyIndex + 1);
            const updatedHistory = [...newHistorySlice, newAreas];
            
            setHistory(
              updatedHistory.length > MAX_HISTORY_LENGTH 
                ? updatedHistory.slice(updatedHistory.length - MAX_HISTORY_LENGTH) 
                : updatedHistory
            );
            setHistoryIndex(
              updatedHistory.length > MAX_HISTORY_LENGTH 
                ? MAX_HISTORY_LENGTH - 1 
                : updatedHistory.length - 1
            );
        }
      }
      return newAreas;
    });
  };
  
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setAreasInternal(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setAreasInternal(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };
  
  useEffect(() => {
    if ((areasInternal.length > 0 && (history.length === 1 && history[0].length === 0)) || 
        (areasInternal.length === 0 && !(history.length === 1 && history[0].length === 0))) {
      setHistory([areasInternal]);
      setHistoryIndex(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areasInternal]);

  const setCanvasZoom = (newZoom: number) => {
    if (!fabricInstance) return;
    const center = fabricInstance.getCenter();
    fabricInstance.zoomToPoint(new fabric.Point(center.left, center.top), newZoom);
    setZoom(newZoom);
  };

  const zoomIn = () => setCanvasZoom(zoom * 1.2);
  const zoomOut = () => setCanvasZoom(zoom / 1.2);
  const zoomToFit = () => {
      if (!fabricInstance || !fabricInstance.width || !fabricInstance.height) return;
      fabricInstance.setViewportTransform([1, 0, 0, 1, 0, 0]); // Reset pan
      const image = fabricInstance.backgroundImage;
      if (!image || !image.width || !image.height) {
        setCanvasZoom(1);
        return;
      }
      const scaleX = fabricInstance.width / image.width;
      const scaleY = fabricInstance.height / image.height;
      setCanvasZoom(Math.min(scaleX, scaleY) * 0.9); // 90% of fit
  };

  return (
    <EditorContext.Provider value={{
      areas: areasInternal,
      setAreas,
      selectedAreaIds, setSelectedAreaIds,
      backgroundImageUrl, setBackgroundImageUrl,
      originalImageFile, setOriginalImageFile,
      estimatedFontSize, setEstimatedFontSize,
      undo,
      redo,
      canUndo: historyIndex > 0,
      canRedo: historyIndex < history.length - 1,
      triggerJPGExport: () => {
        if (fabricInstance) {
          return fabricInstance.toDataURL({ format: 'jpeg', quality: 0.9 });
        }
        return null;
      },
      setFabricCanvasInstance: (canvas: fabric.Canvas | null) => {
        fabricInstance = canvas;
        if (canvas) {
            canvas.on('zoom', () => {
                setZoom(canvas.getZoom());
            });
        }
      },
      sourceLang: 'en',
      targetLang: 'zh',
      editorMode,
      setEditorMode,
      zoomIn,
      zoomOut,
      zoomToFit,
      zoom,
      setZoom
    }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditorContext = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }
  return context;
};