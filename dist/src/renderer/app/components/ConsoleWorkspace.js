"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleWorkspace = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const ui_1 = require("./ui");
const OUTPUT_IDS = [1, 2];
const ConsoleWorkspace = ({ schedule, theme, currentSlide, liveSlide, paneSizes, outputStates, dragIndex, onDragStart, onDrop, onScheduleItemClick, onAddScheduleItem, onGoToEditor, }) => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "workspace-grid workspace-console", style: {
            gridTemplateColumns: `${paneSizes.consoleLeft}px minmax(0, 1fr)`,
        }, children: [(0, jsx_runtime_1.jsxs)(ui_1.Panel, { className: "schedule-panel", children: [(0, jsx_runtime_1.jsx)(ui_1.SectionHeader, { title: "Order of Service", meta: `${schedule.length} items` }), (0, jsx_runtime_1.jsx)("div", { className: "schedule-list", children: schedule.map((item, index) => ((0, jsx_runtime_1.jsxs)("div", { draggable: true, onDragStart: () => onDragStart(index), onDragOver: (event) => event.preventDefault(), onDrop: () => {
                                if (dragIndex != null && dragIndex !== index)
                                    onDrop(index);
                            }, onClick: () => onScheduleItemClick(item.content), className: `schedule-item ${index === 0 ? 'active' : ''}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "schedule-meta", children: [(0, jsx_runtime_1.jsx)("span", { children: String(index + 1).padStart(2, '0') }), (0, jsx_runtime_1.jsx)("span", { children: index === 0 ? 'CURRENT' : index === 1 ? 'NEXT' : 'UPCOMING' })] }), (0, jsx_runtime_1.jsx)("strong", { children: item.content }), (0, jsx_runtime_1.jsx)("small", { children: item.type })] }, item.id))) }), (0, jsx_runtime_1.jsx)("button", { className: "soft-button full", onClick: onAddScheduleItem, children: "Add Item" })] }), (0, jsx_runtime_1.jsxs)("section", { className: "console-stage", children: [(0, jsx_runtime_1.jsxs)("div", { className: "monitor-grid", children: [(0, jsx_runtime_1.jsxs)(ui_1.Panel, { className: "monitor", children: [(0, jsx_runtime_1.jsxs)("div", { className: "monitor-header", children: [(0, jsx_runtime_1.jsx)("span", { children: "Preview" }), (0, jsx_runtime_1.jsx)("button", { className: "text-button", onClick: onGoToEditor, children: "Edit" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "slide-frame", style: {
                                            backgroundColor: theme.bg,
                                            backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
                                            backgroundSize: 'cover',
                                            color: theme.color,
                                            fontSize: theme.fontSize,
                                        }, children: [(0, jsx_runtime_1.jsx)("div", { className: "slide-overlay" }), (0, jsx_runtime_1.jsx)("div", { className: "slide-content", children: currentSlide })] })] }), (0, jsx_runtime_1.jsxs)(ui_1.Panel, { className: "monitor live", children: [(0, jsx_runtime_1.jsxs)("div", { className: "monitor-header", children: [(0, jsx_runtime_1.jsx)("span", { children: "Live Output" }), (0, jsx_runtime_1.jsx)(ui_1.Pill, { className: "live-pill", children: "ON AIR" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "slide-frame", style: {
                                            backgroundColor: theme.bg,
                                            backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
                                            backgroundSize: 'cover',
                                            color: theme.color,
                                            fontSize: theme.fontSize,
                                        }, children: [(0, jsx_runtime_1.jsx)("div", { className: "slide-overlay live" }), (0, jsx_runtime_1.jsx)("div", { className: "slide-content", children: liveSlide })] })] })] }), (0, jsx_runtime_1.jsxs)(ui_1.Panel, { className: "output-preview-panel", style: { minHeight: paneSizes.consoleBottom }, children: [(0, jsx_runtime_1.jsx)(ui_1.SectionHeader, { title: "Output Preview Matrix" }), (0, jsx_runtime_1.jsx)("div", { className: "output-preview-grid", children: OUTPUT_IDS.map((id) => {
                                    const state = outputStates[id] || {};
                                    const label = state.mode === 'black'
                                        ? 'BLACK'
                                        : state.mode === 'logo'
                                            ? 'Church Logo'
                                            : state.slideTitle || 'Idle';
                                    return ((0, jsx_runtime_1.jsxs)("div", { className: "output-tile", children: [(0, jsx_runtime_1.jsxs)("small", { children: ["Output ", id] }), (0, jsx_runtime_1.jsx)("div", { className: "output-box", children: label }), (0, jsx_runtime_1.jsxs)("div", { className: "toolbar-inline", style: { marginTop: 6 }, children: [(0, jsx_runtime_1.jsx)("button", { className: "soft-button", onClick: () => window?.worship?.outputs?.windowControl?.(id, 'show'), children: "Show" }), (0, jsx_runtime_1.jsx)("button", { className: "soft-button", onClick: () => window?.worship?.outputs?.windowControl?.(id, 'toggle-fullscreen'), children: "Full View" })] })] }, id));
                                }) })] })] })] }));
};
exports.ConsoleWorkspace = ConsoleWorkspace;
