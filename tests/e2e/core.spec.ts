import { test, expect, _electron as electron } from '@playwright/test'
import path from 'path'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function getOperatorWindow(electronApp: any) {
  for (let i = 0; i < 20; i += 1) {
    const windows = await electronApp.windows()
    const operator = windows.find((w: any) => !String(w.url()).includes('out='))
    if (operator) return operator
    await sleep(500)
  }
  throw new Error('Operator window did not open')
}

async function getOutputWindow(electronApp: any) {
  for (let i = 0; i < 20; i += 1) {
    const windows = await electronApp.windows()
    const output = windows.find((w: any) => String(w.url()).includes('out='))
    if (output) return output
    await sleep(500)
  }
  throw new Error('Output window did not open')
}

test.describe('WorshipPresenter E2E', () => {
  test('launches app and opens windows', async () => {
    const appPath = path.resolve(__dirname, '../../')
    const electronApp = await electron.launch({ args: [appPath] })
    const operator = await getOperatorWindow(electronApp)
    expect(operator).toBeTruthy()
    await electronApp.close()
  })

  test('BLACK/LOGO/CLEAR buttons exist in operator', async () => {
    const appPath = path.resolve(__dirname, '../../')
    const electronApp = await electron.launch({ args: [appPath] })
    const window = await getOperatorWindow(electronApp)
    await expect(window.getByRole('button', { name: 'BLACK' })).toBeVisible()
    await expect(window.getByRole('button', { name: 'LOGO' })).toBeVisible()
    await expect(window.getByRole('button', { name: 'CLEAR' })).toBeVisible()
    await electronApp.close()
  })

  test('per-output looks controls are present and interactive', async () => {
    const appPath = path.resolve(__dirname, '../../')
    const electronApp = await electron.launch({ args: [appPath] })
    const window = await getOperatorWindow(electronApp)
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
    const operator = await getOperatorWindow(electronApp)
    await operator.getByRole('button', { name: 'BLACK' }).click()
    const outputWindow = await getOutputWindow(electronApp)
    await expect(outputWindow.getByText(/BLACK/i)).toBeVisible({ timeout: 10_000 })
    await electronApp.close()
  })

  test('output background color updates from operator state', async () => {
    const appPath = path.resolve(__dirname, '../../')
    const electronApp = await electron.launch({ args: [appPath] })
    const operator = await getOperatorWindow(electronApp)
    const outputWindow = await getOutputWindow(electronApp)

    await operator.evaluate(() => {
      const appWindow = window as any
      appWindow.worship.outputs.setState(1, {
        slideTitle: 'Color Test',
        theme: { bg: '#123456', color: '#ffffff' }
      })
    })

    await expect(outputWindow.locator('[data-testid="output-root"]')).toHaveCSS('background-color', 'rgb(18, 52, 86)', { timeout: 10_000 })
    await electronApp.close()
  })
})
