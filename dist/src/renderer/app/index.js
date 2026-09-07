"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const client_1 = require("react-dom/client");
const store_1 = require("./store");
const db_1 = require("./services/db");
const OutputView_1 = require("./components/OutputView");
const BiblePicker_1 = require("./components/BiblePicker");
const MediaLibrary_1 = require("./components/MediaLibrary");
const Notifications_1 = require("./components/Notifications");
const ConsoleWorkspace_1 = require("./components/ConsoleWorkspace");
const LibraryWorkspace_1 = require("./components/LibraryWorkspace");
const EditorWorkspace_1 = require("./components/EditorWorkspace");
const SettingsWorkspace_1 = require("./components/SettingsWorkspace");
const HelpWorkspace_1 = require("./components/HelpWorkspace");
const CommandPalette_1 = require("./components/CommandPalette");
const Dialog_1 = require("./components/Dialog");
const ui_1 = require("./components/ui");
require("./styles.css");
const OUTPUT_IDS = [1, 2];
const NOTE_INDEX = {
    C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
    'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const NAV_ITEMS = [
    { id: 'console', label: 'Console', icon: 'console' },
    { id: 'library', label: 'Library', icon: 'library' },
    { id: 'editor', label: 'Song Editor', icon: 'editor' },
    { id: 'scripture', label: 'Scripture', icon: 'scripture' },
    { id: 'media', label: 'Media', icon: 'media' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
];
const PAGE_META = {
    console: { title: 'Console', subtitle: 'Control your worship experience' },
    library: { title: 'Song Library', subtitle: 'Manage and organize your worship songs' },
    editor: { title: 'Song Editor', subtitle: 'Create and edit your worship content' },
    scripture: { title: 'Bible', subtitle: 'Display scripture with clarity and focus' },
    media: { title: 'Media Assets', subtitle: 'Manage images, videos, and backgrounds' },
    settings: { title: 'Settings', subtitle: 'Configure displays, outputs, and preferences' },
    help: { title: 'Help', subtitle: 'Guides and operational shortcuts' },
};
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
const transposeChordMarkup = (text, steps) => steps
    ? text.replace(/\[([^\]]+)\]/g, (_match, chord) => `[${transposeChord(chord, steps)}]`)
    : text;
// ─── Inner App (needs DialogProvider) ────────────────────────────────────────
const AppInner = () => {
    const { show: showDialog } = (0, Dialog_1.useDialog)();
    const outId = getOutId();
    const isOutput = outId > 0;
    // Store selectors
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
    const updateSongTitle = (0, store_1.useStore)((state) => state.updateSongTitle);
    const deleteSong = (0, store_1.useStore)((state) => state.deleteSong);
    const deleteSongSection = (0, store_1.useStore)((state) => state.deleteSongSection);
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
    const displays = (0, store_1.useStore)((state) => state.displays);
    const setDisplays = (0, store_1.useStore)((state) => state.setDisplays);
    // UI state
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
    const [songTitleDraft, setSongTitleDraft] = react_1.default.useState('');
    const [ndiEnabled, setNdiEnabled] = react_1.default.useState(false);
    const [outputStates, setOutputStates] = react_1.default.useState({});
    const [isOnAir, setIsOnAir] = react_1.default.useState(false);
    const [presentationPaused, setPresentationPaused] = react_1.default.useState(false);
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
    const [activeOutputId, setActiveOutputId] = react_1.default.useState(1);
    const [aspectRatio, setAspectRatio] = react_1.default.useState('16:9');
    const [overscanPercent, setOverscanPercent] = react_1.default.useState(5);
    const [outputResolution, setOutputResolution] = react_1.default.useState('1920x1080');
    const [outputHardware] = react_1.default.useState('Built-in Display');
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
    const [syncUrl, setSyncUrl] = react_1.default.useState('ws://localhost:9090');
    const [syncConnected, setSyncConnected] = react_1.default.useState(false);
    const [syncSocket, setSyncSocket] = react_1.default.useState(null);
    const [showPalette, setShowPalette] = react_1.default.useState(false);
    const [logoImage, setLogoImage] = react_1.default.useState(() => {
        try {
            return localStorage.getItem('worship-logo-image') || '';
        }
        catch {
            return '';
        }
    });
    const [appVersion, setAppVersion] = react_1.default.useState('');
    const [appLoading, setAppLoading] = react_1.default.useState(true);
    const [activeOutputWindows, setActiveOutputWindows] = react_1.default.useState(() => {
        if (typeof window !== 'undefined' && window.worship?.outputs?.list) {
            window.worship.outputs.list().then((list) => setActiveOutputWindows(list || [])).catch(() => { });
        }
        return [];
    });
    // Derived
    const selectedSong = songs.find((song) => song.id === selectedSongId) || songs[0];
    const selectedSection = selectedSong?.sections.find((s) => s.id === selectedSectionId) || selectedSong?.sections[0];
    const filteredSongs = songs
        .filter((song) => !songSearchQuery ||
        song.title.toLowerCase().includes(songSearchQuery.toLowerCase()) ||
        song.artist?.toLowerCase().includes(songSearchQuery.toLowerCase()))
        .sort((a, b) => (librarySort === 'name' ? a.title.localeCompare(b.title) : b.sections.length - a.sections.length));
    // ── Effects ────────────────────────────────────────────────────────────────
    react_1.default.useEffect(() => {
        if (isOutput)
            return;
        const timer = setInterval(() => setClockValue(new Date()), 1000);
        return () => clearInterval(timer);
    }, [isOutput]);
    react_1.default.useEffect(() => {
        if (isOutput)
            return;
        if (!songs.find((s) => s.id === selectedSongId) && songs[0])
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
        setSongTitleDraft(selectedSong?.title || '');
    }, [selectedSong?.id, selectedSong?.title]);
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
        window?.worship?.ndi?.status?.()
            .then((status) => setNdiEnabled(Boolean(status?.enabled)))
            .catch(() => setNdiEnabled(false));
    }, [isOutput]);
    react_1.default.useEffect(() => {
        if (isOutput)
            return;
        const loadData = async () => {
            try {
                const songsWithSections = await db_1.dbService.songs.getAll();
                if (songsWithSections?.length) {
                    store_1.useStore.setState({ songs: songsWithSections });
                    setSelectedSongId(songsWithSections[0]?.id || 0);
                }
                const scheduleItems = await db_1.dbService.schedule.getItems();
                if (scheduleItems?.length) {
                    store_1.useStore.setState({ schedule: scheduleItems });
                }
            }
            catch (error) {
                console.error('Failed to load operator data:', error);
            }
            finally {
                window.setTimeout(() => setAppLoading(false), 250);
            }
        };
        loadData();
    }, [isOutput]);
    react_1.default.useEffect(() => {
        if (isOutput)
            return;
        const isEditableTarget = (target) => {
            const node = target;
            if (!node)
                return false;
            const tag = node.tagName?.toLowerCase();
            return tag === 'input' || tag === 'textarea' || tag === 'select' || Boolean(node.closest('[contenteditable="true"]'));
        };
        const handleKeyDown = (event) => {
            // Ctrl+K: open command palette
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                setShowPalette((v) => !v);
                return;
            }
            const isEditingSong = Boolean(selectedSection &&
                (editorText !== (selectedSection.text || '') || editorType !== (selectedSection.type || 'Verse')));
            if (event.key === 'Enter' &&
                selectedSectionId !== null &&
                !event.shiftKey &&
                !event.ctrlKey &&
                !event.altKey &&
                !isEditableTarget(event.target) &&
                !isEditingSong) {
                event.preventDefault();
                goLive();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOutput, selectedSectionId, currentSlide, selectedSection, editorText, editorType, presentationPaused]);
    react_1.default.useEffect(() => {
        if (isOutput)
            return;
        localStorage.setItem('operator-pane-sizes', JSON.stringify(paneSizes));
    }, [isOutput, paneSizes]);
    react_1.default.useEffect(() => {
        try {
            localStorage.setItem('worship-logo-image', logoImage);
        }
        catch { }
    }, [logoImage]);
    // Load displays on startup
    react_1.default.useEffect(() => {
        if (isOutput)
            return;
        const loadDisplays = async () => {
            try {
                if (window.worship?.displays?.getAll) {
                    const d = await window.worship.displays.getAll();
                    if (d?.length)
                        setDisplays(d);
                }
                if (window.worship?.app?.getVersion) {
                    const v = await window.worship.app.getVersion();
                    setAppVersion(v || '');
                }
                if (window.worship?.outputs?.list) {
                    const list = await window.worship.outputs.list();
                    setActiveOutputWindows(list || []);
                }
            }
            catch (e) {
                console.error('Failed to load system info:', e);
            }
        };
        loadDisplays();
    }, [isOutput]);
    // Listen for display changes
    react_1.default.useEffect(() => {
        if (isOutput || !window.worship?.displays?.onChanged)
            return;
        const cleanup = window.worship.displays.onChanged((d) => {
            if (d?.length)
                setDisplays(d);
        });
        return cleanup;
    }, [isOutput]);
    // Refresh output list when displays change
    react_1.default.useEffect(() => {
        if (isOutput)
            return;
        const refresh = async () => {
            try {
                if (window.worship?.outputs?.list) {
                    const list = await window.worship.outputs.list();
                    setActiveOutputWindows(list || []);
                }
            }
            catch { }
        };
        refresh();
    }, [displays, isOutput]);
    if (isOutput)
        return (0, jsx_runtime_1.jsx)(OutputView_1.OutputView, { outId: outId, logoImage: logoImage });
    // ── Helpers ────────────────────────────────────────────────────────────────
    const sendLiveState = (slideTitle) => {
        const targetOutputIds = activeOutputWindows.length
            ? activeOutputWindows.map((item) => Number(item.id)).filter(Boolean)
            : OUTPUT_IDS;
        targetOutputIds.forEach((id) => window?.worship?.outputs?.setState?.(id, { slideTitle, mediaPath: '', mediaType: undefined, theme }));
    };
    const notify = (title, detail, tone = 'info') => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((prev) => [...prev.slice(-3), { id, title, detail, tone }]);
        window.setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), 4200);
    };
    const goLive = () => {
        if (presentationPaused) {
            notify('Presentation paused', 'Resume the live feed before sending a new slide', 'warn');
            return;
        }
        setLiveSlide(currentSlide);
        sendLiveState(currentSlide);
        setIsOnAir(true);
        notify('Live updated', 'Preview pushed to all outputs', 'success');
    };
    const onBlack = () => {
        window?.worship?.outputs?.actions?.black?.();
        setIsOnAir(true);
        notify('Black screen enabled', 'Outputs set to black', 'warn');
    };
    const onLogo = () => {
        window?.worship?.outputs?.actions?.logo?.();
        setIsOnAir(true);
        notify('Logo mode', 'Outputs switched to logo standby', 'info');
    };
    const onClear = () => {
        window?.worship?.outputs?.actions?.clear?.();
        sendLiveState(liveSlide);
        notify('Cleared output mode', 'Live slide restored', 'success');
    };
    const togglePresentationPause = () => {
        setPresentationPaused((paused) => {
            const next = !paused;
            notify(next ? 'Presentation paused' : 'Presentation resumed', next ? 'Live output is held on the current slide' : 'New slides can be sent live', next ? 'warn' : 'success');
            return next;
        });
    };
    const endLive = () => {
        onClear();
        setIsOnAir(false);
        setPresentationPaused(false);
        notify('Live session ended', 'Outputs returned to standby', 'info');
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
    const commitSongTitle = () => {
        if (!selectedSong)
            return;
        updateSongTitle(selectedSong.id, songTitleDraft);
    };
    const importSongs = async () => {
        try {
            const filePaths = await window.worship.dialog.openFiles({
                title: 'Import Songs',
                filters: [{ name: 'Song Files', extensions: ['txt', 'json'] }],
                multiSelections: true,
            });
            if (!filePaths.length)
                return;
            const importedSongs = [];
            for (const filePath of filePaths) {
                const data = await window.worship.fs.readTextFile(filePath);
                let title = filePath.split('\\').pop()?.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Imported Song';
                let sectionText = data;
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && typeof parsed === 'object') {
                        title = String(parsed.title || title);
                        sectionText = String(parsed.text || parsed.lyrics || sectionText);
                    }
                }
                catch { /* plain text is valid */ }
                const createdSong = await db_1.dbService.songs.create(title);
                await db_1.dbService.songs.updateSection(createdSong.id, createdSong.sections[0].id, { type: 'Verse', text: sectionText });
                importedSongs.push({ ...createdSong, sections: [{ ...createdSong.sections[0], text: sectionText }] });
            }
            if (importedSongs.length) {
                store_1.useStore.setState((state) => ({ songs: [...state.songs, ...importedSongs] }));
                setSelectedSongId(importedSongs[0].id);
                notify('Songs imported', `${importedSongs.length} song(s) added`, 'success');
            }
        }
        catch (error) {
            console.error('Failed to import songs:', error);
            notify('Import failed', 'Could not import selected songs', 'warn');
        }
    };
    const connectSync = () => {
        if (syncSocket || !syncUrl)
            return;
        const socket = new WebSocket(syncUrl);
        socket.onopen = () => setSyncConnected(true);
        socket.onclose = () => { setSyncConnected(false); setSyncSocket(null); };
        socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(String(event.data || '{}'));
                if (msg?.type === 'state' && msg.payload?.outId && msg.payload?.state) {
                    window?.worship?.outputs?.setState?.(msg.payload.outId, msg.payload.state);
                }
            }
            catch { /* ignore malformed sync messages */ }
        };
        setSyncSocket(socket);
    };
    const disconnectSync = () => {
        if (!syncSocket)
            return;
        syncSocket.close();
        setSyncSocket(null);
        setSyncConnected(false);
    };
    const sendMediaToPreview = (asset) => {
        setTheme({ ...theme, backgroundImage: asset.path });
        setCurrentSlide('');
        notify('Media to preview', asset.name || 'Preview media changed', 'info');
    };
    const sendMediaToLive = (asset, playback) => {
        const updatedTheme = { ...theme, backgroundImage: asset.path };
        setTheme(updatedTheme);
        setCurrentSlide('');
        setLiveSlide('');
        const targetOutputIds = activeOutputWindows.length
            ? activeOutputWindows.map((item) => Number(item.id)).filter(Boolean)
            : OUTPUT_IDS;
        targetOutputIds.forEach((id) => window?.worship?.outputs?.setState?.(id, {
            slideTitle: '', mediaPath: asset.path, mediaType: asset.type,
            mediaPlayback: playback, theme: updatedTheme,
        }));
        setIsOnAir(true);
        notify('Media sent live', asset.name || 'Live outputs updated', 'success');
    };
    const pickLogoFile = async () => {
        try {
            const files = await window.worship.dialog.openFiles({
                title: 'Select Logo Image',
                filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'] }],
            });
            if (files[0])
                setLogoImage(files[0]);
        }
        catch { /* ignore */ }
    };
    // ── Command palette commands ───────────────────────────────────────────────
    const paletteCommands = [
        { id: 'go-console', label: 'Go to Console', icon: '🎛', category: 'Navigation', action: () => setWorkspace('console') },
        { id: 'go-library', label: 'Go to Library', icon: '📚', category: 'Navigation', action: () => setWorkspace('library') },
        { id: 'go-editor', label: 'Go to Song Editor', icon: '✏️', category: 'Navigation', action: () => setWorkspace('editor') },
        { id: 'go-scripture', label: 'Go to Scripture', icon: '📖', category: 'Navigation', action: () => setWorkspace('scripture') },
        { id: 'go-media', label: 'Go to Media', icon: '🖼', category: 'Navigation', action: () => setWorkspace('media') },
        { id: 'go-settings', label: 'Go to Settings', icon: '⚙️', category: 'Navigation', action: () => setWorkspace('settings') },
        { id: 'go-live', label: 'Send Live', description: 'Push preview to all outputs', icon: '🔴', category: 'Output', keywords: ['live', 'push', 'send'], action: goLive },
        { id: 'black', label: 'Black Screen', description: 'Set all outputs to black', icon: '⬛', category: 'Output', action: onBlack },
        { id: 'logo', label: 'Logo Mode', description: 'Show church logo on outputs', icon: '🏛', category: 'Output', action: onLogo },
        { id: 'clear', label: 'Clear Override', description: 'Restore normal output', icon: '✨', category: 'Output', action: onClear },
        { id: 'add-song', label: 'Add New Song', icon: '➕', category: 'Library', action: async () => { await addSong(); setWorkspace('editor'); } },
        { id: 'import-songs', label: 'Import Songs', icon: '📥', category: 'Library', action: importSongs },
        { id: 'add-section', label: 'Add Section to Song', icon: '➕', category: 'Editor', action: () => selectedSong && addSongSection(selectedSong.id) },
        { id: 'save-section', label: 'Save Section Edits', icon: '💾', category: 'Editor', action: saveSectionEdits },
        { id: 'undo', label: 'Undo', icon: '↩', category: 'Editor', keywords: ['undo', 'back'], action: undo },
        { id: 'redo', label: 'Redo', icon: '↪', category: 'Editor', action: redo },
        { id: 'toggle-ndi', label: ndiEnabled ? 'Disable NDI' : 'Enable NDI', icon: '📡', category: 'Settings', action: toggleNdi },
        { id: 'sync-connect', label: syncConnected ? 'Disconnect Sync' : 'Connect Sync', icon: '🔗', category: 'Settings', action: syncConnected ? disconnectSync : connectSync },
    ];
    // ── Command bar ─────────────────────────────────────────────────────────────
    const renderRibbon = () => ((0, jsx_runtime_1.jsxs)("header", { className: "topbar ribbon", children: [(0, jsx_runtime_1.jsxs)("div", { className: "ribbon-row ribbon-main", children: [(0, jsx_runtime_1.jsxs)("div", { className: "topbar-context", children: [(0, jsx_runtime_1.jsx)("span", { className: "topbar-eyebrow", children: "WORSHIP PRESENTER / WORKSPACE" }), (0, jsx_runtime_1.jsxs)("div", { className: "screen-title", children: [(0, jsx_runtime_1.jsx)("strong", { children: PAGE_META[workspace].title }), (0, jsx_runtime_1.jsx)("small", { children: PAGE_META[workspace].subtitle })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "topbar-center-status", children: [(0, jsx_runtime_1.jsxs)("span", { className: `topbar-live-state ${isOnAir ? 'on-air' : ''}`, children: [(0, jsx_runtime_1.jsx)("span", { className: "topbar-live-dot" }), isOnAir ? 'ON AIR' : 'STANDBY'] }), (0, jsx_runtime_1.jsxs)("span", { className: "topbar-output-summary", children: [(0, jsx_runtime_1.jsx)("span", { className: `connected-dot ${activeOutputWindows.length ? '' : 'offline'}` }), activeOutputWindows.length ? `${activeOutputWindows.length} output${activeOutputWindows.length === 1 ? '' : 's'} connected` : 'No output windows'] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "topbar-actions", children: [(0, jsx_runtime_1.jsxs)("button", { className: "palette-trigger", onClick: () => setShowPalette(true), title: "Command Palette (Ctrl+K)", children: [(0, jsx_runtime_1.jsx)("span", { children: "Search" }), (0, jsx_runtime_1.jsx)("kbd", { children: "Ctrl K" })] }), (0, jsx_runtime_1.jsxs)("button", { className: "action-button dark", onClick: onBlack, title: "Black screen", children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "black", size: 14 }), " BLACK"] }), (0, jsx_runtime_1.jsxs)("button", { className: "action-button", onClick: onLogo, title: "Logo mode", children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "logo", size: 14 }), " LOGO"] }), (0, jsx_runtime_1.jsxs)("button", { className: "action-button", onClick: onClear, title: "Clear output override", children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "clear", size: 14 }), " CLEAR"] }), (0, jsx_runtime_1.jsxs)("button", { className: "action-button live", onClick: goLive, title: "Send preview live", children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "send", size: 14 }), " SEND LIVE"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "ribbon-row ribbon-tools", children: [(0, jsx_runtime_1.jsxs)("span", { className: "command-bar-label", children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "spark", size: 13 }), " Operator controls"] }), (workspace === 'console' || workspace === 'editor') && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("label", { className: "ribbon-control", children: [(0, jsx_runtime_1.jsx)("span", { children: "Left Pane" }), (0, jsx_runtime_1.jsx)("input", { type: "range", min: 240, max: 480, value: workspace === 'console' ? paneSizes.consoleLeft : paneSizes.editorLeft, onChange: (event) => {
                                            const value = Number(event.target.value);
                                            setPaneSizes((prev) => ({
                                                ...prev,
                                                ...(workspace === 'console' ? { consoleLeft: value } : { editorLeft: value }),
                                            }));
                                        } })] }), workspace === 'console' && ((0, jsx_runtime_1.jsxs)("label", { className: "ribbon-control", children: [(0, jsx_runtime_1.jsx)("span", { children: "Output Area" }), (0, jsx_runtime_1.jsx)("input", { type: "range", min: 150, max: 340, value: paneSizes.consoleBottom, onChange: (event) => setPaneSizes((prev) => ({ ...prev, consoleBottom: Number(event.target.value) })) })] })), workspace === 'editor' && ((0, jsx_runtime_1.jsxs)("label", { className: "ribbon-control", children: [(0, jsx_runtime_1.jsx)("span", { children: "Inspector Pane" }), (0, jsx_runtime_1.jsx)("input", { type: "range", min: 260, max: 460, value: paneSizes.editorRight, onChange: (event) => setPaneSizes((prev) => ({ ...prev, editorRight: Number(event.target.value) })) })] }))] })), workspace === 'editor' && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("button", { className: "soft-button", onClick: () => selectedSong && addSongSection(selectedSong.id), children: "Add Section" }), (0, jsx_runtime_1.jsx)("button", { className: "soft-button", onClick: saveSectionEdits, children: "Save Section" })] })), workspace === 'media' && ((0, jsx_runtime_1.jsx)("span", { className: "ribbon-note", children: "Tip: click asset for inspector, double-click to preview, then push live when ready." }))] })] }));
    // ── Render ─────────────────────────────────────────────────────────────────
    return ((0, jsx_runtime_1.jsxs)("div", { className: "app-shell", children: [(0, jsx_runtime_1.jsxs)("aside", { className: "app-sidebar", children: [(0, jsx_runtime_1.jsx)("div", { className: "brand-block", children: (0, jsx_runtime_1.jsxs)("div", { className: "brand-lockup", children: [(0, jsx_runtime_1.jsx)("span", { className: "brand-mark", children: (0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "spark", size: 18, strokeWidth: 2.2 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { children: "Worship Presenter" }), (0, jsx_runtime_1.jsxs)("p", { children: ["Present ", (0, jsx_runtime_1.jsx)("span", { children: "\u2022" }), " Worship ", (0, jsx_runtime_1.jsx)("span", { children: "\u2022" }), " Inspire"] })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "sidebar-section-label", children: "WORKSPACE" }), (0, jsx_runtime_1.jsx)("nav", { className: "sidebar-nav", "aria-label": "Primary navigation", children: NAV_ITEMS.map((item) => ((0, jsx_runtime_1.jsxs)("button", { className: `nav-button ${workspace === item.id ? 'active' : ''}`, onClick: () => setWorkspace(item.id), "aria-current": workspace === item.id ? 'page' : undefined, children: [(0, jsx_runtime_1.jsx)("span", { className: "nav-icon", children: (0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: item.icon, size: 17 }) }), (0, jsx_runtime_1.jsx)("span", { children: item.label })] }, item.id))) }), (0, jsx_runtime_1.jsxs)("div", { className: "sidebar-footer", children: [(0, jsx_runtime_1.jsx)("div", { className: "sidebar-section-label", children: "SUPPORT" }), (0, jsx_runtime_1.jsxs)("button", { className: `nav-button ${workspace === 'help' ? 'active' : ''}`, onClick: () => setWorkspace('help'), "aria-current": workspace === 'help' ? 'page' : undefined, children: [(0, jsx_runtime_1.jsx)("span", { className: "nav-icon", children: (0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "help", size: 17 }) }), (0, jsx_runtime_1.jsx)("span", { children: "Help & shortcuts" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sidebar-operator-card", children: [(0, jsx_runtime_1.jsx)("span", { className: "operator-avatar", children: "WP" }), (0, jsx_runtime_1.jsxs)("span", { className: "operator-copy", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Operator" }), (0, jsx_runtime_1.jsx)("small", { children: isOnAir ? 'Live session' : 'Ready to present' })] }), (0, jsx_runtime_1.jsx)("span", { className: `operator-status ${isOnAir ? 'live' : ''}` })] }), (0, jsx_runtime_1.jsxs)("button", { className: "live-button sidebar-go-live", onClick: goLive, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "send", size: 15 }), " Go Live"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "app-main", children: [renderRibbon(), (0, jsx_runtime_1.jsxs)("main", { className: "workspace", children: [workspace === 'console' && ((0, jsx_runtime_1.jsx)(ConsoleWorkspace_1.ConsoleWorkspace, { schedule: schedule, theme: theme, currentSlide: currentSlide, liveSlide: liveSlide, outputConfigs: outputConfigs, paneSizes: paneSizes, outputStates: outputStates, dragIndex: dragIndex, onDragStart: setDragIndex, onDrop: (idx) => { moveSchedule(dragIndex, idx); setDragIndex(null); notify('Schedule updated', 'Order changed', 'info'); }, onScheduleItemClick: (content) => { setCurrentSlide(content); }, onAddScheduleItem: () => { addScheduleItem(); notify('Schedule updated', 'New service item added', 'success'); }, onGoToEditor: () => setWorkspace('editor'), isOnAir: isOnAir, presentationPaused: presentationPaused, onGoLive: goLive, onClear: onClear, onLogo: onLogo, onBlack: onBlack, onTogglePause: togglePresentationPause, onEndLive: endLive })), workspace === 'library' && ((0, jsx_runtime_1.jsx)(LibraryWorkspace_1.LibraryWorkspace, { songs: songs, filteredSongs: filteredSongs, selectedSongId: selectedSongId, mediaAssets: mediaAssets, songSearchQuery: songSearchQuery, librarySort: librarySort, libraryViewMode: libraryViewMode, onSearchChange: setSongSearchQuery, onSortChange: setLibrarySort, onViewModeChange: setLibraryViewMode, onSelectSong: (id) => { setSelectedSongId(id); setWorkspace('editor'); }, onAddSong: () => { addSong(); setWorkspace('editor'); }, onImportSongs: importSongs, onRenameSong: async (song) => {
                                    const next = await showDialog({ type: 'prompt', title: 'Rename Song', defaultValue: song.title, confirmLabel: 'Rename' });
                                    if (typeof next === 'string' && next.trim()) {
                                        updateSongTitle(song.id, next.trim());
                                        if (song.id === selectedSongId)
                                            setSongTitleDraft(next.trim());
                                        notify('Song renamed', next.trim(), 'success');
                                    }
                                }, onDeleteSong: async (song) => {
                                    const confirmed = await showDialog({
                                        type: 'confirm', tone: 'danger',
                                        title: `Delete "${song.title}"?`,
                                        message: 'This will permanently delete the song and all its sections.',
                                        confirmLabel: 'Delete',
                                    });
                                    if (confirmed) {
                                        await deleteSong(song.id);
                                        notify('Song deleted', song.title, 'warn');
                                    }
                                } })), workspace === 'editor' && ((0, jsx_runtime_1.jsx)(EditorWorkspace_1.EditorWorkspace, { selectedSong: selectedSong, selectedSectionId: selectedSectionId, currentSlide: currentSlide, theme: theme, editorText: editorText, editorType: editorType, showChords: showChords, transposeSteps: transposeSteps, undoStack: undoStack, redoStack: redoStack, songTitleDraft: songTitleDraft, gradientStart: gradientStart, gradientEnd: gradientEnd, bgManagerTab: bgManagerTab, editorDragIndex: editorDragIndex, paneSizes: paneSizes, onEditorTextChange: setEditorText, onEditorTypeChange: setEditorType, onSongTitleDraftChange: setSongTitleDraft, onCommitSongTitle: commitSongTitle, onPickSection: pickSection, onAddSection: () => selectedSong && addSongSection(selectedSong.id), onDeleteSection: async (sectionId) => {
                                    const confirmed = await showDialog({
                                        type: 'confirm', tone: 'danger',
                                        title: 'Delete Section?',
                                        message: 'This will permanently remove this slide section.',
                                        confirmLabel: 'Delete',
                                    });
                                    if (confirmed && selectedSong)
                                        await deleteSongSection(selectedSong.id, sectionId);
                                }, onMoveSongSection: (from, to) => selectedSong && moveSongSection(selectedSong.id, from, to), onSetEditorDragIndex: setEditorDragIndex, onSetTransposeSteps: (fn) => setTransposeSteps(fn), onSetShowChords: (fn) => setShowChords(fn), onSetTheme: setTheme, onSetBgManagerTab: setBgManagerTab, onSetGradientStart: setGradientStart, onSetGradientEnd: setGradientEnd, onSaveSectionEdits: saveSectionEdits, onGoLive: goLive, onSaveTemplate: async () => {
                                    const name = await showDialog({ type: 'prompt', title: 'Save Template', defaultValue: 'My Template', confirmLabel: 'Save' });
                                    if (typeof name === 'string' && name.trim())
                                        saveTemplate(name.trim());
                                }, onUndo: undo, onRedo: redo, stripChordMarkup: stripChordMarkup, onNotify: notify })), workspace === 'scripture' && (0, jsx_runtime_1.jsx)(BiblePicker_1.BiblePicker, {}), workspace === 'media' && ((0, jsx_runtime_1.jsx)(MediaLibrary_1.MediaLibrary, { mediaType: mediaType, onMediaSelect: () => undefined, onSendToPreview: sendMediaToPreview, onSendToLive: sendMediaToLive, onNotify: notify })), workspace === 'settings' && ((0, jsx_runtime_1.jsx)(SettingsWorkspace_1.SettingsWorkspace, { theme: theme, outputConfigs: outputConfigs, looks: looks, ndiEnabled: ndiEnabled, syncConnected: syncConnected, syncUrl: syncUrl, aspectRatio: aspectRatio, overscanPercent: overscanPercent, outputResolution: outputResolution, outputHardware: outputHardware, activeOutputId: activeOutputId, themePresets: store_1.THEME_PRESETS, logoImage: logoImage, displays: displays, appVersion: appVersion, activeOutputWindows: activeOutputWindows, onSyncUrlChange: setSyncUrl, onConnectSync: connectSync, onDisconnectSync: disconnectSync, onSetAspectRatio: setAspectRatio, onSetOverscanPercent: setOverscanPercent, onSetOutputResolution: setOutputResolution, onSetActiveOutputId: setActiveOutputId, onUpdateOutputConfig: updateOutputConfig, onUpdateLook: updateLook, onToggleNdi: toggleNdi, onApplyPreset: applyPreset, onResetDisplay: () => {
                                    setAspectRatio('16:9');
                                    setOverscanPercent(5);
                                    setOutputResolution('1920x1080');
                                    notify('Display reset', 'Restored default geometry', 'info');
                                }, onApplyDisplayChanges: () => {
                                    window?.worship?.outputs?.actions?.fullscreen?.();
                                    notify('Display applied', `${outputResolution} ${aspectRatio}`, 'success');
                                }, onLogoImageChange: setLogoImage, onPickLogoFile: pickLogoFile, onNotify: notify, onRefreshOutputWindows: async () => {
                                    if (window.worship?.outputs?.list) {
                                        const list = await window.worship.outputs.list();
                                        setActiveOutputWindows(list || []);
                                    }
                                } })), workspace === 'help' && ((0, jsx_runtime_1.jsx)(HelpWorkspace_1.HelpWorkspace, { appVersion: appVersion, displayCount: displays.length, outputCount: activeOutputWindows.length }))] }), (0, jsx_runtime_1.jsx)(Notifications_1.Notifications, { items: toasts, onDismiss: (id) => setToasts((prev) => prev.filter((item) => item.id !== id)) })] }), appLoading && ((0, jsx_runtime_1.jsx)("div", { className: "app-loader-overlay", children: (0, jsx_runtime_1.jsxs)("div", { className: "app-loader-card", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Loading WorshipPresenter" }), (0, jsx_runtime_1.jsx)("span", { children: "Preparing songs, media, Bibles, and displays..." }), (0, jsx_runtime_1.jsx)("div", { className: "app-loader-bar", children: (0, jsx_runtime_1.jsx)("div", {}) })] }) })), showPalette && ((0, jsx_runtime_1.jsx)(CommandPalette_1.CommandPalette, { commands: paletteCommands, onClose: () => setShowPalette(false) }))] }));
};
// ─── Root with providers ──────────────────────────────────────────────────────
const App = () => ((0, jsx_runtime_1.jsx)(Dialog_1.DialogProvider, { children: (0, jsx_runtime_1.jsx)(AppInner, {}) }));
const mountPoint = document.getElementById('root');
const root = mountPoint ? (0, client_1.createRoot)(mountPoint) : null;
if (root)
    root.render((0, jsx_runtime_1.jsx)(App, {}));
