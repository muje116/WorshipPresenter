import { app, BrowserWindow } from 'electron'
import path from 'path'
import { startSyncServer } from '../main/sync'
import { initDB } from './db'
import { registerOutputWindows, setupIPC } from './ipc'

let mainWindow: BrowserWindow | null = null
const outputWindows: BrowserWindow[] = []

async function createWindows() {
  const operatorPreloadPath = path.join(__dirname, '../preload.js')
  const outputPreloadPath = path.join(__dirname, '../preload-output.js')
  const rendererEntryPath = path.join(__dirname, '../../renderer/app/index.html')

  // Main operator window - uses the new React app
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: operatorPreloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0f172a',
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  })
  
  // Load the new React app
  mainWindow.loadFile(rendererEntryPath)
  
  // Show window when ready to prevent flash
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Two output windows (for demonstration)
  for (let i = 0; i < 2; i++) {
    const w = new BrowserWindow({
      width: 960,
      height: 540,
      x: 100 + i * 20,
      y: 100,
      minWidth: 320,
      minHeight: 180,
      frame: true,
      resizable: true,
      minimizable: true,
      maximizable: true,
      closable: true,
      backgroundColor: '#000000',
      webPreferences: {
        preload: outputPreloadPath,
        contextIsolation: true,
        nodeIntegration: false,
      }
    })
    w.loadFile(rendererEntryPath, { query: { out: String(i + 1) } })
    outputWindows.push(w)
  }
  
  // Register output windows with IPC
  registerOutputWindows(outputWindows)
}

app.whenReady().then(async () => {
  await initDB()
  createWindows()
  setupIPC()
  // Start the WebSocket-based sync service for multi-machine coordination
  startSyncServer(9090)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindows()
  }
})
