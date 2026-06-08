"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
const BiblePicker_1 = require("../src/renderer/app/components/BiblePicker");
describe('BiblePicker', () => {
    test('renders import button and can trigger import path', async () => {
        ;
        global.window = Object.assign(window, {
            worship: {
                db: { run: jest.fn(async () => [{ code: 'NIV', name: 'NIV' }]) },
                bibles: {
                    listTranslations: jest.fn(async () => [{ id: 1, code: 'NIV', name: 'NIV' }]),
                    getChapters: jest.fn(async () => [1]),
                    getVerses: jest.fn(async () => []),
                    openOsisFile: jest.fn(async () => 'C:/tmp/niv.osis'),
                    importFromOsis: jest.fn(async () => 7)
                }
            }
        });
        global.alert = jest.fn();
        global.prompt = jest.fn(() => 'NIV');
        (0, react_1.render)((0, jsx_runtime_1.jsx)(BiblePicker_1.BiblePicker, {}));
        const button = await react_1.screen.findByRole('button', { name: /import osis bible/i });
        await (0, react_1.act)(async () => {
            react_1.fireEvent.click(button);
        });
        await (0, react_1.waitFor)(() => expect(window.worship.bibles.openOsisFile).toHaveBeenCalled());
    });
});
