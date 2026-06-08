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
const OutputView = ({ outId, logoImage }) => {
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
    const propsText = state?.propsText || slide;
    const announcementText = state?.announcementText || slide;
    const alertText = state?.alertText || slide;
    const liveVideoLabel = state?.liveVideoLabel || 'Live Camera';
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
    return ((0, jsx_runtime_1.jsxs)("div", { "data-testid": "output-root", style: {
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
                    background: mode === 'black'
                        ? 'linear-gradient(180deg, rgba(0,0,0,0.92), rgba(0,0,0,0.7))'
                        : 'linear-gradient(180deg, rgba(12,18,32,0.35), rgba(0,0,0,0.55))',
                    zIndex: 1
                } })), has('announcements') && ((0, jsx_runtime_1.jsxs)("div", { style: {
                    position: 'absolute',
                    top: 18,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 5,
                    padding: '8px 16px',
                    borderRadius: 999,
                    background: 'rgba(12, 18, 32, 0.82)',
                    border: '1px solid rgba(187, 195, 255, 0.25)',
                    color: '#fff',
                    fontSize: 13,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase'
                }, children: ["Announcements: ", announcementText] })), has('slide_content') && !state?.mediaPath && (0, jsx_runtime_1.jsx)("div", { style: {
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
                }, children: mode === 'black' ? ((0, jsx_runtime_1.jsx)("div", { style: { fontSize: 72, fontWeight: 700 }, children: "BLACK" })) : mode === 'logo' ? (logoImage ? ((0, jsx_runtime_1.jsx)("img", { src: toFileUrl(logoImage) || logoImage, alt: "Church logo", style: { maxWidth: '60%', maxHeight: '60%', objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.35))' } })) : ((0, jsx_runtime_1.jsx)("div", { style: { fontSize: 72, fontWeight: 700 }, children: "Church Logo" }))) : ((0, jsx_runtime_1.jsx)("div", { style: {
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
                }, children: ["Lower Third: ", propsText] })), has('props_overlays') && mode !== 'black' && ((0, jsx_runtime_1.jsxs)("div", { style: { position: 'absolute', left: 18, top: 58, zIndex: 5, minWidth: 160, maxWidth: '42%', padding: '8px 12px', borderRadius: 8, background: 'rgba(19, 27, 46, 0.85)', border: '1px solid rgba(187, 195, 255, 0.18)', color: '#fff', fontSize: 12, lineHeight: 1.35, boxShadow: '0 8px 18px rgba(0,0,0,0.22)' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aeb8df', marginBottom: 4 }, children: "Props" }), (0, jsx_runtime_1.jsx)("div", { children: propsText })] })), has('live_video') && ((0, jsx_runtime_1.jsxs)("div", { style: { position: 'absolute', right: 18, bottom: 18, zIndex: 5, width: 250, height: 140, borderRadius: 12, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(5,8,15,0.72)', overflow: 'hidden', boxShadow: '0 10px 24px rgba(0,0,0,0.28)' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { position: 'absolute', inset: 0, background: bgImageUrl && isVideo ? 'rgba(0,0,0,0.18)' : 'linear-gradient(135deg, rgba(63,81,181,0.22), rgba(0,0,0,0.45))' } }), (0, jsx_runtime_1.jsxs)("div", { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 12, color: '#fff' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c8d0f0' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Live Feed" }), (0, jsx_runtime_1.jsx)("span", { style: { padding: '3px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.12)' }, children: "On Air" })] }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: 18, fontWeight: 800, lineHeight: 1.1 }, children: liveVideoLabel }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: 11, color: '#c6cde8' }, children: bgImageUrl ? 'Media feed ready' : 'Camera input placeholder' })] }), bgImageUrl && isVideo && ((0, jsx_runtime_1.jsx)("video", { src: bgImageUrl, autoPlay: true, loop: mediaPlayback.loop !== false, muted: mediaPlayback.muted !== false, playsInline: true, style: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 } }))] })), has('alerts') && ((0, jsx_runtime_1.jsxs)("div", { style: { position: 'absolute', top: 16, right: 16, zIndex: 6, minWidth: 180, maxWidth: '42%', background: 'linear-gradient(180deg, rgba(229,72,77,0.96), rgba(170,26,32,0.96))', color: '#fff', padding: '8px 10px', borderRadius: 8, fontSize: 12, boxShadow: '0 10px 20px rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.12)' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.9, marginBottom: 4 }, children: "Alert" }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: 13, fontWeight: 700, lineHeight: 1.35 }, children: alertText })] })), (0, jsx_runtime_1.jsxs)("div", { style: {
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
