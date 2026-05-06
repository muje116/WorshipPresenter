"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
const OutputView_1 = require("../src/renderer/app/components/OutputView");
const store_1 = require("../src/renderer/app/store");
describe('OutputView layers', () => {
    test('renders lower thirds layer when enabled', async () => {
        store_1.useStore.setState({ looks: { 1: { background: '#222222', template: 'default', layers: ['slide_content', 'lower_thirds'] } } });
        global.window = Object.assign(window, {
            worship: {
                outputs: {
                    onOutputState: (cb) => cb({ outputId: 1, state: { slideTitle: 'Hello', mode: undefined } }),
                    setState: () => { }
                }
            }
        });
        (0, react_1.render)((0, jsx_runtime_1.jsx)(OutputView_1.OutputView, { outId: 1 }));
        expect(await react_1.screen.findByText(/Lower Third:/i)).toBeTruthy();
    });
});
