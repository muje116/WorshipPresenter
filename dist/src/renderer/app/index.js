"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const client_1 = require("react-dom/client");
const store_1 = require("./store");
const OutputView_1 = require("./components/OutputView");
const BiblePicker_1 = require("./components/BiblePicker");
const MediaLibrary_1 = require("./components/MediaLibrary");
require("./styles.css");
const OUTPUT_IDS = [1, 2];
const LAYERS = ['background', 'media', 'slide_content', 'props_overlays', 'announcements', 'lower_thirds', 'live_video', 'alerts'];
const SECTION_TYPES = ['Intro', 'Verse', 'Chorus', 'Bridge', 'Pre-Chorus', 'Post-Chorus', 'Tag', 'Outro', 'Interlude', 'Instrumental'];
const NOTE_INDEX = {
    C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
    'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
};
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const getOutId = () => {
    try {
        const q = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        const value = q.get('out');
        return value ? Number(value) : 0;
    }
    catch {
        return 0;
    }
};
const stripChordMarkup = (text) => text.replace(/\[([^\]]+)\]/g, '').replace(/\s+/g, ' ').trim();
const transposeChord = (chord, steps) => {
    const match = chord.match(/^([A-G])([#b]?)(.*)$/);
    if (!match)
        return chord;
    const [, root, accidental, suffix] = match;
    const normalized = `${root}${accidental || ''}`;
    const startIndex = NOTE_INDEX[normalized];
    if (startIndex == null)
        return chord;
    const nextIndex = (startIndex + steps + 12) % 12;
    return `${NOTE_NAMES[nextIndex]}${suffix || ''}`;
};
const transposeChordMarkup = (text, steps) => {
    if (!steps)
        return text;
    return text.replace(/\[([^\]]+)\]/g, (_match, chord) => `[${transposeChord(chord, steps)}]`);
};
const App = () => {
    const outId = getOutId();
    const isOutput = outId > 0;
    const songs = (0, store_1.useStore)((state) => state.songs);
    const schedule = (0, store_1.useStore)((state) => state.schedule);
    const theme = (0, store_1.useStore)((state) => state.theme);
    const currentSlide = (0, store_1.useStore)((state) => state.currentSlide);
    const liveSlide = (0, store_1.useStore)((state) => state.liveSlide);
    const looks = (0, store_1.useStore)((state) => state.looks);
    const addSong = (0, store_1.useStore)((state) => state.addSong);
    const updateSongSection = (0, store_1.useStore)((state) => state.updateSongSection);
    const addSongSection = (0, store_1.useStore)((state) => state.addSongSection);
    const setCurrentSlide = (0, store_1.useStore)((state) => state.setCurrentSlide);
    const setLiveSlide = (0, store_1.useStore)((state) => state.setLiveSlide);
    const addScheduleItem = (0, store_1.useStore)((state) => state.addScheduleItem);
    const moveSchedule = (0, store_1.useStore)((state) => state.moveSchedule);
    const setTheme = (0, store_1.useStore)((state) => state.setTheme);
    const applyPreset = (0, store_1.useStore)((state) => state.applyPreset);
    const setLook = (0, store_1.useStore)((state) => state.setLook);
    const [dragIndex, setDragIndex] = react_1.default.useState(null);
    const [selectedSongId, setSelectedSongId] = react_1.default.useState(songs[0]?.id ?? 0);
    const [showChords, setShowChords] = react_1.default.useState(true);
    const [transposeSteps, setTransposeSteps] = react_1.default.useState(0);
    const [ndiEnabled, setNdiEnabled] = react_1.default.useState(false);
    const [outputStates, setOutputStates] = react_1.default.useState({});
    const [activeTab, setActiveTab] = react_1.default.useState('songs');
    const [selectedSectionId, setSelectedSectionId] = react_1.default.useState(null);
    const [selectedMedia, setSelectedMedia] = react_1.default.useState(null);
    const [songSearchQuery, setSongSearchQuery] = react_1.default.useState('');
    react_1.default.useEffect(() => {
        if (isOutput)
            return;
        if (!songs.find((song) => song.id === selectedSongId) && songs[0]) {
            setSelectedSongId(songs[0].id);
        }
    }, [isOutput, selectedSongId, songs]);
    react_1.default.useEffect(() => {
        if (isOutput)
            return;
        if (!window?.worship?.outputs?.onOutputState)
            return;
        window.worship.outputs.onOutputState((payload) => {
            if (!payload?.outputId)
                return;
            setOutputStates((prev) => ({ ...prev, [payload.outputId]: payload.state || {} }));
        });
    }, [isOutput]);
    react_1.default.useEffect(() => {
        if (isOutput)
            return;
        window?.worship?.ndi?.status?.().then((status) => {
            setNdiEnabled(Boolean(status?.enabled));
        }).catch(() => {
            setNdiEnabled(false);
        });
    }, [isOutput]);
    // Load songs and schedule from database on mount
    react_1.default.useEffect(() => {
        if (isOutput)
            return;
        const loadData = async () => {
            try {
                // Load songs from database
                const songsData = await window.worship.db.run('SELECT * FROM songs ORDER BY title');
                if (songsData && songsData.length > 0) {
                    const songsWithSections = await Promise.all(songsData.map(async (song) => {
                        const sectionsData = await window.worship.db.run('SELECT * FROM song_sections WHERE song_id = ? ORDER BY order_num', [song.id]);
                        return {
                            ...song,
                            sections: sectionsData?.map((s) => ({
                                id: s.id,
                                type: s.type,
                                text: s.content
                            })) || []
                        };
                    }));
                    // Update store with loaded songs
                    store_1.useStore.setState({ songs: songsWithSections });
                    if (songsWithSections.length > 0) {
                        setSelectedSongId(songsWithSections[0].id);
                    }
                }
                // Load schedule from database
                const scheduleData = await window.worship.db.run('SELECT * FROM schedule_items ORDER BY order_num');
                if (scheduleData && scheduleData.length > 0) {
                    store_1.useStore.setState({
                        schedule: scheduleData.map((item) => ({
                            id: item.id,
                            type: item.item_type,
                            content: item.content
                        }))
                    });
                }
            }
            catch (error) {
                console.error('Failed to load data from database:', error);
            }
        };
        loadData();
    }, [isOutput]);
    // Keyboard shortcuts
    react_1.default.useEffect(() => {
        if (isOutput)
            return;
        const handleKeyDown = (e) => {
            // Enter key sends selected section to live
            if (e.key === 'Enter' && selectedSectionId !== null && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                goLive();
            }
            // Space bar also sends to live (common in presentation software)
            if (e.key === ' ' && selectedSectionId !== null && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                goLive();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOutput, selectedSectionId, currentSlide]);
    if (isOutput) {
        return (0, jsx_runtime_1.jsx)(OutputView_1.OutputView, { outId: outId });
    }
    const selectedSong = songs.find((song) => song.id === selectedSongId) || songs[0];
    const sendLiveState = (slideTitle) => {
        OUTPUT_IDS.forEach((id) => {
            window?.worship?.outputs?.setState?.(id, {
                slideTitle,
                theme
            });
        });
    };
    const goLive = () => {
        setLiveSlide(currentSlide);
        sendLiveState(currentSlide);
    };
    const onBlack = () => {
        window?.worship?.outputs?.actions?.black?.();
    };
    const onLogo = () => {
        window?.worship?.outputs?.actions?.logo?.();
    };
    const onClear = () => {
        window?.worship?.outputs?.actions?.clear?.();
        sendLiveState(liveSlide);
    };
    const handleSectionDoubleClick = (sectionText, sectionId) => {
        setCurrentSlide(sectionText);
        setLiveSlide(sectionText);
        setSelectedSectionId(sectionId);
        sendLiveState(sectionText);
    };
    const handleSectionClick = (sectionText, sectionId) => {
        setCurrentSlide(sectionText);
        setSelectedSectionId(sectionId);
    };
    const toggleNdi = async () => {
        const status = await window?.worship?.ndi?.enable?.(!ndiEnabled);
        setNdiEnabled(Boolean(status?.enabled));
    };
    const updateLook = (targetOutId, patch) => {
        const currentLook = looks[targetOutId] || { background: '#111111', template: 'default', layers: ['slide_content'] };
        setLook(targetOutId, { ...currentLook, ...patch });
    };
    const renderLookControls = (targetOutId) => {
        const look = looks[targetOutId] || {
            background: targetOutId === 1 ? '#1a1a1a' : '#111111',
            template: 'default',
            layers: ['slide_content', targetOutId === 1 ? 'lower_thirds' : 'announcements']
        };
        return ((0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-slate-800/50 rounded-xl border border-slate-700", children: [(0, jsx_runtime_1.jsxs)("strong", { className: "text-sm text-slate-200", children: ["Output ", targetOutId] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-3 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs text-slate-400", children: "Background" }), (0, jsx_runtime_1.jsx)("input", { type: "color", value: look.background, onChange: (e) => updateLook(targetOutId, { background: e.target.value }), className: "w-8 h-8 rounded cursor-pointer" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs text-slate-400", children: "Template" }), (0, jsx_runtime_1.jsxs)("select", { value: look.template, onChange: (e) => updateLook(targetOutId, { template: e.target.value }), className: "mt-1 w-full bg-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-600", children: [(0, jsx_runtime_1.jsx)("option", { value: "default", children: "Default" }), (0, jsx_runtime_1.jsx)("option", { value: "lower-thirds", children: "Lower Thirds" }), (0, jsx_runtime_1.jsx)("option", { value: "full", children: "Full" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-3 grid grid-cols-2 gap-2", children: LAYERS.map((layer) => {
                        const activeLayers = look.layers || [];
                        const checked = activeLayers.includes(layer);
                        return ((0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2 text-xs text-slate-300", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: checked, onChange: () => updateLook(targetOutId, {
                                        layers: checked ? activeLayers.filter((item) => item !== layer) : [...activeLayers, layer]
                                    }), className: "rounded" }), layer] }, layer));
                    }) })] }, targetOutId));
    };
    const SidebarTab = ({ icon, label, active, onClick }) => ((0, jsx_runtime_1.jsxs)("button", { onClick: onClick, className: `flex items-center gap-3 w-full px-4 py-3 text-left transition-all duration-200 ${active
            ? 'bg-blue-600 text-white shadow-lg'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`, children: [(0, jsx_runtime_1.jsx)("span", { className: "text-lg", children: icon }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium text-sm", children: label })] }));
    const renderSongsTab = () => {
        // Filter songs based on search query
        const filteredSongs = songSearchQuery
            ? songs.filter(song => song.title.toLowerCase().includes(songSearchQuery.toLowerCase()) ||
                song.artist?.toLowerCase().includes(songSearchQuery.toLowerCase()))
            : songs;
        // Sort alphabetically by title
        const sortedSongs = [...filteredSongs].sort((a, b) => a.title.localeCompare(b.title));
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col h-full", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-3 border-b border-slate-700 space-y-2", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: addSong, className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { children: "+" }), " Add New Song"] }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: songSearchQuery, onChange: (e) => setSongSearchQuery(e.target.value), placeholder: "Search songs...", className: "w-full bg-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-600" })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 overflow-y-auto p-2", children: (0, jsx_runtime_1.jsx)("div", { className: "space-y-1", children: sortedSongs.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "text-center py-8 text-slate-500 text-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl mb-2", children: "\uD83C\uDFB5" }), (0, jsx_runtime_1.jsx)("div", { children: "No songs found" })] })) : (sortedSongs.map((song) => ((0, jsx_runtime_1.jsxs)("button", { onClick: () => {
                                setSelectedSongId(song.id);
                                setCurrentSlide(song.title);
                                setActiveTab('songs');
                            }, className: `w-full text-left px-4 py-3 rounded-lg transition-all ${song.id === selectedSongId
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "font-medium text-sm", children: song.title }), song.artist && ((0, jsx_runtime_1.jsx)("div", { className: "text-xs opacity-70 mt-1", children: song.artist })), (0, jsx_runtime_1.jsxs)("div", { className: "text-xs opacity-60 mt-1", children: [song.sections.length, " sections"] })] }, song.id)))) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "p-2 border-t border-slate-700 text-xs text-slate-500 text-center", children: [filteredSongs.length, " song", filteredSongs.length !== 1 ? 's' : ''] })] }));
    };
    const renderBiblesTab = () => ((0, jsx_runtime_1.jsx)(BiblePicker_1.BiblePicker, {}));
    const renderImagesTab = () => ((0, jsx_runtime_1.jsx)(MediaLibrary_1.MediaLibrary, { mediaType: "image", onMediaSelect: setSelectedMedia }));
    const renderVideosTab = () => ((0, jsx_runtime_1.jsx)(MediaLibrary_1.MediaLibrary, { mediaType: "video", onMediaSelect: setSelectedMedia }));
    const renderSettingsTab = () => ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col h-full overflow-y-auto", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-4 border-b border-slate-700", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-slate-200 font-semibold mb-3 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-lg", children: "\u26EA" }), " Church Information"] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-slate-400 text-sm block mb-1", children: "Church Name" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Enter church name", className: "w-full bg-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-600" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-slate-400 text-sm block mb-1", children: "Church Logo" }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-2", children: (0, jsx_runtime_1.jsx)("button", { onClick: async () => {
                                                const filePaths = await window.worship.dialog.openFiles({
                                                    title: 'Select Church Logo',
                                                    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg'] }]
                                                });
                                                if (filePaths.length > 0) {
                                                    alert('Logo selected: ' + filePaths[0]);
                                                    // Would store in settings
                                                }
                                            }, className: "flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm py-2 px-3 rounded-lg transition-colors", children: "\uD83D\uDCC1 Choose Logo" }) })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4 border-b border-slate-700", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-slate-200 font-semibold mb-3 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-lg", children: "\uD83C\uDFA8" }), " Theme Presets"] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 gap-2 mb-4", children: store_1.THEME_PRESETS.map((preset) => ((0, jsx_runtime_1.jsxs)("button", { onClick: () => applyPreset(preset), className: `p-3 rounded-lg border-2 transition-all text-left ${theme.bg === preset.bg && theme.color === preset.color
                                ? 'border-blue-500 shadow-lg ring-2 ring-blue-500/30'
                                : 'border-slate-700 hover:border-slate-500'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-6 h-6 rounded border border-slate-600", style: { backgroundColor: preset.bg } }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs font-medium text-slate-300", children: preset.name })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-xs px-2 py-1 rounded", style: { backgroundColor: preset.bg, color: preset.color }, children: ["Aa ", preset.fontSize, "px"] })] }, preset.name))) }), (0, jsx_runtime_1.jsxs)("h3", { className: "text-slate-200 font-semibold mb-3 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-lg" }), " Custom Theme"] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-slate-400 text-sm block mb-1", children: "Background Color" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "color", value: theme.bg, onChange: (e) => setTheme({ ...theme, bg: e.target.value }), className: "w-10 h-10 rounded cursor-pointer border border-slate-600" }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-slate-300", children: theme.bg })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-slate-400 text-sm block mb-1", children: "Text Color" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "color", value: theme.color, onChange: (e) => setTheme({ ...theme, color: e.target.value }), className: "w-10 h-10 rounded cursor-pointer border border-slate-600" }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-slate-300", children: theme.color })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: "text-slate-400 text-sm block mb-1", children: ["Font Size: ", theme.fontSize, "px"] }), (0, jsx_runtime_1.jsx)("input", { type: "range", min: 24, max: 96, value: theme.fontSize, onChange: (e) => setTheme({ ...theme, fontSize: Number(e.target.value) }), className: "w-full accent-blue-600" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between text-xs text-slate-500 mt-1", children: [(0, jsx_runtime_1.jsx)("span", { children: "24px" }), (0, jsx_runtime_1.jsx)("span", { children: "96px" })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-slate-400 text-sm block mb-1", children: "Background Image URL" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: theme.backgroundImage || '', placeholder: "https://example.com/image.jpg or file://path", onChange: (e) => setTheme({ ...theme, backgroundImage: e.target.value }), className: "w-full bg-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-600" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4 border-b border-slate-700", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-slate-200 font-semibold mb-3 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-lg", children: "\uD83D\uDDA5\uFE0F" }), " Display Settings"] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-3 bg-slate-800/50 rounded-lg", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-slate-200 text-sm font-medium", children: "Fullscreen Output Windows" }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-slate-400", children: "Open output windows in fullscreen mode" })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                            // Request fullscreen via IPC
                                            window.worship.outputs.actions.fullscreen?.();
                                        }, className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors", children: "Open Fullscreen" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-3 bg-slate-800/50 rounded-lg", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-slate-200 text-sm font-medium", children: "Aspect Ratio Preview" }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-slate-400", children: "Simulate 4:3 output on 16:9 screen" })] }), (0, jsx_runtime_1.jsxs)("select", { className: "bg-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-600", children: [(0, jsx_runtime_1.jsx)("option", { value: "16:9", children: "16:9 (Widescreen)" }), (0, jsx_runtime_1.jsx)("option", { value: "4:3", children: "4:3 (Standard)" }), (0, jsx_runtime_1.jsx)("option", { value: "21:9", children: "21:9 (Ultrawide)" })] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4 border-b border-slate-700", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-slate-200 font-semibold mb-3 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-lg", children: "\uD83D\uDCE1" }), " NDI & Streaming"] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-3 bg-slate-800/50 rounded-lg", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-slate-200 text-sm font-medium", children: "NDI Output" }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-slate-400", children: ndiEnabled ? 'NDI output active' : 'NDI output disabled' })] }), (0, jsx_runtime_1.jsx)("button", { onClick: toggleNdi, className: `px-4 py-2 text-white text-sm rounded-lg transition-colors ${ndiEnabled
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-green-600 hover:bg-green-700'}`, children: ndiEnabled ? 'Disable' : 'Enable' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-slate-800/50 rounded-lg", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-slate-200 text-sm font-medium mb-2", children: "OBS Integration" }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-slate-400 mb-3", children: "Connect to OBS via WebSocket for scene control" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "ws://localhost:4455", className: "flex-1 bg-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-600" }), (0, jsx_runtime_1.jsx)("button", { className: "px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 text-sm rounded-lg transition-colors", children: "Connect" })] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-slate-200 font-semibold mb-3 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-lg", children: "\uD83D\uDCFA" }), " Output Configuration"] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: OUTPUT_IDS.map(renderLookControls) })] })] }));
    const renderEditor = () => {
        if (activeTab !== 'songs' || !selectedSong)
            return null;
        // Section type colors for visual distinction (ProPresenter style)
        const sectionTypeColors = {
            'Verse': 'bg-blue-600',
            'Chorus': 'bg-pink-600',
            'Bridge': 'bg-purple-600',
            'Pre-Chorus': 'bg-amber-600',
            'Tag': 'bg-red-600',
            'Intro': 'bg-emerald-600',
            'Outro': 'bg-cyan-600'
        };
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col h-full", children: [(0, jsx_runtime_1.jsx)("div", { className: "p-4 border-b border-slate-700 bg-slate-800/50", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold text-white", children: selectedSong.title }), selectedSong.artist && ((0, jsx_runtime_1.jsx)("div", { className: "text-sm text-slate-400 mt-1", children: selectedSong.artist }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setShowChords(!showChords), className: `px-3 py-1.5 text-sm rounded-lg transition-colors ${showChords
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`, children: showChords ? '♫ Chords On' : '♫ Chords Off' }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 bg-slate-700 rounded-lg p-1", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setTransposeSteps((v) => v - 1), className: "px-3 py-1.5 hover:bg-slate-600 text-slate-200 text-sm rounded transition-colors", children: "\u266D" }), (0, jsx_runtime_1.jsx)("span", { className: "px-2 text-xs text-slate-400 min-w-[60px] text-center", children: transposeSteps === 0 ? 'Original' : `${transposeSteps > 0 ? '+' : ''}${transposeSteps}` }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setTransposeSteps((v) => v + 1), className: "px-3 py-1.5 hover:bg-slate-600 text-slate-200 text-sm rounded transition-colors", children: "\u266F" })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setTransposeSteps(0), className: "px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors", children: "Reset" })] })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 overflow-y-auto p-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3", children: selectedSong.sections.map((section, index) => {
                                const transposed = transposeChordMarkup(section.text, transposeSteps);
                                const renderedText = showChords ? transposed : stripChordMarkup(transposed);
                                const isSelected = selectedSectionId === section.id;
                                const sectionColor = sectionTypeColors[section.type] || 'bg-slate-600';
                                return ((0, jsx_runtime_1.jsxs)("div", { onClick: () => {
                                        setCurrentSlide(renderedText);
                                        setSelectedSectionId(section.id);
                                    }, onDoubleClick: () => {
                                        setCurrentSlide(renderedText);
                                        setLiveSlide(renderedText);
                                        setSelectedSectionId(section.id);
                                        sendLiveState(renderedText);
                                    }, className: `relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer group ${isSelected
                                        ? 'border-blue-500 shadow-lg ring-2 ring-blue-500/50'
                                        : 'border-slate-700 hover:border-slate-500 hover:shadow-md'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: `${sectionColor} px-3 py-2 flex items-center justify-between`, children: [(0, jsx_runtime_1.jsx)("span", { className: "text-white text-xs font-semibold uppercase tracking-wide", children: section.type }), (0, jsx_runtime_1.jsx)("span", { className: "text-white/70 text-xs", children: index + 1 })] }), (0, jsx_runtime_1.jsx)("div", { className: "p-3 bg-slate-800/80 min-h-[80px]", children: (0, jsx_runtime_1.jsx)("div", { className: "text-slate-300 text-xs whitespace-pre-wrap line-clamp-4", children: renderedText || 'Empty section' }) }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity", children: (0, jsx_runtime_1.jsx)("div", { className: "bg-red-600 text-white text-xs px-2 py-1 rounded font-medium", children: "Double-click \u2192 Live" }) }), isSelected && ((0, jsx_runtime_1.jsx)("div", { className: "absolute top-2 right-2", children: (0, jsx_runtime_1.jsx)("div", { className: "bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded", children: "Preview" }) }))] }, section.id));
                            }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => addSongSection(selectedSong.id), className: "mt-4 w-full py-3 bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-600 hover:border-slate-500 text-slate-400 hover:text-slate-300 rounded-lg transition-colors font-medium", children: "+ Add New Section" })] })] }));
    };
    const renderSchedule = () => ((0, jsx_runtime_1.jsxs)("div", { className: "p-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-slate-200 font-semibold mb-4", children: "Schedule" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: schedule.map((item, index) => ((0, jsx_runtime_1.jsx)("div", { draggable: true, onDragStart: () => setDragIndex(index), onDragOver: (event) => event.preventDefault(), onDrop: () => {
                        if (dragIndex != null && dragIndex !== index) {
                            moveSchedule(dragIndex, index);
                        }
                        setDragIndex(null);
                    }, onClick: () => setCurrentSlide(item.content), className: "p-3 bg-slate-800/50 border border-slate-700 rounded-lg cursor-grab hover:bg-slate-700/50 transition-colors", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-slate-500 text-sm w-6", children: [index + 1, "."] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-slate-300 flex-1", children: [item.type, " - ", item.content] })] }) }, item.id))) }), (0, jsx_runtime_1.jsx)("button", { onClick: addScheduleItem, className: "mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors", children: "+ Add Item" })] }));
    const previewStyle = {
        padding: 24,
        minHeight: 200,
        borderRadius: 12,
        backgroundColor: theme.bg,
        backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: theme.color,
        fontSize: theme.fontSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontWeight: 'bold'
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden", children: [(0, jsx_runtime_1.jsxs)("div", { className: "w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800/50 flex flex-col shadow-2xl", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-4 border-b border-slate-800/50 bg-gradient-to-r from-blue-900/20 to-purple-900/20", children: [(0, jsx_runtime_1.jsxs)("h1", { className: "text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-3xl", children: "\u271D\uFE0F" }), " WorshipOS"] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500 mt-1", children: "v0.2.0 Professional" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 overflow-y-auto py-2 space-y-1", children: [(0, jsx_runtime_1.jsx)(SidebarTab, { icon: "\uD83C\uDFB5", label: "Songs", active: activeTab === 'songs', onClick: () => setActiveTab('songs') }), (0, jsx_runtime_1.jsx)(SidebarTab, { icon: "\uD83D\uDCD6", label: "Bibles", active: activeTab === 'bibles', onClick: () => setActiveTab('bibles') }), (0, jsx_runtime_1.jsx)(SidebarTab, { icon: "\uD83D\uDDBC\uFE0F", label: "Images", active: activeTab === 'images', onClick: () => setActiveTab('images') }), (0, jsx_runtime_1.jsx)(SidebarTab, { icon: "\uD83C\uDFAC", label: "Videos", active: activeTab === 'videos', onClick: () => setActiveTab('videos') }), (0, jsx_runtime_1.jsx)(SidebarTab, { icon: "\u2699\uFE0F", label: "Settings", active: activeTab === 'settings', onClick: () => setActiveTab('settings') })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4 border-t border-slate-800/50 bg-slate-900/50 space-y-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide", children: "Quick Actions" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: onBlack, className: "py-2.5 bg-gradient-to-b from-slate-800 to-black hover:from-slate-700 hover:to-slate-900 text-white rounded-lg transition-all font-medium text-sm shadow-lg border border-slate-700 hover:border-slate-600 hover:shadow-xl", children: "\u2B1B BLACK" }), (0, jsx_runtime_1.jsx)("button", { onClick: onLogo, className: "py-2.5 bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-200 rounded-lg transition-all font-medium text-sm shadow-lg border border-slate-600 hover:border-slate-500 hover:shadow-xl", children: "\uD83C\uDFE0 LOGO" }), (0, jsx_runtime_1.jsx)("button", { onClick: onClear, className: "py-2.5 bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-200 rounded-lg transition-all font-medium text-sm shadow-lg border border-slate-600 hover:border-slate-500 hover:shadow-xl", children: "\u2715 CLEAR" }), (0, jsx_runtime_1.jsx)("button", { onClick: goLive, className: "py-2.5 bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg transition-all font-medium text-sm shadow-lg border border-red-500 hover:border-red-400 hover:shadow-xl hover:shadow-red-500/20", children: "\u25B6 LIVE" })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-slate-600 text-center pt-1", children: "Enter/Space to go live" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "w-72 bg-slate-900 border-r border-slate-800 flex flex-col", children: [activeTab === 'songs' && renderSongsTab(), activeTab === 'bibles' && renderBiblesTab(), activeTab === 'images' && renderImagesTab(), activeTab === 'videos' && renderVideosTab(), activeTab === 'settings' && renderSettingsTab()] }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 bg-slate-950 flex flex-col overflow-hidden", children: renderEditor() }), (0, jsx_runtime_1.jsx)("div", { className: "w-80 bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 overflow-y-auto p-4 space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-slate-800/50 rounded-xl p-4 border border-slate-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide", children: "Preview" }), (0, jsx_runtime_1.jsx)("div", { style: previewStyle, children: currentSlide })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-slate-800/50 rounded-xl p-4 border border-slate-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide", children: "Live Output" }), (0, jsx_runtime_1.jsx)("div", { style: previewStyle, children: liveSlide })] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-slate-800/50 rounded-xl p-4 border border-slate-700", children: renderSchedule() }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-slate-800/50 rounded-xl p-4 border border-slate-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide", children: "Output Previews" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: OUTPUT_IDS.map((id) => {
                                        const state = outputStates[id] || {};
                                        const label = state.mode === 'black' ? 'BLACK' : state.mode === 'logo' ? 'Church Logo' : (state.slideTitle || 'Idle');
                                        return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-xs text-slate-500 mb-2", children: ["Output ", id] }), (0, jsx_runtime_1.jsx)("div", { style: { ...previewStyle, minHeight: 100, fontSize: 14 }, children: label })] }, id));
                                    }) })] })] }) })] }));
};
const mountPoint = document.getElementById('root');
const root = mountPoint ? (0, client_1.createRoot)(mountPoint) : null;
if (root) {
    root.render((0, jsx_runtime_1.jsx)(App, {}));
}
