"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiblePicker = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const BiblePicker = () => {
    const [translations, setTranslations] = (0, react_1.useState)([]);
    const [allBooks, setAllBooks] = (0, react_1.useState)([]);
    const [selectedTranslation, setSelectedTranslation] = (0, react_1.useState)('');
    const [secondTranslation, setSecondTranslation] = (0, react_1.useState)('');
    const [selectedBook, setSelectedBook] = (0, react_1.useState)('');
    const [selectedChapter, setSelectedChapter] = (0, react_1.useState)(1);
    const [chapters, setChapters] = (0, react_1.useState)([]);
    const [verses, setVerses] = (0, react_1.useState)([]);
    const [secondVerses, setSecondVerses] = (0, react_1.useState)([]);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [searchResults, setSearchResults] = (0, react_1.useState)([]);
    const [isSearching, setIsSearching] = (0, react_1.useState)(false);
    const [dualMode, setDualMode] = (0, react_1.useState)(false);
    const [selectedVerseRange, setSelectedVerseRange] = (0, react_1.useState)('');
    // Load translations and books
    (0, react_1.useEffect)(() => {
        const loadBibleData = async () => {
            try {
                // Load translations
                const translationsList = await window.worship.bibles.listTranslations();
                if (translationsList && translationsList.length) {
                    setTranslations(translationsList);
                    setSelectedTranslation(translationsList[0]?.code || '');
                    if (translationsList.length > 1) {
                        setSecondTranslation(translationsList[1]?.code || '');
                    }
                }
            }
            catch (error) {
                console.error('Failed to load translations:', error);
            }
            try {
                // Load all 66 Bible books
                const booksList = await window.worship.bibles.getBooks();
                setAllBooks(booksList);
                if (booksList.length) {
                    setSelectedBook(booksList[0]);
                }
            }
            catch (error) {
                console.error('Failed to load books:', error);
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
    const loadChapters = async (book) => {
        try {
            const chaptersList = await window.worship.bibles.getChapters(book);
            if (chaptersList && chaptersList.length) {
                setChapters(chaptersList);
                setSelectedChapter(chaptersList[0]);
            }
            else {
                // Default to 1 if no chapters found
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
    const handleImportOsis = async () => {
        const filePath = await window.worship?.bibles?.openOsisFile?.();
        if (!filePath) {
            alert('No OSIS file selected');
            return;
        }
        try {
            const translationCodeToUse = selectedTranslation || (translations[0]?.code ?? 'NIV');
            const bibleId = await window.worship.bibles.importFromOsis(translationCodeToUse, 'en', filePath);
            alert('Imported OSIS Bible successfully');
            // Reload translations
            const translationsList = await window.worship.bibles.listTranslations();
            if (translationsList && translationsList.length) {
                setTranslations(translationsList);
            }
        }
        catch (e) {
            console.error(e);
            alert('Failed to import OSIS Bible');
        }
    };
    const handleVerseSelect = (verse) => {
        // Create a slide with the selected verse(s)
        const verseText = `${selectedBook} ${selectedChapter}:${verse.verse}\n\n${verse.text}`;
        // This would normally go to the store
        console.log('Selected verse:', verseText);
    };
    const handleRangeSelect = () => {
        if (!selectedVerseRange)
            return;
        // Parse range like "1-5"
        const parts = selectedVerseRange.split('-');
        if (parts.length === 2) {
            const start = parseInt(parts[0]);
            const end = parseInt(parts[1]);
            const selectedVerses = verses.filter(v => v.verse >= start && v.verse <= end);
            const verseText = selectedVerses.map(v => v.text).join(' ');
            const slideContent = `${selectedBook} ${selectedChapter}:${selectedVerseRange}\n\n${verseText}`;
            console.log('Selected verse range:', slideContent);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col h-full", children: [(0, jsx_runtime_1.jsx)("div", { className: "p-3 border-b border-slate-700 bg-slate-800/50", children: (0, jsx_runtime_1.jsx)("button", { onClick: handleImportOsis, className: "w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg transition-colors", children: "\uD83D\uDCE5 Import OSIS Bible" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "p-3 border-b border-slate-700 space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs text-slate-400 w-20", children: "Translation" }), (0, jsx_runtime_1.jsx)("select", { value: selectedTranslation, onChange: (e) => setSelectedTranslation(e.target.value), className: "flex-1 bg-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 border border-slate-600", children: translations.map(t => ((0, jsx_runtime_1.jsx)("option", { value: t.code, children: t.name }, t.code))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2 text-xs text-slate-400", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: dualMode, onChange: (e) => setDualMode(e.target.checked), className: "rounded" }), "Dual Translation"] }), dualMode && ((0, jsx_runtime_1.jsx)("select", { value: secondTranslation, onChange: (e) => setSecondTranslation(e.target.value), className: "flex-1 bg-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 border border-slate-600", children: translations.map(t => ((0, jsx_runtime_1.jsx)("option", { value: t.code, children: t.name }, t.code))) }))] })] }), (0, jsx_runtime_1.jsx)("div", { className: "p-3 border-b border-slate-700", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), onKeyPress: (e) => e.key === 'Enter' && handleSearch(), placeholder: "Search Bible...", className: "flex-1 bg-slate-700 text-slate-200 text-sm rounded px-3 py-1.5 border border-slate-600" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleSearch, disabled: isSearching, className: "px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-200 text-sm rounded transition-colors", children: isSearching ? '...' : '🔍' })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "p-3 border-b border-slate-700 space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs text-slate-400 w-12", children: "Book" }), (0, jsx_runtime_1.jsx)("select", { value: selectedBook, onChange: (e) => setSelectedBook(e.target.value), className: "flex-1 bg-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 border border-slate-600", children: allBooks.map(book => ((0, jsx_runtime_1.jsx)("option", { value: book, children: book }, book))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs text-slate-400 w-12", children: "Chapter" }), (0, jsx_runtime_1.jsx)("select", { value: selectedChapter, onChange: (e) => setSelectedChapter(parseInt(e.target.value)), className: "flex-1 bg-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 border border-slate-600", children: chapters.map(chapter => ((0, jsx_runtime_1.jsx)("option", { value: chapter, children: chapter }, chapter))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs text-slate-400 w-12", children: "Verses" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: selectedVerseRange, onChange: (e) => setSelectedVerseRange(e.target.value), placeholder: "e.g. 1-5", className: "flex-1 bg-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 border border-slate-600" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleRangeSelect, className: "px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors", children: "Select" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 overflow-y-auto", children: [searchResults.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "p-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-xs text-slate-400 mb-2 font-medium uppercase", children: ["Search Results (", searchResults.length, ")"] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: searchResults.map((result, idx) => ((0, jsx_runtime_1.jsxs)("button", { onClick: () => handleVerseSelect(result), className: "w-full text-left p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-colors text-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-blue-400 text-xs font-medium", children: [result.book, " ", result.chapter, ":", result.verse] }), (0, jsx_runtime_1.jsx)("div", { className: "text-slate-300 mt-1 line-clamp-2", children: result.text })] }, idx))) })] })), !searchResults.length && verses.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "p-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-xs text-slate-400 mb-2 font-medium uppercase", children: [selectedBook, " ", selectedChapter, " (", verses.length, " verses)"] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-1", children: verses.map((verse) => ((0, jsx_runtime_1.jsxs)("button", { onClick: () => handleVerseSelect(verse), className: "w-full text-left p-2 hover:bg-slate-800/50 rounded transition-colors text-sm group", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex gap-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-blue-400 text-xs font-medium mt-0.5", children: verse.verse }), (0, jsx_runtime_1.jsx)("span", { className: "text-slate-300 flex-1", children: verse.text })] }), dualMode && secondVerses.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex gap-3 mt-1 pt-1 border-t border-slate-700", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-slate-500 text-xs mt-0.5", children: verse.verse }), (0, jsx_runtime_1.jsx)("span", { className: "text-slate-400 flex-1 text-xs", children: secondVerses.find(v => v.verse === verse.verse)?.text })] }))] }, verse.verse))) })] })), verses.length === 0 && searchResults.length === 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "p-6 text-center text-slate-500 text-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-3xl mb-2", children: "\uD83D\uDCD6" }), (0, jsx_runtime_1.jsx)("div", { children: "Select a book and chapter to view verses" }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs mt-1", children: "Or search for specific text" })] }))] })] }));
};
exports.BiblePicker = BiblePicker;
