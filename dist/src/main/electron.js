"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const sync_1 = require("../main/sync");
const db_1 = require("./db");
const ipc_1 = require("./ipc");
let mainWindow = null;
const outputWindows = [];
async function createWindows() {
    const operatorPreloadPath = path_1.default.join(__dirname, '../preload.js');
    const outputPreloadPath = path_1.default.join(__dirname, '../preload-output.js');
    const rendererEntryPath = path_1.default.join(__dirname, '../../renderer/app/index.html');
    // Main operator window - uses the new React app
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        webPreferences: {
            preload: operatorPreloadPath,
            contextIsolation: true,
            nodeIntegration: false,
        },
        backgroundColor: '#0f172a',
        show: false,
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    });
    // Load the new React app
    mainWindow.loadFile(rendererEntryPath);
    // Show window when ready to prevent flash
    mainWindow.on('ready-to-show', () => {
        mainWindow?.show();
    });
    // Two output windows (for demonstration)
    for (let i = 0; i < 2; i++) {
        const w = new electron_1.BrowserWindow({
            width: 960,
            height: 540,
            x: 100 + i * 20,
            y: 100,
            minWidth: 320,
            minHeight: 180,
            frame: true,
            resizable: true,
            minimizable: true,
            maximizable: true,
            closable: true,
            backgroundColor: '#000000',
            webPreferences: {
                preload: outputPreloadPath,
                contextIsolation: true,
                nodeIntegration: false,
            }
        });
        w.loadFile(rendererEntryPath, { query: { out: String(i + 1) } });
        outputWindows.push(w);
    }
    // Register output windows with IPC
    (0, ipc_1.registerOutputWindows)(outputWindows);
}
electron_1.app.whenReady().then(async () => {
    await (0, db_1.initDB)();
    createWindows();
    (0, ipc_1.setupIPC)();
    // Start the WebSocket-based sync service for multi-machine coordination
    (0, sync_1.startSyncServer)(9090);
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindows();
    }
});
