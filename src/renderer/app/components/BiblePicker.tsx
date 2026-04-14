import React, { useEffect, useState } from 'react'

declare const window: any

type Translation = { code: string; name: string; id?: number }

export const BiblePicker: React.FC = () => {
  const [translations, setTranslations] = useState<Translation[]>([])
  const [allBooks, setAllBooks] = useState<string[]>([])
  const [selectedTranslation, setSelectedTranslation] = useState<string>('')
  const [secondTranslation, setSecondTranslation] = useState<string>('')
  const [selectedBook, setSelectedBook] = useState<string>('')
  const [selectedChapter, setSelectedChapter] = useState<number>(1)
  const [chapters, setChapters] = useState<number[]>([])
  const [verses, setVerses] = useState<any[]>([])
  const [secondVerses, setSecondVerses] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [dualMode, setDualMode] = useState(false)
  const [selectedVerseRange, setSelectedVerseRange] = useState<string>('')

  // Load translations and books
  useEffect(() => {
    const loadBibleData = async () => {
      try {
        // Load translations
        const translationsList = await window.worship.bibles.listTranslations()
        if (translationsList && translationsList.length) {
          setTranslations(translationsList)
          setSelectedTranslation(translationsList[0]?.code || '')
          if (translationsList.length > 1) {
            setSecondTranslation(translationsList[1]?.code || '')
          }
        }
      } catch (error) {
        console.error('Failed to load translations:', error)
      }

      try {
        // Load all 66 Bible books
        const booksList = await window.worship.bibles.getBooks()
        setAllBooks(booksList)
        if (booksList.length) {
          setSelectedBook(booksList[0])
        }
      } catch (error) {
        console.error('Failed to load books:', error)
      }
    }
    loadBibleData()
  }, [])

  // Load chapters when book changes
  useEffect(() => {
    if (selectedBook) {
      loadChapters(selectedBook)
    }
  }, [selectedBook])

  // Load verses when chapter changes
  useEffect(() => {
    if (selectedBook && selectedChapter) {
      loadVerses()
    }
  }, [selectedChapter, selectedTranslation])

  // Load second translation verses
  useEffect(() => {
    if (dualMode && secondTranslation && selectedBook && selectedChapter) {
      loadSecondVerses()
    }
  }, [selectedChapter, secondTranslation, dualMode])

  const loadChapters = async (book: string) => {
    try {
      const chaptersList = await window.worship.bibles.getChapters(book)
      if (chaptersList && chaptersList.length) {
        setChapters(chaptersList)
        setSelectedChapter(chaptersList[0])
      } else {
        // Default to 1 if no chapters found
        setChapters([1])
        setSelectedChapter(1)
      }
    } catch (error) {
      console.error('Failed to load chapters:', error)
      setChapters([1])
      setSelectedChapter(1)
    }
  }

  const loadVerses = async () => {
    try {
      const translation = translations.find(t => t.code === selectedTranslation)
      const versesList = await window.worship.bibles.getVerses(selectedBook, selectedChapter, translation?.id)
      setVerses(versesList || [])
    } catch (error) {
      console.error('Failed to load verses:', error)
      setVerses([])
    }
  }

  const loadSecondVerses = async () => {
    try {
      const translation = translations.find(t => t.code === secondTranslation)
      const versesList = await window.worship.bibles.getVerses(selectedBook, selectedChapter, translation?.id)
      setSecondVerses(versesList || [])
    } catch (error) {
      console.error('Failed to load second verses:', error)
      setSecondVerses([])
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const translation = translations.find(t => t.code === selectedTranslation)
      const results = await window.worship.bibles.search(searchQuery, translation?.id)
      setSearchResults(results || [])
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleImportOsis = async () => {
    const filePath = await window.worship?.bibles?.openOsisFile?.()
    if (!filePath) {
      alert('No OSIS file selected')
      return
    }
    try {
      const translationCodeToUse = selectedTranslation || (translations[0]?.code ?? 'NIV')
      const bibleId = await window.worship.bibles.importFromOsis(translationCodeToUse, 'en', filePath)
      alert('Imported OSIS Bible successfully')
      // Reload translations
      const translationsList = await window.worship.bibles.listTranslations()
      if (translationsList && translationsList.length) {
        setTranslations(translationsList)
      }
    } catch (e) {
      console.error(e)
      alert('Failed to import OSIS Bible')
    }
  }

  const handleVerseSelect = (verse: any) => {
    // Create a slide with the selected verse(s)
    const verseText = `${selectedBook} ${selectedChapter}:${verse.verse}\n\n${verse.text}`
    // This would normally go to the store
    console.log('Selected verse:', verseText)
  }

  const handleRangeSelect = () => {
    if (!selectedVerseRange) return
    // Parse range like "1-5"
    const parts = selectedVerseRange.split('-')
    if (parts.length === 2) {
      const start = parseInt(parts[0])
      const end = parseInt(parts[1])
      const selectedVerses = verses.filter(v => v.verse >= start && v.verse <= end)
      const verseText = selectedVerses.map(v => v.text).join(' ')
      const slideContent = `${selectedBook} ${selectedChapter}:${selectedVerseRange}\n\n${verseText}`
      console.log('Selected verse range:', slideContent)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with import button */}
      <div className="p-3 border-b border-slate-700 bg-slate-800/50">
        <button
          onClick={handleImportOsis}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg transition-colors"
        >
          📥 Import OSIS Bible
        </button>
      </div>

      {/* Translation selectors */}
      <div className="p-3 border-b border-slate-700 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-20">Translation</span>
          <select
            value={selectedTranslation}
            onChange={(e) => setSelectedTranslation(e.target.value)}
            className="flex-1 bg-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 border border-slate-600"
          >
            {translations.map(t => (
              <option key={t.code} value={t.code}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={dualMode}
              onChange={(e) => setDualMode(e.target.checked)}
              className="rounded"
            />
            Dual Translation
          </label>
          {dualMode && (
            <select
              value={secondTranslation}
              onChange={(e) => setSecondTranslation(e.target.value)}
              className="flex-1 bg-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 border border-slate-600"
            >
              {translations.map(t => (
                <option key={t.code} value={t.code}>{t.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search Bible..."
            className="flex-1 bg-slate-700 text-slate-200 text-sm rounded px-3 py-1.5 border border-slate-600"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-200 text-sm rounded transition-colors"
          >
            {isSearching ? '...' : '🔍'}
          </button>
        </div>
      </div>

      {/* Navigation - Book/Chapter */}
      <div className="p-3 border-b border-slate-700 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-12">Book</span>
          <select
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            className="flex-1 bg-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 border border-slate-600"
          >
            {allBooks.map(book => (
              <option key={book} value={book}>{book}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-12">Chapter</span>
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(parseInt(e.target.value))}
            className="flex-1 bg-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 border border-slate-600"
          >
            {chapters.map(chapter => (
              <option key={chapter} value={chapter}>{chapter}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-12">Verses</span>
          <input
            type="text"
            value={selectedVerseRange}
            onChange={(e) => setSelectedVerseRange(e.target.value)}
            placeholder="e.g. 1-5"
            className="flex-1 bg-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 border border-slate-600"
          />
          <button
            onClick={handleRangeSelect}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
            Select
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="p-3">
            <div className="text-xs text-slate-400 mb-2 font-medium uppercase">Search Results ({searchResults.length})</div>
            <div className="space-y-2">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleVerseSelect(result)}
                  className="w-full text-left p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-colors text-sm"
                >
                  <div className="text-blue-400 text-xs font-medium">{result.book} {result.chapter}:{result.verse}</div>
                  <div className="text-slate-300 mt-1 line-clamp-2">{result.text}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Verses List */}
        {!searchResults.length && verses.length > 0 && (
          <div className="p-3">
            <div className="text-xs text-slate-400 mb-2 font-medium uppercase">
              {selectedBook} {selectedChapter} ({verses.length} verses)
            </div>
            <div className="space-y-1">
              {verses.map((verse) => (
                <button
                  key={verse.verse}
                  onClick={() => handleVerseSelect(verse)}
                  className="w-full text-left p-2 hover:bg-slate-800/50 rounded transition-colors text-sm group"
                >
                  <div className="flex gap-3">
                    <span className="text-blue-400 text-xs font-medium mt-0.5">{verse.verse}</span>
                    <span className="text-slate-300 flex-1">{verse.text}</span>
                  </div>
                  {dualMode && secondVerses.length > 0 && (
                    <div className="flex gap-3 mt-1 pt-1 border-t border-slate-700">
                      <span className="text-slate-500 text-xs mt-0.5">{verse.verse}</span>
                      <span className="text-slate-400 flex-1 text-xs">{secondVerses.find(v => v.verse === verse.verse)?.text}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {verses.length === 0 && searchResults.length === 0 && (
          <div className="p-6 text-center text-slate-500 text-sm">
            <div className="text-3xl mb-2">📖</div>
            <div>Select a book and chapter to view verses</div>
            <div className="text-xs mt-1">Or search for specific text</div>
          </div>
        )}
      </div>
    </div>
  )
}
