import { useStore } from '../src/renderer/app/store'

describe('Store basics', () => {
  test('initial store has songs array', () => {
    const s = useStore.getState()
    expect(Array.isArray(s.songs)).toBe(true)
  })

  test('can add a song', () => {
    const store = useStore.getState()
    const initialCount = store.songs.length
    store.addSong()
    const next = useStore.getState()
    expect(next.songs.length).toBe(initialCount + 1)
  })

  test('can update live slide independently from preview slide', () => {
    const store = useStore.getState()
    store.setCurrentSlide('Preview Only')
    store.setLiveSlide('Live Only')
    const next = useStore.getState()
    expect(next.currentSlide).toBe('Preview Only')
    expect(next.liveSlide).toBe('Live Only')
  })

  test('can edit song section metadata', () => {
    // First add a song to test with
    const store = useStore.getState()
    store.addSong()
    const state = useStore.getState()
    const song = state.songs[state.songs.length - 1]
    const section = song.sections[0]
    store.updateSongSection(song.id, section.id, { type: 'Bridge', text: '[D]Updated line' })
    const updated = useStore.getState().songs.find(s => s.id === song.id)?.sections[0]
    expect(updated?.type).toBe('Bridge')
    expect(updated?.text).toContain('Updated')
  })
})
