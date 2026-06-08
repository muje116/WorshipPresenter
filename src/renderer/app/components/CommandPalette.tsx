import React from 'react'

export type Command = {
  id: string
  label: string
  description?: string
  icon?: string
  category?: string
  keywords?: string[]
  action: () => void
}

type Props = {
  commands: Command[]
  onClose: () => void
}

export const CommandPalette: React.FC<Props> = ({ commands, onClose }) => {
  const [query, setQuery] = React.useState('')
  const [selected, setSelected] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return commands
    return commands.filter((cmd) => {
      const hay = [cmd.label, cmd.description, cmd.category, ...(cmd.keywords ?? [])].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [commands, query])

  React.useEffect(() => {
    setSelected(0)
  }, [query])

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  React.useEffect(() => {
    // Scroll selected item into view
    const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-idx="${selected}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const execute = (cmd: Command) => {
    cmd.action()
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selected]) execute(filtered[selected])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  // Group by category
  const grouped = React.useMemo(() => {
    const map = new Map<string, { cmd: Command; idx: number }[]>()
    filtered.forEach((cmd, idx) => {
      const cat = cmd.category ?? 'General'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push({ cmd, idx })
    })
    return map
  }, [filtered])

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette-panel" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="palette-search-row">
          <span className="palette-search-icon">⌘</span>
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="Type a command or search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="palette-esc-hint" onClick={onClose}>ESC</kbd>
        </div>

        <div className="palette-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="palette-empty">No commands match "{query}"</div>
          )}
          {Array.from(grouped.entries()).map(([cat, items]) => (
            <div key={cat} className="palette-group">
              <div className="palette-category">{cat}</div>
              {items.map(({ cmd, idx }) => (
                <button
                  key={cmd.id}
                  data-idx={idx}
                  className={`palette-item ${idx === selected ? 'active' : ''}`}
                  onMouseEnter={() => setSelected(idx)}
                  onClick={() => execute(cmd)}
                >
                  {cmd.icon && <span className="palette-item-icon">{cmd.icon}</span>}
                  <span className="palette-item-label">{cmd.label}</span>
                  {cmd.description && <span className="palette-item-desc">{cmd.description}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="palette-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> run</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
