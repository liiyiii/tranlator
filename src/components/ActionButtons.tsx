'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useEditorContext } from '@/contexts/EditorContext';
import { Download, ArrowLeft, FileJson, Image as ImageIcon } from 'lucide-react';

// Helper function to trigger file download
const downloadFile = (filename: string, content: string, mimeType: string) => {
  const element = document.createElement('a');
  element.setAttribute('href', `${mimeType},${encodeURIComponent(content)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const downloadBlob = (filename: string, blob: Blob) => {
  const element = document.createElement('a');
  const url = URL.createObjectURL(blob);
  element.setAttribute('href', url);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(url);
};

const ActionButtons: React.FC = () => {
  const { areas, backgroundImageUrl, originalImageFile, triggerJPGExport } = useEditorContext();
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;

  const handleExportJSON = () => {
    if (areas.length === 0) return;
    const filename = `${originalImageFile?.name.replace(/\.[^/.]+$/, "") || 'export'}_translated.json`;
    const jsonContent = JSON.stringify(areas, null, 2);
    downloadFile(filename, jsonContent, 'data:application/json;charset=utf-8');
  };

  const handleExportJPG = () => {
    if (!backgroundImageUrl) return;
    const dataUrl = triggerJPGExport();
    if (dataUrl) {
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          downloadBlob(`${originalImageFile?.name.replace(/\.[^/.]+$/, "") || 'export'}.jpg`, blob);
        });
    }
  };

  const handleGoBack = () => {
      router.push(`/${lang}`);
  }

  return (
    <div className="space-y-3">
        <button
          onClick={handleGoBack}
          className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md transition-colors duration-150"
        >
          <ArrowLeft size={18} className="mr-2" /> Back to Home
        </button>
        <button
          onClick={handleExportJPG}
          disabled={!backgroundImageUrl}
          className="w-full flex items-center justify-center px-4 py-2 bg-brand-blue hover:bg-blue-700 text-white font-semibold rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ImageIcon size={18} className="mr-2" /> Export as JPG
        </button>
        <button
          onClick={handleExportJSON}
          disabled={areas.length === 0}
          className="w-full flex items-center justify-center px-4 py-2 bg-brand-green hover:bg-green-700 text-white font-semibold rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileJson size={18} className="mr-2" /> Export as JSON
        </button>
    </div>
  );
};

export default ActionButtons;
