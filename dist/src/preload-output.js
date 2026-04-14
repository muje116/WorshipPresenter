"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('worship', {
    outputs: {
        onOutputState: (cb) => electron_1.ipcRenderer.on('output-state', (_e, payload) => cb(payload)),
        setState: (outId, state) => electron_1.ipcRenderer.send('output-set-state', { outId, state })
    }
});
