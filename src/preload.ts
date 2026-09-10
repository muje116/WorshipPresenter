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
  createWindow: (displayId?: number, fullScreen?: boolean) => Promise<{ id: number }>
  createForDisplays: (displayIds: number[], fullScreen?: boolean) => Promise<{ ids: number[] }>
  destroyWindow: (outId: number) => Promise<{ success: boolean }>
  list: () => Promise<any[]>
  assignToDisplay: (outId: number, displayId: number) => Promise<{ success: boolean }>
}

type API = {
  db?: {
    run: (sql: string, params?: any[]) => Promise<any>
  }
  songs: {
    getAll: () => Promise<any[]>
    create: (args: { title: string; artist?: string; tempo?: number; key?: string }) => Promise<any>
    updateTitle: (args: { id: number; title: string }) => Promise<void>
    delete: (args: { id: number }) => Promise<void>
    addSection: (args: { songId: number; type: string; text: string }) => Promise<any>
    updateSection: (args: { songId: number; sectionId: number; type?: string; text?: string }) => Promise<void>
    deleteSection: (args: { songId: number; sectionId: number }) => Promise<void>
    moveSections: (args: { songId: number; sectionIds: number[] }) => Promise<void>
  }
  schedule: {
    getItems: () => Promise<any[]>
    addItem: (args: { scheduleId: number; type: string; content: string }) => Promise<any>
    updateItem: (args: { id: number; type?: string; content?: string }) => Promise<void>
    deleteItem: (args: { id: number }) => Promise<void>
    moveItems: (args: { scheduleId: number; itemIds: number[] }) => Promise<void>
  }
  themes: {
    getAll: () => Promise<any[]>
    create: (args: { name: string; bg: string; textStyle: string; backgroundImage?: string; textColor?: string; fontSize?: number }) => Promise<any>
  }
  media: {
    getFolders: () => Promise<any[]>
    createFolder: (args: { name: string; parentId?: number | null }) => Promise<any>
    getAssets: (args: { folderId?: number | null; type?: string }) => Promise<any[]>
    createAsset: (args: { path: string; type: string; name: string; duration?: number | null; folderId?: number | null; thumbnail?: string }) => Promise<any>
    deleteAsset: (args: { id: number }) => Promise<void>
  }
  outputs: OutputAPI
  bibles: {
    listTranslations: () => Promise<any>
    openOsisFile: () => Promise<string | null>
    importFromOsis: (translationCode: string, language: string, filePath: string) => Promise<any>
    openXmlFiles: () => Promise<string[]>
    importXmlFiles: (filePaths: string[]) => Promise<any[]>
    openEasyWorshipFile: () => Promise<string | null>
    importFromEasyWorship: (translationCode: string, language: string, filePath: string) => Promise<any>
    getBooks: (translationId?: number) => Promise<string[]>
    getChapters: (book: string, translationId?: number) => Promise<number[]>
    getVerses: (book: string, chapter: number, translationId?: number) => Promise<any[]>
    search: (query: string, translationId?: number) => Promise<any[]>
    onImportProgress: (cb: (payload: { translationCode: string; progress: number }) => void) => () => void
    getOnlineSources: () => Promise<Array<{ code: string; name: string; language: string; url: string; format: string }>>
    downloadFromUrl: (args: { code: string; name: string; language: string; url: string; format: string }) => Promise<any>
    onDownloadProgress: (cb: (payload: { translationCode: string; progress: number }) => void) => () => void
  }
  ndi: {
    enable: (enabled: boolean) => Promise<{ enabled: boolean }>
    status: () => Promise<{ enabled: boolean; lastPayload: any }>
  }
  displays: {
    getAll: () => Promise<any[]>
    getPrimary: () => Promise<any>
    onChanged: (cb: (displays: any[]) => void) => () => void
  }
  app: {
    getVersion: () => Promise<string>
    getInfo: () => Promise<any>
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
  songs: {
    getAll: () => ipcRenderer.invoke('songs.getAll'),
    create: (args) => ipcRenderer.invoke('songs.create', args),
    updateTitle: (args) => ipcRenderer.invoke('songs.updateTitle', args),
    delete: (args) => ipcRenderer.invoke('songs.delete', args),
    addSection: (args) => ipcRenderer.invoke('songs.addSection', args),
    updateSection: (args) => ipcRenderer.invoke('songs.updateSection', args),
    deleteSection: (args) => ipcRenderer.invoke('songs.deleteSection', args),
    moveSections: (args) => ipcRenderer.invoke('songs.moveSections', args),
  },
  schedule: {
    getItems: () => ipcRenderer.invoke('schedule.getItems'),
    addItem: (args) => ipcRenderer.invoke('schedule.addItem', args),
    updateItem: (args) => ipcRenderer.invoke('schedule.updateItem', args),
    deleteItem: (args) => ipcRenderer.invoke('schedule.deleteItem', args),
    moveItems: (args) => ipcRenderer.invoke('schedule.moveItems', args),
  },
  themes: {
    getAll: () => ipcRenderer.invoke('themes.getAll'),
    create: (args) => ipcRenderer.invoke('themes.create', args),
  },
  media: {
    getFolders: () => ipcRenderer.invoke('media.getFolders'),
    createFolder: (args) => ipcRenderer.invoke('media.createFolder', args),
    getAssets: (args) => ipcRenderer.invoke('media.getAssets', args),
    createAsset: (args) => ipcRenderer.invoke('media.createAsset', args),
    deleteAsset: (args) => ipcRenderer.invoke('media.deleteAsset', args),
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
      ipcRenderer.send('output-window-control', { outId, action, bounds }),
    createWindow: (displayId?: number, fullScreen?: boolean) => ipcRenderer.invoke('outputs.createWindow', { displayId, fullScreen }),
    createForDisplays: (displayIds: number[], fullScreen?: boolean) => ipcRenderer.invoke('outputs.createForDisplays', { displayIds, fullScreen }),
    destroyWindow: (outId: number) => ipcRenderer.invoke('outputs.destroyWindow', outId),
    list: () => ipcRenderer.invoke('outputs.list'),
    assignToDisplay: (outId: number, displayId: number) => ipcRenderer.invoke('outputs.assignToDisplay', { outId, displayId }),
  },
  bibles: {
    listTranslations: () => ipcRenderer.invoke('bibles.listTranslations'),
    openOsisFile: () => ipcRenderer.invoke('bibles.openOsisFile'),
    importFromOsis: (translationCode: string, language: string, filePath: string) => ipcRenderer.invoke('bibles.importFromOsis', { translationCode, language, filePath }),
    openXmlFiles: () => ipcRenderer.invoke('bibles.openXmlFiles'),
    importXmlFiles: (filePaths: string[]) => ipcRenderer.invoke('bibles.importXmlFiles', filePaths),
    openEasyWorshipFile: () => ipcRenderer.invoke('bibles.openEasyWorshipFile'),
    importFromEasyWorship: (translationCode: string, language: string, filePath: string) => ipcRenderer.invoke('bibles.importFromEasyWorship', { translationCode, language, filePath }),
    getBooks: (translationId?: number) => ipcRenderer.invoke('bibles.getBooks', { translationId }),
    getChapters: (book: string, translationId?: number) => ipcRenderer.invoke('bibles.getChapters', { book, translationId }),
    getVerses: (book: string, chapter: number, translationId?: number) => ipcRenderer.invoke('bibles.getVerses', { book, chapter, translationId }),
    search: (query: string, translationId?: number) => ipcRenderer.invoke('bibles.search', { query, translationId }),
    onImportProgress: (cb) => {
      const listener = (_e: any, payload: any) => cb(payload)
      ipcRenderer.on('bible-import-progress', listener)
      return () => { ipcRenderer.removeListener('bible-import-progress', listener) }
    },
    getOnlineSources: () => ipcRenderer.invoke('bibles.getOnlineSources'),
    downloadFromUrl: (args) => ipcRenderer.invoke('bibles.downloadFromUrl', args),
    onDownloadProgress: (cb) => {
      const listener = (_e: any, payload: any) => cb(payload)
      ipcRenderer.on('bible-download-progress', listener)
      return () => { ipcRenderer.removeListener('bible-download-progress', listener) }
    },
  },
  ndi: {
    enable: (enabled: boolean) => ipcRenderer.invoke('ndi.enable', enabled),
    status: () => ipcRenderer.invoke('ndi.status')
  },
  displays: {
    getAll: () => ipcRenderer.invoke('displays.getAll'),
    getPrimary: () => ipcRenderer.invoke('displays.getPrimary'),
    onChanged: (cb) => {
      const listener = (_e: any, displays: any[]) => cb(displays)
      ipcRenderer.on('displays-changed', listener)
      return () => { ipcRenderer.removeListener('displays-changed', listener) }
    },
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app.getVersion'),
    getInfo: () => ipcRenderer.invoke('app.getInfo'),
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
