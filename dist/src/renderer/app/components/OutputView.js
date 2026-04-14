"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputView = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const store_1 = require("../store");
const OutputView = ({ outId }) => {
    const perOutLook = (0, store_1.useStore)((state) => state.looks?.[outId]) || {};
    const [state, setState] = react_1.default.useState({ slideTitle: 'Idle' });
    react_1.default.useEffect(() => {
        if (window.worship?.outputs?.onOutputState) {
            window.worship.outputs.onOutputState((payload) => {
                if (payload?.outputId === outId && payload?.state) {
                    setState(payload.state);
                }
            });
        }
        // Initialize
        if (window.worship?.outputs?.setState) {
            window.worship.outputs.setState(outId, { slideTitle: 'Idle' });
        }
    }, [outId]);
    const mode = state?.mode;
    const slide = state?.slideTitle ?? 'Idle';
    const theme = state?.theme;
    const lookBg = perOutLook.background;
    // Determine background
    const bgImage = theme?.backgroundImage;
    const bgColor = lookBg ?? theme?.bg ?? (mode === 'black' ? '#000' : '#111');
    const textColor = theme?.color ?? '#fff';
    const fontSize = theme?.fontSize ?? 48;
    // Check if background is a video
    const isVideo = bgImage && (bgImage.endsWith('.mp4') || bgImage.endsWith('.mov') || bgImage.endsWith('.webm'));
    // Convert file path to file:// URL if needed
    const bgImageUrl = bgImage ? (bgImage.startsWith('http') || bgImage.startsWith('file://') ? bgImage : `file://${bgImage}`) : null;
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            height: '100vh',
            width: '100%',
            backgroundColor: bgColor,
            color: textColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
        }, children: [bgImageUrl && !isVideo && ((0, jsx_runtime_1.jsx)("img", { src: bgImageUrl, alt: "", style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0
                }, onError: (e) => {
                    e.currentTarget.style.display = 'none';
                } })), bgImageUrl && isVideo && ((0, jsx_runtime_1.jsx)("video", { src: bgImageUrl, autoPlay: true, loop: true, muted: true, playsInline: true, style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0
                }, onError: (e) => {
                    e.currentTarget.style.display = 'none';
                } })), (bgImageUrl || mode === 'black') && ((0, jsx_runtime_1.jsx)("div", { style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: mode === 'black' ? '#000' : 'rgba(0,0,0,0.4)',
                    zIndex: 1
                } })), (0, jsx_runtime_1.jsx)("div", { style: {
                    position: 'relative',
                    zIndex: 2,
                    textAlign: 'center',
                    padding: '40px 60px',
                    maxWidth: '90%',
                    textShadow: '2px 2px 8px rgba(0,0,0,0.8)'
                }, children: mode === 'black' ? ((0, jsx_runtime_1.jsx)("div", { style: { fontSize: 72, fontWeight: 700 }, children: "BLACK" })) : mode === 'logo' ? ((0, jsx_runtime_1.jsx)("div", { style: { fontSize: 72, fontWeight: 700 }, children: "Church Logo" })) : ((0, jsx_runtime_1.jsx)("div", { style: {
                        fontSize: fontSize,
                        fontWeight: 700,
                        lineHeight: 1.4,
                        whiteSpace: 'pre-wrap'
                    }, children: slide })) }), (0, jsx_runtime_1.jsxs)("div", { style: {
                    position: 'absolute',
                    top: 8,
                    left: 12,
                    fontSize: 10,
                    opacity: 0.3,
                    color: '#888',
                    zIndex: 10
                }, children: ["Output ", outId, " ", mode ? `| ${mode.toUpperCase()}` : ''] })] }));
};
exports.OutputView = OutputView;
