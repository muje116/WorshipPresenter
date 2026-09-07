import React from 'react'
import { createRoot } from 'react-dom/client'
import { useStore, THEME_PRESETS } from './store'
import { dbService } from './services/db'
import { OutputView } from './components/OutputView'
import { BiblePicker } from './components/BiblePicker'
import { MediaLibrary } from './components/MediaLibrary'
import { Notifications, ToastItem, ToastTone } from './components/Notifications'
import { ConsoleWorkspace } from './components/ConsoleWorkspace'
import { LibraryWorkspace } from './components/LibraryWorkspace'
import { EditorWorkspace } from './components/EditorWorkspace'
import { SettingsWorkspace } from './components/SettingsWorkspace'
import { HelpWorkspace } from './components/HelpWorkspace'
import { CommandPalette, Command } from './components/CommandPalette'
import { DialogProvider, useDialog } from './components/Dialog'
import { AppIcon, IconName } from './components/ui'
import './styles.css'

declare const window: any

const OUTPUT_IDS = [1, 2]

const NOTE_INDEX: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
}
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

type Workspace = 'console' | 'library' | 'editor' | 'scripture' | 'media' | 'settings' | 'help'
type PaneSizes = { consoleLeft: number; consoleBottom: number; editorLeft: number; editorRight: number }
type MediaAsset = { id: number; path: string; type: 'image' | 'video' | string; name?: string; duration?: number }

const NAV_ITEMS: Array<{ id: Exclude<Workspace, 'help'>; label: string; icon: IconName }> = [
  { id: 'console', label: 'Console', icon: 'console' },
  { id: 'library', label: 'Library', icon: 'library' },
  { id: 'editor', label: 'Song Editor', icon: 'editor' },
  { id: 'scripture', label: 'Scripture', icon: 'scripture' },
  { id: 'media', label: 'Media', icon: 'media' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

const PAGE_META: Record<Workspace, { title: string; subtitle: string }> = {
  console: { title: 'Console', subtitle: 'Control your worship experience' },
  library: { title: 'Song Library', subtitle: 'Manage and organize your worship songs' },
  editor: { title: 'Song Editor', subtitle: 'Create and edit your worship content' },
  scripture: { title: 'Bible', subtitle: 'Display scripture with clarity and focus' },
  media: { title: 'Media Assets', subtitle: 'Manage images, videos, and backgrounds' },
  settings: { title: 'Settings', subtitle: 'Configure displays, outputs, and preferences' },
  help: { title: 'Help', subtitle: 'Guides and operational shortcuts' },
}

const getOutId = (): number => {
  try {
    const q = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const value = q.get('out')
    return value ? Number(value) : 0
  } catch { return 0 }
}

const stripChordMarkup = (text: string): string =>
  text.replace(/\[([^\]]+)\]/g, '').replace(/\s+/g, ' ').trim()

const transposeChord = (chord: string, steps: number): string => {
  const match = chord.match(/^([A-G])([#b]?)(.*)$/)
  if (!match) return chord
  const [, root, accidental, suffix] = match
  const startIndex = NOTE_INDEX[`${root}${accidental || ''}`]
  if (startIndex == null) return chord
  return `${NOTE_NAMES[(startIndex + steps + 12) % 12]}${suffix || ''}`
}

const transposeChordMarkup = (text: string, steps: number): string =>
  steps
    ? text.replace(/\[([^\]]+)\]/g, (_match: string, chord: string) => `[${transposeChord(chord, steps)}]`)
    : text

// ─── Inner App (needs DialogProvider) ────────────────────────────────────────

const AppInner: React.FC = () => {
  const { show: showDialog } = useDialog()
  const outId = getOutId()
  const isOutput = outId > 0

  // Store selectors
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
  const deleteSong = useStore((state) => state.deleteSong)
  const deleteSongSection = useStore((state) => state.deleteSongSection)
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
  const displays = useStore((state) => state.displays)
  const setDisplays = useStore((state) => state.setDisplays)

  // UI state
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
  const [isOnAir, setIsOnAir] = React.useState(false)
  const [presentationPaused, setPresentationPaused] = React.useState(false)
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
  const [activeOutputId, setActiveOutputId] = React.useState(1)
  const [aspectRatio, setAspectRatio] = React.useState<'16:9' | '4:3' | '21:9' | 'FREE'>('16:9')
  const [overscanPercent, setOverscanPercent] = React.useState(5)
  const [outputResolution, setOutputResolution] = React.useState('1920x1080')
  const [outputHardware] = React.useState('Built-in Display')
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
    } catch { return { consoleLeft: 320, consoleBottom: 210, editorLeft: 310, editorRight: 330 } }
  })
  const [syncUrl, setSyncUrl] = React.useState('ws://localhost:9090')
  const [syncConnected, setSyncConnected] = React.useState(false)
  const [syncSocket, setSyncSocket] = React.useState<WebSocket | null>(null)
  const [showPalette, setShowPalette] = React.useState(false)
  const [logoImage, setLogoImage] = React.useState<string>(() => {
    try { return localStorage.getItem('worship-logo-image') || '' } catch { return '' }
  })
  const [appVersion, setAppVersion] = React.useState('')
  const [appLoading, setAppLoading] = React.useState(true)
  const [activeOutputWindows, setActiveOutputWindows] = React.useState<any[]>(() => {
    if (typeof window !== 'undefined' && window.worship?.outputs?.list) {
      window.worship.outputs.list().then((list: any) => setActiveOutputWindows(list || [])).catch(() => {})
    }
    return []
  })

  // Derived
  const selectedSong = songs.find((song) => song.id === selectedSongId) || songs[0]
  const selectedSection = selectedSong?.sections.find((s) => s.id === selectedSectionId) || selectedSong?.sections[0]
  const filteredSongs = songs
    .filter((song) =>
      !songSearchQuery ||
      song.title.toLowerCase().includes(songSearchQuery.toLowerCase()) ||
      song.artist?.toLowerCase().includes(songSearchQuery.toLowerCase())
    )
    .sort((a, b) => (librarySort === 'name' ? a.title.localeCompare(b.title) : b.sections.length - a.sections.length))

  // ── Effects ────────────────────────────────────────────────────────────────

  React.useEffect(() => {
    if (isOutput) return
    const timer = setInterval(() => setClockValue(new Date()), 1000)
    return () => clearInterval(timer)
  }, [isOutput])

  React.useEffect(() => {
    if (isOutput) return
    if (!songs.find((s) => s.id === selectedSongId) && songs[0]) setSelectedSongId(songs[0].id)
  }, [isOutput, selectedSongId, songs])

  React.useEffect(() => {
    if (!selectedSection) { setEditorText(''); return }
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
    window?.worship?.ndi?.status?.()
      .then((status: { enabled?: boolean }) => setNdiEnabled(Boolean(status?.enabled)))
      .catch(() => setNdiEnabled(false))
  }, [isOutput])

  React.useEffect(() => {
    if (isOutput) return
    const loadData = async () => {
      try {
        const songsWithSections = await dbService.songs.getAll()
        if (songsWithSections?.length) {
          useStore.setState({ songs: songsWithSections })
          setSelectedSongId(songsWithSections[0]?.id || 0)
        }
        const scheduleItems = await dbService.schedule.getItems()
        if (scheduleItems?.length) {
          useStore.setState({ schedule: scheduleItems })
        }
      } catch (error) {
        console.error('Failed to load operator data:', error)
      } finally {
        window.setTimeout(() => setAppLoading(false), 250)
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
      // Ctrl+K: open command palette
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        setShowPalette((v) => !v)
        return
      }
      const isEditingSong = Boolean(
        selectedSection &&
        (editorText !== (selectedSection.text || '') || editorType !== (selectedSection.type || 'Verse'))
      )
      if (
        event.key === 'Enter' &&
        selectedSectionId !== null &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isEditableTarget(event.target) &&
        !isEditingSong
      ) {
        event.preventDefault()
        goLive()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOutput, selectedSectionId, currentSlide, selectedSection, editorText, editorType, presentationPaused])

  React.useEffect(() => {
    if (isOutput) return
    localStorage.setItem('operator-pane-sizes', JSON.stringify(paneSizes))
  }, [isOutput, paneSizes])

  React.useEffect(() => {
    try { localStorage.setItem('worship-logo-image', logoImage) } catch {}
  }, [logoImage])

  // Load displays on startup
  React.useEffect(() => {
    if (isOutput) return
    const loadDisplays = async () => {
      try {
        if (window.worship?.displays?.getAll) {
          const d = await window.worship.displays.getAll()
          if (d?.length) setDisplays(d)
        }
        if (window.worship?.app?.getVersion) {
          const v = await window.worship.app.getVersion()
          setAppVersion(v || '')
        }
        if (window.worship?.outputs?.list) {
          const list = await window.worship.outputs.list()
          setActiveOutputWindows(list || [])
        }
      } catch (e) {
        console.error('Failed to load system info:', e)
      }
    }
    loadDisplays()
  }, [isOutput])

  // Listen for display changes
  React.useEffect(() => {
    if (isOutput || !window.worship?.displays?.onChanged) return
    const cleanup = window.worship.displays.onChanged((d: any[]) => {
      if (d?.length) setDisplays(d)
    })
    return cleanup
  }, [isOutput])

  // Refresh output list when displays change
  React.useEffect(() => {
    if (isOutput) return
    const refresh = async () => {
      try {
        if (window.worship?.outputs?.list) {
          const list = await window.worship.outputs.list()
          setActiveOutputWindows(list || [])
        }
      } catch {}
    }
    refresh()
  }, [displays, isOutput])

  if (isOutput) return <OutputView outId={outId} logoImage={logoImage} />

  // ── Helpers ────────────────────────────────────────────────────────────────

  const sendLiveState = (slideTitle: string) => {
    const targetOutputIds = activeOutputWindows.length
      ? activeOutputWindows.map((item: any) => Number(item.id)).filter(Boolean)
      : OUTPUT_IDS
    targetOutputIds.forEach((id) =>
      window?.worship?.outputs?.setState?.(id, { slideTitle, mediaPath: '', mediaType: undefined, theme })
    )
  }

  const notify = (title: string, detail?: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((prev) => [...prev.slice(-3), { id, title, detail, tone }])
    window.setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), 4200)
  }

  const goLive = () => {
    if (presentationPaused) {
      notify('Presentation paused', 'Resume the live feed before sending a new slide', 'warn')
      return
    }
    setLiveSlide(currentSlide)
    sendLiveState(currentSlide)
    setIsOnAir(true)
    notify('Live updated', 'Preview pushed to all outputs', 'success')
  }

  const onBlack = () => {
    window?.worship?.outputs?.actions?.black?.()
    setIsOnAir(true)
    notify('Black screen enabled', 'Outputs set to black', 'warn')
  }
  const onLogo = () => {
    window?.worship?.outputs?.actions?.logo?.()
    setIsOnAir(true)
    notify('Logo mode', 'Outputs switched to logo standby', 'info')
  }
  const onClear = () => {
    window?.worship?.outputs?.actions?.clear?.()
    sendLiveState(liveSlide)
    notify('Cleared output mode', 'Live slide restored', 'success')
  }

  const togglePresentationPause = () => {
    setPresentationPaused((paused) => {
      const next = !paused
      notify(next ? 'Presentation paused' : 'Presentation resumed', next ? 'Live output is held on the current slide' : 'New slides can be sent live', next ? 'warn' : 'success')
      return next
    })
  }

  const endLive = () => {
    onClear()
    setIsOnAir(false)
    setPresentationPaused(false)
    notify('Live session ended', 'Outputs returned to standby', 'info')
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
    if (live) { setLiveSlide(rendered); sendLiveState(rendered) }
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

  const commitSongTitle = () => {
    if (!selectedSong) return
    updateSongTitle(selectedSong.id, songTitleDraft)
  }

  const importSongs = async () => {
    try {
      const filePaths: string[] = await window.worship.dialog.openFiles({
        title: 'Import Songs',
        filters: [{ name: 'Song Files', extensions: ['txt', 'json'] }],
        multiSelections: true,
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
        } catch { /* plain text is valid */ }
        const createdSong = await dbService.songs.create(title)
        await dbService.songs.updateSection(createdSong.id, createdSong.sections[0].id, { type: 'Verse', text: sectionText })
        importedSongs.push({ ...createdSong, sections: [{ ...createdSong.sections[0], text: sectionText }] })
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
    socket.onclose = () => { setSyncConnected(false); setSyncSocket(null) }
    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data || '{}'))
        if (msg?.type === 'state' && msg.payload?.outId && msg.payload?.state) {
          window?.worship?.outputs?.setState?.(msg.payload.outId, msg.payload.state)
        }
      } catch { /* ignore malformed sync messages */ }
    }
    setSyncSocket(socket)
  }

  const disconnectSync = () => {
    if (!syncSocket) return
    syncSocket.close()
    setSyncSocket(null)
    setSyncConnected(false)
  }

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
    const targetOutputIds = activeOutputWindows.length
      ? activeOutputWindows.map((item: any) => Number(item.id)).filter(Boolean)
      : OUTPUT_IDS
    targetOutputIds.forEach((id) =>
      window?.worship?.outputs?.setState?.(id, {
        slideTitle: '', mediaPath: asset.path, mediaType: asset.type,
        mediaPlayback: playback, theme: updatedTheme,
      })
    )
    setIsOnAir(true)
    notify('Media sent live', asset.name || 'Live outputs updated', 'success')
  }

  const pickLogoFile = async () => {
    try {
      const files: string[] = await window.worship.dialog.openFiles({
        title: 'Select Logo Image',
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'] }],
      })
      if (files[0]) setLogoImage(files[0])
    } catch { /* ignore */ }
  }

  // ── Command palette commands ───────────────────────────────────────────────

  const paletteCommands: Command[] = [
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
    { id: 'add-song', label: 'Add New Song', icon: '➕', category: 'Library', action: async () => { await addSong(); setWorkspace('editor') } },
    { id: 'import-songs', label: 'Import Songs', icon: '📥', category: 'Library', action: importSongs },
    { id: 'add-section', label: 'Add Section to Song', icon: '➕', category: 'Editor', action: () => selectedSong && addSongSection(selectedSong.id) },
    { id: 'save-section', label: 'Save Section Edits', icon: '💾', category: 'Editor', action: saveSectionEdits },
    { id: 'undo', label: 'Undo', icon: '↩', category: 'Editor', keywords: ['undo', 'back'], action: undo },
    { id: 'redo', label: 'Redo', icon: '↪', category: 'Editor', action: redo },
    { id: 'toggle-ndi', label: ndiEnabled ? 'Disable NDI' : 'Enable NDI', icon: '📡', category: 'Settings', action: toggleNdi },
    { id: 'sync-connect', label: syncConnected ? 'Disconnect Sync' : 'Connect Sync', icon: '🔗', category: 'Settings', action: syncConnected ? disconnectSync : connectSync },
  ]

  // ── Command bar ─────────────────────────────────────────────────────────────

  const renderRibbon = () => (
    <header className="topbar ribbon">
      <div className="ribbon-row ribbon-main">
        <div className="topbar-context">
          <span className="topbar-eyebrow">WORSHIP PRESENTER / WORKSPACE</span>
          <div className="screen-title">
            <strong>{PAGE_META[workspace].title}</strong>
            <small>{PAGE_META[workspace].subtitle}</small>
          </div>
        </div>
        <div className="topbar-center-status">
          <span className={`topbar-live-state ${isOnAir ? 'on-air' : ''}`}>
            <span className="topbar-live-dot" />
            {isOnAir ? 'ON AIR' : 'STANDBY'}
          </span>
          <span className="topbar-output-summary">
            <span className="connected-dot" />
            {activeOutputWindows.length || 2} outputs connected
          </span>
        </div>
        <div className="topbar-actions">
          <button className="palette-trigger" onClick={() => setShowPalette(true)} title="Command Palette (Ctrl+K)">
            <span>Search</span><kbd>Ctrl K</kbd>
          </button>
          <button className="action-button dark" onClick={onBlack} title="Black screen">
            <AppIcon name="black" size={14} /> BLACK
          </button>
          <button className="action-button" onClick={onLogo} title="Logo mode">
            <AppIcon name="logo" size={14} /> LOGO
          </button>
          <button className="action-button" onClick={onClear} title="Clear output override">
            <AppIcon name="clear" size={14} /> CLEAR
          </button>
          <button className="action-button live" onClick={goLive} title="Send preview live">
            <AppIcon name="send" size={14} /> SEND LIVE
          </button>
        </div>
      </div>
      <div className="ribbon-row ribbon-tools">
        <span className="command-bar-label"><AppIcon name="spark" size={13} /> Operator controls</span>
        {(workspace === 'console' || workspace === 'editor') && (
          <>
            <label className="ribbon-control">
              <span>Left Pane</span>
              <input
                type="range" min={240} max={480}
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
                <input type="range" min={150} max={340} value={paneSizes.consoleBottom}
                  onChange={(event) => setPaneSizes((prev) => ({ ...prev, consoleBottom: Number(event.target.value) }))} />
              </label>
            )}
            {workspace === 'editor' && (
              <label className="ribbon-control">
                <span>Inspector Pane</span>
                <input type="range" min={260} max={460} value={paneSizes.editorRight}
                  onChange={(event) => setPaneSizes((prev) => ({ ...prev, editorRight: Number(event.target.value) }))} />
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-block">
          <div className="brand-lockup">
            <span className="brand-mark"><AppIcon name="spark" size={18} strokeWidth={2.2} /></span>
            <div>
              <h1>Worship Presenter</h1>
              <p>Present <span>•</span> Worship <span>•</span> Inspire</p>
            </div>
          </div>
        </div>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} className={`nav-button ${workspace === item.id ? 'active' : ''}`} onClick={() => setWorkspace(item.id)} aria-current={workspace === item.id ? 'page' : undefined}>
              <span className="nav-icon"><AppIcon name={item.icon} size={17} /></span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-section-label">SUPPORT</div>
          <button className={`nav-button ${workspace === 'help' ? 'active' : ''}`} onClick={() => setWorkspace('help')} aria-current={workspace === 'help' ? 'page' : undefined}>
            <span className="nav-icon"><AppIcon name="help" size={17} /></span>
            <span>Help &amp; shortcuts</span>
          </button>
          <div className="sidebar-operator-card">
            <span className="operator-avatar">WP</span>
            <span className="operator-copy"><strong>Operator</strong><small>{isOnAir ? 'Live session' : 'Ready to present'}</small></span>
            <span className={`operator-status ${isOnAir ? 'live' : ''}`} />
          </div>
          <button className="live-button sidebar-go-live" onClick={goLive}>
            <AppIcon name="send" size={15} /> Go Live
          </button>
        </div>
      </aside>

      <div className="app-main">
        {renderRibbon()}

        <main className="workspace">
          {workspace === 'console' && (
            <ConsoleWorkspace
              schedule={schedule}
              theme={theme}
              currentSlide={currentSlide}
              liveSlide={liveSlide}
              paneSizes={paneSizes}
              outputStates={outputStates}
              dragIndex={dragIndex}
              onDragStart={setDragIndex}
              onDrop={(idx) => { moveSchedule(dragIndex!, idx); setDragIndex(null); notify('Schedule updated', 'Order changed', 'info') }}
              onScheduleItemClick={(content) => { setCurrentSlide(content) }}
              onAddScheduleItem={() => { addScheduleItem(); notify('Schedule updated', 'New service item added', 'success') }}
              onGoToEditor={() => setWorkspace('editor')}
              isOnAir={isOnAir}
              presentationPaused={presentationPaused}
              onGoLive={goLive}
              onClear={onClear}
              onLogo={onLogo}
              onBlack={onBlack}
              onTogglePause={togglePresentationPause}
              onEndLive={endLive}
            />
          )}

          {workspace === 'library' && (
            <LibraryWorkspace
              songs={songs}
              filteredSongs={filteredSongs}
              selectedSongId={selectedSongId}
              mediaAssets={mediaAssets}
              songSearchQuery={songSearchQuery}
              librarySort={librarySort}
              libraryViewMode={libraryViewMode}
              onSearchChange={setSongSearchQuery}
              onSortChange={setLibrarySort}
              onViewModeChange={setLibraryViewMode}
              onSelectSong={(id) => { setSelectedSongId(id); setWorkspace('editor') }}
              onAddSong={() => { addSong(); setWorkspace('editor') }}
              onImportSongs={importSongs}
              onRenameSong={async (song) => {
                const next = await showDialog({ type: 'prompt', title: 'Rename Song', defaultValue: song.title, confirmLabel: 'Rename' })
                if (typeof next === 'string' && next.trim()) {
                  updateSongTitle(song.id, next.trim())
                  if (song.id === selectedSongId) setSongTitleDraft(next.trim())
                  notify('Song renamed', next.trim(), 'success')
                }
              }}
              onDeleteSong={async (song) => {
                const confirmed = await showDialog({
                  type: 'confirm', tone: 'danger',
                  title: `Delete "${song.title}"?`,
                  message: 'This will permanently delete the song and all its sections.',
                  confirmLabel: 'Delete',
                })
                if (confirmed) { await deleteSong(song.id); notify('Song deleted', song.title, 'warn') }
              }}
            />
          )}

          {workspace === 'editor' && (
            <EditorWorkspace
              selectedSong={selectedSong}
              selectedSectionId={selectedSectionId}
              currentSlide={currentSlide}
              theme={theme}
              editorText={editorText}
              editorType={editorType}
              showChords={showChords}
              transposeSteps={transposeSteps}
              undoStack={undoStack}
              redoStack={redoStack}
              songTitleDraft={songTitleDraft}
              gradientStart={gradientStart}
              gradientEnd={gradientEnd}
              bgManagerTab={bgManagerTab}
              editorDragIndex={editorDragIndex}
              paneSizes={paneSizes}
              onEditorTextChange={setEditorText}
              onEditorTypeChange={setEditorType}
              onSongTitleDraftChange={setSongTitleDraft}
              onCommitSongTitle={commitSongTitle}
              onPickSection={pickSection}
              onAddSection={() => selectedSong && addSongSection(selectedSong.id)}
              onDeleteSection={async (sectionId) => {
                const confirmed = await showDialog({
                  type: 'confirm', tone: 'danger',
                  title: 'Delete Section?',
                  message: 'This will permanently remove this slide section.',
                  confirmLabel: 'Delete',
                })
                if (confirmed && selectedSong) await deleteSongSection(selectedSong.id, sectionId)
              }}
              onMoveSongSection={(from, to) => selectedSong && moveSongSection(selectedSong.id, from, to)}
              onSetEditorDragIndex={setEditorDragIndex}
              onSetTransposeSteps={(fn) => setTransposeSteps(fn)}
              onSetShowChords={(fn) => setShowChords(fn)}
              onSetTheme={setTheme}
              onSetBgManagerTab={setBgManagerTab}
              onSetGradientStart={setGradientStart}
              onSetGradientEnd={setGradientEnd}
              onSaveSectionEdits={saveSectionEdits}
              onGoLive={goLive}
              onSaveTemplate={async () => {
                const name = await showDialog({ type: 'prompt', title: 'Save Template', defaultValue: 'My Template', confirmLabel: 'Save' })
                if (typeof name === 'string' && name.trim()) saveTemplate(name.trim())
              }}
              onUndo={undo}
              onRedo={redo}
              stripChordMarkup={stripChordMarkup}
              onNotify={notify}
            />
          )}

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

          {workspace === 'settings' && (
            <SettingsWorkspace
              theme={theme}
              outputConfigs={outputConfigs}
              looks={looks}
              ndiEnabled={ndiEnabled}
              syncConnected={syncConnected}
              syncUrl={syncUrl}
              aspectRatio={aspectRatio}
              overscanPercent={overscanPercent}
              outputResolution={outputResolution}
              outputHardware={outputHardware}
              activeOutputId={activeOutputId}
              themePresets={THEME_PRESETS}
              logoImage={logoImage}
              displays={displays}
              appVersion={appVersion}
              activeOutputWindows={activeOutputWindows}
              onSyncUrlChange={setSyncUrl}
              onConnectSync={connectSync}
              onDisconnectSync={disconnectSync}
              onSetAspectRatio={setAspectRatio}
              onSetOverscanPercent={setOverscanPercent}
              onSetOutputResolution={setOutputResolution}
              onSetActiveOutputId={setActiveOutputId}
              onUpdateOutputConfig={updateOutputConfig}
              onUpdateLook={updateLook}
              onToggleNdi={toggleNdi}
              onApplyPreset={applyPreset}
              onResetDisplay={() => {
                setAspectRatio('16:9')
                setOverscanPercent(5)
                setOutputResolution('1920x1080')
                notify('Display reset', 'Restored default geometry', 'info')
              }}
              onApplyDisplayChanges={() => {
                window?.worship?.outputs?.actions?.fullscreen?.()
                notify('Display applied', `${outputResolution} ${aspectRatio}`, 'success')
              }}
              onLogoImageChange={setLogoImage}
              onPickLogoFile={pickLogoFile}
              onNotify={notify}
              onRefreshOutputWindows={async () => {
                if (window.worship?.outputs?.list) {
                  const list = await window.worship.outputs.list()
                  setActiveOutputWindows(list || [])
                }
              }}
            />
          )}

          {workspace === 'help' && (
            <HelpWorkspace
              appVersion={appVersion}
              displayCount={displays.length}
              outputCount={activeOutputWindows.length}
            />
          )}
        </main>

        <Notifications items={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))} />
      </div>

      {appLoading && (
        <div className="app-loader-overlay">
          <div className="app-loader-card">
            <strong>Loading WorshipPresenter</strong>
            <span>Preparing songs, media, Bibles, and displays...</span>
            <div className="app-loader-bar"><div /></div>
          </div>
        </div>
      )}

      {showPalette && (
        <CommandPalette commands={paletteCommands} onClose={() => setShowPalette(false)} />
      )}
    </div>
  )
}

// ─── Root with providers ──────────────────────────────────────────────────────

const App: React.FC = () => (
  <DialogProvider>
    <AppInner />
  </DialogProvider>
)

const mountPoint = document.getElementById('root')
const root = mountPoint ? createRoot(mountPoint) : null
if (root) root.render(<App />)
