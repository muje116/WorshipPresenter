"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputView = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const store_1 = require("../store");
const toFileUrl = (input) => {
    if (!input)
        return null;
    if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('file://'))
        return input;
    const normalized = input.replace(/\\/g, '/');
    const absolutePath = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return encodeURI(`file://${absolutePath}`);
};
const OutputView = ({ outId }) => {
    const perOutLook = (0, store_1.useStore)((state) => state.looks?.[outId]) || {};
    const [state, setState] = react_1.default.useState({ slideTitle: 'Idle' });
    const videoRef = react_1.default.useRef(null);
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
    const bgImage = state?.mediaPath || theme?.backgroundImage;
    const bgColor = lookBg ?? theme?.bg ?? (mode === 'black' ? '#000' : '#111');
    const textColor = theme?.color ?? '#fff';
    const fontSize = theme?.fontSize ?? 48;
    const fontFamily = theme?.fontFamily ?? 'Manrope';
    const fontWeight = theme?.fontWeight ?? 700;
    const textAlign = theme?.textAlign ?? 'center';
    const verticalAlign = theme?.verticalAlign ?? 'center';
    const mediaPlayback = state?.mediaPlayback || {};
    react_1.default.useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = mediaPlayback.playbackRate || 1;
        }
    }, [mediaPlayback.playbackRate, state?.mediaPath]);
    // Check if background is a video
    const inferredType = state?.mediaType || (bgImage && (bgImage.endsWith('.mp4') || bgImage.endsWith('.mov') || bgImage.endsWith('.webm') || bgImage.endsWith('.mkv') || bgImage.endsWith('.avi') ? 'video' : 'image'));
    const isVideo = inferredType === 'video';
    // Convert file path to file:// URL if needed
    const bgImageUrl = toFileUrl(bgImage);
    const layers = perOutLook.layers || ['background', 'media', 'slide_content'];
    const has = (layer) => layers.includes(layer);
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
        }, children: [has('background') && bgImageUrl && !isVideo && ((0, jsx_runtime_1.jsx)("img", { src: bgImageUrl, alt: "", style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0
                }, onError: (e) => {
                    e.currentTarget.style.display = 'none';
                } })), has('media') && bgImageUrl && isVideo && ((0, jsx_runtime_1.jsx)("video", { ref: videoRef, src: bgImageUrl, autoPlay: true, loop: mediaPlayback.loop !== false, muted: mediaPlayback.muted !== false, playsInline: true, style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0
                }, onError: (e) => {
                    e.currentTarget.style.display = 'none';
                } })), (has('announcements') || has('props_overlays')) && (bgImageUrl || mode === 'black') && ((0, jsx_runtime_1.jsx)("div", { style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: mode === 'black' ? '#000' : 'rgba(0,0,0,0.4)',
                    zIndex: 1
                } })), has('slide_content') && !state?.mediaPath && (0, jsx_runtime_1.jsx)("div", { style: {
                    position: 'absolute',
                    inset: 0,
                    zIndex: 2,
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: verticalAlign === 'top' ? 'flex-start' : verticalAlign === 'bottom' ? 'flex-end' : 'center',
                    justifyContent: 'center',
                    padding: '40px 60px',
                    maxWidth: '100%',
                    textShadow: '2px 2px 8px rgba(0,0,0,0.8)'
                }, children: mode === 'black' ? ((0, jsx_runtime_1.jsx)("div", { style: { fontSize: 72, fontWeight: 700 }, children: "BLACK" })) : mode === 'logo' ? ((0, jsx_runtime_1.jsx)("div", { style: { fontSize: 72, fontWeight: 700 }, children: "Church Logo" })) : ((0, jsx_runtime_1.jsx)("div", { style: {
                        fontSize: fontSize,
                        fontFamily,
                        fontWeight,
                        lineHeight: 1.4,
                        whiteSpace: 'pre-wrap',
                        textAlign,
                        maxWidth: '90%'
                    }, children: slide })) }), has('lower_thirds') && mode !== 'black' && ((0, jsx_runtime_1.jsxs)("div", { style: {
                    position: 'absolute',
                    left: 32,
                    right: 32,
                    bottom: 24,
                    zIndex: 4,
                    background: 'rgba(0,0,0,0.55)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 18,
                    color: '#fff'
                }, children: ["Lower Third: ", slide] })), has('props_overlays') && mode !== 'black' && ((0, jsx_runtime_1.jsx)("div", { style: { position: 'absolute', left: 16, top: 48, zIndex: 5, padding: '6px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 12 }, children: "Props Overlay" })), has('live_video') && ((0, jsx_runtime_1.jsx)("div", { style: { position: 'absolute', right: 16, bottom: 16, zIndex: 5, width: 220, height: 124, borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d7e3ff', fontSize: 12 }, children: "Live Video Layer" })), has('alerts') && ((0, jsx_runtime_1.jsx)("div", { style: { position: 'absolute', top: 16, right: 16, zIndex: 6, background: '#ff5252', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: 12 }, children: "Alert Layer" })), (0, jsx_runtime_1.jsxs)("div", { style: {
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
