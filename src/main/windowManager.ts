import { BrowserWindow, screen, app } from 'electron'
import path from 'path'

const outputWindows: Map<number, BrowserWindow> = new Map()
let nextOutputId = 1

const outputPreloadPath = path.join(__dirname, '../preload-output.js')
const rendererOutputEntryPath = path.join(__dirname, '../../renderer/app/output.html')

type CreateOutputOptions = {
  fullScreen?: boolean
  show?: boolean
}

export function getDisplayInfo() {
  const allDisplays = screen.getAllDisplays()
  const primary = screen.getPrimaryDisplay()
  return allDisplays.map(d => ({
    id: d.id,
    label: d.label || (d.internal ? 'Built-in Display' : `Display ${d.id}`),
    bounds: d.bounds,
    size: d.size,
    workArea: d.workArea,
    isPrimary: d.id === primary.id,
    scaleFactor: d.scaleFactor,
    internal: d.internal,
    rotation: d.rotation,
    touchSupport: d.touchSupport,
    displayFrequency: d.displayFrequency || 60
  }))
}

export function createOutputWindow(displayId?: number | null, options: CreateOutputOptions = {}): number {
  const outId = nextOutputId++
  let targetDisplay = displayId
    ? screen.getAllDisplays().find(d => d.id === displayId)
    : undefined

  const bounds = targetDisplay?.workArea || { x: 0, y: 0, width: 960, height: 540 }
  const width = options.fullScreen ? bounds.width : Math.min(Math.round(bounds.width * 0.8), 1920)
  const height = options.fullScreen ? bounds.height : Math.min(Math.round(bounds.height * 0.8), 1080)

  const w = new BrowserWindow({
    width,
    height,
    x: options.fullScreen ? bounds.x : bounds.x + 50,
    y: options.fullScreen ? bounds.y : bounds.y + 50,
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
    },
    show: options.show ?? true,
  })
  w.loadFile(rendererOutputEntryPath, { query: { out: String(outId) } })
  if (options.fullScreen) {
    w.once('ready-to-show', () => {
      w.setBounds(bounds)
      w.setFullScreen(true)
      w.show()
    })
  }
  outputWindows.set(outId, w)

  w.on('closed', () => {
    outputWindows.delete(outId)
  })

  return outId
}

export function destroyOutputWindow(outId: number): boolean {
  const w = outputWindows.get(outId)
  if (!w || w.isDestroyed()) return false
  w.close()
  outputWindows.delete(outId)
  return true
}

export function getOutputWindows(): Map<number, BrowserWindow> {
  return outputWindows
}

export function getOutputWindowsArray(): BrowserWindow[] {
  return Array.from(outputWindows.values()).filter(w => !w.isDestroyed())
}

export function assignOutputToDisplay(outId: number, displayId: number): boolean {
  const w = outputWindows.get(outId)
  if (!w || w.isDestroyed()) return false
  const allDisplays = screen.getAllDisplays()
  const target = allDisplays.find(d => d.id === displayId)
  if (!target) return false
  w.setBounds(target.workArea)
  return true
}

export function createOrShowOutputOnDisplay(displayId: number, fullScreen = true): number {
  const existing = getOutputWindowList().find((item: any) => item.displayId === displayId)
  if (existing) {
    const w = outputWindows.get(existing.id)
    const target = screen.getAllDisplays().find(d => d.id === displayId)
    if (w && !w.isDestroyed()) {
      if (target) w.setBounds(target.workArea)
      if (fullScreen) w.setFullScreen(true)
      w.show()
      return existing.id
    }
  }
  return createOutputWindow(displayId, { fullScreen })
}

export function getOutputWindowList(): any[] {
  return Array.from(outputWindows.keys()).map(id => {
    const w = outputWindows.get(id)
    if (!w || w.isDestroyed()) return null
    const bounds = w.getBounds()
    const isFullScreen = w.isFullScreen()
    const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y })
    return {
      id,
      bounds,
      isFullScreen,
      displayId: display.id,
      displayLabel: display.label || `Display ${display.id}`
    }
  }).filter(Boolean)
}
