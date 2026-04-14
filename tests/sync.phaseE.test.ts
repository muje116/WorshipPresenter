import { startSyncServer, broadcastState } from '../src/main/sync'
const WebSocket = require('ws')

describe('Phase E: SyncServer', () => {
  test('broadcasts state to connected clients', (done) => {
    const port = 9099
    const server = startSyncServer(port)
    const client = new WebSocket(`ws://localhost:${port}`)
    client.on('open', () => {
      broadcastState({ outId: 1, state: { slideTitle: 'Phase E Test' } })
    })
    client.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString())
        expect(msg.type).toBe('state')
        expect(msg.payload.outId).toBe(1)
        client.close()
        server && server
        done()
      } catch (e) {
        done(e)
      }
    })
  })
})
