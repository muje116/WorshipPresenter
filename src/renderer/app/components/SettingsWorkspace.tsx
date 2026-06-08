import React from 'react'

declare const window: any

const SECTION_TYPES = ['Intro', 'Verse', 'Chorus', 'Bridge', 'Pre-Chorus', 'Post-Chorus', 'Tag', 'Outro', 'Interlude', 'Instrumental']
const LAYERS = ['background', 'media', 'slide_content', 'props_overlays', 'announcements', 'lower_thirds', 'live_video', 'alerts']

export type OutputRole = 'primary' | 'extended' | 'stage'
export type OutputConfig = { id: number; role: OutputRole; resolution: string; active: boolean }

type Look = { background?: string; template?: string; layers?: string[] }
type Theme = {
  bg: string; color: string; backgroundImage?: string; fontSize: number
  opacity?: number; blur?: number; gradient?: string; fontFamily?: string
  fontWeight?: number; textAlign?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'center' | 'bottom'
}
type ThemePreset = Theme & { name?: string }

type Props = {
  theme: Theme
  outputConfigs: OutputConfig[]
  looks: Record<number, Look>
  ndiEnabled: boolean
  syncConnected: boolean
  syncUrl: string
  aspectRatio: '16:9' | '4:3' | '21:9' | 'FREE'
  overscanPercent: number
  outputResolution: string
  outputHardware: string
  activeOutputId: number
  themePresets: ThemePreset[]
  logoImage: string
  onSyncUrlChange: (url: string) => void
  onConnectSync: () => void
  onDisconnectSync: () => void
  onSetAspectRatio: (ratio: '16:9' | '4:3' | '21:9' | 'FREE') => void
  onSetOverscanPercent: (n: number) => void
  onSetOutputResolution: (r: string) => void
  onSetActiveOutputId: (id: number) => void
  onUpdateOutputConfig: (id: number, patch: Partial<OutputConfig>) => void
  onUpdateLook: (outId: number, patch: Partial<Look>) => void
  onToggleNdi: () => void
  onApplyPreset: (preset: ThemePreset) => void
  onResetDisplay: () => void
  onApplyDisplayChanges: () => void
  onLogoImageChange: (path: string) => void
  onPickLogoFile: () => void
  onNotify: (title: string, detail?: string, tone?: 'info' | 'success' | 'warn') => void
}

const OUTPUT_IDS = [1, 2]

export const SettingsWorkspace: React.FC<Props> = ({
  theme,
  outputConfigs,
  looks,
  ndiEnabled,
  syncConnected,
  syncUrl,
  aspectRatio,
  overscanPercent,
  outputResolution,
  outputHardware,
  activeOutputId,
  themePresets,
  logoImage,
  onSyncUrlChange,
  onConnectSync,
  onDisconnectSync,
  onSetAspectRatio,
  onSetOverscanPercent,
  onSetOutputResolution,
  onSetActiveOutputId,
  onUpdateOutputConfig,
  onUpdateLook,
  onToggleNdi,
  onApplyPreset,
  onResetDisplay,
  onApplyDisplayChanges,
  onLogoImageChange,
  onPickLogoFile,
  onNotify,
}) => {
  return (
    <div className="workspace-grid workspace-settings">
      <div className="settings-header">
        <div>
          <h1 className="settings-title">Display Settings</h1>
          <p className="settings-subtitle">Configure output canvas and screen geometry</p>
        </div>
        <div className="settings-header-actions">
          <button className="soft-button" onClick={onResetDisplay}>
            Reset to Default
          </button>
          <button className="live-button" onClick={onApplyDisplayChanges}>
            Apply Changes
          </button>
        </div>
      </div>

      <section className="panel output-routing-cards">
        {outputConfigs.map((output) => (
          <div
            key={output.id}
            className={`output-route-card ${output.active ? 'active' : ''}`}
            onClick={() => {
              onSetActiveOutputId(output.id)
              outputConfigs.forEach((item) => onUpdateOutputConfig(item.id, { active: item.id === output.id }))
            }}
          >
            <div className="output-route-heading">
              <strong>Output {output.id}</strong>
              <small>{output.resolution}</small>
            </div>
            <select
              className="input"
              value={output.role}
              onChange={(event) => {
                const role = event.target.value as OutputRole
                onUpdateOutputConfig(output.id, { role })
                onNotify('Output role changed', `Output ${output.id} is now ${role}`, 'info')
              }}
            >
              <option value="primary">Primary</option>
              <option value="extended">Extended</option>
              <option value="stage">Stage</option>
            </select>
            <div className="toolbar-inline" style={{ marginTop: 8 }}>
              {['minimize', 'maximize', 'restore'].map((action) => (
                <button
                  key={action}
                  className="soft-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    window?.worship?.outputs?.windowControl?.(output.id, action)
                  }}
                >
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </button>
              ))}
              <button
                className="soft-button"
                onClick={(e) => {
                  e.stopPropagation()
                  window?.worship?.outputs?.windowControl?.(output.id, 'toggle-fullscreen')
                }}
              >
                Full View
              </button>
              <button
                className="soft-button"
                onClick={(e) => {
                  e.stopPropagation()
                  window?.worship?.outputs?.windowControl?.(output.id, 'close')
                }}
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Logo Image Configuration */}
      <section className="panel settings-logo-panel">
        <div className="panel-header">
          <h3>Logo Mode Image</h3>
          <small>Shown when LOGO button is pressed</small>
        </div>
        <div className="logo-picker-row">
          <div className="logo-preview">
            {logoImage ? (
              <img
                src={logoImage.startsWith('file://') || logoImage.startsWith('http') ? logoImage : `file://${logoImage}`}
                alt="Logo"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            ) : (
              <div className="logo-placeholder">No logo set</div>
            )}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              className="input"
              value={logoImage}
              onChange={(e) => onLogoImageChange(e.target.value)}
              placeholder="file://… or https://…"
            />
            <button className="soft-button" onClick={onPickLogoFile}>
              Browse…
            </button>
          </div>
        </div>
      </section>

      <section className="panel settings-looks-panel">
        <div className="panel-header"><h3>Per-Output Looks</h3><small>8-layer compositor</small></div>
        <div className="settings-looks-grid">
          {OUTPUT_IDS.map((id) => {
            const look = looks[id] || { background: '#111111', template: 'default', layers: ['slide_content'] }
            return (
              <div key={id} className="settings-look-card">
                <div className="output-route-heading">
                  <strong>Output {id}</strong>
                  <small>{(look.template || 'default').replace('_', ' ')}</small>
                </div>
                <div className="settings-look-row">
                  <label className="settings-look-label">Background</label>
                  <label className="settings-look-label">Template</label>
                </div>
                <div className="settings-look-row">
                  <input
                    type="color"
                    className="settings-color-input"
                    value={look.background || '#111111'}
                    onChange={(event) => onUpdateLook(id, { background: event.target.value })}
                  />
                  <select
                    className="input"
                    value={look.template || 'default'}
                    onChange={(event) => onUpdateLook(id, { template: event.target.value })}
                  >
                    <option value="default">Default</option>
                    <option value="lower_thirds">Lower Thirds</option>
                    <option value="full">Full</option>
                  </select>
                </div>
                <div className="settings-layer-grid">
                  {LAYERS.map((layer) => {
                    const enabled = (look.layers || []).includes(layer)
                    return (
                      <label key={layer} className={`settings-layer-chip ${enabled ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => {
                            const next = enabled
                              ? (look.layers || []).filter((item) => item !== layer)
                              : [...(look.layers || []), layer]
                            onUpdateLook(id, { layers: next })
                          }}
                        />
                        <span>{layer.replace('_', ' ')}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel settings-sync-panel">
        <div className="panel-header">
          <h3>Sync</h3>
          <small className={syncConnected ? 'text-success' : 'text-muted'}>
            {syncConnected ? 'Connected' : 'Disconnected'}
          </small>
        </div>
        <div className="settings-sync-inline">
          <input
            className="input"
            value={syncUrl}
            onChange={(e) => onSyncUrlChange(e.target.value)}
            placeholder="ws://host:9090"
          />
          {!syncConnected ? (
            <button className="soft-button" onClick={onConnectSync}>Connect</button>
          ) : (
            <button className="soft-button" onClick={onDisconnectSync}>Disconnect</button>
          )}
          <span className={`settings-sync-status ${syncConnected ? 'online' : 'offline'}`}>
            {syncConnected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </section>

      <section className="panel canvas-layout-section">
        <div className="canvas-layout-header">
          <div className="canvas-layout-title">🖥 Canvas Layout</div>
          <div className="ratio-chip-group">
            {(['16:9', '4:3', '21:9', 'FREE'] as const).map((ratio) => (
              <button
                key={ratio}
                className={`ratio-chip ${aspectRatio === ratio ? 'active' : ''}`}
                onClick={() => onSetAspectRatio(ratio)}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
        <div className="canvas-visualizer">
          <div
            className="canvas-display-rect"
            style={{ aspectRatio: aspectRatio === '4:3' ? '4/3' : aspectRatio === '21:9' ? '21/9' : '16/9' }}
          >
            <span className="canvas-active-pill">
              <span className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--tertiary)' }} /> ACTIVE OUTPUT
            </span>
            <span className="canvas-display-label">Output {activeOutputId}</span>
            <span className="canvas-display-res">{outputResolution.replace('x', ' × ')}</span>
            <span className="canvas-handle tl" /><span className="canvas-handle tc" /><span className="canvas-handle tr" />
            <span className="canvas-handle ml" /><span className="canvas-handle mr" />
            <span className="canvas-handle bl" /><span className="canvas-handle bc" /><span className="canvas-handle br" />
          </div>
        </div>
      </section>

      <aside className="panel dimensions-panel">
        <div className="dimensions-title">📐 Dimensions</div>
        <div className="dimension-field">
          <label>Resolution</label>
          <div className="dimension-input-row">
            <input
              value={outputResolution}
              onChange={(e) => {
                onSetOutputResolution(e.target.value)
                onUpdateOutputConfig(activeOutputId, { resolution: e.target.value })
              }}
            />
            <button className="edit-icon" title="Edit">✏️</button>
          </div>
        </div>
        <div className="dimension-field">
          <label>Aspect Ratio</label>
          <div className="dimension-input-row">
            <select value={aspectRatio} onChange={(e) => onSetAspectRatio(e.target.value as any)}>
              <option value="16:9">16:9 Widescreen</option>
              <option value="4:3">4:3 Standard</option>
              <option value="21:9">21:9 Ultrawide</option>
              <option value="FREE">Free</option>
            </select>
          </div>
        </div>
        <div className="overscan-slider">
          <div className="slider-row">
            <div className="slider-label"><span>Overscan</span><span>{overscanPercent}%</span></div>
            <input type="range" min={0} max={20} value={overscanPercent} onChange={(e) => onSetOverscanPercent(Number(e.target.value))} />
          </div>
          <div className="overscan-labels"><span>0%</span><span>20%</span></div>
        </div>
        <div className="hardware-card">
          <div className="hardware-card-title">Output Hardware</div>
          <div className="hardware-card-content">
            <div className="hardware-icon">🖥</div>
            <div className="hardware-info">
              <strong>{outputHardware}</strong>
              <small>SDI Out 1 • 60fps • 10-bit</small>
            </div>
          </div>
        </div>
        <div className="preset-section">
          <label>Theme Presets</label>
          <div className="preset-grid">
            {themePresets.slice(0, 6).map((preset) => (
              <button key={preset.name} className="preset-chip" onClick={() => onApplyPreset(preset)}>
                {preset.name}
              </button>
            ))}
          </div>
        </div>
        <div className="ndi-section">
          <label>NDI Output</label>
          <button
            className={`soft-button full ${ndiEnabled ? 'active' : ''}`}
            onClick={onToggleNdi}
          >
            {ndiEnabled ? 'Disable NDI' : 'Enable NDI'}
          </button>
        </div>
      </aside>

      <div className="info-card-row">
        <div className="info-card">
          <span className="info-card-badge">Pro Feature</span>
          <div className="info-value" style={{ fontFamily: 'Manrope, Inter, sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Multi-Display Sync</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', lineHeight: 1.4 }}>Synchronize frame delivery across multiple graphics cards for ultra-high-resolution wall displays.</div>
        </div>
        <div className="info-card">
          <div className="info-label">🎨 Color Space</div>
          <div className="info-value">Rec.709 (High Dynamic)</div>
          <div className="info-bar" />
        </div>
        <div className="info-card">
          <div className="info-label">⏱ Frame Delay</div>
          <div className="info-value">1.2ms (Ultra Low)</div>
          <div className="info-sub">Optimized for IMAG systems</div>
        </div>
        <div className="info-card">
          <div className="info-label">🔄 Refresh Rate</div>
          <div className="info-value">60.00 Hz</div>
          <div className="info-sub">Matched to Broadcast Clock</div>
        </div>
      </div>
    </div>
  )
}
