import React from 'react'

// ─── Dialog context & hook ────────────────────────────────────────────────────

type DialogConfig = {
  type: 'prompt' | 'confirm' | 'alert'
  title: string
  message?: string
  defaultValue?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  resolve: (value: string | boolean | null) => void
}

type DialogContextValue = {
  show: (config: Omit<DialogConfig, 'resolve'>) => Promise<string | boolean | null>
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

export const useDialog = (): DialogContextValue => {
  const ctx = React.useContext(DialogContext)
  if (!ctx) throw new Error('useDialog must be used inside <DialogProvider>')
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = React.useState<DialogConfig | null>(null)
  const [inputValue, setInputValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const show = React.useCallback(
    (cfg: Omit<DialogConfig, 'resolve'>): Promise<string | boolean | null> =>
      new Promise((resolve) => {
        setInputValue(cfg.defaultValue ?? '')
        setConfig({ ...cfg, resolve })
      }),
    []
  )

  React.useEffect(() => {
    if (config && config.type === 'prompt') {
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [config])

  const dismiss = (value: string | boolean | null) => {
    config?.resolve(value)
    setConfig(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') dismiss(config?.type === 'confirm' ? false : null)
    if (e.key === 'Enter' && config?.type !== 'confirm') {
      e.preventDefault()
      dismiss(config?.type === 'prompt' ? inputValue : true)
    }
  }

  return (
    <DialogContext.Provider value={{ show }}>
      {children}
      {config && (
        <div className="dialog-backdrop" role="dialog" aria-modal="true" onKeyDown={handleKeyDown} tabIndex={-1}>
          <div className="dialog-panel">
            <div className="dialog-title">{config.title}</div>
            {config.message && <div className="dialog-message">{config.message}</div>}

            {config.type === 'prompt' && (
              <input
                ref={inputRef}
                className="input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); dismiss(inputValue) }
                  if (e.key === 'Escape') dismiss(null)
                }}
                autoFocus
              />
            )}

            <div className="dialog-actions">
              {config.type !== 'alert' && (
                <button
                  className="soft-button"
                  onClick={() => dismiss(config.type === 'confirm' ? false : null)}
                >
                  {config.cancelLabel ?? 'Cancel'}
                </button>
              )}
              <button
                className={`soft-button ${config.tone === 'danger' ? 'danger' : 'primary'}`}
                onClick={() => dismiss(config.type === 'prompt' ? inputValue : true)}
              >
                {config.confirmLabel ?? (config.type === 'alert' ? 'OK' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}
