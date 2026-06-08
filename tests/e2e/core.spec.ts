import { test, expect, _electron as electron } from '@playwright/test'
import path from 'path'

test.describe('WorshipPresenter E2E', () => {
  test('launches app and opens windows', async () => {
    const appPath = path.resolve(__dirname, '../../')
    const electronApp = await electron.launch({ args: [appPath] })
    const windows = await electronApp.windows()
    expect(windows.length).toBeGreaterThanOrEqual(1)
    await electronApp.close()
  })

  test('BLACK/LOGO/CLEAR buttons exist in operator', async () => {
    const appPath = path.resolve(__dirname, '../../')
    const electronApp = await electron.launch({ args: [appPath] })
    const window = await electronApp.firstWindow()
    await expect(window.getByRole('button', { name: 'BLACK' })).toBeVisible()
    await expect(window.getByRole('button', { name: 'LOGO' })).toBeVisible()
    await expect(window.getByRole('button', { name: 'CLEAR' })).toBeVisible()
    await electronApp.close()
  })

  test('per-output looks controls are present and interactive', async () => {
    const appPath = path.resolve(__dirname, '../../')
    const electronApp = await electron.launch({ args: [appPath] })
    const window = await electronApp.firstWindow()
    await window.getByRole('button', { name: 'Settings' }).click()
    await expect(window.getByText('Per-Output Looks')).toBeVisible()
    const output1Card = window.getByText('Output 1')
    await expect(output1Card).toBeVisible()
    const backgroundLayerCheckbox = window.getByLabel('background').first()
    await backgroundLayerCheckbox.check()
    await expect(backgroundLayerCheckbox).toBeChecked()
    await electronApp.close()
  })

  test('BLACK action propagates to at least one output window', async () => {
    const appPath = path.resolve(__dirname, '../../')
    const electronApp = await electron.launch({ args: [appPath] })
    const operator = await electronApp.firstWindow()
    await operator.getByRole('button', { name: 'BLACK' }).click()
    const windows = await electronApp.windows()
    const outputWindow = windows.find((w) => /Output/i.test(String(w.url()))) || windows[1]
    await expect(outputWindow.getByText(/BLACK/i)).toBeVisible({ timeout: 10_000 })
    await electronApp.close()
  })

  test('output background color updates from operator state', async () => {
    const appPath = path.resolve(__dirname, '../../')
    const electronApp = await electron.launch({ args: [appPath] })
    const operator = await electronApp.firstWindow()
    const windows = await electronApp.windows()
    const outputWindow = windows.find((w) => /Output/i.test(String(w.url()))) || windows[1]

    await operator.evaluate(() => {
      window.worship.outputs.setState(1, {
        slideTitle: 'Color Test',
        theme: { bg: '#123456', color: '#ffffff' }
      })
    })

    await expect(outputWindow.locator('[data-testid="output-root"]')).toHaveCSS('background-color', 'rgb(18, 52, 86)', { timeout: 10_000 })
    await electronApp.close()
  })
})
