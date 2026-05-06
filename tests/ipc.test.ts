jest.mock('electron', () => {
  const on = jest.fn()
  const handle = jest.fn()
  return {
    ipcMain: { on, handle },
    app: { getPath: jest.fn(() => 'C:/tmp') },
    dialog: { showOpenDialog: jest.fn(async () => ({ canceled: true, filePaths: [] })) },
    BrowserWindow: function MockWindow() {}
  }
})

jest.mock('../src/main/db', () => ({
  db: { prepare: jest.fn(() => ({ all: jest.fn(() => []), run: jest.fn(() => ({ changes: 0, lastInsertRowid: 1 })) })) }
}))

jest.mock('../src/main/sync', () => ({ broadcastState: jest.fn() }))
jest.mock('../src/main/osisLoader', () => ({
  importOsisBibleFromFile: jest.fn(async () => 1),
  loadOsisTranslations: jest.fn(async () => [])
}))

import { ipcMain } from 'electron'
import { setupIPC } from '../src/main/ipc'

describe('IPC surface', () => {
  test('registers core handlers and listeners once', () => {
    setupIPC()
    setupIPC()
    expect((ipcMain.handle as jest.Mock).mock.calls.length).toBeGreaterThan(3)
    expect((ipcMain.on as jest.Mock).mock.calls.length).toBeGreaterThan(1)
  })
})
