import { ipcMain, BrowserWindow, app, dialog } from 'electron'
import { db } from './db'
import { broadcastState } from './sync'
import { importOsisBibleFromFile, loadOsisTranslations } from './osisLoader'
import path from 'path'

let outputWindows: BrowserWindow[] = []
const ndiState: { enabled: boolean; lastPayload: any } = {
  enabled: false,
  lastPayload: null
}
let overrideAction: 'BLACK' | 'LOGO' | null = null

export function registerOutputWindows(windows: BrowserWindow[]) {
  outputWindows = windows
}

export function setupIPC() {
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
}

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

// Bible translations loader (OSIS/SWORD skeleton)
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

// Bible books list (all 66 books)
ipcMain.handle('bibles.getBooks', async () => {
  return [
    // Old Testament
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
    'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
    'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    // New Testament
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
    '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
    'Jude', 'Revelation'
  ]
})

// Get chapters for a book
ipcMain.handle('bibles.getChapters', async (_ev, args: { book: string }) => {
  const { book } = args
  try {
    const rows = db.prepare('SELECT DISTINCT chapter FROM verses WHERE book = ? ORDER BY chapter').all(book)
    return rows.map((r: any) => r.chapter)
  } catch {
    return []
  }
})

// Get verses for a chapter
ipcMain.handle('bibles.getVerses', async (_ev, args: { book: string; chapter: number; translationId?: number }) => {
  const { book, chapter, translationId } = args
  try {
    let sql = 'SELECT verse, text FROM verses WHERE book = ? AND chapter = ? ORDER BY verse'
    const params: any[] = [book, chapter]
    if (translationId) {
      sql = 'SELECT v.verse, v.text FROM verses v WHERE v.bible_id = ? AND v.book = ? AND v.chapter = ? ORDER BY v.verse'
      params.unshift(translationId)
    }
    const rows = db.prepare(sql).all(...params)
    return rows
  } catch {
    return []
  }
})

// Search Bible text
ipcMain.handle('bibles.search', async (_ev, args: { query: string; translationId?: number }) => {
  const { query, translationId } = args
  try {
    let sql = 'SELECT book, chapter, verse, text FROM verses WHERE text LIKE ? ORDER BY book, chapter, verse LIMIT 100'
    const params: any[] = [`%${query}%`]
    if (translationId) {
      sql = 'SELECT v.book, v.chapter, v.verse, v.text FROM verses v WHERE v.bible_id = ? AND v.text LIKE ? ORDER BY v.book, v.chapter, v.verse LIMIT 100'
      params.unshift(translationId)
    }
    const rows = db.prepare(sql).all(...params)
    return rows
  } catch {
    return []
  }
})
