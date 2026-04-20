"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaLibrary = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const store_1 = require("../store");
const MediaLibrary = ({ mediaType: _initialType, onMediaSelect, onSendToPreview, onSendToLive }) => {
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
    (0, react_1.useEffect)(() => {
        loadMediaAssets();
        loadFolders();
    }, [activeFilter, currentFolderId]);
    const loadMediaAssets = async () => {
        try {
            let sql = 'SELECT * FROM media_assets';
            const params = [];
            const conditions = [];
            if (activeFilter === 'image') {
                conditions.push('type = ?');
                params.push('image');
            }
            else if (activeFilter === 'video') {
                conditions.push('type = ?');
                params.push('video');
            }
            if (currentFolderId !== null) {
                conditions.push('folder_id = ?');
                params.push(currentFolderId);
            }
            if (conditions.length > 0) {
                sql += ' WHERE ' + conditions.join(' AND ');
            }
            sql += ' ORDER BY id DESC';
            const results = await window.worship.db.run(sql, params);
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
            const results = await window.worship.db.run('SELECT * FROM media_folders ORDER BY name');
            setFolders(results || []);
        }
        catch {
            setFolders([]);
        }
    };
    const handleImport = async () => {
        setIsImporting(true);
        try {
            const type = activeFilter === 'video' ? 'video' : 'image';
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
                    await window.worship.db.run('INSERT INTO media_assets (path, type, name, duration, folder_id) VALUES (?, ?, ?, ?, ?)', [filePath, type, fileName, type === 'video' ? 0 : null, currentFolderId]);
                }
                await loadMediaAssets();
            }
        }
        catch (error) {
            console.error('Failed to import media:', error);
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
            await window.worship.db.run('INSERT INTO media_folders (name, parent_id) VALUES (?, ?)', [name, currentFolderId]);
            await loadFolders();
        }
        catch (error) {
            console.error('Failed to create folder:', error);
        }
    };
    const handleDelete = async (asset) => {
        try {
            await window.worship.db.run('DELETE FROM media_assets WHERE id = ?', [asset.id]);
            await loadMediaAssets();
            if (selectedAsset?.id === asset.id) {
                setSelectedAsset(null);
            }
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
    };
    const handleSendToLive = () => {
        if (!selectedAsset)
            return;
        onSendToLive?.(selectedAsset);
        setTheme({ ...theme, backgroundImage: selectedAsset.path });
        setLiveSlide(selectedAsset.name || 'Media');
        const OUTPUT_IDS = [1, 2];
        OUTPUT_IDS.forEach((id) => window?.worship?.outputs?.setState?.(id, { slideTitle: selectedAsset.name || 'Media', theme: { ...theme, backgroundImage: selectedAsset.path } }));
    };
    const handleSendToPreview = () => {
        if (!selectedAsset)
            return;
        onSendToPreview?.(selectedAsset);
        setTheme({ ...theme, backgroundImage: selectedAsset.path });
        setCurrentSlide(selectedAsset.name || 'Media');
    };
    const handleAddToSchedule = async () => {
        if (!selectedAsset)
            return;
        try {
            await window.worship.db.run('INSERT INTO schedule_items (schedule_id, item_type, content, order_num) VALUES (?, ?, ?, (SELECT COALESCE(MAX(order_num), 0) + 1 FROM schedule_items))', [1, selectedAsset.type === 'image' ? 'image' : 'video', selectedAsset.path]);
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
        { key: 'all', label: 'All Media', icon: '📁' },
        { key: 'image', label: 'Images', icon: '🖼' },
        { key: 'video', label: 'Videos', icon: '🎬' },
        { key: 'background', label: 'Backgrounds', icon: '🌄' },
        { key: 'loop', label: 'Loops', icon: '🔄' },
    ];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "workspace-grid workspace-media", children: [(0, jsx_runtime_1.jsxs)("aside", { className: "panel media-filters-panel", children: [(0, jsx_runtime_1.jsx)("div", { className: "media-section-label", children: "Media Assets" }), (0, jsx_runtime_1.jsx)("div", { className: "media-type-list", children: FILTER_ITEMS.map(item => ((0, jsx_runtime_1.jsxs)("button", { className: `media-type-item ${activeFilter === item.key ? 'active' : ''}`, onClick: () => { setActiveFilter(item.key); setCurrentFolderId(null); }, children: [(0, jsx_runtime_1.jsx)("span", { className: "icon", children: item.icon }), item.label] }, item.key))) }), (0, jsx_runtime_1.jsxs)("div", { className: "media-section-label", children: ["Folders", (0, jsx_runtime_1.jsx)("button", { onClick: handleCreateFolder, title: "New Folder", children: "+" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "folder-tree", children: [currentFolderId !== null && ((0, jsx_runtime_1.jsxs)("button", { className: "folder-item", onClick: () => setCurrentFolderId(null), children: [(0, jsx_runtime_1.jsx)("span", { className: "folder-icon", children: "\u2B05" }), "Back to Root"] })), currentFolders.map(folder => ((0, jsx_runtime_1.jsxs)("button", { className: `folder-item ${currentFolderId === folder.id ? 'active' : ''}`, onClick: () => setCurrentFolderId(folder.id), children: [(0, jsx_runtime_1.jsx)("span", { className: "folder-icon", children: "\uD83D\uDCC1" }), folder.name] }, folder.id)))] }), (0, jsx_runtime_1.jsxs)("div", { className: "media-panel-actions", children: [(0, jsx_runtime_1.jsx)("button", { className: "live-button full", onClick: handleImport, disabled: isImporting, children: isImporting ? '⏳ Importing...' : '📤 Import Media' }), (0, jsx_runtime_1.jsx)("button", { className: "ghost-button", onClick: handleCreateFolder, children: "\uD83D\uDCC1 New Folder" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "media-bottom-links", children: [(0, jsx_runtime_1.jsx)("button", { className: "media-bottom-link", children: "\uD83D\uDDD1 Trash" }), (0, jsx_runtime_1.jsx)("button", { className: "media-bottom-link", children: "\uD83D\uDCE6 Archive" })] })] }), (0, jsx_runtime_1.jsxs)("section", { className: "panel media-content-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "media-main-toolbar", children: [(0, jsx_runtime_1.jsx)("input", { className: "search-input", placeholder: "Search assets...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) }), (0, jsx_runtime_1.jsxs)("div", { className: "view-toggle-group", children: [(0, jsx_runtime_1.jsx)("button", { className: `view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`, onClick: () => setViewMode('grid'), children: "\u229E" }), (0, jsx_runtime_1.jsx)("button", { className: `view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`, onClick: () => setViewMode('list'), children: "\u2630" })] }), (0, jsx_runtime_1.jsxs)("select", { className: "sort-select", value: sortMode, onChange: (e) => setSortMode(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "recent", children: "Sort: Recent" }), (0, jsx_runtime_1.jsx)("option", { value: "name", children: "Sort: Name" })] })] }), viewMode === 'grid' ? ((0, jsx_runtime_1.jsxs)("div", { className: "media-content-grid", children: [currentFolders.map(folder => ((0, jsx_runtime_1.jsxs)("div", { className: "folder-card", onClick: () => setCurrentFolderId(folder.id), children: [(0, jsx_runtime_1.jsx)("span", { className: "folder-icon-lg", children: "\uD83D\uDCC1" }), (0, jsx_runtime_1.jsx)("span", { className: "folder-name", children: folder.name })] }, `f-${folder.id}`))), filteredAssets.map(asset => ((0, jsx_runtime_1.jsxs)("div", { className: `asset-card ${selectedAsset?.id === asset.id ? 'selected' : ''}`, onClick: () => handleSelect(asset), onDoubleClick: () => handleSendToPreview(), children: [(0, jsx_runtime_1.jsx)("div", { className: "asset-card-thumb", children: asset.type === 'image' ? ((0, jsx_runtime_1.jsx)("img", { src: `file://${asset.path}`, alt: asset.name, onError: (e) => { e.currentTarget.style.display = 'none'; } })) : ((0, jsx_runtime_1.jsx)("span", { className: "video-icon", children: "\uD83C\uDFAC" })) }), (0, jsx_runtime_1.jsxs)("div", { className: "asset-card-name", children: [(0, jsx_runtime_1.jsx)("span", { className: "type-icon", children: asset.type === 'image' ? '🖼' : '▶' }), (asset.name || '').length > 20 ? (asset.name || '').slice(0, 18) + '...' : asset.name] })] }, asset.id))), filteredAssets.length === 0 && currentFolders.length === 0 && ((0, jsx_runtime_1.jsxs)("div", { style: { gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '2.5rem', marginBottom: 10, opacity: 0.5 }, children: activeFilter === 'video' ? '🎬' : '🖼️' }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.85rem', marginBottom: 4 }, children: "No assets yet" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.72rem' }, children: "Click \"Import Media\" to add files" })] }))] })) : ((0, jsx_runtime_1.jsx)("div", { className: "media-content-list", children: filteredAssets.map(asset => ((0, jsx_runtime_1.jsxs)("div", { className: `media-list-item ${selectedAsset?.id === asset.id ? 'selected' : ''}`, onClick: () => handleSelect(asset), children: [(0, jsx_runtime_1.jsx)("div", { className: "media-list-thumb", children: asset.type === 'image' ? ((0, jsx_runtime_1.jsx)("img", { src: `file://${asset.path}`, alt: asset.name, onError: (e) => { e.currentTarget.style.display = 'none'; } })) : ((0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1rem' }, children: "\uD83C\uDFAC" })) }), (0, jsx_runtime_1.jsxs)("div", { className: "media-list-info", children: [(0, jsx_runtime_1.jsx)("div", { className: "media-list-name", children: asset.name }), (0, jsx_runtime_1.jsxs)("div", { className: "media-list-meta", children: [asset.type, " \u2022 ", asset.path.split('\\').pop()?.split('.').pop()?.toUpperCase()] })] })] }, asset.id))) })), (0, jsx_runtime_1.jsxs)("div", { className: "status-bar", children: [(0, jsx_runtime_1.jsx)("span", { className: "status-dot" }), "System Live", (0, jsx_runtime_1.jsx)("span", { style: { opacity: 0.6 }, children: "|" }), filteredAssets.length, " assets"] })] }), (0, jsx_runtime_1.jsxs)("aside", { className: "panel media-inspector", children: [(0, jsx_runtime_1.jsx)("div", { className: "inspector-header", children: (0, jsx_runtime_1.jsx)("h3", { className: "inspector-title", children: "Inspector" }) }), selectedAsset ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "asset-preview", children: selectedAsset.type === 'image' ? ((0, jsx_runtime_1.jsx)("img", { src: `file://${selectedAsset.path}`, alt: selectedAsset.name, onError: (e) => { e.currentTarget.style.display = 'none'; } })) : ((0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2.5rem', opacity: 0.5 }, children: "\uD83C\uDFAC" })) }), (0, jsx_runtime_1.jsxs)("div", { className: "asset-identity", children: [(0, jsx_runtime_1.jsx)("div", { className: "asset-identity-label", children: "Asset Identity" }), (0, jsx_runtime_1.jsx)("div", { className: "asset-identity-name", children: selectedAsset.name })] }), (0, jsx_runtime_1.jsxs)("div", { className: "asset-tags", children: [(0, jsx_runtime_1.jsx)("span", { className: "chip", children: selectedAsset.type === 'image' ? 'Image' : 'Video' }), (0, jsx_runtime_1.jsx)("span", { className: "chip", children: "Local" }), (0, jsx_runtime_1.jsx)("span", { className: "chip", children: "+ Tag" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "asset-meta-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Type" }), (0, jsx_runtime_1.jsx)("div", { className: "meta-card-value", children: selectedAsset.type === 'image' ? 'JPEG Image' : 'Video File' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Resolution" }), (0, jsx_runtime_1.jsx)("div", { className: "meta-card-value", children: "\u2014" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Created" }), (0, jsx_runtime_1.jsx)("div", { className: "meta-card-value", children: "\u2014" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "meta-card", children: [(0, jsx_runtime_1.jsx)("div", { className: "meta-card-label", children: "Size" }), (0, jsx_runtime_1.jsx)("div", { className: "meta-card-value", children: "\u2014" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "inspector-actions", children: [(0, jsx_runtime_1.jsx)("button", { className: "soft-button full", onClick: handleSendToPreview, children: "\uD83D\uDC41 Send to Preview" }), (0, jsx_runtime_1.jsx)("button", { className: "send-projector-btn", onClick: handleSendToLive, children: "\u25B6 Send to Live" }), (0, jsx_runtime_1.jsx)("button", { className: "ghost-button", onClick: handleAddToSchedule, children: "\uD83D\uDCCB Add to Schedule" }), (0, jsx_runtime_1.jsx)("button", { className: "ghost-button", onClick: () => handleDelete(selectedAsset), children: "\u270F\uFE0F Edit Metadata" })] })] })) : ((0, jsx_runtime_1.jsxs)("div", { style: { padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '2rem', marginBottom: 8 }, children: "\uD83D\uDCF8" }), "Select an asset to see details"] }))] })] }));
};
exports.MediaLibrary = MediaLibrary;
