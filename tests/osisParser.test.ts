import { parseOsisXml } from '../src/main/osisLoader'

describe('OSIS Parser', () => {
  test('parses simple verse', () => {
    const xml = `
      <verse osisID="Gen.1.1">In the beginning</verse>
    `
    const verses = parseOsisXml(xml)
    expect(verses.length).toBeGreaterThan(0)
    expect(verses[0].book).toBe('Genesis')
    expect(verses[0].chapter).toBe(1)
    expect(verses[0].verse).toBe(1)
  })
  test('parses chapter block with nested verses', () => {
    const xml = `
      <div type="chapter" osisID="Gen.1"> <verse osisID="Gen.1.2">Second</verse> </div>
    `
    const verses = parseOsisXml(xml)
    expect(verses.length).toBeGreaterThan(0)
  })
})
