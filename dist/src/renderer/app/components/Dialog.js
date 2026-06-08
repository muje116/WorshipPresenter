"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogProvider = exports.useDialog = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const DialogContext = react_1.default.createContext(null);
const useDialog = () => {
    const ctx = react_1.default.useContext(DialogContext);
    if (!ctx)
        throw new Error('useDialog must be used inside <DialogProvider>');
    return ctx;
};
exports.useDialog = useDialog;
// ─── Provider ─────────────────────────────────────────────────────────────────
const DialogProvider = ({ children }) => {
    const [config, setConfig] = react_1.default.useState(null);
    const [inputValue, setInputValue] = react_1.default.useState('');
    const inputRef = react_1.default.useRef(null);
    const show = react_1.default.useCallback((cfg) => new Promise((resolve) => {
        setInputValue(cfg.defaultValue ?? '');
        setConfig({ ...cfg, resolve });
    }), []);
    react_1.default.useEffect(() => {
        if (config && config.type === 'prompt') {
            setTimeout(() => inputRef.current?.focus(), 60);
        }
    }, [config]);
    const dismiss = (value) => {
        config?.resolve(value);
        setConfig(null);
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Escape')
            dismiss(config?.type === 'confirm' ? false : null);
        if (e.key === 'Enter' && config?.type !== 'confirm') {
            e.preventDefault();
            dismiss(config?.type === 'prompt' ? inputValue : true);
        }
    };
    return ((0, jsx_runtime_1.jsxs)(DialogContext.Provider, { value: { show }, children: [children, config && ((0, jsx_runtime_1.jsx)("div", { className: "dialog-backdrop", role: "dialog", "aria-modal": "true", onKeyDown: handleKeyDown, tabIndex: -1, children: (0, jsx_runtime_1.jsxs)("div", { className: "dialog-panel", children: [(0, jsx_runtime_1.jsx)("div", { className: "dialog-title", children: config.title }), config.message && (0, jsx_runtime_1.jsx)("div", { className: "dialog-message", children: config.message }), config.type === 'prompt' && ((0, jsx_runtime_1.jsx)("input", { ref: inputRef, className: "input", value: inputValue, onChange: (e) => setInputValue(e.target.value), onKeyDown: (e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    dismiss(inputValue);
                                }
                                if (e.key === 'Escape')
                                    dismiss(null);
                            }, autoFocus: true })), (0, jsx_runtime_1.jsxs)("div", { className: "dialog-actions", children: [config.type !== 'alert' && ((0, jsx_runtime_1.jsx)("button", { className: "soft-button", onClick: () => dismiss(config.type === 'confirm' ? false : null), children: config.cancelLabel ?? 'Cancel' })), (0, jsx_runtime_1.jsx)("button", { className: `soft-button ${config.tone === 'danger' ? 'danger' : 'primary'}`, onClick: () => dismiss(config.type === 'prompt' ? inputValue : true), children: config.confirmLabel ?? (config.type === 'alert' ? 'OK' : 'Confirm') })] })] }) }))] }));
};
exports.DialogProvider = DialogProvider;
