"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncServer = void 0;
exports.startSyncServer = startSyncServer;
exports.broadcastState = broadcastState;
const ws_1 = require("ws");
class SyncServer {
    constructor(port) {
        this.wss = new ws_1.WebSocketServer({ port });
        this.wss.on('connection', (ws) => {
            ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data.toString());
                    this.broadcast(msg.type, msg.payload);
                }
                catch {
                    // ignore malformed messages
                }
            });
        });
        console.log(`WorshipPresenter SyncServer listening on ws://localhost:${port}`);
    }
    static get instance() {
        return this._instance;
    }
    static start(port = 9090) {
        if (!this._instance) {
            this._instance = new SyncServer(port);
        }
        return this._instance;
    }
    broadcast(type, payload) {
        const msg = JSON.stringify({ type, payload });
        this.wss.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(msg);
            }
        });
    }
}
exports.SyncServer = SyncServer;
SyncServer._instance = null;
function startSyncServer(port = 9090) {
    return SyncServer.start(port);
}
function broadcastState(state) {
    // Broadcast a generic state payload under a 'state' type for clients
    SyncServer.instance?.broadcast('state', state);
}
