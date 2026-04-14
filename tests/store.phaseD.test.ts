import { useStore } from '../src/renderer/app/store'

describe('Phase D Looks', () => {
  test('setLook persists per output', () => {
    const setState = useStore.getState()
    expect(setState.looks).toBeDefined()
    setState.setLook(1, { background: '#ff0000', template: 'default', layers: ['slide'] })
    const looks = useStore.getState().looks
    expect(looks[1]).toBeDefined()
    expect(looks[1]?.background).toBe('#ff0000')
  })
})
