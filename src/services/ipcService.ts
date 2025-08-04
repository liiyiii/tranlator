// Define types (can be moved to a central types/ file later)
export interface OCRBlock {
  id: string;
  bbox: [number, number, number, number]; // x1, y1, x2, y2
  text: string;
  translatedText?: string;
  // Add other potential fields like confidence, original_text, etc.
}

export interface IPCResponse {
  imagePath: string; // Path to the background image (could be a data URL for mock)
  ocrData: OCRBlock[];
  estimatedFontSize?: number;
  error?: string; // Optional error message
}

export const ipcService = {
  async full(imageFile: File): Promise<IPCResponse> {
    if (!window.electronAPI) {
      throw new Error("Electron API is not available.");
    }
    const imagePath = await window.electronAPI.saveTempFile(imageFile);
    const result = await window.electronAPI.ocrFull(imagePath);
    return { ...result, imagePath };
  },

  async partial(imagePath: string, bbox: [number, number, number, number]): Promise<OCRBlock | null> {
    if (!window.electronAPI) {
      throw new Error("Electron API is not available.");
    }
    const result = await window.electronAPI.ocrPartial(imagePath, bbox);
    return result.newBlock;
  },
};

declare global {
  interface Window {
    electronAPI: {
      ocrFull: (imagePath: string) => Promise<any>;
      ocrPartial: (imagePath: string, bbox: [number, number, number, number]) => Promise<any>;
      saveTempFile: (file: File) => Promise<string>;
    };
  }
}
