import React from 'react'
import { createRoot } from 'react-dom/client'
import { useStore, THEME_PRESETS } from './store'
import { OutputView } from './components/OutputView'
import { BiblePicker } from './components/BiblePicker'
import { MediaLibrary } from './components/MediaLibrary'
import './styles.css'

declare const window: any

const OUTPUT_IDS = [1, 2]
const LAYERS = ['background', 'media', 'slide_content', 'props_overlays', 'announcements', 'lower_thirds', 'live_video', 'alerts']
const SECTION_TYPES = ['Intro', 'Verse', 'Chorus', 'Bridge', 'Pre-Chorus', 'Post-Chorus', 'Tag', 'Outro', 'Interlude', 'Instrumental']
const NOTE_INDEX: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
}
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

type TabType = 'songs' | 'bibles' | 'images' | 'videos' | 'settings'

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
  const normalized = `${root}${accidental || ''}`
  const startIndex = NOTE_INDEX[normalized]
  if (startIndex == null) return chord
  const nextIndex = (startIndex + steps + 12) % 12
  return `${NOTE_NAMES[nextIndex]}${suffix || ''}`
}

const transposeChordMarkup = (text: string, steps: number): string => {
  if (!steps) return text
  return text.replace(/\[([^\]]+)\]/g, (_match: string, chord: string) => `[${transposeChord(chord, steps)}]`)
}

const App: React.FC = () => {
  const outId = getOutId()
  const isOutput = outId > 0
  const songs = useStore((state) => state.songs)
  const schedule = useStore((state) => state.schedule)
  const theme = useStore((state) => state.theme)
  const currentSlide = useStore((state) => state.currentSlide)
  const liveSlide = useStore((state) => state.liveSlide)
  const looks = useStore((state) => state.looks)
  const addSong = useStore((state) => state.addSong)
  const updateSongSection = useStore((state) => state.updateSongSection)
  const addSongSection = useStore((state) => state.addSongSection)
  const setCurrentSlide = useStore((state) => state.setCurrentSlide)
  const setLiveSlide = useStore((state) => state.setLiveSlide)
  const addScheduleItem = useStore((state) => state.addScheduleItem)
  const moveSchedule = useStore((state) => state.moveSchedule)
  const setTheme = useStore((state) => state.setTheme)
  const applyPreset = useStore((state) => state.applyPreset)
  const setLook = useStore((state) => state.setLook)
  const [dragIndex, setDragIndex] = React.useState<number | null>(null)
  const [selectedSongId, setSelectedSongId] = React.useState<number>(songs[0]?.id ?? 0)
  const [showChords, setShowChords] = React.useState(true)
  const [transposeSteps, setTransposeSteps] = React.useState(0)
  const [ndiEnabled, setNdiEnabled] = React.useState(false)
  const [outputStates, setOutputStates] = React.useState<Record<number, { slideTitle?: string; mode?: string }>>({})
  const [activeTab, setActiveTab] = React.useState<TabType>('songs')
  const [selectedSectionId, setSelectedSectionId] = React.useState<number | null>(null)
  const [selectedMedia, setSelectedMedia] = React.useState<any>(null)
  const [songSearchQuery, setSongSearchQuery] = React.useState('')

  React.useEffect(() => {
    if (isOutput) return
    if (!songs.find((song) => song.id === selectedSongId) && songs[0]) {
      setSelectedSongId(songs[0].id)
    }
  }, [isOutput, selectedSongId, songs])

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
    window?.worship?.ndi?.status?.().then((status: { enabled?: boolean }) => {
      setNdiEnabled(Boolean(status?.enabled))
    }).catch(() => {
      setNdiEnabled(false)
    })
  }, [isOutput])

  // Load songs and schedule from database on mount
  React.useEffect(() => {
    if (isOutput) return
    const loadData = async () => {
      try {
        // Load songs from database
        const songsData = await window.worship.db.run('SELECT * FROM songs ORDER BY title')
        if (songsData && songsData.length > 0) {
          const songsWithSections = await Promise.all(
            songsData.map(async (song: any) => {
              const sectionsData = await window.worship.db.run(
                'SELECT * FROM song_sections WHERE song_id = ? ORDER BY order_num',
                [song.id]
              )
              return {
                ...song,
                sections: sectionsData?.map((s: any) => ({
                  id: s.id,
                  type: s.type,
                  text: s.content
                })) || []
              }
            })
          )
          // Update store with loaded songs
          useStore.setState({ songs: songsWithSections })
          if (songsWithSections.length > 0) {
            setSelectedSongId(songsWithSections[0].id)
          }
        }

        // Load schedule from database
        const scheduleData = await window.worship.db.run(
          'SELECT * FROM schedule_items ORDER BY order_num'
        )
        if (scheduleData && scheduleData.length > 0) {
          useStore.setState({
            schedule: scheduleData.map((item: any) => ({
              id: item.id,
              type: item.item_type,
              content: item.content
            }))
          })
        }
      } catch (error) {
        console.error('Failed to load data from database:', error)
      }
    }
    loadData()
  }, [isOutput])

  // Keyboard shortcuts
  React.useEffect(() => {
    if (isOutput) return
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter key sends selected section to live
      if (e.key === 'Enter' && selectedSectionId !== null && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        goLive()
      }
      // Space bar also sends to live (common in presentation software)
      if (e.key === ' ' && selectedSectionId !== null && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        goLive()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOutput, selectedSectionId, currentSlide])

  if (isOutput) {
    return <OutputView outId={outId} />
  }

  const selectedSong = songs.find((song) => song.id === selectedSongId) || songs[0]

  const sendLiveState = (slideTitle: string) => {
    OUTPUT_IDS.forEach((id) => {
      window?.worship?.outputs?.setState?.(id, {
        slideTitle,
        theme
      })
    })
  }

  const goLive = () => {
    setLiveSlide(currentSlide)
    sendLiveState(currentSlide)
  }

  const onBlack = () => {
    window?.worship?.outputs?.actions?.black?.()
  }

  const onLogo = () => {
    window?.worship?.outputs?.actions?.logo?.()
  }

  const onClear = () => {
    window?.worship?.outputs?.actions?.clear?.()
    sendLiveState(liveSlide)
  }

  const handleSectionDoubleClick = (sectionText: string, sectionId: number) => {
    setCurrentSlide(sectionText)
    setLiveSlide(sectionText)
    setSelectedSectionId(sectionId)
    sendLiveState(sectionText)
  }

  const handleSectionClick = (sectionText: string, sectionId: number) => {
    setCurrentSlide(sectionText)
    setSelectedSectionId(sectionId)
  }

  const toggleNdi = async () => {
    const status = await window?.worship?.ndi?.enable?.(!ndiEnabled)
    setNdiEnabled(Boolean(status?.enabled))
  }

  const updateLook = (targetOutId: number, patch: { background?: string; template?: string; layers?: string[] }) => {
    const currentLook = looks[targetOutId] || { background: '#111111', template: 'default', layers: ['slide_content'] }
    setLook(targetOutId, { ...currentLook, ...patch })
  }

  const renderLookControls = (targetOutId: number) => {
    const look = looks[targetOutId] || {
      background: targetOutId === 1 ? '#1a1a1a' : '#111111',
      template: 'default',
      layers: ['slide_content', targetOutId === 1 ? 'lower_thirds' : 'announcements']
    }
    return (
      <div key={targetOutId} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <strong className="text-sm text-slate-200">Output {targetOutId}</strong>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-400">Background</span>
          <input 
            type="color" 
            value={look.background} 
            onChange={(e) => updateLook(targetOutId, { background: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>
        <div className="mt-3">
          <span className="text-xs text-slate-400">Template</span>
          <select 
            value={look.template} 
            onChange={(e) => updateLook(targetOutId, { template: e.target.value })}
            className="mt-1 w-full bg-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-600"
          >
            <option value="default">Default</option>
            <option value="lower-thirds">Lower Thirds</option>
            <option value="full">Full</option>
          </select>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {LAYERS.map((layer) => {
            const activeLayers = look.layers || []
            const checked = activeLayers.includes(layer)
            return (
              <label key={layer} className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => updateLook(targetOutId, {
                    layers: checked ? activeLayers.filter((item) => item !== layer) : [...activeLayers, layer]
                  })}
                  className="rounded"
                />
                {layer}
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  const SidebarTab: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-all duration-200 ${
        active 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </button>
  )

  const renderSongsTab = () => {
    // Filter songs based on search query
    const filteredSongs = songSearchQuery
      ? songs.filter(song => 
          song.title.toLowerCase().includes(songSearchQuery.toLowerCase()) ||
          song.artist?.toLowerCase().includes(songSearchQuery.toLowerCase())
        )
      : songs

    // Sort alphabetically by title
    const sortedSongs = [...filteredSongs].sort((a, b) => 
      a.title.localeCompare(b.title)
    )

    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-slate-700 space-y-2">
          <button
            onClick={addSong}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>+</span> Add New Song
          </button>
          <input
            type="text"
            value={songSearchQuery}
            onChange={(e) => setSongSearchQuery(e.target.value)}
            placeholder="Search songs..."
            className="w-full bg-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-600"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {sortedSongs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <div className="text-2xl mb-2">🎵</div>
                <div>No songs found</div>
              </div>
            ) : (
              sortedSongs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => {
                    setSelectedSongId(song.id)
                    setCurrentSlide(song.title)
                    setActiveTab('songs')
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    song.id === selectedSongId
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-medium text-sm">{song.title}</div>
                  {song.artist && (
                    <div className="text-xs opacity-70 mt-1">{song.artist}</div>
                  )}
                  <div className="text-xs opacity-60 mt-1">{song.sections.length} sections</div>
                </button>
              ))
            )}
          </div>
        </div>
        <div className="p-2 border-t border-slate-700 text-xs text-slate-500 text-center">
          {filteredSongs.length} song{filteredSongs.length !== 1 ? 's' : ''}
        </div>
      </div>
    )
  }

  const renderBiblesTab = () => (
    <BiblePicker />
  )

  const renderImagesTab = () => (
    <MediaLibrary mediaType="image" onMediaSelect={setSelectedMedia} />
  )

  const renderVideosTab = () => (
    <MediaLibrary mediaType="video" onMediaSelect={setSelectedMedia} />
  )

  const renderSettingsTab = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Church Info Section */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
          <span className="text-lg">⛪</span> Church Information
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-slate-400 text-sm block mb-1">Church Name</label>
            <input
              type="text"
              placeholder="Enter church name"
              className="w-full bg-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-600"
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm block mb-1">Church Logo</label>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const filePaths: string[] = await window.worship.dialog.openFiles({
                    title: 'Select Church Logo',
                    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg'] }]
                  })
                  if (filePaths.length > 0) {
                    alert('Logo selected: ' + filePaths[0])
                    // Would store in settings
                  }
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm py-2 px-3 rounded-lg transition-colors"
              >
                📁 Choose Logo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Settings Section */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
          <span className="text-lg">🎨</span> Theme Presets
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                theme.bg === preset.bg && theme.color === preset.color
                  ? 'border-blue-500 shadow-lg ring-2 ring-blue-500/30'
                  : 'border-slate-700 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded border border-slate-600"
                  style={{ backgroundColor: preset.bg }}
                />
                <span className="text-xs font-medium text-slate-300">{preset.name}</span>
              </div>
              <div
                className="text-xs px-2 py-1 rounded"
                style={{ backgroundColor: preset.bg, color: preset.color }}
              >
                Aa {preset.fontSize}px
              </div>
            </button>
          ))}
        </div>

        <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
          <span className="text-lg"></span> Custom Theme
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-sm block mb-1">Background Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.bg}
                  onChange={(e) => setTheme({ ...theme, bg: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border border-slate-600"
                />
                <span className="text-xs text-slate-300">{theme.bg}</span>
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-sm block mb-1">Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.color}
                  onChange={(e) => setTheme({ ...theme, color: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border border-slate-600"
                />
                <span className="text-xs text-slate-300">{theme.color}</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-sm block mb-1">Font Size: {theme.fontSize}px</label>
            <input
              type="range"
              min={24}
              max={96}
              value={theme.fontSize}
              onChange={(e) => setTheme({ ...theme, fontSize: Number(e.target.value) })}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>24px</span>
              <span>96px</span>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-sm block mb-1">Background Image URL</label>
            <input
              type="text"
              value={theme.backgroundImage || ''}
              placeholder="https://example.com/image.jpg or file://path"
              onChange={(e) => setTheme({ ...theme, backgroundImage: e.target.value })}
              className="w-full bg-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Display Settings Section */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
          <span className="text-lg">🖥️</span> Display Settings
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div>
              <div className="text-slate-200 text-sm font-medium">Fullscreen Output Windows</div>
              <div className="text-xs text-slate-400">Open output windows in fullscreen mode</div>
            </div>
            <button
              onClick={() => {
                // Request fullscreen via IPC
                window.worship.outputs.actions.fullscreen?.()
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              Open Fullscreen
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div>
              <div className="text-slate-200 text-sm font-medium">Aspect Ratio Preview</div>
              <div className="text-xs text-slate-400">Simulate 4:3 output on 16:9 screen</div>
            </div>
            <select className="bg-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-600">
              <option value="16:9">16:9 (Widescreen)</option>
              <option value="4:3">4:3 (Standard)</option>
              <option value="21:9">21:9 (Ultrawide)</option>
            </select>
          </div>
        </div>
      </div>

      {/* NDI & Streaming Section */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
          <span className="text-lg">📡</span> NDI & Streaming
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div>
              <div className="text-slate-200 text-sm font-medium">NDI Output</div>
              <div className="text-xs text-slate-400">
                {ndiEnabled ? 'NDI output active' : 'NDI output disabled'}
              </div>
            </div>
            <button
              onClick={toggleNdi}
              className={`px-4 py-2 text-white text-sm rounded-lg transition-colors ${
                ndiEnabled
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {ndiEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-slate-200 text-sm font-medium mb-2">OBS Integration</div>
            <div className="text-xs text-slate-400 mb-3">Connect to OBS via WebSocket for scene control</div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ws://localhost:4455"
                className="flex-1 bg-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-600"
              />
              <button className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 text-sm rounded-lg transition-colors">
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Output Configuration Section */}
      <div className="p-4">
        <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
          <span className="text-lg">📺</span> Output Configuration
        </h3>
        <div className="space-y-3">
          {OUTPUT_IDS.map(renderLookControls)}
        </div>
      </div>
    </div>
  )

  const renderEditor = () => {
    if (activeTab !== 'songs' || !selectedSong) return null

    // Section type colors for visual distinction (ProPresenter style)
    const sectionTypeColors: Record<string, string> = {
      'Verse': 'bg-blue-600',
      'Chorus': 'bg-pink-600',
      'Bridge': 'bg-purple-600',
      'Pre-Chorus': 'bg-amber-600',
      'Tag': 'bg-red-600',
      'Intro': 'bg-emerald-600',
      'Outro': 'bg-cyan-600'
    }

    return (
      <div className="flex flex-col h-full">
        {/* Song header */}
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">{selectedSong.title}</h2>
              {selectedSong.artist && (
                <div className="text-sm text-slate-400 mt-1">{selectedSong.artist}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowChords(!showChords)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  showChords 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                {showChords ? '♫ Chords On' : '♫ Chords Off'}
              </button>
              <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setTransposeSteps((v) => v - 1)}
                  className="px-3 py-1.5 hover:bg-slate-600 text-slate-200 text-sm rounded transition-colors"
                >
                  ♭
                </button>
                <span className="px-2 text-xs text-slate-400 min-w-[60px] text-center">
                  {transposeSteps === 0 ? 'Original' : `${transposeSteps > 0 ? '+' : ''}${transposeSteps}`}
                </span>
                <button
                  onClick={() => setTransposeSteps((v) => v + 1)}
                  className="px-3 py-1.5 hover:bg-slate-600 text-slate-200 text-sm rounded transition-colors"
                >
                  ♯
                </button>
              </div>
              <button
                onClick={() => setTransposeSteps(0)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Sections grid - ProPresenter style */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {selectedSong.sections.map((section, index) => {
              const transposed = transposeChordMarkup(section.text, transposeSteps)
              const renderedText = showChords ? transposed : stripChordMarkup(transposed)
              const isSelected = selectedSectionId === section.id
              const sectionColor = sectionTypeColors[section.type] || 'bg-slate-600'

              return (
                <div
                  key={section.id}
                  onClick={() => {
                    setCurrentSlide(renderedText)
                    setSelectedSectionId(section.id)
                  }}
                  onDoubleClick={() => {
                    setCurrentSlide(renderedText)
                    setLiveSlide(renderedText)
                    setSelectedSectionId(section.id)
                    sendLiveState(renderedText)
                  }}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer group ${
                    isSelected 
                      ? 'border-blue-500 shadow-lg ring-2 ring-blue-500/50' 
                      : 'border-slate-700 hover:border-slate-500 hover:shadow-md'
                  }`}
                >
                  {/* Section type header with color */}
                  <div className={`${sectionColor} px-3 py-2 flex items-center justify-between`}>
                    <span className="text-white text-xs font-semibold uppercase tracking-wide">
                      {section.type}
                    </span>
                    <span className="text-white/70 text-xs">
                      {index + 1}
                    </span>
                  </div>

                  {/* Section content preview */}
                  <div className="p-3 bg-slate-800/80 min-h-[80px]">
                    <div className="text-slate-300 text-xs whitespace-pre-wrap line-clamp-4">
                      {renderedText || 'Empty section'}
                    </div>
                  </div>

                  {/* Go live indicator */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-red-600 text-white text-xs px-2 py-1 rounded font-medium">
                      Double-click → Live
                    </div>
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                        Preview
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Add section button */}
          <button
            onClick={() => addSongSection(selectedSong.id)}
            className="mt-4 w-full py-3 bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-600 hover:border-slate-500 text-slate-400 hover:text-slate-300 rounded-lg transition-colors font-medium"
          >
            + Add New Section
          </button>
        </div>
      </div>
    )
  }

  const renderSchedule = () => (
    <div className="p-4">
      <h3 className="text-slate-200 font-semibold mb-4">Schedule</h3>
      <div className="space-y-2">
        {schedule.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragIndex != null && dragIndex !== index) {
                moveSchedule(dragIndex, index)
              }
              setDragIndex(null)
            }}
            onClick={() => setCurrentSlide(item.content)}
            className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg cursor-grab hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-slate-500 text-sm w-6">{index + 1}.</span>
              <span className="text-slate-300 flex-1">{item.type} - {item.content}</span>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={addScheduleItem}
        className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
      >
        + Add Item
      </button>
    </div>
  )

  const previewStyle: React.CSSProperties = {
    padding: 24,
    minHeight: 200,
    borderRadius: 12,
    backgroundColor: theme.bg,
    backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: theme.color,
    fontSize: theme.fontSize,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontWeight: 'bold'
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden">
      {/* Left Sidebar - Navigation */}
      <div className="w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800/50 flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-800/50 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-3xl">✝️</span> WorshipOS
          </h1>
          <p className="text-xs text-slate-500 mt-1">v0.2.0 Professional</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2 space-y-1">
          <SidebarTab icon="🎵" label="Songs" active={activeTab === 'songs'} onClick={() => setActiveTab('songs')} />
          <SidebarTab icon="📖" label="Bibles" active={activeTab === 'bibles'} onClick={() => setActiveTab('bibles')} />
          <SidebarTab icon="🖼️" label="Images" active={activeTab === 'images'} onClick={() => setActiveTab('images')} />
          <SidebarTab icon="🎬" label="Videos" active={activeTab === 'videos'} onClick={() => setActiveTab('videos')} />
          <SidebarTab icon="⚙️" label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/50 space-y-2">
          <div className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">Quick Actions</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onBlack}
              className="py-2.5 bg-gradient-to-b from-slate-800 to-black hover:from-slate-700 hover:to-slate-900 text-white rounded-lg transition-all font-medium text-sm shadow-lg border border-slate-700 hover:border-slate-600 hover:shadow-xl"
            >
              ⬛ BLACK
            </button>
            <button
              onClick={onLogo}
              className="py-2.5 bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-200 rounded-lg transition-all font-medium text-sm shadow-lg border border-slate-600 hover:border-slate-500 hover:shadow-xl"
            >
              🏠 LOGO
            </button>
            <button
              onClick={onClear}
              className="py-2.5 bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-200 rounded-lg transition-all font-medium text-sm shadow-lg border border-slate-600 hover:border-slate-500 hover:shadow-xl"
            >
              ✕ CLEAR
            </button>
            <button
              onClick={goLive}
              className="py-2.5 bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg transition-all font-medium text-sm shadow-lg border border-red-500 hover:border-red-400 hover:shadow-xl hover:shadow-red-500/20"
            >
              ▶ LIVE
            </button>
          </div>
          <div className="text-xs text-slate-600 text-center pt-1">
            Enter/Space to go live
          </div>
        </div>
      </div>

      {/* Left Panel - Content List */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
        {activeTab === 'songs' && renderSongsTab()}
        {activeTab === 'bibles' && renderBiblesTab()}
        {activeTab === 'images' && renderImagesTab()}
        {activeTab === 'videos' && renderVideosTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>

      {/* Middle Panel - Editor */}
      <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden">
        {renderEditor()}
      </div>

      {/* Right Panel - Preview & Live */}
      <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Preview */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Preview</div>
            <div style={previewStyle}>{currentSlide}</div>
          </div>

          {/* Live */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Live Output</div>
            <div style={previewStyle}>{liveSlide}</div>
          </div>

          {/* Schedule */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            {renderSchedule()}
          </div>

          {/* Output Previews */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Output Previews</div>
            <div className="space-y-3">
              {OUTPUT_IDS.map((id) => {
                const state = outputStates[id] || {}
                const label = state.mode === 'black' ? 'BLACK' : state.mode === 'logo' ? 'Church Logo' : (state.slideTitle || 'Idle')
                return (
                  <div key={id}>
                    <div className="text-xs text-slate-500 mb-2">Output {id}</div>
                    <div style={{ ...previewStyle, minHeight: 100, fontSize: 14 }}>{label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const mountPoint = document.getElementById('root')
const root = mountPoint ? createRoot(mountPoint) : null
if (root) {
  root.render(<App />)
}
