"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaLibrary = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const MediaLibrary = ({ mediaType, onMediaSelect }) => {
    const [mediaAssets, setMediaAssets] = (0, react_1.useState)([]);
    const [selectedAsset, setSelectedAsset] = (0, react_1.useState)(null);
    const [isImporting, setIsImporting] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        loadMediaAssets();
    }, [mediaType]);
    const loadMediaAssets = async () => {
        try {
            const results = await window.worship.db.run('SELECT * FROM media_assets WHERE type = ? ORDER BY id DESC', [mediaType]);
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
    const handleImport = async () => {
        setIsImporting(true);
        try {
            const extensions = mediaType === 'image'
                ? ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
                : ['mp4', 'mov', 'mkv', 'webm', 'avi'];
            const title = mediaType === 'image' ? 'Import Images' : 'Import Videos';
            const filePaths = await window.worship.dialog.openFiles({
                title,
                filters: [{ name: title, extensions }],
                multiSelections: true
            });
            if (filePaths.length > 0) {
                for (const filePath of filePaths) {
                    const fileName = filePath.split('\\').pop() || filePath.split('/').pop() || '';
                    await window.worship.db.run('INSERT INTO media_assets (path, type, name, duration) VALUES (?, ?, ?, ?)', [filePath, mediaType, fileName, mediaType === 'video' ? 0 : null]);
                }
                await loadMediaAssets();
            }
        }
        catch (error) {
            console.error('Failed to import media:', error);
            alert('Failed to import media files');
        }
        finally {
            setIsImporting(false);
        }
    };
    const handleDelete = async (asset) => {
        if (!confirm(`Delete ${asset.name || 'this asset'}?`))
            return;
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
    const handleUseAsBackground = async () => {
        if (!selectedAsset)
            return;
        try {
            // Update theme with selected media
            const currentTheme = await window.worship.db.run('SELECT * FROM themes LIMIT 1');
            if (currentTheme && currentTheme.length > 0) {
                await window.worship.db.run('UPDATE themes SET backgroundImage = ? WHERE id = ?', [selectedAsset.path, currentTheme[0].id]);
                alert('Background updated!');
            }
        }
        catch (error) {
            console.error('Failed to update background:', error);
        }
    };
    const handleAddToSchedule = async () => {
        if (!selectedAsset)
            return;
        try {
            await window.worship.db.run('INSERT INTO schedule_items (schedule_id, item_type, content, order_num) VALUES (?, ?, ?, (SELECT COALESCE(MAX(order_num), 0) + 1 FROM schedule_items))', [1, mediaType === 'image' ? 'image' : 'video', selectedAsset.path]);
            alert('Added to schedule!');
        }
        catch (error) {
            console.error('Failed to add to schedule:', error);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col h-full", children: [(0, jsx_runtime_1.jsx)("div", { className: "p-3 border-b border-slate-700 bg-slate-800/50", children: (0, jsx_runtime_1.jsxs)("button", { onClick: handleImport, disabled: isImporting, className: "w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { children: isImporting ? '⏳' : '📁' }), isImporting ? 'Importing...' : `Import ${mediaType === 'image' ? 'Images' : 'Videos'}`] }) }), (0, jsx_runtime_1.jsx)("div", { className: "p-3 border-b border-slate-700", children: (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: `Search ${mediaType}s...`, className: "w-full bg-slate-700 text-slate-200 text-sm rounded px-3 py-1.5 border border-slate-600" }) }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 overflow-y-auto p-3", children: mediaAssets.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "text-center py-12", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-4xl mb-3 opacity-50", children: mediaType === 'image' ? '🖼️' : '🎬' }), (0, jsx_runtime_1.jsxs)("div", { className: "text-slate-400 text-sm mb-2", children: ["No ", mediaType, "s yet"] }), (0, jsx_runtime_1.jsx)("div", { className: "text-slate-500 text-xs", children: "Click \"Import\" to add files" })] })) : ((0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 gap-2", children: mediaAssets.map((asset) => ((0, jsx_runtime_1.jsxs)("div", { onClick: () => handleSelect(asset), onDoubleClick: () => handleUseAsBackground(), className: `relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedAsset?.id === asset.id
                            ? 'border-blue-500 shadow-lg'
                            : 'border-slate-700 hover:border-slate-600'}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "aspect-video bg-slate-800 flex items-center justify-center overflow-hidden", children: mediaType === 'image' ? ((0, jsx_runtime_1.jsx)("img", { src: `file://${asset.path}`, alt: asset.name, className: "w-full h-full object-cover", onError: (e) => {
                                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="56"%3E%3Crect fill="%23334155" width="100" height="56"/%3E%3Ctext x="50" y="28" text-anchor="middle" fill="%2394a3b8" font-size="10"%3EImage%3C/text%3E%3C/svg%3E';
                                    } })) : ((0, jsx_runtime_1.jsxs)("div", { className: "relative w-full h-full flex items-center justify-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl", children: "\uD83C\uDFAC" }), asset.duration && asset.duration > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded", children: [Math.floor(asset.duration / 60), ":", String(Math.floor(asset.duration % 60)).padStart(2, '0')] }))] })) }), (0, jsx_runtime_1.jsx)("div", { className: "p-2 bg-slate-800/90", children: (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-slate-300 truncate", children: asset.name }) }), (0, jsx_runtime_1.jsxs)("div", { className: "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: (e) => {
                                            e.stopPropagation();
                                            handleUseAsBackground();
                                        }, className: "px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700", title: "Use as background", children: "BG" }), (0, jsx_runtime_1.jsx)("button", { onClick: (e) => {
                                            e.stopPropagation();
                                            handleDelete(asset);
                                        }, className: "px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700", title: "Delete", children: "\uD83D\uDDD1\uFE0F" })] }), selectedAsset?.id === asset.id && ((0, jsx_runtime_1.jsx)("div", { className: "absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded", children: "\u2713" }))] }, asset.id))) })) }), selectedAsset && ((0, jsx_runtime_1.jsxs)("div", { className: "p-3 border-t border-slate-700 bg-slate-800/50 space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-xs text-slate-400 mb-2", children: ["Selected: ", selectedAsset.name || 'Untitled'] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: handleUseAsBackground, className: "flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors", children: "Set as Background" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleAddToSchedule, className: "flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors", children: "Add to Schedule" })] })] }))] }));
};
exports.MediaLibrary = MediaLibrary;
