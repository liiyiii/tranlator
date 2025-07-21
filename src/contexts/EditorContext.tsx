// image-translator-new/src/contexts/EditorContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { Area } from '@/types'; 

interface EditorContextType {
  areas: Area[];
  setAreas: (newAreasOrCallback: SetStateAction<Area[]>, storeInHistory?: boolean) => void; 
  selectedAreaId: string | null;
  setSelectedAreaId: Dispatch<SetStateAction<string | null>>;
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
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

let fabricInstance: fabric.Canvas | null = null;

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
  const [areasInternal, setAreasInternal] = useState<Area[]>([]); 
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [estimatedFontSize, setEstimatedFontSize] = useState<number | null>(16);
  
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

  return (
    <EditorContext.Provider value={{
      areas: areasInternal,
      setAreas,
      selectedAreaId, setSelectedAreaId,
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
      }
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