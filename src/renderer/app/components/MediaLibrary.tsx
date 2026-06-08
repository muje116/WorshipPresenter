import React, { useEffect, useState } from 'react'
import { useStore } from '../store'
import { dbService } from '../services/db'

declare const window: any

interface MediaAsset {
  id: number
  path: string
  type: 'image' | 'video'
  name?: string
  thumbnail?: string
  duration?: number
  folder_id?: number | null
}

interface MediaFolder {
  id: number
  name: string
  parent_id: number | null
}

interface MediaLibraryProps {
  mediaType: 'image' | 'video'
  onMediaSelect: (asset: MediaAsset) => void
  onSendToPreview?: (asset: MediaAsset) => void
  onSendToLive?: (asset: MediaAsset, playback?: { loop: boolean; muted: boolean; playbackRate: number }) => void
  onNotify?: (title: string, detail?: string, tone?: 'info' | 'success' | 'warn') => void
}

type MediaFilter = 'all' | 'image' | 'video' | 'background' | 'loop'

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ mediaType: _initialType, onMediaSelect, onSendToPreview, onSendToLive, onNotify }) => {
  const setCurrentSlide = useStore((state) => state.setCurrentSlide)
  const setLiveSlide = useStore((state) => state.setLiveSlide)
  const setTheme = useStore((state) => state.setTheme)
  const theme = useStore((state) => state.theme)

  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [activeFilter, setActiveFilter] = useState<MediaFilter>('all')
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortMode, setSortMode] = useState<'recent' | 'name'>('recent')
  const [searchQuery, setSearchQuery] = useState('')
  const [videoLoop, setVideoLoop] = useState(true)
  const [videoMuted, setVideoMuted] = useState(true)
  const [videoPlaybackRate, setVideoPlaybackRate] = useState(1)

  useEffect(() => {
    loadMediaAssets()
    loadFolders()
  }, [activeFilter, currentFolderId])

  const loadMediaAssets = async () => {
    try {
      const typeFilter = activeFilter === 'all' ? undefined : activeFilter
      const results = await dbService.media.getAssets(currentFolderId, typeFilter)
      const normalized = (results || []).map((asset: any) => ({
        ...asset,
        name: asset.name || asset.path?.split('\\').pop() || asset.path?.split('/').pop() || 'Untitled'
      }))
      setMediaAssets(normalized)
    } catch (error) {
      console.error('Failed to load media assets:', error)
      setMediaAssets([])
    }
  }

  const loadFolders = async () => {
    try {
      const results = await dbService.media.getFolders()
      setFolders(results || [])
    } catch {
      setFolders([])
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    try {
      const type = activeFilter === 'video' ? 'video' : 'image'
      const extensions = type === 'image'
        ? ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
        : ['mp4', 'mov', 'mkv', 'webm', 'avi']
      const title = type === 'image' ? 'Import Images' : 'Import Videos'

      const filePaths: string[] = await window.worship.dialog.openFiles({
        title,
        filters: [{ name: title, extensions }],
        multiSelections: true
      })

      if (filePaths.length > 0) {
        for (const filePath of filePaths) {
          const fileName = filePath.split('\\').pop() || filePath.split('/').pop() || ''
          await dbService.media.createAsset(
            filePath,
            type,
            fileName,
            type === 'video' ? 0 : null,
            currentFolderId
          )
        }
        await loadMediaAssets()
        onNotify?.('Media imported', `${filePaths.length} item(s) added`, 'success')
      }
    } catch (error) {
      console.error('Failed to import media:', error)
      onNotify?.('Import failed', 'Could not import selected files', 'warn')
    } finally {
      setIsImporting(false)
    }
  }

  const handleCreateFolder = async () => {
    const name = prompt('Folder name:')
    if (!name) return
    try {
      await dbService.media.createFolder(name, currentFolderId)
      await loadFolders()
      onNotify?.('Folder created', name, 'success')
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }

  const handleDelete = async (asset: MediaAsset) => {
    try {
      await dbService.media.deleteAsset(asset.id)
      await loadMediaAssets()
      if (selectedAsset?.id === asset.id) {
        setSelectedAsset(null)
      }
      onNotify?.('Asset deleted', asset.name || 'Media asset removed', 'warn')
    } catch (error) {
      console.error('Failed to delete media:', error)
    }
  }

  const handleSelect = (asset: MediaAsset) => {
    setSelectedAsset(asset)
    onMediaSelect(asset)
  }

  const handleUseAsBackground = () => {
    if (!selectedAsset) return
    setTheme({ ...theme, backgroundImage: selectedAsset.path })
    onNotify?.('Background updated', selectedAsset.name || 'Media background applied', 'success')
  }

  const handleSendToLive = () => {
    if (!selectedAsset) return
    onSendToLive?.(selectedAsset, { loop: videoLoop, muted: videoMuted, playbackRate: videoPlaybackRate })
    setTheme({ ...theme, backgroundImage: selectedAsset.path })
    setLiveSlide('')
    onNotify?.('Sent live', selectedAsset.name || 'Media pushed to outputs', 'success')
  }

  const handleSendToPreview = () => {
    if (!selectedAsset) return
    onSendToPreview?.(selectedAsset)
    setTheme({ ...theme, backgroundImage: selectedAsset.path })
    setCurrentSlide('')
    onNotify?.('Sent to preview', selectedAsset.name || 'Preview updated', 'info')
  }

  const handleAddToSchedule = async () => {
    if (!selectedAsset) return
    try {
      await dbService.schedule.addItem(
        selectedAsset.type === 'image' ? 'image' : 'video',
        selectedAsset.path
      )
      // Note: in a real application, we might also want to update the store's schedule state
      // Let's reload the store schedule items to keep UI in sync
      const nextItems = await dbService.schedule.getItems()
      useStore.setState({ schedule: nextItems })
      onNotify?.('Added to schedule', selectedAsset.name || 'Media queued', 'success')
    } catch (error) {
      console.error('Failed to add to schedule:', error)
    }
  }

  const filteredAssets = mediaAssets
    .filter(a => !searchQuery || (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => sortMode === 'name' ? (a.name || '').localeCompare(b.name || '') : b.id - a.id)

  const currentFolders = folders.filter(f => f.parent_id === currentFolderId)

  const FILTER_ITEMS: { key: MediaFilter; label: string; icon: string }[] = [
    { key: 'all', label: 'All Media', icon: '📁' },
    { key: 'image', label: 'Images', icon: '🖼' },
    { key: 'video', label: 'Videos', icon: '🎬' },
    { key: 'background', label: 'Backgrounds', icon: '🌄' },
    { key: 'loop', label: 'Loops', icon: '🔄' },
  ]

  return (
    <div className="workspace-grid workspace-media">
      {/* LEFT: Filters & Folders Panel */}
      <aside className="panel media-filters-panel">
        <div className="media-section-label">
          Media Assets
        </div>

        <div className="media-type-list">
          {FILTER_ITEMS.map(item => (
            <button
              key={item.key}
              className={`media-type-item ${activeFilter === item.key ? 'active' : ''}`}
              onClick={() => { setActiveFilter(item.key); setCurrentFolderId(null) }}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="media-section-label">
          Folders
          <button onClick={handleCreateFolder} title="New Folder">+</button>
        </div>

        <div className="folder-tree">
          {currentFolderId !== null && (
            <button className="folder-item" onClick={() => setCurrentFolderId(null)}>
              <span className="folder-icon">⬅</span>
              Back to Root
            </button>
          )}
          {currentFolders.map(folder => (
            <button key={folder.id} className={`folder-item ${currentFolderId === folder.id ? 'active' : ''}`} onClick={() => setCurrentFolderId(folder.id)}>
              <span className="folder-icon">📁</span>
              {folder.name}
            </button>
          ))}
        </div>

        <div className="media-panel-actions">
          <button className="live-button full" onClick={handleImport} disabled={isImporting}>
            {isImporting ? '⏳ Importing...' : '📤 Import Media'}
          </button>
          <button className="ghost-button" onClick={handleCreateFolder}>
            📁 New Folder
          </button>
        </div>

        <div className="media-bottom-links">
          <button className="media-bottom-link">🗑 Trash</button>
          <button className="media-bottom-link">📦 Archive</button>
        </div>
      </aside>

      {/* CENTER: Content Grid */}
      <section className="panel media-content-panel">
        <div className="media-main-toolbar">
          <input
            className="search-input"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="view-toggle-group">
            <button className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>⊞</button>
            <button className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>☰</button>
          </div>
          <select className="sort-select" value={sortMode} onChange={(e) => setSortMode(e.target.value as any)}>
            <option value="recent">Sort: Recent</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>

        {viewMode === 'grid' ? (
          <div className="media-content-grid">
            {/* Folder cards */}
            {currentFolders.map(folder => (
              <div key={`f-${folder.id}`} className="folder-card" onClick={() => setCurrentFolderId(folder.id)}>
                <span className="folder-icon-lg">📁</span>
                <span className="folder-name">{folder.name}</span>
              </div>
            ))}

            {/* Asset cards */}
            {filteredAssets.map(asset => (
              <div
                key={asset.id}
                className={`asset-card ${selectedAsset?.id === asset.id ? 'selected' : ''}`}
                onClick={() => handleSelect(asset)}
                onDoubleClick={() => handleSendToPreview()}
              >
                <div className="asset-card-thumb">
                  {asset.type === 'image' ? (
                    <img
                      src={`file://${asset.path}`}
                      alt={asset.name}
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <span className="video-icon">🎬</span>
                  )}
                </div>
                <div className="asset-card-name">
                  <span className="type-icon">{asset.type === 'image' ? '🖼' : '▶'}</span>
                  {(asset.name || '').length > 20 ? (asset.name || '').slice(0, 18) + '...' : asset.name}
                </div>
              </div>
            ))}

            {filteredAssets.length === 0 && currentFolders.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 10, opacity: 0.5 }}>{activeFilter === 'video' ? '🎬' : '🖼️'}</div>
                <div style={{ fontSize: '0.85rem', marginBottom: 4 }}>No assets yet</div>
                <div style={{ fontSize: '0.72rem' }}>Click "Import Media" to add files</div>
              </div>
            )}
          </div>
        ) : (
          <div className="media-content-list">
            {filteredAssets.map(asset => (
              <div key={asset.id} className={`media-list-item ${selectedAsset?.id === asset.id ? 'selected' : ''}`} onClick={() => handleSelect(asset)}>
                <div className="media-list-thumb">
                  {asset.type === 'image' ? (
                    <img src={`file://${asset.path}`} alt={asset.name} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1rem' }}>🎬</div>
                  )}
                </div>
                <div className="media-list-info">
                  <div className="media-list-name">{asset.name}</div>
                  <div className="media-list-meta">{asset.type} • {asset.path.split('\\').pop()?.split('.').pop()?.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status bar */}
        <div className="status-bar">
          <span className="status-dot" />
          System Live
          <span style={{ opacity: 0.6 }}>|</span>
          {filteredAssets.length} assets
        </div>
      </section>

      {/* RIGHT: Inspector Panel */}
      <aside className="panel media-inspector">
        <div className="inspector-header">
          <h3 className="inspector-title">Inspector</h3>
        </div>

        {selectedAsset ? (
          <>
            <div className="asset-preview">
              {selectedAsset.type === 'image' ? (
                <img
                  src={`file://${selectedAsset.path}`}
                  alt={selectedAsset.name}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <video
                  src={`file://${selectedAsset.path}`}
                  autoPlay
                  loop={videoLoop}
                  muted={videoMuted}
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>

            {selectedAsset.type === 'video' && (
              <div className="asset-meta-grid" style={{ marginBottom: 12 }}>
                <div className="meta-card">
                  <div className="meta-card-label">Loop</div>
                  <label><input type="checkbox" checked={videoLoop} onChange={(e) => setVideoLoop(e.target.checked)} /> On</label>
                </div>
                <div className="meta-card">
                  <div className="meta-card-label">Muted</div>
                  <label><input type="checkbox" checked={videoMuted} onChange={(e) => setVideoMuted(e.target.checked)} /> On</label>
                </div>
                <div className="meta-card">
                  <div className="meta-card-label">Speed</div>
                  <select value={videoPlaybackRate} onChange={(e) => setVideoPlaybackRate(Number(e.target.value))}>
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1.0x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                  </select>
                </div>
              </div>
            )}

            <div className="asset-identity">
              <div className="asset-identity-label">Asset Identity</div>
              <div className="asset-identity-name">{selectedAsset.name}</div>
            </div>

            <div className="asset-tags">
              <span className="chip">{selectedAsset.type === 'image' ? 'Image' : 'Video'}</span>
              <span className="chip">Local</span>
              <span className="chip">+ Tag</span>
            </div>

            <div className="asset-meta-grid">
              <div className="meta-card">
                <div className="meta-card-label">Type</div>
                <div className="meta-card-value">{selectedAsset.type === 'image' ? 'JPEG Image' : 'Video File'}</div>
              </div>
              <div className="meta-card">
                <div className="meta-card-label">Resolution</div>
                <div className="meta-card-value">—</div>
              </div>
              <div className="meta-card">
                <div className="meta-card-label">Created</div>
                <div className="meta-card-value">—</div>
              </div>
              <div className="meta-card">
                <div className="meta-card-label">Size</div>
                <div className="meta-card-value">—</div>
              </div>
            </div>

            <div className="inspector-actions">
              <button className="soft-button full" onClick={handleSendToPreview}>
                👁 Send to Preview
              </button>
              <button className="send-projector-btn" onClick={handleSendToLive}>
                ▶ Send to Live
              </button>
              <button className="ghost-button" onClick={handleUseAsBackground}>
                🖼 Set as Background
              </button>
              <button className="ghost-button" onClick={handleAddToSchedule}>
                📋 Add to Schedule
              </button>
              <button className="ghost-button" onClick={() => handleDelete(selectedAsset)}>
                🗑 Delete Asset
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📸</div>
            Select an asset to see details
          </div>
        )}
      </aside>
    </div>
  )
}
