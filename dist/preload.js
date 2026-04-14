/* Lightweight preload to expose IPC for the dist/main.js shell. */
const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('electron', {
  ipc: {
    invoke: (channel, data) => ipcRenderer.invoke(channel, data),
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, cb) => ipcRenderer.on(channel, cb)
  }
})

// Expose a lightweight Worship API for renderer processes (cohesive React app)
contextBridge.exposeInMainWorld('worship', {
  db: {
    run: (sql, params) => ipcRenderer.invoke('db.run', { sql, params })
  },
  outputs: {
    onOutputState: (cb) => ipcRenderer.on('output-state', (_e, payload) => cb(payload)),
    setState: (outId, state) => ipcRenderer.send('output-set-state', { outId, state }),
    actions: {
      black: () => ipcRenderer.send('output-action', { action: 'BLACK' }),
      logo: () => ipcRenderer.send('output-action', { action: 'LOGO' }),
      clear: () => ipcRenderer.send('output-action', { action: 'CLEAR' })
    }
  }
  ,
  bibles: {
    listTranslations: () => ipcRenderer.invoke('bibles.listTranslations'),
    openOsisFile: () => ipcRenderer.invoke('bibles.openOsisFile'),
    importFromOsis: (translationCode, language, filePath) => ipcRenderer.invoke('bibles.importFromOsis', { translationCode, language, filePath })
  },
  ndi: {
    enable: (enabled) => ipcRenderer.invoke('ndi.enable', enabled),
    status: () => ipcRenderer.invoke('ndi.status')
  }
})
