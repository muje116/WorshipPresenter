import { RawData, WebSocketServer, WebSocket } from 'ws'

export class SyncServer {
  private static _instance: SyncServer | null = null
  private wss: WebSocketServer

  private constructor(port: number) {
    this.wss = new WebSocketServer({ port })
    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('message', (data: RawData) => {
        try {
          const msg = JSON.parse(data.toString())
          this.broadcast(msg.type, msg.payload)
        } catch {
          // ignore malformed messages
        }
      })
    })
    console.log(`WorshipPresenter SyncServer listening on ws://localhost:${port}`)
  }

  static get instance(): SyncServer | null {
    return this._instance
  }

  static start(port = 9090): SyncServer {
    if (!this._instance) {
      this._instance = new SyncServer(port)
    }
    return this._instance
  }

  broadcast(type: string, payload: any) {
    const msg = JSON.stringify({ type, payload })
    this.wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg)
      }
    })
  }
}

export function startSyncServer(port = 9090) {
  return SyncServer.start(port)
}

export function broadcastState(state: any) {
  // Broadcast a generic state payload under a 'state' type for clients
  SyncServer.instance?.broadcast('state', state)
}
