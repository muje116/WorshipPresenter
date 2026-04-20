import React, { useEffect, useState } from 'react'
import { useStore } from '../store'

declare const window: any

type Translation = { code: string; name: string; id?: number }

const OT_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
]

const NT_BOOKS = [
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
  '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation'
]

export const BiblePicker: React.FC = () => {
  const setCurrentSlide = useStore((state) => state.setCurrentSlide)
  const setLiveSlide = useStore((state) => state.setLiveSlide)
  const liveSlide = useStore((state) => state.liveSlide)

  const [translations, setTranslations] = useState<Translation[]>([])
  const [selectedTranslation, setSelectedTranslation] = useState<string>('')
  const [secondTranslation, setSecondTranslation] = useState<string>('')
  const [selectedBook, setSelectedBook] = useState<string>('Genesis')
  const [selectedChapter, setSelectedChapter] = useState<number>(1)
  const [chapters, setChapters] = useState<number[]>([])
  const [verses, setVerses] = useState<any[]>([])
  const [secondVerses, setSecondVerses] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [dualMode, setDualMode] = useState(false)
  const [selectedVerse, setSelectedVerse] = useState<any | null>(null)
  const [otExpanded, setOtExpanded] = useState(true)
  const [ntExpanded, setNtExpanded] = useState(false)

  // Load translations
  useEffect(() => {
    const loadBibleData = async () => {
      try {
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
    if (!filePath) return
    try {
      const translationCodeToUse = selectedTranslation || (translations[0]?.code ?? 'NIV')
      await window.worship.bibles.importFromOsis(translationCodeToUse, 'en', filePath)
      const translationsList = await window.worship.bibles.listTranslations()
      if (translationsList && translationsList.length) {
        setTranslations(translationsList)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleVerseSelect = (verse: any) => {
    setSelectedVerse(verse)
    const slideText = `${selectedBook} ${selectedChapter}:${verse.verse}\n\n${verse.text}`
    setCurrentSlide(slideText)
  }

  const sendToProjector = () => {
    if (!selectedVerse) return
    const slideText = `${selectedBook} ${selectedChapter}:${selectedVerse.verse}\n\n${selectedVerse.text}`
    setCurrentSlide(slideText)
    setLiveSlide(slideText)
    // Also send to output windows
    const OUTPUT_IDS = [1, 2]
    OUTPUT_IDS.forEach((id) => window?.worship?.outputs?.setState?.(id, { slideTitle: slideText }))
  }

  const addToSchedule = async () => {
    if (!selectedVerse) return
    try {
      const content = `${selectedBook} ${selectedChapter}:${selectedVerse.verse} - ${selectedVerse.text}`
      await window.worship.db.run(
        'INSERT INTO schedule_items (schedule_id, item_type, content, order_num) VALUES (?, ?, ?, (SELECT COALESCE(MAX(order_num), 0) + 1 FROM schedule_items))',
        [1, 'scripture', content]
      )
    } catch (error) {
      console.error('Failed to add to schedule:', error)
    }
  }

  const wordCount = selectedVerse ? selectedVerse.text.split(/\s+/).filter(Boolean).length : 0

  return (
    <div className="workspace-grid workspace-scripture">
      {/* LEFT: Explorer Panel */}
      <aside className="panel explorer-panel">
        <div className="import-osis-row">
          <button className="live-button full" onClick={handleImportOsis}>📥 Import OSIS Bible</button>
        </div>

        <div className="explorer-section-header" onClick={() => setOtExpanded(!otExpanded)}>
          <span className={`chevron ${otExpanded ? 'open' : ''}`}>▶</span>
          Old Testament
        </div>
        {otExpanded && (
          <div className="book-list">
            {OT_BOOKS.map(book => (
              <button key={book} className={`book-item ${selectedBook === book ? 'active' : ''}`} onClick={() => { setSelectedBook(book); setSelectedVerse(null); setSearchResults([]) }}>
                {book}
              </button>
            ))}
          </div>
        )}

        <div className="explorer-section-header" onClick={() => setNtExpanded(!ntExpanded)}>
          <span className={`chevron ${ntExpanded ? 'open' : ''}`}>▶</span>
          New Testament
        </div>
        {ntExpanded && (
          <div className="book-list">
            {NT_BOOKS.map(book => (
              <button key={book} className={`book-item ${selectedBook === book ? 'active' : ''}`} onClick={() => { setSelectedBook(book); setSelectedVerse(null); setSearchResults([]) }}>
                {book}
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* CENTER: Content Panel */}
      <section className="panel scripture-content-panel">
        <div className="scripture-search-bar">
          <span className="search-icon">🔍</span>
          <input
            className="scripture-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`${selectedBook} 1`}
          />
          <select className="translation-selector" value={selectedTranslation} onChange={(e) => setSelectedTranslation(e.target.value)}>
            {translations.map(t => <option key={t.code} value={t.code}>{t.code.toUpperCase()}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={dualMode} onChange={(e) => setDualMode(e.target.checked)} style={{ borderRadius: 4 }} />
            Dual
          </label>
          {dualMode && (
            <select className="translation-selector" value={secondTranslation} onChange={(e) => setSecondTranslation(e.target.value)}>
              {translations.map(t => <option key={t.code} value={t.code}>{t.code.toUpperCase()}</option>)}
            </select>
          )}
        </div>

        {/* Book title and chapter chips */}
        <h2 className="scripture-book-title">{selectedBook}</h2>
        <p className="scripture-book-subtitle">Select a chapter to begin</p>

        <div className="chapter-chip-grid">
          {chapters.map(ch => (
            <button key={ch} className={`chapter-chip ${selectedChapter === ch ? 'active' : ''}`} onClick={() => { setSelectedChapter(ch); setSelectedVerse(null); setSearchResults([]) }}>
              {ch}
            </button>
          ))}
        </div>

        {/* Verse reader */}
        <div className="verse-reader">
          {/* Chapter / Translation label */}
          {verses.length > 0 && (
            <div className="verse-chapter-label">
              <span className="verse-chapter-pill">Chapter {selectedChapter}</span>
              <span className="verse-chapter-pill">{selectedTranslation.toUpperCase()}</span>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 ? (
            searchResults.map((result, idx) => (
              <div key={idx} className={`verse-row ${selectedVerse === result ? 'selected' : ''}`} onClick={() => handleVerseSelect(result)}>
                <span className="verse-number">{result.verse}</span>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary)', marginBottom: 4 }}>{result.book} {result.chapter}:{result.verse}</div>
                  <div className="verse-text">{result.text}</div>
                </div>
              </div>
            ))
          ) : verses.length > 0 ? (
            verses.map((verse) => (
              <div key={verse.verse} className={`verse-row ${selectedVerse?.verse === verse.verse ? 'selected' : ''}`} onClick={() => handleVerseSelect(verse)}>
                <span className="verse-number">{verse.verse}</span>
                <div style={{ flex: 1 }}>
                  <div className="verse-text">{verse.text}</div>
                  {dualMode && secondVerses.length > 0 && (
                    <div className="verse-text-secondary">
                      {secondVerses.find(v => v.verse === verse.verse)?.text}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📖</div>
              <div style={{ fontSize: '0.85rem' }}>Select a book and chapter to view verses</div>
              <div style={{ fontSize: '0.72rem', marginTop: 4 }}>Or search for specific text</div>
            </div>
          )}
        </div>
      </section>

      {/* RIGHT: Inspector Panel */}
      <aside className="panel scripture-inspector">
        <div className="inspector-header">
          <h3 className="inspector-title">Inspector</h3>
          {liveSlide && liveSlide.includes(selectedBook) && (
            <div className="inspector-live-pill"><span className="dot" /> LIVE NOW</div>
          )}
        </div>

        {selectedVerse ? (
          <>
            <div className="verse-card">
              <div className="verse-card-label">Currently Selected</div>
              <div className="verse-card-ref">{selectedBook} {selectedChapter}:{selectedVerse.verse}</div>
              <div className="verse-card-text">"{selectedVerse.text}"</div>
            </div>

            <div className="inspector-actions">
              <div className="inspector-button-row">
                <button className="ghost-button" onClick={() => {}}>Edit Theme</button>
                <button className="ghost-button" onClick={() => {}}>Share</button>
              </div>

              <button className="send-projector-btn" onClick={sendToProjector}>
                ⚡ Send to Projector
              </button>

              <button className="ghost-button" onClick={addToSchedule}>
                📋 Add to Schedule
              </button>
            </div>

            <div className="inspector-meta-grid">
              <div className="meta-card">
                <div className="meta-card-label">Word Count</div>
                <div className="meta-card-value">{wordCount}</div>
              </div>
              <div className="meta-card">
                <div className="meta-card-label">Style</div>
                <div className="meta-card-value">Lyric Bold</div>
              </div>
              <div className="meta-card">
                <div className="meta-card-label">Motion</div>
                <div className="meta-card-value">Static</div>
              </div>
              <div className="meta-card">
                <div className="meta-card-label">Translation</div>
                <div className="meta-card-value">{selectedTranslation.toUpperCase()}</div>
              </div>
            </div>

            <div className="projection-preview">
              <div className="preview-text">{selectedVerse.text.slice(0, 80)}{selectedVerse.text.length > 80 ? '...' : ''}</div>
              <span className="preview-label">Preview</span>
            </div>
          </>
        ) : (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📖</div>
            Select a verse to see details and send to projector
          </div>
        )}
      </aside>
    </div>
  )
}
