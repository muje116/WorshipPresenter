// Simple esbuild-based renderer bundler for WorshipPresenter
const esbuild = require('esbuild')
const path = require('path')
const fs = require('fs')

async function build() {
  const isWatch = process.argv.includes('--watch')
  try {
    const outDir = path.resolve(__dirname, '../dist/renderer/app')
    fs.mkdirSync(outDir, { recursive: true })

    const buildOpts = {
      entryPoints: {
        'bundle': path.resolve(__dirname, '../src/renderer/app/index.tsx'),
        'bundle-output': path.resolve(__dirname, '../src/renderer/app/output.tsx')
      },
      bundle: true,
      outdir: outDir,
      platform: 'browser',
      target: ['es2020'],
      jsx: 'automatic',
      sourcemap: true,
      logLevel: 'info',
      define: { 'process.env.NODE_ENV': isWatch ? '"development"' : '"production"' },
    }

    if (isWatch) {
      const ctx = await esbuild.context(buildOpts)
      await ctx.watch()
      console.log('esbuild: watching renderer files for changes...')
    } else {
      await esbuild.build(buildOpts)
    }

    // Process index.html
    const sourceHtmlPath = path.resolve(__dirname, '../src/renderer/app/index.html')
    const targetHtmlPath = path.resolve(__dirname, '../dist/renderer/app/index.html')
    let html = fs.readFileSync(sourceHtmlPath, 'utf8')
    html = html.replace('../bundle.js', './bundle.js')
    if (!html.includes('./bundle.css')) {
      html = html.replace('</head>', '    <link rel="stylesheet" href="./bundle.css" />\n  </head>')
    }
    fs.writeFileSync(targetHtmlPath, html, 'utf8')

    // Process output.html
    const sourceOutputHtmlPath = path.resolve(__dirname, '../src/renderer/app/output.html')
    const targetOutputHtmlPath = path.resolve(__dirname, '../dist/renderer/app/output.html')
    let outputHtml = fs.readFileSync(sourceOutputHtmlPath, 'utf8')
    if (!outputHtml.includes('./bundle-output.css')) {
      outputHtml = outputHtml.replace('</head>', '    <link rel="stylesheet" href="./bundle-output.css" />\n  </head>')
    }
    fs.writeFileSync(targetOutputHtmlPath, outputHtml, 'utf8')

    console.log('Renderer bundles processed successfully.')
  } catch (e) {
    console.error('Failed to build renderer bundle', e)
    process.exit(1)
  }
}

build()
