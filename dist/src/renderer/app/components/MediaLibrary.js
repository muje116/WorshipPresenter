"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaLibrary = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const store_1 = require("../store");
const db_1 = require("../services/db");
const ui_1 = require("./ui");
const MediaLibrary = ({ mediaType: _initialType, onMediaSelect, onSendToPreview, onSendToLive, onMediaAssetsChanged, onNotify }) => {
    const setCurrentSlide = (0, store_1.useStore)((state) => state.setCurrentSlide);
    const setLiveSlide = (0, store_1.useStore)((state) => state.setLiveSlide);
    const setTheme = (0, store_1.useStore)((state) => state.setTheme);
    const theme = (0, store_1.useStore)((state) => state.theme);
    const [mediaAssets, setMediaAssets] = (0, react_1.useState)([]);
    const [folders, setFolders] = (0, react_1.useState)([]);
    const [selectedAsset, setSelectedAsset] = (0, react_1.useState)(null);
    const [isImporting, setIsImporting] = (0, react_1.useState)(false);
    const [activeFilter, setActiveFilter] = (0, react_1.useState)('all');
    const [currentFolderId, setCurrentFolderId] = (0, react_1.useState)(null);
    const [viewMode, setViewMode] = (0, react_1.useState)('grid');
    const [sortMode, setSortMode] = (0, react_1.useState)('recent');
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [videoLoop, setVideoLoop] = (0, react_1.useState)(true);
    const [videoMuted, setVideoMuted] = (0, react_1.useState)(true);
    const [videoPlaybackRate, setVideoPlaybackRate] = (0, react_1.useState)(1);
    (0, react_1.useEffect)(() => {
        loadMediaAssets();
        loadFolders();
    }, [activeFilter, currentFolderId]);
    const loadMediaAssets = async () => {
        try {
            const typeFilter = activeFilter === 'all'
                ? undefined
                : activeFilter === 'image' || activeFilter === 'background'
                    ? 'image'
                    : 'video';
            const results = await db_1.dbService.media.getAssets(currentFolderId, typeFilter);
            const normalized = (results || []).map((asset) => ({
                ...asset,
                name: asset.name || asset.path?.split('\\').pop() || asset.path?.split('/').pop() || 'Untitled'
            }));
            setMediaAssets(normalized);
        }
        catch (error) {
            console.error('Failed to load media assets:', error);
            setMediaAssets([]);
        }
    };
    const loadFolders = async () => {
        try {
            const results = await db_1.dbService.media.getFolders();
            setFolders(results || []);
        }
        catch {
            setFolders([]);
        }
    };
    const handleImport = async () => {
        setIsImporting(true);
        try {
            const type = activeFilter === 'video' || activeFilter === 'loop' ? 'video' : 'image';
            const extensions = type === 'image'
                ? ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
                : ['mp4', 'mov', 'mkv', 'webm', 'avi'];
            const title = type === 'image' ? 'Import Images' : 'Import Videos';
            const filePaths = await window.worship.dialog.openFiles({
                title,
                filters: [{ name: title, extensions }],
                multiSelections: true
            });
            if (filePaths.length > 0) {
                for (const filePath of filePaths) {
                    const fileName = filePath.split('\\').pop() || filePath.split('/').pop() || '';
                    await db_1.dbService.media.createAsset(filePath, type, fileName, type === 'video' ? 0 : null, currentFolderId);
                }
                await loadMediaAssets();
                await onMediaAssetsChanged?.();
                onNotify?.('Media imported', `${filePaths.length} item(s) added`, 'success');
            }
        }
        catch (error) {
            console.error('Failed to import media:', error);
            onNotify?.('Import failed', 'Could not import selected files', 'warn');
        }
        finally {
            setIsImporting(false);
        }
    };
    const handleCreateFolder = async () => {
        const name = prompt('Folder name:');
        if (!name)
            return;
        try {
            await db_1.dbService.media.createFolder(name, currentFolderId);
            await loadFolders();
            onNotify?.('Folder created', name, 'success');
        }
        catch (error) {
            console.error('Failed to create folder:', error);
        }
    };
    const handleDelete = async (asset) => {
        try {
            await db_1.dbService.media.deleteAsset(asset.id);
            await loadMediaAssets();
            await onMediaAssetsChanged?.();
            if (selectedAsset?.id === asset.id) {
                setSelectedAsset(null);
            }
            onNotify?.('Asset deleted', asset.name || 'Media asset removed', 'warn');
        }
        catch (error) {
            console.error('Failed to delete media:', error);
        }
    };
    const handleSelect = (asset) => {
        setSelectedAsset(asset);
        onMediaSelect(asset);
    };
    const handleUseAsBackground = () => {
        if (!selectedAsset)
            return;
        setTheme({ ...theme, backgroundImage: selectedAsset.path });
        onNotify?.('Background updated', selectedAsset.name || 'Media background applied', 'success');
    };
    const handleSendToLive = () => {
        if (!selectedAsset)
            return;
        onSendToLive?.(selectedAsset, { loop: videoLoop, muted: videoMuted, playbackRate: videoPlaybackRate });
        setTheme({ ...theme, backgroundImage: selectedAsset.path });
        setLiveSlide('');
        onNotify?.('Sent live', selectedAsset.name || 'Media pushed to outputs', 'success');
    };
    const handleSendToPreview = () => {
        if (!selectedAsset)
            return;
        onSendToPreview?.(selectedAsset);
        setTheme({ ...theme, backgroundImage: selectedAsset.path });
        setCurrentSlide('');
        onNotify?.('Sent to preview', selectedAsset.name || 'Preview updated', 'info');
    };
    const handleAddToSchedule = async () => {
        if (!selectedAsset)
            return;
        try {
            await db_1.dbService.schedule.addItem(selectedAsset.type === 'image' ? 'image' : 'video', selectedAsset.path);
            // Note: in a real application, we might also want to update the store's schedule state
            // Let's reload the store schedule items to keep UI in sync
            const nextItems = await db_1.dbService.schedule.getItems();
            store_1.useStore.setState({ schedule: nextItems });
            onNotify?.('Added to schedule', selectedAsset.name || 'Media queued', 'success');
        }
        catch (error) {
            console.error('Failed to add to schedule:', error);
        }
    };
    const filteredAssets = mediaAssets
        .filter(a => !searchQuery || (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => sortMode === 'name' ? (a.name || '').localeCompare(b.name || '') : b.id - a.id);
    const currentFolders = folders.filter(f => f.parent_id === currentFolderId);
    const FILTER_ITEMS = [
        { key: 'all', label: 'All Media', icon: 'media' },
        { key: 'image', label: 'Images', icon: 'media' },
        { key: 'video', label: 'Videos', icon: 'play' },
        { key: 'background', label: 'Backgrounds', icon: 'palette' },
        { key: 'loop', label: 'Loops', icon: 'sync' },
    ];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "workspace-grid workspace-media", children: [(0, jsx_runtime_1.jsxs)("aside", { className: "panel media-filters-panel", children: [(0, jsx_runtime_1.jsx)("div", { className: "media-section-label", children: "Media Assets" }), (0, jsx_runtime_1.jsx)("div", { className: "media-type-list", children: FILTER_ITEMS.map(item => ((0, jsx_runtime_1.jsxs)("button", { className: `media-type-item ${activeFilter === item.key ? 'active' : ''}`, onClick: () => { setActiveFilter(item.key); setCurrentFolderId(null); }, children: [(0, jsx_runtime_1.jsx)("span", { className: "icon", children: (0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: item.icon, size: 15 }) }), item.label] }, item.key))) }), (0, jsx_runtime_1.jsxs)("div", { className: "media-section-label", children: ["Folders", (0, jsx_runtime_1.jsx)("button", { onClick: handleCreateFolder, title: "New Folder", children: "+" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "folder-tree", children: [currentFolderId !== null && ((0, jsx_runtime_1.jsxs)("button", { className: "folder-item", onClick: () => setCurrentFolderId(null), children: [(0, jsx_runtime_1.jsx)("span", { className: "folder-icon", children: (0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "chevron", size: 14, className: "back-chevron" }) }), "Back to Root"] })), currentFolders.map(folder => ((0, jsx_runtime_1.jsxs)("button", { className: `folder-item ${currentFolderId === folder.id ? 'active' : ''}`, onClick: () => setCurrentFolderId(folder.id), children: [(0, jsx_runtime_1.jsx)("span", { className: "folder-icon", children: (0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "folder", size: 14 }) }), folder.name] }, folder.id)))] }), (0, jsx_runtime_1.jsxs)("div", { className: "media-panel-actions", children: [(0, jsx_runtime_1.jsxs)("button", { className: "live-button full", onClick: handleImport, disabled: isImporting, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "upload", size: 14 }), " ", isImporting ? 'Importing...' : 'Import Media'] }), (0, jsx_runtime_1.jsxs)("button", { className: "ghost-button", onClick: handleCreateFolder, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "folder", size: 14 }), " New Folder"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "media-bottom-links", children: [(0, jsx_runtime_1.jsxs)("button", { className: "media-bottom-link", children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "trash", size: 14 }), " Trash"] }), (0, jsx_runtime_1.jsxs)("button", { className: "media-bottom-link", children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "folder", size: 14 }), " Archive"] })] })] }), (0, jsx_runtime_1.jsxs)("section", { className: "panel media-content-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "media-main-toolbar", children: [(0, jsx_runtime_1.jsx)("input", { className: "search-input", placeholder: "Search assets...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) }), (0, jsx_runtime_1.jsxs)("div", { className: "view-toggle-group", children: [(0, jsx_runtime_1.jsx)("button", { className: `view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`, onClick: () => setViewMode('grid'), children: "\u229E" }), (0, jsx_runtime_1.jsx)("button", { className: `view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`, onClick: () => setViewMode('list'), children: "\u2630" })] }), (0, jsx_runtime_1.jsxs)("select", { className: "sort-select", value: sortMode, onChange: (e) => setSortMode(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "recent", children: "Sort: Recent" }), (0, jsx_runtime_1.jsx)("option", { value: "name", children: "Sort: Name" })] })] }), viewMode === 'grid' ? ((0, jsx_runtime_1.jsxs)("div", { className: "media-content-grid", children: [currentFolders.map(folder => ((0, jsx_runtime_1.jsxs)("div", { className: "folder-card", onClick: () => setCurrentFolderId(folder.id), children: [(0, jsx_runtime_1.jsx)("span", { className: "folder-icon-lg", children: (0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "folder", size: 25 }) }), (0, jsx_runtime_1.jsx)("span", { className: "folder-name", children: folder.name })] }, `f-${folder.id}`))), filteredAssets.map(asset => ((0, jsx_runtime_1.jsxs)("div", { className: `asset-card ${selectedAsset?.id === asset.id ? 'selected' : ''}`, onClick: () => handleSelect(asset), onDoubleClick: () => handleSendToPreview(), children: [(0, jsx_runtime_1.jsx)("div", { className: "asset-card-thumb", children: asset.type === 'image' ? ((0, jsx_runtime_1.jsx)("img", { src: `file://${asset.path}`, alt: asset.name, onError: (e) => { e.currentTarget.style.display = 'none'; } })) : ((0, jsx_runtime_1.jsx)("span", { className: "video-icon", children: (0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "play", size: 22 }) })) }), (0, jsx_runtime_1.jsxs)("div", { className: "asset-card-name", children: [(0, jsx_runtime_1.jsx)("span", { className: "type-icon", children: (0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: asset.type === 'image' ? 'media' : 'play', size: 13 }) }), (asset.name || '').length > 20 ? (asset.name || '').slice(0, 18) + '...' : asset.name] })] }, asset.id))), filteredAssets.length === 0 && currentFolders.length === 0 && ((0, jsx_runtime_1.jsxs)("div", { style: { gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '2.5rem', marginBottom: 10, opacity: 0.5 }, children: (0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: activeFilter === 'video' ? 'play' : 'media', size: 30 }) }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.85rem', marginBottom: 4 }, children: "No assets yet" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.72rem' }, children: "Click \"Import Media\" to add files" })] }))] })) : ((0, jsx_runtime_1.jsx)("div", { className: "media-content-list", children: filteredAssets.map(asset => ((0, jsx_runtime_1.jsxs)("div", { className: `media-list-item ${selectedAsset?.id === asset.id ? 'selected' : ''}`, onClick: () => handleSelect(asset), children: [(0, jsx_runtime_1.jsx)("div", { className: "media-list-thumb", children: asset.type === 'image' ? ((0, jsx_runtime_1.jsx)("img", { src: `file://${asset.path}`, alt: asset.name, onError: (e) => { e.currentTarget.style.display = 'none'; } })) : ((0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1rem' }, children: (0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "play", size: 18 }) })) }), (0, jsx_runtime_1.jsxs)("div", { className: "media-list-info", children: [(0, jsx_runtime_1.jsx)("div", { className: "media-list-name", children: asset.name }), (0, jsx_runtime_1.jsxs)("div", { className: "media-list-meta", children: [asset.type, " \u2022 ", asset.path.split('\\').pop()?.split('.').pop()?.toUpperCase()] })] })] }, asset.id))) })), (0, jsx_runtime_1.jsxs)("div", { className: "status-bar", children: [(0, jsx_runtime_1.jsx)("span", { className: "status-dot" }), "System Live", (0, jsx_runtime_1.jsx)("span", { style: { opacity: 0.6 }, children: "|" }), filteredAssets.length, " assets"] })] }), (0, jsx_runtime_1.jsxs)("aside", { className: "panel media-inspector", children: [(0, jsx_runtime_1.jsx)("div", { className: "inspector-header", children: (0, jsx_runtime_1.jsx)("h3", { className: "inspector-title", children: "Inspector" }) }), selectedAsset ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "asset-preview", children: selectedAsset.type === 'image' ? ((0, jsx_runtime_1.jsx)("img", { src: `file://${selectedAsset.path}`, alt: selectedAsset.name, onError: (e) => { e.currentTarget.style.display = 'none'; } })) : ((0, jsx_runtime_1.jsx)("video", { src: `file://${selectedAsset.path}`, autoPlay: true, loop: videoLoop, muted: videoMuted, playsInline: true, style: { width: '100%', height: '100%', objectFit: 'cover' } })) }), selectedAsset.type === 'video' && ((0, jsx_runtime_1.jsxs)("div", { className: "asset-meta-grid", style: { marginBottom: 12 }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Loop" }), (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: videoLoop, onChange: (e) => setVideoLoop(e.target.checked) }), " On"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Muted" }), (0, jsx_runtime_1.jsxs)("label", { children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: videoMuted, onChange: (e) => setVideoMuted(e.target.checked) }), " On"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Speed" }), (0, jsx_runtime_1.jsxs)("select", { value: videoPlaybackRate, onChange: (e) => setVideoPlaybackRate(Number(e.target.value)), children: [(0, jsx_runtime_1.jsx)("option", { value: 0.5, children: "0.5x" }), (0, jsx_runtime_1.jsx)("option", { value: 0.75, children: "0.75x" }), (0, jsx_runtime_1.jsx)("option", { value: 1, children: "1.0x" }), (0, jsx_runtime_1.jsx)("option", { value: 1.25, children: "1.25x" }), (0, jsx_runtime_1.jsx)("option", { value: 1.5, children: "1.5x" })] })] })] })), (0, jsx_runtime_1.jsxs)("div", { className: "asset-identity", children: [(0, jsx_runtime_1.jsx)("div", { className: "asset-identity-label", children: "Asset Identity" }), (0, jsx_runtime_1.jsx)("div", { className: "asset-identity-name", children: selectedAsset.name })] }), (0, jsx_runtime_1.jsxs)("div", { className: "asset-tags", children: [(0, jsx_runtime_1.jsx)("span", { className: "chip", children: selectedAsset.type === 'image' ? 'Image' : 'Video' }), (0, jsx_runtime_1.jsx)("span", { className: "chip", children: "Local" }), (0, jsx_runtime_1.jsx)("span", { className: "chip", children: "+ Tag" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "asset-meta-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Type" }), (0, jsx_runtime_1.jsx)("div", { className: "meta-card-value", children: selectedAsset.type === 'image' ? 'JPEG Image' : 'Video File' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Resolution" }), (0, jsx_runtime_1.jsx)("div", { className: "meta-card-value", children: "\u2014" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Created" }), (0, jsx_runtime_1.jsx)("div", { className: "meta-card-value", children: "\u2014" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Size" }), (0, jsx_runtime_1.jsx)("div", { className: "meta-card-value", children: "\u2014" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "inspector-actions", children: [(0, jsx_runtime_1.jsxs)("button", { className: "soft-button full", onClick: handleSendToPreview, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "eye", size: 14 }), " Send to Preview"] }), (0, jsx_runtime_1.jsxs)("button", { className: "send-projector-btn", onClick: handleSendToLive, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "send", size: 14 }), " Send to Live"] }), (0, jsx_runtime_1.jsxs)("button", { className: "ghost-button", onClick: handleUseAsBackground, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "palette", size: 14 }), " Set as Background"] }), (0, jsx_runtime_1.jsxs)("button", { className: "ghost-button", onClick: handleAddToSchedule, children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "queue", size: 14 }), " Add to Schedule"] }), (0, jsx_runtime_1.jsxs)("button", { className: "ghost-button", onClick: () => handleDelete(selectedAsset), children: [(0, jsx_runtime_1.jsx)(ui_1.AppIcon, { name: "trash", size: 14 }), " Delete Asset"] })] })] })) : ((0, jsx_runtime_1.jsxs)("div", { style: { padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '2rem', marginBottom: 8 }, children: "\uD83D\uDCF8" }), "Select an asset to see details"] }))] })] }));
};
exports.MediaLibrary = MediaLibrary;
