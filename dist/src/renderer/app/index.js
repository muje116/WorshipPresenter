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
const Notifications_1 = require("./components/Notifications");
const ui_1 = require("./components/ui");
require("./styles.css");
const OUTPUT_IDS = [1, 2];
const SECTION_TYPES = ['Intro', 'Verse', 'Chorus', 'Bridge', 'Pre-Chorus', 'Post-Chorus', 'Tag', 'Outro', 'Interlude', 'Instrumental'];
const LAYERS = ['background', 'media', 'slide_content', 'props_overlays', 'announcements', 'lower_thirds', 'live_video', 'alerts'];
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
    const startIndex = NOTE_INDEX[`${root}${accidental || ''}`];
    if (startIndex == null)
        return chord;
    return `${NOTE_NAMES[(startIndex + steps + 12) % 12]}${suffix || ''}`;
};
const transposeChordMarkup = (text, steps) => steps ? text.replace(/\[([^\]]+)\]/g, (_match, chord) => `[${transposeChord(chord, steps)}]`) : text;
const App = () => {
    const outId = getOutId();
    const isOutput = outId > 0;
    const songs = (0, store_1.useStore)((state) => state.songs);
    const schedule = (0, store_1.useStore)((state) => state.schedule);
    const theme = (0, store_1.useStore)((state) => state.theme);
    const currentSlide = (0, store_1.useStore)((state) => state.currentSlide);
    const liveSlide = (0, store_1.useStore)((state) => state.liveSlide);
    const undoStack = (0, store_1.useStore)((state) => state.undoStack);
    const redoStack = (0, store_1.useStore)((state) => state.redoStack);
    const looks = (0, store_1.useStore)((state) => state.looks);
    const addSong = (0, store_1.useStore)((state) => state.addSong);
    const addSongSection = (0, store_1.useStore)((state) => state.addSongSection);
    const moveSongSection = (0, store_1.useStore)((state) => state.moveSongSection);
    const updateSongSection = (0, store_1.useStore)((state) => state.updateSongSection);
    const setCurrentSlide = (0, store_1.useStore)((state) => state.setCurrentSlide);
    const setLiveSlide = (0, store_1.useStore)((state) => state.setLiveSlide);
    const pushSlideUndo = (0, store_1.useStore)((state) => state.pushSlideUndo);
    const undo = (0, store_1.useStore)((state) => state.undo);
    const redo = (0, store_1.useStore)((state) => state.redo);
    const addScheduleItem = (0, store_1.useStore)((state) => state.addScheduleItem);
    const moveSchedule = (0, store_1.useStore)((state) => state.moveSchedule);
    const setTheme = (0, store_1.useStore)((state) => state.setTheme);
    const applyPreset = (0, store_1.useStore)((state) => state.applyPreset);
    const saveTemplate = (0, store_1.useStore)((state) => state.saveTemplate);
    const setLook = (0, store_1.useStore)((state) => state.setLook);
    const outputConfigs = (0, store_1.useStore)((state) => state.outputConfigs);
    const updateOutputConfig = (0, store_1.useStore)((state) => state.updateOutputConfig);
    const [workspace, setWorkspace] = react_1.default.useState('console');
    const [clockValue, setClockValue] = react_1.default.useState(new Date());
    const [dragIndex, setDragIndex] = react_1.default.useState(null);
    const [selectedSongId, setSelectedSongId] = react_1.default.useState(songs[0]?.id ?? 0);
    const [selectedSectionId, setSelectedSectionId] = react_1.default.useState(null);
    const [showChords, setShowChords] = react_1.default.useState(true);
    const [transposeSteps, setTransposeSteps] = react_1.default.useState(0);
    const [songSearchQuery, setSongSearchQuery] = react_1.default.useState('');
    const [editorText, setEditorText] = react_1.default.useState('');
    const [editorType, setEditorType] = react_1.default.useState('Verse');
    const [ndiEnabled, setNdiEnabled] = react_1.default.useState(false);
    const [outputStates, setOutputStates] = react_1.default.useState({});
    const [mediaType, setMediaType] = react_1.default.useState('image');
    const [mediaAssets, setMediaAssets] = react_1.default.useState([]);
    const [mediaSearchQuery, setMediaSearchQuery] = react_1.default.useState('');
    const [mediaSort, setMediaSort] = react_1.default.useState('recent');
    const [mediaViewMode, setMediaViewMode] = react_1.default.useState('grid');
    const [selectedMediaId, setSelectedMediaId] = react_1.default.useState(null);
    const [isImportingMedia, setIsImportingMedia] = react_1.default.useState(false);
    const [bgManagerTab, setBgManagerTab] = react_1.default.useState('media');
    const [editorDragIndex, setEditorDragIndex] = react_1.default.useState(null);
    const [gradientStart, setGradientStart] = react_1.default.useState('#1a1a2e');
    const [gradientEnd, setGradientEnd] = react_1.default.useState('#0f4c75');
    const [bibleTranslations, setBibleTranslations] = react_1.default.useState([]);
    const [selectedTranslationCode, setSelectedTranslationCode] = react_1.default.useState('');
    const [bibleBooks, setBibleBooks] = react_1.default.useState([]);
    const [selectedBibleBook, setSelectedBibleBook] = react_1.default.useState('');
    const [bibleChapters, setBibleChapters] = react_1.default.useState([]);
    const [selectedBibleChapter, setSelectedBibleChapter] = react_1.default.useState(1);
    const [bibleVerses, setBibleVerses] = react_1.default.useState([]);
    const [bibleSearchQuery, setBibleSearchQuery] = react_1.default.useState('');
    const [bibleSearchResults, setBibleSearchResults] = react_1.default.useState([]);
    const [selectedVerse, setSelectedVerse] = react_1.default.useState(null);
    const [isBibleSearchRunning, setIsBibleSearchRunning] = react_1.default.useState(false);
    const [activeOutputId, setActiveOutputId] = react_1.default.useState(1);
    const [aspectRatio, setAspectRatio] = react_1.default.useState('16:9');
    const [overscanPercent, setOverscanPercent] = react_1.default.useState(5);
    const [outputResolution, setOutputResolution] = react_1.default.useState('1920x1080');
    const [outputHardware, setOutputHardware] = react_1.default.useState('Built-in Display');
    const [librarySort, setLibrarySort] = react_1.default.useState('name');
    const [libraryViewMode, setLibraryViewMode] = react_1.default.useState('grid');
    const [toasts, setToasts] = react_1.default.useState([]);
    const [paneSizes, setPaneSizes] = react_1.default.useState(() => {
        try {
            const raw = localStorage.getItem('operator-pane-sizes');
            if (!raw)
                return { consoleLeft: 320, consoleBottom: 210, editorLeft: 310, editorRight: 330 };
            const parsed = JSON.parse(raw);
            return {
                consoleLeft: Number(parsed.consoleLeft) || 320,
                consoleBottom: Number(parsed.consoleBottom) || 210,
                editorLeft: Number(parsed.editorLeft) || 310,
                editorRight: Number(parsed.editorRight) || 330,
            };
        }
        catch {
            return { consoleLeft: 320, consoleBottom: 210, editorLeft: 310, editorRight: 330 };
        }
    });
    const selectedSong = songs.find((song) => song.id === selectedSongId) || songs[0];
    const selectedSection = selectedSong?.sections.find((section) => section.id === selectedSectionId) || selectedSong?.sections[0];
    const filteredSongs = songs
        .filter((song) => !songSearchQuery || song.title.toLowerCase().includes(songSearchQuery.toLowerCase()) || song.artist?.toLowerCase().includes(songSearchQuery.toLowerCase()))
        .sort((a, b) => librarySort === 'name' ? a.title.localeCompare(b.title) : b.sections.length - a.sections.length);
    react_1.default.useEffect(() => {
        if (isOutput)
            return;
        const timer = setInterval(() => setClockValue(new Date()), 1000);
        return () => clearInterval(timer);
    }, [isOutput]);
    react_1.default.useEffect(() => {
        if (isOutput)
            return;
        if (!songs.find((song) => song.id === selectedSongId) && songs[0])
            setSelectedSongId(songs[0].id);
    }, [isOutput, selectedSongId, songs]);
    react_1.default.useEffect(() => {
        if (!selectedSection) {
            setEditorText('');
            return;
        }
        setEditorText(selectedSection.text || '');
        setEditorType(selectedSection.type || 'Verse');
    }, [selectedSection?.id, selectedSection?.text, selectedSection?.type]);
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
        window?.worship?.ndi?.status?.().then((status) => setNdiEnabled(Boolean(status?.enabled))).catch(() => setNdiEnabled(false));
    }, [isOutput]);
    react_1.default.useEffect(() => {
        if (isOutput)
            return;
        const loadData = async () => {
            try {
                const songsData = await window.worship.db.run('SELECT * FROM songs ORDER BY title');
                if (songsData?.length) {
                    const songsWithSections = await Promise.all(songsData.map(async (song) => {
                        const sectionsData = await window.worship.db.run('SELECT * FROM song_sections WHERE song_id = ? ORDER BY order_num', [song.id]);
                        return { ...song, sections: (sectionsData || []).map((s) => ({ id: s.id, type: s.type, text: s.content })) };
                    }));
                    store_1.useStore.setState({ songs: songsWithSections });
                    setSelectedSongId(songsWithSections[0]?.id || 0);
                }
                const scheduleData = await window.worship.db.run('SELECT * FROM schedule_items ORDER BY order_num');
                if (scheduleData?.length) {
                    store_1.useStore.setState({ schedule: scheduleData.map((item) => ({ id: item.id, type: item.item_type, content: item.content })) });
                }
            }
            catch (error) {
                console.error('Failed to load operator data:', error);
            }
        };
        loadData();
    }, [isOutput]);
    react_1.default.useEffect(() => {
        if (isOutput)
            return;
        const handleKeyDown = (event) => {
            if ((event.key === 'Enter' || event.key === ' ') && selectedSectionId !== null && !event.shiftKey && !event.ctrlKey && !event.altKey) {
                event.preventDefault();
                goLive();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOutput, selectedSectionId, currentSlide]);
    react_1.default.useEffect(() => {
        if (isOutput)
            return;
        localStorage.setItem('operator-pane-sizes', JSON.stringify(paneSizes));
    }, [isOutput, paneSizes]);
    if (isOutput)
        return (0, jsx_runtime_1.jsx)(OutputView_1.OutputView, { outId: outId });
    const sendLiveState = (slideTitle) => {
        OUTPUT_IDS.forEach((id) => window?.worship?.outputs?.setState?.(id, { slideTitle, theme }));
    };
    const notify = (title, detail, tone = 'info') => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((prev) => [...prev.slice(-3), { id, title, detail, tone }]);
        window.setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), 4200);
    };
    const goLive = () => {
        setLiveSlide(currentSlide);
        sendLiveState(currentSlide);
        notify('Live updated', 'Preview pushed to all outputs', 'success');
    };
    const onBlack = () => {
        window?.worship?.outputs?.actions?.black?.();
        notify('Black screen enabled', 'Outputs set to black', 'warn');
    };
    const onLogo = () => {
        window?.worship?.outputs?.actions?.logo?.();
        notify('Logo mode', 'Outputs switched to logo standby', 'info');
    };
    const onClear = () => {
        window?.worship?.outputs?.actions?.clear?.();
        sendLiveState(liveSlide);
        notify('Cleared output mode', 'Live slide restored', 'success');
    };
    const pickSection = (sectionId, live = false) => {
        if (!selectedSong)
            return;
        const section = selectedSong.sections.find((item) => item.id === sectionId);
        if (!section)
            return;
        setSelectedSectionId(section.id);
        const transposed = transposeChordMarkup(section.text, transposeSteps);
        const rendered = showChords ? transposed : stripChordMarkup(transposed);
        pushSlideUndo(currentSlide);
        setCurrentSlide(rendered);
        if (live) {
            setLiveSlide(rendered);
            sendLiveState(rendered);
        }
    };
    const saveSectionEdits = () => {
        if (!selectedSong || selectedSectionId === null)
            return;
        updateSongSection(selectedSong.id, selectedSectionId, { type: editorType, text: editorText });
        const transposed = transposeChordMarkup(editorText, transposeSteps);
        pushSlideUndo(currentSlide);
        setCurrentSlide(showChords ? transposed : stripChordMarkup(transposed));
    };
    const toggleNdi = async () => {
        const status = await window?.worship?.ndi?.enable?.(!ndiEnabled);
        setNdiEnabled(Boolean(status?.enabled));
    };
    const updateLook = (targetOutId, patch) => {
        const currentLook = looks[targetOutId] || { background: '#111111', template: 'default', layers: ['slide_content'] };
        setLook(targetOutId, { ...currentLook, ...patch });
    };
    const renderConsole = () => ((0, jsx_runtime_1.jsxs)("div", { className: "workspace-grid workspace-console", style: {
            gridTemplateColumns: `${paneSizes.consoleLeft}px minmax(0, 1fr)`,
        }, children: [(0, jsx_runtime_1.jsxs)(ui_1.Panel, { className: "schedule-panel", children: [(0, jsx_runtime_1.jsx)(ui_1.SectionHeader, { title: "Order of Service", meta: `${schedule.length} items` }), (0, jsx_runtime_1.jsx)("div", { className: "schedule-list", children: schedule.map((item, index) => ((0, jsx_runtime_1.jsxs)("div", { draggable: true, onDragStart: () => setDragIndex(index), onDragOver: (event) => event.preventDefault(), onDrop: () => {
                                if (dragIndex != null && dragIndex !== index)
                                    moveSchedule(dragIndex, index);
                                setDragIndex(null);
                            }, onClick: () => setCurrentSlide(item.content), className: `schedule-item ${index === 0 ? 'active' : ''}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "schedule-meta", children: [(0, jsx_runtime_1.jsx)("span", { children: String(index + 1).padStart(2, '0') }), (0, jsx_runtime_1.jsx)("span", { children: index === 0 ? 'CURRENT' : index === 1 ? 'NEXT' : 'UPCOMING' })] }), (0, jsx_runtime_1.jsx)("strong", { children: item.content }), (0, jsx_runtime_1.jsx)("small", { children: item.type })] }, item.id))) }), (0, jsx_runtime_1.jsx)("button", { className: "soft-button full", onClick: () => { addScheduleItem(); notify('Schedule updated', 'New service item added', 'success'); }, children: "Add Item" })] }), (0, jsx_runtime_1.jsxs)("section", { className: "console-stage", children: [(0, jsx_runtime_1.jsxs)("div", { className: "monitor-grid", children: [(0, jsx_runtime_1.jsxs)(ui_1.Panel, { className: "monitor", children: [(0, jsx_runtime_1.jsxs)("div", { className: "monitor-header", children: [(0, jsx_runtime_1.jsx)("span", { children: "Preview" }), (0, jsx_runtime_1.jsx)("button", { className: "text-button", onClick: () => setWorkspace('editor'), children: "Edit" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "slide-frame", style: { backgroundColor: theme.bg, backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined, backgroundSize: 'cover', color: theme.color, fontSize: theme.fontSize }, children: [(0, jsx_runtime_1.jsx)("div", { className: "slide-overlay" }), (0, jsx_runtime_1.jsx)("div", { className: "slide-content", children: currentSlide })] })] }), (0, jsx_runtime_1.jsxs)(ui_1.Panel, { className: "monitor live", children: [(0, jsx_runtime_1.jsxs)("div", { className: "monitor-header", children: [(0, jsx_runtime_1.jsx)("span", { children: "Live Output" }), (0, jsx_runtime_1.jsx)(ui_1.Pill, { className: "live-pill", children: "ON AIR" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "slide-frame", style: { backgroundColor: theme.bg, backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined, backgroundSize: 'cover', color: theme.color, fontSize: theme.fontSize }, children: [(0, jsx_runtime_1.jsx)("div", { className: "slide-overlay live" }), (0, jsx_runtime_1.jsx)("div", { className: "slide-content", children: liveSlide })] })] })] }), (0, jsx_runtime_1.jsxs)(ui_1.Panel, { className: "output-preview-panel", style: { minHeight: paneSizes.consoleBottom }, children: [(0, jsx_runtime_1.jsx)(ui_1.SectionHeader, { title: "Output Preview Matrix" }), (0, jsx_runtime_1.jsx)("div", { className: "output-preview-grid", children: OUTPUT_IDS.map((id) => {
                                    const state = outputStates[id] || {};
                                    const label = state.mode === 'black' ? 'BLACK' : state.mode === 'logo' ? 'Church Logo' : (state.slideTitle || 'Idle');
                                    return (0, jsx_runtime_1.jsxs)("div", { className: "output-tile", children: [(0, jsx_runtime_1.jsxs)("small", { children: ["Output ", id] }), (0, jsx_runtime_1.jsx)("div", { className: "output-box", children: label })] }, id);
                                }) })] })] })] }));
    const renderLibrary = () => ((0, jsx_runtime_1.jsxs)("div", { className: "workspace-grid workspace-library", children: [(0, jsx_runtime_1.jsxs)(ui_1.Panel, { className: "library-filters", children: [(0, jsx_runtime_1.jsx)(ui_1.SectionHeader, { title: "Content Categories" }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-list", children: [(0, jsx_runtime_1.jsxs)("button", { className: "filter-item active", children: ["Songs ", (0, jsx_runtime_1.jsx)("span", { children: songs.length })] }), (0, jsx_runtime_1.jsxs)("button", { className: "filter-item", children: ["Bibles ", (0, jsx_runtime_1.jsx)("span", { children: "2" })] }), (0, jsx_runtime_1.jsxs)("button", { className: "filter-item", children: ["Media ", (0, jsx_runtime_1.jsx)("span", { children: "--" })] }), (0, jsx_runtime_1.jsxs)("button", { className: "filter-item", children: ["Videos ", (0, jsx_runtime_1.jsx)("span", { children: mediaAssets.filter((item) => item.type === 'video').length })] }), (0, jsx_runtime_1.jsxs)("button", { className: "filter-item", children: ["Backgrounds ", (0, jsx_runtime_1.jsx)("span", { children: mediaAssets.filter((item) => item.type === 'image').length })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "chip-group", children: ['Worship', 'Uplifting', 'Sermon', '4K UHD', 'Announcement', 'Instrumental'].map((tag) => (0, jsx_runtime_1.jsx)(ui_1.Chip, { children: tag }, tag)) })] }), (0, jsx_runtime_1.jsxs)(ui_1.Panel, { className: "library-grid-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "library-toolbar", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { children: "Song Library" }), (0, jsx_runtime_1.jsxs)("p", { children: [filteredSongs.length, " arrangements"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "toolbar-inline", children: [(0, jsx_runtime_1.jsx)("input", { value: songSearchQuery, onChange: (event) => setSongSearchQuery(event.target.value), placeholder: "Search songs", className: "input" }), (0, jsx_runtime_1.jsxs)("select", { className: "input", style: { width: 130 }, value: librarySort, onChange: (event) => setLibrarySort(event.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "name", children: "Sort: Name" }), (0, jsx_runtime_1.jsx)("option", { value: "sections", children: "Sort: Sections" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "view-toggle-group", children: [(0, jsx_runtime_1.jsx)("button", { className: `view-toggle-btn ${libraryViewMode === 'grid' ? 'active' : ''}`, onClick: () => setLibraryViewMode('grid'), children: "Grid" }), (0, jsx_runtime_1.jsx)("button", { className: `view-toggle-btn ${libraryViewMode === 'list' ? 'active' : ''}`, onClick: () => setLibraryViewMode('list'), children: "List" })] }), (0, jsx_runtime_1.jsx)("button", { className: "soft-button", onClick: () => { addSong(); setWorkspace('editor'); }, children: "Add Song" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: libraryViewMode === 'grid' ? 'bento-grid' : 'library-list', children: filteredSongs.map((song) => ((0, jsx_runtime_1.jsx)(ui_1.MediaCard, { title: song.title, subtitle: `${song.sections.length} sections`, active: song.id === selectedSongId, onClick: () => { setSelectedSongId(song.id); setWorkspace('editor'); } }, song.id))) })] })] }));
    const renderEditor = () => {
        const bgStyle = {
            backgroundColor: theme.bg,
            backgroundImage: theme.gradient
                ? `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`
                : theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
            backgroundSize: 'cover',
            color: theme.color,
            filter: (theme.blur ?? 0) > 0 ? `blur(${theme.blur}px)` : undefined,
        };
        return ((0, jsx_runtime_1.jsxs)("div", { className: "workspace-grid workspace-editor", style: { gridTemplateColumns: `${paneSizes.editorLeft}px minmax(0, 1fr) ${paneSizes.editorRight}px` }, children: [(0, jsx_runtime_1.jsxs)("aside", { className: "panel sequence-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "panel-header", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Slide Sequence" }), (0, jsx_runtime_1.jsx)("button", { className: "text-button", onClick: () => selectedSong && addSongSection(selectedSong.id), children: "Add" })] }), (0, jsx_runtime_1.jsx)("div", { className: "sequence-list", children: (selectedSong?.sections || []).map((section, index) => ((0, jsx_runtime_1.jsxs)("button", { draggable: true, onDragStart: () => setEditorDragIndex(index), onDragOver: (event) => event.preventDefault(), onDrop: () => {
                                    if (!selectedSong || editorDragIndex == null || editorDragIndex === index)
                                        return;
                                    moveSongSection(selectedSong.id, editorDragIndex, index);
                                    setEditorDragIndex(null);
                                    notify('Section order updated', 'Slide sequence reordered', 'info');
                                }, className: `sequence-item ${selectedSectionId === section.id ? 'active' : ''}`, onClick: () => pickSection(section.id), onDoubleClick: () => pickSection(section.id, true), children: [(0, jsx_runtime_1.jsx)("span", { children: String(index + 1).padStart(2, '0') }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { children: section.type }), (0, jsx_runtime_1.jsx)("small", { children: stripChordMarkup(section.text).slice(0, 84) || 'Empty section' })] })] }, section.id))) })] }), (0, jsx_runtime_1.jsxs)("section", { className: "panel stage-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "panel-header", children: [(0, jsx_runtime_1.jsx)("h3", { children: selectedSong?.title || 'Song Editor' }), (0, jsx_runtime_1.jsxs)("div", { className: "toolbar-inline", children: [(0, jsx_runtime_1.jsx)("button", { className: "soft-button", onClick: () => setTransposeSteps((value) => value - 1), children: "Flat" }), (0, jsx_runtime_1.jsx)("button", { className: "soft-button", onClick: () => setTransposeSteps(0), children: "Reset" }), (0, jsx_runtime_1.jsx)("button", { className: "soft-button", onClick: () => setTransposeSteps((value) => value + 1), children: "Sharp" }), (0, jsx_runtime_1.jsx)("button", { className: "soft-button", onClick: () => setShowChords((value) => !value), children: showChords ? 'Hide Chords' : 'Show Chords' })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "stage-canvas", style: { position: 'relative', color: theme.color }, children: [(0, jsx_runtime_1.jsx)("div", { style: { ...bgStyle, position: 'absolute', inset: 0, opacity: (theme.opacity ?? 100) / 100, borderRadius: 'inherit' } }), (0, jsx_runtime_1.jsx)("div", { className: "slide-overlay live" }), (0, jsx_runtime_1.jsx)("h1", { style: { position: 'relative', zIndex: 1, textAlign: theme.textAlign || 'center', fontFamily: theme.fontFamily || 'Manrope', fontWeight: theme.fontWeight || 700 }, children: currentSlide || 'Select a section' }), (0, jsx_runtime_1.jsx)("span", { className: "live-pill stage", children: "Live View" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "stage-toolbar", children: [(0, jsx_runtime_1.jsxs)("span", { className: "stage-label", children: ["Tt ", selectedSection?.type || 'VERSE', " ", selectedSectionId ? (selectedSong?.sections.findIndex(s => s.id === selectedSectionId) ?? 0) + 1 : 1] }), (0, jsx_runtime_1.jsx)("span", { className: "toolbar-divider" }), (0, jsx_runtime_1.jsx)("button", { className: "undo-redo-btn", onClick: undo, disabled: undoStack.length === 0, title: "Undo", children: "\u21A9" }), (0, jsx_runtime_1.jsx)("button", { className: "undo-redo-btn", onClick: redo, disabled: redoStack.length === 0, title: "Redo", children: "\u21AA" })] })] }), (0, jsx_runtime_1.jsxs)("aside", { className: "panel inspector-panel", children: [(0, jsx_runtime_1.jsx)("div", { className: "panel-header", children: (0, jsx_runtime_1.jsx)("h3", { children: "Background & Style" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "inspector-content", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-tab-group", children: [(0, jsx_runtime_1.jsx)("button", { className: `bg-tab ${bgManagerTab === 'media' ? 'active' : ''}`, onClick: () => setBgManagerTab('media'), children: "Media" }), (0, jsx_runtime_1.jsx)("button", { className: `bg-tab ${bgManagerTab === 'gradient' ? 'active' : ''}`, onClick: () => setBgManagerTab('gradient'), children: "Gradient" }), (0, jsx_runtime_1.jsx)("button", { className: `bg-tab ${bgManagerTab === 'color' ? 'active' : ''}`, onClick: () => setBgManagerTab('color'), children: "Color" })] }), bgManagerTab === 'media' && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("label", { children: "Active Media" }), (0, jsx_runtime_1.jsx)("div", { className: "active-media-preview", children: theme.backgroundImage
                                                ? (0, jsx_runtime_1.jsx)("img", { src: theme.backgroundImage.startsWith('file://') || theme.backgroundImage.startsWith('http') ? theme.backgroundImage : `file://${theme.backgroundImage}`, alt: "Background", onError: (e) => { e.currentTarget.style.display = 'none'; } })
                                                : (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.78rem' }, children: "No media selected" }) }), (0, jsx_runtime_1.jsx)("label", { children: "Background Image" }), (0, jsx_runtime_1.jsx)("input", { className: "input", value: theme.backgroundImage || '', onChange: (event) => setTheme({ ...theme, backgroundImage: event.target.value, gradient: '' }), placeholder: "file://... or https://..." }), (0, jsx_runtime_1.jsx)("label", { children: "Quick Picker" }), (0, jsx_runtime_1.jsx)("div", { className: "quick-picker-grid", children: (0, jsx_runtime_1.jsx)("button", { className: "quick-picker-add", onClick: () => { }, children: "+" }) })] })), bgManagerTab === 'gradient' && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("label", { children: "Gradient Colors" }), (0, jsx_runtime_1.jsxs)("div", { className: "gradient-picker-row", children: [(0, jsx_runtime_1.jsx)("input", { type: "color", value: gradientStart, onChange: (e) => { setGradientStart(e.target.value); setTheme({ ...theme, gradient: `linear-gradient(135deg, ${e.target.value}, ${gradientEnd})`, backgroundImage: '' }); } }), (0, jsx_runtime_1.jsx)("div", { className: "gradient-preview", style: { background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` } }), (0, jsx_runtime_1.jsx)("input", { type: "color", value: gradientEnd, onChange: (e) => { setGradientEnd(e.target.value); setTheme({ ...theme, gradient: `linear-gradient(135deg, ${gradientStart}, ${e.target.value})`, backgroundImage: '' }); } })] })] })), bgManagerTab === 'color' && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("label", { children: "Background Color" }), (0, jsx_runtime_1.jsx)("input", { type: "color", value: theme.bg, onChange: (event) => setTheme({ ...theme, bg: event.target.value, gradient: '', backgroundImage: '' }) })] })), (0, jsx_runtime_1.jsxs)("div", { className: "slider-row", children: [(0, jsx_runtime_1.jsxs)("div", { className: "slider-label", children: [(0, jsx_runtime_1.jsx)("span", { children: "Opacity" }), (0, jsx_runtime_1.jsxs)("span", { children: [theme.opacity ?? 100, "%"] })] }), (0, jsx_runtime_1.jsx)("input", { type: "range", min: 0, max: 100, value: theme.opacity ?? 100, onChange: (e) => setTheme({ ...theme, opacity: Number(e.target.value) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "slider-row", children: [(0, jsx_runtime_1.jsxs)("div", { className: "slider-label", children: [(0, jsx_runtime_1.jsx)("span", { children: "Blur" }), (0, jsx_runtime_1.jsxs)("span", { children: [theme.blur ?? 0, "px"] })] }), (0, jsx_runtime_1.jsx)("input", { type: "range", min: 0, max: 20, value: theme.blur ?? 0, onChange: (e) => setTheme({ ...theme, blur: Number(e.target.value) }) })] }), (0, jsx_runtime_1.jsx)("label", { children: "Section Type" }), (0, jsx_runtime_1.jsx)("select", { className: "input", value: editorType, onChange: (event) => setEditorType(event.target.value), children: SECTION_TYPES.map((item) => (0, jsx_runtime_1.jsx)("option", { value: item, children: item }, item)) }), (0, jsx_runtime_1.jsx)("label", { children: "Section Text" }), (0, jsx_runtime_1.jsx)("textarea", { className: "input textarea", value: editorText, onChange: (event) => setEditorText(event.target.value) }), (0, jsx_runtime_1.jsxs)("label", { children: ["Font Size (", theme.fontSize, "px)"] }), (0, jsx_runtime_1.jsx)("input", { type: "range", min: 24, max: 96, value: theme.fontSize, onChange: (event) => setTheme({ ...theme, fontSize: Number(event.target.value) }) }), (0, jsx_runtime_1.jsx)("label", { children: "Font Family" }), (0, jsx_runtime_1.jsxs)("select", { className: "input", value: theme.fontFamily || 'Manrope', onChange: (event) => setTheme({ ...theme, fontFamily: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "Manrope", children: "Manrope" }), (0, jsx_runtime_1.jsx)("option", { value: "Inter", children: "Inter" }), (0, jsx_runtime_1.jsx)("option", { value: "Segoe UI", children: "Segoe UI" })] }), (0, jsx_runtime_1.jsxs)("label", { children: ["Font Weight (", theme.fontWeight || 700, ")"] }), (0, jsx_runtime_1.jsx)("input", { type: "range", min: 300, max: 900, step: 100, value: theme.fontWeight || 700, onChange: (event) => setTheme({ ...theme, fontWeight: Number(event.target.value) }) }), (0, jsx_runtime_1.jsx)("label", { children: "Text Alignment" }), (0, jsx_runtime_1.jsxs)("select", { className: "input", value: theme.textAlign || 'center', onChange: (event) => setTheme({ ...theme, textAlign: event.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "left", children: "Left" }), (0, jsx_runtime_1.jsx)("option", { value: "center", children: "Center" }), (0, jsx_runtime_1.jsx)("option", { value: "right", children: "Right" })] }), (0, jsx_runtime_1.jsx)("label", { children: "Text Color" }), (0, jsx_runtime_1.jsx)("input", { type: "color", value: theme.color, onChange: (event) => setTheme({ ...theme, color: event.target.value }) }), (0, jsx_runtime_1.jsxs)("div", { className: "button-row", children: [(0, jsx_runtime_1.jsx)("button", { className: "soft-button full", onClick: saveSectionEdits, children: "Save Section" }), (0, jsx_runtime_1.jsx)("button", { className: "live-button full", onClick: goLive, children: "Send Live" }), (0, jsx_runtime_1.jsx)("button", { className: "template-button", onClick: () => { const name = prompt('Template name:'); if (name)
                                                saveTemplate(name); }, children: "Save as Template" })] })] })] })] }));
    };
    const renderSettings = () => ((0, jsx_runtime_1.jsxs)("div", { className: "workspace-grid workspace-settings", children: [(0, jsx_runtime_1.jsxs)("div", { className: "settings-header", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "settings-title", children: "Display Settings" }), (0, jsx_runtime_1.jsx)("p", { className: "settings-subtitle", children: "Configure output canvas and screen geometry" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "settings-header-actions", children: [(0, jsx_runtime_1.jsx)("button", { className: "soft-button", onClick: () => { setAspectRatio('16:9'); setOverscanPercent(5); setOutputResolution('1920x1080'); notify('Display reset', 'Restored default geometry', 'info'); }, children: "Reset to Default" }), (0, jsx_runtime_1.jsx)("button", { className: "live-button", onClick: () => { window?.worship?.outputs?.actions?.fullscreen?.(); notify('Display applied', `${outputResolution} ${aspectRatio}`, 'success'); }, children: "Apply Changes" })] })] }), (0, jsx_runtime_1.jsx)("section", { className: "panel output-routing-cards", children: outputConfigs.map((output) => ((0, jsx_runtime_1.jsxs)("div", { className: `output-route-card ${output.active ? 'active' : ''}`, onClick: () => {
                        setActiveOutputId(output.id);
                        outputConfigs.forEach((item) => updateOutputConfig(item.id, { active: item.id === output.id }));
                    }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "output-route-heading", children: [(0, jsx_runtime_1.jsxs)("strong", { children: ["Output ", output.id] }), (0, jsx_runtime_1.jsx)("small", { children: output.resolution })] }), (0, jsx_runtime_1.jsxs)("select", { className: "input", value: output.role, onChange: (event) => {
                                const role = event.target.value;
                                updateOutputConfig(output.id, { role });
                                notify('Output role changed', `Output ${output.id} is now ${role}`, 'info');
                            }, children: [(0, jsx_runtime_1.jsx)("option", { value: "primary", children: "Primary" }), (0, jsx_runtime_1.jsx)("option", { value: "extended", children: "Extended" }), (0, jsx_runtime_1.jsx)("option", { value: "stage", children: "Stage" })] })] }, output.id))) }), (0, jsx_runtime_1.jsxs)("section", { className: "panel canvas-layout-section", children: [(0, jsx_runtime_1.jsxs)("div", { className: "canvas-layout-header", children: [(0, jsx_runtime_1.jsx)("div", { className: "canvas-layout-title", children: "\uD83D\uDDA5 Canvas Layout" }), (0, jsx_runtime_1.jsx)("div", { className: "ratio-chip-group", children: ['16:9', '4:3', '21:9', 'FREE'].map((ratio) => ((0, jsx_runtime_1.jsx)("button", { className: `ratio-chip ${aspectRatio === ratio ? 'active' : ''}`, onClick: () => setAspectRatio(ratio), children: ratio }, ratio))) })] }), (0, jsx_runtime_1.jsx)("div", { className: "canvas-visualizer", children: (0, jsx_runtime_1.jsxs)("div", { className: "canvas-display-rect", style: { aspectRatio: aspectRatio === '4:3' ? '4/3' : aspectRatio === '21:9' ? '21/9' : '16/9' }, children: [(0, jsx_runtime_1.jsxs)("span", { className: "canvas-active-pill", children: [(0, jsx_runtime_1.jsx)("span", { className: "dot", style: { width: 6, height: 6, borderRadius: '50%', background: 'var(--tertiary)' } }), " ACTIVE OUTPUT"] }), (0, jsx_runtime_1.jsxs)("span", { className: "canvas-display-label", children: ["Output ", activeOutputId] }), (0, jsx_runtime_1.jsx)("span", { className: "canvas-display-res", children: outputResolution.replace('x', ' × ') }), (0, jsx_runtime_1.jsx)("span", { className: "canvas-handle tl" }), (0, jsx_runtime_1.jsx)("span", { className: "canvas-handle tc" }), (0, jsx_runtime_1.jsx)("span", { className: "canvas-handle tr" }), (0, jsx_runtime_1.jsx)("span", { className: "canvas-handle ml" }), (0, jsx_runtime_1.jsx)("span", { className: "canvas-handle mr" }), (0, jsx_runtime_1.jsx)("span", { className: "canvas-handle bl" }), (0, jsx_runtime_1.jsx)("span", { className: "canvas-handle bc" }), (0, jsx_runtime_1.jsx)("span", { className: "canvas-handle br" })] }) })] }), (0, jsx_runtime_1.jsxs)("aside", { className: "panel dimensions-panel", children: [(0, jsx_runtime_1.jsx)("div", { className: "dimensions-title", children: "\uD83D\uDCD0 Dimensions" }), (0, jsx_runtime_1.jsxs)("div", { className: "dimension-field", children: [(0, jsx_runtime_1.jsx)("label", { children: "Resolution" }), (0, jsx_runtime_1.jsxs)("div", { className: "dimension-input-row", children: [(0, jsx_runtime_1.jsx)("input", { value: outputResolution, onChange: (e) => { setOutputResolution(e.target.value); updateOutputConfig(activeOutputId, { resolution: e.target.value }); } }), (0, jsx_runtime_1.jsx)("button", { className: "edit-icon", title: "Edit", children: "\u270F\uFE0F" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "dimension-field", children: [(0, jsx_runtime_1.jsx)("label", { children: "Aspect Ratio" }), (0, jsx_runtime_1.jsx)("div", { className: "dimension-input-row", children: (0, jsx_runtime_1.jsxs)("select", { value: aspectRatio, onChange: (e) => setAspectRatio(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "16:9", children: "16:9 Widescreen" }), (0, jsx_runtime_1.jsx)("option", { value: "4:3", children: "4:3 Standard" }), (0, jsx_runtime_1.jsx)("option", { value: "21:9", children: "21:9 Ultrawide" }), (0, jsx_runtime_1.jsx)("option", { value: "FREE", children: "Free" })] }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "overscan-slider", children: [(0, jsx_runtime_1.jsxs)("div", { className: "slider-row", children: [(0, jsx_runtime_1.jsxs)("div", { className: "slider-label", children: [(0, jsx_runtime_1.jsx)("span", { children: "Overscan" }), (0, jsx_runtime_1.jsxs)("span", { children: [overscanPercent, "%"] })] }), (0, jsx_runtime_1.jsx)("input", { type: "range", min: 0, max: 20, value: overscanPercent, onChange: (e) => setOverscanPercent(Number(e.target.value)) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "overscan-labels", children: [(0, jsx_runtime_1.jsx)("span", { children: "0%" }), (0, jsx_runtime_1.jsx)("span", { children: "20%" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "hardware-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "hardware-card-title", children: "Output Hardware" }), (0, jsx_runtime_1.jsxs)("div", { className: "hardware-card-content", children: [(0, jsx_runtime_1.jsx)("div", { className: "hardware-icon", children: "\uD83D\uDDA5" }), (0, jsx_runtime_1.jsxs)("div", { className: "hardware-info", children: [(0, jsx_runtime_1.jsx)("strong", { children: outputHardware }), (0, jsx_runtime_1.jsx)("small", { children: "SDI Out 1 \u2022 60fps \u2022 10-bit" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "preset-section", children: [(0, jsx_runtime_1.jsx)("label", { children: "Theme Presets" }), (0, jsx_runtime_1.jsx)("div", { className: "preset-grid", children: store_1.THEME_PRESETS.slice(0, 6).map((preset) => (0, jsx_runtime_1.jsx)("button", { className: "preset-chip", onClick: () => applyPreset(preset), children: preset.name }, preset.name)) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "ndi-section", children: [(0, jsx_runtime_1.jsx)("label", { children: "NDI Output" }), (0, jsx_runtime_1.jsx)("button", { className: `soft-button full ${ndiEnabled ? 'active' : ''}`, onClick: toggleNdi, children: ndiEnabled ? 'Disable NDI' : 'Enable NDI' })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "info-card-row", children: [(0, jsx_runtime_1.jsxs)("div", { className: "info-card", children: [(0, jsx_runtime_1.jsx)("span", { className: "info-card-badge", children: "Pro Feature" }), (0, jsx_runtime_1.jsx)("div", { className: "info-value", style: { fontFamily: 'Manrope, Inter, sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }, children: "Multi-Display Sync" }), (0, jsx_runtime_1.jsx)("div", { style: { color: 'var(--text-muted)', fontSize: '0.72rem', lineHeight: 1.4 }, children: "Synchronize frame delivery across multiple graphics cards for ultra-high-resolution wall displays." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "info-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "info-label", children: "\uD83C\uDFA8 Color Space" }), (0, jsx_runtime_1.jsx)("div", { className: "info-value", children: "Rec.709 (High Dynamic)" }), (0, jsx_runtime_1.jsx)("div", { className: "info-bar" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "info-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "info-label", children: "\u23F1 Frame Delay" }), (0, jsx_runtime_1.jsx)("div", { className: "info-value", children: "1.2ms (Ultra Low)" }), (0, jsx_runtime_1.jsx)("div", { className: "info-sub", children: "Optimized for IMAG systems" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "info-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "info-label", children: "\uD83D\uDD04 Refresh Rate" }), (0, jsx_runtime_1.jsx)("div", { className: "info-value", children: "60.00 Hz" }), (0, jsx_runtime_1.jsx)("div", { className: "info-sub", children: "Matched to Broadcast Clock" })] })] })] }));
    const sendMediaToPreview = (asset) => {
        setTheme({ ...theme, backgroundImage: asset.path });
        setCurrentSlide(asset.name || 'Media');
        notify('Media to preview', asset.name || 'Preview media changed', 'info');
    };
    const sendMediaToLive = (asset) => {
        const updatedTheme = { ...theme, backgroundImage: asset.path };
        setTheme(updatedTheme);
        setCurrentSlide(asset.name || 'Media');
        setLiveSlide(asset.name || 'Media');
        OUTPUT_IDS.forEach((id) => window?.worship?.outputs?.setState?.(id, { slideTitle: asset.name || 'Media', theme: updatedTheme }));
        notify('Media sent live', asset.name || 'Live outputs updated', 'success');
    };
    const renderRibbon = () => ((0, jsx_runtime_1.jsxs)("header", { className: "topbar ribbon", children: [(0, jsx_runtime_1.jsxs)("div", { className: "ribbon-row ribbon-main", children: [(0, jsx_runtime_1.jsxs)("div", { className: "screen-title", children: [(0, jsx_runtime_1.jsx)("strong", { children: workspace.charAt(0).toUpperCase() + workspace.slice(1) }), (0, jsx_runtime_1.jsx)("small", { children: clockValue.toLocaleTimeString() })] }), (0, jsx_runtime_1.jsx)("div", { className: "view-tabs", children: ['console', 'library', 'editor', 'scripture', 'media', 'settings'].map((item) => ((0, jsx_runtime_1.jsx)("button", { className: `tab ${workspace === item ? 'active' : ''}`, onClick: () => setWorkspace(item), children: item.charAt(0).toUpperCase() + item.slice(1) }, item))) }), (0, jsx_runtime_1.jsxs)("div", { className: "topbar-actions", children: [(0, jsx_runtime_1.jsx)("button", { className: "action-button dark", onClick: onBlack, children: "BLACK" }), (0, jsx_runtime_1.jsx)("button", { className: "action-button", onClick: onLogo, children: "LOGO" }), (0, jsx_runtime_1.jsx)("button", { className: "action-button", onClick: onClear, children: "CLEAR" }), (0, jsx_runtime_1.jsx)("button", { className: "action-button live", onClick: goLive, children: "SEND LIVE" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "ribbon-row ribbon-tools", children: [(workspace === 'console' || workspace === 'editor') && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("label", { className: "ribbon-control", children: [(0, jsx_runtime_1.jsx)("span", { children: "Left Pane" }), (0, jsx_runtime_1.jsx)("input", { type: "range", min: 240, max: 480, value: workspace === 'console' ? paneSizes.consoleLeft : paneSizes.editorLeft, onChange: (event) => {
                                            const value = Number(event.target.value);
                                            setPaneSizes((prev) => ({
                                                ...prev,
                                                ...(workspace === 'console' ? { consoleLeft: value } : { editorLeft: value }),
                                            }));
                                        } })] }), workspace === 'console' && ((0, jsx_runtime_1.jsxs)("label", { className: "ribbon-control", children: [(0, jsx_runtime_1.jsx)("span", { children: "Output Area" }), (0, jsx_runtime_1.jsx)("input", { type: "range", min: 150, max: 340, value: paneSizes.consoleBottom, onChange: (event) => setPaneSizes((prev) => ({ ...prev, consoleBottom: Number(event.target.value) })) })] })), workspace === 'editor' && ((0, jsx_runtime_1.jsxs)("label", { className: "ribbon-control", children: [(0, jsx_runtime_1.jsx)("span", { children: "Inspector Pane" }), (0, jsx_runtime_1.jsx)("input", { type: "range", min: 260, max: 460, value: paneSizes.editorRight, onChange: (event) => setPaneSizes((prev) => ({ ...prev, editorRight: Number(event.target.value) })) })] }))] })), workspace === 'editor' && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("button", { className: "soft-button", onClick: () => selectedSong && addSongSection(selectedSong.id), children: "Add Section" }), (0, jsx_runtime_1.jsx)("button", { className: "soft-button", onClick: saveSectionEdits, children: "Save Section" })] })), workspace === 'media' && ((0, jsx_runtime_1.jsx)("span", { className: "ribbon-note", children: "Tip: click asset for inspector, double-click to preview, then push live when ready." }))] })] }));
    return ((0, jsx_runtime_1.jsxs)("div", { className: "app-shell", children: [(0, jsx_runtime_1.jsxs)("aside", { className: "app-sidebar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "brand-block", children: [(0, jsx_runtime_1.jsx)("h1", { children: "The Ethereal Stage" }), (0, jsx_runtime_1.jsx)("p", { children: "Sanctuary Control" })] }), (0, jsx_runtime_1.jsxs)("nav", { className: "sidebar-nav", children: [(0, jsx_runtime_1.jsx)("button", { className: `nav-button ${workspace === 'console' ? 'active' : ''}`, onClick: () => setWorkspace('console'), children: "Console" }), (0, jsx_runtime_1.jsx)("button", { className: `nav-button ${workspace === 'library' ? 'active' : ''}`, onClick: () => setWorkspace('library'), children: "Library" }), (0, jsx_runtime_1.jsx)("button", { className: `nav-button ${workspace === 'editor' ? 'active' : ''}`, onClick: () => setWorkspace('editor'), children: "Song Editor" }), (0, jsx_runtime_1.jsx)("button", { className: `nav-button ${workspace === 'scripture' ? 'active' : ''}`, onClick: () => setWorkspace('scripture'), children: "Scripture" }), (0, jsx_runtime_1.jsx)("button", { className: `nav-button ${workspace === 'media' ? 'active' : ''}`, onClick: () => setWorkspace('media'), children: "Media" }), (0, jsx_runtime_1.jsx)("button", { className: `nav-button ${workspace === 'settings' ? 'active' : ''}`, onClick: () => setWorkspace('settings'), children: "Settings" })] }), (0, jsx_runtime_1.jsx)("div", { className: "sidebar-footer", children: (0, jsx_runtime_1.jsx)("button", { className: "live-button full", onClick: goLive, children: "Go Live" }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "app-main", children: [renderRibbon(), (0, jsx_runtime_1.jsxs)("main", { className: "workspace", children: [workspace === 'console' && renderConsole(), workspace === 'library' && renderLibrary(), workspace === 'editor' && renderEditor(), workspace === 'scripture' && (0, jsx_runtime_1.jsx)(BiblePicker_1.BiblePicker, {}), workspace === 'media' && ((0, jsx_runtime_1.jsx)(MediaLibrary_1.MediaLibrary, { mediaType: mediaType, onMediaSelect: () => undefined, onSendToPreview: sendMediaToPreview, onSendToLive: sendMediaToLive, onNotify: notify })), workspace === 'settings' && renderSettings()] }), (0, jsx_runtime_1.jsx)(Notifications_1.Notifications, { items: toasts, onDismiss: (id) => setToasts((prev) => prev.filter((item) => item.id !== id)) })] })] }));
};
const mountPoint = document.getElementById('root');
const root = mountPoint ? (0, client_1.createRoot)(mountPoint) : null;
if (root)
    root.render((0, jsx_runtime_1.jsx)(App, {}));
