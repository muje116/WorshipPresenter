import { ipcMain, BrowserWindow, app, dialog, screen } from 'electron'
import { db } from './db'
import { broadcastState } from './sync'
import { importOsisBibleFromFile } from './osisLoader'
import { importEasyWorshipBibleFromFile } from './easyWorshipBibleLoader'
import { importBibleXmlFromFile } from './bibleXmlLoader'
import { createOutputWindow, destroyOutputWindow, getOutputWindowList, assignOutputToDisplay, getOutputWindowsArray, getOutputWindows, getDisplayInfo, createOrShowOutputOnDisplay } from './windowManager'
import path from 'path'
import fs from 'fs'
import https from 'https'

let outputWindows: BrowserWindow[] = []
let ipcRegistered = false
const outputStateCache = new Map<number, any>()
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

  // ── Display Detection ──────────────────────────────────────────────────────
  ipcMain.handle('displays.getAll', async () => {
    return getDisplayInfo()
  })

  ipcMain.handle('displays.getPrimary', async () => {
    const primary = screen.getPrimaryDisplay()
    return {
      id: primary.id,
      label: primary.label || (primary.internal ? 'Built-in Display' : `Display ${primary.id}`),
      bounds: primary.bounds,
      size: primary.size,
      isPrimary: true,
      scaleFactor: primary.scaleFactor,
    }
  })

  // ── Output Window Management ───────────────────────────────────────────────
  ipcMain.handle('outputs.list', async () => {
    return getOutputWindowList()
  })

  ipcMain.handle('outputs.createWindow', async (_ev, args?: number | { displayId?: number; fullScreen?: boolean }) => {
    const displayId = typeof args === 'number' ? args : args?.displayId
    const outId = createOutputWindow(displayId, { fullScreen: typeof args === 'object' ? Boolean(args.fullScreen) : false })
    outputWindows = getOutputWindowsArray()
    return { id: outId }
  })

  ipcMain.handle('outputs.createForDisplays', async (_ev, args: { displayIds: number[]; fullScreen?: boolean }) => {
    const created = (args.displayIds || []).map(displayId => createOrShowOutputOnDisplay(displayId, args.fullScreen ?? true))
    outputWindows = getOutputWindowsArray()
    return { ids: created }
  })

  ipcMain.handle('outputs.destroyWindow', async (_ev, outId: number) => {
    const result = destroyOutputWindow(outId)
    outputWindows = getOutputWindowsArray()
    outputStateCache.delete(outId)
    return { success: result }
  })

  ipcMain.handle('outputs.assignToDisplay', async (_ev, args: { outId: number, displayId: number }) => {
    const result = assignOutputToDisplay(args.outId, args.displayId)
    return { success: result }
  })

  // ── App Info ───────────────────────────────────────────────────────────────
  ipcMain.handle('app.getVersion', async () => {
    return app.getVersion()
  })

  ipcMain.handle('app.getInfo', async () => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
      platform: process.platform,
      arch: process.arch,
      appData: app.getPath('userData'),
    }
  })

  // ── Online Bible Download ──────────────────────────────────────────────────
  const BIBLE_SOURCES = [
    { code: 'KJV', name: 'King James Version', language: 'en', url: 'https://api.getbible.net/v2/kjv.json', format: 'getbible-v2', license: 'GPL/public-use module', available: true },
    { code: 'WEB', name: 'World English Bible', language: 'en', url: 'https://api.getbible.net/v2/web.json', format: 'getbible-v2', license: 'Public Domain', available: true },
    { code: 'ASV', name: 'American Standard Version', language: 'en', url: 'https://api.getbible.net/v2/asv.json', format: 'getbible-v2', license: 'Public Domain', available: true },
    { code: 'BBE', name: 'Bible in Basic English', language: 'en', url: 'https://api.getbible.net/v2/bbe.json', format: 'getbible-v2', license: 'Public Domain', available: true },
    { code: 'NLT', name: 'New Living Translation', language: 'en', url: 'https://api.nlt.to/', format: 'licensed-api', license: 'Tyndale API key required', available: false, infoUrl: 'https://api.nlt.to/' },
    { code: 'NIV', name: 'New International Version', language: 'en', url: 'https://www.biblica.com/permissions/', format: 'licensed', license: 'Biblica/Zondervan permission required', available: false, infoUrl: 'https://www.biblica.com/permissions/' },
    { code: 'NKJV', name: 'New King James Version', language: 'en', url: 'https://www.harpercollinschristian.com/sales-and-rights/permissions/', format: 'licensed', license: 'HarperCollins permission required', available: false, infoUrl: 'https://www.harpercollinschristian.com/sales-and-rights/permissions/' },
    { code: 'TPT', name: 'The Passion Translation', language: 'en', url: 'https://www.thepassiontranslation.com/', format: 'licensed', license: 'Publisher permission required', available: false, infoUrl: 'https://www.thepassiontranslation.com/' },
    { code: 'MSG', name: 'The Message', language: 'en', url: 'https://www.navpress.com/permissions', format: 'licensed', license: 'NavPress permission required', available: false, infoUrl: 'https://www.navpress.com/permissions' },
    { code: 'ESV', name: 'English Standard Version', language: 'en', url: 'https://api.esv.org/', format: 'licensed-api', license: 'Crossway API key required', available: false, infoUrl: 'https://api.esv.org/' },
    { code: 'GNT', name: 'Good News Translation', language: 'en', url: 'https://api.bible/', format: 'licensed-api', license: 'API.Bible / DBL license may be required', available: false, infoUrl: 'https://api.bible/' },
  ]

  ipcMain.handle('bibles.getOnlineSources', async () => {
    return BIBLE_SOURCES
  })

  ipcMain.handle('bibles.downloadFromUrl', async (event, args: { code: string, name: string, language: string, url: string, format: string }) => {
    const { code, name, language, url, format } = args
    if (format === 'licensed' || format === 'licensed-api') {
      return { error: `${name} cannot be downloaded directly. Use the listed publisher/API source and add an authorized OSIS file or licensed integration.` }
    }
    const biblesDir = path.join(app.getPath('userData'), 'bibles')
    fs.mkdirSync(biblesDir, { recursive: true })
    const localPath = path.join(biblesDir, `${code.toLowerCase()}.json`)

    try {
      // Check if already exists
      const existing = db.prepare('SELECT id FROM bibles WHERE translation = ?').get(code)
      if (existing) {
        return { error: `Translation "${code}" is already installed.` }
      }

      // Download the file
      const data = await downloadFile(url, (percent) => {
        event.sender.send('bible-download-progress', { translationCode: code, progress: percent })
      })

      fs.writeFileSync(localPath, data)

      // Parse based on format
      let parsed: any
      try {
        parsed = JSON.parse(data)
      } catch {
        const preview = data.slice(0, 120).replace(/\s+/g, ' ').trim()
        return { error: `The download did not return valid JSON. Server response started with: ${preview || 'empty response'}` }
      }
      let verses: Array<{ book: string, chapter: number, verse: number, text: string }> = []

      if (format === 'thiago') {
        verses = parseThiagoFormat(parsed, code)
      } else if (format === 'getbible') {
        verses = parseGetbibleFormat(parsed, code)
      } else if (format === 'getbible-v2') {
        verses = parseGetbibleV2Format(parsed)
      } else {
        return { error: `Unknown format: ${format}` }
      }

      if (verses.length === 0) {
        return { error: 'No verses found in the downloaded file.' }
      }

      // Insert into database
      const insertTx = db.transaction(() => {
        const info = db.prepare('INSERT INTO bibles (translation, language, path) VALUES (?, ?, ?)').run(code, language, localPath)
        const bibleId = info.lastInsertRowid as number

        const insertVerse = db.prepare('INSERT OR IGNORE INTO verses (bible_id, book, chapter, verse, text) VALUES (?, ?, ?, ?, ?)')
        for (const v of verses) {
          insertVerse.run(bibleId, v.book, v.chapter, v.verse, v.text)
        }
        return bibleId
      })

      const bibleId = insertTx()
      event.sender.send('bible-download-progress', { translationCode: code, progress: 100 })

      return { success: true, bibleId, versesCount: verses.length }
    } catch (err) {
      return { error: (err as Error).message }
    }
  })

  function parseThiagoFormat(data: any, translationCode: string): Array<{ book: string, chapter: number, verse: number, text: string }> {
    const result: Array<{ book: string, chapter: number, verse: number, text: string }> = []
    const books = data?.books || data
    if (!Array.isArray(books)) return result

    const BOOK_NAMES = [
      { name: 'Genesis', aliases: ['genesis', 'gen'] },
      { name: 'Exodus', aliases: ['exodus', 'exod', 'exo'] },
      { name: 'Leviticus', aliases: ['leviticus', 'lev'] },
      { name: 'Numbers', aliases: ['numbers', 'num', 'numb'] },
      { name: 'Deuteronomy', aliases: ['deuteronomy', 'deut', 'deu'] },
      { name: 'Joshua', aliases: ['joshua', 'josh', 'jos'] },
      { name: 'Judges', aliases: ['judges', 'judg', 'jdg'] },
      { name: 'Ruth', aliases: ['ruth'] },
      { name: '1 Samuel', aliases: ['1_samuel', '1samuel', '1_sam', '1sam'] },
      { name: '2 Samuel', aliases: ['2_samuel', '2samuel', '2_sam', '2sam'] },
      { name: '1 Kings', aliases: ['1_kings', '1kings', '1_ki', '1ki'] },
      { name: '2 Kings', aliases: ['2_kings', '2kings', '2_ki', '2ki'] },
      { name: '1 Chronicles', aliases: ['1_chronicles', '1chronicles', '1_chr', '1chr'] },
      { name: '2 Chronicles', aliases: ['2_chronicles', '2chronicles', '2_chr', '2chr'] },
      { name: 'Ezra', aliases: ['ezra'] },
      { name: 'Nehemiah', aliases: ['nehemiah', 'neh'] },
      { name: 'Esther', aliases: ['esther', 'est'] },
      { name: 'Job', aliases: ['job'] },
      { name: 'Psalms', aliases: ['psalms', 'psalm', 'psa', 'ps'] },
      { name: 'Proverbs', aliases: ['proverbs', 'prov', 'pro'] },
      { name: 'Ecclesiastes', aliases: ['ecclesiastes', 'eccles', 'ecc'] },
      { name: 'Song of Solomon', aliases: ['song_of_solomon', 'songs', 'song', 'sos'] },
      { name: 'Isaiah', aliases: ['isaiah', 'isa'] },
      { name: 'Jeremiah', aliases: ['jeremiah', 'jer'] },
      { name: 'Lamentations', aliases: ['lamentations', 'lam'] },
      { name: 'Ezekiel', aliases: ['ezekiel', 'ezek', 'eze'] },
      { name: 'Daniel', aliases: ['daniel', 'dan'] },
      { name: 'Hosea', aliases: ['hosea', 'hos'] },
      { name: 'Joel', aliases: ['joel'] },
      { name: 'Amos', aliases: ['amos'] },
      { name: 'Obadiah', aliases: ['obadiah', 'obad', 'oba'] },
      { name: 'Jonah', aliases: ['jonah'] },
      { name: 'Micah', aliases: ['micah'] },
      { name: 'Nahum', aliases: ['nahum'] },
      { name: 'Habakkuk', aliases: ['habakkuk', 'hab'] },
      { name: 'Zephaniah', aliases: ['zephaniah', 'zeph', 'zep'] },
      { name: 'Haggai', aliases: ['haggai', 'hag'] },
      { name: 'Zechariah', aliases: ['zechariah', 'zech', 'zec'] },
      { name: 'Malachi', aliases: ['malachi', 'mal'] },
      { name: 'Matthew', aliases: ['matthew', 'matt', 'mat'] },
      { name: 'Mark', aliases: ['mark'] },
      { name: 'Luke', aliases: ['luke'] },
      { name: 'John', aliases: ['john'] },
      { name: 'Acts', aliases: ['acts'] },
      { name: 'Romans', aliases: ['romans', 'rom'] },
      { name: '1 Corinthians', aliases: ['1_corinthians', '1corinthians', '1_cor', '1cor'] },
      { name: '2 Corinthians', aliases: ['2_corinthians', '2corinthians', '2_cor', '2cor'] },
      { name: 'Galatians', aliases: ['galatians', 'gal'] },
      { name: 'Ephesians', aliases: ['ephesians', 'eph'] },
      { name: 'Philippians', aliases: ['philippians', 'phil', 'phi'] },
      { name: 'Colossians', aliases: ['colossians', 'col'] },
      { name: '1 Thessalonians', aliases: ['1_thessalonians', '1thessalonians', '1_thes', '1the'] },
      { name: '2 Thessalonians', aliases: ['2_thessalonians', '2thessalonians', '2_thes', '2the'] },
      { name: '1 Timothy', aliases: ['1_timothy', '1timothy', '1_tim', '1ti'] },
      { name: '2 Timothy', aliases: ['2_timothy', '2timothy', '2_tim', '2ti'] },
      { name: 'Titus', aliases: ['titus', 'tit'] },
      { name: 'Philemon', aliases: ['philemon', 'philem', 'phm'] },
      { name: 'Hebrews', aliases: ['hebrews', 'heb'] },
      { name: 'James', aliases: ['james', 'jas'] },
      { name: '1 Peter', aliases: ['1_peter', '1peter', '1_pet', '1pe'] },
      { name: '2 Peter', aliases: ['2_peter', '2peter', '2_pet', '2pe'] },
      { name: '1 John', aliases: ['1_john', '1john', '1_jn', '1jn'] },
      { name: '2 John', aliases: ['2_john', '2john', '2_jn', '2jn'] },
      { name: '3 John', aliases: ['3_john', '3john', '3_jn', '3jn'] },
      { name: 'Jude', aliases: ['jude'] },
      { name: 'Revelation', aliases: ['revelation', 'rev'] },
    ]

    const aliasesMap = new Map<string, string>()
    for (const b of BOOK_NAMES) {
      aliasesMap.set(b.name.toLowerCase(), b.name)
      for (const alias of b.aliases) {
        aliasesMap.set(alias.toLowerCase(), b.name)
      }
    }

    for (const book of books) {
      const bookNameRaw = book.name || book.book || ''
      const normalizedKey = bookNameRaw.toLowerCase().replace(/[\s_]/g, '_')
      let bookName: string = aliasesMap.get(normalizedKey) || aliasesMap.get(bookNameRaw.toLowerCase()) || bookNameRaw

      const chapters = book.chapters || []
      for (let ci = 0; ci < chapters.length; ci++) {
        const chapter = chapters[ci]
        if (!Array.isArray(chapter)) continue
        for (const v of chapter) {
          if (v && typeof v === 'object') {
            const verseNum = Number(v.verse ?? 0)
            const text = String(v.text ?? '')
            if (verseNum > 0 && text) {
              result.push({ book: bookName, chapter: ci + 1, verse: verseNum, text })
            }
          }
        }
      }
    }
    return result
  }

  function parseGetbibleFormat(data: any, translationCode: string): Array<{ book: string, chapter: number, verse: number, text: string }> {
    const result: Array<{ book: string, chapter: number, verse: number, text: string }> = []
    for (const [bookKey, bookData] of Object.entries(data)) {
      if (!bookData || typeof bookData !== 'object') continue
      const chapters = bookData as Record<string, any>
      for (const [chKey, verses] of Object.entries(chapters)) {
        const chNum = parseInt(chKey, 10)
        if (isNaN(chNum)) continue
        if (!Array.isArray(verses)) continue
        for (const v of verses) {
          if (v && typeof v === 'object') {
            const verseNum = Number(v.verse ?? v.v ?? 0)
            const text = String(v.text ?? v.t ?? '')
            if (verseNum > 0 && text) {
              result.push({ book: bookKey, chapter: chNum, verse: verseNum, text })
            }
          }
        }
      }
    }
    return result
  }

  function parseGetbibleV2Format(data: any): Array<{ book: string, chapter: number, verse: number, text: string }> {
    const result: Array<{ book: string, chapter: number, verse: number, text: string }> = []
    const books = Array.isArray(data?.books) ? data.books : []
    for (const book of books) {
      const bookName = String(book?.name || '').trim()
      const chapters = Array.isArray(book?.chapters) ? book.chapters : []
      if (!bookName) continue
      for (const chapter of chapters) {
        const chapterNum = Number(chapter?.chapter)
        const verses = Array.isArray(chapter?.verses) ? chapter.verses : []
        if (!chapterNum) continue
        for (const verse of verses) {
          const verseNum = Number(verse?.verse)
          const text = String(verse?.text || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
          if (verseNum > 0 && text) {
            result.push({ book: bookName, chapter: chapterNum, verse: verseNum, text })
          }
        }
      }
    }
    return result
  }

  function downloadFile(url: string, onProgress: (pct: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location
          if (redirectUrl) {
            https.get(redirectUrl, (res2) => {
              const chunks: Buffer[] = []
              const total = parseInt(res2.headers['content-length'] || '0', 10)
              let downloaded = 0
              res2.on('data', (chunk: Buffer) => {
                chunks.push(chunk)
                downloaded += chunk.length
                if (total > 0) {
                  onProgress(Math.round((downloaded / total) * 100))
                }
              })
              res2.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
              res2.on('error', reject)
            }).on('error', reject)
            return
          }
        }
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`HTTP ${response.statusCode || 'error'} from ${url}`))
          response.resume()
          return
        }
        const chunks: Buffer[] = []
        const total = parseInt(response.headers['content-length'] || '0', 10)
        let downloaded = 0
        response.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
          downloaded += chunk.length
          if (total > 0) {
            onProgress(Math.round((downloaded / total) * 100))
          }
        })
        response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
        response.on('error', reject)
      }).on('error', reject)
    })
  }

  // ── Existing Handlers ──────────────────────────────────────────────────────

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

    if (action === 'BLACK' || action === 'LOGO' || action === 'CLEAR') {
      outputWindows.forEach((w, idx) => {
        if (w.isDestroyed()) return
        const outId = idx + 1
        const baseState = outputStateCache.get(outId) || { slideTitle: 'Idle' }
        const state = action === 'BLACK'
          ? { ...baseState, mode: 'black' }
          : action === 'LOGO'
            ? { ...baseState, mode: 'logo', slideTitle: 'Church Logo' }
            : { ...baseState, mode: undefined }
        w.webContents.send('output-state', { outputId: outId, state })
      })
    }
  })

  ipcMain.on('output-window-control', (_ev, payload: { outId: number; action: string; bounds?: { width?: number; height?: number; x?: number; y?: number } }) => {
    const wmWindows = getOutputWindows()
    const target = wmWindows.get(payload.outId)
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
    const windows = getOutputWindows()
    const target = windows.get(payload.outId)
    outputStateCache.set(payload.outId, payload.state)
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

  ipcMain.handle('bibles.openXmlFiles', async () => {
    const res = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Bible XML', extensions: ['xml'] }],
      title: 'Import Bible translation XML files',
    })
    if (res.canceled) return []
    return res.filePaths
  })

  ipcMain.handle('bibles.importXmlFiles', async (event, filePaths: string[]) => {
    const results: any[] = []
    for (const filePath of Array.isArray(filePaths) ? filePaths : []) {
      if (!filePath) continue
      try {
        const result = await importBibleXmlFromFile(filePath, (progress) => {
          event.sender.send('bible-import-progress', {
            translationCode: path.basename(filePath),
            filePath,
            progress,
          })
        })
        results.push(result)
      } catch (error) {
        results.push({ filePath, error: (error as Error).message })
      }
    }
    return results
  })

  ipcMain.handle('bibles.openOsisFile', async () => {
    const res = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'OSIS XML', extensions: ['osis', 'xml'] }] })
    if (res.canceled || res.filePaths.length === 0) return null
    return res.filePaths[0]
  })

  ipcMain.handle('bibles.openEasyWorshipFile', async () => {
    const res = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'EasyWorship Bible', extensions: ['ewb'] }] })
    if (res.canceled || res.filePaths.length === 0) return null
    return res.filePaths[0]
  })

  ipcMain.handle('bibles.importFromEasyWorship', async (event, args) => {
    const { translationCode, language, filePath } = args
    try {
      const bibleId = await importEasyWorshipBibleFromFile(translationCode, language, filePath, (percent) => {
        event.sender.send('bible-import-progress', { translationCode, progress: percent })
      })
      return bibleId
    } catch (err) {
      return { error: (err as Error).message }
    }
  })

  ipcMain.handle('bibles.listTranslations', async () => {
    try {
      const rows = db.prepare('SELECT id, translation AS code, COALESCE(NULLIF(name, \'\'), translation) AS name, language FROM bibles ORDER BY id').all()
      const seen = new Set<string>()
      return rows.filter((row: any) => {
        const key = String(row.code || '').trim().toUpperCase()
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      }).map((r: any) => ({ id: r.id, code: r.code, name: r.name || r.code, language: r.language || 'en' }))
    } catch {
      return []
    }
  })

  ipcMain.handle('bibles.getBooks', async (_ev, args?: { translationId?: number }) => {
    const orderedBooks = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
    'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
    ]
    if (!args?.translationId) return orderedBooks
    try {
      const rows = db.prepare('SELECT DISTINCT book FROM verses WHERE bible_id = ?').all(args.translationId) as Array<{ book: string }>
      const available = new Set(rows.map((row) => row.book))
      return orderedBooks.filter((book) => available.has(book))
    } catch {
      return orderedBooks
    }
  })

  ipcMain.handle('bibles.getChapters', async (_ev, args: { book: string; translationId?: number }) => {
    try {
      let sql = 'SELECT DISTINCT chapter FROM verses WHERE book = ?'
      const params: any[] = [args.book]
      if (args.translationId) {
        sql = 'SELECT DISTINCT chapter FROM verses WHERE bible_id = ? AND book = ?'
        params.unshift(args.translationId)
      }
      sql += ' ORDER BY chapter'
      const rows = db.prepare(sql).all(...params)
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
