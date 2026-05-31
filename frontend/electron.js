import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    title: "HotelCloud SaaS Operations Desk",
    backgroundColor: '#0b0f19'
  });

  // Suppress default top menu bars for professional software visual aesthetics
  mainWindow.setMenuBarVisibility(false);

  // Load the compiled Vite index.html file
  mainWindow.loadFile(path.join(__dirname, 'dist/index.html')).catch((err) => {
    console.error('Failed to load compiled Vite application:', err);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
