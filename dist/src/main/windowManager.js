"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDisplayInfo = getDisplayInfo;
exports.createOutputWindow = createOutputWindow;
exports.destroyOutputWindow = destroyOutputWindow;
exports.getOutputWindows = getOutputWindows;
exports.getOutputWindowsArray = getOutputWindowsArray;
exports.assignOutputToDisplay = assignOutputToDisplay;
exports.createOrShowOutputOnDisplay = createOrShowOutputOnDisplay;
exports.getOutputWindowList = getOutputWindowList;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const outputWindows = new Map();
let nextOutputId = 1;
const outputPreloadPath = path_1.default.join(__dirname, '../preload-output.js');
const rendererOutputEntryPath = path_1.default.join(__dirname, '../../renderer/app/output.html');
function getDisplayInfo() {
    const allDisplays = electron_1.screen.getAllDisplays();
    const primary = electron_1.screen.getPrimaryDisplay();
    return allDisplays.map(d => ({
        id: d.id,
        label: d.label || (d.internal ? 'Built-in Display' : `Display ${d.id}`),
        bounds: d.bounds,
        size: d.size,
        workArea: d.workArea,
        isPrimary: d.id === primary.id,
        scaleFactor: d.scaleFactor,
        internal: d.internal,
        rotation: d.rotation,
        touchSupport: d.touchSupport,
        displayFrequency: d.displayFrequency || 60
    }));
}
function createOutputWindow(displayId, options = {}) {
    const outId = nextOutputId++;
    let targetDisplay = displayId
        ? electron_1.screen.getAllDisplays().find(d => d.id === displayId)
        : undefined;
    const bounds = targetDisplay?.workArea || { x: 0, y: 0, width: 960, height: 540 };
    const width = options.fullScreen ? bounds.width : Math.min(Math.round(bounds.width * 0.8), 1920);
    const height = options.fullScreen ? bounds.height : Math.min(Math.round(bounds.height * 0.8), 1080);
    const w = new electron_1.BrowserWindow({
        width,
        height,
        x: options.fullScreen ? bounds.x : bounds.x + 50,
        y: options.fullScreen ? bounds.y : bounds.y + 50,
        minWidth: 320,
        minHeight: 180,
        frame: true,
        resizable: true,
        minimizable: true,
        maximizable: true,
        closable: true,
        backgroundColor: '#000000',
        webPreferences: {
            preload: outputPreloadPath,
            contextIsolation: true,
            nodeIntegration: false,
        },
        show: options.show ?? true,
    });
    w.loadFile(rendererOutputEntryPath, { query: { out: String(outId) } });
    if (options.fullScreen) {
        w.once('ready-to-show', () => {
            w.setBounds(bounds);
            w.setFullScreen(true);
            w.show();
        });
    }
    outputWindows.set(outId, w);
    w.on('closed', () => {
        outputWindows.delete(outId);
    });
    return outId;
}
function destroyOutputWindow(outId) {
    const w = outputWindows.get(outId);
    if (!w || w.isDestroyed())
        return false;
    w.close();
    outputWindows.delete(outId);
    return true;
}
function getOutputWindows() {
    return outputWindows;
}
function getOutputWindowsArray() {
    return Array.from(outputWindows.values()).filter(w => !w.isDestroyed());
}
function assignOutputToDisplay(outId, displayId) {
    const w = outputWindows.get(outId);
    if (!w || w.isDestroyed())
        return false;
    const allDisplays = electron_1.screen.getAllDisplays();
    const target = allDisplays.find(d => d.id === displayId);
    if (!target)
        return false;
    w.setBounds(target.workArea);
    return true;
}
function createOrShowOutputOnDisplay(displayId, fullScreen = true) {
    const existing = getOutputWindowList().find((item) => item.displayId === displayId);
    if (existing) {
        const w = outputWindows.get(existing.id);
        const target = electron_1.screen.getAllDisplays().find(d => d.id === displayId);
        if (w && !w.isDestroyed()) {
            if (target)
                w.setBounds(target.workArea);
            if (fullScreen)
                w.setFullScreen(true);
            w.show();
            return existing.id;
        }
    }
    return createOutputWindow(displayId, { fullScreen });
}
function getOutputWindowList() {
    return Array.from(outputWindows.keys()).map(id => {
        const w = outputWindows.get(id);
        if (!w || w.isDestroyed())
            return null;
        const bounds = w.getBounds();
        const isFullScreen = w.isFullScreen();
        const display = electron_1.screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
        return {
            id,
            bounds,
            isFullScreen,
            displayId: display.id,
            displayLabel: display.label || `Display ${display.id}`
        };
    }).filter(Boolean);
}
