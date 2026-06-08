import React from 'react'
import { createRoot } from 'react-dom/client'
import { OutputView } from './components/OutputView'
import './styles.css'

declare const window: any

const getOutId = (): number => {
  try {
    const q = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const value = q.get('out')
    return value ? Number(value) : 1
  } catch {
    return 1
  }
}

const App: React.FC = () => {
  const outId = getOutId()
  return <OutputView outId={outId} />
}

const rootEl = document.getElementById('root')
if (rootEl) {
  const root = createRoot(rootEl)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
