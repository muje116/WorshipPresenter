import { create } from 'zustand'
import { dbService } from './services/db'

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
  textBoxWidth?: number
  textBoxHeight?: number
}
export type OutputRole = 'primary' | 'extended' | 'stage'
export type OutputConfig = { id: number; role: OutputRole; resolution: string; active: boolean }

export type DisplayInfo = {
  id: number
  label: string
  bounds: { x: number; y: number; width: number; height: number }
  size: { width: number; height: number }
  workArea: { x: number; y: number; width: number; height: number }
  isPrimary: boolean
  scaleFactor: number
  internal: boolean
  rotation: number
  touchSupport: string
  displayFrequency: number
}

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
  addSong: () => Promise<number | void>
  deleteSong: (id: number) => Promise<void>
  updateSongSection: (songId: number, sectionId: number, patch: Partial<Section>) => void
  updateSongTitle: (songId: number, title: string) => void
  addSongSection: (songId: number) => Promise<void>
  deleteSongSection: (songId: number, sectionId: number) => Promise<void>
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
  displays: DisplayInfo[]
  setDisplays: (displays: DisplayInfo[]) => void
}

export const useStore = create<Store>((set, get) => ({
  songs: [],
  schedule: [],
  theme: { bg: '#1a1a1a', color: '#ffffff', backgroundImage: '', fontSize: 42, opacity: 100, blur: 0, gradient: '', fontFamily: 'Manrope', fontWeight: 700, textAlign: 'center', verticalAlign: 'center', textBoxWidth: 90, textBoxHeight: 70 },
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
  addSong: async () => {
    try {
      const tempId = Math.max(0, ...get().songs.map(s => s.id)) + 1
      const title = 'New Song ' + tempId
      const newSong = await dbService.songs.create(title)
      set((state) => ({ songs: [...state.songs, newSong], currentSlide: newSong.title }))
      return newSong.id
    } catch (err) {
      console.error('Failed to persist new song:', err)
      return undefined
    }
  },
  deleteSong: async (id) => {
    try {
      await dbService.songs.delete(id)
      set((state) => {
        const nextSongs = state.songs.filter((song) => song.id !== id)
        return {
          songs: nextSongs,
          currentSlide: nextSongs[0]?.title || 'Welcome'
        }
      })
    } catch (err) {
      console.error('Failed to delete song:', err)
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
    dbService.songs.updateSection(songId, sectionId, patch).catch(err => {
      console.error('Failed to persist section update:', err)
    })
  },
  updateSongTitle: (songId, title) => {
    const nextTitle = title.trim()
    set((state) => ({
      songs: state.songs.map((song) => (song.id === songId ? { ...song, title: nextTitle || '' } : song))
    }))
    dbService.songs.updateTitle(songId, nextTitle).catch(err => {
      console.error('Failed to persist song title update:', err)
    })
  },
  addSongSection: async (songId) => {
    try {
      const newSection = await dbService.songs.addSection(songId, 'Verse', '')
      set((state) => ({
        songs: state.songs.map((song) => {
          if (song.id !== songId) return song
          return {
            ...song,
            sections: [...song.sections, newSection]
          }
        })
      }))
    } catch (err) {
      console.error('Failed to persist new section:', err)
    }
  },
  deleteSongSection: async (songId, sectionId) => {
    try {
      await dbService.songs.deleteSection(songId, sectionId)
      set((state) => ({
        songs: state.songs.map((song) => {
          if (song.id !== songId) return song
          return {
            ...song,
            sections: song.sections.filter((sec) => sec.id !== sectionId)
          }
        })
      }))
    } catch (err) {
      console.error('Failed to delete song section:', err)
    }
  },
  moveSongSection: (songId, from, to) => {
    set((state) => {
      const targetSong = state.songs.find((s) => s.id === songId)
      if (!targetSong) return {}
      const sections = targetSong.sections.slice()
      const [item] = sections.splice(from, 1)
      sections.splice(to, 0, item)
      
      const sectionIds = sections.map((s) => s.id)
      dbService.songs.moveSections(songId, sectionIds).catch((err) => {
        console.error('Failed to persist section order:', err)
      })

      return {
        songs: state.songs.map((song) => (song.id === songId ? { ...song, sections } : song))
      }
    })
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
  displays: [],
  setDisplays: (displays) => set({ displays }),
  addScheduleItem: async () => {
    try {
      const newItem = await dbService.schedule.addItem('Song', 'New Item')
      set((state) => ({ schedule: [...state.schedule, newItem] }))
    } catch (err) {
      console.error('Failed to add schedule item:', err)
    }
  },
  moveSchedule: (from, to) => {
    const s = get().schedule.slice()
    const [item] = s.splice(from, 1)
    s.splice(to, 0, item)
    set({ schedule: s })

    const itemIds = s.map((item) => item.id)
    dbService.schedule.moveItems(itemIds).catch((err) => {
      console.error('Failed to persist schedule item order:', err)
    })
  },
  setTheme: (t) => set({ theme: t }),
  applyPreset: (preset) => set({ theme: { ...preset, opacity: preset.opacity ?? 100, blur: preset.blur ?? 0, gradient: preset.gradient ?? '', textAlign: preset.textAlign ?? 'center', verticalAlign: preset.verticalAlign ?? 'center', textBoxWidth: preset.textBoxWidth ?? 90, textBoxHeight: preset.textBoxHeight ?? 70 } }),
  saveTemplate: (name: string) => {
    const theme = get().theme
    dbService.themes.create(name, theme).catch(err => {
      console.error('Failed to save template:', err)
    })
  },
}))
