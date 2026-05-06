import { contextBridge, ipcRenderer } from 'electron'

type OutputAPI = {
  onOutputState: (cb: (payload: any) => void) => void
  setState: (outId: number, state: any) => void
  actions: {
    black: () => void
    logo: () => void
    clear: () => void
    fullscreen: () => void
  }
  windowControl: (outId: number, action: string, bounds?: { width?: number; height?: number; x?: number; y?: number }) => void
}

type API = {
  db: {
    run: (sql: string, params?: any[]) => Promise<any>
  }
  outputs: OutputAPI
  bibles: {
    listTranslations: () => Promise<any>
    openOsisFile: () => Promise<string | null>
    importFromOsis: (translationCode: string, language: string, filePath: string) => Promise<number>
    getBooks: () => Promise<string[]>
    getChapters: (book: string) => Promise<number[]>
    getVerses: (book: string, chapter: number, translationId?: number) => Promise<any[]>
    search: (query: string, translationId?: number) => Promise<any[]>
  }
  ndi: {
    enable: (enabled: boolean) => Promise<{ enabled: boolean }>
    status: () => Promise<{ enabled: boolean; lastPayload: any }>
  }
  dialog: {
    openFiles: (options?: {
      title?: string
      filters?: Array<{ name: string; extensions: string[] }>
      multiSelections?: boolean
    }) => Promise<string[]>
  }
  fs: {
    readTextFile: (filePath: string) => Promise<string>
  }
}

const api: API = {
  db: {
    run: (sql: string, params?: any[]) => ipcRenderer.invoke('db.run', { sql, params })
  },
  outputs: {
    onOutputState: (cb) => ipcRenderer.on('output-state', (_e, payload) => cb(payload)),
    setState: (outId: number, state: any) => ipcRenderer.send('output-set-state', { outId, state }),
    actions: {
      black: () => ipcRenderer.send('output-action', { action: 'BLACK' }),
      logo: () => ipcRenderer.send('output-action', { action: 'LOGO' }),
      clear: () => ipcRenderer.send('output-action', { action: 'CLEAR' }),
      fullscreen: () => ipcRenderer.send('output-action', { action: 'FULLSCREEN' })
    },
    windowControl: (outId: number, action: string, bounds?: { width?: number; height?: number; x?: number; y?: number }) =>
      ipcRenderer.send('output-window-control', { outId, action, bounds })
  },
  bibles: {
    listTranslations: () => ipcRenderer.invoke('bibles.listTranslations'),
    openOsisFile: () => ipcRenderer.invoke('bibles.openOsisFile'),
    importFromOsis: (translationCode: string, language: string, filePath: string) => ipcRenderer.invoke('bibles.importFromOsis', { translationCode, language, filePath }),
    getBooks: () => ipcRenderer.invoke('bibles.getBooks'),
    getChapters: (book: string) => ipcRenderer.invoke('bibles.getChapters', { book }),
    getVerses: (book: string, chapter: number, translationId?: number) => ipcRenderer.invoke('bibles.getVerses', { book, chapter, translationId }),
    search: (query: string, translationId?: number) => ipcRenderer.invoke('bibles.search', { query, translationId })
  },
  ndi: {
    enable: (enabled: boolean) => ipcRenderer.invoke('ndi.enable', enabled),
    status: () => ipcRenderer.invoke('ndi.status')
  },
  dialog: {
    openFiles: (options?: {
      title?: string
      filters?: Array<{ name: string; extensions: string[] }>
      multiSelections?: boolean
    }) => ipcRenderer.invoke('dialog.openFiles', options || {})
  },
  fs: {
    readTextFile: (filePath: string) => ipcRenderer.invoke('fs.readTextFile', filePath)
  }
}

contextBridge.exposeInMainWorld('worship', api)
