"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const store_1 = require("../src/renderer/app/store");
describe('Store basics', () => {
    test('initial store has songs array', () => {
        const s = store_1.useStore.getState();
        expect(Array.isArray(s.songs)).toBe(true);
    });
    test('can add a song', async () => {
        const store = store_1.useStore.getState();
        const initialCount = store.songs.length;
        await store.addSong();
        const next = store_1.useStore.getState();
        expect(next.songs.length).toBe(initialCount + 1);
    });
    test('can update live slide independently from preview slide', () => {
        const store = store_1.useStore.getState();
        store.setCurrentSlide('Preview Only');
        store.setLiveSlide('Live Only');
        const next = store_1.useStore.getState();
        expect(next.currentSlide).toBe('Preview Only');
        expect(next.liveSlide).toBe('Live Only');
    });
    test('can edit song section metadata', async () => {
        // First add a song to test with
        const store = store_1.useStore.getState();
        await store.addSong();
        const state = store_1.useStore.getState();
        const song = state.songs[state.songs.length - 1];
        const section = song.sections[0];
        store.updateSongSection(song.id, section.id, { type: 'Bridge', text: '[D]Updated line' });
        const updated = store_1.useStore.getState().songs.find(s => s.id === song.id)?.sections[0];
        expect(updated?.type).toBe('Bridge');
        expect(updated?.text).toContain('Updated');
    });
});
