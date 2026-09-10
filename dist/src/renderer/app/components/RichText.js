"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RichTextEditor = exports.FitText = exports.RichText = exports.richTextToPlainText = exports.getRichTextHtml = exports.sanitizeRichText = exports.plainTextToHtml = exports.hasRichTextMarkup = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const ALLOWED_TAGS = new Set([
    'B', 'STRONG', 'I', 'EM', 'U', 'S', 'BR', 'P', 'DIV', 'SPAN',
    'UL', 'OL', 'LI', 'SUB', 'SUP',
]);
const BLOCK_TAGS = new Set(['P', 'DIV', 'LI']);
const BLOCKED_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META']);
const escapeHtml = (value) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
const isSafeStyleValue = (property, value) => {
    if (!value || /url\s*\(|expression\s*\(|javascript\s*:/i.test(value))
        return false;
    if (property === 'color' || property === 'background-color') {
        return /^(?:#[0-9a-f]{3,8}|rgba?\([0-9.,%\s]+\)|hsla?\([0-9.,%\s]+\)|[a-z]+)$/i.test(value);
    }
    if (property === 'font-size')
        return /^\d+(?:\.\d+)?(?:px|pt|em|rem|%)$/i.test(value);
    if (property === 'text-align')
        return /^(?:left|center|right|justify)$/i.test(value);
    if (property === 'font-weight')
        return /^(?:normal|bold|[1-9]00)$/i.test(value);
    if (property === 'font-style')
        return /^(?:normal|italic|oblique)$/i.test(value);
    if (property === 'text-decoration')
        return /^(?:none|underline|line-through)(?:\s+(?:underline|line-through))*$/i.test(value);
    return false;
};
const sanitizeStyle = (style) => style
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
    const separator = declaration.indexOf(':');
    if (separator < 0)
        return null;
    const property = declaration.slice(0, separator).trim().toLowerCase();
    const value = declaration.slice(separator + 1).trim();
    return isSafeStyleValue(property, value) ? `${property}: ${value}` : null;
})
    .filter((declaration) => Boolean(declaration))
    .join('; ');
const normalizeFontElement = (element) => {
    const span = document.createElement('span');
    const color = element.getAttribute('color');
    const size = element.getAttribute('size');
    if (color && isSafeStyleValue('color', color))
        span.style.color = color;
    if (size) {
        const sizeMap = { '1': '12px', '2': '14px', '3': '16px', '4': '20px', '5': '26px', '6': '34px', '7': '44px' };
        const fontSize = sizeMap[size] || (/^\d+(?:\.\d+)?px$/.test(size) ? size : '');
        if (fontSize)
            span.style.fontSize = fontSize;
    }
    while (element.firstChild)
        span.appendChild(element.firstChild);
    element.replaceWith(span);
    return span;
};
const sanitizeNode = (node) => {
    Array.from(node.childNodes).forEach((child) => {
        if (!(child instanceof HTMLElement))
            return;
        const tag = child.tagName.toUpperCase();
        if (BLOCKED_TAGS.has(tag)) {
            child.remove();
            return;
        }
        if (tag === 'FONT') {
            sanitizeNode(normalizeFontElement(child));
            return;
        }
        if (!ALLOWED_TAGS.has(tag)) {
            const fragment = document.createDocumentFragment();
            while (child.firstChild)
                fragment.appendChild(child.firstChild);
            child.replaceWith(fragment);
            sanitizeNode(node);
            return;
        }
        Array.from(child.attributes).forEach((attribute) => {
            if (attribute.name.toLowerCase() !== 'style')
                child.removeAttribute(attribute.name);
        });
        if (child.hasAttribute('style')) {
            const safeStyle = sanitizeStyle(child.getAttribute('style') || '');
            if (safeStyle)
                child.setAttribute('style', safeStyle);
            else
                child.removeAttribute('style');
        }
        sanitizeNode(child);
    });
};
const hasRichTextMarkup = (value) => /<\/?[a-z][^>]*>/i.test(value);
exports.hasRichTextMarkup = hasRichTextMarkup;
const plainTextToHtml = (value) => escapeHtml(value || '').replace(/\r\n?|\n/g, '<br />');
exports.plainTextToHtml = plainTextToHtml;
const sanitizeRichText = (value) => {
    if (!value)
        return '';
    if (!(0, exports.hasRichTextMarkup)(value))
        return (0, exports.plainTextToHtml)(value);
    const template = document.createElement('template');
    template.innerHTML = value;
    sanitizeNode(template.content);
    return template.innerHTML;
};
exports.sanitizeRichText = sanitizeRichText;
const getRichTextHtml = (value) => (0, exports.sanitizeRichText)(value || '');
exports.getRichTextHtml = getRichTextHtml;
const richTextToPlainText = (value) => {
    if (!value)
        return '';
    if (!(0, exports.hasRichTextMarkup)(value))
        return value;
    const container = document.createElement('div');
    container.innerHTML = (0, exports.sanitizeRichText)(value);
    const walk = (node) => Array.from(node.childNodes).map((child) => {
        if (child.nodeType === Node.TEXT_NODE)
            return child.textContent || '';
        if (!(child instanceof HTMLElement))
            return walk(child);
        const tag = child.tagName.toUpperCase();
        if (tag === 'BR')
            return '\n';
        const text = walk(child);
        return BLOCK_TAGS.has(tag) ? `${text}\n` : text;
    }).join('');
    return walk(container).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
};
exports.richTextToPlainText = richTextToPlainText;
const RichText = ({ value, className = '', ...rest }) => ((0, jsx_runtime_1.jsx)("div", { ...rest, className: `rich-text-content ${className}`.trim(), dangerouslySetInnerHTML: { __html: (0, exports.getRichTextHtml)(value) } }));
exports.RichText = RichText;
const FitText = ({ value, className = '', baseFontSize = 48, minFontSize = 12, lineHeight = 1.22, fontFamily = 'Manrope', fontWeight = 700, textAlign = 'center', verticalAlign = 'center', textBoxWidth = 90, textBoxHeight = 90, style, 'aria-label': ariaLabel, }) => {
    const viewportRef = react_1.default.useRef(null);
    const contentRef = react_1.default.useRef(null);
    const [fit, setFit] = react_1.default.useState({ fontSize: baseFontSize, scale: 1 });
    const measure = react_1.default.useCallback(() => {
        const viewport = viewportRef.current;
        const content = contentRef.current;
        if (!viewport || !content || viewport.clientWidth <= 0 || viewport.clientHeight <= 0)
            return;
        const availableWidth = Math.max(1, viewport.clientWidth);
        const availableHeight = Math.max(1, viewport.clientHeight);
        const minimum = Math.max(8, Math.min(minFontSize, baseFontSize));
        const maximum = Math.max(minimum, baseFontSize);
        const canFit = (fontSize) => {
            content.style.fontSize = `${fontSize}px`;
            content.style.transform = 'none';
            return content.scrollWidth <= availableWidth + 1 && content.scrollHeight <= availableHeight + 1;
        };
        let best = minimum;
        if (canFit(maximum)) {
            best = maximum;
        }
        else {
            let low = minimum;
            let high = maximum;
            for (let index = 0; index < 14; index += 1) {
                const midpoint = (low + high) / 2;
                if (canFit(midpoint)) {
                    best = midpoint;
                    low = midpoint;
                }
                else {
                    high = midpoint;
                }
            }
        }
        canFit(best);
        const overflowScale = Math.min(1, availableWidth / Math.max(1, content.scrollWidth), availableHeight / Math.max(1, content.scrollHeight));
        const nextScale = Number.isFinite(overflowScale) ? Math.max(0.12, overflowScale) : 1;
        setFit((previous) => (Math.abs(previous.fontSize - best) < 0.1 && Math.abs(previous.scale - nextScale) < 0.01
            ? previous
            : { fontSize: best, scale: nextScale }));
    }, [baseFontSize, minFontSize, value, textBoxHeight, textBoxWidth]);
    react_1.default.useLayoutEffect(() => {
        let frame = 0;
        const requestFrame = (callback) => (typeof window.requestAnimationFrame === 'function'
            ? window.requestAnimationFrame(callback)
            : window.setTimeout(() => callback(Date.now()), 0));
        const cancelFrame = (handle) => {
            if (typeof window.cancelAnimationFrame === 'function')
                window.cancelAnimationFrame(handle);
            else
                window.clearTimeout(handle);
        };
        const scheduleMeasure = () => {
            if (frame)
                cancelFrame(frame);
            frame = requestFrame(() => {
                frame = 0;
                measure();
            });
        };
        scheduleMeasure();
        const viewport = viewportRef.current;
        const observer = typeof ResizeObserver !== 'undefined' && viewport
            ? new ResizeObserver(scheduleMeasure)
            : null;
        observer?.observe(viewport);
        window.addEventListener('resize', scheduleMeasure);
        return () => {
            if (frame)
                cancelFrame(frame);
            observer?.disconnect();
            window.removeEventListener('resize', scheduleMeasure);
        };
    }, [measure]);
    const alignItems = verticalAlign === 'top' ? 'flex-start' : verticalAlign === 'bottom' ? 'flex-end' : 'center';
    const justifyContent = textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center';
    const transformOrigin = `${textAlign} ${verticalAlign}`;
    return ((0, jsx_runtime_1.jsx)("div", { ref: viewportRef, className: `fit-text-viewport ${className}`.trim(), style: { alignItems, justifyContent, ...style }, "aria-label": ariaLabel, children: (0, jsx_runtime_1.jsx)("div", { ref: contentRef, className: "fit-text-content", style: {
                width: `${Math.min(100, Math.max(30, textBoxWidth))}%`,
                minHeight: `${Math.min(100, Math.max(0, textBoxHeight))}%`,
                fontSize: `${fit.fontSize}px`,
                lineHeight,
                fontFamily,
                fontWeight,
                textAlign,
                transform: `scale(${fit.scale})`,
                transformOrigin,
            }, children: (0, jsx_runtime_1.jsx)(exports.RichText, { value: value }) }) }));
};
exports.FitText = FitText;
const FONT_SIZE_COMMANDS = {
    small: '2',
    normal: '3',
    large: '5',
    huge: '7',
};
const RichTextEditor = ({ value, onChange, placeholder, 'aria-label': ariaLabel }) => {
    const editorRef = react_1.default.useRef(null);
    const focusedRef = react_1.default.useRef(false);
    const lastValueRef = react_1.default.useRef('');
    const syncEditor = react_1.default.useCallback(() => {
        const editor = editorRef.current;
        if (!editor)
            return;
        const html = (0, exports.sanitizeRichText)(editor.innerHTML);
        lastValueRef.current = html;
        onChange(html);
    }, [onChange]);
    react_1.default.useEffect(() => {
        const editor = editorRef.current;
        if (!editor || focusedRef.current || lastValueRef.current === value)
            return;
        editor.innerHTML = (0, exports.getRichTextHtml)(value);
        lastValueRef.current = value;
    }, [value]);
    const runCommand = (command, commandValue) => {
        const editor = editorRef.current;
        if (!editor)
            return;
        editor.focus();
        try {
            document.execCommand('styleWithCSS', false, 'true');
            document.execCommand(command, false, commandValue);
        }
        catch {
            // The command API is unavailable in some test environments.
        }
        syncEditor();
    };
    const runFontSize = (size) => {
        runCommand('fontSize', FONT_SIZE_COMMANDS[size] || FONT_SIZE_COMMANDS.normal);
        const editor = editorRef.current;
        if (!editor)
            return;
        const fontSize = size === 'small' ? '14px' : size === 'large' ? '26px' : size === 'huge' ? '44px' : '18px';
        editor.querySelectorAll('font[size="2"], font[size="3"], font[size="5"], font[size="7"]').forEach((node) => {
            const span = document.createElement('span');
            span.style.fontSize = fontSize;
            while (node.firstChild)
                span.appendChild(node.firstChild);
            node.replaceWith(span);
        });
        syncEditor();
    };
    const toolbarButton = (label, command, icon) => ((0, jsx_runtime_1.jsx)("button", { type: "button", className: "rich-toolbar-button", title: label, "aria-label": label, onMouseDown: (event) => event.preventDefault(), onClick: () => runCommand(command), children: icon }));
    return ((0, jsx_runtime_1.jsxs)("div", { className: "rich-text-editor", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rich-toolbar", role: "toolbar", "aria-label": "Rich text formatting", children: [toolbarButton('Bold', 'bold', 'B'), toolbarButton('Italic', 'italic', 'I'), toolbarButton('Underline', 'underline', 'U'), toolbarButton('Strikethrough', 'strikeThrough', 'S'), (0, jsx_runtime_1.jsx)("span", { className: "rich-toolbar-divider" }), toolbarButton('Align left', 'justifyLeft', '≡'), toolbarButton('Align center', 'justifyCenter', '≡'), toolbarButton('Align right', 'justifyRight', '≡'), (0, jsx_runtime_1.jsxs)("label", { className: "rich-toolbar-color", title: "Text color", children: [(0, jsx_runtime_1.jsx)("span", { children: "A" }), (0, jsx_runtime_1.jsx)("input", { type: "color", defaultValue: "#ffffff", "aria-label": "Text color", onChange: (event) => runCommand('foreColor', event.target.value) })] }), (0, jsx_runtime_1.jsxs)("select", { className: "rich-toolbar-select", "aria-label": "Text size", defaultValue: "normal", onChange: (event) => runFontSize(event.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "small", children: "Small" }), (0, jsx_runtime_1.jsx)("option", { value: "normal", children: "Normal" }), (0, jsx_runtime_1.jsx)("option", { value: "large", children: "Large" }), (0, jsx_runtime_1.jsx)("option", { value: "huge", children: "Huge" })] }), (0, jsx_runtime_1.jsx)("span", { className: "rich-toolbar-divider" }), toolbarButton('Undo', 'undo', '↶'), toolbarButton('Redo', 'redo', '↷')] }), (0, jsx_runtime_1.jsx)("div", { ref: editorRef, className: "rich-editor-surface", contentEditable: true, suppressContentEditableWarning: true, role: "textbox", "aria-label": ariaLabel || 'Song rich text', "data-placeholder": placeholder || 'Type song lyrics here...', onFocus: () => { focusedRef.current = true; }, onBlur: () => { focusedRef.current = false; syncEditor(); }, onInput: syncEditor })] }));
};
exports.RichTextEditor = RichTextEditor;
