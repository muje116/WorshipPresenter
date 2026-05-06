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
                    openOsisFile: jest.fn(async () => 'C:/tmp/niv.osis'),
                    importFromOsis: jest.fn(async () => 7)
                }
            }
        });
        global.alert = jest.fn();
        (0, react_1.render)((0, jsx_runtime_1.jsx)(BiblePicker_1.BiblePicker, {}));
        const button = await react_1.screen.findByRole('button', { name: /load osis bible/i });
        react_1.fireEvent.click(button);
        expect(window.worship.bibles.openOsisFile).toHaveBeenCalled();
    });
});
