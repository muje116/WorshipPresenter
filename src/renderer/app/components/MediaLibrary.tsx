import React, { useEffect, useState } from 'react'

declare const window: any

interface MediaAsset {
  id: number
  path: string
  type: 'image' | 'video'
  name?: string
  thumbnail?: string
  duration?: number
}

interface MediaLibraryProps {
  mediaType: 'image' | 'video'
  onMediaSelect: (asset: MediaAsset) => void
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ mediaType, onMediaSelect }) => {
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    loadMediaAssets()
  }, [mediaType])

  const loadMediaAssets = async () => {
    try {
      const results = await window.worship.db.run(
        'SELECT * FROM media_assets WHERE type = ? ORDER BY id DESC',
        [mediaType]
      )
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

  const handleImport = async () => {
    setIsImporting(true)
    try {
      const extensions = mediaType === 'image' 
        ? ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
        : ['mp4', 'mov', 'mkv', 'webm', 'avi']
      const title = mediaType === 'image' ? 'Import Images' : 'Import Videos'
      
      const filePaths: string[] = await window.worship.dialog.openFiles({
        title,
        filters: [{ name: title, extensions }],
        multiSelections: true
      })

      if (filePaths.length > 0) {
        for (const filePath of filePaths) {
          const fileName = filePath.split('\\').pop() || filePath.split('/').pop() || ''
          await window.worship.db.run(
            'INSERT INTO media_assets (path, type, name, duration) VALUES (?, ?, ?, ?)',
            [filePath, mediaType, fileName, mediaType === 'video' ? 0 : null]
          )
        }
        await loadMediaAssets()
      }
    } catch (error) {
      console.error('Failed to import media:', error)
      alert('Failed to import media files')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDelete = async (asset: MediaAsset) => {
    if (!confirm(`Delete ${asset.name || 'this asset'}?`)) return
    try {
      await window.worship.db.run('DELETE FROM media_assets WHERE id = ?', [asset.id])
      await loadMediaAssets()
      if (selectedAsset?.id === asset.id) {
        setSelectedAsset(null)
      }
    } catch (error) {
      console.error('Failed to delete media:', error)
    }
  }

  const handleSelect = (asset: MediaAsset) => {
    setSelectedAsset(asset)
    onMediaSelect(asset)
  }

  const handleUseAsBackground = async () => {
    if (!selectedAsset) return
    try {
      // Update theme with selected media
      const currentTheme = await window.worship.db.run('SELECT * FROM themes LIMIT 1')
      if (currentTheme && currentTheme.length > 0) {
        await window.worship.db.run(
          'UPDATE themes SET backgroundImage = ? WHERE id = ?',
          [selectedAsset.path, currentTheme[0].id]
        )
        alert('Background updated!')
      }
    } catch (error) {
      console.error('Failed to update background:', error)
    }
  }

  const handleAddToSchedule = async () => {
    if (!selectedAsset) return
    try {
      await window.worship.db.run(
        'INSERT INTO schedule_items (schedule_id, item_type, content, order_num) VALUES (?, ?, ?, (SELECT COALESCE(MAX(order_num), 0) + 1 FROM schedule_items))',
        [1, mediaType === 'image' ? 'image' : 'video', selectedAsset.path]
      )
      alert('Added to schedule!')
    } catch (error) {
      console.error('Failed to add to schedule:', error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with import button */}
      <div className="p-3 border-b border-slate-700 bg-slate-800/50">
        <button
          onClick={handleImport}
          disabled={isImporting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>{isImporting ? '⏳' : '📁'}</span>
          {isImporting ? 'Importing...' : `Import ${mediaType === 'image' ? 'Images' : 'Videos'}`}
        </button>
      </div>

      {/* Search/filter bar */}
      <div className="p-3 border-b border-slate-700">
        <input
          type="text"
          placeholder={`Search ${mediaType}s...`}
          className="w-full bg-slate-700 text-slate-200 text-sm rounded px-3 py-1.5 border border-slate-600"
        />
      </div>

      {/* Media grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {mediaAssets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3 opacity-50">
              {mediaType === 'image' ? '🖼️' : '🎬'}
            </div>
            <div className="text-slate-400 text-sm mb-2">No {mediaType}s yet</div>
            <div className="text-slate-500 text-xs">Click "Import" to add files</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {mediaAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => handleSelect(asset)}
                onDoubleClick={() => handleUseAsBackground()}
                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  selectedAsset?.id === asset.id
                    ? 'border-blue-500 shadow-lg'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* Thumbnail preview */}
                <div className="aspect-video bg-slate-800 flex items-center justify-center overflow-hidden">
                  {mediaType === 'image' ? (
                    <img
                      src={`file://${asset.path}`}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="56"%3E%3Crect fill="%23334155" width="100" height="56"/%3E%3Ctext x="50" y="28" text-anchor="middle" fill="%2394a3b8" font-size="10"%3EImage%3C/text%3E%3C/svg%3E'
                      }}
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="text-2xl">🎬</div>
                      {asset.duration && asset.duration > 0 && (
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                          {Math.floor(asset.duration / 60)}:{String(Math.floor(asset.duration % 60)).padStart(2, '0')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Asset name */}
                <div className="p-2 bg-slate-800/90">
                  <div className="text-xs text-slate-300 truncate">{asset.name}</div>
                </div>

                {/* Action buttons on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUseAsBackground()
                    }}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    title="Use as background"
                  >
                    BG
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(asset)
                    }}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>

                {/* Selected indicator */}
                {selectedAsset?.id === asset.id && (
                  <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected asset actions */}
      {selectedAsset && (
        <div className="p-3 border-t border-slate-700 bg-slate-800/50 space-y-2">
          <div className="text-xs text-slate-400 mb-2">Selected: {selectedAsset.name || 'Untitled'}</div>
          <div className="flex gap-2">
            <button
              onClick={handleUseAsBackground}
              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
            >
              Set as Background
            </button>
            <button
              onClick={handleAddToSchedule}
              className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
            >
              Add to Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
