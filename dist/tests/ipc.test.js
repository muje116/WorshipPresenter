"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('electron', () => {
    const on = jest.fn();
    const handle = jest.fn();
    return {
        ipcMain: { on, handle },
        app: { getPath: jest.fn(() => 'C:/tmp') },
        dialog: { showOpenDialog: jest.fn(async () => ({ canceled: true, filePaths: [] })) },
        BrowserWindow: function MockWindow() { }
    };
});
jest.mock('../src/main/db', () => ({
    db: { prepare: jest.fn(() => ({ all: jest.fn(() => []), run: jest.fn(() => ({ changes: 0, lastInsertRowid: 1 })) })) }
}));
jest.mock('../src/main/sync', () => ({ broadcastState: jest.fn() }));
jest.mock('../src/main/osisLoader', () => ({
    importOsisBibleFromFile: jest.fn(async () => 1),
    loadOsisTranslations: jest.fn(async () => [])
}));
const electron_1 = require("electron");
const ipc_1 = require("../src/main/ipc");
describe('IPC surface', () => {
    test('registers core handlers and listeners once', () => {
        (0, ipc_1.setupIPC)();
        (0, ipc_1.setupIPC)();
        expect(electron_1.ipcMain.handle.mock.calls.length).toBeGreaterThan(3);
        expect(electron_1.ipcMain.on.mock.calls.length).toBeGreaterThan(1);
    });
});
