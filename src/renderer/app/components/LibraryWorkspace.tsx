import React from 'react'
import { AppIcon, Panel, SectionHeader, MediaCard, Chip } from './ui'

type Song = { id: number; title: string; artist?: string; sections: any[] }
type MediaAsset = { id: number; path: string; type: string; name?: string }

type Props = {
  songs: Song[]
  filteredSongs: Song[]
  selectedSongId: number
  mediaAssets: MediaAsset[]
  songSearchQuery: string
  librarySort: 'name' | 'sections'
  libraryViewMode: 'grid' | 'list'
  onSearchChange: (q: string) => void
  onSortChange: (sort: 'name' | 'sections') => void
  onViewModeChange: (mode: 'grid' | 'list') => void
  onSelectSong: (id: number) => void
  onAddSong: () => void
  onImportSongs: () => void
  onRenameSong: (song: Song) => void
  onDeleteSong: (song: Song) => void
}

export const LibraryWorkspace: React.FC<Props> = ({
  songs,
  filteredSongs,
  selectedSongId,
  mediaAssets,
  songSearchQuery,
  librarySort,
  libraryViewMode,
  onSearchChange,
  onSortChange,
  onViewModeChange,
  onSelectSong,
  onAddSong,
  onImportSongs,
  onRenameSong,
  onDeleteSong,
}) => {
  return (
    <div className="workspace-grid workspace-library">
      <Panel className="library-filters">
        <div className="library-sidebar-heading">
          <span className="panel-eyebrow">BROWSE CONTENT</span>
          <h2>Content Library</h2>
        </div>
        <div className="filter-list">
          <button className="filter-item active">
            <span className="filter-item-label"><AppIcon name="library" size={15} /> Songs</span><span>{songs.length}</span>
          </button>
          <button className="filter-item">
            <span className="filter-item-label"><AppIcon name="scripture" size={15} /> Bibles</span><span>2</span>
          </button>
          <button className="filter-item">
            <span className="filter-item-label"><AppIcon name="media" size={15} /> Media</span><span>—</span>
          </button>
          <button className="filter-item">
            <span className="filter-item-label"><AppIcon name="play" size={15} /> Videos</span><span>{mediaAssets.filter((item) => item.type === 'video').length}</span>
          </button>
          <button className="filter-item">
            <span className="filter-item-label"><AppIcon name="palette" size={15} /> Backgrounds</span><span>{mediaAssets.filter((item) => item.type === 'image').length}</span>
          </button>
        </div>
        <div className="library-filter-divider" />
        <div className="library-sidebar-heading compact"><span className="panel-eyebrow">TAGS</span></div>
        <div className="chip-group">
          {['Worship', 'Uplifting', 'Sermon', 'Announcements', 'Instrumental', 'Easter'].map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
        <div className="library-sidebar-note"><AppIcon name="info" size={14} /> Use tags and search together to find service-ready content.</div>
      </Panel>

      <Panel className="library-grid-panel">
        <div className="library-toolbar">
          <div className="library-title-block">
            <span className="panel-eyebrow">SONGS / ALL SONGS</span>
            <h2>Song Library</h2>
            <p>{filteredSongs.length} arrangements <span>•</span> {songs.length} total</p>
          </div>
          <div className="toolbar-inline">
            <label className="input-with-icon">
              <AppIcon name="search" size={15} />
              <input
                value={songSearchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search songs or lyrics..."
                className="input"
                aria-label="Search songs or lyrics"
              />
            </label>
            <button className="soft-button" onClick={onImportSongs}>
              <AppIcon name="upload" size={14} /> Import Songs
            </button>
            <select
              className="input"
              style={{ width: 130 }}
              value={librarySort}
              onChange={(event) => onSortChange(event.target.value as 'name' | 'sections')}
            >
              <option value="name">Sort: Name</option>
              <option value="sections">Sort: Sections</option>
            </select>
            <div className="view-toggle-group">
              <button
                className={`view-toggle-btn ${libraryViewMode === 'grid' ? 'active' : ''}`}
                onClick={() => onViewModeChange('grid')}
                title="Grid view"
              >
                <AppIcon name="grid" size={15} />
              </button>
              <button
                className={`view-toggle-btn ${libraryViewMode === 'list' ? 'active' : ''}`}
                onClick={() => onViewModeChange('list')}
                title="List view"
              >
                <AppIcon name="list" size={15} />
              </button>
            </div>
            <button className="live-button" onClick={onAddSong}>
              <AppIcon name="plus" size={14} /> Add Song
            </button>
          </div>
        </div>

        <div className={libraryViewMode === 'grid' ? 'bento-grid' : 'library-list'}>
          {filteredSongs.map((song) => (
            <div key={song.id} className="library-song-entry">
              <MediaCard
                title={song.title || 'Untitled Song'}
                subtitle={`${song.sections.length} sections`}
                active={song.id === selectedSongId}
                onClick={() => onSelectSong(song.id)}
              />
              <div className="library-song-actions">
                <button
                  className="soft-button"
                  onClick={() => onRenameSong(song)}
                  title="Rename song"
                >
                  <AppIcon name="editor" size={13} />
                  Rename
                </button>
                <button
                  className="soft-button danger-ghost"
                  onClick={() => onDeleteSong(song)}
                  title="Delete song"
                >
                  <AppIcon name="trash" size={13} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
