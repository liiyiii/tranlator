const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  ocrFull: (imagePath) => ipcRenderer.invoke('ocr-full', imagePath),
  ocrPartial: (imagePath, bbox) => ipcRenderer.invoke('ocr-partial', { imagePath, bbox }),
  saveTempFile: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const buffer = Buffer.from(reader.result);
        ipcRenderer.invoke('save-temp-file', { name: file.name, bytes: buffer })
          .then(resolve)
          .catch(reject);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }
});
