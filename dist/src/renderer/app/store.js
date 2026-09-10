"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStore = exports.THEME_PRESETS = void 0;
const zustand_1 = require("zustand");
const db_1 = require("./services/db");
// Theme presets
exports.THEME_PRESETS = [
    { name: 'Light Classic', bg: '#ffffff', color: '#000000', fontSize: 48 },
    { name: 'Dark Modern', bg: '#1a1a2e', color: '#eaeaea', fontSize: 42 },
    { name: 'Blue Ocean', bg: '#0f4c75', color: '#ffffff', fontSize: 44 },
    { name: 'Sunset Warm', bg: '#2d132c', color: '#ffd700', fontSize: 42 },
    { name: 'Forest Green', bg: '#1b4332', color: '#d8f3dc', fontSize: 44 },
    { name: 'Green Screen', bg: '#00ff00', color: '#101010', fontSize: 44 },
    { name: 'Royal Purple', bg: '#3c096c', color: '#e0aaff', fontSize: 42 },
    { name: 'Minimal Black', bg: '#000000', color: '#ffffff', fontSize: 48 },
    { name: 'Soft Gray', bg: '#2d2d2d', color: '#f0f0f0', fontSize: 42 },
];
exports.useStore = (0, zustand_1.create)((set, get) => ({
    songs: [],
    schedule: [],
    theme: { bg: '#1a1a1a', color: '#ffffff', backgroundImage: '', fontSize: 42, opacity: 100, blur: 0, gradient: '', fontFamily: 'Manrope', fontWeight: 700, textAlign: 'center', verticalAlign: 'center', textBoxWidth: 90, textBoxHeight: 70 },
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
    addSong: async () => {
        try {
            const tempId = Math.max(0, ...get().songs.map(s => s.id)) + 1;
            const title = 'New Song ' + tempId;
            const newSong = await db_1.dbService.songs.create(title);
            set((state) => ({ songs: [...state.songs, newSong], currentSlide: newSong.title }));
            return newSong.id;
        }
        catch (err) {
            console.error('Failed to persist new song:', err);
            return undefined;
        }
    },
    deleteSong: async (id) => {
        try {
            await db_1.dbService.songs.delete(id);
            set((state) => {
                const nextSongs = state.songs.filter((song) => song.id !== id);
                return {
                    songs: nextSongs,
                    currentSlide: nextSongs[0]?.title || 'Welcome'
                };
            });
        }
        catch (err) {
            console.error('Failed to delete song:', err);
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
        db_1.dbService.songs.updateSection(songId, sectionId, patch).catch(err => {
            console.error('Failed to persist section update:', err);
        });
    },
    updateSongTitle: (songId, title) => {
        const nextTitle = title.trim();
        set((state) => ({
            songs: state.songs.map((song) => (song.id === songId ? { ...song, title: nextTitle || '' } : song))
        }));
        db_1.dbService.songs.updateTitle(songId, nextTitle).catch(err => {
            console.error('Failed to persist song title update:', err);
        });
    },
    addSongSection: async (songId) => {
        try {
            const newSection = await db_1.dbService.songs.addSection(songId, 'Verse', '');
            set((state) => ({
                songs: state.songs.map((song) => {
                    if (song.id !== songId)
                        return song;
                    return {
                        ...song,
                        sections: [...song.sections, newSection]
                    };
                })
            }));
        }
        catch (err) {
            console.error('Failed to persist new section:', err);
        }
    },
    deleteSongSection: async (songId, sectionId) => {
        try {
            await db_1.dbService.songs.deleteSection(songId, sectionId);
            set((state) => ({
                songs: state.songs.map((song) => {
                    if (song.id !== songId)
                        return song;
                    return {
                        ...song,
                        sections: song.sections.filter((sec) => sec.id !== sectionId)
                    };
                })
            }));
        }
        catch (err) {
            console.error('Failed to delete song section:', err);
        }
    },
    moveSongSection: (songId, from, to) => {
        set((state) => {
            const targetSong = state.songs.find((s) => s.id === songId);
            if (!targetSong)
                return {};
            const sections = targetSong.sections.slice();
            const [item] = sections.splice(from, 1);
            sections.splice(to, 0, item);
            const sectionIds = sections.map((s) => s.id);
            db_1.dbService.songs.moveSections(songId, sectionIds).catch((err) => {
                console.error('Failed to persist section order:', err);
            });
            return {
                songs: state.songs.map((song) => (song.id === songId ? { ...song, sections } : song))
            };
        });
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
    displays: [],
    setDisplays: (displays) => set({ displays }),
    addScheduleItem: async () => {
        try {
            const newItem = await db_1.dbService.schedule.addItem('Song', 'New Item');
            set((state) => ({ schedule: [...state.schedule, newItem] }));
        }
        catch (err) {
            console.error('Failed to add schedule item:', err);
        }
    },
    moveSchedule: (from, to) => {
        const s = get().schedule.slice();
        const [item] = s.splice(from, 1);
        s.splice(to, 0, item);
        set({ schedule: s });
        const itemIds = s.map((item) => item.id);
        db_1.dbService.schedule.moveItems(itemIds).catch((err) => {
            console.error('Failed to persist schedule item order:', err);
        });
    },
    setTheme: (t) => set({ theme: t }),
    applyPreset: (preset) => set({ theme: { ...preset, opacity: preset.opacity ?? 100, blur: preset.blur ?? 0, gradient: preset.gradient ?? '', textAlign: preset.textAlign ?? 'center', verticalAlign: preset.verticalAlign ?? 'center', textBoxWidth: preset.textBoxWidth ?? 90, textBoxHeight: preset.textBoxHeight ?? 70 } }),
    saveTemplate: (name) => {
        const theme = get().theme;
        db_1.dbService.themes.create(name, theme).catch(err => {
            console.error('Failed to save template:', err);
        });
    },
}));
