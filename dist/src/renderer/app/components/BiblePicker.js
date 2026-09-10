"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiblePicker = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const store_1 = require("../store");
const db_1 = require("../services/db");
const ui_1 = require("./ui");
const OT_BOOKS = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
    'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
    'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
];
const NT_BOOKS = [
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
    '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
    'Jude', 'Revelation'
];
const ALL_BOOKS = [...OT_BOOKS, ...NT_BOOKS];
const uniqueTranslations = (items) => {
    const seen = new Set();
    return items.filter((item) => {
        const code = String(item.code || '').trim().toUpperCase();
        if (!code || seen.has(code))
            return false;
        seen.add(code);
        return true;
    }).map((item) => ({ ...item, code: String(item.code).trim().toUpperCase() }));
};
const BiblePicker = () => {
    const setCurrentSlide = (0, store_1.useStore)((state) => state.setCurrentSlide);
    const setLiveSlide = (0, store_1.useStore)((state) => state.setLiveSlide);
    const liveSlide = (0, store_1.useStore)((state) => state.liveSlide);
    const [translations, setTranslations] = (0, react_1.useState)([]);
    const [selectedTranslation, setSelectedTranslation] = (0, react_1.useState)('');
    const [secondTranslation, setSecondTranslation] = (0, react_1.useState)('');
    const [selectedBook, setSelectedBook] = (0, react_1.useState)('Genesis');
    const [selectedChapter, setSelectedChapter] = (0, react_1.useState)(1);
    const [chapters, setChapters] = (0, react_1.useState)([]);
    const [verses, setVerses] = (0, react_1.useState)([]);
    const [secondVerses, setSecondVerses] = (0, react_1.useState)([]);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [searchResults, setSearchResults] = (0, react_1.useState)([]);
    const [importProgress, setImportProgress] = (0, react_1.useState)(null);
    const [onlineSources, setOnlineSources] = (0, react_1.useState)([]);
    const [downloadProgress, setDownloadProgress] = (0, react_1.useState)(null);
    const [downloadingCode, setDownloadingCode] = (0, react_1.useState)(null);
    const [showOnlinePanel, setShowOnlinePanel] = (0, react_1.useState)(false);
    const [isSearching, setIsSearching] = (0, react_1.useState)(false);
    const [dualMode, setDualMode] = (0, react_1.useState)(false);
    const [selectedVerse, setSelectedVerse] = (0, react_1.useState)(null);
    const [otExpanded, setOtExpanded] = (0, react_1.useState)(true);
    const [ntExpanded, setNtExpanded] = (0, react_1.useState)(false);
    const [toast, setToast] = (0, react_1.useState)(null);
    const [pendingVerseNumber, setPendingVerseNumber] = (0, react_1.useState)(null);
    const chapterRequestRef = react_1.default.useRef(0);
    const verseRequestRef = react_1.default.useRef(0);
    const secondVerseRequestRef = react_1.default.useRef(0);
    const refreshTranslations = async () => {
        const translationsList = await window.worship.bibles.listTranslations();
        const nextTranslations = uniqueTranslations(translationsList || []);
        setTranslations(nextTranslations);
        if (!nextTranslations.length) {
            setSelectedTranslation('');
            setSecondTranslation('');
            return nextTranslations;
        }
        setSelectedTranslation((current) => nextTranslations.some((item) => item.code === current) ? current : nextTranslations[0].code);
        setSecondTranslation((current) => {
            if (nextTranslations.some((item) => item.code === current) && current !== nextTranslations[0].code)
                return current;
            return nextTranslations.find((item) => item.code !== nextTranslations[0].code)?.code || '';
        });
        return nextTranslations;
    };
    // Load translations
    (0, react_1.useEffect)(() => {
        const loadBibleData = async () => {
            try {
                await refreshTranslations();
                const sources = await window.worship.bibles.getOnlineSources();
                if (sources?.length) {
                    setOnlineSources(sources);
                }
            }
            catch (error) {
                console.error('Failed to load translations:', error);
            }
        };
        loadBibleData();
    }, []);
    // Load chapters when book changes
    (0, react_1.useEffect)(() => {
        if (selectedBook) {
            const translation = translations.find((item) => item.code === selectedTranslation);
            loadChapters(selectedBook, translation?.id);
        }
    }, [selectedBook, selectedTranslation, translations]);
    // Load verses when chapter changes
    (0, react_1.useEffect)(() => {
        if (selectedBook && selectedChapter) {
            loadVerses(selectedBook, selectedChapter, selectedTranslation);
        }
    }, [selectedBook, selectedChapter, selectedTranslation, translations]);
    // Load second translation verses
    (0, react_1.useEffect)(() => {
        if (dualMode && secondTranslation && selectedBook && selectedChapter) {
            loadSecondVerses(selectedBook, selectedChapter, secondTranslation);
        }
        else {
            setSecondVerses([]);
        }
    }, [selectedBook, selectedChapter, secondTranslation, dualMode, translations]);
    (0, react_1.useEffect)(() => {
        if (!translations.length || secondTranslation !== selectedTranslation)
            return;
        const alternate = translations.find((item) => item.code !== selectedTranslation);
        setSecondTranslation(alternate?.code || '');
        setSecondVerses([]);
    }, [selectedTranslation, secondTranslation, translations]);
    (0, react_1.useEffect)(() => {
        setSelectedVerse(null);
        setVerses([]);
        setSecondVerses([]);
        setSearchResults([]);
    }, [selectedTranslation]);
    (0, react_1.useEffect)(() => {
        if (!window.worship?.bibles?.onDownloadProgress)
            return;
        const cleanup = window.worship.bibles.onDownloadProgress((payload) => {
            if (payload.translationCode === downloadingCode) {
                setDownloadProgress(payload.progress);
            }
        });
        return cleanup;
    }, [downloadingCode]);
    (0, react_1.useEffect)(() => {
        if (pendingVerseNumber == null || !verses.length)
            return;
        const verse = verses.find((item) => item.verse === pendingVerseNumber);
        if (verse) {
            handleVerseSelect(verse);
            setPendingVerseNumber(null);
        }
    }, [pendingVerseNumber, verses]);
    (0, react_1.useEffect)(() => {
        const onKeyDown = (event) => {
            if (!verses.length)
                return;
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (!selectedVerse)
                    return handleVerseSelect(verses[0]);
                const currentIndex = verses.findIndex((item) => item.verse === selectedVerse.verse);
                const nextIndex = Math.min(verses.length - 1, currentIndex + 1);
                handleVerseSelect(verses[nextIndex]);
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (!selectedVerse)
                    return handleVerseSelect(verses[0]);
                const currentIndex = verses.findIndex((item) => item.verse === selectedVerse.verse);
                const prevIndex = Math.max(0, currentIndex - 1);
                handleVerseSelect(verses[prevIndex]);
            }
            if (event.key === 'Enter' && selectedVerse) {
                event.preventDefault();
                sendToProjector();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [verses, selectedVerse]);
    const loadChapters = async (book, translationId) => {
        const requestId = chapterRequestRef.current + 1;
        chapterRequestRef.current = requestId;
        try {
            const chaptersList = await window.worship.bibles.getChapters(book, translationId);
            if (requestId !== chapterRequestRef.current)
                return;
            if (chaptersList && chaptersList.length) {
                setChapters(chaptersList);
                setSelectedChapter((current) => chaptersList.includes(current) ? current : chaptersList[0]);
            }
            else {
                setChapters([1]);
                setSelectedChapter(1);
            }
        }
        catch (error) {
            console.error('Failed to load chapters:', error);
            if (requestId !== chapterRequestRef.current)
                return;
            setChapters([1]);
            setSelectedChapter(1);
        }
    };
    const loadVerses = async (book, chapter, translationCode) => {
        const requestId = verseRequestRef.current + 1;
        verseRequestRef.current = requestId;
        try {
            const translation = translations.find((item) => item.code === translationCode);
            const versesList = await window.worship.bibles.getVerses(book, chapter, translation?.id);
            if (requestId === verseRequestRef.current)
                setVerses(versesList || []);
        }
        catch (error) {
            console.error('Failed to load verses:', error);
            if (requestId === verseRequestRef.current)
                setVerses([]);
        }
    };
    const loadSecondVerses = async (book, chapter, translationCode) => {
        const requestId = secondVerseRequestRef.current + 1;
        secondVerseRequestRef.current = requestId;
        try {
            const translation = translations.find((item) => item.code === translationCode);
            const versesList = await window.worship.bibles.getVerses(book, chapter, translation?.id);
            if (requestId === secondVerseRequestRef.current)
                setSecondVerses(versesList || []);
        }
        catch (error) {
            console.error('Failed to load second verses:', error);
            if (requestId === secondVerseRequestRef.current)
                setSecondVerses([]);
        }
    };
    const handleSearch = async () => {
        if (!searchQuery.trim())
            return;
        const ref = searchQuery.trim().match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
        if (ref) {
            const [, rawBook, rawChapter, rawVerse] = ref;
            const matchedBook = ALL_BOOKS.find((book) => book.toLowerCase() === rawBook.toLowerCase());
            if (matchedBook) {
                setSelectedBook(matchedBook);
                setSelectedChapter(Number(rawChapter));
                setSearchResults([]);
                if (rawVerse)
                    setPendingVerseNumber(Number(rawVerse));
                return;
            }
        }
        setIsSearching(true);
        try {
            const translation = translations.find(t => t.code === selectedTranslation);
            const results = await window.worship.bibles.search(searchQuery, translation?.id);
            setSearchResults(results || []);
        }
        catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        }
        finally {
            setIsSearching(false);
        }
    };
    const handleDownloadOnline = async (source) => {
        if (!source)
            return;
        if (source.available === false) {
            setToast({
                title: `${source.code} needs a license`,
                detail: source.license || 'Import an authorized OSIS file or configure a licensed API.'
            });
            return;
        }
        setDownloadingCode(source.code);
        setDownloadProgress(0);
        try {
            const result = await window.worship.bibles.downloadFromUrl({
                code: source.code,
                name: source.name,
                language: source.language,
                url: source.url,
                format: source.format
            });
            if (result.error) {
                setToast({ title: 'Download failed', detail: result.error });
            }
            else {
                setToast({ title: 'Bible downloaded', detail: `${source.name}: ${result.versesCount} verses` });
                await refreshTranslations();
            }
        }
        catch (e) {
            setToast({ title: 'Download failed', detail: e.message });
        }
        finally {
            setDownloadProgress(null);
            setDownloadingCode(null);
        }
    };
    const handleImportOsis = async () => {
        const filePath = await window.worship?.bibles?.openOsisFile?.();
        if (!filePath)
            return;
        const translationCodeToUse = prompt('Enter Bible translation code (e.g. NIV, KJV, ESV):');
        if (!translationCodeToUse || !translationCodeToUse.trim())
            return;
        const code = translationCodeToUse.trim().toUpperCase();
        let cleanup;
        if (window.worship?.bibles?.onImportProgress) {
            cleanup = window.worship.bibles.onImportProgress((payload) => {
                if (payload.translationCode === code) {
                    setImportProgress(payload.progress);
                }
            });
        }
        setImportProgress(0);
        try {
            const result = await window.worship.bibles.importFromOsis(code, 'en', filePath);
            if (result?.error)
                throw new Error(result.error);
            setImportProgress(null);
            setToast({ title: 'Bible import completed', detail: `${code} is ready` });
            await refreshTranslations();
        }
        catch (e) {
            console.error(e);
            setImportProgress(null);
            setToast({ title: 'Bible import failed', detail: e.message });
        }
        finally {
            if (cleanup)
                cleanup();
        }
    };
    const handleImportEasyWorship = async () => {
        const filePath = await window.worship?.bibles?.openEasyWorshipFile?.();
        if (!filePath)
            return;
        const translationCodeToUse = prompt('Enter Bible translation code (e.g. NIV, KJV, ESV):');
        if (!translationCodeToUse || !translationCodeToUse.trim())
            return;
        const code = translationCodeToUse.trim().toUpperCase();
        let cleanup;
        if (window.worship?.bibles?.onImportProgress) {
            cleanup = window.worship.bibles.onImportProgress((payload) => {
                if (payload.translationCode === code) {
                    setImportProgress(payload.progress);
                }
            });
        }
        setImportProgress(0);
        try {
            const result = await window.worship.bibles.importFromEasyWorship(code, 'en', filePath);
            if (result?.error)
                throw new Error(result.error);
            setToast({ title: 'EasyWorship Bible imported', detail: `${code} is ready` });
            await refreshTranslations();
        }
        catch (e) {
            setToast({ title: 'EWB import failed', detail: e.message });
        }
        finally {
            setImportProgress(null);
            if (cleanup)
                cleanup();
        }
    };
    const handleImportXmlPack = async () => {
        const filePaths = await window.worship?.bibles?.openXmlFiles?.();
        if (!filePaths?.length || !window.worship?.bibles?.importXmlFiles)
            return;
        let cleanup;
        if (window.worship?.bibles?.onImportProgress) {
            cleanup = window.worship.bibles.onImportProgress((payload) => {
                if (payload?.progress != null)
                    setImportProgress(Number(payload.progress));
            });
        }
        setImportProgress(0);
        try {
            const results = await window.worship.bibles.importXmlFiles(filePaths);
            const imported = (results || []).filter((result) => result && !result.error && !result.skipped);
            const skipped = (results || []).filter((result) => result?.skipped);
            const failed = (results || []).filter((result) => result?.error);
            await refreshTranslations();
            setToast({
                title: 'Bible translations loaded',
                detail: `${imported.length} imported${skipped.length ? `, ${skipped.length} duplicate${skipped.length === 1 ? '' : 's'} skipped` : ''}${failed.length ? `, ${failed.length} failed` : ''}`,
            });
        }
        catch (error) {
            setToast({ title: 'Bible pack import failed', detail: error.message });
        }
        finally {
            setImportProgress(null);
            cleanup?.();
        }
    };
    const getVerseContext = (verse) => ({
        book: verse?.book || selectedBook,
        chapter: Number(verse?.chapter || selectedChapter),
    });
    const buildVerseSlide = (verse) => {
        const context = getVerseContext(verse);
        const mainLabel = selectedTranslation.toUpperCase() || 'TEXT';
        const lines = [
            `${context.book} ${context.chapter}:${verse.verse}`,
            `${mainLabel}: ${verse.text}`,
        ];
        if (dualMode && secondTranslation && secondTranslation !== selectedTranslation) {
            const secondary = secondVerses.find((item) => item.verse === verse.verse);
            if (secondary?.text)
                lines.push(`${secondTranslation.toUpperCase()}: ${secondary.text}`);
        }
        return lines.join('\n\n');
    };
    const handleVerseSelect = (verse) => {
        const context = getVerseContext(verse);
        setSelectedVerse(verse);
        if (verse?.book)
            setSelectedBook(context.book);
        if (verse?.chapter)
            setSelectedChapter(context.chapter);
        setCurrentSlide(buildVerseSlide(verse));
    };
    const sendVerseToProjector = async (verse) => {
        if (!verse)
            return;
        const context = getVerseContext(verse);
        const slideText = buildVerseSlide(verse);
        setCurrentSlide(slideText);
        setLiveSlide(slideText);
        let OUTPUT_IDS = [1, 2];
        try {
            const windows = await window?.worship?.outputs?.list?.();
            if (Array.isArray(windows) && windows.length) {
                OUTPUT_IDS = windows.map((item) => Number(item.id)).filter(Boolean);
            }
        }
        catch {
            // keep fallback outputs
        }
        OUTPUT_IDS.forEach((id) => window?.worship?.outputs?.setState?.(id, { slideTitle: slideText }));
        setToast({ title: 'Verse sent live', detail: `${context.book} ${context.chapter}:${verse.verse} · ${selectedTranslation.toUpperCase()}` });
    };
    const sendToProjector = async () => {
        await sendVerseToProjector(selectedVerse);
    };
    const handleVerseDoubleClick = (verse) => {
        handleVerseSelect(verse);
        void sendVerseToProjector(verse);
    };
    const addToSchedule = async () => {
        if (!selectedVerse)
            return;
        try {
            const context = getVerseContext(selectedVerse);
            const content = `${context.book} ${context.chapter}:${selectedVerse.verse} - ${selectedVerse.text}`;
            await db_1.dbService.schedule.addItem('scripture', content);
            // Reload schedule items in Zustand store
            const nextItems = await db_1.dbService.schedule.getItems();
            store_1.useStore.setState({ schedule: nextItems });
            setToast({ title: 'Added to schedule', detail: `${context.book} ${context.chapter}:${selectedVerse.verse}` });
        }
        catch (error) {
            console.error('Failed to add to schedule:', error);
        }
    };
    const wordCount = selectedVerse ? selectedVerse.text.split(/\s+/).filter(Boolean).length : 0;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "workspace-grid workspace-scripture", children: [(0, jsx_runtime_1.jsxs)("aside", { className: "panel explorer-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bible-pack-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bible-pack-heading", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "panel-eyebrow", children: "TRANSLATION PACK" }), (0, jsx_runtime_1.jsx)("strong", { children: "English Bible XML" })] }), (0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "globe", size: 16 })] }), (0, jsx_runtime_1.jsx)("p", { children: "Import multiple numbered Bible XML files at once. Translation codes are detected automatically and duplicate versions are skipped." }), (0, jsx_runtime_1.jsxs)("button", { className: "live-button full", onClick: handleImportXmlPack, disabled: importProgress !== null, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "upload", size: 14 }), " ", importProgress !== null ? `Loading XML (${importProgress}%)` : 'Load Bible XML set'] }), (0, jsx_runtime_1.jsx)("small", { className: "bible-pack-codes", children: "TPT \u00B7 NIV \u00B7 GW \u00B7 GNT \u00B7 EASY \u00B7 AMPC \u00B7 AMP \u00B7 TLB \u00B7 NLT" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "import-osis-row", children: [(0, jsx_runtime_1.jsxs)("button", { className: "live-button full", onClick: handleImportOsis, disabled: importProgress !== null, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "upload", size: 14 }), " ", importProgress !== null ? `Importing (${importProgress}%)` : 'Import OSIS Bible'] }), importProgress !== null && ((0, jsx_runtime_1.jsx)("div", { style: { width: '100%', height: 6, backgroundColor: '#334155', borderRadius: 3, marginTop: 6, overflow: 'hidden' }, children: (0, jsx_runtime_1.jsx)("div", { style: { width: `${importProgress}%`, height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.2s ease-in-out' } }) }))] }), (0, jsx_runtime_1.jsx)("div", { className: "import-osis-row", style: { marginTop: 6 }, children: (0, jsx_runtime_1.jsxs)("button", { className: "soft-button full", onClick: handleImportEasyWorship, disabled: importProgress !== null, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "upload", size: 14 }), " Import EasyWorship EWB"] }) }), (0, jsx_runtime_1.jsx)("div", { className: "import-osis-row", style: { marginTop: 6 }, children: (0, jsx_runtime_1.jsxs)("button", { className: "soft-button full", onClick: () => setShowOnlinePanel(!showOnlinePanel), children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "globe", size: 14 }), " ", showOnlinePanel ? 'Hide Online Bibles' : 'Download Bible Online'] }) }), showOnlinePanel && ((0, jsx_runtime_1.jsxs)("div", { className: "online-bibles-panel", children: [downloadProgress !== null && downloadingCode && ((0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: 8 }, children: [(0, jsx_runtime_1.jsxs)("small", { style: { color: 'var(--text-muted)' }, children: ["Downloading ", downloadingCode, "... (", downloadProgress, "%)"] }), (0, jsx_runtime_1.jsx)("div", { style: { width: '100%', height: 6, backgroundColor: '#334155', borderRadius: 3, marginTop: 4, overflow: 'hidden' }, children: (0, jsx_runtime_1.jsx)("div", { style: { width: `${downloadProgress}%`, height: '100%', backgroundColor: '#22c55e', transition: 'width 0.2s ease-in-out' } }) })] })), (0, jsx_runtime_1.jsx)("div", { className: "online-sources-list", children: onlineSources.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { style: { padding: 8, color: 'var(--text-muted)', fontSize: '0.75rem' }, children: "No online sources available." })) : (onlineSources.map((source, idx) => {
                                    const isInstalled = translations.some(t => t.code === source.code);
                                    const isDownloading = downloadingCode === source.code;
                                    return ((0, jsx_runtime_1.jsxs)("div", { className: `online-source-row ${source.available === false ? 'restricted' : ''}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "online-source-info", children: [(0, jsx_runtime_1.jsx)("strong", { children: source.name }), (0, jsx_runtime_1.jsxs)("small", { children: [source.code, " \u00B7 ", source.language, " \u00B7 ", source.license || 'Direct download'] })] }), isInstalled ? ((0, jsx_runtime_1.jsx)("span", { className: "installed-badge", children: "Installed" })) : source.available === false ? ((0, jsx_runtime_1.jsx)("button", { className: "soft-button", onClick: () => handleDownloadOnline(source), title: source.infoUrl || source.url, children: "Source" })) : ((0, jsx_runtime_1.jsx)("button", { className: "soft-button", disabled: isDownloading, onClick: () => handleDownloadOnline(source), children: isDownloading ? `${downloadProgress}%` : 'Download' }))] }, idx));
                                })) })] })), (0, jsx_runtime_1.jsxs)("div", { className: "explorer-section-header", onClick: () => setOtExpanded(!otExpanded), children: [(0, jsx_runtime_1.jsx)("span", { className: `chevron ${otExpanded ? 'open' : ''}`, children: "\u25B6" }), "Old Testament"] }), otExpanded && ((0, jsx_runtime_1.jsx)("div", { className: "book-list", children: OT_BOOKS.map(book => ((0, jsx_runtime_1.jsx)("button", { className: `book-item ${selectedBook === book ? 'active' : ''}`, onClick: () => { setSelectedBook(book); setSelectedVerse(null); setSearchResults([]); }, children: book }, book))) })), (0, jsx_runtime_1.jsxs)("div", { className: "explorer-section-header", onClick: () => setNtExpanded(!ntExpanded), children: [(0, jsx_runtime_1.jsx)("span", { className: `chevron ${ntExpanded ? 'open' : ''}`, children: "\u25B6" }), "New Testament"] }), ntExpanded && ((0, jsx_runtime_1.jsx)("div", { className: "book-list", children: NT_BOOKS.map(book => ((0, jsx_runtime_1.jsx)("button", { className: `book-item ${selectedBook === book ? 'active' : ''}`, onClick: () => { setSelectedBook(book); setSelectedVerse(null); setSearchResults([]); }, children: book }, book))) }))] }), (0, jsx_runtime_1.jsxs)("section", { className: "panel scripture-content-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "scripture-search-bar", children: [(0, jsx_runtime_1.jsx)("span", { className: "search-icon", children: (0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "search", size: 16 }) }), (0, jsx_runtime_1.jsx)("input", { className: "scripture-search-input", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleSearch(), placeholder: `${selectedBook} 1:1` }), (0, jsx_runtime_1.jsxs)("select", { className: "translation-selector", value: selectedTranslation, onChange: (e) => {
                                    setSelectedTranslation(e.target.value);
                                    setSelectedVerse(null);
                                    setVerses([]);
                                    setSecondVerses([]);
                                    setSearchResults([]);
                                }, "aria-label": "Bible translation", children: [!translations.length && (0, jsx_runtime_1.jsx)("option", { value: "", children: "No versions loaded" }), translations.map(t => (0, jsx_runtime_1.jsxs)("option", { value: t.code, children: [t.code.toUpperCase(), " \u00B7 ", t.name] }, t.code))] }), (0, jsx_runtime_1.jsxs)("label", { style: { display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer' }, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: dualMode, onChange: (e) => setDualMode(e.target.checked), style: { borderRadius: 4 } }), "Dual"] }), dualMode && ((0, jsx_runtime_1.jsx)("select", { className: "translation-selector", value: secondTranslation, onChange: (e) => {
                                    setSecondTranslation(e.target.value);
                                    setSecondVerses([]);
                                }, "aria-label": "Second Bible translation", children: translations.filter((item) => item.code !== selectedTranslation).map(t => (0, jsx_runtime_1.jsxs)("option", { value: t.code, children: [t.code.toUpperCase(), " \u00B7 ", t.name] }, t.code)) }))] }), (0, jsx_runtime_1.jsx)("h2", { className: "scripture-book-title", children: selectedBook }), (0, jsx_runtime_1.jsx)("p", { className: "scripture-book-subtitle", children: "Select a chapter to begin" }), (0, jsx_runtime_1.jsx)("div", { className: "chapter-chip-grid", children: chapters.map(ch => ((0, jsx_runtime_1.jsx)("button", { className: `chapter-chip ${selectedChapter === ch ? 'active' : ''}`, onClick: () => { setSelectedChapter(ch); setSelectedVerse(null); setSearchResults([]); }, children: ch }, ch))) }), (0, jsx_runtime_1.jsxs)("div", { className: "verse-reader", children: [verses.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "verse-chapter-label", children: [(0, jsx_runtime_1.jsxs)("span", { className: "verse-chapter-pill", children: ["Chapter ", selectedChapter] }), (0, jsx_runtime_1.jsx)("span", { className: "verse-chapter-pill", children: selectedTranslation.toUpperCase() })] })), searchResults.length > 0 ? (searchResults.map((result, idx) => ((0, jsx_runtime_1.jsxs)("div", { className: `verse-row ${selectedVerse === result ? 'selected' : ''}`, onClick: () => handleVerseSelect(result), onDoubleClick: () => handleVerseDoubleClick(result), title: "Click to preview \u00B7 double-click to send live", children: [(0, jsx_runtime_1.jsx)("span", { className: "verse-number", children: result.verse }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.72rem', color: 'var(--primary)', marginBottom: 4 }, children: [result.book, " ", result.chapter, ":", result.verse] }), (0, jsx_runtime_1.jsx)("div", { className: "verse-text", children: result.text })] })] }, idx)))) : verses.length > 0 ? (verses.map((verse, index) => ((0, jsx_runtime_1.jsxs)("div", { className: `verse-row ${selectedVerse?.verse === verse.verse ? 'selected' : ''}`, onClick: () => handleVerseSelect(verse), onDoubleClick: () => handleVerseDoubleClick(verse), title: "Click to preview \u00B7 double-click to send live", children: [(0, jsx_runtime_1.jsx)("span", { className: "verse-number", children: verse.verse }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)("div", { className: "verse-text", children: verse.text }), dualMode && secondVerses.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "verse-text-secondary", children: secondVerses.find(v => v.verse === verse.verse)?.text }))] }), (0, jsx_runtime_1.jsx)("div", { className: "verse-row-hotkeys", children: selectedVerse?.verse === verse.verse ? ((0, jsx_runtime_1.jsxs)("button", { className: "soft-button", onClick: (event) => { event.stopPropagation(); sendToProjector(); }, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "send", size: 13 }), " Live"] })) : ((0, jsx_runtime_1.jsxs)("button", { className: "soft-button", onClick: (event) => {
                                                event.stopPropagation();
                                                if (index + 1 < verses.length)
                                                    handleVerseSelect(verses[index + 1]);
                                            }, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "chevron", size: 13 }), " Next"] })) })] }, verse.verse)))) : ((0, jsx_runtime_1.jsxs)("div", { style: { textAlign: 'center', padding: 40, color: 'var(--text-muted)' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '2rem', marginBottom: 8 }, children: "\uD83D\uDCD6" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.85rem' }, children: "Select a book and chapter to view verses" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.72rem', marginTop: 4 }, children: "Or search for specific text" })] }))] })] }), (0, jsx_runtime_1.jsxs)("aside", { className: "panel scripture-inspector", children: [(0, jsx_runtime_1.jsxs)("div", { className: "inspector-header", children: [(0, jsx_runtime_1.jsx)("h3", { className: "inspector-title", children: "Inspector" }), liveSlide && liveSlide.includes(selectedBook) && ((0, jsx_runtime_1.jsxs)("div", { className: "inspector-live-pill", children: [(0, jsx_runtime_1.jsx)("span", { className: "dot" }), " LIVE NOW"] }))] }), selectedVerse ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "verse-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "verse-card-label", children: "Currently Selected" }), (0, jsx_runtime_1.jsxs)("div", { className: "verse-card-ref", children: [selectedBook, " ", selectedChapter, ":", selectedVerse.verse] }), (0, jsx_runtime_1.jsxs)("div", { className: "verse-card-text", children: ["\"", selectedVerse.text, "\""] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "inspector-actions", children: [(0, jsx_runtime_1.jsxs)("div", { className: "inspector-button-row", children: [(0, jsx_runtime_1.jsx)("button", { className: "ghost-button", onClick: () => { }, children: "Edit Theme" }), (0, jsx_runtime_1.jsx)("button", { className: "ghost-button", onClick: () => { }, children: "Share" })] }), (0, jsx_runtime_1.jsxs)("button", { className: "send-projector-btn", onClick: sendToProjector, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "send", size: 15 }), " Send to Projector"] }), (0, jsx_runtime_1.jsxs)("button", { className: "ghost-button", onClick: addToSchedule, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "queue", size: 15 }), " Add to Schedule"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "inspector-meta-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Word Count" }), (0, jsx_runtime_1.jsx)("div", { className: "meta-card-value", children: wordCount })] }), (0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Style" }), (0, jsx_runtime_1.jsx)("div", { className: "meta-card-value", children: "Lyric Bold" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Motion" }), (0, jsx_runtime_1.jsx)("div", { className: "meta-card-value", children: "Static" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Translation" }), (0, jsx_runtime_1.jsx)("div", { className: "meta-card-value", children: selectedTranslation.toUpperCase() })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "projection-preview", children: [(0, jsx_runtime_1.jsxs)("div", { className: "preview-text", children: [selectedVerse.text.slice(0, 80), selectedVerse.text.length > 80 ? '...' : ''] }), (0, jsx_runtime_1.jsx)("span", { className: "preview-label", children: "Preview" })] })] })) : ((0, jsx_runtime_1.jsxs)("div", { style: { padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '2rem', marginBottom: 8 }, children: "\uD83D\uDCD6" }), "Select a verse to see details and send to projector"] })), toast && ((0, jsx_runtime_1.jsx)("div", { style: { padding: '8px 14px 14px' }, children: (0, jsx_runtime_1.jsxs)("div", { className: "ui-inline-notice", children: [(0, jsx_runtime_1.jsx)("strong", { children: toast.title }), toast.detail ? (0, jsx_runtime_1.jsx)("small", { children: toast.detail }) : null] }) }))] })] }));
};
exports.BiblePicker = BiblePicker;
