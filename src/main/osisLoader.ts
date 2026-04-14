import fs from 'fs'
import path from 'path'
import { db } from './db'

// Lightweight OSIS loader skeleton
// Given a list of OSIS file paths, return a list of translations (code & name).
export async function loadOsisTranslations(osisPaths: string[]): Promise<Array<{ code: string; name: string }>> {
  const results: Array<{ code: string; name: string }> = []
  for (const p of osisPaths) {
    try {
      if (!p) continue
      // if file exists, derive translation name from filename as a fallback
      if (fs.existsSync(p)) {
        const base = path.basename(p)
        const code = base.split('.')[0].toUpperCase().slice(0, 3)
        const name = base.includes('.') ? base.split('.')[0] : code
        results.push({ code, name })
        continue
      }
    } catch {
      // ignore parse errors; continue to next path
    }
  }
  // Deduplicate by code
  const seen = new Set<string>()
  return results.filter(r => {
    if (seen.has(r.code)) return false
    seen.add(r.code)
    return true
  })
}

// Phase C: OSIS parsing and DB import utilities
export type VerseRecord = { book: string; chapter: number; verse: number; text: string }

function toBookName(code: string): string {
  const map: Record<string, string> = {
    // Old Testament (39 books)
    'Gen': 'Genesis', 'GenS': 'Genesis', 'Genesis': 'Genesis',
    'Exod': 'Exodus', 'Exodus': 'Exodus', 'Ex': 'Exodus',
    'Lev': 'Leviticus', 'Leviticus': 'Leviticus', 'Le': 'Leviticus',
    'Num': 'Numbers', 'Numbers': 'Numbers', 'Nu': 'Numbers',
    'Deut': 'Deuteronomy', 'Deuteronomy': 'Deuteronomy', 'De': 'Deuteronomy',
    'Josh': 'Joshua', 'Joshua': 'Joshua', 'Jos': 'Joshua',
    'Judg': 'Judges', 'Judges': 'Judges', 'Jdg': 'Judges',
    'Ruth': 'Ruth', 'Ru': 'Ruth',
    '1Sam': '1 Samuel', '1 Samuel': '1 Samuel',
    '2Sam': '2 Samuel', '2 Samuel': '2 Samuel',
    '1Kgs': '1 Kings', '1 Kings': '1 Kings',
    '2Kgs': '2 Kings', '2 Kings': '2 Kings',
    '1Chr': '1 Chronicles', '1 Chronicles': '1 Chronicles',
    '2Chr': '2 Chronicles', '2 Chronicles': '2 Chronicles',
    'Ezra': 'Ezra', 'Ezr': 'Ezra',
    'Neh': 'Nehemiah', 'Nehemiah': 'Nehemiah',
    'Esther': 'Esther', 'Esth': 'Esther', 'Es': 'Esther',
    'Job': 'Job',
    'Ps': 'Psalms', 'Psalms': 'Psalms', 'Pss': 'Psalms',
    'Prov': 'Proverbs', 'Proverbs': 'Proverbs', 'Pr': 'Proverbs',
    'Eccl': 'Ecclesiastes', 'Ecclesiastes': 'Ecclesiastes', 'Ecc': 'Ecclesiastes', 'Qoh': 'Ecclesiastes',
    'Song': 'Song of Solomon', 'Song of Solomon': 'Song of Solomon', 'Cant': 'Song of Solomon',
    'Isa': 'Isaiah', 'Isaiah': 'Isaiah',
    'Jer': 'Jeremiah',
    'Lam': 'Lamentations', 'Lamentations': 'Lamentations',
    'Ezek': 'Ezekiel', 'Ezekiel': 'Ezekiel', 'Eze': 'Ezekiel',
    'Dan': 'Daniel', 'Daniel': 'Daniel', 'Da': 'Daniel',
    'Hos': 'Hosea', 'Hosea': 'Hosea',
    'Joel': 'Joel',
    'Amos': 'Amos', 'Am': 'Amos',
    'Obad': 'Obadiah', 'Obadiah': 'Obadiah', 'Ob': 'Obadiah',
    'Jonah': 'Jonah', 'Jon': 'Jonah',
    'Mic': 'Micah', 'Micah': 'Micah',
    'Nah': 'Nahum', 'Nahum': 'Nahum',
    'Hab': 'Habakkuk', 'Habakkuk': 'Habakkuk',
    'Zeph': 'Zephaniah', 'Zephaniah': 'Zephaniah', 'Zep': 'Zephaniah',
    'Hag': 'Haggai', 'Haggai': 'Haggai',
    'Zech': 'Zechariah', 'Zechariah': 'Zechariah', 'Zec': 'Zechariah',
    'Mal': 'Malachi', 'Malachi': 'Malachi',
    // New Testament (27 books)
    'Matt': 'Matthew', 'Matthew': 'Matthew', 'Mt': 'Matthew',
    'Mark': 'Mark', 'Mk': 'Mark', 'Mr': 'Mark',
    'Luke': 'Luke', 'Lk': 'Luke', 'Lu': 'Luke',
    'John': 'John', 'Jn': 'John', 'Jhn': 'John',
    'Acts': 'Acts', 'Ac': 'Acts',
    'Rom': 'Romans', 'Romans': 'Romans',
    '1Cor': '1 Corinthians', '1 Corinthians': '1 Corinthians',
    '2Cor': '2 Corinthians', '2 Corinthians': '2 Corinthians',
    'Gal': 'Galatians', 'Galatians': 'Galatians',
    'Eph': 'Ephesians', 'Ephesians': 'Ephesians',
    'Phil': 'Philippians', 'Philippians': 'Philippians', 'Php': 'Philippians',
    'Col': 'Colossians', 'Colossians': 'Colossians',
    '1Thess': '1 Thessalonians', '1 Thessalonians': '1 Thessalonians',
    '2Thess': '2 Thessalonians', '2 Thessalonians': '2 Thessalonians',
    '1Tim': '1 Timothy', '1 Timothy': '1 Timothy',
    '2Tim': '2 Timothy', '2 Timothy': '2 Timothy',
    'Titus': 'Titus', 'Tit': 'Titus',
    'Phlm': 'Philemon', 'Philemon': 'Philemon', 'Phm': 'Philemon',
    'Heb': 'Hebrews', 'Hebrews': 'Hebrews',
    'Jas': 'James', 'James': 'James',
    '1Pet': '1 Peter', '1 Peter': '1 Peter',
    '2Pet': '2 Peter', '2 Peter': '2 Peter',
    '1John': '1 John', '1 John': '1 John',
    '2John': '2 John', '2 John': '2 John',
    '3John': '3 John', '3 John': '3 John',
    'Jude': 'Jude', 'Jud': 'Jude',
    'Rev': 'Revelation', 'Revelation': 'Revelation'
  }
  if (map[code]) return map[code]
  // Capitalize first letter as fallback
  const cap = code.charAt(0).toUpperCase() + code.slice(1)
  return map[cap] || cap
}

export function parseOsisXml(xml: string): VerseRecord[] {
  const verses: VerseRecord[] = []
  if (!xml) return verses
  // Pattern 1: <verse osisID="Book.Chapter.Verse" ...>text</verse>
  const verseRe = /<verse[^>]*osisID=["']([^"']+)["'][^>]*>([\s\S]*?)<\/verse>/g
  let m: RegExpExecArray | null
  while ((m = verseRe.exec(xml)) !== null) {
    const osisID = m[1]
    let text = m[2] ?? ''
    text = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const parts = osisID.split('.')
    const bookCode = parts[0]
    const chapter = parts.length > 1 ? parseInt(parts[1], 10) : 0
    const verse = parts.length > 2 ? parseInt(parts[2], 10) : 0
    verses.push({ book: toBookName(bookCode), chapter: isNaN(chapter) ? 0 : chapter, verse: isNaN(verse) ? 0 : verse, text })
  }
  // Pattern 2: <div type="chapter" osisID="Book.Chapter"> ... <verse ...>...
  const chapterRe = /<div[^>]*type=["']chapter["'][^>]*osisID=["']([^"']+)["'][^>]*>([\s\S]*?)<\/div>/g
  while ((m = chapterRe.exec(xml)) !== null) {
    const osisID = m[1]
    const inner = m[2]
    const parts = osisID.split('.')
    const bookCode = parts[0]
    const chapter = parts.length > 1 ? parseInt(parts[1], 10) : 0
    const bookName = toBookName(bookCode)
    const innerVerseRe = /<verse[^>]*osisID=["']([^"']+)["'][^>]*>([\s\S]*?)<\/verse>/g
    let innerMatch: RegExpExecArray | null
    while ((innerMatch = innerVerseRe.exec(inner)) !== null) {
      const innerOsis = innerMatch[1]
      let text = innerMatch[2] ?? ''
      text = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const innerParts = innerOsis.split('.')
      const innerChapter = innerParts.length > 1 ? parseInt(innerParts[1], 10) : chapter
      const innerVerse = innerParts.length > 2 ? parseInt(innerParts[2], 10) : 0
      verses.push({ book: toBookName(innerParts[0] || bookCode), chapter: isNaN(innerChapter) ? 0 : innerChapter, verse: isNaN(innerVerse) ? 0 : innerVerse, text })
    }
  }
  // Deduplicate
  const seen = new Set<string>()
  const out: VerseRecord[] = []
  for (const v of verses) {
    const k = `${v.book}:${v.chapter}:${v.verse}`
    if (!seen.has(k)) { seen.add(k); out.push(v) }
  }
  return out
}

export async function importOsisBibleFromFile(translationCode: string, language: string, filePath: string): Promise<number> {
  // Use the shared DB singleton
  // Import DB is placed at module scope; no need to require here
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // (db is imported at top)
  
  let bibleId: number
  const bibleRow = db.prepare('SELECT id FROM bibles WHERE translation = ?').get(translationCode) as { id: number } | undefined
  if (bibleRow?.id) {
    bibleId = bibleRow.id
  } else {
    const info = db.prepare('INSERT INTO bibles (translation, language, path) VALUES (?, ?, ?)').run(translationCode, language, filePath)
    bibleId = info.lastInsertRowid as number
  }
  const xml = fs.readFileSync(filePath, 'utf8')
  const verses = parseOsisXml(xml)
  if (!verses.length) return bibleId
  const insertVerse = db.prepare('INSERT INTO verses (bible_id, book, chapter, verse, text) VALUES (?, ?, ?, ?, ?)')
  const insertMany = db.transaction((versesToInsert: VerseRecord[]) => {
    for (const v of versesToInsert) insertVerse.run([bibleId, v.book, v.chapter, v.verse, v.text])
  })
  insertMany(verses)
  return bibleId
}
