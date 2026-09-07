import React from 'react'

declare const window: any

const SECTION_TYPES = ['Intro', 'Verse', 'Chorus', 'Bridge', 'Pre-Chorus', 'Post-Chorus', 'Tag', 'Outro', 'Interlude', 'Instrumental']
const LAYERS = ['background', 'media', 'slide_content', 'props_overlays', 'announcements', 'lower_thirds', 'live_video', 'alerts']
const LAYER_META: Record<string, { icon: string; label: string }> = {
  background: { icon: '◼', label: 'background' },
  media: { icon: '▶', label: 'media' },
  slide_content: { icon: 'T', label: 'slide content' },
  props_overlays: { icon: '▤', label: 'props overlays' },
  announcements: { icon: '✦', label: 'announcements' },
  lower_thirds: { icon: '⌴', label: 'lower thirds' },
  live_video: { icon: '▣', label: 'live video' },
  alerts: { icon: '!', label: 'alerts' }
}

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
type DisplayInfo = {
  id: number; label: string; isPrimary: boolean; internal: boolean
  size: { width: number; height: number }
  bounds: { x: number; y: number; width: number; height: number }
  scaleFactor: number; displayFrequency: number
}

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
  displays: DisplayInfo[]
  appVersion: string
  activeOutputWindows: any[]
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
  onRefreshOutputWindows: () => void
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
  displays,
  appVersion,
  activeOutputWindows,
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
  onRefreshOutputWindows,
}) => {
  const handleCreateOutput = async (displayId?: number, fullScreen = false) => {
    if (window.worship?.outputs?.createWindow) {
      await window.worship.outputs.createWindow(displayId, fullScreen)
      onRefreshOutputWindows()
      onNotify('Output created', `New output window created`, 'success')
    }
  }

  const handleCreateForDisplays = async (displayIds: number[]) => {
    if (!displayIds.length) {
      onNotify('No secondary display', 'Connect a projector or monitor first', 'warn')
      return
    }
    if (window.worship?.outputs?.createForDisplays) {
      await window.worship.outputs.createForDisplays(displayIds, true)
      onRefreshOutputWindows()
      onNotify('Live outputs ready', `${displayIds.length} display(s) opened fullscreen`, 'success')
    }
  }

  const handleDestroyOutput = async (outId: number) => {
    if (window.worship?.outputs?.destroyWindow) {
      await window.worship.outputs.destroyWindow(outId)
      onRefreshOutputWindows()
      onNotify('Output removed', `Output window ${outId} closed`, 'info')
    }
  }

  const handleAssignOutput = async (outId: number, displayId: number) => {
    if (window.worship?.outputs?.assignToDisplay) {
      await window.worship.outputs.assignToDisplay(outId, displayId)
      onRefreshOutputWindows()
      onNotify('Output assigned', `Output ${outId} moved to display`, 'success')
    }
  }

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
          <button
            className="soft-button"
            onClick={() => handleCreateForDisplays(displays.filter((display) => !display.isPrimary).map((display) => display.id))}
          >
            Go Live on All Secondary
          </button>
        </div>
      </div>

      <section className="panel output-routing-cards settings-card-group">
        {outputConfigs.map((output) => (
          <div
            key={output.id}
            className={`output-route-card settings-output-card ${output.active ? 'active' : ''}`}
            onClick={() => {
              onSetActiveOutputId(output.id)
              outputConfigs.forEach((item) => onUpdateOutputConfig(item.id, { active: item.id === output.id }))
            }}
          >
            <div className="output-route-heading">
              <strong>Output {output.id}</strong>
              <small>{output.role} &middot; {output.resolution}</small>
            </div>
            <select
              className="input settings-select"
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
            <div className="toolbar-inline settings-window-actions">
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

      {/* Detected Displays Section */}
      <section className="panel settings-card-group">
        <div className="panel-header">
          <h3>Detected Displays</h3>
          <small>{displays.length} display(s) found</small>
        </div>
        {displays.length === 0 ? (
          <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            No displays detected. Make sure your monitors are connected.
          </div>
        ) : (
          <div className="displays-grid">
            {displays.map((display) => (
              <div key={display.id} className={`display-card ${display.isPrimary ? 'primary' : ''}`}>
                <div className="display-card-header">
                  <strong>{display.label}</strong>
                  {display.isPrimary && <span className="display-badge">Primary</span>}
                  {display.internal && <span className="display-badge">Built-in</span>}
                </div>
                <div className="display-card-info">
                  <span>{display.size.width}&times;{display.size.height}</span>
                  <span>{display.displayFrequency}Hz</span>
                  <span>Scale: {display.scaleFactor}x</span>
                </div>
                <div className="display-card-assign">
                  <small>Assigned outputs:</small>
                  <div className="display-output-list">
                    {activeOutputWindows.filter((ow: any) => ow.displayId === display.id).length === 0 ? (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>None</span>
                    ) : (
                      activeOutputWindows
                        .filter((ow: any) => ow.displayId === display.id)
                        .map((ow: any) => (
                          <span key={ow.id} className="output-assign-chip">
                            Output {ow.id}
                          </span>
                        ))
                    )}
                  </div>
                </div>
                <div className="display-card-actions">
                  <button
                    className="soft-button"
                    onClick={() => handleCreateOutput(display.id, true)}
                  >
                    Go Live Here
                  </button>
                  <button
                    className="soft-button"
                    onClick={() => handleCreateOutput(display.id, false)}
                  >
                    Window Here
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Output Window Management */}
      <section className="panel settings-card-group">
        <div className="panel-header">
          <h3>Output Windows</h3>
          <small>{activeOutputWindows.length} active</small>
        </div>
        <div className="output-window-list">
          {activeOutputWindows.map((ow: any) => (
            <div key={ow.id} className="output-window-row">
              <div className="output-window-info">
                <strong>Output {ow.id}</strong>
                <span className="output-window-display">
                  {displays.find((d: DisplayInfo) => d.id === ow.displayId)?.label || `Display ${ow.displayId}`}
                </span>
              </div>
              <select
                className="input"
                value={ow.displayId}
                onChange={(e) => handleAssignOutput(ow.id, Number(e.target.value))}
                style={{ minWidth: 180 }}
              >
                {displays.map((d: DisplayInfo) => (
                  <option key={d.id} value={d.id}>
                    {d.label} ({d.size.width}&times;{d.size.height})
                  </option>
                ))}
              </select>
              <div className="toolbar-inline">
                <button
                  className="soft-button"
                  onClick={() => {
                    window?.worship?.outputs?.windowControl?.(ow.id, 'show')
                    onRefreshOutputWindows()
                  }}
                >
                  Show
                </button>
                <button
                  className="soft-button"
                  onClick={() => window?.worship?.outputs?.windowControl?.(ow.id, 'toggle-fullscreen')}
                >
                  Fullscreen
                </button>
                <select
                  className="input output-resize-select"
                  defaultValue=""
                  onChange={(e) => {
                    const [width, height] = e.target.value.split('x').map(Number)
                    if (width && height) {
                      window?.worship?.outputs?.windowControl?.(ow.id, 'resize', { width, height })
                      onRefreshOutputWindows()
                    }
                    e.currentTarget.value = ''
                  }}
                >
                  <option value="">Resize</option>
                  <option value="1280x720">1280x720</option>
                  <option value="1600x900">1600x900</option>
                  <option value="1920x1080">1920x1080</option>
                </select>
                <button className="soft-button danger" onClick={() => handleDestroyOutput(ow.id)}>
                  Close
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="output-window-actions">
          <button className="soft-button" onClick={() => handleCreateOutput(undefined)}>
            + Add Output Window
          </button>
          <button
            className="soft-button"
            onClick={() => handleCreateForDisplays(displays.filter((display) => !display.isPrimary).map((display) => display.id))}
          >
            Open All Secondary Fullscreen
          </button>
        </div>
      </section>

      {/* Logo Image Configuration */}
      <section className="panel settings-logo-panel settings-card-group">
        <div className="panel-header">
          <h3>Logo Mode Image</h3>
          <small>Shown when LOGO button is pressed</small>
        </div>
        <div className="logo-picker-row settings-logo-row">
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
          <div className="settings-inline-stack">
            <input
              className="input"
              value={logoImage}
              onChange={(e) => onLogoImageChange(e.target.value)}
              placeholder="file://&hellip; or https://&hellip;"
            />
            <button className="soft-button" onClick={onPickLogoFile}>
              Browse&hellip;
            </button>
          </div>
        </div>
      </section>

      <section className="panel settings-looks-panel settings-card-group">
        <div className="panel-header"><h3>Per-Output Looks</h3><small>8-layer compositor</small></div>
        <div className="settings-looks-grid">
          {OUTPUT_IDS.map((id) => {
            const look = looks[id] || { background: '#111111', template: 'default', layers: ['slide_content'] }
            return (
              <div key={id} className="settings-look-card">
                <div className="output-route-heading settings-look-heading">
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
                    const meta = LAYER_META[layer] || { icon: '&bull;', label: layer.replace('_', ' ') }
                    return (
                      <label key={layer} className={`settings-layer-chip ${enabled ? 'active' : ''}`} title={meta.label}>
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
                        <span className="settings-layer-icon">{meta.icon}</span>
                        <span>{meta.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel settings-sync-panel settings-card-group">
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

      <section className="panel canvas-layout-section settings-card-group">
        <div className="canvas-layout-header">
          <div className="canvas-layout-title">Canvas Layout</div>
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
            <span className="canvas-display-res">{outputResolution.replace('x', ' \u00d7 ')}</span>
            <span className="canvas-handle tl" /><span className="canvas-handle tc" /><span className="canvas-handle tr" />
            <span className="canvas-handle ml" /><span className="canvas-handle mr" />
            <span className="canvas-handle bl" /><span className="canvas-handle bc" /><span className="canvas-handle br" />
          </div>
        </div>
      </section>

      <aside className="panel dimensions-panel">
        <div className="dimensions-title">Dimensions</div>
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
            <div className="hardware-icon">&#x1F5A5;</div>
            <div className="hardware-info">
              <strong>{outputHardware}</strong>
              <small>SDI Out 1 &bull; 60fps &bull; 10-bit</small>
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

      {/* About Section */}
      <section className="panel about-panel settings-card-group" style={{ gridColumn: '1 / -1' }}>
        <div className="panel-header">
          <h3>About WorshipPresenter</h3>
          <small>Application Information</small>
        </div>
        <div className="about-content">
          <div className="about-info-grid">
            <div className="about-info-item">
              <span className="about-label">Application</span>
              <span className="about-value">WorshipPresenter</span>
            </div>
            <div className="about-info-item">
              <span className="about-label">Version</span>
              <span className="about-value">{appVersion || '1.0.0'}</span>
            </div>
            <div className="about-info-item">
              <span className="about-label">Platform</span>
              <span className="about-value">{navigator.platform || 'Unknown'}</span>
            </div>
            <div className="about-info-item">
              <span className="about-label">Display Configuration</span>
              <span className="about-value">{displays.length} display(s) &middot; {activeOutputWindows.length} output(s)</span>
            </div>
            <div className="about-info-item">
              <span className="about-label">Brand</span>
              <span className="about-value">The Ethereal Stage</span>
            </div>
            <div className="about-info-item">
              <span className="about-label">Build</span>
              <span className="about-value">Electron installer via npm run dist:win</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
