"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notifications = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const Notifications = ({ items, onDismiss }) => ((0, jsx_runtime_1.jsx)("div", { className: "toast-stack", "aria-live": "polite", "aria-label": "Notifications", children: items.map((item) => ((0, jsx_runtime_1.jsxs)("div", { className: `toast toast-${item.tone || 'info'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "toast-content", children: [(0, jsx_runtime_1.jsx)("strong", { children: item.title }), item.detail ? (0, jsx_runtime_1.jsx)("small", { children: item.detail }) : null] }), (0, jsx_runtime_1.jsx)("button", { className: "toast-close", onClick: () => onDismiss(item.id), title: "Dismiss notification", children: "x" })] }, item.id))) }));
exports.Notifications = Notifications;
