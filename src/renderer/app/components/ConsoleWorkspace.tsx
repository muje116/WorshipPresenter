import React from 'react'
import { AppIcon, Panel, SectionHeader, StatusBadge } from './ui'
import { FitText, richTextToPlainText } from './RichText'

declare const window: any

type ScheduleItem = { id: number; type: string; content: string }
type OutputConfig = { id: number; role: string; resolution: string; active: boolean }
type Theme = {
  bg: string
  color: string
  backgroundImage?: string
  fontSize: number
  opacity?: number
  blur?: number
  gradient?: string
  fontFamily?: string
  fontWeight?: number
  textAlign?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'center' | 'bottom'
  textBoxWidth?: number
  textBoxHeight?: number
}

type Props = {
  schedule: ScheduleItem[]
  theme: Theme
  currentSlide: string
  liveSlide: string
  outputConfigs: OutputConfig[]
  paneSizes: { consoleLeft: number; consoleBottom: number }
  outputStates: Record<number, { slideTitle?: string; mode?: string }>
  dragIndex: number | null
  onDragStart: (index: number) => void
  onDrop: (index: number) => void
  onScheduleItemClick: (content: string) => void
  onAddScheduleItem: () => void
  onGoToEditor: () => void
  isOnAir: boolean
  presentationPaused: boolean
  onGoLive: () => void
  onClear: () => void
  onLogo: () => void
  onBlack: () => void
  onTogglePause: () => void
  onEndLive: () => void
}

const OUTPUT_IDS = [1, 2]

const formatType = (type: string) => type.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

export const ConsoleWorkspace: React.FC<Props> = ({
  schedule,
  theme,
  currentSlide,
  liveSlide,
  outputConfigs,
  paneSizes,
  outputStates,
  dragIndex,
  onDragStart,
  onDrop,
  onScheduleItemClick,
  onAddScheduleItem,
  onGoToEditor,
  isOnAir,
  presentationPaused,
  onGoLive,
  onClear,
  onLogo,
  onBlack,
  onTogglePause,
  onEndLive,
}) => {
  const previewStyle: React.CSSProperties = {
    backgroundColor: theme.bg,
    backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
    backgroundSize: 'cover',
    color: theme.color,
  }

  const queueItems = schedule.slice(0, 4)
  const queueFallback = !queueItems.length && currentSlide
    ? [{ id: -1, type: 'Current slide', content: currentSlide }]
    : queueItems
  const output1 = outputConfigs.find((output) => output.id === 1)
  const output2 = outputConfigs.find((output) => output.id === 2)

  return (
    <div
      className="workspace-grid workspace-console"
      style={{ gridTemplateColumns: `${paneSizes.consoleLeft}px minmax(0, 1fr)` }}
    >
      <Panel className="schedule-panel">
        <div className="schedule-panel-heading">
          <div>
            <span className="panel-eyebrow">SERVICE PLAN</span>
            <h2>Order of Service</h2>
          </div>
          <span className="schedule-count">{schedule.length} items</span>
        </div>
        <div className="schedule-list">
          {schedule.length ? schedule.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex != null && dragIndex !== index) onDrop(index)
              }}
              onClick={() => onScheduleItemClick(item.content)}
              className={`schedule-item ${index === 0 ? 'active' : ''}`}
            >
              <span className="schedule-drag-handle" aria-hidden="true">⋮⋮</span>
              <div className="schedule-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="schedule-item-copy">
                <strong>{richTextToPlainText(item.content || 'Untitled item')}</strong>
                <small>{formatType(item.type)} <span>•</span> {index === 0 ? 'Current' : index === 1 ? 'Next' : 'Upcoming'}</small>
              </div>
              {index === 0 ? <StatusBadge tone="success">CURRENT</StatusBadge> : null}
            </div>
          )) : (
            <div className="empty-schedule">
              <AppIcon name="queue" size={24} />
              <strong>No service items yet</strong>
              <span>Add the first item to build today&apos;s running order.</span>
            </div>
          )}
        </div>
        <button className="soft-button full schedule-add-button" onClick={onAddScheduleItem}>
          <AppIcon name="plus" size={15} /> Add service item
        </button>
        <div className="schedule-footer-note">
          <span className="connected-dot" /> Drag to reorder · Double-click a slide to send it live
        </div>
      </Panel>

      <section className="console-stage">
        <div className="console-stage-heading">
          <div>
            <span className="panel-eyebrow">LIVE PRODUCTION</span>
            <h1>Presentation console</h1>
          </div>
          <div className="stage-heading-meta">
            <span><AppIcon name="monitor" size={14} /> Output 1 · {output1?.resolution || '1920x1080'} · {formatType(output1?.role || 'extended')}</span>
            <span><AppIcon name="clock" size={14} /> Ready</span>
          </div>
        </div>

        <div className="monitor-grid">
          <Panel className="monitor preview-monitor">
            <div className="monitor-header">
              <div className="monitor-label-group">
                <span className="monitor-status-dot preview" />
                <div><strong>Preview</strong><small>Next on air</small></div>
              </div>
              <div className="monitor-actions">
                <span className="monitor-output-label">OUTPUT 1 · {formatType(output1?.role || 'extended')}</span>
                <button className="text-button" onClick={onGoToEditor}>Edit <AppIcon name="external" size={13} /></button>
              </div>
            </div>
            <div className="slide-frame" style={previewStyle}>
              <div className="slide-overlay" />
              <span className="frame-badge preview-badge">PREVIEW</span>
              <FitText
                value={currentSlide || 'Select a slide to preview'}
                className="slide-fit"
                baseFontSize={theme.fontSize}
                fontFamily={theme.fontFamily || 'Manrope'}
                fontWeight={theme.fontWeight || 700}
                textAlign={theme.textAlign || 'center'}
                verticalAlign={theme.verticalAlign || 'center'}
                textBoxWidth={theme.textBoxWidth ?? 90}
                textBoxHeight={theme.textBoxHeight ?? 90}
                style={previewStyle}
                aria-label="Preview slide content"
              />
            </div>
          </Panel>

          <Panel className={`monitor live ${isOnAir ? 'is-on-air' : ''}`}>
            <div className="monitor-header">
              <div className="monitor-label-group">
                <span className="monitor-status-dot live" />
                <div><strong>Live Output</strong><small>What the room sees</small></div>
              </div>
              <div className="monitor-actions">
                <span className="monitor-output-label">OUTPUT 2 · {formatType(output2?.role || 'extended')}</span>
                <StatusBadge tone="live">{isOnAir ? 'ON AIR' : 'STANDBY'}</StatusBadge>
              </div>
            </div>
            <div className="slide-frame" style={previewStyle}>
              <div className="slide-overlay live" />
              <span className="frame-badge live-badge">{isOnAir ? 'LIVE' : 'STANDBY'}</span>
              <FitText
                value={liveSlide || 'Nothing live yet'}
                className="slide-fit"
                baseFontSize={theme.fontSize}
                fontFamily={theme.fontFamily || 'Manrope'}
                fontWeight={theme.fontWeight || 700}
                textAlign={theme.textAlign || 'center'}
                verticalAlign={theme.verticalAlign || 'center'}
                textBoxWidth={theme.textBoxWidth ?? 90}
                textBoxHeight={theme.textBoxHeight ?? 90}
                style={previewStyle}
                aria-label="Live slide content"
              />
            </div>
          </Panel>
        </div>

        <Panel className="queue-panel">
          <div className="queue-panel-heading">
            <div><span className="panel-eyebrow">UP NEXT</span><h2>Next in Queue</h2></div>
            <span className="queue-hint">Select a card to load it into Preview</span>
          </div>
          <div className="queue-cards">
            {queueFallback.map((item, index) => (
              <button
                key={item.id}
                className={`queue-card ${index === 0 ? 'active' : ''}`}
                onClick={() => onScheduleItemClick(item.content)}
              >
                <span className="queue-card-number">{index + 1}</span>
                <span className="queue-card-copy">
                  <strong>{formatType(item.type)}</strong>
                  <small>{richTextToPlainText(item.content || 'Empty slide')}</small>
                </span>
                {index === 0 ? <span className="queue-selected"><AppIcon name="check" size={13} /> SELECTED</span> : <AppIcon name="chevron" size={15} className="queue-card-chevron" />}
              </button>
            ))}
            {!queueFallback.length && <div className="queue-empty">The queue will appear here as you add service items.</div>}
          </div>
        </Panel>

        <div className="live-control-bar">
          <div className="live-control-heading">
            <span className={`control-state-dot ${isOnAir ? 'live' : ''}`} />
            <div><strong>{presentationPaused ? 'Presentation paused' : isOnAir ? 'Live session active' : 'Ready to present'}</strong><small>Operator controls</small></div>
          </div>
          <div className="live-control-actions">
            <button className="control-button go-live" onClick={onGoLive}><AppIcon name="send" size={15} /> Go Live</button>
            <button className="control-button" onClick={onClear}><AppIcon name="clear" size={15} /> Clear</button>
            <button className="control-button" onClick={onLogo}><AppIcon name="logo" size={15} /> Logo</button>
            <button className="control-button" onClick={onBlack}><AppIcon name="black" size={15} /> Black Screen</button>
            <button className={`control-button ${presentationPaused ? 'selected' : ''}`} onClick={onTogglePause}><AppIcon name="pause" size={15} /> {presentationPaused ? 'Resume' : 'Pause'}</button>
            <button className="control-button end-live" onClick={onEndLive}><AppIcon name="stop" size={15} /> End Live</button>
          </div>
        </div>

        <Panel className="output-preview-panel" style={{ minHeight: paneSizes.consoleBottom }}>
          <SectionHeader title="Output Preview Matrix" meta="Secondary windows" />
          <div className="output-preview-grid">
            {OUTPUT_IDS.map((id) => {
              const state = outputStates[id] || {}
              const label = state.mode === 'black'
                ? 'BLACK'
                : state.mode === 'logo'
                ? 'Church Logo'
                : state.slideTitle || 'Idle'
              return (
                <div key={id} className="output-tile">
                  <div className="output-tile-heading"><strong>Output {id}</strong><span className="output-tile-status"><span className="connected-dot" /> Connected</span></div>
                  <div className="output-box"><span>{label}</span><small>{outputConfigs.find((output) => output.id === id)?.resolution || '1920x1080'} · {formatType(outputConfigs.find((output) => output.id === id)?.role || 'extended')}</small></div>
                  <div className="toolbar-inline output-tile-actions">
                    <button className="soft-button" onClick={() => window?.worship?.outputs?.windowControl?.(id, 'show')}><AppIcon name="eye" size={13} /> Show</button>
                    <button className="soft-button" onClick={() => window?.worship?.outputs?.windowControl?.(id, 'toggle-fullscreen')}><AppIcon name="external" size={13} /> Full View</button>
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      </section>
    </div>
  )
}
