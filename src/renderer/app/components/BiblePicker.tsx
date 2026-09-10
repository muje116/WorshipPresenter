import React, { useEffect, useState } from 'react'
import { useStore } from '../store'
import { dbService } from '../services/db'
import { AppIcon } from './ui'

declare const window: any

type Translation = { code: string; name: string; id?: number; language?: string }
type OnlineSource = {
  code: string
  name: string
  language: string
  url: string
  format: string
  license?: string
  available?: boolean
  infoUrl?: string
}

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

const ALL_BOOKS = [...OT_BOOKS, ...NT_BOOKS]

const uniqueTranslations = (items: Translation[]): Translation[] => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const code = String(item.code || '').trim().toUpperCase()
    if (!code || seen.has(code)) return false
    seen.add(code)
    return true
  }).map((item) => ({ ...item, code: String(item.code).trim().toUpperCase() }))
}

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
  const [importProgress, setImportProgress] = useState<number | null>(null)
  const [onlineSources, setOnlineSources] = useState<OnlineSource[]>([])
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null)
  const [showOnlinePanel, setShowOnlinePanel] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [dualMode, setDualMode] = useState(false)
  const [selectedVerse, setSelectedVerse] = useState<any | null>(null)
  const [otExpanded, setOtExpanded] = useState(true)
  const [ntExpanded, setNtExpanded] = useState(false)
  const [toast, setToast] = useState<{ title: string; detail?: string } | null>(null)
  const [pendingVerseNumber, setPendingVerseNumber] = useState<number | null>(null)
  const chapterRequestRef = React.useRef(0)
  const verseRequestRef = React.useRef(0)
  const secondVerseRequestRef = React.useRef(0)

  const refreshTranslations = async () => {
    const translationsList = await window.worship.bibles.listTranslations()
    const nextTranslations = uniqueTranslations(translationsList || [])
    setTranslations(nextTranslations)
    if (!nextTranslations.length) {
      setSelectedTranslation('')
      setSecondTranslation('')
      return nextTranslations
    }
    setSelectedTranslation((current) => nextTranslations.some((item) => item.code === current) ? current : nextTranslations[0].code)
    setSecondTranslation((current) => {
      if (nextTranslations.some((item) => item.code === current) && current !== nextTranslations[0].code) return current
      return nextTranslations.find((item) => item.code !== nextTranslations[0].code)?.code || ''
    })
    return nextTranslations
  }

  // Load translations
  useEffect(() => {
    const loadBibleData = async () => {
      try {
        await refreshTranslations()
        const sources = await window.worship.bibles.getOnlineSources()
        if (sources?.length) {
          setOnlineSources(sources)
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
      const translation = translations.find((item) => item.code === selectedTranslation)
      loadChapters(selectedBook, translation?.id)
    }
  }, [selectedBook, selectedTranslation, translations])

  // Load verses when chapter changes
  useEffect(() => {
    if (selectedBook && selectedChapter) {
      loadVerses(selectedBook, selectedChapter, selectedTranslation)
    }
  }, [selectedBook, selectedChapter, selectedTranslation, translations])

  // Load second translation verses
  useEffect(() => {
    if (dualMode && secondTranslation && selectedBook && selectedChapter) {
      loadSecondVerses(selectedBook, selectedChapter, secondTranslation)
    } else {
      setSecondVerses([])
    }
  }, [selectedBook, selectedChapter, secondTranslation, dualMode, translations])

  useEffect(() => {
    if (!translations.length || secondTranslation !== selectedTranslation) return
    const alternate = translations.find((item) => item.code !== selectedTranslation)
    setSecondTranslation(alternate?.code || '')
    setSecondVerses([])
  }, [selectedTranslation, secondTranslation, translations])

  useEffect(() => {
    setSelectedVerse(null)
    setVerses([])
    setSecondVerses([])
    setSearchResults([])
  }, [selectedTranslation])

  useEffect(() => {
    if (!window.worship?.bibles?.onDownloadProgress) return
    const cleanup = window.worship.bibles.onDownloadProgress((payload: any) => {
      if (payload.translationCode === downloadingCode) {
        setDownloadProgress(payload.progress)
      }
    })
    return cleanup
  }, [downloadingCode])

  useEffect(() => {
    if (pendingVerseNumber == null || !verses.length) return
    const verse = verses.find((item) => item.verse === pendingVerseNumber)
    if (verse) {
      handleVerseSelect(verse)
      setPendingVerseNumber(null)
    }
  }, [pendingVerseNumber, verses])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!verses.length) return
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (!selectedVerse) return handleVerseSelect(verses[0])
        const currentIndex = verses.findIndex((item) => item.verse === selectedVerse.verse)
        const nextIndex = Math.min(verses.length - 1, currentIndex + 1)
        handleVerseSelect(verses[nextIndex])
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (!selectedVerse) return handleVerseSelect(verses[0])
        const currentIndex = verses.findIndex((item) => item.verse === selectedVerse.verse)
        const prevIndex = Math.max(0, currentIndex - 1)
        handleVerseSelect(verses[prevIndex])
      }
      if (event.key === 'Enter' && selectedVerse) {
        event.preventDefault()
        sendToProjector()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [verses, selectedVerse])

  const loadChapters = async (book: string, translationId?: number) => {
    const requestId = chapterRequestRef.current + 1
    chapterRequestRef.current = requestId
    try {
      const chaptersList = await window.worship.bibles.getChapters(book, translationId)
      if (requestId !== chapterRequestRef.current) return
      if (chaptersList && chaptersList.length) {
        setChapters(chaptersList)
        setSelectedChapter((current) => chaptersList.includes(current) ? current : chaptersList[0])
      } else {
        setChapters([1])
        setSelectedChapter(1)
      }
    } catch (error) {
      console.error('Failed to load chapters:', error)
      if (requestId !== chapterRequestRef.current) return
      setChapters([1])
      setSelectedChapter(1)
    }
  }

  const loadVerses = async (book: string, chapter: number, translationCode: string) => {
    const requestId = verseRequestRef.current + 1
    verseRequestRef.current = requestId
    try {
      const translation = translations.find((item) => item.code === translationCode)
      const versesList = await window.worship.bibles.getVerses(book, chapter, translation?.id)
      if (requestId === verseRequestRef.current) setVerses(versesList || [])
    } catch (error) {
      console.error('Failed to load verses:', error)
      if (requestId === verseRequestRef.current) setVerses([])
    }
  }

  const loadSecondVerses = async (book: string, chapter: number, translationCode: string) => {
    const requestId = secondVerseRequestRef.current + 1
    secondVerseRequestRef.current = requestId
    try {
      const translation = translations.find((item) => item.code === translationCode)
      const versesList = await window.worship.bibles.getVerses(book, chapter, translation?.id)
      if (requestId === secondVerseRequestRef.current) setSecondVerses(versesList || [])
    } catch (error) {
      console.error('Failed to load second verses:', error)
      if (requestId === secondVerseRequestRef.current) setSecondVerses([])
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    const ref = searchQuery.trim().match(/^(.+?)\s+(\d+)(?::(\d+))?$/)
    if (ref) {
      const [, rawBook, rawChapter, rawVerse] = ref
      const matchedBook = ALL_BOOKS.find((book) => book.toLowerCase() === rawBook.toLowerCase())
      if (matchedBook) {
        setSelectedBook(matchedBook)
        setSelectedChapter(Number(rawChapter))
        setSearchResults([])
        if (rawVerse) setPendingVerseNumber(Number(rawVerse))
        return
      }
    }
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

  const handleDownloadOnline = async (source: OnlineSource) => {
    if (!source) return
    if (source.available === false) {
      setToast({
        title: `${source.code} needs a license`,
        detail: source.license || 'Import an authorized OSIS file or configure a licensed API.'
      })
      return
    }
    setDownloadingCode(source.code)
    setDownloadProgress(0)
    try {
      const result = await window.worship.bibles.downloadFromUrl({
        code: source.code,
        name: source.name,
        language: source.language,
        url: source.url,
        format: source.format
      })
      if (result.error) {
        setToast({ title: 'Download failed', detail: result.error })
      } else {
        setToast({ title: 'Bible downloaded', detail: `${source.name}: ${result.versesCount} verses` })
        await refreshTranslations()
      }
    } catch (e) {
      setToast({ title: 'Download failed', detail: (e as Error).message })
    } finally {
      setDownloadProgress(null)
      setDownloadingCode(null)
    }
  }

  const handleImportOsis = async () => {
    const filePath = await window.worship?.bibles?.openOsisFile?.()
    if (!filePath) return
    const translationCodeToUse = prompt('Enter Bible translation code (e.g. NIV, KJV, ESV):')
    if (!translationCodeToUse || !translationCodeToUse.trim()) return
    const code = translationCodeToUse.trim().toUpperCase()

    let cleanup: (() => void) | undefined
    if (window.worship?.bibles?.onImportProgress) {
      cleanup = window.worship.bibles.onImportProgress((payload: any) => {
        if (payload.translationCode === code) {
          setImportProgress(payload.progress)
        }
      })
    }

    setImportProgress(0)

    try {
      const result = await window.worship.bibles.importFromOsis(code, 'en', filePath)
      if (result?.error) throw new Error(result.error)
      setImportProgress(null)
      setToast({ title: 'Bible import completed', detail: `${code} is ready` })
      await refreshTranslations()
    } catch (e) {
      console.error(e)
      setImportProgress(null)
      setToast({ title: 'Bible import failed', detail: (e as Error).message })
    } finally {
      if (cleanup) cleanup()
    }
  }

  const handleImportEasyWorship = async () => {
    const filePath = await window.worship?.bibles?.openEasyWorshipFile?.()
    if (!filePath) return
    const translationCodeToUse = prompt('Enter Bible translation code (e.g. NIV, KJV, ESV):')
    if (!translationCodeToUse || !translationCodeToUse.trim()) return
    const code = translationCodeToUse.trim().toUpperCase()

    let cleanup: (() => void) | undefined
    if (window.worship?.bibles?.onImportProgress) {
      cleanup = window.worship.bibles.onImportProgress((payload: any) => {
        if (payload.translationCode === code) {
          setImportProgress(payload.progress)
        }
      })
    }

    setImportProgress(0)
    try {
      const result = await window.worship.bibles.importFromEasyWorship(code, 'en', filePath)
      if (result?.error) throw new Error(result.error)
      setToast({ title: 'EasyWorship Bible imported', detail: `${code} is ready` })
      await refreshTranslations()
    } catch (e) {
      setToast({ title: 'EWB import failed', detail: (e as Error).message })
    } finally {
      setImportProgress(null)
      if (cleanup) cleanup()
    }
  }

  const handleImportXmlPack = async () => {
    const filePaths = await window.worship?.bibles?.openXmlFiles?.()
    if (!filePaths?.length || !window.worship?.bibles?.importXmlFiles) return

    let cleanup: (() => void) | undefined
    if (window.worship?.bibles?.onImportProgress) {
      cleanup = window.worship.bibles.onImportProgress((payload: any) => {
        if (payload?.progress != null) setImportProgress(Number(payload.progress))
      })
    }

    setImportProgress(0)
    try {
      const results = await window.worship.bibles.importXmlFiles(filePaths)
      const imported = (results || []).filter((result: any) => result && !result.error && !result.skipped)
      const skipped = (results || []).filter((result: any) => result?.skipped)
      const failed = (results || []).filter((result: any) => result?.error)
      await refreshTranslations()
      setToast({
        title: 'Bible translations loaded',
        detail: `${imported.length} imported${skipped.length ? `, ${skipped.length} duplicate${skipped.length === 1 ? '' : 's'} skipped` : ''}${failed.length ? `, ${failed.length} failed` : ''}`,
      })
    } catch (error) {
      setToast({ title: 'Bible pack import failed', detail: (error as Error).message })
    } finally {
      setImportProgress(null)
      cleanup?.()
    }
  }

  const getVerseContext = (verse: any) => ({
    book: verse?.book || selectedBook,
    chapter: Number(verse?.chapter || selectedChapter),
  })

  const buildVerseSlide = (verse: any): string => {
    const context = getVerseContext(verse)
    const mainLabel = selectedTranslation.toUpperCase() || 'TEXT'
    const lines = [
      `${context.book} ${context.chapter}:${verse.verse}`,
      `${mainLabel}: ${verse.text}`,
    ]
    if (dualMode && secondTranslation && secondTranslation !== selectedTranslation) {
      const secondary = secondVerses.find((item) => item.verse === verse.verse)
      if (secondary?.text) lines.push(`${secondTranslation.toUpperCase()}: ${secondary.text}`)
    }
    return lines.join('\n\n')
  }

  const handleVerseSelect = (verse: any) => {
    const context = getVerseContext(verse)
    setSelectedVerse(verse)
    if (verse?.book) setSelectedBook(context.book)
    if (verse?.chapter) setSelectedChapter(context.chapter)
    setCurrentSlide(buildVerseSlide(verse))
  }

  const sendVerseToProjector = async (verse: any) => {
    if (!verse) return
    const context = getVerseContext(verse)
    const slideText = buildVerseSlide(verse)
    setCurrentSlide(slideText)
    setLiveSlide(slideText)
    let OUTPUT_IDS = [1, 2]
    try {
      const windows = await window?.worship?.outputs?.list?.()
      if (Array.isArray(windows) && windows.length) {
        OUTPUT_IDS = windows.map((item: any) => Number(item.id)).filter(Boolean)
      }
    } catch {
      // keep fallback outputs
    }
    OUTPUT_IDS.forEach((id) => window?.worship?.outputs?.setState?.(id, { slideTitle: slideText }))
    setToast({ title: 'Verse sent live', detail: `${context.book} ${context.chapter}:${verse.verse} · ${selectedTranslation.toUpperCase()}` })
  }

  const sendToProjector = async () => {
    await sendVerseToProjector(selectedVerse)
  }

  const handleVerseDoubleClick = (verse: any) => {
    handleVerseSelect(verse)
    void sendVerseToProjector(verse)
  }

  const addToSchedule = async () => {
    if (!selectedVerse) return
    try {
      const context = getVerseContext(selectedVerse)
      const content = `${context.book} ${context.chapter}:${selectedVerse.verse} - ${selectedVerse.text}`
      await dbService.schedule.addItem('scripture', content)
      // Reload schedule items in Zustand store
      const nextItems = await dbService.schedule.getItems()
      useStore.setState({ schedule: nextItems })
      setToast({ title: 'Added to schedule', detail: `${context.book} ${context.chapter}:${selectedVerse.verse}` })
    } catch (error) {
      console.error('Failed to add to schedule:', error)
    }
  }

  const wordCount = selectedVerse ? selectedVerse.text.split(/\s+/).filter(Boolean).length : 0

  return (
    <div className="workspace-grid workspace-scripture">
      {/* LEFT: Explorer Panel */}
      <aside className="panel explorer-panel">
        <div className="bible-pack-card">
          <div className="bible-pack-heading">
            <div>
              <span className="panel-eyebrow">TRANSLATION PACK</span>
              <strong>English Bible XML</strong>
            </div>
            <AppIcon name="globe" size={16} />
          </div>
          <p>Import multiple numbered Bible XML files at once. Translation codes are detected automatically and duplicate versions are skipped.</p>
          <button className="live-button full" onClick={handleImportXmlPack} disabled={importProgress !== null}>
            <AppIcon name="upload" size={14} /> {importProgress !== null ? `Loading XML (${importProgress}%)` : 'Load Bible XML set'}
          </button>
          <small className="bible-pack-codes">TPT · NIV · GW · GNT · EASY · AMPC · AMP · TLB · NLT</small>
        </div>
        <div className="import-osis-row">
          <button className="live-button full" onClick={handleImportOsis} disabled={importProgress !== null}>
            <AppIcon name="upload" size={14} /> {importProgress !== null ? `Importing (${importProgress}%)` : 'Import OSIS Bible'}
          </button>
          {importProgress !== null && (
            <div style={{ width: '100%', height: 6, backgroundColor: '#334155', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
              <div style={{ width: `${importProgress}%`, height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.2s ease-in-out' }} />
            </div>
          )}
        </div>

        <div className="import-osis-row" style={{ marginTop: 6 }}>
          <button className="soft-button full" onClick={handleImportEasyWorship} disabled={importProgress !== null}>
            <AppIcon name="upload" size={14} /> Import EasyWorship EWB
          </button>
        </div>

        <div className="import-osis-row" style={{ marginTop: 6 }}>
          <button
            className="soft-button full"
            onClick={() => setShowOnlinePanel(!showOnlinePanel)}
          >
            <AppIcon name="globe" size={14} /> {showOnlinePanel ? 'Hide Online Bibles' : 'Download Bible Online'}
          </button>
        </div>

        {showOnlinePanel && (
          <div className="online-bibles-panel">
            {downloadProgress !== null && downloadingCode && (
              <div style={{ marginBottom: 8 }}>
                <small style={{ color: 'var(--text-muted)' }}>
                  Downloading {downloadingCode}... ({downloadProgress}%)
                </small>
                <div style={{ width: '100%', height: 6, backgroundColor: '#334155', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${downloadProgress}%`, height: '100%', backgroundColor: '#22c55e', transition: 'width 0.2s ease-in-out' }} />
                </div>
              </div>
            )}
            <div className="online-sources-list">
              {onlineSources.length === 0 ? (
                <div style={{ padding: 8, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  No online sources available.
                </div>
              ) : (
                onlineSources.map((source, idx) => {
                  const isInstalled = translations.some(t => t.code === source.code)
                  const isDownloading = downloadingCode === source.code
                  return (
                    <div key={idx} className={`online-source-row ${source.available === false ? 'restricted' : ''}`}>
                      <div className="online-source-info">
                        <strong>{source.name}</strong>
                        <small>{source.code} &middot; {source.language} &middot; {source.license || 'Direct download'}</small>
                      </div>
                      {isInstalled ? (
                        <span className="installed-badge">Installed</span>
                      ) : source.available === false ? (
                        <button
                          className="soft-button"
                          onClick={() => handleDownloadOnline(source)}
                          title={source.infoUrl || source.url}
                        >
                          Source
                        </button>
                      ) : (
                        <button
                          className="soft-button"
                          disabled={isDownloading}
                          onClick={() => handleDownloadOnline(source)}
                        >
                          {isDownloading ? `${downloadProgress}%` : 'Download'}
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

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
          <span className="search-icon"><AppIcon name="search" size={16} /></span>
          <input
            className="scripture-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`${selectedBook} 1:1`}
          />
          <select
            className="translation-selector"
            value={selectedTranslation}
            onChange={(e) => {
              setSelectedTranslation(e.target.value)
              setSelectedVerse(null)
              setVerses([])
              setSecondVerses([])
              setSearchResults([])
            }}
            aria-label="Bible translation"
          >
            {!translations.length && <option value="">No versions loaded</option>}
            {translations.map(t => <option key={t.code} value={t.code}>{t.code.toUpperCase()} · {t.name}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={dualMode} onChange={(e) => setDualMode(e.target.checked)} style={{ borderRadius: 4 }} />
            Dual
          </label>
          {dualMode && (
            <select className="translation-selector" value={secondTranslation} onChange={(e) => {
              setSecondTranslation(e.target.value)
              setSecondVerses([])
            }} aria-label="Second Bible translation">
              {translations.filter((item) => item.code !== selectedTranslation).map(t => <option key={t.code} value={t.code}>{t.code.toUpperCase()} · {t.name}</option>)}
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
              <div
                key={idx}
                className={`verse-row ${selectedVerse === result ? 'selected' : ''}`}
                onClick={() => handleVerseSelect(result)}
                onDoubleClick={() => handleVerseDoubleClick(result)}
                title="Click to preview · double-click to send live"
              >
                <span className="verse-number">{result.verse}</span>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary)', marginBottom: 4 }}>{result.book} {result.chapter}:{result.verse}</div>
                  <div className="verse-text">{result.text}</div>
                </div>
              </div>
            ))
          ) : verses.length > 0 ? (
            verses.map((verse, index) => (
              <div
                key={verse.verse}
                className={`verse-row ${selectedVerse?.verse === verse.verse ? 'selected' : ''}`}
                onClick={() => handleVerseSelect(verse)}
                onDoubleClick={() => handleVerseDoubleClick(verse)}
                title="Click to preview · double-click to send live"
              >
                <span className="verse-number">{verse.verse}</span>
                <div style={{ flex: 1 }}>
                  <div className="verse-text">{verse.text}</div>
                  {dualMode && secondVerses.length > 0 && (
                    <div className="verse-text-secondary">
                      {secondVerses.find(v => v.verse === verse.verse)?.text}
                    </div>
                  )}
                </div>
                <div className="verse-row-hotkeys">
                  {selectedVerse?.verse === verse.verse ? (
                    <button className="soft-button" onClick={(event) => { event.stopPropagation(); sendToProjector() }}><AppIcon name="send" size={13} /> Live</button>
                  ) : (
                    <button className="soft-button" onClick={(event) => {
                      event.stopPropagation()
                      if (index + 1 < verses.length) handleVerseSelect(verses[index + 1])
                    }}><AppIcon name="chevron" size={13} /> Next</button>
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
                <AppIcon name="send" size={15} /> Send to Projector
              </button>

              <button className="ghost-button" onClick={addToSchedule}>
                <AppIcon name="queue" size={15} /> Add to Schedule
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
        {toast && (
          <div style={{ padding: '8px 14px 14px' }}>
            <div className="ui-inline-notice">
              <strong>{toast.title}</strong>
              {toast.detail ? <small>{toast.detail}</small> : null}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
