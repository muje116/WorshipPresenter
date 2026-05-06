import React from 'react'
import { createRoot } from 'react-dom/client'
import { useStore, THEME_PRESETS } from './store'
import { OutputView } from './components/OutputView'
import { BiblePicker } from './components/BiblePicker'
import { MediaLibrary } from './components/MediaLibrary'
import { Notifications, ToastItem, ToastTone } from './components/Notifications'
import { Chip, MediaCard, Panel, Pill, SectionHeader } from './components/ui'
import './styles.css'

declare const window: any

const OUTPUT_IDS = [1, 2]
const SECTION_TYPES = ['Intro', 'Verse', 'Chorus', 'Bridge', 'Pre-Chorus', 'Post-Chorus', 'Tag', 'Outro', 'Interlude', 'Instrumental']
const LAYERS = ['background', 'media', 'slide_content', 'props_overlays', 'announcements', 'lower_thirds', 'live_video', 'alerts']
const NOTE_INDEX: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
}
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

type Workspace = 'console' | 'library' | 'editor' | 'scripture' | 'media' | 'settings'
type PaneSizes = {
  consoleLeft: number
  consoleBottom: number
  editorLeft: number
  editorRight: number
}

type BibleTranslation = { code: string; name: string; id?: number; language?: string }
type VerseRow = { book: string; chapter: number; verse: number; text: string }
type MediaAsset = { id: number; path: string; type: 'image' | 'video' | string; name?: string; duration?: number }

const getOutId = (): number => {
  try {
    const q = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const value = q.get('out')
    return value ? Number(value) : 0
  } catch {
    return 0
  }
}

const stripChordMarkup = (text: string): string => text.replace(/\[([^\]]+)\]/g, '').replace(/\s+/g, ' ').trim()

const transposeChord = (chord: string, steps: number): string => {
  const match = chord.match(/^([A-G])([#b]?)(.*)$/)
  if (!match) return chord
  const [, root, accidental, suffix] = match
  const startIndex = NOTE_INDEX[`${root}${accidental || ''}`]
  if (startIndex == null) return chord
  return `${NOTE_NAMES[(startIndex + steps + 12) % 12]}${suffix || ''}`
}

const transposeChordMarkup = (text: string, steps: number): string =>
  steps ? text.replace(/\[([^\]]+)\]/g, (_match: string, chord: string) => `[${transposeChord(chord, steps)}]`) : text

const App: React.FC = () => {
  const outId = getOutId()
  const isOutput = outId > 0

  const songs = useStore((state) => state.songs)
  const schedule = useStore((state) => state.schedule)
  const theme = useStore((state) => state.theme)
  const currentSlide = useStore((state) => state.currentSlide)
  const liveSlide = useStore((state) => state.liveSlide)
  const undoStack = useStore((state) => state.undoStack)
  const redoStack = useStore((state) => state.redoStack)
  const looks = useStore((state) => state.looks)
  const addSong = useStore((state) => state.addSong)
  const addSongSection = useStore((state) => state.addSongSection)
  const moveSongSection = useStore((state) => state.moveSongSection)
  const updateSongSection = useStore((state) => state.updateSongSection)
  const updateSongTitle = useStore((state) => state.updateSongTitle)
  const setCurrentSlide = useStore((state) => state.setCurrentSlide)
  const setLiveSlide = useStore((state) => state.setLiveSlide)
  const pushSlideUndo = useStore((state) => state.pushSlideUndo)
  const undo = useStore((state) => state.undo)
  const redo = useStore((state) => state.redo)
  const addScheduleItem = useStore((state) => state.addScheduleItem)
  const moveSchedule = useStore((state) => state.moveSchedule)
  const setTheme = useStore((state) => state.setTheme)
  const applyPreset = useStore((state) => state.applyPreset)
  const saveTemplate = useStore((state) => state.saveTemplate)
  const setLook = useStore((state) => state.setLook)
  const outputConfigs = useStore((state) => state.outputConfigs)
  const updateOutputConfig = useStore((state) => state.updateOutputConfig)

  const [workspace, setWorkspace] = React.useState<Workspace>('console')
  const [clockValue, setClockValue] = React.useState(new Date())
  const [dragIndex, setDragIndex] = React.useState<number | null>(null)
  const [selectedSongId, setSelectedSongId] = React.useState<number>(songs[0]?.id ?? 0)
  const [selectedSectionId, setSelectedSectionId] = React.useState<number | null>(null)
  const [showChords, setShowChords] = React.useState(true)
  const [transposeSteps, setTransposeSteps] = React.useState(0)
  const [songSearchQuery, setSongSearchQuery] = React.useState('')
  const [editorText, setEditorText] = React.useState('')
  const [editorType, setEditorType] = React.useState('Verse')
  const [songTitleDraft, setSongTitleDraft] = React.useState('')
  const [ndiEnabled, setNdiEnabled] = React.useState(false)
  const [outputStates, setOutputStates] = React.useState<Record<number, { slideTitle?: string; mode?: string }>>({})
  const [mediaType, setMediaType] = React.useState<'image' | 'video'>('image')
  const [mediaAssets, setMediaAssets] = React.useState<MediaAsset[]>([])
  const [mediaSearchQuery, setMediaSearchQuery] = React.useState('')
  const [mediaSort, setMediaSort] = React.useState<'recent' | 'name'>('recent')
  const [mediaViewMode, setMediaViewMode] = React.useState<'grid' | 'list'>('grid')
  const [selectedMediaId, setSelectedMediaId] = React.useState<number | null>(null)
  const [isImportingMedia, setIsImportingMedia] = React.useState(false)
  const [bgManagerTab, setBgManagerTab] = React.useState<'media' | 'gradient' | 'color'>('media')
  const [editorDragIndex, setEditorDragIndex] = React.useState<number | null>(null)
  const [gradientStart, setGradientStart] = React.useState('#1a1a2e')
  const [gradientEnd, setGradientEnd] = React.useState('#0f4c75')

  const [bibleTranslations, setBibleTranslations] = React.useState<BibleTranslation[]>([])
  const [selectedTranslationCode, setSelectedTranslationCode] = React.useState('')
  const [bibleBooks, setBibleBooks] = React.useState<string[]>([])
  const [selectedBibleBook, setSelectedBibleBook] = React.useState('')
  const [bibleChapters, setBibleChapters] = React.useState<number[]>([])
  const [selectedBibleChapter, setSelectedBibleChapter] = React.useState(1)
  const [bibleVerses, setBibleVerses] = React.useState<VerseRow[]>([])
  const [bibleSearchQuery, setBibleSearchQuery] = React.useState('')
  const [bibleSearchResults, setBibleSearchResults] = React.useState<VerseRow[]>([])
  const [selectedVerse, setSelectedVerse] = React.useState<VerseRow | null>(null)
  const [isBibleSearchRunning, setIsBibleSearchRunning] = React.useState(false)

  const [activeOutputId, setActiveOutputId] = React.useState(1)
  const [aspectRatio, setAspectRatio] = React.useState<'16:9' | '4:3' | '21:9' | 'FREE'>('16:9')
  const [overscanPercent, setOverscanPercent] = React.useState(5)
  const [outputResolution, setOutputResolution] = React.useState('1920x1080')
  const [outputHardware, setOutputHardware] = React.useState('Built-in Display')
  const [librarySort, setLibrarySort] = React.useState<'name' | 'sections'>('name')
  const [libraryViewMode, setLibraryViewMode] = React.useState<'grid' | 'list'>('grid')
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const [paneSizes, setPaneSizes] = React.useState<PaneSizes>(() => {
    try {
      const raw = localStorage.getItem('operator-pane-sizes')
      if (!raw) return { consoleLeft: 320, consoleBottom: 210, editorLeft: 310, editorRight: 330 }
      const parsed = JSON.parse(raw)
      return {
        consoleLeft: Number(parsed.consoleLeft) || 320,
        consoleBottom: Number(parsed.consoleBottom) || 210,
        editorLeft: Number(parsed.editorLeft) || 310,
        editorRight: Number(parsed.editorRight) || 330,
      }
    } catch {
      return { consoleLeft: 320, consoleBottom: 210, editorLeft: 310, editorRight: 330 }
    }
  })
  const [syncUrl, setSyncUrl] = React.useState('ws://localhost:9090')
  const [syncConnected, setSyncConnected] = React.useState(false)
  const [syncSocket, setSyncSocket] = React.useState<WebSocket | null>(null)

  const selectedSong = songs.find((song) => song.id === selectedSongId) || songs[0]
  const selectedSection = selectedSong?.sections.find((section) => section.id === selectedSectionId) || selectedSong?.sections[0]
  const filteredSongs = songs
    .filter((song) => !songSearchQuery || song.title.toLowerCase().includes(songSearchQuery.toLowerCase()) || song.artist?.toLowerCase().includes(songSearchQuery.toLowerCase()))
    .sort((a, b) => librarySort === 'name' ? a.title.localeCompare(b.title) : b.sections.length - a.sections.length)

  React.useEffect(() => {
    if (isOutput) return
    const timer = setInterval(() => setClockValue(new Date()), 1000)
    return () => clearInterval(timer)
  }, [isOutput])

  React.useEffect(() => {
    if (isOutput) return
    if (!songs.find((song) => song.id === selectedSongId) && songs[0]) setSelectedSongId(songs[0].id)
  }, [isOutput, selectedSongId, songs])

  React.useEffect(() => {
    if (!selectedSection) {
      setEditorText('')
      return
    }
    setEditorText(selectedSection.text || '')
    setEditorType(selectedSection.type || 'Verse')
  }, [selectedSection?.id, selectedSection?.text, selectedSection?.type])

  React.useEffect(() => {
    setSongTitleDraft(selectedSong?.title || '')
  }, [selectedSong?.id, selectedSong?.title])

  React.useEffect(() => {
    if (isOutput) return
    if (!window?.worship?.outputs?.onOutputState) return
    window.worship.outputs.onOutputState((payload: any) => {
      if (!payload?.outputId) return
      setOutputStates((prev) => ({ ...prev, [payload.outputId]: payload.state || {} }))
    })
  }, [isOutput])

  React.useEffect(() => {
    if (isOutput) return
    window?.worship?.ndi?.status?.().then((status: { enabled?: boolean }) => setNdiEnabled(Boolean(status?.enabled))).catch(() => setNdiEnabled(false))
  }, [isOutput])

  React.useEffect(() => {
    if (isOutput) return
    const loadData = async () => {
      try {
        const songsData = await window.worship.db.run('SELECT * FROM songs ORDER BY id')
        if (songsData?.length) {
          const songsWithSections = await Promise.all(
            songsData.map(async (song: any) => {
              const sectionsData = await window.worship.db.run('SELECT * FROM song_sections WHERE song_id = ? ORDER BY order_num', [song.id])
              return { ...song, sections: (sectionsData || []).map((s: any) => ({ id: s.id, type: s.type, text: s.content })) }
            })
          )
          useStore.setState({ songs: songsWithSections })
          setSelectedSongId(songsWithSections[0]?.id || 0)
        }
        const scheduleData = await window.worship.db.run('SELECT * FROM schedule_items ORDER BY order_num')
        if (scheduleData?.length) {
          useStore.setState({ schedule: scheduleData.map((item: any) => ({ id: item.id, type: item.item_type, content: item.content })) })
        }
      } catch (error) {
        console.error('Failed to load operator data:', error)
      }
    }
    loadData()
  }, [isOutput])

  React.useEffect(() => {
    if (isOutput) return
    const isEditableTarget = (target: EventTarget | null): boolean => {
      const node = target as HTMLElement | null
      if (!node) return false
      const tag = node.tagName?.toLowerCase()
      return tag === 'input' || tag === 'textarea' || tag === 'select' || Boolean(node.closest('[contenteditable="true"]'))
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      const isEditingSong = Boolean(
        selectedSection &&
        (
          (editorText !== (selectedSection.text || '')) ||
          (editorType !== (selectedSection.type || 'Verse'))
        )
      )
      if (event.key === 'Enter' && selectedSectionId !== null && !event.shiftKey && !event.ctrlKey && !event.altKey && !isEditableTarget(event.target) && !isEditingSong) {
        event.preventDefault()
        goLive()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOutput, selectedSectionId, currentSlide, selectedSection, editorText, editorType])

  React.useEffect(() => {
    if (isOutput) return
    localStorage.setItem('operator-pane-sizes', JSON.stringify(paneSizes))
  }, [isOutput, paneSizes])

  if (isOutput) return <OutputView outId={outId} />

  const sendLiveState = (slideTitle: string) => {
    OUTPUT_IDS.forEach((id) => window?.worship?.outputs?.setState?.(id, { slideTitle, mediaPath: '', mediaType: undefined, theme }))
  }

  const notify = (title: string, detail?: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((prev) => [...prev.slice(-3), { id, title, detail, tone }])
    window.setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), 4200)
  }

  const goLive = () => {
    setLiveSlide(currentSlide)
    sendLiveState(currentSlide)
    notify('Live updated', 'Preview pushed to all outputs', 'success')
  }

  const onBlack = () => {
    window?.worship?.outputs?.actions?.black?.()
    notify('Black screen enabled', 'Outputs set to black', 'warn')
  }
  const onLogo = () => {
    window?.worship?.outputs?.actions?.logo?.()
    notify('Logo mode', 'Outputs switched to logo standby', 'info')
  }
  const onClear = () => {
    window?.worship?.outputs?.actions?.clear?.()
    sendLiveState(liveSlide)
    notify('Cleared output mode', 'Live slide restored', 'success')
  }

  const pickSection = (sectionId: number, live = false) => {
    if (!selectedSong) return
    const section = selectedSong.sections.find((item) => item.id === sectionId)
    if (!section) return
    setSelectedSectionId(section.id)
    const transposed = transposeChordMarkup(section.text, transposeSteps)
    const rendered = showChords ? transposed : stripChordMarkup(transposed)
    pushSlideUndo(currentSlide)
    setCurrentSlide(rendered)
    if (live) {
      setLiveSlide(rendered)
      sendLiveState(rendered)
    }
  }

  const saveSectionEdits = () => {
    if (!selectedSong || selectedSectionId === null) return
    updateSongSection(selectedSong.id, selectedSectionId, { type: editorType, text: editorText })
    const transposed = transposeChordMarkup(editorText, transposeSteps)
    pushSlideUndo(currentSlide)
    setCurrentSlide(showChords ? transposed : stripChordMarkup(transposed))
  }

  const toggleNdi = async () => {
    const status = await window?.worship?.ndi?.enable?.(!ndiEnabled)
    setNdiEnabled(Boolean(status?.enabled))
  }

  const updateLook = (targetOutId: number, patch: { background?: string; template?: string; layers?: string[] }) => {
    const currentLook = looks[targetOutId] || { background: '#111111', template: 'default', layers: ['slide_content'] }
    setLook(targetOutId, { ...currentLook, ...patch })
  }

  const commitSongTitle = (songId?: number) => {
    if (!songId) return
    updateSongTitle(songId, songTitleDraft)
  }

  const importSongs = async () => {
    try {
      const filePaths: string[] = await window.worship.dialog.openFiles({
        title: 'Import Songs',
        filters: [{ name: 'Song Files', extensions: ['txt', 'json'] }],
        multiSelections: true
      })
      if (!filePaths.length) return
      const importedSongs: any[] = []
      for (const filePath of filePaths) {
        const data = await window.worship.fs.readTextFile(filePath)
        let title = filePath.split('\\').pop()?.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Imported Song'
        let sectionText = data
        try {
          const parsed = JSON.parse(data)
          if (parsed && typeof parsed === 'object') {
            title = String(parsed.title || title)
            sectionText = String(parsed.text || parsed.lyrics || sectionText)
          }
        } catch {
          // plain text input is valid
        }
        const songInsert: any = await window.worship.db.run('INSERT INTO songs (title) VALUES (?)', [title])
        const songId = Number(songInsert?.lastInsertRowid)
        await window.worship.db.run(
          'INSERT INTO song_sections (song_id, type, content, order_num) VALUES (?, ?, ?, ?)',
          [songId, 'Verse', sectionText, 1]
        )
        importedSongs.push({ id: songId, title, sections: [{ id: 1, type: 'Verse', text: sectionText }] })
      }
      if (importedSongs.length) {
        useStore.setState((state: any) => ({ songs: [...state.songs, ...importedSongs] }))
        setSelectedSongId(importedSongs[0].id)
        notify('Songs imported', `${importedSongs.length} song(s) added`, 'success')
      }
    } catch (error) {
      console.error('Failed to import songs:', error)
      notify('Import failed', 'Could not import selected songs', 'warn')
    }
  }

  const connectSync = () => {
    if (syncSocket || !syncUrl) return
    const socket = new WebSocket(syncUrl)
    socket.onopen = () => setSyncConnected(true)
    socket.onclose = () => {
      setSyncConnected(false)
      setSyncSocket(null)
    }
    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data || '{}'))
        if (msg?.type === 'state' && msg.payload?.outId && msg.payload?.state) {
          window?.worship?.outputs?.setState?.(msg.payload.outId, msg.payload.state)
        }
      } catch {
        // ignore malformed sync messages
      }
    }
    setSyncSocket(socket)
  }

  const disconnectSync = () => {
    if (!syncSocket) return
    syncSocket.close()
    setSyncSocket(null)
    setSyncConnected(false)
  }

  const renderConsole = () => (
    <div
      className="workspace-grid workspace-console"
      style={{
        gridTemplateColumns: `${paneSizes.consoleLeft}px minmax(0, 1fr)`,
      }}
    >
      <Panel className="schedule-panel">
        <SectionHeader title="Order of Service" meta={`${schedule.length} items`} />
        <div className="schedule-list">
          {schedule.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex != null && dragIndex !== index) moveSchedule(dragIndex, index)
                setDragIndex(null)
              }}
              onClick={() => setCurrentSlide(item.content)}
              className={`schedule-item ${index === 0 ? 'active' : ''}`}
            >
              <div className="schedule-meta"><span>{String(index + 1).padStart(2, '0')}</span><span>{index === 0 ? 'CURRENT' : index === 1 ? 'NEXT' : 'UPCOMING'}</span></div>
              <strong>{item.content}</strong>
              <small>{item.type}</small>
            </div>
          ))}
        </div>
        <button className="soft-button full" onClick={() => { addScheduleItem(); notify('Schedule updated', 'New service item added', 'success') }}>Add Item</button>
      </Panel>

      <section className="console-stage">
        <div className="monitor-grid">
          <Panel className="monitor">
            <div className="monitor-header"><span>Preview</span><button className="text-button" onClick={() => setWorkspace('editor')}>Edit</button></div>
            <div className="slide-frame" style={{ backgroundColor: theme.bg, backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined, backgroundSize: 'cover', color: theme.color, fontSize: theme.fontSize }}>
              <div className="slide-overlay" />
              <div className="slide-content">{currentSlide}</div>
            </div>
          </Panel>
          <Panel className="monitor live">
            <div className="monitor-header"><span>Live Output</span><Pill className="live-pill">ON AIR</Pill></div>
            <div className="slide-frame" style={{ backgroundColor: theme.bg, backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined, backgroundSize: 'cover', color: theme.color, fontSize: theme.fontSize }}>
              <div className="slide-overlay live" />
              <div className="slide-content">{liveSlide}</div>
            </div>
          </Panel>
        </div>
        <Panel className="output-preview-panel" style={{ minHeight: paneSizes.consoleBottom }}>
          <SectionHeader title="Output Preview Matrix" />
          <div className="output-preview-grid">
            {OUTPUT_IDS.map((id) => {
              const state = outputStates[id] || {}
              const label = state.mode === 'black' ? 'BLACK' : state.mode === 'logo' ? 'Church Logo' : (state.slideTitle || 'Idle')
              return (
                <div key={id} className="output-tile">
                  <small>Output {id}</small>
                  <div className="output-box">{label}</div>
                  <div className="toolbar-inline" style={{ marginTop: 6 }}>
                    <button className="soft-button" onClick={() => window?.worship?.outputs?.windowControl?.(id, 'show')}>Show</button>
                    <button className="soft-button" onClick={() => window?.worship?.outputs?.windowControl?.(id, 'toggle-fullscreen')}>Full View</button>
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      </section>
    </div>
  )

  const renderLibrary = () => (
    <div className="workspace-grid workspace-library">
      <Panel className="library-filters">
        <SectionHeader title="Content Categories" />
        <div className="filter-list">
          <button className="filter-item active">Songs <span>{songs.length}</span></button>
          <button className="filter-item">Bibles <span>2</span></button>
          <button className="filter-item">Media <span>--</span></button>
          <button className="filter-item">Videos <span>{mediaAssets.filter((item) => item.type === 'video').length}</span></button>
          <button className="filter-item">Backgrounds <span>{mediaAssets.filter((item) => item.type === 'image').length}</span></button>
        </div>
        <div className="chip-group">{['Worship', 'Uplifting', 'Sermon', '4K UHD', 'Announcement', 'Instrumental'].map((tag) => <Chip key={tag}>{tag}</Chip>)}</div>
      </Panel>
      <Panel className="library-grid-panel">
        <div className="library-toolbar">
          <div><h2>Song Library</h2><p>{filteredSongs.length} arrangements</p></div>
          <div className="toolbar-inline">
            <input value={songSearchQuery} onChange={(event) => setSongSearchQuery(event.target.value)} placeholder="Search songs" className="input" />
            <button className="soft-button" onClick={importSongs}>Import Songs</button>
            <select className="input" style={{ width: 130 }} value={librarySort} onChange={(event) => setLibrarySort(event.target.value as 'name' | 'sections')}>
              <option value="name">Sort: Name</option>
              <option value="sections">Sort: Sections</option>
            </select>
            <div className="view-toggle-group">
              <button className={`view-toggle-btn ${libraryViewMode === 'grid' ? 'active' : ''}`} onClick={() => setLibraryViewMode('grid')}>Grid</button>
              <button className={`view-toggle-btn ${libraryViewMode === 'list' ? 'active' : ''}`} onClick={() => setLibraryViewMode('list')}>List</button>
            </div>
            <button className="soft-button" onClick={() => { addSong(); setWorkspace('editor') }}>Add Song</button>
          </div>
        </div>
        <div className={libraryViewMode === 'grid' ? 'bento-grid' : 'library-list'}>
          {filteredSongs.map((song) => (
            <div key={song.id} style={{ display: 'grid', gap: 6 }}>
              <MediaCard title={song.title || 'Untitled Song'} subtitle={`${song.sections.length} sections`} active={song.id === selectedSongId} onClick={() => { setSelectedSongId(song.id); setWorkspace('editor') }} />
              <button
                className="soft-button"
                style={{ width: '100%' }}
                onClick={() => {
                  const next = prompt('Rename song', song.title || '') ?? song.title
                  if (next == null) return
                  updateSongTitle(song.id, next)
                  if (song.id === selectedSongId) setSongTitleDraft(next)
                  notify('Song renamed', next.trim() || 'Untitled Song', 'success')
                }}
              >
                Rename
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )

  const renderEditor = () => {
    const bgStyle: React.CSSProperties = {
      backgroundColor: theme.bg,
      backgroundImage: theme.gradient
        ? `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`
        : theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
      backgroundSize: 'cover',
      color: theme.color,
      filter: (theme.blur ?? 0) > 0 ? `blur(${theme.blur}px)` : undefined,
    }
    return (
    <div
      className="workspace-grid workspace-editor"
      style={{ gridTemplateColumns: `${paneSizes.editorLeft}px minmax(0, 1fr) ${paneSizes.editorRight}px` }}
    >
      <aside className="panel sequence-panel">
        <div className="panel-header"><h3>Slide Sequence</h3><button className="text-button" onClick={() => selectedSong && addSongSection(selectedSong.id)}>Add</button></div>
        <div className="sequence-list">
          {(selectedSong?.sections || []).map((section, index) => (
            <button
              key={section.id}
              draggable
              onDragStart={() => setEditorDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!selectedSong || editorDragIndex == null || editorDragIndex === index) return
                moveSongSection(selectedSong.id, editorDragIndex, index)
                setEditorDragIndex(null)
                notify('Section order updated', 'Slide sequence reordered', 'info')
              }}
              className={`sequence-item ${selectedSectionId === section.id ? 'active' : ''}`}
              onClick={() => pickSection(section.id)}
              onDoubleClick={() => pickSection(section.id, true)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div><strong>{section.type}</strong><small>{stripChordMarkup(section.text).slice(0, 84) || 'Empty section'}</small></div>
            </button>
          ))}
        </div>
      </aside>
      <section className="panel stage-panel">
        <div className="panel-header">
          <input
            className="input"
            style={{ maxWidth: 360 }}
            value={songTitleDraft}
            onChange={(event) => setSongTitleDraft(event.target.value)}
            onBlur={() => commitSongTitle(selectedSong?.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commitSongTitle(selectedSong?.id)
              }
            }}
            placeholder="Song title"
          />
          <div className="toolbar-inline">
            <button className="soft-button" onClick={() => setTransposeSteps((value) => value - 1)}>Flat</button>
            <button className="soft-button" onClick={() => setTransposeSteps(0)}>Reset</button>
            <button className="soft-button" onClick={() => setTransposeSteps((value) => value + 1)}>Sharp</button>
            <button className="soft-button" onClick={() => setShowChords((value) => !value)}>{showChords ? 'Hide Chords' : 'Show Chords'}</button>
          </div>
        </div>
        <div className="stage-canvas" style={{ position: 'relative', color: theme.color }}>
          <div style={{ ...bgStyle, position: 'absolute', inset: 0, opacity: (theme.opacity ?? 100) / 100, borderRadius: 'inherit' }} />
          <div className="slide-overlay live" />
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', alignItems: (theme.verticalAlign || 'center') === 'top' ? 'flex-start' : (theme.verticalAlign || 'center') === 'bottom' ? 'flex-end' : 'center', justifyContent: 'center', padding: '40px 60px' }}>
            <h1 style={{ textAlign: theme.textAlign || 'center', fontFamily: theme.fontFamily || 'Manrope', fontWeight: theme.fontWeight || 700, width: '90%' }}>{currentSlide || 'Select a section'}</h1>
          </div>
          <span className="live-pill stage">Live View</span>
        </div>
        <div className="stage-toolbar">
          <span className="stage-label">Tt {selectedSection?.type || 'VERSE'} {selectedSectionId ? (selectedSong?.sections.findIndex(s => s.id === selectedSectionId) ?? 0) + 1 : 1}</span>
          <span className="toolbar-divider" />
          <button className="undo-redo-btn" onClick={undo} disabled={undoStack.length === 0} title="Undo">↩</button>
          <button className="undo-redo-btn" onClick={redo} disabled={redoStack.length === 0} title="Redo">↪</button>
        </div>
      </section>
      <aside className="panel inspector-panel">
        <div className="panel-header"><h3>Background &amp; Style</h3></div>
        <div className="inspector-content">
          <div className="bg-tab-group">
            <button className={`bg-tab ${bgManagerTab === 'media' ? 'active' : ''}`} onClick={() => setBgManagerTab('media')}>Media</button>
            <button className={`bg-tab ${bgManagerTab === 'gradient' ? 'active' : ''}`} onClick={() => setBgManagerTab('gradient')}>Gradient</button>
            <button className={`bg-tab ${bgManagerTab === 'color' ? 'active' : ''}`} onClick={() => setBgManagerTab('color')}>Color</button>
          </div>

          {bgManagerTab === 'media' && (
            <>
              <label>Active Media</label>
              <div className="active-media-preview">
                {theme.backgroundImage
                  ? <img src={theme.backgroundImage.startsWith('file://') || theme.backgroundImage.startsWith('http') ? theme.backgroundImage : `file://${theme.backgroundImage}`} alt="Background" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.78rem' }}>No media selected</div>
                }
              </div>
              <label>Background Image</label>
              <input className="input" value={theme.backgroundImage || ''} onChange={(event) => setTheme({ ...theme, backgroundImage: event.target.value, gradient: '' })} placeholder="file://... or https://..." />
              <label>Quick Picker</label>
              <div className="quick-picker-grid">
                <button className="quick-picker-add" onClick={() => { /* future: open file picker */ }}>+</button>
              </div>
            </>
          )}

          {bgManagerTab === 'gradient' && (
            <>
              <label>Gradient Colors</label>
              <div className="gradient-picker-row">
                <input type="color" value={gradientStart} onChange={(e) => { setGradientStart(e.target.value); setTheme({ ...theme, gradient: `linear-gradient(135deg, ${e.target.value}, ${gradientEnd})`, backgroundImage: '' }) }} />
                <div className="gradient-preview" style={{ background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }} />
                <input type="color" value={gradientEnd} onChange={(e) => { setGradientEnd(e.target.value); setTheme({ ...theme, gradient: `linear-gradient(135deg, ${gradientStart}, ${e.target.value})`, backgroundImage: '' }) }} />
              </div>
            </>
          )}

          {bgManagerTab === 'color' && (
            <>
              <label>Background Color</label>
              <input type="color" value={theme.bg} onChange={(event) => setTheme({ ...theme, bg: event.target.value, gradient: '', backgroundImage: '' })} />
            </>
          )}

          <div className="slider-row">
            <div className="slider-label"><span>Opacity</span><span>{theme.opacity ?? 100}%</span></div>
            <input type="range" min={0} max={100} value={theme.opacity ?? 100} onChange={(e) => setTheme({ ...theme, opacity: Number(e.target.value) })} />
          </div>
          <div className="slider-row">
            <div className="slider-label"><span>Blur</span><span>{theme.blur ?? 0}px</span></div>
            <input type="range" min={0} max={20} value={theme.blur ?? 0} onChange={(e) => setTheme({ ...theme, blur: Number(e.target.value) })} />
          </div>

          <label>Section Type</label>
          <select className="input" value={editorType} onChange={(event) => setEditorType(event.target.value)}>{SECTION_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <label>Section Text</label>
          <textarea className="input textarea" value={editorText} onChange={(event) => setEditorText(event.target.value)} />
          <label>Font Size ({theme.fontSize}px)</label>
          <input type="range" min={24} max={96} value={theme.fontSize} onChange={(event) => setTheme({ ...theme, fontSize: Number(event.target.value) })} />
          <label>Font Family</label>
          <select className="input" value={theme.fontFamily || 'Manrope'} onChange={(event) => setTheme({ ...theme, fontFamily: event.target.value })}>
            <option value="Manrope">Manrope</option>
            <option value="Inter">Inter</option>
            <option value="Segoe UI">Segoe UI</option>
          </select>
          <label>Font Weight ({theme.fontWeight || 700})</label>
          <input type="range" min={300} max={900} step={100} value={theme.fontWeight || 700} onChange={(event) => setTheme({ ...theme, fontWeight: Number(event.target.value) })} />
          <label>Text Alignment</label>
          <select className="input" value={theme.textAlign || 'center'} onChange={(event) => setTheme({ ...theme, textAlign: event.target.value as 'left' | 'center' | 'right' })}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
          <label>Vertical Position</label>
          <select className="input" value={theme.verticalAlign || 'center'} onChange={(event) => setTheme({ ...theme, verticalAlign: event.target.value as 'top' | 'center' | 'bottom' })}>
            <option value="top">Top Half</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom Half</option>
          </select>
          <label>Text Color</label>
          <input type="color" value={theme.color} onChange={(event) => setTheme({ ...theme, color: event.target.value })} />

          <div className="button-row">
            <button className="soft-button full" onClick={saveSectionEdits}>Save Section</button>
            <button className="live-button full" onClick={goLive}>Send Live</button>
            <button className="template-button" onClick={() => { const name = prompt('Template name:'); if (name) saveTemplate(name) }}>Save as Template</button>
          </div>
        </div>
      </aside>
    </div>
    )
  }

  const renderSettings = () => (
    <div className="workspace-grid workspace-settings">
      {/** Active output detail follows selected output card */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">Display Settings</h1>
          <p className="settings-subtitle">Configure output canvas and screen geometry</p>
        </div>
        <div className="settings-header-actions">
          <button className="soft-button" onClick={() => { setAspectRatio('16:9'); setOverscanPercent(5); setOutputResolution('1920x1080'); notify('Display reset', 'Restored default geometry', 'info') }}>Reset to Default</button>
          <button className="live-button" onClick={() => { window?.worship?.outputs?.actions?.fullscreen?.(); notify('Display applied', `${outputResolution} ${aspectRatio}`, 'success') }}>Apply Changes</button>
        </div>
      </div>

      <section className="panel output-routing-cards">
        {outputConfigs.map((output) => (
          <div key={output.id} className={`output-route-card ${output.active ? 'active' : ''}`} onClick={() => {
            setActiveOutputId(output.id)
            outputConfigs.forEach((item) => updateOutputConfig(item.id, { active: item.id === output.id }))
          }}>
            <div className="output-route-heading">
              <strong>Output {output.id}</strong>
              <small>{output.resolution}</small>
            </div>
            <select className="input" value={output.role} onChange={(event) => {
              const role = event.target.value as 'primary' | 'extended' | 'stage'
              updateOutputConfig(output.id, { role })
              notify('Output role changed', `Output ${output.id} is now ${role}`, 'info')
            }}>
              <option value="primary">Primary</option>
              <option value="extended">Extended</option>
              <option value="stage">Stage</option>
            </select>
            <div className="toolbar-inline" style={{ marginTop: 8 }}>
              <button className="soft-button" onClick={(event) => { event.stopPropagation(); window?.worship?.outputs?.windowControl?.(output.id, 'minimize') }}>Min</button>
              <button className="soft-button" onClick={(event) => { event.stopPropagation(); window?.worship?.outputs?.windowControl?.(output.id, 'maximize') }}>Max</button>
              <button className="soft-button" onClick={(event) => { event.stopPropagation(); window?.worship?.outputs?.windowControl?.(output.id, 'restore') }}>Restore</button>
              <button className="soft-button" onClick={(event) => { event.stopPropagation(); window?.worship?.outputs?.windowControl?.(output.id, 'toggle-fullscreen') }}>Full View</button>
              <button className="soft-button" onClick={(event) => { event.stopPropagation(); window?.worship?.outputs?.windowControl?.(output.id, 'restore') }}>Exit Full</button>
              <button className="soft-button" onClick={(event) => { event.stopPropagation(); window?.worship?.outputs?.windowControl?.(output.id, 'close') }}>Close</button>
            </div>
          </div>
        ))}
      </section>

      <section className="panel settings-looks-panel">
        <SectionHeader title="Per-Output Looks" meta="8-layer compositor" />
        <div className="settings-looks-grid">
          {OUTPUT_IDS.map((id) => {
            const look = looks[id] || { background: '#111111', template: 'default', layers: ['slide_content'] }
            return (
              <div key={id} className="settings-look-card">
                <div className="output-route-heading">
                  <strong>Output {id}</strong>
                  <small>{(look.template || 'default').replace('_', ' ')}</small>
                </div>
                <div className="settings-look-row">
                  <label className="settings-look-label">Background</label>
                  <label className="settings-look-label">Template</label>
                </div>
                <div className="settings-look-row">
                <input
                  type="color"
                  className="settings-color-input"
                  value={look.background || '#111111'}
                  onChange={(event) => updateLook(id, { background: event.target.value })}
                />
                <select className="input" value={look.template || 'default'} onChange={(event) => updateLook(id, { template: event.target.value })}>
                  <option value="default">Default</option>
                  <option value="lower_thirds">Lower Thirds</option>
                  <option value="full">Full</option>
                </select>
                </div>
                <div className="settings-layer-grid">
                  {LAYERS.map((layer) => {
                    const enabled = (look.layers || []).includes(layer)
                    return (
                      <label key={layer} className={`settings-layer-chip ${enabled ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => {
                            const next = enabled
                              ? (look.layers || []).filter((item) => item !== layer)
                              : [...(look.layers || []), layer]
                            updateLook(id, { layers: next })
                          }}
                        /> <span>{layer.replace('_', ' ')}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel settings-sync-panel">
        <SectionHeader title="Sync" meta={syncConnected ? 'Connected' : 'Disconnected'} />
        <div className="settings-sync-inline">
          <input className="input" value={syncUrl} onChange={(e) => setSyncUrl(e.target.value)} placeholder="ws://host:9090" />
          {!syncConnected ? (
            <button className="soft-button" onClick={connectSync}>Connect</button>
          ) : (
            <button className="soft-button" onClick={disconnectSync}>Disconnect</button>
          )}
          <span className={`settings-sync-status ${syncConnected ? 'online' : 'offline'}`}>{syncConnected ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </section>

      <section className="panel canvas-layout-section">
        <div className="canvas-layout-header">
          <div className="canvas-layout-title">🖥 Canvas Layout</div>
          <div className="ratio-chip-group">
            {(['16:9', '4:3', '21:9', 'FREE'] as const).map((ratio) => (
              <button key={ratio} className={`ratio-chip ${aspectRatio === ratio ? 'active' : ''}`} onClick={() => setAspectRatio(ratio)}>{ratio}</button>
            ))}
          </div>
        </div>
        <div className="canvas-visualizer">
          <div className="canvas-display-rect" style={{ aspectRatio: aspectRatio === '4:3' ? '4/3' : aspectRatio === '21:9' ? '21/9' : '16/9' }}>
            <span className="canvas-active-pill"><span className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--tertiary)' }} /> ACTIVE OUTPUT</span>
            <span className="canvas-display-label">Output {activeOutputId}</span>
            <span className="canvas-display-res">{outputResolution.replace('x', ' × ')}</span>
            <span className="canvas-handle tl" /><span className="canvas-handle tc" /><span className="canvas-handle tr" />
            <span className="canvas-handle ml" /><span className="canvas-handle mr" />
            <span className="canvas-handle bl" /><span className="canvas-handle bc" /><span className="canvas-handle br" />
          </div>
        </div>
      </section>

      <aside className="panel dimensions-panel">
        <div className="dimensions-title">📐 Dimensions</div>
        <div className="dimension-field">
          <label>Resolution</label>
          <div className="dimension-input-row">
            <input value={outputResolution} onChange={(e) => { setOutputResolution(e.target.value); updateOutputConfig(activeOutputId, { resolution: e.target.value }) }} />
            <button className="edit-icon" title="Edit">✏️</button>
          </div>
        </div>
        <div className="dimension-field">
          <label>Aspect Ratio</label>
          <div className="dimension-input-row">
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)}>
              <option value="16:9">16:9 Widescreen</option>
              <option value="4:3">4:3 Standard</option>
              <option value="21:9">21:9 Ultrawide</option>
              <option value="FREE">Free</option>
            </select>
          </div>
        </div>
        <div className="overscan-slider">
          <div className="slider-row">
            <div className="slider-label"><span>Overscan</span><span>{overscanPercent}%</span></div>
            <input type="range" min={0} max={20} value={overscanPercent} onChange={(e) => setOverscanPercent(Number(e.target.value))} />
          </div>
          <div className="overscan-labels"><span>0%</span><span>20%</span></div>
        </div>
        <div className="hardware-card">
          <div className="hardware-card-title">Output Hardware</div>
          <div className="hardware-card-content">
            <div className="hardware-icon">🖥</div>
            <div className="hardware-info">
              <strong>{outputHardware}</strong>
              <small>SDI Out 1 • 60fps • 10-bit</small>
            </div>
          </div>
        </div>
        <div className="preset-section">
          <label>Theme Presets</label>
          <div className="preset-grid">{THEME_PRESETS.slice(0, 6).map((preset) => <button key={preset.name} className="preset-chip" onClick={() => applyPreset(preset)}>{preset.name}</button>)}</div>
        </div>
        <div className="ndi-section">
          <label>NDI Output</label>
          <button className={`soft-button full ${ndiEnabled ? 'active' : ''}`} onClick={toggleNdi}>{ndiEnabled ? 'Disable NDI' : 'Enable NDI'}</button>
        </div>
      </aside>

      <div className="info-card-row">
        <div className="info-card">
          <span className="info-card-badge">Pro Feature</span>
          <div className="info-value" style={{ fontFamily: 'Manrope, Inter, sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Multi-Display Sync</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', lineHeight: 1.4 }}>Synchronize frame delivery across multiple graphics cards for ultra-high-resolution wall displays.</div>
        </div>
        <div className="info-card">
          <div className="info-label">🎨 Color Space</div>
          <div className="info-value">Rec.709 (High Dynamic)</div>
          <div className="info-bar" />
        </div>
        <div className="info-card">
          <div className="info-label">⏱ Frame Delay</div>
          <div className="info-value">1.2ms (Ultra Low)</div>
          <div className="info-sub">Optimized for IMAG systems</div>
        </div>
        <div className="info-card">
          <div className="info-label">🔄 Refresh Rate</div>
          <div className="info-value">60.00 Hz</div>
          <div className="info-sub">Matched to Broadcast Clock</div>
        </div>
      </div>
    </div>
  )

  const sendMediaToPreview = (asset: MediaAsset) => {
    setTheme({ ...theme, backgroundImage: asset.path })
    setCurrentSlide('')
    notify('Media to preview', asset.name || 'Preview media changed', 'info')
  }

  const sendMediaToLive = (asset: MediaAsset, playback?: { loop: boolean; muted: boolean; playbackRate: number }) => {
    const updatedTheme = { ...theme, backgroundImage: asset.path }
    setTheme(updatedTheme)
    setCurrentSlide('')
    setLiveSlide('')
    OUTPUT_IDS.forEach((id) => window?.worship?.outputs?.setState?.(id, { slideTitle: '', mediaPath: asset.path, mediaType: asset.type, mediaPlayback: playback, theme: updatedTheme }))
    notify('Media sent live', asset.name || 'Live outputs updated', 'success')
  }

  const renderRibbon = () => (
    <header className="topbar ribbon">
      <div className="ribbon-row ribbon-main">
        <div className="screen-title">
          <strong>{workspace.charAt(0).toUpperCase() + workspace.slice(1)}</strong>
          <small>{clockValue.toLocaleTimeString()}</small>
        </div>
        <div className="view-tabs">
          {(['console', 'library', 'editor', 'scripture', 'media', 'settings'] as Workspace[]).map((item) => (
            <button key={item} className={`tab ${workspace === item ? 'active' : ''}`} onClick={() => setWorkspace(item)}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
        <div className="topbar-actions">
          <button className="action-button dark" onClick={onBlack}>BLACK</button>
          <button className="action-button" onClick={onLogo}>LOGO</button>
          <button className="action-button" onClick={onClear}>CLEAR</button>
          <button className="action-button live" onClick={goLive}>SEND LIVE</button>
        </div>
      </div>
      <div className="ribbon-row ribbon-tools">
        {(workspace === 'console' || workspace === 'editor') && (
          <>
            <label className="ribbon-control">
              <span>Left Pane</span>
              <input
                type="range"
                min={240}
                max={480}
                value={workspace === 'console' ? paneSizes.consoleLeft : paneSizes.editorLeft}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  setPaneSizes((prev) => ({
                    ...prev,
                    ...(workspace === 'console' ? { consoleLeft: value } : { editorLeft: value }),
                  }))
                }}
              />
            </label>
            {workspace === 'console' && (
              <label className="ribbon-control">
                <span>Output Area</span>
                <input
                  type="range"
                  min={150}
                  max={340}
                  value={paneSizes.consoleBottom}
                  onChange={(event) => setPaneSizes((prev) => ({ ...prev, consoleBottom: Number(event.target.value) }))}
                />
              </label>
            )}
            {workspace === 'editor' && (
              <label className="ribbon-control">
                <span>Inspector Pane</span>
                <input
                  type="range"
                  min={260}
                  max={460}
                  value={paneSizes.editorRight}
                  onChange={(event) => setPaneSizes((prev) => ({ ...prev, editorRight: Number(event.target.value) }))}
                />
              </label>
            )}
          </>
        )}
        {workspace === 'editor' && (
          <>
            <button className="soft-button" onClick={() => selectedSong && addSongSection(selectedSong.id)}>Add Section</button>
            <button className="soft-button" onClick={saveSectionEdits}>Save Section</button>
          </>
        )}
        {workspace === 'media' && (
          <span className="ribbon-note">Tip: click asset for inspector, double-click to preview, then push live when ready.</span>
        )}
      </div>
    </header>
  )

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-block"><h1>The Ethereal Stage</h1><p>Sanctuary Control</p></div>
        <nav className="sidebar-nav">
          <button className={`nav-button ${workspace === 'console' ? 'active' : ''}`} onClick={() => setWorkspace('console')}>Console</button>
          <button className={`nav-button ${workspace === 'library' ? 'active' : ''}`} onClick={() => setWorkspace('library')}>Library</button>
          <button className={`nav-button ${workspace === 'editor' ? 'active' : ''}`} onClick={() => setWorkspace('editor')}>Song Editor</button>
          <button className={`nav-button ${workspace === 'scripture' ? 'active' : ''}`} onClick={() => setWorkspace('scripture')}>Scripture</button>
          <button className={`nav-button ${workspace === 'media' ? 'active' : ''}`} onClick={() => setWorkspace('media')}>Media</button>
          <button className={`nav-button ${workspace === 'settings' ? 'active' : ''}`} onClick={() => setWorkspace('settings')}>Settings</button>
        </nav>
        <div className="sidebar-footer"><button className="live-button full" onClick={goLive}>Go Live</button></div>
      </aside>

      <div className="app-main">
        {renderRibbon()}

        <main className="workspace">
          {workspace === 'console' && renderConsole()}
          {workspace === 'library' && renderLibrary()}
          {workspace === 'editor' && renderEditor()}
          {workspace === 'scripture' && <BiblePicker />}
          {workspace === 'media' && (
            <MediaLibrary
              mediaType={mediaType}
              onMediaSelect={() => undefined}
              onSendToPreview={sendMediaToPreview}
              onSendToLive={sendMediaToLive}
              onNotify={notify}
            />
          )}
          {workspace === 'settings' && renderSettings()}
        </main>
        <Notifications items={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))} />
      </div>
    </div>
  )
}

const mountPoint = document.getElementById('root')
const root = mountPoint ? createRoot(mountPoint) : null
if (root) root.render(<App />)
