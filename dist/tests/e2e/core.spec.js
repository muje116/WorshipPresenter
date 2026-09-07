"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const path_1 = __importDefault(require("path"));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function getOperatorWindow(electronApp) {
    for (let i = 0; i < 20; i += 1) {
        const windows = await electronApp.windows();
        // The desktop app has a short-lived splash BrowserWindow during startup.
        // Match the real operator entry point so tests never retain a closing page.
        const operator = windows.find((w) => String(w.url()).includes('/renderer/app/index.html'));
        if (operator)
            return operator;
        await sleep(500);
    }
    throw new Error('Operator window did not open');
}
async function getOutputWindow(electronApp) {
    for (let i = 0; i < 20; i += 1) {
        const windows = await electronApp.windows();
        const output = windows.find((w) => String(w.url()).includes('out='));
        if (output)
            return output;
        await sleep(500);
    }
    throw new Error('Output window did not open');
}
async function getOutputWindowById(electronApp, outId) {
    for (let i = 0; i < 20; i += 1) {
        const windows = await electronApp.windows();
        const output = windows.find((w) => String(w.url()).includes(`out=${outId}`));
        if (output)
            return output;
        await sleep(500);
    }
    throw new Error(`Output window ${outId} did not open`);
}
test_1.test.describe('WorshipPresenter E2E', () => {
    (0, test_1.test)('launches app and opens windows', async () => {
        const appPath = path_1.default.resolve(__dirname, '../../');
        const electronApp = await test_1._electron.launch({ args: [appPath] });
        const operator = await getOperatorWindow(electronApp);
        (0, test_1.expect)(operator).toBeTruthy();
        await electronApp.close();
    });
    (0, test_1.test)('BLACK/LOGO/CLEAR buttons exist in operator', async () => {
        const appPath = path_1.default.resolve(__dirname, '../../');
        const electronApp = await test_1._electron.launch({ args: [appPath] });
        const window = await getOperatorWindow(electronApp);
        await (0, test_1.expect)(window.getByRole('button', { name: 'BLACK', exact: true })).toBeVisible();
        await (0, test_1.expect)(window.getByRole('button', { name: 'LOGO', exact: true })).toBeVisible();
        await (0, test_1.expect)(window.getByRole('button', { name: 'CLEAR', exact: true })).toBeVisible();
        await electronApp.close();
    });
    (0, test_1.test)('per-output looks controls are present and interactive', async () => {
        const appPath = path_1.default.resolve(__dirname, '../../');
        const electronApp = await test_1._electron.launch({ args: [appPath] });
        const window = await getOperatorWindow(electronApp);
        await window.getByRole('navigation').getByRole('button', { name: 'Settings' }).click();
        const looksPanel = window.locator('.settings-looks-panel');
        await (0, test_1.expect)(looksPanel.getByText('Per-Output Looks')).toBeVisible();
        await (0, test_1.expect)(looksPanel.locator('.settings-look-card').first()).toBeVisible();
        const backgroundLayerCheckbox = looksPanel.getByLabel('background').first();
        await backgroundLayerCheckbox.check();
        await (0, test_1.expect)(backgroundLayerCheckbox).toBeChecked();
        await electronApp.close();
    });
    (0, test_1.test)('BLACK action propagates to at least one output window', async () => {
        const appPath = path_1.default.resolve(__dirname, '../../');
        const electronApp = await test_1._electron.launch({ args: [appPath] });
        const operator = await getOperatorWindow(electronApp);
        await operator.getByRole('button', { name: 'BLACK', exact: true }).click();
        const outputWindow = await getOutputWindowById(electronApp, 1);
        await (0, test_1.expect)(outputWindow.locator('[data-testid="output-root"]')).toBeVisible({ timeout: 10000 });
        await (0, test_1.expect)(outputWindow.getByTestId('black-mode')).toBeVisible({ timeout: 10000 });
        await electronApp.close();
    });
    (0, test_1.test)('output background color updates from operator state', async () => {
        const appPath = path_1.default.resolve(__dirname, '../../');
        const electronApp = await test_1._electron.launch({ args: [appPath] });
        const operator = await getOperatorWindow(electronApp);
        const outputWindow = await getOutputWindowById(electronApp, 1);
        await (0, test_1.expect)(outputWindow.locator('[data-testid="output-root"]')).toBeVisible({ timeout: 10000 });
        await operator.evaluate(() => {
            const appWindow = window;
            appWindow.worship.outputs.setState(1, {
                slideTitle: 'Color Test',
                theme: { bg: '#123456', color: '#ffffff' }
            });
        });
        await (0, test_1.expect)(outputWindow.locator('[data-testid="output-root"]')).toHaveCSS('background-color', 'rgb(18, 52, 86)', { timeout: 10000 });
        await electronApp.close();
    });
});
