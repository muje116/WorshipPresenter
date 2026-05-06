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
    // Simple DB bridge: execute read/write SQL via IPC
    electron_1.ipcMain.handle('db.run', (_event, payload) => {
        const { sql, params } = payload;
        const stmt = db_1.db.prepare(sql);
        const upper = sql.trim().toUpperCase();
        if (upper.startsWith('SELECT')) {
            return stmt.all(params || []);
        }
        else {
            const info = stmt.run(params || []);
            return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
        }
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
    electron_1.ipcMain.handle('bibles.importFromOsis', async (_ev, args) => {
        const { translationCode, language, filePath } = args;
        try {
            const bibleId = await (0, osisLoader_1.importOsisBibleFromFile)(translationCode, language, filePath);
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
    });
}
