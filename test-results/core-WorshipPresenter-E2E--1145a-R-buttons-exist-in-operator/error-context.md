# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: core.spec.ts >> WorshipPresenter E2E >> BLACK/LOGO/CLEAR buttons exist in operator
- Location: tests\e2e\core.spec.ts:13:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'BLACK' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: 'BLACK' })

```

# Test source

```ts
  1  | import { test, expect, _electron as electron } from '@playwright/test'
  2  | import path from 'path'
  3  | 
  4  | test.describe('WorshipPresenter E2E', () => {
  5  |   test('launches app and opens windows', async () => {
  6  |     const appPath = path.resolve(__dirname, '../../')
  7  |     const electronApp = await electron.launch({ args: [appPath] })
  8  |     const windows = await electronApp.windows()
  9  |     expect(windows.length).toBeGreaterThanOrEqual(1)
  10 |     await electronApp.close()
  11 |   })
  12 | 
  13 |   test('BLACK/LOGO/CLEAR buttons exist in operator', async () => {
  14 |     const appPath = path.resolve(__dirname, '../../')
  15 |     const electronApp = await electron.launch({ args: [appPath] })
  16 |     const window = await electronApp.firstWindow()
> 17 |     await expect(window.getByRole('button', { name: 'BLACK' })).toBeVisible()
     |                                                                 ^ Error: expect(locator).toBeVisible() failed
  18 |     await expect(window.getByRole('button', { name: 'LOGO' })).toBeVisible()
  19 |     await expect(window.getByRole('button', { name: 'CLEAR' })).toBeVisible()
  20 |     await electronApp.close()
  21 |   })
  22 | 
  23 |   test('per-output looks controls are present and interactive', async () => {
  24 |     const appPath = path.resolve(__dirname, '../../')
  25 |     const electronApp = await electron.launch({ args: [appPath] })
  26 |     const window = await electronApp.firstWindow()
  27 |     await window.getByRole('button', { name: 'Settings' }).click()
  28 |     await expect(window.getByText('Per-Output Looks')).toBeVisible()
  29 |     const output1Card = window.getByText('Output 1')
  30 |     await expect(output1Card).toBeVisible()
  31 |     const backgroundLayerCheckbox = window.getByLabel('background').first()
  32 |     await backgroundLayerCheckbox.check()
  33 |     await expect(backgroundLayerCheckbox).toBeChecked()
  34 |     await electronApp.close()
  35 |   })
  36 | 
  37 |   test('BLACK action propagates to at least one output window', async () => {
  38 |     const appPath = path.resolve(__dirname, '../../')
  39 |     const electronApp = await electron.launch({ args: [appPath] })
  40 |     const operator = await electronApp.firstWindow()
  41 |     await operator.getByRole('button', { name: 'BLACK' }).click()
  42 |     const windows = await electronApp.windows()
  43 |     const outputWindow = windows.find((w) => /Output/i.test(String(w.url()))) || windows[1]
  44 |     await expect(outputWindow.getByText(/BLACK/i)).toBeVisible({ timeout: 10_000 })
  45 |     await electronApp.close()
  46 |   })
  47 | 
  48 |   test('output background color updates from operator state', async () => {
  49 |     const appPath = path.resolve(__dirname, '../../')
  50 |     const electronApp = await electron.launch({ args: [appPath] })
  51 |     const operator = await electronApp.firstWindow()
  52 |     const windows = await electronApp.windows()
  53 |     const outputWindow = windows.find((w) => /Output/i.test(String(w.url()))) || windows[1]
  54 | 
  55 |     await operator.evaluate(() => {
  56 |       const appWindow = window as any
  57 |       appWindow.worship.outputs.setState(1, {
  58 |         slideTitle: 'Color Test',
  59 |         theme: { bg: '#123456', color: '#ffffff' }
  60 |       })
  61 |     })
  62 | 
  63 |     await expect(outputWindow.locator('[data-testid="output-root"]')).toHaveCSS('background-color', 'rgb(18, 52, 86)', { timeout: 10_000 })
  64 |     await electronApp.close()
  65 |   })
  66 | })
  67 | 
```