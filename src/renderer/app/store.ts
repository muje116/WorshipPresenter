import { create } from 'zustand'

export type Section = { id: number; type: string; text: string }
export type Song = { id: number; title: string; artist?: string; sections: Section[] }
export type ScheduleItem = { id: number; type: string; content: string }
export type Theme = { bg: string; color: string; backgroundImage?: string; fontSize: number; name?: string }

// Theme presets
export const THEME_PRESETS: Theme[] = [
  { name: 'Light Classic', bg: '#ffffff', color: '#000000', fontSize: 48 },
  { name: 'Dark Modern', bg: '#1a1a2e', color: '#eaeaea', fontSize: 42 },
  { name: 'Blue Ocean', bg: '#0f4c75', color: '#ffffff', fontSize: 44 },
  { name: 'Sunset Warm', bg: '#2d132c', color: '#ffd700', fontSize: 42 },
  { name: 'Forest Green', bg: '#1b4332', color: '#d8f3dc', fontSize: 44 },
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
  setCurrentSlide: (s: string) => void
  setLiveSlide: (s: string) => void
  addSong: () => void
  updateSongSection: (songId: number, sectionId: number, patch: Partial<Section>) => void
  addSongSection: (songId: number) => void
  addScheduleItem: () => Promise<void>
  moveSchedule: (from: number, to: number) => void
  setTheme: (t: Theme) => void
  applyPreset: (preset: Theme) => void
  looks: Record<number, { background?: string; template?: string; layers?: string[] }>
  setLook: (outId: number, look: { background?: string; template?: string; layers?: string[] }) => void
}

export const useStore = create<Store>((set, get) => ({
  songs: [],
  schedule: [],
  theme: { bg: '#1a1a1a', color: '#ffffff', backgroundImage: '', fontSize: 42 },
  currentSlide: 'Welcome',
  liveSlide: 'Welcome',
  setCurrentSlide: (s) => set({ currentSlide: s }),
  setLiveSlide: (s) => set({ liveSlide: s }),
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
  looks: {},
  setLook: (outId: number, look: { background?: string; template?: string; layers?: string[] }) => set((state) => ({ looks: { ...state.looks, [outId]: look } })),
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
  applyPreset: (preset) => set({ theme: preset }),
}))
