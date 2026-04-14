const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const { WebSocketServer, WebSocket } = require('ws')
const Database = require('better-sqlite3')

let mainWindow
const outputs = []
const outputStates = new Map()
let overrideAction = null
let db
let syncServer = null

const ndiState = {
  enabled: false,
  lastPayload: null
}

function initDB() {
  const dbPath = path.join(app.getPath('userData'), 'worshipos.db')
  db = new Database(dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT,
      tempo INTEGER,
      key TEXT
    );
    CREATE TABLE IF NOT EXISTS song_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_id INTEGER,
      type TEXT,
      content TEXT,
      order_num INTEGER,
      FOREIGN KEY(song_id) REFERENCES songs(id)
    );
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      service_time TEXT
    );
    CREATE TABLE IF NOT EXISTS schedule_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER,
      item_type TEXT,
      content TEXT,
      order_num INTEGER,
      FOREIGN KEY(schedule_id) REFERENCES schedules(id)
    );
    CREATE TABLE IF NOT EXISTS bibles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      translation TEXT,
      language TEXT,
      path TEXT
    );
    CREATE TABLE IF NOT EXISTS verses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bible_id INTEGER,
      book TEXT,
      chapter INTEGER,
      verse INTEGER,
      text TEXT,
      FOREIGN KEY(bible_id) REFERENCES bibles(id)
    );
    CREATE TABLE IF NOT EXISTS themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      background TEXT,
      text_style TEXT
    );
    CREATE TABLE IF NOT EXISTS media_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT,
      type TEXT,
      duration INTEGER
    );
  `)

  const songCount = db.prepare('SELECT COUNT(*) AS c FROM songs').get()?.c || 0
  if (songCount === 0) {
    db.prepare('INSERT INTO songs (title, artist, tempo, key) VALUES (?, ?, ?, ?)').run('Amazing Grace', 'Traditional', 72, 'G')
  }

  const bibleCount = db.prepare('SELECT COUNT(*) AS c FROM bibles').get()?.c || 0
  if (bibleCount === 0) {
    db.prepare('INSERT INTO bibles (translation, language, path) VALUES (?, ?, ?)').run('NIV', 'en', path.join(app.getPath('userData'), 'bibles', 'niv.osis'))
    db.prepare('INSERT INTO bibles (translation, language, path) VALUES (?, ?, ?)').run('KJV', 'en', path.join(app.getPath('userData'), 'bibles', 'kjv.osis'))
  }
}

function startSyncServer(port = 9090) {
  if (syncServer) return syncServer
  syncServer = new WebSocketServer({ port })
  syncServer.on('connection', (ws) => {
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        broadcastSync(message.type, message.payload)
      } catch {
        // Ignore malformed sync traffic in the MVP.
      }
    })
  })
  console.log(`WorshipOS SyncServer listening on ws://localhost:${port}`)
  return syncServer
}

function broadcastSync(type, payload) {
  if (!syncServer) return
  const message = JSON.stringify({ type, payload })
  syncServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

function createWindowConfig(bounds) {
  return {
    ...bounds,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  }
}

function createWindows() {
  outputs.length = 0
  mainWindow = new BrowserWindow(createWindowConfig({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700
  }))
  mainWindow.loadURL(`file://${path.join(__dirname, 'renderer', 'app', 'index.html')}`)

  for (let i = 1; i <= 2; i++) {
    const windowRef = new BrowserWindow(createWindowConfig({
      width: 1280,
      height: 720,
      x: 80 + i * 40,
      y: 80
    }))
    outputStates.set(i, { slideTitle: 'Idle' })
    windowRef.loadURL(`file://${path.join(__dirname, 'renderer', 'app', 'index.html')}?out=${i}`)
    outputs.push(windowRef)
  }
}

function getEffectiveOutputState(outId) {
  const baseState = outputStates.get(outId) || { slideTitle: 'Idle' }
  if (overrideAction === 'BLACK') {
    return { ...baseState, mode: 'black' }
  }
  if (overrideAction === 'LOGO') {
    return { ...baseState, mode: 'logo', slideTitle: 'Church Logo' }
  }
  return { ...baseState, mode: 'live' }
}

function emitOutputState(outId) {
  const target = outputs[outId - 1]
  if (!target || target.isDestroyed()) return
  const state = getEffectiveOutputState(outId)
  target.webContents.send('output-state', { outputId: outId, state })
}

function emitAllOutputStates() {
  for (let outId = 1; outId <= outputs.length; outId += 1) {
    emitOutputState(outId)
  }
}

function toBookName(code) {
  const map = {
    Gen: 'Genesis',
    Exod: 'Exodus',
    Ps: 'Psalms',
    Prov: 'Proverbs',
    John: 'John',
    Rom: 'Romans'
  }
  return map[code] || code
}

function parseOsisXml(xml) {
  const verses = []
  const verseRe = /<verse[^>]*osisID=["']([^"']+)["'][^>]*>([\s\S]*?)<\/verse>/g
  let match
  while ((match = verseRe.exec(xml)) !== null) {
    const osisID = match[1]
    const parts = osisID.split('.')
    const book = toBookName(parts[0])
    const chapter = Number(parts[1] || 0)
    const verse = Number(parts[2] || 0)
    const text = (match[2] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (book && chapter && verse && text) {
      verses.push({ book, chapter, verse, text })
    }
  }
  const seen = new Set()
  return verses.filter((item) => {
    const key = `${item.book}:${item.chapter}:${item.verse}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function importOsisBibleFromFile(translationCode, language, filePath) {
  let bibleId
  const existing = db.prepare('SELECT id FROM bibles WHERE translation = ?').get(translationCode)
  if (existing?.id) {
    bibleId = existing.id
  } else {
    const info = db.prepare('INSERT INTO bibles (translation, language, path) VALUES (?, ?, ?)').run(translationCode, language, filePath)
    bibleId = Number(info.lastInsertRowid)
  }

  const xml = fs.readFileSync(filePath, 'utf8')
  const verses = parseOsisXml(xml)
  if (!verses.length) return bibleId

  db.prepare('DELETE FROM verses WHERE bible_id = ?').run(bibleId)
  const insertVerse = db.prepare('INSERT INTO verses (bible_id, book, chapter, verse, text) VALUES (?, ?, ?, ?, ?)')
  const insertMany = db.transaction((items) => {
    for (const verse of items) {
      insertVerse.run(bibleId, verse.book, verse.chapter, verse.verse, verse.text)
    }
  })
  insertMany(verses)
  return bibleId
}

function loadOsisTranslations(osisPaths) {
  const results = []
  for (const osisPath of osisPaths) {
    if (!osisPath || !fs.existsSync(osisPath)) continue
    const base = path.basename(osisPath)
    const name = base.split('.')[0]
    results.push({ code: name.toUpperCase().slice(0, 3), name })
  }
  const seen = new Set()
  return results.filter((item) => {
    if (seen.has(item.code)) return false
    seen.add(item.code)
    return true
  })
}

app.whenReady().then(() => {
  initDB()
  startSyncServer(9090)
  createWindows()
  emitAllOutputStates()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindows()
    emitAllOutputStates()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('db.run', (_event, { sql, params }) => {
  try {
    if (!db) throw new Error('DB not initialized')
    const stmt = db.prepare(sql)
    const upper = sql.trim().toUpperCase()
    if (upper.startsWith('SELECT')) {
      return stmt.all(params || [])
    }
    const info = stmt.run(params || [])
    return { changes: info.changes, lastInsertRowid: info.lastInsertRowid }
  } catch (error) {
    return { error: error.message }
  }
})

ipcMain.handle('bibles.listTranslations', async () => {
  const osisPaths = [
    path.join(app.getPath('userData'), 'bibles', 'niv.osis'),
    path.join(app.getPath('userData'), 'bibles', 'kjv.osis')
  ]
  const translations = loadOsisTranslations(osisPaths)
  if (translations.length > 0) return translations
  return db.prepare('SELECT translation AS code, translation AS name, language FROM bibles').all()
})

ipcMain.handle('bibles.openOsisFile', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'OSIS XML', extensions: ['osis', 'xml'] }]
  })
  if (result.canceled || !result.filePaths.length) return null
  return result.filePaths[0]
})

ipcMain.handle('bibles.importFromOsis', async (_event, args) => {
  try {
    return importOsisBibleFromFile(args.translationCode, args.language || 'en', args.filePath)
  } catch (error) {
    return { error: error.message }
  }
})

ipcMain.on('output-action', (_event, payload) => {
  const action = payload?.action
  overrideAction = action === 'CLEAR' ? null : action
  emitAllOutputStates()
  broadcastSync('state', {
    overrideAction,
    outputs: Array.from(outputStates.entries()).map(([outId]) => ({
      outId,
      state: getEffectiveOutputState(outId)
    }))
  })
})

ipcMain.on('output-set-state', (_event, payload) => {
  const outId = Number(payload?.outId || 1)
  outputStates.set(outId, { ...(payload?.state || {}) })
  emitOutputState(outId)
  if (ndiState.enabled) {
    ndiState.lastPayload = { outId, state: getEffectiveOutputState(outId) }
    console.log('[NDI STUB] Broadcasting output state', ndiState.lastPayload)
  }
  broadcastSync('state', { outId, state: getEffectiveOutputState(outId) })
})

ipcMain.handle('ndi.enable', async (_event, enabled) => {
  ndiState.enabled = Boolean(enabled)
  console.log(`[NDI STUB] ${ndiState.enabled ? 'enabled' : 'disabled'}`)
  return { enabled: ndiState.enabled }
})

ipcMain.handle('ndi.status', async () => ({
  enabled: ndiState.enabled,
  lastPayload: ndiState.lastPayload
}))
