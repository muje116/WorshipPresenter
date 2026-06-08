import React from 'react'
import { Panel, SectionHeader, Pill } from './ui'
import { useStore } from '../store'

declare const window: any

type ScheduleItem = { id: number; type: string; content: string }
type MediaAsset = { id: number; path: string; type: string; name?: string }
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
}

type Props = {
  schedule: ScheduleItem[]
  theme: Theme
  currentSlide: string
  liveSlide: string
  paneSizes: { consoleLeft: number; consoleBottom: number }
  outputStates: Record<number, { slideTitle?: string; mode?: string }>
  dragIndex: number | null
  onDragStart: (index: number) => void
  onDrop: (index: number) => void
  onScheduleItemClick: (content: string) => void
  onAddScheduleItem: () => void
  onGoToEditor: () => void
}

const OUTPUT_IDS = [1, 2]

export const ConsoleWorkspace: React.FC<Props> = ({
  schedule,
  theme,
  currentSlide,
  liveSlide,
  paneSizes,
  outputStates,
  dragIndex,
  onDragStart,
  onDrop,
  onScheduleItemClick,
  onAddScheduleItem,
  onGoToEditor,
}) => {
  return (
    <div
      className="workspace-grid workspace-console"
      style={{
        gridTemplateColumns: `${paneSizes.consoleLeft}px minmax(0, 1fr)`,
      }}
    >
      <Panel className="schedule-panel">
        <SectionHeader title="Order of Service" meta={`${schedule.length} items`} />
        <div className="schedule-list">
          {schedule.map((item, index) => (
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
              <div className="schedule-meta">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span>{index === 0 ? 'CURRENT' : index === 1 ? 'NEXT' : 'UPCOMING'}</span>
              </div>
              <strong>{item.content}</strong>
              <small>{item.type}</small>
            </div>
          ))}
        </div>
        <button className="soft-button full" onClick={onAddScheduleItem}>
          Add Item
        </button>
      </Panel>

      <section className="console-stage">
        <div className="monitor-grid">
          <Panel className="monitor">
            <div className="monitor-header">
              <span>Preview</span>
              <button className="text-button" onClick={onGoToEditor}>Edit</button>
            </div>
            <div
              className="slide-frame"
              style={{
                backgroundColor: theme.bg,
                backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                color: theme.color,
                fontSize: theme.fontSize,
              }}
            >
              <div className="slide-overlay" />
              <div className="slide-content">{currentSlide}</div>
            </div>
          </Panel>
          <Panel className="monitor live">
            <div className="monitor-header">
              <span>Live Output</span>
              <Pill className="live-pill">ON AIR</Pill>
            </div>
            <div
              className="slide-frame"
              style={{
                backgroundColor: theme.bg,
                backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                color: theme.color,
                fontSize: theme.fontSize,
              }}
            >
              <div className="slide-overlay live" />
              <div className="slide-content">{liveSlide}</div>
            </div>
          </Panel>
        </div>
        <Panel className="output-preview-panel" style={{ minHeight: paneSizes.consoleBottom }}>
          <SectionHeader title="Output Preview Matrix" />
          <div className="output-preview-grid">
            {OUTPUT_IDS.map((id) => {
              const state = outputStates[id] || {}
              const label =
                state.mode === 'black'
                  ? 'BLACK'
                  : state.mode === 'logo'
                  ? 'Church Logo'
                  : state.slideTitle || 'Idle'
              return (
                <div key={id} className="output-tile">
                  <small>Output {id}</small>
                  <div className="output-box">{label}</div>
                  <div className="toolbar-inline" style={{ marginTop: 6 }}>
                    <button
                      className="soft-button"
                      onClick={() => window?.worship?.outputs?.windowControl?.(id, 'show')}
                    >
                      Show
                    </button>
                    <button
                      className="soft-button"
                      onClick={() => window?.worship?.outputs?.windowControl?.(id, 'toggle-fullscreen')}
                    >
                      Full View
                    </button>
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
