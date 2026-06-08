"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOutputWindows = registerOutputWindows;
exports.setupIPC = setupIPC;
const electron_1 = require("electron");
const db_1 = require("./db");
const sync_1 = require("./sync");
const osisLoader_1 = require("./osisLoader");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let outputWindows = [];
let ipcRegistered = false;
const ndiState = {
    enabled: false,
    lastPayload: null
};
let overrideAction = null;
function registerOutputWindows(windows) {
    outputWindows = windows;
}
function setupIPC() {
    if (ipcRegistered)
        return;
    ipcRegistered = true;
    // Typed database handlers (removes raw SQL passthrough)
    electron_1.ipcMain.handle('songs.getAll', async () => {
        const rows = db_1.db.prepare(`
      SELECT 
        s.id AS song_id, s.title, s.artist, s.tempo, s.key,
        sec.id AS section_id, sec.type AS section_type, sec.content AS section_content, sec.order_num AS section_order
      FROM songs s
      LEFT JOIN song_sections sec ON s.id = sec.song_id
      ORDER BY s.id, sec.order_num
    `).all();
        const songsMap = new Map();
        for (const row of rows) {
            if (!songsMap.has(row.song_id)) {
                songsMap.set(row.song_id, {
                    id: row.song_id,
                    title: row.title,
                    artist: row.artist,
                    tempo: row.tempo,
                    key: row.key,
                    sections: []
                });
            }
            if (row.section_id !== null) {
                songsMap.get(row.song_id).sections.push({
                    id: row.section_id,
                    type: row.section_type,
                    text: row.section_content
                });
            }
        }
        return Array.from(songsMap.values());
    });
    electron_1.ipcMain.handle('songs.create', async (_ev, args) => {
        const info = db_1.db.prepare('INSERT INTO songs (title, artist, tempo, key) VALUES (?, ?, ?, ?)').run(args.title, args.artist || null, args.tempo || null, args.key || null);
        const songId = info.lastInsertRowid;
        const secInfo = db_1.db.prepare('INSERT INTO song_sections (song_id, type, content, order_num) VALUES (?, ?, ?, ?)').run(songId, 'Verse', '[C]Verse text', 1);
        return {
            id: songId,
            title: args.title,
            artist: args.artist,
            tempo: args.tempo,
            key: args.key,
            sections: [{ id: secInfo.lastInsertRowid, type: 'Verse', text: '[C]Verse text' }]
        };
    });
    electron_1.ipcMain.handle('songs.updateTitle', async (_ev, args) => {
        db_1.db.prepare('UPDATE songs SET title = ? WHERE id = ?').run(args.title, args.id);
    });
    electron_1.ipcMain.handle('songs.delete', async (_ev, args) => {
        const deleteTx = db_1.db.transaction((id) => {
            db_1.db.prepare('DELETE FROM song_sections WHERE song_id = ?').run(id);
            db_1.db.prepare('DELETE FROM songs WHERE id = ?').run(id);
        });
        deleteTx(args.id);
    });
    electron_1.ipcMain.handle('songs.addSection', async (_ev, args) => {
        const maxOrderRow = db_1.db.prepare('SELECT COALESCE(MAX(order_num), 0) AS m FROM song_sections WHERE song_id = ?').get(args.songId);
        const nextOrder = maxOrderRow.m + 1;
        const info = db_1.db.prepare('INSERT INTO song_sections (song_id, type, content, order_num) VALUES (?, ?, ?, ?)').run(args.songId, args.type, args.text, nextOrder);
        return { id: info.lastInsertRowid, type: args.type, text: args.text };
    });
    electron_1.ipcMain.handle('songs.updateSection', async (_ev, args) => {
        if (args.type !== undefined) {
            db_1.db.prepare('UPDATE song_sections SET type = ? WHERE id = ? AND song_id = ?').run(args.type, args.sectionId, args.songId);
        }
        if (args.text !== undefined) {
            db_1.db.prepare('UPDATE song_sections SET content = ? WHERE id = ? AND song_id = ?').run(args.text, args.sectionId, args.songId);
        }
    });
    electron_1.ipcMain.handle('songs.deleteSection', async (_ev, args) => {
        db_1.db.prepare('DELETE FROM song_sections WHERE id = ? AND song_id = ?').run(args.sectionId, args.songId);
    });
    electron_1.ipcMain.handle('songs.moveSections', async (_ev, args) => {
        const updateStmt = db_1.db.prepare('UPDATE song_sections SET order_num = ? WHERE id = ? AND song_id = ?');
        const moveTx = db_1.db.transaction((songId, sectionIds) => {
            sectionIds.forEach((id, idx) => {
                updateStmt.run(idx + 1, id, songId);
            });
        });
        moveTx(args.songId, args.sectionIds);
    });
    electron_1.ipcMain.handle('schedule.getItems', async () => {
        return db_1.db.prepare('SELECT * FROM schedule_items ORDER BY order_num').all();
    });
    electron_1.ipcMain.handle('schedule.addItem', async (_ev, args) => {
        const maxOrderRow = db_1.db.prepare('SELECT COALESCE(MAX(order_num), 0) AS m FROM schedule_items WHERE schedule_id = ?').get(args.scheduleId);
        const nextOrder = maxOrderRow.m + 1;
        const info = db_1.db.prepare('INSERT INTO schedule_items (schedule_id, item_type, content, order_num) VALUES (?, ?, ?, ?)').run(args.scheduleId, args.type, args.content, nextOrder);
        return { id: info.lastInsertRowid, item_type: args.type, content: args.content };
    });
    electron_1.ipcMain.handle('schedule.updateItem', async (_ev, args) => {
        if (args.type !== undefined) {
            db_1.db.prepare('UPDATE schedule_items SET item_type = ? WHERE id = ?').run(args.type, args.id);
        }
        if (args.content !== undefined) {
            db_1.db.prepare('UPDATE schedule_items SET content = ? WHERE id = ?').run(args.content, args.id);
        }
    });
    electron_1.ipcMain.handle('schedule.deleteItem', async (_ev, args) => {
        db_1.db.prepare('DELETE FROM schedule_items WHERE id = ?').run(args.id);
    });
    electron_1.ipcMain.handle('schedule.moveItems', async (_ev, args) => {
        const updateStmt = db_1.db.prepare('UPDATE schedule_items SET order_num = ? WHERE id = ? AND schedule_id = ?');
        const moveTx = db_1.db.transaction((scheduleId, itemIds) => {
            itemIds.forEach((id, idx) => {
                updateStmt.run(idx + 1, id, scheduleId);
            });
        });
        moveTx(args.scheduleId, args.itemIds);
    });
    electron_1.ipcMain.handle('themes.getAll', async () => {
        return db_1.db.prepare('SELECT * FROM themes ORDER BY id').all();
    });
    electron_1.ipcMain.handle('themes.create', async (_ev, args) => {
        const info = db_1.db.prepare('INSERT INTO themes (name, background, text_style, backgroundImage, text_color, font_size) VALUES (?, ?, ?, ?, ?, ?)').run(args.name, args.bg, args.textStyle, args.backgroundImage || '', args.textColor || '#ffffff', args.fontSize || 42);
        return { id: info.lastInsertRowid, ...args };
    });
    electron_1.ipcMain.handle('media.getFolders', async () => {
        return db_1.db.prepare('SELECT * FROM media_folders ORDER BY name').all();
    });
    electron_1.ipcMain.handle('media.createFolder', async (_ev, args) => {
        const info = db_1.db.prepare('INSERT INTO media_folders (name, parent_id) VALUES (?, ?)').run(args.name, args.parentId !== undefined ? args.parentId : null);
        return { id: info.lastInsertRowid, name: args.name, parent_id: args.parentId };
    });
    electron_1.ipcMain.handle('media.getAssets', async (_ev, args) => {
        let sql = 'SELECT * FROM media_assets';
        const params = [];
        const conditions = [];
        if (args.type) {
            conditions.push('type = ?');
            params.push(args.type);
        }
        if (args.folderId !== undefined) {
            if (args.folderId === null) {
                conditions.push('folder_id IS NULL');
            }
            else {
                conditions.push('folder_id = ?');
                params.push(args.folderId);
            }
        }
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY id DESC';
        return db_1.db.prepare(sql).all(...params);
    });
    electron_1.ipcMain.handle('media.createAsset', async (_ev, args) => {
        const info = db_1.db.prepare('INSERT INTO media_assets (path, type, name, duration, folder_id, thumbnail) VALUES (?, ?, ?, ?, ?, ?)').run(args.path, args.type, args.name, args.duration !== undefined ? args.duration : null, args.folderId !== undefined ? args.folderId : null, args.thumbnail || null);
        return { id: info.lastInsertRowid, ...args };
    });
    electron_1.ipcMain.handle('media.deleteAsset', async (_ev, args) => {
        db_1.db.prepare('DELETE FROM media_assets WHERE id = ?').run(args.id);
    });
    // Output control: BLACK/LOGO/CLEAR
    electron_1.ipcMain.on('output-action', (_ev, payload) => {
        const action = payload.action;
        overrideAction = action === 'CLEAR' ? null : action;
        for (const w of outputWindows) {
            if (!w.isDestroyed()) {
                if (action === 'FULLSCREEN') {
                    w.setFullScreen(true);
                }
                else {
                    w.webContents.send('output-action', { action });
                }
            }
        }
    });
    electron_1.ipcMain.on('output-window-control', (_ev, payload) => {
        const target = outputWindows[payload.outId - 1];
        if (!target || target.isDestroyed())
            return;
        const action = payload.action;
        if (action === 'minimize')
            target.minimize();
        else if (action === 'maximize')
            target.maximize();
        else if (action === 'restore')
            target.restore();
        else if (action === 'close')
            target.hide();
        else if (action === 'show')
            target.show();
        else if (action === 'toggle-fullscreen')
            target.setFullScreen(!target.isFullScreen());
        else if (action === 'resize' && payload.bounds?.width && payload.bounds?.height) {
            const [x, y] = target.getPosition();
            target.setBounds({
                x: payload.bounds.x ?? x,
                y: payload.bounds.y ?? y,
                width: Math.max(320, payload.bounds.width),
                height: Math.max(180, payload.bounds.height),
            });
        }
        else if (action === 'move') {
            const [x, y] = target.getPosition();
            target.setPosition(payload.bounds?.x ?? x, payload.bounds?.y ?? y);
        }
    });
    // State updates to outputs (operator can push a new slide state)
    electron_1.ipcMain.on('output-set-state', (_ev, payload) => {
        const idx = payload.outId - 1;
        const target = outputWindows[idx];
        const state = overrideAction === 'BLACK'
            ? { ...payload.state, mode: 'black' }
            : overrideAction === 'LOGO'
                ? { ...payload.state, mode: 'logo', slideTitle: 'Church Logo' }
                : payload.state;
        if (target && !target.isDestroyed()) {
            target.webContents.send('output-state', { outputId: payload.outId, state });
        }
        if (ndiState.enabled) {
            ndiState.lastPayload = { outId: payload.outId, state };
            console.log('[NDI STUB] Broadcasting output state', ndiState.lastPayload);
        }
        try {
            (0, sync_1.broadcastState)({ outId: payload.outId, state });
        }
        catch {
            // ignore if sync server isn't running
        }
    });
    electron_1.ipcMain.handle('ndi.enable', async (_ev, enabled) => {
        ndiState.enabled = Boolean(enabled);
        console.log(`[NDI STUB] ${ndiState.enabled ? 'enabled' : 'disabled'}`);
        return { enabled: ndiState.enabled };
    });
    electron_1.ipcMain.handle('ndi.status', async () => ({
        enabled: ndiState.enabled,
        lastPayload: ndiState.lastPayload
    }));
    electron_1.ipcMain.handle('dialog.openFiles', async (_ev, options) => {
        const result = await electron_1.dialog.showOpenDialog({
            title: options?.title,
            filters: options?.filters,
            properties: options?.multiSelections ? ['openFile', 'multiSelections'] : ['openFile']
        });
        if (result.canceled)
            return [];
        return result.filePaths;
    });
    electron_1.ipcMain.handle('fs.readTextFile', async (_ev, filePath) => {
        return fs_1.default.promises.readFile(filePath, 'utf8');
    });
    registerBibleHandlers();
}
function registerBibleHandlers() {
    electron_1.ipcMain.handle('bibles.importFromOsis', async (event, args) => {
        const { translationCode, language, filePath } = args;
        try {
            const bibleId = await (0, osisLoader_1.importOsisBibleFromFile)(translationCode, language, filePath, (percent) => {
                event.sender.send('bible-import-progress', { translationCode, progress: percent });
            });
            return bibleId;
        }
        catch (err) {
            return { error: err.message };
        }
    });
    electron_1.ipcMain.handle('bibles.openOsisFile', async () => {
        const res = await electron_1.dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'OSIS XML', extensions: ['osis', 'xml'] }] });
        if (res.canceled || res.filePaths.length === 0)
            return null;
        return res.filePaths[0];
    });
    electron_1.ipcMain.handle('bibles.listTranslations', async () => {
        const osisPaths = [
            path_1.default.join(electron_1.app.getPath('userData'), 'bibles', 'niv.osis'),
            path_1.default.join(electron_1.app.getPath('userData'), 'bibles', 'kjv.osis')
        ];
        try {
            const translations = await (0, osisLoader_1.loadOsisTranslations)(osisPaths);
            if (translations.length > 0)
                return translations;
        }
        catch { }
        try {
            const rows = db_1.db.prepare('SELECT translation AS code, translation AS name, language FROM bibles').all();
            return rows.map((r) => ({ code: r.code ?? r.translation, name: r.name ?? r.translation, language: r.language }));
        }
        catch {
            return [];
        }
    });
    electron_1.ipcMain.handle('bibles.getBooks', async () => [
        'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
        '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
        'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
        'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
        'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
        'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
        'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
    ]);
    electron_1.ipcMain.handle('bibles.getChapters', async (_ev, args) => {
        try {
            const rows = db_1.db.prepare('SELECT DISTINCT chapter FROM verses WHERE book = ? ORDER BY chapter').all(args.book);
            return rows.map((r) => r.chapter);
        }
        catch {
            return [];
        }
    });
    electron_1.ipcMain.handle('bibles.getVerses', async (_ev, args) => {
        const { book, chapter, translationId } = args;
        try {
            let sql = 'SELECT verse, text FROM verses WHERE book = ? AND chapter = ? ORDER BY verse';
            const params = [book, chapter];
            if (translationId) {
                sql = 'SELECT v.verse, v.text FROM verses v WHERE v.bible_id = ? AND v.book = ? AND v.chapter = ? ORDER BY v.verse';
                params.unshift(translationId);
            }
            return db_1.db.prepare(sql).all(...params);
        }
        catch {
            return [];
        }
    });
    electron_1.ipcMain.handle('bibles.search', async (_ev, args) => {
        const { query, translationId } = args;
        if (!query || !query.trim())
            return [];
        try {
            const matchQuery = query.trim().replace(/["']/g, '');
            let sql = `
        SELECT v.book, v.chapter, v.verse, v.text 
        FROM verses v
        JOIN verses_fts f ON v.id = f.rowid
        WHERE f.text MATCH ?
        ORDER BY v.book, v.chapter, v.verse 
        LIMIT 100
      `;
            const params = [`"${matchQuery}"`];
            if (translationId) {
                sql = `
          SELECT v.book, v.chapter, v.verse, v.text 
          FROM verses v
          JOIN verses_fts f ON v.id = f.rowid
          WHERE v.bible_id = ? AND f.text MATCH ?
          ORDER BY v.book, v.chapter, v.verse 
          LIMIT 100
        `;
                params.unshift(translationId);
            }
            return db_1.db.prepare(sql).all(...params);
        }
        catch (e) {
            console.error('Bible search FTS5 failed, falling back to LIKE:', e);
            try {
                let sql = 'SELECT book, chapter, verse, text FROM verses WHERE text LIKE ? ORDER BY book, chapter, verse LIMIT 100';
                const params = [`%${query}%`];
                if (translationId) {
                    sql = 'SELECT v.book, v.chapter, v.verse, v.text FROM verses v WHERE v.bible_id = ? AND v.text LIKE ? ORDER BY v.book, v.chapter, v.verse LIMIT 100';
                    params.unshift(translationId);
                }
                return db_1.db.prepare(sql).all(...params);
            }
            catch {
                return [];
            }
        }
    });
}
