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

  // Wrap and load the live deployed cloud client for instant OTA updates
  mainWindow.loadURL('https://hotel-management-system-one.vercel.app').catch((err) => {
    console.error('Failed to load live Vercel application:', err);
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
