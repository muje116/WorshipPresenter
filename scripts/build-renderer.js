// Simple esbuild-based renderer bundler for WorshipOS
const esbuild = require('esbuild')
const path = require('path')
const fs = require('fs')

async function build() {
  try {
    const outDir = path.resolve(__dirname, '../dist/renderer/app')
    const outFile = path.join(outDir, 'bundle.js')
    fs.mkdirSync(outDir, { recursive: true })

    await esbuild.build({
      entryPoints: [path.resolve(__dirname, '../src/renderer/app/index.tsx')],
      bundle: true,
      outfile: outFile,
      platform: 'browser',
      target: ['es2020'],
      jsx: 'automatic',
      format: 'iife',
      sourcemap: true,
      logLevel: 'info',
      define: { 'process.env.NODE_ENV': '"production"' },
    })

    const sourceHtmlPath = path.resolve(__dirname, '../src/renderer/app/index.html')
    const targetHtmlPath = path.resolve(__dirname, '../dist/renderer/app/index.html')
    let html = fs.readFileSync(sourceHtmlPath, 'utf8')
    html = html.replace('../bundle.js', './bundle.js')
    if (!html.includes('./bundle.css')) {
      html = html.replace('</head>', '    <link rel="stylesheet" href="./bundle.css" />\n  </head>')
    }
    fs.writeFileSync(targetHtmlPath, html, 'utf8')
    console.log('Renderer bundle built to dist/renderer/app/bundle.js')
  } catch (e) {
    console.error('Failed to build renderer bundle', e)
    process.exit(1)
  }
}

build()
