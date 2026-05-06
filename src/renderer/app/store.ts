import { create } from 'zustand'

export type Section = { id: number; type: string; text: string }
export type Song = { id: number; title: string; artist?: string; sections: Section[] }
export type ScheduleItem = { id: number; type: string; content: string }
export type Theme = {
  bg: string
  color: string
  backgroundImage?: string
  fontSize: number
  name?: string
  opacity?: number
  blur?: number
  gradient?: string
  fontFamily?: string
  fontWeight?: number
  textAlign?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'center' | 'bottom'
}
export type OutputRole = 'primary' | 'extended' | 'stage'
export type OutputConfig = { id: number; role: OutputRole; resolution: string; active: boolean }

// Theme presets
export const THEME_PRESETS: Theme[] = [
  { name: 'Light Classic', bg: '#ffffff', color: '#000000', fontSize: 48 },
  { name: 'Dark Modern', bg: '#1a1a2e', color: '#eaeaea', fontSize: 42 },
  { name: 'Blue Ocean', bg: '#0f4c75', color: '#ffffff', fontSize: 44 },
  { name: 'Sunset Warm', bg: '#2d132c', color: '#ffd700', fontSize: 42 },
  { name: 'Forest Green', bg: '#1b4332', color: '#d8f3dc', fontSize: 44 },
  { name: 'Green Screen', bg: '#00ff00', color: '#101010', fontSize: 44 },
  { name: 'Royal Purple', bg: '#3c096c', color: '#e0aaff', fontSize: 42 },
  { name: 'Minimal Black', bg: '#000000', color: '#ffffff', fontSize: 48 },
  { name: 'Soft Gray', bg: '#2d2d2d', color: '#f0f0f0', fontSize: 42 },
]

type Store = {
  songs: Song[]
  schedule: ScheduleItem[]
  theme: Theme
  currentSlide: string
  liveSlide: string
  undoStack: string[]
  redoStack: string[]
  setCurrentSlide: (s: string) => void
  setLiveSlide: (s: string) => void
  pushSlideUndo: (s: string) => void
  undo: () => void
  redo: () => void
  addSong: () => void
  updateSongSection: (songId: number, sectionId: number, patch: Partial<Section>) => void
  updateSongTitle: (songId: number, title: string) => void
  addSongSection: (songId: number) => void
  moveSongSection: (songId: number, from: number, to: number) => void
  addScheduleItem: () => Promise<void>
  moveSchedule: (from: number, to: number) => void
  setTheme: (t: Theme) => void
  applyPreset: (preset: Theme) => void
  saveTemplate: (name: string) => void
  looks: Record<number, { background?: string; template?: string; layers?: string[] }>
  setLook: (outId: number, look: { background?: string; template?: string; layers?: string[] }) => void
  outputConfigs: OutputConfig[]
  updateOutputConfig: (id: number, patch: Partial<OutputConfig>) => void
}

export const useStore = create<Store>((set, get) => ({
  songs: [],
  schedule: [],
  theme: { bg: '#1a1a1a', color: '#ffffff', backgroundImage: '', fontSize: 42, opacity: 100, blur: 0, gradient: '', fontFamily: 'Manrope', fontWeight: 700, textAlign: 'center', verticalAlign: 'center' },
  currentSlide: 'Welcome',
  liveSlide: 'Welcome',
  undoStack: [],
  redoStack: [],
  setCurrentSlide: (s) => set({ currentSlide: s }),
  setLiveSlide: (s) => set({ liveSlide: s }),
  pushSlideUndo: (s) => set((state) => ({ undoStack: [...state.undoStack.slice(-20), s], redoStack: [] })),
  undo: () => {
    const { undoStack, currentSlide } = get()
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    set({ undoStack: undoStack.slice(0, -1), redoStack: [...get().redoStack, currentSlide], currentSlide: prev })
  },
  redo: () => {
    const { redoStack, currentSlide } = get()
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    set({ redoStack: redoStack.slice(0, -1), undoStack: [...get().undoStack, currentSlide], currentSlide: next })
  },
  addSong: () => {
    const id = Math.max(0, ...get().songs.map(s => s.id)) + 1
    const newSong: Song = { id, title: 'New Song ' + id, sections: [{ id: 1, type: 'Verse', text: '[C]Verse text' }] }
    set((state) => ({ songs: [...state.songs, newSong], currentSlide: newSong.title }))
    // Persist to DB
    try {
      if (typeof window !== 'undefined' && (window as any).worship?.db?.run) {
        (window as any).worship.db.run('INSERT INTO songs (id, title) VALUES (?, ?)', [newSong.id, newSong.title])
        newSong.sections.forEach(section => {
          ;(window as any).worship.db.run(
            'INSERT INTO song_sections (song_id, type, content, order_num) VALUES (?, ?, ?, ?)',
            [newSong.id, section.type, section.text, section.id]
          )
        })
      }
    } catch (err) {
      console.error('Failed to persist new song:', err)
    }
  },
  updateSongSection: (songId, sectionId, patch) => {
    set((state) => ({
      songs: state.songs.map((song) => (
        song.id !== songId
          ? song
          : {
              ...song,
              sections: song.sections.map((section) => (
                section.id !== sectionId ? section : { ...section, ...patch }
              ))
            }
      ))
    }))
    // Persist to DB
    try {
      if (typeof window !== 'undefined' && (window as any).worship?.db?.run) {
        if (patch.type) {
          ;(window as any).worship.db.run(
            'UPDATE song_sections SET type = ? WHERE id = ? AND song_id = ?',
            [patch.type, sectionId, songId]
          )
        }
        if (patch.text !== undefined) {
          ;(window as any).worship.db.run(
            'UPDATE song_sections SET content = ? WHERE id = ? AND song_id = ?',
            [patch.text, sectionId, songId]
          )
        }
      }
    } catch (err) {
      console.error('Failed to persist section update:', err)
    }
  },
  updateSongTitle: (songId, title) => {
    const nextTitle = title.trim()
    set((state) => ({
      songs: state.songs.map((song) => (song.id === songId ? { ...song, title: nextTitle || '' } : song))
    }))
    try {
      if (typeof window !== 'undefined' && (window as any).worship?.db?.run) {
        ;(window as any).worship.db.run('UPDATE songs SET title = ? WHERE id = ?', [nextTitle || 'Untitled Song', songId])
      }
    } catch (err) {
      console.error('Failed to persist song title update:', err)
    }
  },
  addSongSection: (songId) => {
    set((state) => ({
      songs: state.songs.map((song) => {
        if (song.id !== songId) return song
        const nextId = Math.max(0, ...song.sections.map((section) => section.id)) + 1
        return {
          ...song,
          sections: [...song.sections, { id: nextId, type: 'Verse', text: '' }]
        }
      })
    }))
    // Persist to DB
    try {
      if (typeof window !== 'undefined' && (window as any).worship?.db?.run) {
        const song = get().songs.find(s => s.id === songId)
        if (song) {
          const newSection = song.sections[song.sections.length - 1]
          ;(window as any).worship.db.run(
            'INSERT INTO song_sections (song_id, type, content, order_num) VALUES (?, ?, ?, ?)',
            [songId, newSection.type, newSection.text, newSection.id]
          )
        }
      }
    } catch (err) {
      console.error('Failed to persist new section:', err)
    }
  },
  moveSongSection: (songId, from, to) => {
    set((state) => ({
      songs: state.songs.map((song) => {
        if (song.id !== songId) return song
        const sections = song.sections.slice()
        const [item] = sections.splice(from, 1)
        sections.splice(to, 0, item)
        return { ...song, sections }
      })
    }))
    try {
      if (typeof window !== 'undefined' && (window as any).worship?.db?.run) {
        const song = get().songs.find((s) => s.id === songId)
        if (song) {
          song.sections.forEach((section, index) => {
            ;(window as any).worship.db.run(
              'UPDATE song_sections SET order_num = ? WHERE id = ? AND song_id = ?',
              [index + 1, section.id, songId]
            )
          })
        }
      }
    } catch (err) {
      console.error('Failed to persist section order:', err)
    }
  },
  looks: {},
  setLook: (outId: number, look: { background?: string; template?: string; layers?: string[] }) => set((state) => ({ looks: { ...state.looks, [outId]: look } })),
  outputConfigs: (() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('worship-output-configs')
        if (raw) return JSON.parse(raw)
      }
    } catch {
      // ignore parse and fallback
    }
    return [
      { id: 1, role: 'primary', resolution: '1920x1080', active: true },
      { id: 2, role: 'extended', resolution: '1920x1080', active: true },
      { id: 3, role: 'stage', resolution: '1280x720', active: false },
    ]
  })(),
  updateOutputConfig: (id, patch) => set((state) => ({
    outputConfigs: (() => {
      const next = state.outputConfigs.map((item) => (item.id === id ? { ...item, ...patch } : item))
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('worship-output-configs', JSON.stringify(next))
        }
      } catch {
        // ignore localStorage write issues
      }
      return next
    })()
  })),
  addScheduleItem: async () => {
    set((state) => ({ schedule: [...state.schedule, { id: state.schedule.length + 1, type: 'Song', content: 'New Item' }] }))
    // Persist to DB skeleton: create a schedule and log an item if DB is available
    try {
      if (typeof window !== 'undefined' && (window as any).worship?.db?.run) {
        const res: any = await (window as any).worship.db.run('INSERT INTO schedules (name, service_time) VALUES (?, ?)', ['Service', new Date().toISOString()])
        const schedId = res?.lastInsertRowid
        if (schedId) {
          await (window as any).worship.db.run('INSERT INTO schedule_items (schedule_id, item_type, content, order_num) VALUES (?, ?, ?, ?)', [schedId, 'Song', 'New Item', 1])
        }
      }
    } catch {
      // ignore failures in MVP phase
    }
  },
  moveSchedule: (from, to) => {
    const s = get().schedule.slice()
    const [item] = s.splice(from, 1)
    s.splice(to, 0, item)
    set({ schedule: s })
  },
  setTheme: (t) => set({ theme: t }),
  applyPreset: (preset) => set({ theme: { ...preset, opacity: preset.opacity ?? 100, blur: preset.blur ?? 0, gradient: preset.gradient ?? '', textAlign: preset.textAlign ?? 'center', verticalAlign: preset.verticalAlign ?? 'center' } }),
  saveTemplate: (name: string) => {
    const theme = get().theme
    try {
      if (typeof window !== 'undefined' && (window as any).worship?.db?.run) {
        ;(window as any).worship.db.run(
          'INSERT INTO themes (name, background, text_style, backgroundImage, text_color, font_size) VALUES (?, ?, ?, ?, ?, ?)',
          [name, theme.bg, 'bold', theme.backgroundImage || '', theme.color, theme.fontSize]
        )
      }
    } catch (err) {
      console.error('Failed to save template:', err)
    }
  },
}))
