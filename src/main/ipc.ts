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
  // Typed database handlers (removes raw SQL passthrough)
  ipcMain.handle('songs.getAll', async () => {
    const rows = db.prepare(`
      SELECT 
        s.id AS song_id, s.title, s.artist, s.tempo, s.key,
        sec.id AS section_id, sec.type AS section_type, sec.content AS section_content, sec.order_num AS section_order
      FROM songs s
      LEFT JOIN song_sections sec ON s.id = sec.song_id
      ORDER BY s.id, sec.order_num
    `).all() as any[]

    const songsMap = new Map<number, any>()
    for (const row of rows) {
      if (!songsMap.has(row.song_id)) {
        songsMap.set(row.song_id, {
          id: row.song_id,
          title: row.title,
          artist: row.artist,
          tempo: row.tempo,
          key: row.key,
          sections: []
        })
      }
      if (row.section_id !== null) {
        songsMap.get(row.song_id).sections.push({
          id: row.section_id,
          type: row.section_type,
          text: row.section_content
        })
      }
    }
    return Array.from(songsMap.values())
  })

  ipcMain.handle('songs.create', async (_ev, args: { title: string, artist?: string, tempo?: number, key?: string }) => {
    const info = db.prepare('INSERT INTO songs (title, artist, tempo, key) VALUES (?, ?, ?, ?)').run(
      args.title, args.artist || null, args.tempo || null, args.key || null
    )
    const songId = info.lastInsertRowid as number
    const secInfo = db.prepare('INSERT INTO song_sections (song_id, type, content, order_num) VALUES (?, ?, ?, ?)').run(
      songId, 'Verse', '[C]Verse text', 1
    )
    return {
      id: songId,
      title: args.title,
      artist: args.artist,
      tempo: args.tempo,
      key: args.key,
      sections: [{ id: secInfo.lastInsertRowid as number, type: 'Verse', text: '[C]Verse text' }]
    }
  })

  ipcMain.handle('songs.updateTitle', async (_ev, args: { id: number, title: string }) => {
    db.prepare('UPDATE songs SET title = ? WHERE id = ?').run(args.title, args.id)
  })

  ipcMain.handle('songs.delete', async (_ev, args: { id: number }) => {
    const deleteTx = db.transaction((id: number) => {
      db.prepare('DELETE FROM song_sections WHERE song_id = ?').run(id)
      db.prepare('DELETE FROM songs WHERE id = ?').run(id)
    })
    deleteTx(args.id)
  })

  ipcMain.handle('songs.addSection', async (_ev, args: { songId: number, type: string, text: string }) => {
    const maxOrderRow = db.prepare('SELECT COALESCE(MAX(order_num), 0) AS m FROM song_sections WHERE song_id = ?').get(args.songId) as { m: number }
    const nextOrder = maxOrderRow.m + 1
    const info = db.prepare('INSERT INTO song_sections (song_id, type, content, order_num) VALUES (?, ?, ?, ?)').run(
      args.songId, args.type, args.text, nextOrder
    )
    return { id: info.lastInsertRowid as number, type: args.type, text: args.text }
  })

  ipcMain.handle('songs.updateSection', async (_ev, args: { songId: number, sectionId: number, type?: string, text?: string }) => {
    if (args.type !== undefined) {
      db.prepare('UPDATE song_sections SET type = ? WHERE id = ? AND song_id = ?').run(args.type, args.sectionId, args.songId)
    }
    if (args.text !== undefined) {
      db.prepare('UPDATE song_sections SET content = ? WHERE id = ? AND song_id = ?').run(args.text, args.sectionId, args.songId)
    }
  })

  ipcMain.handle('songs.deleteSection', async (_ev, args: { songId: number, sectionId: number }) => {
    db.prepare('DELETE FROM song_sections WHERE id = ? AND song_id = ?').run(args.sectionId, args.songId)
  })

  ipcMain.handle('songs.moveSections', async (_ev, args: { songId: number, sectionIds: number[] }) => {
    const updateStmt = db.prepare('UPDATE song_sections SET order_num = ? WHERE id = ? AND song_id = ?')
    const moveTx = db.transaction((songId: number, sectionIds: number[]) => {
      sectionIds.forEach((id, idx) => {
        updateStmt.run(idx + 1, id, songId)
      })
    })
    moveTx(args.songId, args.sectionIds)
  })

  ipcMain.handle('schedule.getItems', async () => {
    return db.prepare('SELECT * FROM schedule_items ORDER BY order_num').all()
  })

  ipcMain.handle('schedule.addItem', async (_ev, args: { scheduleId: number, type: string, content: string }) => {
    const maxOrderRow = db.prepare('SELECT COALESCE(MAX(order_num), 0) AS m FROM schedule_items WHERE schedule_id = ?').get(args.scheduleId) as { m: number }
    const nextOrder = maxOrderRow.m + 1
    const info = db.prepare('INSERT INTO schedule_items (schedule_id, item_type, content, order_num) VALUES (?, ?, ?, ?)').run(
      args.scheduleId, args.type, args.content, nextOrder
    )
    return { id: info.lastInsertRowid as number, item_type: args.type, content: args.content }
  })

  ipcMain.handle('schedule.updateItem', async (_ev, args: { id: number, type?: string, content?: string }) => {
    if (args.type !== undefined) {
      db.prepare('UPDATE schedule_items SET item_type = ? WHERE id = ?').run(args.type, args.id)
    }
    if (args.content !== undefined) {
      db.prepare('UPDATE schedule_items SET content = ? WHERE id = ?').run(args.content, args.id)
    }
  })

  ipcMain.handle('schedule.deleteItem', async (_ev, args: { id: number }) => {
    db.prepare('DELETE FROM schedule_items WHERE id = ?').run(args.id)
  })

  ipcMain.handle('schedule.moveItems', async (_ev, args: { scheduleId: number, itemIds: number[] }) => {
    const updateStmt = db.prepare('UPDATE schedule_items SET order_num = ? WHERE id = ? AND schedule_id = ?')
    const moveTx = db.transaction((scheduleId: number, itemIds: number[]) => {
      itemIds.forEach((id, idx) => {
        updateStmt.run(idx + 1, id, scheduleId)
      })
    })
    moveTx(args.scheduleId, args.itemIds)
  })

  ipcMain.handle('themes.getAll', async () => {
    return db.prepare('SELECT * FROM themes ORDER BY id').all()
  })

  ipcMain.handle('themes.create', async (_ev, args: { name: string, bg: string, textStyle: string, backgroundImage?: string, textColor?: string, fontSize?: number }) => {
    const info = db.prepare(
      'INSERT INTO themes (name, background, text_style, backgroundImage, text_color, font_size) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(args.name, args.bg, args.textStyle, args.backgroundImage || '', args.textColor || '#ffffff', args.fontSize || 42)
    return { id: info.lastInsertRowid as number, ...args }
  })

  ipcMain.handle('media.getFolders', async () => {
    return db.prepare('SELECT * FROM media_folders ORDER BY name').all()
  })

  ipcMain.handle('media.createFolder', async (_ev, args: { name: string, parentId?: number | null }) => {
    const info = db.prepare('INSERT INTO media_folders (name, parent_id) VALUES (?, ?)').run(
      args.name, args.parentId !== undefined ? args.parentId : null
    )
    return { id: info.lastInsertRowid as number, name: args.name, parent_id: args.parentId }
  })

  ipcMain.handle('media.getAssets', async (_ev, args: { folderId?: number | null, type?: string }) => {
    let sql = 'SELECT * FROM media_assets'
    const params: any[] = []
    const conditions: string[] = []

    if (args.type) {
      conditions.push('type = ?')
      params.push(args.type)
    }

    if (args.folderId !== undefined) {
      if (args.folderId === null) {
        conditions.push('folder_id IS NULL')
      } else {
        conditions.push('folder_id = ?')
        params.push(args.folderId)
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }
    sql += ' ORDER BY id DESC'
    return db.prepare(sql).all(...params)
  })

  ipcMain.handle('media.createAsset', async (_ev, args: { path: string, type: string, name: string, duration?: number | null, folderId?: number | null, thumbnail?: string }) => {
    const info = db.prepare(
      'INSERT INTO media_assets (path, type, name, duration, folder_id, thumbnail) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(args.path, args.type, args.name, args.duration !== undefined ? args.duration : null, args.folderId !== undefined ? args.folderId : null, args.thumbnail || null)
    return { id: info.lastInsertRowid as number, ...args }
  })

  ipcMain.handle('media.deleteAsset', async (_ev, args: { id: number }) => {
    db.prepare('DELETE FROM media_assets WHERE id = ?').run(args.id)
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
  ipcMain.handle('bibles.importFromOsis', async (event, args) => {
    const { translationCode, language, filePath } = args
    try {
      const bibleId = await importOsisBibleFromFile(translationCode, language, filePath, (percent) => {
        event.sender.send('bible-import-progress', { translationCode, progress: percent })
      })
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
    if (!query || !query.trim()) return []
    try {
      const matchQuery = query.trim().replace(/["']/g, '')
      let sql = `
        SELECT v.book, v.chapter, v.verse, v.text 
        FROM verses v
        JOIN verses_fts f ON v.id = f.rowid
        WHERE f.text MATCH ?
        ORDER BY v.book, v.chapter, v.verse 
        LIMIT 100
      `
      const params: any[] = [`"${matchQuery}"`]
      if (translationId) {
        sql = `
          SELECT v.book, v.chapter, v.verse, v.text 
          FROM verses v
          JOIN verses_fts f ON v.id = f.rowid
          WHERE v.bible_id = ? AND f.text MATCH ?
          ORDER BY v.book, v.chapter, v.verse 
          LIMIT 100
        `
        params.unshift(translationId)
      }
      return db.prepare(sql).all(...params)
    } catch (e) {
      console.error('Bible search FTS5 failed, falling back to LIKE:', e)
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
    }
  })
}
