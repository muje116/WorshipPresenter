import { app, BrowserWindow, screen } from 'electron'
import path from 'path'
import { startSyncServer } from '../main/sync'
import { initDB } from './db'
import { registerOutputWindows, setupIPC } from './ipc'
import { createOutputWindow, getOutputWindowsArray, getDisplayInfo, createOrShowOutputOnDisplay } from './windowManager'

let mainWindow: BrowserWindow | null = null
let splashWindow: BrowserWindow | null = null

const operatorPreloadPath = path.join(__dirname, '../preload.js')
const rendererEntryPath = path.join(__dirname, '../../renderer/app/index.html')

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    backgroundColor: '#0b1326',
    show: true,
  })

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          html, body { margin: 0; height: 100%; background: #0b1326; color: #dae2fd; font-family: "Segoe UI", Arial, sans-serif; }
          body { display: grid; place-items: center; }
          .loader { width: 320px; text-align: center; }
          .brand { font-size: 24px; font-weight: 800; margin-bottom: 6px; }
          .sub { color: #c6c5d4; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 24px; }
          .bar { height: 7px; border-radius: 999px; background: #171f33; overflow: hidden; border: 1px solid #454652; }
          .fill { height: 100%; width: 45%; border-radius: inherit; background: linear-gradient(90deg, #bbc3ff, #5e75ff); animation: load 1.2s ease-in-out infinite; }
          .status { margin-top: 14px; color: #a8b0cc; font-size: 13px; }
          @keyframes load { 0% { transform: translateX(-120%); } 100% { transform: translateX(240%); } }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="brand">WorshipPresenter</div>
          <div class="sub">Preparing sanctuary control</div>
          <div class="bar"><div class="fill"></div></div>
          <div class="status">Loading songs, media, Bibles, and displays...</div>
        </div>
      </body>
    </html>`

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
}

async function createWindows() {
  createSplashWindow()
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

  mainWindow.loadFile(rendererEntryPath)

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    splashWindow?.close()
    splashWindow = null
  })

  // Create output windows on non-primary displays by default
  const displays = screen.getAllDisplays()
  const nonPrimary = displays.filter(d => d.id !== screen.getPrimaryDisplay().id)
  const createdIds: number[] = []

  if (nonPrimary.length > 0) {
    for (const display of nonPrimary) {
      const outId = createOutputWindow(display.id, { fullScreen: true })
      createdIds.push(outId)
    }
  } else {
    // No secondary displays found - create two output windows on primary
    const outId = createOutputWindow(null)
    createdIds.push(outId)
    const outId2 = createOutputWindow(null)
    createdIds.push(outId2)
  }

  // Register output windows with IPC
  registerOutputWindows(getOutputWindowsArray())
}

app.whenReady().then(async () => {
  await initDB()
  createWindows()
  setupIPC()

  // Listen for display changes
  screen.on('display-added', (_event, display) => {
    if (display.id !== screen.getPrimaryDisplay().id) {
      createOrShowOutputOnDisplay(display.id, true)
      registerOutputWindows(getOutputWindowsArray())
    }
    mainWindow?.webContents.send('displays-changed', getDisplayInfo())
  })
  screen.on('display-removed', () => {
    mainWindow?.webContents.send('displays-changed', getDisplayInfo())
  })
  screen.on('display-metrics-changed', () => {
    mainWindow?.webContents.send('displays-changed', getDisplayInfo())
  })

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
