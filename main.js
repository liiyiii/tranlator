const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

let mainWindow;

function registerSafeFileProtocol() {
  protocol.registerFileProtocol('safe-file', (request, callback) => {
    try {
      const url = request.url.substring('safe-file://'.length);
      const decodedPath = decodeURIComponent(url);
      const finalPath = path.normalize(decodedPath);
      callback({ path: finalPath });
    } catch (error) {
      console.error('Failed to handle safe-file protocol request:', request.url, error);
      callback({ error: -1 });
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'out', 'index.html'));
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  registerSafeFileProtocol();
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.handle('save-temp-file', async (event, file) => {
    const tempPath = path.join(os.tmpdir(), file.name);
    fs.writeFileSync(tempPath, file.bytes);
    return tempPath;
});

ipcMain.handle('ocr-full', async (event, imagePath) => {
    return executePythonScript('full_ocr.py', [imagePath]);
});

ipcMain.handle('ocr-partial', async (event, { imagePath, bbox }) => {
    const bboxStr = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`;
    return executePythonScript('partial_ocr.py', [imagePath, '--bbox', bboxStr]);
});

// **【采纳了您的方案后的最终版本】**
function executePythonScript(scriptName, args) {
  return new Promise((resolve, reject) => {
    const pythonPath = 'python';
    const scriptPath = path.join(__dirname, 'python', scriptName);
    
    // **【关键修改】** 设置环境变量强制 Python 使用 UTF-8
    const pythonProcess = spawn(pythonPath, [scriptPath, ...args], {
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONLEGACYWINDOWSFSENCODING: 'utf-8' // 针对 Windows 的额外保障
      }
    });
    
    let stdoutData = '';
    let stderrData = '';
    
    // 明确使用 utf8 解码
    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString('utf8');
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString('utf8');
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdoutData.trim());
          resolve(result);
        } catch (parseError) {
          reject(new Error(`JSON解析失败: ${parseError.message}\n原始数据: ${stdoutData}`));
        }
      } else {
        reject(new Error(`Python脚本执行失败 (code ${code}): ${stderrData}`));
      }
    });

    pythonProcess.on('error', (err) => {
        reject(new Error(`无法启动子进程: ${err.message}`));
    });
  });
}