import { ipcMain, BrowserWindow, app, dialog } from 'electron'
import { db } from './db'
import { broadcastState } from './sync'
import { importOsisBibleFromFile, loadOsisTranslations } from './osisLoader'
import path from 'path'
import fs from 'fs'

let outputWindows: BrowserWindow[] = []
let ipcRegistered = false
const ndiState: { enabled: boolean; lastPayload: any } = {
  enabled: false,
  lastPayload: null
}
let overrideAction: 'BLACK' | 'LOGO' | null = null

export function registerOutputWindows(windows: BrowserWindow[]) {
  outputWindows = windows
}

export function setupIPC() {
  if (ipcRegistered) return
  ipcRegistered = true
  // Simple DB bridge: execute read/write SQL via IPC
  ipcMain.handle('db.run', (_event, payload: { sql: string; params?: any[] }) => {
    const { sql, params } = payload
    const stmt = db.prepare(sql)
    const upper = sql.trim().toUpperCase()
    if (upper.startsWith('SELECT')) {
      return stmt.all(params || [])
    } else {
      const info = stmt.run(params || [])
      return { changes: info.changes, lastInsertRowid: info.lastInsertRowid }
    }
  })

  // Output control: BLACK/LOGO/CLEAR
  ipcMain.on('output-action', (_ev, payload: { action: string }) => {
    const action = payload.action
    overrideAction = action === 'CLEAR' ? null : (action as 'BLACK' | 'LOGO')
    for (const w of outputWindows) {
      if (!w.isDestroyed()) {
        if (action === 'FULLSCREEN') {
          w.setFullScreen(true)
        } else {
          w.webContents.send('output-action', { action })
        }
      }
    }
  })

  ipcMain.on('output-window-control', (_ev, payload: { outId: number; action: string; bounds?: { width?: number; height?: number; x?: number; y?: number } }) => {
    const target = outputWindows[payload.outId - 1]
    if (!target || target.isDestroyed()) return
    const action = payload.action
    if (action === 'minimize') target.minimize()
    else if (action === 'maximize') target.maximize()
    else if (action === 'restore') target.restore()
    else if (action === 'close') target.hide()
    else if (action === 'show') target.show()
    else if (action === 'toggle-fullscreen') target.setFullScreen(!target.isFullScreen())
    else if (action === 'resize' && payload.bounds?.width && payload.bounds?.height) {
      const [x, y] = target.getPosition()
      target.setBounds({
        x: payload.bounds.x ?? x,
        y: payload.bounds.y ?? y,
        width: Math.max(320, payload.bounds.width),
        height: Math.max(180, payload.bounds.height),
      })
    } else if (action === 'move') {
      const [x, y] = target.getPosition()
      target.setPosition(payload.bounds?.x ?? x, payload.bounds?.y ?? y)
    }
  })

  // State updates to outputs (operator can push a new slide state)
  ipcMain.on('output-set-state', (_ev, payload: { outId: number; state: any }) => {
    const idx = payload.outId - 1
    const target = outputWindows[idx]
    const state = overrideAction === 'BLACK'
      ? { ...payload.state, mode: 'black' }
      : overrideAction === 'LOGO'
        ? { ...payload.state, mode: 'logo', slideTitle: 'Church Logo' }
        : payload.state

    if (target && !target.isDestroyed()) {
      target.webContents.send('output-state', { outputId: payload.outId, state })
    }

    if (ndiState.enabled) {
      ndiState.lastPayload = { outId: payload.outId, state }
      console.log('[NDI STUB] Broadcasting output state', ndiState.lastPayload)
    }

    try {
      broadcastState({ outId: payload.outId, state })
    } catch {
      // ignore if sync server isn't running
    }
  })

  ipcMain.handle('ndi.enable', async (_ev, enabled: boolean) => {
    ndiState.enabled = Boolean(enabled)
    console.log(`[NDI STUB] ${ndiState.enabled ? 'enabled' : 'disabled'}`)
    return { enabled: ndiState.enabled }
  })

  ipcMain.handle('ndi.status', async () => ({
    enabled: ndiState.enabled,
    lastPayload: ndiState.lastPayload
  }))

  ipcMain.handle('dialog.openFiles', async (_ev, options?: {
    title?: string
    filters?: Array<{ name: string; extensions: string[] }>
    multiSelections?: boolean
  }) => {
    const result = await dialog.showOpenDialog({
      title: options?.title,
      filters: options?.filters,
      properties: options?.multiSelections ? ['openFile', 'multiSelections'] : ['openFile']
    })
    if (result.canceled) return []
    return result.filePaths
  })

  ipcMain.handle('fs.readTextFile', async (_ev, filePath: string) => {
    return fs.promises.readFile(filePath, 'utf8')
  })

  registerBibleHandlers()
}

function registerBibleHandlers() {
  ipcMain.handle('bibles.importFromOsis', async (_ev, args) => {
    const { translationCode, language, filePath } = args
    try {
      const bibleId = await importOsisBibleFromFile(translationCode, language, filePath)
      return bibleId
    } catch (err) {
      return { error: (err as Error).message }
    }
  })

  ipcMain.handle('bibles.openOsisFile', async () => {
    const res = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'OSIS XML', extensions: ['osis', 'xml'] }] })
    if (res.canceled || res.filePaths.length === 0) return null
    return res.filePaths[0]
  })

  ipcMain.handle('bibles.listTranslations', async () => {
    const osisPaths = [
      path.join(app.getPath('userData'), 'bibles', 'niv.osis'),
      path.join(app.getPath('userData'), 'bibles', 'kjv.osis')
    ]
    try {
      const translations = await loadOsisTranslations(osisPaths)
      if (translations.length > 0) return translations
    } catch {}
    try {
      const rows = db.prepare('SELECT translation AS code, translation AS name, language FROM bibles').all()
      return rows.map((r: any) => ({ code: r.code ?? r.translation, name: r.name ?? r.translation, language: r.language }))
    } catch {
      return []
    }
  })

  ipcMain.handle('bibles.getBooks', async () => [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
    'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
  ])

  ipcMain.handle('bibles.getChapters', async (_ev, args: { book: string }) => {
    try {
      const rows = db.prepare('SELECT DISTINCT chapter FROM verses WHERE book = ? ORDER BY chapter').all(args.book)
      return rows.map((r: any) => r.chapter)
    } catch {
      return []
    }
  })

  ipcMain.handle('bibles.getVerses', async (_ev, args: { book: string; chapter: number; translationId?: number }) => {
    const { book, chapter, translationId } = args
    try {
      let sql = 'SELECT verse, text FROM verses WHERE book = ? AND chapter = ? ORDER BY verse'
      const params: any[] = [book, chapter]
      if (translationId) {
        sql = 'SELECT v.verse, v.text FROM verses v WHERE v.bible_id = ? AND v.book = ? AND v.chapter = ? ORDER BY v.verse'
        params.unshift(translationId)
      }
      return db.prepare(sql).all(...params)
    } catch {
      return []
    }
  })

  ipcMain.handle('bibles.search', async (_ev, args: { query: string; translationId?: number }) => {
    const { query, translationId } = args
    try {
      let sql = 'SELECT book, chapter, verse, text FROM verses WHERE text LIKE ? ORDER BY book, chapter, verse LIMIT 100'
      const params: any[] = [`%${query}%`]
      if (translationId) {
        sql = 'SELECT v.book, v.chapter, v.verse, v.text FROM verses v WHERE v.bible_id = ? AND v.text LIKE ? ORDER BY v.book, v.chapter, v.verse LIMIT 100'
        params.unshift(translationId)
      }
      return db.prepare(sql).all(...params)
    } catch {
      return []
    }
  })
}
