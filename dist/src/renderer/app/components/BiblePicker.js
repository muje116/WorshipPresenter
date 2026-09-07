"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiblePicker = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
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
    // Load translations
    (0, react_1.useEffect)(() => {
        const loadBibleData = async () => {
            try {
                const translationsList = await window.worship.bibles.listTranslations();
                if (translationsList && translationsList.length) {
                    setTranslations(translationsList);
                    setSelectedTranslation(translationsList[0]?.code || '');
                    if (translationsList.length > 1) {
                        setSecondTranslation(translationsList[1]?.code || '');
                    }
                }
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
            loadChapters(selectedBook);
        }
    }, [selectedBook]);
    // Load verses when chapter changes
    (0, react_1.useEffect)(() => {
        if (selectedBook && selectedChapter) {
            loadVerses();
        }
    }, [selectedChapter, selectedTranslation]);
    // Load second translation verses
    (0, react_1.useEffect)(() => {
        if (dualMode && secondTranslation && selectedBook && selectedChapter) {
            loadSecondVerses();
        }
    }, [selectedChapter, secondTranslation, dualMode]);
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
    const loadChapters = async (book) => {
        try {
            const chaptersList = await window.worship.bibles.getChapters(book);
            if (chaptersList && chaptersList.length) {
                setChapters(chaptersList);
                setSelectedChapter(chaptersList[0]);
            }
            else {
                setChapters([1]);
                setSelectedChapter(1);
            }
        }
        catch (error) {
            console.error('Failed to load chapters:', error);
            setChapters([1]);
            setSelectedChapter(1);
        }
    };
    const loadVerses = async () => {
        try {
            const translation = translations.find(t => t.code === selectedTranslation);
            const versesList = await window.worship.bibles.getVerses(selectedBook, selectedChapter, translation?.id);
            setVerses(versesList || []);
        }
        catch (error) {
            console.error('Failed to load verses:', error);
            setVerses([]);
        }
    };
    const loadSecondVerses = async () => {
        try {
            const translation = translations.find(t => t.code === secondTranslation);
            const versesList = await window.worship.bibles.getVerses(selectedBook, selectedChapter, translation?.id);
            setSecondVerses(versesList || []);
        }
        catch (error) {
            console.error('Failed to load second verses:', error);
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
                const translationsList = await window.worship.bibles.listTranslations();
                if (translationsList && translationsList.length) {
                    setTranslations(translationsList);
                }
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
            const translationsList = await window.worship.bibles.listTranslations();
            if (translationsList && translationsList.length) {
                setTranslations(translationsList);
            }
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
            const translationsList = await window.worship.bibles.listTranslations();
            if (translationsList && translationsList.length)
                setTranslations(translationsList);
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
    const handleVerseSelect = (verse) => {
        setSelectedVerse(verse);
        const slideText = `${selectedBook} ${selectedChapter}:${verse.verse}\n\n${verse.text}`;
        setCurrentSlide(slideText);
    };
    const sendToProjector = async () => {
        if (!selectedVerse)
            return;
        const slideText = `${selectedBook} ${selectedChapter}:${selectedVerse.verse}\n\n${selectedVerse.text}`;
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
        setToast({ title: 'Verse sent live', detail: `${selectedBook} ${selectedChapter}:${selectedVerse.verse}` });
    };
    const addToSchedule = async () => {
        if (!selectedVerse)
            return;
        try {
            const content = `${selectedBook} ${selectedChapter}:${selectedVerse.verse} - ${selectedVerse.text}`;
            await db_1.dbService.schedule.addItem('scripture', content);
            // Reload schedule items in Zustand store
            const nextItems = await db_1.dbService.schedule.getItems();
            store_1.useStore.setState({ schedule: nextItems });
            setToast({ title: 'Added to schedule', detail: `${selectedBook} ${selectedChapter}:${selectedVerse.verse}` });
        }
        catch (error) {
            console.error('Failed to add to schedule:', error);
        }
    };
    const wordCount = selectedVerse ? selectedVerse.text.split(/\s+/).filter(Boolean).length : 0;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "workspace-grid workspace-scripture", children: [(0, jsx_runtime_1.jsxs)("aside", { className: "panel explorer-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "import-osis-row", children: [(0, jsx_runtime_1.jsxs)("button", { className: "live-button full", onClick: handleImportOsis, disabled: importProgress !== null, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "upload", size: 14 }), " ", importProgress !== null ? `Importing (${importProgress}%)` : 'Import OSIS Bible'] }), importProgress !== null && ((0, jsx_runtime_1.jsx)("div", { style: { width: '100%', height: 6, backgroundColor: '#334155', borderRadius: 3, marginTop: 6, overflow: 'hidden' }, children: (0, jsx_runtime_1.jsx)("div", { style: { width: `${importProgress}%`, height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.2s ease-in-out' } }) }))] }), (0, jsx_runtime_1.jsx)("div", { className: "import-osis-row", style: { marginTop: 6 }, children: (0, jsx_runtime_1.jsxs)("button", { className: "soft-button full", onClick: handleImportEasyWorship, disabled: importProgress !== null, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "upload", size: 14 }), " Import EasyWorship EWB"] }) }), (0, jsx_runtime_1.jsx)("div", { className: "import-osis-row", style: { marginTop: 6 }, children: (0, jsx_runtime_1.jsxs)("button", { className: "soft-button full", onClick: () => setShowOnlinePanel(!showOnlinePanel), children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "globe", size: 14 }), " ", showOnlinePanel ? 'Hide Online Bibles' : 'Download Bible Online'] }) }), showOnlinePanel && ((0, jsx_runtime_1.jsxs)("div", { className: "online-bibles-panel", children: [downloadProgress !== null && downloadingCode && ((0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: 8 }, children: [(0, jsx_runtime_1.jsxs)("small", { style: { color: 'var(--text-muted)' }, children: ["Downloading ", downloadingCode, "... (", downloadProgress, "%)"] }), (0, jsx_runtime_1.jsx)("div", { style: { width: '100%', height: 6, backgroundColor: '#334155', borderRadius: 3, marginTop: 4, overflow: 'hidden' }, children: (0, jsx_runtime_1.jsx)("div", { style: { width: `${downloadProgress}%`, height: '100%', backgroundColor: '#22c55e', transition: 'width 0.2s ease-in-out' } }) })] })), (0, jsx_runtime_1.jsx)("div", { className: "online-sources-list", children: onlineSources.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { style: { padding: 8, color: 'var(--text-muted)', fontSize: '0.75rem' }, children: "No online sources available." })) : (onlineSources.map((source, idx) => {
                                    const isInstalled = translations.some(t => t.code === source.code);
                                    const isDownloading = downloadingCode === source.code;
                                    return ((0, jsx_runtime_1.jsxs)("div", { className: `online-source-row ${source.available === false ? 'restricted' : ''}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "online-source-info", children: [(0, jsx_runtime_1.jsx)("strong", { children: source.name }), (0, jsx_runtime_1.jsxs)("small", { children: [source.code, " \u00B7 ", source.language, " \u00B7 ", source.license || 'Direct download'] })] }), isInstalled ? ((0, jsx_runtime_1.jsx)("span", { className: "installed-badge", children: "Installed" })) : source.available === false ? ((0, jsx_runtime_1.jsx)("button", { className: "soft-button", onClick: () => handleDownloadOnline(source), title: source.infoUrl || source.url, children: "Source" })) : ((0, jsx_runtime_1.jsx)("button", { className: "soft-button", disabled: isDownloading, onClick: () => handleDownloadOnline(source), children: isDownloading ? `${downloadProgress}%` : 'Download' }))] }, idx));
                                })) })] })), (0, jsx_runtime_1.jsxs)("div", { className: "explorer-section-header", onClick: () => setOtExpanded(!otExpanded), children: [(0, jsx_runtime_1.jsx)("span", { className: `chevron ${otExpanded ? 'open' : ''}`, children: "\u25B6" }), "Old Testament"] }), otExpanded && ((0, jsx_runtime_1.jsx)("div", { className: "book-list", children: OT_BOOKS.map(book => ((0, jsx_runtime_1.jsx)("button", { className: `book-item ${selectedBook === book ? 'active' : ''}`, onClick: () => { setSelectedBook(book); setSelectedVerse(null); setSearchResults([]); }, children: book }, book))) })), (0, jsx_runtime_1.jsxs)("div", { className: "explorer-section-header", onClick: () => setNtExpanded(!ntExpanded), children: [(0, jsx_runtime_1.jsx)("span", { className: `chevron ${ntExpanded ? 'open' : ''}`, children: "\u25B6" }), "New Testament"] }), ntExpanded && ((0, jsx_runtime_1.jsx)("div", { className: "book-list", children: NT_BOOKS.map(book => ((0, jsx_runtime_1.jsx)("button", { className: `book-item ${selectedBook === book ? 'active' : ''}`, onClick: () => { setSelectedBook(book); setSelectedVerse(null); setSearchResults([]); }, children: book }, book))) }))] }), (0, jsx_runtime_1.jsxs)("section", { className: "panel scripture-content-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "scripture-search-bar", children: [(0, jsx_runtime_1.jsx)("span", { className: "search-icon", children: (0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "search", size: 16 }) }), (0, jsx_runtime_1.jsx)("input", { className: "scripture-search-input", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleSearch(), placeholder: `${selectedBook} 1:1` }), (0, jsx_runtime_1.jsx)("select", { className: "translation-selector", value: selectedTranslation, onChange: (e) => setSelectedTranslation(e.target.value), children: translations.map(t => (0, jsx_runtime_1.jsx)("option", { value: t.code, children: t.code.toUpperCase() }, t.code)) }), (0, jsx_runtime_1.jsxs)("label", { style: { display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer' }, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: dualMode, onChange: (e) => setDualMode(e.target.checked), style: { borderRadius: 4 } }), "Dual"] }), dualMode && ((0, jsx_runtime_1.jsx)("select", { className: "translation-selector", value: secondTranslation, onChange: (e) => setSecondTranslation(e.target.value), children: translations.map(t => (0, jsx_runtime_1.jsx)("option", { value: t.code, children: t.code.toUpperCase() }, t.code)) }))] }), (0, jsx_runtime_1.jsx)("h2", { className: "scripture-book-title", children: selectedBook }), (0, jsx_runtime_1.jsx)("p", { className: "scripture-book-subtitle", children: "Select a chapter to begin" }), (0, jsx_runtime_1.jsx)("div", { className: "chapter-chip-grid", children: chapters.map(ch => ((0, jsx_runtime_1.jsx)("button", { className: `chapter-chip ${selectedChapter === ch ? 'active' : ''}`, onClick: () => { setSelectedChapter(ch); setSelectedVerse(null); setSearchResults([]); }, children: ch }, ch))) }), (0, jsx_runtime_1.jsxs)("div", { className: "verse-reader", children: [verses.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "verse-chapter-label", children: [(0, jsx_runtime_1.jsxs)("span", { className: "verse-chapter-pill", children: ["Chapter ", selectedChapter] }), (0, jsx_runtime_1.jsx)("span", { className: "verse-chapter-pill", children: selectedTranslation.toUpperCase() })] })), searchResults.length > 0 ? (searchResults.map((result, idx) => ((0, jsx_runtime_1.jsxs)("div", { className: `verse-row ${selectedVerse === result ? 'selected' : ''}`, onClick: () => handleVerseSelect(result), children: [(0, jsx_runtime_1.jsx)("span", { className: "verse-number", children: result.verse }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.72rem', color: 'var(--primary)', marginBottom: 4 }, children: [result.book, " ", result.chapter, ":", result.verse] }), (0, jsx_runtime_1.jsx)("div", { className: "verse-text", children: result.text })] })] }, idx)))) : verses.length > 0 ? (verses.map((verse, index) => ((0, jsx_runtime_1.jsxs)("div", { className: `verse-row ${selectedVerse?.verse === verse.verse ? 'selected' : ''}`, onClick: () => handleVerseSelect(verse), children: [(0, jsx_runtime_1.jsx)("span", { className: "verse-number", children: verse.verse }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)("div", { className: "verse-text", children: verse.text }), dualMode && secondVerses.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "verse-text-secondary", children: secondVerses.find(v => v.verse === verse.verse)?.text }))] }), (0, jsx_runtime_1.jsx)("div", { className: "verse-row-hotkeys", children: selectedVerse?.verse === verse.verse ? ((0, jsx_runtime_1.jsxs)("button", { className: "soft-button", onClick: (event) => { event.stopPropagation(); sendToProjector(); }, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "send", size: 13 }), " Live"] })) : ((0, jsx_runtime_1.jsxs)("button", { className: "soft-button", onClick: (event) => {
                                                event.stopPropagation();
                                                handleVerseSelect(verse);
                                                if (index + 1 < verses.length)
                                                    handleVerseSelect(verses[index + 1]);
                                            }, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "chevron", size: 13 }), " Next"] })) })] }, verse.verse)))) : ((0, jsx_runtime_1.jsxs)("div", { style: { textAlign: 'center', padding: 40, color: 'var(--text-muted)' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '2rem', marginBottom: 8 }, children: "\uD83D\uDCD6" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.85rem' }, children: "Select a book and chapter to view verses" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.72rem', marginTop: 4 }, children: "Or search for specific text" })] }))] })] }), (0, jsx_runtime_1.jsxs)("aside", { className: "panel scripture-inspector", children: [(0, jsx_runtime_1.jsxs)("div", { className: "inspector-header", children: [(0, jsx_runtime_1.jsx)("h3", { className: "inspector-title", children: "Inspector" }), liveSlide && liveSlide.includes(selectedBook) && ((0, jsx_runtime_1.jsxs)("div", { className: "inspector-live-pill", children: [(0, jsx_runtime_1.jsx)("span", { className: "dot" }), " LIVE NOW"] }))] }), selectedVerse ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "verse-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "verse-card-label", children: "Currently Selected" }), (0, jsx_runtime_1.jsxs)("div", { className: "verse-card-ref", children: [selectedBook, " ", selectedChapter, ":", selectedVerse.verse] }), (0, jsx_runtime_1.jsxs)("div", { className: "verse-card-text", children: ["\"", selectedVerse.text, "\""] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "inspector-actions", children: [(0, jsx_runtime_1.jsxs)("div", { className: "inspector-button-row", children: [(0, jsx_runtime_1.jsx)("button", { className: "ghost-button", onClick: () => { }, children: "Edit Theme" }), (0, jsx_runtime_1.jsx)("button", { className: "ghost-button", onClick: () => { }, children: "Share" })] }), (0, jsx_runtime_1.jsxs)("button", { className: "send-projector-btn", onClick: sendToProjector, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "send", size: 15 }), " Send to Projector"] }), (0, jsx_runtime_1.jsxs)("button", { className: "ghost-button", onClick: addToSchedule, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "queue", size: 15 }), " Add to Schedule"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "inspector-meta-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Word Count" }), (0, jsx_runtime_1.jsx)("div", { className: "meta-card-value", children: wordCount })] }), (0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Style" }), (0, jsx_runtime_1.jsx)("div", { className: "meta-card-value", children: "Lyric Bold" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Motion" }), (0, jsx_runtime_1.jsx)("div", { className: "meta-card-value", children: "Static" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Translation" }), (0, jsx_runtime_1.jsx)("div", { className: "meta-card-value", children: selectedTranslation.toUpperCase() })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "projection-preview", children: [(0, jsx_runtime_1.jsxs)("div", { className: "preview-text", children: [selectedVerse.text.slice(0, 80), selectedVerse.text.length > 80 ? '...' : ''] }), (0, jsx_runtime_1.jsx)("span", { className: "preview-label", children: "Preview" })] })] })) : ((0, jsx_runtime_1.jsxs)("div", { style: { padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '2rem', marginBottom: 8 }, children: "\uD83D\uDCD6" }), "Select a verse to see details and send to projector"] })), toast && ((0, jsx_runtime_1.jsx)("div", { style: { padding: '8px 14px 14px' }, children: (0, jsx_runtime_1.jsxs)("div", { className: "ui-inline-notice", children: [(0, jsx_runtime_1.jsx)("strong", { children: toast.title }), toast.detail ? (0, jsx_runtime_1.jsx)("small", { children: toast.detail }) : null] }) }))] })] }));
};
exports.BiblePicker = BiblePicker;
