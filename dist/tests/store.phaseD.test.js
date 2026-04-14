"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const store_1 = require("../src/renderer/app/store");
describe('Phase D Looks', () => {
    test('setLook persists per output', () => {
        const setState = store_1.useStore.getState();
        expect(setState.looks).toBeDefined();
        setState.setLook(1, { background: '#ff0000', template: 'default', layers: ['slide'] });
        const looks = store_1.useStore.getState().looks;
        expect(looks[1]).toBeDefined();
        expect(looks[1]?.background).toBe('#ff0000');
    });
});
