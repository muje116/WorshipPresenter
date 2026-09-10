import { parseBibleXml } from '../src/main/bibleXmlLoader'

describe('numbered Bible XML parser', () => {
  test('detects a known translation and maps numbered books', () => {
    const xml = `
      <bible translation="English God's Word - GW 1995">
        <testament name="Old">
          <book number="1">
            <chapter number="1">
              <verse number="1">In the beginning &amp; always.</verse>
              <verse number="2"><span>The earth was empty.</span></verse>
            </chapter>
          </book>
        </testament>
      </bible>
    `

    const bible = parseBibleXml(xml, 'EnglishGWBible.xml')

    expect(bible.code).toBe('GW')
    expect(bible.name).toBe("God's Word Translation")
    expect(bible.verses).toEqual([
      { book: 'Genesis', chapter: 1, verse: 1, text: 'In the beginning & always.' },
      { book: 'Genesis', chapter: 1, verse: 2, text: 'The earth was empty.' },
    ])
  })

  test('maps the supplied translation names to unique codes', () => {
    const names = [
      ['EnglishPassionBible.xml', 'TPT'],
      ['EnglishNIVBible.xml', 'NIV'],
      ['EnglishGNTBible.xml', 'GNT'],
      ['EnglishEASYBible.xml', 'EASY'],
      ['EnglishAmplifiedClassicBible.xml', 'AMPC'],
      ['EnglishAmplifiedBible.xml', 'AMP'],
      ['EnglishTLBible.xml', 'TLB'],
      ['EnglishNLTBible.xml', 'NLT'],
    ]
    const codes = names.map(([file, code]) => parseBibleXml(`<bible translation="${file.replace('.xml', '')}" />`, file).code)
    expect(codes).toEqual(names.map(([, code]) => code))
  })
})
