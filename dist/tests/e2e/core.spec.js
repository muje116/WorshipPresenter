"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const path_1 = __importDefault(require("path"));
test_1.test.describe('WorshipPresenter E2E', () => {
    (0, test_1.test)('launches app and opens windows', async () => {
        const appPath = path_1.default.resolve(__dirname, '../../');
        const electronApp = await test_1._electron.launch({ args: [appPath] });
        const windows = await electronApp.windows();
        (0, test_1.expect)(windows.length).toBeGreaterThanOrEqual(1);
        await electronApp.close();
    });
    (0, test_1.test)('BLACK/LOGO/CLEAR buttons exist in operator', async () => {
        const appPath = path_1.default.resolve(__dirname, '../../');
        const electronApp = await test_1._electron.launch({ args: [appPath] });
        const window = await electronApp.firstWindow();
        await (0, test_1.expect)(window.getByRole('button', { name: 'BLACK' })).toBeVisible();
        await (0, test_1.expect)(window.getByRole('button', { name: 'LOGO' })).toBeVisible();
        await (0, test_1.expect)(window.getByRole('button', { name: 'CLEAR' })).toBeVisible();
        await electronApp.close();
    });
    (0, test_1.test)('per-output looks controls are present and interactive', async () => {
        const appPath = path_1.default.resolve(__dirname, '../../');
        const electronApp = await test_1._electron.launch({ args: [appPath] });
        const window = await electronApp.firstWindow();
        await window.getByRole('button', { name: 'Settings' }).click();
        await (0, test_1.expect)(window.getByText('Per-Output Looks')).toBeVisible();
        const output1Card = window.getByText('Output 1');
        await (0, test_1.expect)(output1Card).toBeVisible();
        const backgroundLayerCheckbox = window.getByLabel('background').first();
        await backgroundLayerCheckbox.check();
        await (0, test_1.expect)(backgroundLayerCheckbox).toBeChecked();
        await electronApp.close();
    });
    (0, test_1.test)('BLACK action propagates to at least one output window', async () => {
        const appPath = path_1.default.resolve(__dirname, '../../');
        const electronApp = await test_1._electron.launch({ args: [appPath] });
        const operator = await electronApp.firstWindow();
        await operator.getByRole('button', { name: 'BLACK' }).click();
        const windows = await electronApp.windows();
        const outputWindow = windows.find((w) => /Output/i.test(String(w.url()))) || windows[1];
        await (0, test_1.expect)(outputWindow.getByText(/BLACK/i)).toBeVisible({ timeout: 10000 });
        await electronApp.close();
    });
});
