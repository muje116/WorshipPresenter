"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const client_1 = require("react-dom/client");
const OutputView_1 = require("./components/OutputView");
require("./styles.css");
const getOutId = () => {
    try {
        const q = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        const value = q.get('out');
        return value ? Number(value) : 1;
    }
    catch {
        return 1;
    }
};
const App = () => {
    const outId = getOutId();
    return (0, jsx_runtime_1.jsx)(OutputView_1.OutputView, { outId: outId });
};
const rootEl = document.getElementById('root');
if (rootEl) {
    const root = (0, client_1.createRoot)(rootEl);
    root.render((0, jsx_runtime_1.jsx)(react_1.default.StrictMode, { children: (0, jsx_runtime_1.jsx)(App, {}) }));
}
