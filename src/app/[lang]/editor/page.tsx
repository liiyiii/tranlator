'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageCanvas from '@/components/ImageCanvas';
import EditorLayout from '@/components/EditorLayout'; // Import the new layout
import { ipcService, OCRBlock as IPC_OCRBlock } from '@/services/ipcService';
import { useEditorContext } from '@/contexts/EditorContext';
import { Area } from '@/types';

// Extend the front-end OCRBlock type to match the back-end
interface BackendOCRBlock extends IPC_OCRBlock {
  color?: string;
  backgroundColor?: string;
}

import SideToolbar from '@/components/SideToolbar'; // Import the new toolbar

function EditorPageContent() {
  const router = useRouter();
  const {
    setAreas,
    backgroundImageUrl,
    estimatedFontSize,
    setSelectedAreaIds,
    originalImageFile,
    setEditorMode,
    zoomIn,
    zoomOut,
    undo,
    redo,
  } = useEditorContext();

  const [isPartialScanning, setIsPartialScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to home if no image is loaded
  useEffect(() => {
    if (!originalImageFile) {
      router.replace('/'); // Use replace to not add to history
    }
  }, [originalImageFile, router]);

  const handleNewAreaSelected = async (bbox: [number, number, number, number]) => {
    if (!backgroundImageUrl) {
      setError("Original image not found for partial scan. Please upload an image first.");
      return;
    }
    setIsPartialScanning(true);
    setError(null);
    try {
      const originalPath = decodeURIComponent(backgroundImageUrl.replace('safe-file://', ''));
      const newBlock = await ipcService.partial(originalPath, bbox) as BackendOCRBlock | null;

      if (newBlock && newBlock.id) {
        const newArea: Area = {
          id: newBlock.id,
          bbox: bbox,
          sourceString: newBlock.text,
          translatedString: newBlock.translatedText || newBlock.text,
          style: {
            color: newBlock.color || '#FFFFFF',
            backgroundColor: newBlock.backgroundColor || 'rgba(139, 92, 246, 0.1)',
            fontSize: newBlock.fontSize || estimatedFontSize || 16,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
          }
        };
        setAreas((prevAreas) => [...prevAreas, newArea]);
        setSelectedAreaIds([newArea.id]);
      } else {
        setError("Partial scan did not return a new block.");
      }
    } catch (e: any) {
      setError(e.message || "Error during partial scan.");
    } finally {
      setIsPartialScanning(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if an input field is focused
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      // Mode Switching
      if (e.key.toLowerCase() === 'v') setEditorMode('select');
      if (e.key.toLowerCase() === 'h') setEditorMode('pan');
      if (e.key.toLowerCase() === 'r') setEditorMode('create');

      // Zooming
      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        zoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        zoomOut();
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setEditorMode, zoomIn, zoomOut, undo, redo]);

  // Render a loading state or null if we're redirecting
  if (!originalImageFile) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Loading or redirecting...</p>
        </div>
    );
  }

  const canvasNode = (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      {isPartialScanning && <p className="text-sm text-brand-green animate-pulse my-2 absolute top-2 z-10">Processing selected area...</p>}
      {error && <p className="text-lg text-red-500 my-4 absolute top-10 z-10">Error: {error}</p>}
      <ImageCanvas onNewAreaSelect={handleNewAreaSelected} />
    </div>
  );

  return (
    <EditorLayout
      toolbar={<SideToolbar />}
      canvas={canvasNode}
    />
  );
}

export default function EditorPageContainer() {
  return <EditorPageContent />;
}
