import React, { useState } from 'react'
import { AppIcon } from './ui'
import { FitText, RichTextEditor } from './RichText'

declare const window: any

const SECTION_TYPES = [
  'Intro', 'Verse', 'Chorus', 'Bridge', 'Pre-Chorus',
  'Post-Chorus', 'Tag', 'Outro', 'Interlude', 'Instrumental',
]

type Section = { id: number; type: string; text: string }
type Song = { id: number; title: string; artist?: string; sections: Section[] }
type MediaAsset = { id: number; path: string; type: string; name?: string }
type Theme = {
  bg: string; color: string; backgroundImage?: string; fontSize: number
  opacity?: number; blur?: number; gradient?: string; fontFamily?: string
  fontWeight?: number; textAlign?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'center' | 'bottom'
  textBoxWidth?: number; textBoxHeight?: number
}

type Props = {
  selectedSong: Song | undefined
  selectedSectionId: number | null
  currentSlide: string
  theme: Theme
  editorText: string
  editorType: string
  showChords: boolean
  transposeSteps: number
  undoStack: string[]
  redoStack: string[]
  songTitleDraft: string
  gradientStart: string
  gradientEnd: string
  bgManagerTab: 'media' | 'gradient' | 'color'
  editorDragIndex: number | null
  paneSizes: { editorLeft: number; editorRight: number }
  mediaAssets: MediaAsset[]
  onEditorTextChange: (text: string) => void
  onEditorTypeChange: (type: string) => void
  onSongTitleDraftChange: (title: string) => void
  onCommitSongTitle: () => void
  onPickSection: (sectionId: number, live?: boolean) => void
  onAddSection: () => void
  onDeleteSection: (sectionId: number) => void
  onMoveSongSection: (from: number, to: number) => void
  onSetEditorDragIndex: (idx: number | null) => void
  onSetTransposeSteps: (fn: (prev: number) => number) => void
  onSetShowChords: (fn: (prev: boolean) => boolean) => void
  onSetTheme: (t: Theme) => void
  onSetBgManagerTab: (tab: 'media' | 'gradient' | 'color') => void
  onSetGradientStart: (c: string) => void
  onSetGradientEnd: (c: string) => void
  onPickBackground: (asset: MediaAsset) => void
  onAddBackground: () => void | Promise<void>
  onSaveSectionEdits: () => void
  onGoLive: () => void
  onSaveTemplate: () => void
  onUndo: () => void
  onRedo: () => void
  stripChordMarkup: (text: string) => string
  onNotify: (title: string, detail?: string, tone?: 'info' | 'success' | 'warn') => void
}

export const EditorWorkspace: React.FC<Props> = ({
  selectedSong,
  selectedSectionId,
  currentSlide,
  theme,
  editorText,
  editorType,
  showChords,
  transposeSteps,
  undoStack,
  redoStack,
  songTitleDraft,
  gradientStart,
  gradientEnd,
  bgManagerTab,
  editorDragIndex,
  paneSizes,
  mediaAssets,
  onEditorTextChange,
  onEditorTypeChange,
  onSongTitleDraftChange,
  onCommitSongTitle,
  onPickSection,
  onAddSection,
  onDeleteSection,
  onMoveSongSection,
  onSetEditorDragIndex,
  onSetTransposeSteps,
  onSetShowChords,
  onSetTheme,
  onSetBgManagerTab,
  onSetGradientStart,
  onSetGradientEnd,
  onPickBackground,
  onAddBackground,
  onSaveSectionEdits,
  onGoLive,
  onSaveTemplate,
  onUndo,
  onRedo,
  stripChordMarkup,
  onNotify,
}) => {
  const backgroundAssets = mediaAssets.filter((asset) => asset.type === 'image' && asset.path)
  const toFileUrl = (value: string) => {
    if (value.startsWith('file://') || value.startsWith('http://') || value.startsWith('https://')) return value
    return /^[a-z]:[\\/]/i.test(value)
      ? `file:///${value.replace(/\\/g, '/')}`
      : `file://${value}`
  }

  const bgStyle: React.CSSProperties = {
    backgroundColor: theme.bg,
    backgroundImage: theme.gradient
      ? `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`
      : theme.backgroundImage
      ? `url(${theme.backgroundImage})`
      : undefined,
    backgroundSize: 'cover',
    color: theme.color,
    filter: (theme.blur ?? 0) > 0 ? `blur(${theme.blur}px)` : undefined,
  }

  return (
    <div
      className="workspace-grid workspace-editor"
      style={{ gridTemplateColumns: `${paneSizes.editorLeft}px minmax(0, 1fr) ${paneSizes.editorRight}px` }}
    >
      {/* Slide Sequence panel */}
      <aside className="panel sequence-panel">
        <div className="panel-header editor-sequence-header">
          <div><span className="panel-eyebrow">ARRANGEMENT</span><h2>Slide Sequence</h2></div>
          <button className="text-button" onClick={onAddSection}><AppIcon name="plus" size={13} /> Add</button>
        </div>
        <div className="sequence-list">
          {(selectedSong?.sections || []).map((section, index) => (
            <button
              key={section.id}
              draggable
              onDragStart={() => onSetEditorDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (editorDragIndex == null || editorDragIndex === index) return
                onMoveSongSection(editorDragIndex, index)
                onSetEditorDragIndex(null)
                onNotify('Section order updated', 'Slide sequence reordered', 'info')
              }}
              className={`sequence-item ${selectedSectionId === section.id ? 'active' : ''}`}
              onClick={() => onPickSection(section.id)}
              onDoubleClick={() => onPickSection(section.id, true)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{section.type}</strong>
                <small>{stripChordMarkup(section.text).slice(0, 84) || 'Empty section'}</small>
              </div>
               <button
                 className="seq-delete-btn"
                title="Delete section"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteSection(section.id)
                }}
              >
                 <AppIcon name="trash" size={13} />
               </button>
            </button>
          ))}
        </div>
      </aside>

      {/* Stage preview */}
      <section className="panel stage-panel">
        <div className="panel-header">
          <input
            className="input"
            style={{ maxWidth: 360 }}
            value={songTitleDraft}
            onChange={(event) => onSongTitleDraftChange(event.target.value)}
            onBlur={onCommitSongTitle}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onCommitSongTitle() } }}
            placeholder="Song title"
          />
          <div className="toolbar-inline">
            <button className="soft-button" onClick={() => onSetTransposeSteps((v) => v - 1)}>♭ Flat</button>
            <button className="soft-button" onClick={() => onSetTransposeSteps(() => 0)}>Reset</button>
            <button className="soft-button" onClick={() => onSetTransposeSteps((v) => v + 1)}>♯ Sharp</button>
            <button className="soft-button" onClick={() => onSetShowChords((v) => !v)}>
              <AppIcon name="type" size={13} /> {showChords ? 'Hide Chords' : 'Show Chords'}
            </button>
          </div>
        </div>
        <div className="stage-canvas" style={{ position: 'relative', color: theme.color }}>
          <div
            style={{
              ...bgStyle,
              position: 'absolute',
              inset: 0,
              opacity: (theme.opacity ?? 100) / 100,
              borderRadius: 'inherit',
            }}
          />
          <div className="slide-overlay live" />
          <FitText
            value={currentSlide || 'Select a section'}
            className="editor-fit"
            baseFontSize={theme.fontSize}
            fontFamily={theme.fontFamily || 'Manrope'}
            fontWeight={theme.fontWeight || 700}
            textAlign={theme.textAlign || 'center'}
            verticalAlign={theme.verticalAlign || 'center'}
            textBoxWidth={theme.textBoxWidth ?? 90}
            textBoxHeight={theme.textBoxHeight ?? 70}
            style={{ position: 'absolute', inset: 0, zIndex: 1, padding: '40px 60px', color: theme.color }}
            aria-label="Song slide preview"
          />
          <span className="live-pill stage">Live View</span>
        </div>
        <div className="stage-toolbar">
          <span className="stage-label">
            Tt {selectedSong?.sections.find((s) => s.id === selectedSectionId)?.type || 'VERSE'}{' '}
            {selectedSectionId
              ? (selectedSong?.sections.findIndex((s) => s.id === selectedSectionId) ?? 0) + 1
              : 1}
          </span>
          <span className="toolbar-divider" />
          <button className="undo-redo-btn" onClick={onUndo} disabled={undoStack.length === 0} title="Undo">↩</button>
          <button className="undo-redo-btn" onClick={onRedo} disabled={redoStack.length === 0} title="Redo">↪</button>
        </div>
      </section>

      {/* Inspector panel */}
      <aside className="panel inspector-panel">
        <div className="panel-header"><div><span className="panel-eyebrow">INSPECTOR</span><h2>Editor</h2></div><AppIcon name="settings" size={16} /></div>
        <div className="inspector-content">
          <label>Section Type</label>
          <select className="input" value={editorType} onChange={(event) => onEditorTypeChange(event.target.value)}>
            {SECTION_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <label>Section Text</label>
          <RichTextEditor
            value={editorText}
            onChange={onEditorTextChange}
            placeholder="Type lyrics, then format them for the screen..."
            aria-label="Section rich text"
          />

          <details className="collapsible-section">
            <summary>Background &amp; Style</summary>
            <div className="collapsible-inner">
              <div className="bg-tab-group">
                <button className={`bg-tab ${bgManagerTab === 'media' ? 'active' : ''}`} onClick={() => onSetBgManagerTab('media')}><AppIcon name="media" size={13} /> Media</button>
                <button className={`bg-tab ${bgManagerTab === 'gradient' ? 'active' : ''}`} onClick={() => onSetBgManagerTab('gradient')}><AppIcon name="spark" size={13} /> Gradient</button>
                <button className={`bg-tab ${bgManagerTab === 'color' ? 'active' : ''}`} onClick={() => onSetBgManagerTab('color')}><AppIcon name="palette" size={13} /> Color</button>
              </div>

              {bgManagerTab === 'media' && (
                <>
                  <label>Active Media</label>
                  <div className="active-media-preview">
                    {theme.backgroundImage ? (
                      <img
                        src={toFileUrl(theme.backgroundImage)}
                        alt="Background"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        No media selected
                      </div>
                    )}
                  </div>
                  <label>Background Image</label>
                  <input
                    className="input"
                    value={theme.backgroundImage || ''}
                    onChange={(event) => onSetTheme({ ...theme, backgroundImage: event.target.value, gradient: '' })}
                    placeholder="file://... or https://..."
                  />
                  <label className="background-picker-label">
                    <span>Quick Picker</span>
                    <small>{backgroundAssets.length} image{backgroundAssets.length === 1 ? '' : 's'}</small>
                  </label>
                  <div className="quick-picker-grid">
                    {backgroundAssets.map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        className={`quick-picker-item ${!theme.gradient && theme.backgroundImage === asset.path ? 'active' : ''}`}
                        onClick={() => onPickBackground(asset)}
                        title={`Use ${asset.name || 'background'}`}
                      >
                        <img src={toFileUrl(asset.path)} alt={asset.name || 'Background'} />
                        <span>{asset.name || 'Background'}</span>
                      </button>
                    ))}
                    <button className="quick-picker-add" type="button" onClick={onAddBackground} aria-label="Add background" title="Add background image">+</button>
                  </div>
                  {!backgroundAssets.length && (
                    <div className="background-picker-empty">No image backgrounds yet. Add one here or import it from Media.</div>
                  )}
                </>
              )}

              {bgManagerTab === 'gradient' && (
                <>
                  <label>Gradient Colors</label>
                  <div className="gradient-picker-row">
                    <input
                      type="color"
                      value={gradientStart}
                      onChange={(e) => {
                        onSetGradientStart(e.target.value)
                        onSetTheme({ ...theme, gradient: `linear-gradient(135deg, ${e.target.value}, ${gradientEnd})`, backgroundImage: '' })
                      }}
                    />
                    <div className="gradient-preview" style={{ background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }} />
                    <input
                      type="color"
                      value={gradientEnd}
                      onChange={(e) => {
                        onSetGradientEnd(e.target.value)
                        onSetTheme({ ...theme, gradient: `linear-gradient(135deg, ${gradientStart}, ${e.target.value})`, backgroundImage: '' })
                      }}
                    />
                  </div>
                </>
              )}

              {bgManagerTab === 'color' && (
                <>
                  <label>Background Color</label>
                  <input
                    type="color"
                    value={theme.bg}
                    onChange={(event) => onSetTheme({ ...theme, bg: event.target.value, gradient: '', backgroundImage: '' })}
                  />
                </>
              )}

              <div className="slider-row">
                <div className="slider-label"><span>Opacity</span><span>{theme.opacity ?? 100}%</span></div>
                <input type="range" min={0} max={100} value={theme.opacity ?? 100}
                  onChange={(e) => onSetTheme({ ...theme, opacity: Number(e.target.value) })} />
              </div>
              <div className="slider-row">
                <div className="slider-label"><span>Blur</span><span>{theme.blur ?? 0}px</span></div>
                <input type="range" min={0} max={20} value={theme.blur ?? 0}
                  onChange={(e) => onSetTheme({ ...theme, blur: Number(e.target.value) })} />
              </div>

              <label>Font Size ({theme.fontSize}px)</label>
              <input type="range" min={24} max={96} value={theme.fontSize}
                onChange={(event) => onSetTheme({ ...theme, fontSize: Number(event.target.value) })} />

              <label>Content Width ({theme.textBoxWidth ?? 90}%)</label>
              <input type="range" min={40} max={100} value={theme.textBoxWidth ?? 90}
                onChange={(event) => onSetTheme({ ...theme, textBoxWidth: Number(event.target.value) })} />

              <label>Content Height ({theme.textBoxHeight ?? 70}%)</label>
              <input type="range" min={25} max={100} value={theme.textBoxHeight ?? 70}
                onChange={(event) => onSetTheme({ ...theme, textBoxHeight: Number(event.target.value) })} />

              <label>Font Family</label>
              <select className="input" value={theme.fontFamily || 'Manrope'}
                onChange={(event) => onSetTheme({ ...theme, fontFamily: event.target.value })}>
                <option value="Manrope">Manrope</option>
                <option value="Inter">Inter</option>
                <option value="Segoe UI">Segoe UI</option>
              </select>

              <label>Font Weight ({theme.fontWeight || 700})</label>
              <input type="range" min={300} max={900} step={100} value={theme.fontWeight || 700}
                onChange={(event) => onSetTheme({ ...theme, fontWeight: Number(event.target.value) })} />

              <label>Text Alignment</label>
              <select className="input" value={theme.textAlign || 'center'}
                onChange={(event) => onSetTheme({ ...theme, textAlign: event.target.value as 'left' | 'center' | 'right' })}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>

              <label>Vertical Position</label>
              <select className="input" value={theme.verticalAlign || 'center'}
                onChange={(event) => onSetTheme({ ...theme, verticalAlign: event.target.value as 'top' | 'center' | 'bottom' })}>
                <option value="top">Top Half</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom Half</option>
              </select>

              <label>Text Color</label>
              <input type="color" value={theme.color}
                onChange={(event) => onSetTheme({ ...theme, color: event.target.value })} />
            </div>
          </details>

          <div className="button-row">
            <button className="soft-button full" onClick={onSaveSectionEdits}><AppIcon name="save" size={14} /> Save Section</button>
            <button className="live-button full" onClick={onGoLive}><AppIcon name="send" size={14} /> Send Live</button>
            <button className="template-button" onClick={onSaveTemplate}><AppIcon name="palette" size={14} /> Save as Template</button>
          </div>
        </div>
      </aside>
    </div>
  )
}
