"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBadge = exports.InspectorCard = exports.MediaCard = exports.GradientButton = exports.IconButton = exports.Chip = exports.Pill = exports.SectionHeader = exports.Panel = exports.AppIcon = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const ICON_PATHS = {
    console: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }), (0, jsx_runtime_1.jsx)("path", { d: "M7 8h4M7 12h10M7 16h6M16 8h2" })] }),
    library: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M5 4.5h13a1 1 0 0 1 1 1v14H6a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2Z" }), (0, jsx_runtime_1.jsx)("path", { d: "M6 17.5h13M8 8h7M8 11.5h7" })] }),
    editor: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "m4 17.5-.8 3.3 3.3-.8L19 7.5a2.3 2.3 0 0 0-3.3-3.3L4 17.5Z" }), (0, jsx_runtime_1.jsx)("path", { d: "m14 5 3 3" })] }),
    scripture: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" }), (0, jsx_runtime_1.jsx)("path", { d: "M8 7h6M8 10.5h6M8 14h4" }), (0, jsx_runtime_1.jsx)("path", { d: "M17 7h2v13h-9" })] }),
    media: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }), (0, jsx_runtime_1.jsx)("circle", { cx: "8", cy: "9", r: "1.3" }), (0, jsx_runtime_1.jsx)("path", { d: "m4 17 5-5 3 3 2-2 6 5" })] }),
    settings: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" }), (0, jsx_runtime_1.jsx)("path", { d: "m19.4 15 .1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3.1 1.3v.2a1.8 1.8 0 1 1-3.6 0v-.2a1.8 1.8 0 0 0-3.1-1.3l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1A1.8 1.8 0 0 0 3.3 12a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 1.3-3.1l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1A1.8 1.8 0 0 0 10.4 3h.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3.1 1.3l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 1.3 3.1h.2a1.8 1.8 0 1 1 0 3.6h-.2a1.8 1.8 0 0 0-1.7 1.3Z" })] }),
    help: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("circle", { cx: "12", cy: "12", r: "9" }), (0, jsx_runtime_1.jsx)("path", { d: "M9.7 9a2.5 2.5 0 1 1 4.5 1.5c-.9 1.1-2.2 1.3-2.2 3M12 17h.01" })] }),
    spark: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" }), (0, jsx_runtime_1.jsx)("path", { d: "m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" })] }),
    search: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("circle", { cx: "10.8", cy: "10.8", r: "6.3" }), (0, jsx_runtime_1.jsx)("path", { d: "m16 16 4.5 4.5" })] }),
    plus: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("path", { d: "M12 5v14M5 12h14" }) }),
    send: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "m21 3-8.5 18-2.3-7.2L3 11.5 21 3Z" }), (0, jsx_runtime_1.jsx)("path", { d: "M10.2 13.8 21 3" })] }),
    black: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("rect", { x: "4", y: "4", width: "16", height: "16", rx: "2" }) }),
    logo: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("path", { d: "M4 18V7l4 3 4-6 4 6 4-3v11l-4-2-4 2-4-2-4 2Z" }) }),
    clear: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "m7 7 10 10M17 7 7 17" }), (0, jsx_runtime_1.jsx)("circle", { cx: "12", cy: "12", r: "9" })] }),
    pause: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("rect", { x: "6", y: "5", width: "3.5", height: "14", rx: "1" }), (0, jsx_runtime_1.jsx)("rect", { x: "14.5", y: "5", width: "3.5", height: "14", rx: "1" })] }),
    stop: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("rect", { x: "5", y: "5", width: "14", height: "14", rx: "2" }) }),
    queue: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M5 6h14M5 12h14M5 18h9" }), (0, jsx_runtime_1.jsx)("path", { d: "M3 6h.01M3 12h.01M3 18h.01" })] }),
    chevron: (0, jsx_runtime_1.jsx)("path", { d: "m9 6 6 6-6 6" }),
    folder: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M3.5 6.5h6l1.8 2h9.2v9a2 2 0 0 1-2 2h-15v-13Z" }), (0, jsx_runtime_1.jsx)("path", { d: "M3.5 9h17" })] }),
    upload: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("path", { d: "M12 15V4M8 8l4-4 4 4M5 14v5h14v-5" }) }),
    grid: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("rect", { x: "4", y: "4", width: "6", height: "6", rx: "1" }), (0, jsx_runtime_1.jsx)("rect", { x: "14", y: "4", width: "6", height: "6", rx: "1" }), (0, jsx_runtime_1.jsx)("rect", { x: "4", y: "14", width: "6", height: "6", rx: "1" }), (0, jsx_runtime_1.jsx)("rect", { x: "14", y: "14", width: "6", height: "6", rx: "1" })] }),
    list: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M8 6h12M8 12h12M8 18h12" }), (0, jsx_runtime_1.jsx)("path", { d: "M4 6h.01M4 12h.01M4 18h.01" })] }),
    more: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("circle", { cx: "5", cy: "12", r: "1", fill: "currentColor", stroke: "none" }), (0, jsx_runtime_1.jsx)("circle", { cx: "12", cy: "12", r: "1", fill: "currentColor", stroke: "none" }), (0, jsx_runtime_1.jsx)("circle", { cx: "19", cy: "12", r: "1", fill: "currentColor", stroke: "none" })] }),
    play: (0, jsx_runtime_1.jsx)("path", { d: "m8 5 11 7-11 7V5Z" }),
    check: (0, jsx_runtime_1.jsx)("path", { d: "m5 12 4.5 4.5L19 7" }),
    monitor: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("rect", { x: "3", y: "4", width: "18", height: "12", rx: "2" }), (0, jsx_runtime_1.jsx)("path", { d: "M8 20h8M12 16v4" })] }),
    sync: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M20 7v5h-5M4 17v-5h5" }), (0, jsx_runtime_1.jsx)("path", { d: "M6.2 9A7 7 0 0 1 18.8 7M17.8 15A7 7 0 0 1 5.2 17" })] }),
    eye: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M2.5 12s3.2-5 9.5-5 9.5 5 9.5 5-3.2 5-9.5 5-9.5-5-9.5-5Z" }), (0, jsx_runtime_1.jsx)("circle", { cx: "12", cy: "12", r: "2.3" })] }),
    save: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M5 4h12l2 2v14H5V4Z" }), (0, jsx_runtime_1.jsx)("path", { d: "M8 4v6h8V4M8 16h8" })] }),
    trash: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("path", { d: "M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" }) }),
    undo: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M9 7 4 12l5 5" }), (0, jsx_runtime_1.jsx)("path", { d: "M5 12h8a6 6 0 0 1 6 6" })] }),
    redo: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "m15 7 5 5-5 5" }), (0, jsx_runtime_1.jsx)("path", { d: "M19 12h-8a6 6 0 0 0-6 6" })] }),
    type: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("path", { d: "M5 6V4h14v2M12 4v16M8 20h8" }) }),
    palette: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M12 3a9 9 0 0 0 0 18h1.2a1.8 1.8 0 0 0 1.1-3.2 1.8 1.8 0 0 1 1.1-3.2H17a4 4 0 0 0 4-4A7.6 7.6 0 0 0 12 3Z" }), (0, jsx_runtime_1.jsx)("circle", { cx: "7.5", cy: "11", r: ".8", fill: "currentColor", stroke: "none" }), (0, jsx_runtime_1.jsx)("circle", { cx: "9", cy: "7.5", r: ".8", fill: "currentColor", stroke: "none" }), (0, jsx_runtime_1.jsx)("circle", { cx: "14", cy: "7", r: ".8", fill: "currentColor", stroke: "none" })] }),
    info: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("circle", { cx: "12", cy: "12", r: "9" }), (0, jsx_runtime_1.jsx)("path", { d: "M12 11v5M12 8h.01" })] }),
    clock: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("circle", { cx: "12", cy: "12", r: "9" }), (0, jsx_runtime_1.jsx)("path", { d: "M12 7v5l3 2" })] }),
    external: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: "M14 4h6v6M20 4l-9 9" }), (0, jsx_runtime_1.jsx)("path", { d: "M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" })] }),
    globe: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("circle", { cx: "12", cy: "12", r: "9" }), (0, jsx_runtime_1.jsx)("path", { d: "M3 12h18M12 3c2.2 2.5 3.2 5.5 3.2 9s-1 6.5-3.2 9c-2.2-2.5-3.2-5.5-3.2-9S9.8 5.5 12 3Z" })] }),
};
const AppIcon = ({ name, size = 16, className = '', strokeWidth = 1.8, }) => ((0, jsx_runtime_1.jsx)("svg", { className: `app-icon ${className}`.trim(), width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: ICON_PATHS[name] }));
exports.AppIcon = AppIcon;
const Panel = ({ children, className = '', ...rest }) => ((0, jsx_runtime_1.jsx)("section", { className: `panel ${className}`.trim(), ...rest, children: children }));
exports.Panel = Panel;
const SectionHeader = ({ title, meta, action }) => ((0, jsx_runtime_1.jsxs)("div", { className: "panel-header", children: [(0, jsx_runtime_1.jsx)("h3", { children: title }), (0, jsx_runtime_1.jsxs)("div", { className: "section-header-tools", children: [meta ? (0, jsx_runtime_1.jsx)("span", { children: meta }) : null, action] })] }));
exports.SectionHeader = SectionHeader;
const Pill = ({ children, className = '' }) => (0, jsx_runtime_1.jsx)("span", { className: `ui-pill ${className}`.trim(), children: children });
exports.Pill = Pill;
const Chip = ({ children, className = '' }) => (0, jsx_runtime_1.jsx)("span", { className: `chip ${className}`.trim(), children: children });
exports.Chip = Chip;
const IconButton = ({ className = '', ...rest }) => ((0, jsx_runtime_1.jsx)("button", { className: `icon-button ${className}`.trim(), ...rest }));
exports.IconButton = IconButton;
const GradientButton = ({ className = '', ...rest }) => ((0, jsx_runtime_1.jsx)("button", { className: `live-button ${className}`.trim(), ...rest }));
exports.GradientButton = GradientButton;
const MediaCard = ({ title, subtitle, active, onClick }) => ((0, jsx_runtime_1.jsxs)("article", { className: `media-card ${active ? 'live' : ''}`, onClick: onClick, children: [(0, jsx_runtime_1.jsx)("div", { className: "media-thumb", children: (0, jsx_runtime_1.jsx)("span", { children: title.slice(0, 1).toUpperCase() }) }), (0, jsx_runtime_1.jsxs)("div", { className: "media-meta", children: [(0, jsx_runtime_1.jsx)("strong", { children: title }), subtitle ? (0, jsx_runtime_1.jsx)("small", { children: subtitle }) : null] })] }));
exports.MediaCard = MediaCard;
const InspectorCard = ({ children, className = '' }) => (0, jsx_runtime_1.jsx)("div", { className: `meta-card ${className}`.trim(), children: children });
exports.InspectorCard = InspectorCard;
const StatusBadge = ({ children, className = '', tone = 'neutral' }) => ((0, jsx_runtime_1.jsxs)("span", { className: `status-badge status-badge-${tone} ${className}`.trim(), children: [tone === 'live' ? (0, jsx_runtime_1.jsx)("span", { className: "status-badge-dot" }) : null, children] }));
exports.StatusBadge = StatusBadge;
