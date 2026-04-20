"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStore = exports.THEME_PRESETS = void 0;
const zustand_1 = require("zustand");
// Theme presets
exports.THEME_PRESETS = [
    { name: 'Light Classic', bg: '#ffffff', color: '#000000', fontSize: 48 },
    { name: 'Dark Modern', bg: '#1a1a2e', color: '#eaeaea', fontSize: 42 },
    { name: 'Blue Ocean', bg: '#0f4c75', color: '#ffffff', fontSize: 44 },
    { name: 'Sunset Warm', bg: '#2d132c', color: '#ffd700', fontSize: 42 },
    { name: 'Forest Green', bg: '#1b4332', color: '#d8f3dc', fontSize: 44 },
    { name: 'Royal Purple', bg: '#3c096c', color: '#e0aaff', fontSize: 42 },
    { name: 'Minimal Black', bg: '#000000', color: '#ffffff', fontSize: 48 },
    { name: 'Soft Gray', bg: '#2d2d2d', color: '#f0f0f0', fontSize: 42 },
];
exports.useStore = (0, zustand_1.create)((set, get) => ({
    songs: [],
    schedule: [],
    theme: { bg: '#1a1a1a', color: '#ffffff', backgroundImage: '', fontSize: 42, opacity: 100, blur: 0, gradient: '', fontFamily: 'Manrope', fontWeight: 700, textAlign: 'center' },
    currentSlide: 'Welcome',
    liveSlide: 'Welcome',
    undoStack: [],
    redoStack: [],
    setCurrentSlide: (s) => set({ currentSlide: s }),
    setLiveSlide: (s) => set({ liveSlide: s }),
    pushSlideUndo: (s) => set((state) => ({ undoStack: [...state.undoStack.slice(-20), s], redoStack: [] })),
    undo: () => {
        const { undoStack, currentSlide } = get();
        if (undoStack.length === 0)
            return;
        const prev = undoStack[undoStack.length - 1];
        set({ undoStack: undoStack.slice(0, -1), redoStack: [...get().redoStack, currentSlide], currentSlide: prev });
    },
    redo: () => {
        const { redoStack, currentSlide } = get();
        if (redoStack.length === 0)
            return;
        const next = redoStack[redoStack.length - 1];
        set({ redoStack: redoStack.slice(0, -1), undoStack: [...get().undoStack, currentSlide], currentSlide: next });
    },
    addSong: () => {
        const id = Math.max(0, ...get().songs.map(s => s.id)) + 1;
        const newSong = { id, title: 'New Song ' + id, sections: [{ id: 1, type: 'Verse', text: '[C]Verse text' }] };
        set((state) => ({ songs: [...state.songs, newSong], currentSlide: newSong.title }));
        // Persist to DB
        try {
            if (typeof window !== 'undefined' && window.worship?.db?.run) {
                window.worship.db.run('INSERT INTO songs (id, title) VALUES (?, ?)', [newSong.id, newSong.title]);
                newSong.sections.forEach(section => {
                    ;
                    window.worship.db.run('INSERT INTO song_sections (song_id, type, content, order_num) VALUES (?, ?, ?, ?)', [newSong.id, section.type, section.text, section.id]);
                });
            }
        }
        catch (err) {
            console.error('Failed to persist new song:', err);
        }
    },
    updateSongSection: (songId, sectionId, patch) => {
        set((state) => ({
            songs: state.songs.map((song) => (song.id !== songId
                ? song
                : {
                    ...song,
                    sections: song.sections.map((section) => (section.id !== sectionId ? section : { ...section, ...patch }))
                }))
        }));
        // Persist to DB
        try {
            if (typeof window !== 'undefined' && window.worship?.db?.run) {
                if (patch.type) {
                    ;
                    window.worship.db.run('UPDATE song_sections SET type = ? WHERE id = ? AND song_id = ?', [patch.type, sectionId, songId]);
                }
                if (patch.text !== undefined) {
                    ;
                    window.worship.db.run('UPDATE song_sections SET content = ? WHERE id = ? AND song_id = ?', [patch.text, sectionId, songId]);
                }
            }
        }
        catch (err) {
            console.error('Failed to persist section update:', err);
        }
    },
    addSongSection: (songId) => {
        set((state) => ({
            songs: state.songs.map((song) => {
                if (song.id !== songId)
                    return song;
                const nextId = Math.max(0, ...song.sections.map((section) => section.id)) + 1;
                return {
                    ...song,
                    sections: [...song.sections, { id: nextId, type: 'Verse', text: '' }]
                };
            })
        }));
        // Persist to DB
        try {
            if (typeof window !== 'undefined' && window.worship?.db?.run) {
                const song = get().songs.find(s => s.id === songId);
                if (song) {
                    const newSection = song.sections[song.sections.length - 1];
                    window.worship.db.run('INSERT INTO song_sections (song_id, type, content, order_num) VALUES (?, ?, ?, ?)', [songId, newSection.type, newSection.text, newSection.id]);
                }
            }
        }
        catch (err) {
            console.error('Failed to persist new section:', err);
        }
    },
    moveSongSection: (songId, from, to) => {
        set((state) => ({
            songs: state.songs.map((song) => {
                if (song.id !== songId)
                    return song;
                const sections = song.sections.slice();
                const [item] = sections.splice(from, 1);
                sections.splice(to, 0, item);
                return { ...song, sections };
            })
        }));
    },
    looks: {},
    setLook: (outId, look) => set((state) => ({ looks: { ...state.looks, [outId]: look } })),
    outputConfigs: (() => {
        try {
            if (typeof window !== 'undefined') {
                const raw = window.localStorage.getItem('worship-output-configs');
                if (raw)
                    return JSON.parse(raw);
            }
        }
        catch {
            // ignore parse and fallback
        }
        return [
            { id: 1, role: 'primary', resolution: '1920x1080', active: true },
            { id: 2, role: 'extended', resolution: '1920x1080', active: true },
            { id: 3, role: 'stage', resolution: '1280x720', active: false },
        ];
    })(),
    updateOutputConfig: (id, patch) => set((state) => ({
        outputConfigs: (() => {
            const next = state.outputConfigs.map((item) => (item.id === id ? { ...item, ...patch } : item));
            try {
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem('worship-output-configs', JSON.stringify(next));
                }
            }
            catch {
                // ignore localStorage write issues
            }
            return next;
        })()
    })),
    addScheduleItem: async () => {
        set((state) => ({ schedule: [...state.schedule, { id: state.schedule.length + 1, type: 'Song', content: 'New Item' }] }));
        // Persist to DB skeleton: create a schedule and log an item if DB is available
        try {
            if (typeof window !== 'undefined' && window.worship?.db?.run) {
                const res = await window.worship.db.run('INSERT INTO schedules (name, service_time) VALUES (?, ?)', ['Service', new Date().toISOString()]);
                const schedId = res?.lastInsertRowid;
                if (schedId) {
                    await window.worship.db.run('INSERT INTO schedule_items (schedule_id, item_type, content, order_num) VALUES (?, ?, ?, ?)', [schedId, 'Song', 'New Item', 1]);
                }
            }
        }
        catch {
            // ignore failures in MVP phase
        }
    },
    moveSchedule: (from, to) => {
        const s = get().schedule.slice();
        const [item] = s.splice(from, 1);
        s.splice(to, 0, item);
        set({ schedule: s });
    },
    setTheme: (t) => set({ theme: t }),
    applyPreset: (preset) => set({ theme: { ...preset, opacity: preset.opacity ?? 100, blur: preset.blur ?? 0, gradient: preset.gradient ?? '' } }),
    saveTemplate: (name) => {
        const theme = get().theme;
        try {
            if (typeof window !== 'undefined' && window.worship?.db?.run) {
                ;
                window.worship.db.run('INSERT INTO themes (name, background, text_style, backgroundImage, text_color, font_size) VALUES (?, ?, ?, ?, ?, ?)', [name, theme.bg, 'bold', theme.backgroundImage || '', theme.color, theme.fontSize]);
            }
        }
        catch (err) {
            console.error('Failed to save template:', err);
        }
    },
}));
