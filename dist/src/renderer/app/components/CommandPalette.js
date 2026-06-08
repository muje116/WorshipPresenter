"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandPalette = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const CommandPalette = ({ commands, onClose }) => {
    const [query, setQuery] = react_1.default.useState('');
    const [selected, setSelected] = react_1.default.useState(0);
    const inputRef = react_1.default.useRef(null);
    const listRef = react_1.default.useRef(null);
    const filtered = react_1.default.useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q)
            return commands;
        return commands.filter((cmd) => {
            const hay = [cmd.label, cmd.description, cmd.category, ...(cmd.keywords ?? [])].join(' ').toLowerCase();
            return hay.includes(q);
        });
    }, [commands, query]);
    react_1.default.useEffect(() => {
        setSelected(0);
    }, [query]);
    react_1.default.useEffect(() => {
        inputRef.current?.focus();
    }, []);
    react_1.default.useEffect(() => {
        // Scroll selected item into view
        const el = listRef.current?.querySelector(`[data-idx="${selected}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [selected]);
    const execute = (cmd) => {
        cmd.action();
        onClose();
    };
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelected((s) => Math.min(s + 1, filtered.length - 1));
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelected((s) => Math.max(s - 1, 0));
        }
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[selected])
                execute(filtered[selected]);
        }
        else if (e.key === 'Escape') {
            onClose();
        }
    };
    // Group by category
    const grouped = react_1.default.useMemo(() => {
        const map = new Map();
        filtered.forEach((cmd, idx) => {
            const cat = cmd.category ?? 'General';
            if (!map.has(cat))
                map.set(cat, []);
            map.get(cat).push({ cmd, idx });
        });
        return map;
    }, [filtered]);
    return ((0, jsx_runtime_1.jsx)("div", { className: "palette-backdrop", onClick: onClose, children: (0, jsx_runtime_1.jsxs)("div", { className: "palette-panel", onClick: (e) => e.stopPropagation(), onKeyDown: handleKeyDown, children: [(0, jsx_runtime_1.jsxs)("div", { className: "palette-search-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "palette-search-icon", children: "\u2318" }), (0, jsx_runtime_1.jsx)("input", { ref: inputRef, className: "palette-input", placeholder: "Type a command or search\u2026", value: query, onChange: (e) => setQuery(e.target.value), autoComplete: "off", spellCheck: false }), (0, jsx_runtime_1.jsx)("kbd", { className: "palette-esc-hint", onClick: onClose, children: "ESC" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "palette-list", ref: listRef, children: [filtered.length === 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "palette-empty", children: ["No commands match \"", query, "\""] })), Array.from(grouped.entries()).map(([cat, items]) => ((0, jsx_runtime_1.jsxs)("div", { className: "palette-group", children: [(0, jsx_runtime_1.jsx)("div", { className: "palette-category", children: cat }), items.map(({ cmd, idx }) => ((0, jsx_runtime_1.jsxs)("button", { "data-idx": idx, className: `palette-item ${idx === selected ? 'active' : ''}`, onMouseEnter: () => setSelected(idx), onClick: () => execute(cmd), children: [cmd.icon && (0, jsx_runtime_1.jsx)("span", { className: "palette-item-icon", children: cmd.icon }), (0, jsx_runtime_1.jsx)("span", { className: "palette-item-label", children: cmd.label }), cmd.description && (0, jsx_runtime_1.jsx)("span", { className: "palette-item-desc", children: cmd.description })] }, cmd.id)))] }, cat)))] }), (0, jsx_runtime_1.jsxs)("div", { className: "palette-footer", children: [(0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("kbd", { children: "\u2191\u2193" }), " navigate"] }), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("kbd", { children: "\u21B5" }), " run"] }), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Esc" }), " close"] })] })] }) }));
};
exports.CommandPalette = CommandPalette;
