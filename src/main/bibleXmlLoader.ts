import fs from 'fs'
import path from 'path'
import { db } from './db'

export type BibleXmlVerse = { book: string; chapter: number; verse: number; text: string }

export type BibleXmlMetadata = {
  code: string
  name: string
  language: string
  verses: BibleXmlVerse[]
}

export type BibleXmlImportResult = {
  code: string
  name: string
  bibleId: number
  versesCount: number
  skipped: boolean
  filePath: string
}

const BIBLE_BOOK_NAMES = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians',
  'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
  'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation',
]

const KNOWN_TRANSLATIONS: Array<{ code: string; name: string; pattern: RegExp }> = [
  { code: 'TPT', name: 'The Passion Translation', pattern: /passion|\btpt\b/i },
  { code: 'NIV', name: 'New International Version', pattern: /\bniv\b|new international|englishniv/i },
  { code: 'GW', name: "God's Word Translation", pattern: /god.?s word|\bgw\b|englishgwbible/i },
  { code: 'GNT', name: 'Good News Translation', pattern: /good news|\bgnt\b|englishgnt/i },
  { code: 'EASY', name: 'EasyEnglish Bible', pattern: /\beasy\b|easyenglish|englisheasy/i },
  { code: 'AMPC', name: 'Amplified Classic Bible', pattern: /amplified classic|\bampc\b|englishamplifiedclassic/i },
  { code: 'AMP', name: 'Amplified Bible', pattern: /amplified|\bamp\b|englishamplified/i },
  { code: 'TLB', name: 'The Living Bible', pattern: /living bible|\bt[l]?b\b|englishtlb/i },
  { code: 'NLT', name: 'New Living Translation', pattern: /new living|\bnlt\b|englishnlt/i },
]

const getAttribute = (attributes: string, name: string): string => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = attributes.match(new RegExp(`\\b${escapedName}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'))
  return match?.[2] || ''
}

const decodeXml = (value: string): string => value
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(parseInt(code, 10)))
  .replace(/&apos;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&gt;/g, '>')
  .replace(/&lt;/g, '<')
  .replace(/&amp;/g, '&')

const cleanVerseText = (value: string): string => decodeXml(value)
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const numericValue = (value: string, fallback = 0): number => {
  const match = String(value || '').match(/\d+/)
  const number = match ? Number(match[0]) : fallback
  return Number.isFinite(number) ? number : fallback
}

const deriveTranslation = (xml: string, filePath: string): { code: string; name: string } => {
  const rootAttributes = xml.match(/<bible\b([^>]*)>/i)?.[1] || ''
  const declaredName = decodeXml(getAttribute(rootAttributes, 'translation') || getAttribute(rootAttributes, 'name'))
  const filename = path.basename(filePath, path.extname(filePath)).replace(/[()_\-]+/g, ' ')
  const signal = `${declaredName} ${filename}`
  const known = KNOWN_TRANSLATIONS.find((translation) => translation.pattern.test(signal))
  if (known) return { code: known.code, name: known.name }

  const fallbackCode = filename.replace(/[^a-z0-9]+/gi, '').slice(0, 8).toUpperCase() || 'BIBLE'
  return { code: fallbackCode, name: declaredName || filename || fallbackCode }
}

const parseNumberedBibleXml = (xml: string): BibleXmlVerse[] => {
  const verses: BibleXmlVerse[] = []
  const bookRe = /<book\b([^>]*)>([\s\S]*?)<\/book>/gi
  let bookMatch: RegExpExecArray | null
  while ((bookMatch = bookRe.exec(xml)) !== null) {
    const bookAttributes = bookMatch[1]
    const bookBody = bookMatch[2]
    const bookNumber = numericValue(getAttribute(bookAttributes, 'number'))
    const bookName = decodeXml(getAttribute(bookAttributes, 'name')) || BIBLE_BOOK_NAMES[bookNumber - 1] || `Book ${bookNumber || verses.length + 1}`
    const chapterRe = /<chapter\b([^>]*)>([\s\S]*?)<\/chapter>/gi
    let chapterMatch: RegExpExecArray | null
    while ((chapterMatch = chapterRe.exec(bookBody)) !== null) {
      const chapter = numericValue(getAttribute(chapterMatch[1], 'number'))
      const chapterBody = chapterMatch[2]
      const verseRe = /<verse\b([^>]*)>([\s\S]*?)<\/verse>/gi
      let verseMatch: RegExpExecArray | null
      while ((verseMatch = verseRe.exec(chapterBody)) !== null) {
        const verse = numericValue(getAttribute(verseMatch[1], 'number'))
        const text = cleanVerseText(verseMatch[2])
        if (chapter > 0 && verse > 0 && text) verses.push({ book: bookName, chapter, verse, text })
      }
    }
  }
  return verses
}

const parseOsisLikeXml = (xml: string): BibleXmlVerse[] => {
  const verses: BibleXmlVerse[] = []
  const verseRe = /<verse\b[^>]*osisID=["']([^"']+)["'][^>]*>([\s\S]*?)<\/verse>/gi
  let match: RegExpExecArray | null
  while ((match = verseRe.exec(xml)) !== null) {
    const [bookCode, chapterValue, verseValue] = match[1].split('.')
    const bookName = BIBLE_BOOK_NAMES.find((name) => name.toLowerCase().replace(/\s+/g, '') === bookCode.toLowerCase()) || bookCode
    const chapter = numericValue(chapterValue)
    const verse = numericValue(verseValue)
    const text = cleanVerseText(match[2])
    if (bookName && chapter > 0 && verse > 0 && text) verses.push({ book: bookName, chapter, verse, text })
  }
  return verses
}

export function parseBibleXml(xml: string, filePath = ''): BibleXmlMetadata {
  const rootAttributes = xml.match(/<bible\b([^>]*)>/i)?.[1] || ''
  const translation = deriveTranslation(xml, filePath)
  const language = getAttribute(rootAttributes, 'language') || 'en'
  const parsed = parseNumberedBibleXml(xml)
  const verses = parsed.length ? parsed : parseOsisLikeXml(xml)
  const unique = new Map<string, BibleXmlVerse>()
  verses.forEach((verse) => unique.set(`${verse.book}:${verse.chapter}:${verse.verse}`, verse))
  return { ...translation, language, verses: Array.from(unique.values()) }
}

export async function importBibleXmlFromFile(
  filePath: string,
  onProgress?: (percent: number) => void,
): Promise<BibleXmlImportResult> {
  if (!filePath) throw new Error('No Bible XML file was selected.')
  onProgress?.(2)
  const xml = await fs.promises.readFile(filePath, 'utf8')
  onProgress?.(12)
  const metadata = parseBibleXml(xml, filePath)
  if (!metadata.verses.length) throw new Error('No numbered Bible verses were found in this XML file.')

  const existing = db.prepare('SELECT id, COALESCE(name, translation) AS name FROM bibles WHERE UPPER(translation) = UPPER(?) LIMIT 1').get(metadata.code) as { id: number; name?: string } | undefined
  let bibleId: number | undefined
  if (existing?.id) {
    const verseCount = (db.prepare('SELECT COUNT(*) AS count FROM verses WHERE bible_id = ?').get(existing.id) as { count: number } | undefined)?.count || 0
    if (verseCount > 0) {
      onProgress?.(100)
      return {
        code: metadata.code,
        name: existing.name || metadata.name,
        bibleId: existing.id,
        versesCount: 0,
        skipped: true,
        filePath,
      }
    }
    bibleId = existing.id
    db.prepare('UPDATE bibles SET name = ?, language = ?, path = ? WHERE id = ?').run(metadata.name, metadata.language, path.resolve(filePath), bibleId)
  }

  // Keep the transaction free of renderer IPC calls. Sending progress from a
  // synchronous SQLite transaction can stall Electron while the renderer is
  // waiting for the invoke response.
  onProgress?.(20)
  const insertTx = db.transaction(() => {
    if (!bibleId) {
      const bibleInfo = db.prepare('INSERT INTO bibles (translation, name, language, path) VALUES (?, ?, ?, ?)').run(
        metadata.code,
        metadata.name,
        metadata.language,
        path.resolve(filePath),
      )
      bibleId = bibleInfo.lastInsertRowid as number
    }
    const insertVerse = db.prepare('INSERT INTO verses (bible_id, book, chapter, verse, text) VALUES (?, ?, ?, ?, ?)')
    metadata.verses.forEach((verse) => {
      insertVerse.run(bibleId as number, verse.book, verse.chapter, verse.verse, verse.text)
    })
    return bibleId
  })

  const importedBibleId = insertTx() as number
  onProgress?.(100)
  return { code: metadata.code, name: metadata.name, bibleId: importedBibleId, versesCount: metadata.verses.length, skipped: false, filePath }
}
