"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sync_1 = require("../src/main/sync");
const WebSocket = require('ws');
describe('Phase E: SyncServer', () => {
    test('broadcasts state to connected clients', (done) => {
        const port = 9099;
        const server = (0, sync_1.startSyncServer)(port);
        const client = new WebSocket(`ws://localhost:${port}`);
        client.on('open', () => {
            (0, sync_1.broadcastState)({ outId: 1, state: { slideTitle: 'Phase E Test' } });
        });
        client.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                expect(msg.type).toBe('state');
                expect(msg.payload.outId).toBe(1);
                client.close();
                server && server;
                done();
            }
            catch (e) {
                done(e);
            }
        });
    });
});
