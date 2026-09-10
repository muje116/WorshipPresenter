"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = {
    songs: {
        getAll: () => electron_1.ipcRenderer.invoke('songs.getAll'),
        create: (args) => electron_1.ipcRenderer.invoke('songs.create', args),
        updateTitle: (args) => electron_1.ipcRenderer.invoke('songs.updateTitle', args),
        delete: (args) => electron_1.ipcRenderer.invoke('songs.delete', args),
        addSection: (args) => electron_1.ipcRenderer.invoke('songs.addSection', args),
        updateSection: (args) => electron_1.ipcRenderer.invoke('songs.updateSection', args),
        deleteSection: (args) => electron_1.ipcRenderer.invoke('songs.deleteSection', args),
        moveSections: (args) => electron_1.ipcRenderer.invoke('songs.moveSections', args),
    },
    schedule: {
        getItems: () => electron_1.ipcRenderer.invoke('schedule.getItems'),
        addItem: (args) => electron_1.ipcRenderer.invoke('schedule.addItem', args),
        updateItem: (args) => electron_1.ipcRenderer.invoke('schedule.updateItem', args),
        deleteItem: (args) => electron_1.ipcRenderer.invoke('schedule.deleteItem', args),
        moveItems: (args) => electron_1.ipcRenderer.invoke('schedule.moveItems', args),
    },
    themes: {
        getAll: () => electron_1.ipcRenderer.invoke('themes.getAll'),
        create: (args) => electron_1.ipcRenderer.invoke('themes.create', args),
    },
    media: {
        getFolders: () => electron_1.ipcRenderer.invoke('media.getFolders'),
        createFolder: (args) => electron_1.ipcRenderer.invoke('media.createFolder', args),
        getAssets: (args) => electron_1.ipcRenderer.invoke('media.getAssets', args),
        createAsset: (args) => electron_1.ipcRenderer.invoke('media.createAsset', args),
        deleteAsset: (args) => electron_1.ipcRenderer.invoke('media.deleteAsset', args),
    },
    outputs: {
        onOutputState: (cb) => electron_1.ipcRenderer.on('output-state', (_e, payload) => cb(payload)),
        setState: (outId, state) => electron_1.ipcRenderer.send('output-set-state', { outId, state }),
        actions: {
            black: () => electron_1.ipcRenderer.send('output-action', { action: 'BLACK' }),
            logo: () => electron_1.ipcRenderer.send('output-action', { action: 'LOGO' }),
            clear: () => electron_1.ipcRenderer.send('output-action', { action: 'CLEAR' }),
            fullscreen: () => electron_1.ipcRenderer.send('output-action', { action: 'FULLSCREEN' })
        },
        windowControl: (outId, action, bounds) => electron_1.ipcRenderer.send('output-window-control', { outId, action, bounds }),
        createWindow: (displayId, fullScreen) => electron_1.ipcRenderer.invoke('outputs.createWindow', { displayId, fullScreen }),
        createForDisplays: (displayIds, fullScreen) => electron_1.ipcRenderer.invoke('outputs.createForDisplays', { displayIds, fullScreen }),
        destroyWindow: (outId) => electron_1.ipcRenderer.invoke('outputs.destroyWindow', outId),
        list: () => electron_1.ipcRenderer.invoke('outputs.list'),
        assignToDisplay: (outId, displayId) => electron_1.ipcRenderer.invoke('outputs.assignToDisplay', { outId, displayId }),
    },
    bibles: {
        listTranslations: () => electron_1.ipcRenderer.invoke('bibles.listTranslations'),
        openOsisFile: () => electron_1.ipcRenderer.invoke('bibles.openOsisFile'),
        importFromOsis: (translationCode, language, filePath) => electron_1.ipcRenderer.invoke('bibles.importFromOsis', { translationCode, language, filePath }),
        openXmlFiles: () => electron_1.ipcRenderer.invoke('bibles.openXmlFiles'),
        importXmlFiles: (filePaths) => electron_1.ipcRenderer.invoke('bibles.importXmlFiles', filePaths),
        openEasyWorshipFile: () => electron_1.ipcRenderer.invoke('bibles.openEasyWorshipFile'),
        importFromEasyWorship: (translationCode, language, filePath) => electron_1.ipcRenderer.invoke('bibles.importFromEasyWorship', { translationCode, language, filePath }),
        getBooks: (translationId) => electron_1.ipcRenderer.invoke('bibles.getBooks', { translationId }),
        getChapters: (book, translationId) => electron_1.ipcRenderer.invoke('bibles.getChapters', { book, translationId }),
        getVerses: (book, chapter, translationId) => electron_1.ipcRenderer.invoke('bibles.getVerses', { book, chapter, translationId }),
        search: (query, translationId) => electron_1.ipcRenderer.invoke('bibles.search', { query, translationId }),
        onImportProgress: (cb) => {
            const listener = (_e, payload) => cb(payload);
            electron_1.ipcRenderer.on('bible-import-progress', listener);
            return () => { electron_1.ipcRenderer.removeListener('bible-import-progress', listener); };
        },
        getOnlineSources: () => electron_1.ipcRenderer.invoke('bibles.getOnlineSources'),
        downloadFromUrl: (args) => electron_1.ipcRenderer.invoke('bibles.downloadFromUrl', args),
        onDownloadProgress: (cb) => {
            const listener = (_e, payload) => cb(payload);
            electron_1.ipcRenderer.on('bible-download-progress', listener);
            return () => { electron_1.ipcRenderer.removeListener('bible-download-progress', listener); };
        },
    },
    ndi: {
        enable: (enabled) => electron_1.ipcRenderer.invoke('ndi.enable', enabled),
        status: () => electron_1.ipcRenderer.invoke('ndi.status')
    },
    displays: {
        getAll: () => electron_1.ipcRenderer.invoke('displays.getAll'),
        getPrimary: () => electron_1.ipcRenderer.invoke('displays.getPrimary'),
        onChanged: (cb) => {
            const listener = (_e, displays) => cb(displays);
            electron_1.ipcRenderer.on('displays-changed', listener);
            return () => { electron_1.ipcRenderer.removeListener('displays-changed', listener); };
        },
    },
    app: {
        getVersion: () => electron_1.ipcRenderer.invoke('app.getVersion'),
        getInfo: () => electron_1.ipcRenderer.invoke('app.getInfo'),
    },
    dialog: {
        openFiles: (options) => electron_1.ipcRenderer.invoke('dialog.openFiles', options || {})
    },
    fs: {
        readTextFile: (filePath) => electron_1.ipcRenderer.invoke('fs.readTextFile', filePath)
    }
};
electron_1.contextBridge.exposeInMainWorld('worship', api);
