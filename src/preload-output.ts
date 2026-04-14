import { contextBridge, ipcRenderer } from 'electron'

type OutputAPI = {
  onOutputState: (cb: (payload: any) => void) => void
  setState: (outId: number, state: any) => void
}

contextBridge.exposeInMainWorld('worship', {
  outputs: {
    onOutputState: (cb: (payload: any) => void) => ipcRenderer.on('output-state', (_e, payload) => cb(payload)),
    setState: (outId: number, state: any) => ipcRenderer.send('output-set-state', { outId, state })
  } satisfies OutputAPI
})
