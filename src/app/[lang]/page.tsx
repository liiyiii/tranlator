'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useEditorContext } from '@/contexts/EditorContext';
import { ipcService } from '@/services/ipcService';
import { UploadCloud } from 'lucide-react';
import { Area } from '@/types';

// This is the new Home Page, serving as the upload center.
export default function HomePage() {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;

  const {
    setAreas,
    setBackgroundImageUrl,
    setOriginalImageFile,
    setEstimatedFontSize,
  } = useEditorContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const processFileAndNavigate = React.useCallback(async (file: File) => {
    // Reset context state for the new image
    setOriginalImageFile(file);
    setFileName(file.name);
    setError(null);
    setIsLoading(true);
    setAreas([]);
    setBackgroundImageUrl(null);

    try {
      const response = await ipcService.full(file);
      if (response.error) {
        setError(response.error);
        setIsLoading(false);
        return; // Stop if there's an error
      }

      // Set the context with the new data
      setBackgroundImageUrl(`safe-file://${response.imagePath}`);
      setEstimatedFontSize(response.estimatedFontSize || 16);
      const newAreas: Area[] = response.ocrData.map(block => ({
        id: block.id,
        bbox: block.bbox,
        sourceString: block.text,
        translatedString: block.translatedText || block.text,
        style: {
          color: block.color || '#FFFFFF',
          backgroundColor: block.backgroundColor || 'rgba(255, 255, 255, 0)',
          fontSize: block.fontSize || response.estimatedFontSize || 16,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'left',
        }
      }));
      setAreas(newAreas);

      // Navigate to the editor page on success
      router.push(`/${lang}/editor`);

    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
    // No need to set isLoading to false here, as the page will navigate away
  }, [setOriginalImageFile, setFileName, setError, setIsLoading, setAreas, setBackgroundImageUrl, setEstimatedFontSize, router, lang]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFileAndNavigate(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFileAndNavigate(file);
    } else {
      setError("Invalid file type. Please drop an image.");
    }
  };

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (isLoading) return;
      const items = event.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              event.preventDefault();
              processFileAndNavigate(file);
              break;
            }
          }
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isLoading, processFileAndNavigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-2xl text-center mb-10">
        <h1 className="text-5xl font-bold text-brand-blue mb-4">Image Translator</h1>
        <p className="text-lg text-gray-400">
          Instantly translate text within your images. Just drop an image below to get started.
        </p>
      </div>

      <div className={`w-full max-w-lg bg-gray-800 p-6 rounded-xl shadow-xl transition-all duration-300 ${isDraggingOver ? 'ring-4 ring-brand-blue ring-offset-2 ring-offset-gray-900' : ''}`}>
        <label
          htmlFor="imageUpload"
          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDraggingOver ? 'border-brand-blue bg-gray-600' : 'border-gray-600 bg-gray-700 hover:bg-gray-600'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isLoading ? (
            <div className="flex flex-col items-center">
              <p className="text-lg text-brand-blue animate-pulse">Processing image...</p>
              <p className="text-sm text-gray-400 mt-2">Please wait, this may take a moment.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadCloud className={`w-12 h-12 mb-4 ${isDraggingOver ? 'text-brand-blue' : 'text-gray-400'}`} />
              <p className={`mb-2 text-md ${isDraggingOver ? 'text-white' : 'text-gray-400'}`}>
                <span className="font-semibold text-brand-blue">Click to upload</span>, drag & drop, or paste image
              </p>
              <p className={`text-sm ${isDraggingOver ? 'text-gray-300' : 'text-gray-500'}`}>PNG, JPG, WEBP (MAX. 10MB)</p>
            </div>
          )}
          <input
            type="file"
            id="imageUpload"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
          />
        </label>
        {fileName && !isLoading && <p className="mt-3 text-sm text-center text-gray-400">Selected: {fileName}</p>}
        {error && <p className="text-lg text-red-500 my-4">Error: {error}</p>}
      </div>
    </div>
  );
}