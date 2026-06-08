import React from 'react'
import { Panel, SectionHeader, MediaCard, Chip } from './ui'

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
        <SectionHeader title="Content Categories" />
        <div className="filter-list">
          <button className="filter-item active">
            Songs <span>{songs.length}</span>
          </button>
          <button className="filter-item">
            Bibles <span>2</span>
          </button>
          <button className="filter-item">
            Media <span>--</span>
          </button>
          <button className="filter-item">
            Videos <span>{mediaAssets.filter((item) => item.type === 'video').length}</span>
          </button>
          <button className="filter-item">
            Backgrounds <span>{mediaAssets.filter((item) => item.type === 'image').length}</span>
          </button>
        </div>
        <div className="chip-group">
          {['Worship', 'Uplifting', 'Sermon', '4K UHD', 'Announcement', 'Instrumental'].map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
      </Panel>

      <Panel className="library-grid-panel">
        <div className="library-toolbar">
          <div>
            <h2>Song Library</h2>
            <p>{filteredSongs.length} arrangements</p>
          </div>
          <div className="toolbar-inline">
            <input
              value={songSearchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search songs"
              className="input"
            />
            <button className="soft-button" onClick={onImportSongs}>
              Import Songs
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
              >
                Grid
              </button>
              <button
                className={`view-toggle-btn ${libraryViewMode === 'list' ? 'active' : ''}`}
                onClick={() => onViewModeChange('list')}
              >
                List
              </button>
            </div>
            <button className="soft-button" onClick={onAddSong}>
              Add Song
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
                  Rename
                </button>
                <button
                  className="soft-button danger-ghost"
                  onClick={() => onDeleteSong(song)}
                  title="Delete song"
                >
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
