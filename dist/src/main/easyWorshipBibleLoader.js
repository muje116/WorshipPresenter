"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importEasyWorshipBibleFromFile = importEasyWorshipBibleFromFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const zlib_1 = __importDefault(require("zlib"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const db_1 = require("./db");
const BOOK_NAMES = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
    'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation',
];
const SQLITE_MAGIC = 'SQLite format 3';
const OLD_EWB_MAGIC = 'EasyWorship Bible Text';
function cleanText(input) {
    return String(input ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function readNullTerminated(buffer) {
    const zero = buffer.indexOf(0);
    return buffer.slice(0, zero >= 0 ? zero : buffer.length).toString('utf8').trim();
}
function parseOldBinaryEwb(buffer) {
    const magic = buffer.slice(0, 22).toString('utf8');
    if (magic !== OLD_EWB_MAGIC)
        return [];
    const footerOffset = buffer.length - 16;
    if (footerOffset <= 0 || buffer.slice(footerOffset + 8, footerOffset + 16).toString('utf8') !== 'ezwBible') {
        throw new Error('This EasyWorship Bible file has an unsupported old-format footer.');
    }
    const nameOffset = Number(buffer.readBigInt64LE(footerOffset));
    const bookTableOffset = 0x58;
    const bookRecordLength = 0xe0;
    const books = [];
    for (let i = 0; i < 66; i += 1) {
        const recordOffset = bookTableOffset + i * bookRecordLength;
        if (recordOffset + bookRecordLength > buffer.length)
            break;
        const name = readNullTerminated(buffer.slice(recordOffset, recordOffset + 51)) || BOOK_NAMES[i];
        const chapterCount = buffer.readUInt8(recordOffset + 0x33);
        const chapterCounts = Array.from(buffer.slice(recordOffset + 0x34, recordOffset + 0xd0)).slice(0, chapterCount);
        const offset = Number(buffer.readBigInt64LE(recordOffset + 0xd0));
        const length = Number(buffer.readBigInt64LE(recordOffset + 0xd8));
        if (offset > 0 && length > 0 && offset + length <= nameOffset) {
            books.push({ name, chapterCounts, offset, length });
        }
    }
    const verses = [];
    books.forEach((book, index) => {
        const compressed = buffer.slice(book.offset, book.offset + book.length);
        const text = zlib_1.default.inflateSync(compressed).toString('utf8');
        const lines = text.split(/\r?\n\r?\n|\r?\n/).map(line => line.trim()).filter(Boolean);
        for (const line of lines) {
            const match = line.match(/^(\d+):(\d+)\s+([\s\S]+)$/);
            if (!match)
                continue;
            const chapter = Number(match[1]);
            const verse = Number(match[2]);
            const verseText = cleanText(match[3]);
            if (chapter > 0 && verse > 0 && verseText) {
                verses.push({ book: book.name || BOOK_NAMES[index], chapter, verse, text: verseText });
            }
        }
    });
    return verses;
}
function parseSqliteEwb(filePath) {
    const external = new better_sqlite3_1.default(filePath, { readonly: true, fileMustExist: true });
    try {
        const tables = external.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        for (const table of tables) {
            const columns = external.prepare(`PRAGMA table_info(${JSON.stringify(table.name)})`).all();
            const byLower = new Map(columns.map(column => [column.name.toLowerCase(), column.name]));
            const bookCol = byLower.get('book') || byLower.get('book_name') || byLower.get('bookname');
            const chapterCol = byLower.get('chapter') || byLower.get('chapter_number');
            const verseCol = byLower.get('verse') || byLower.get('verse_number');
            const textCol = byLower.get('text') || byLower.get('verse_text') || byLower.get('scripture');
            if (!bookCol || !chapterCol || !verseCol || !textCol)
                continue;
            const rows = external.prepare(`SELECT ${JSON.stringify(bookCol)} AS book, ${JSON.stringify(chapterCol)} AS chapter, ${JSON.stringify(verseCol)} AS verse, ${JSON.stringify(textCol)} AS text FROM ${JSON.stringify(table.name)}`).all();
            const verses = rows.map(row => ({
                book: typeof row.book === 'number' ? (BOOK_NAMES[row.book - 1] || String(row.book)) : String(row.book),
                chapter: Number(row.chapter),
                verse: Number(row.verse),
                text: cleanText(row.text),
            })).filter(row => row.book && row.chapter > 0 && row.verse > 0 && row.text);
            if (verses.length)
                return verses;
        }
        throw new Error('This SQLite EWB file does not expose a simple verses table. Import an OSIS export for this Bible if EasyWorship keeps it in a compressed proprietary schema.');
    }
    finally {
        external.close();
    }
}
async function importEasyWorshipBibleFromFile(translationCode, language, filePath, onProgress) {
    const buffer = await fs_1.default.promises.readFile(filePath);
    const header = buffer.slice(0, 22).toString('utf8');
    const sqliteHeader = buffer.slice(0, SQLITE_MAGIC.length).toString('utf8');
    onProgress?.(20);
    const verses = sqliteHeader === SQLITE_MAGIC
        ? parseSqliteEwb(filePath)
        : header === OLD_EWB_MAGIC
            ? parseOldBinaryEwb(buffer)
            : [];
    if (!verses.length) {
        throw new Error('No verses were found. This may be an encrypted/licensed EasyWorship Bible or a different EWB file type.');
    }
    const existing = db_1.db.prepare('SELECT id FROM bibles WHERE translation = ?').get(translationCode);
    if (existing?.id) {
        throw new Error(`Translation "${translationCode}" is already installed.`);
    }
    const insertTx = db_1.db.transaction(() => {
        const info = db_1.db.prepare('INSERT INTO bibles (translation, language, path) VALUES (?, ?, ?)').run(translationCode, language, path_1.default.resolve(filePath));
        const bibleId = info.lastInsertRowid;
        const insertVerse = db_1.db.prepare('INSERT INTO verses (bible_id, book, chapter, verse, text) VALUES (?, ?, ?, ?, ?)');
        verses.forEach((verse, index) => {
            insertVerse.run(bibleId, verse.book, verse.chapter, verse.verse, verse.text);
            if (index % 1000 === 0)
                onProgress?.(20 + Math.round((index / verses.length) * 75));
        });
        return bibleId;
    });
    const bibleId = insertTx();
    onProgress?.(100);
    return bibleId;
}
