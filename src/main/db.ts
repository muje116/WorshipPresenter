import { app } from 'electron'
import path from 'path'
import Database from 'better-sqlite3'

export let db: Database.Database
type CountRow = { c: number }

function hasColumn(table: string, column: string): boolean {
  try {
    const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
    return rows.some((row) => row.name === column)
  } catch {
    return false
  }
}

function ensureColumn(table: string, column: string, definition: string) {
  if (!hasColumn(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

export function initDB() {
  const dbPath = path.join(app.getPath('userData'), 'worshipos.db')
  db = new Database(dbPath)

  // Comprehensive schema (extensible)
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
      text_style TEXT,
      backgroundImage TEXT,
      text_color TEXT,
      font_size INTEGER
    );
    CREATE TABLE IF NOT EXISTS media_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT,
      type TEXT,
      name TEXT,
      thumbnail TEXT,
      duration INTEGER,
      folder_id INTEGER,
      FOREIGN KEY(folder_id) REFERENCES media_folders(id)
    );
    CREATE TABLE IF NOT EXISTS media_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      FOREIGN KEY(parent_id) REFERENCES media_folders(id)
    );
  `)

  // Schema migrations for existing databases
  ensureColumn('themes', 'backgroundImage', 'TEXT')
  ensureColumn('themes', 'text_color', 'TEXT')
  ensureColumn('themes', 'font_size', 'INTEGER')
  ensureColumn('media_assets', 'name', 'TEXT')
  ensureColumn('media_assets', 'thumbnail', 'TEXT')
  ensureColumn('media_assets', 'folder_id', 'INTEGER')

  // Seed a couple of Bible translations if empty
  try {
    const countRow = db.prepare('SELECT COUNT(*) AS c FROM bibles').get() as CountRow | undefined
    const count = countRow?.c || 0
    if (count === 0) {
      db.prepare('INSERT INTO bibles (translation, language, path) VALUES (?, ?, ?)').run('NIV', 'en', '/osis/niv.osis')
      db.prepare('INSERT INTO bibles (translation, language, path) VALUES (?, ?, ?)').run('KJV', 'en', '/osis/kjv.osis')
    }
  } catch {
    // ignore
  }

  // Ensure one default theme row exists for update flows
  try {
    const themeCount = (db.prepare('SELECT COUNT(*) AS c FROM themes').get() as CountRow | undefined)?.c || 0
    if (themeCount === 0) {
      db.prepare(
        'INSERT INTO themes (name, background, text_style, backgroundImage, text_color, font_size) VALUES (?, ?, ?, ?, ?, ?)'
      ).run('Default', '#1a1a1a', 'bold', '', '#ffffff', 42)
    }
  } catch {
    // ignore
  }
}
