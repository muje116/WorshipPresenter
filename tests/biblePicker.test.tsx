/** @jest-environment jsdom */
import React from 'react'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BiblePicker } from '../src/renderer/app/components/BiblePicker'

describe('BiblePicker', () => {
  test('renders import button and can trigger import path', async () => {
    ;(global as any).window = Object.assign(window, {
      worship: {
        db: { run: jest.fn(async () => [{ code: 'NIV', name: 'NIV' }]) },
        bibles: {
          listTranslations: jest.fn(async () => [{ id: 1, code: 'NIV', name: 'NIV' }]),
          getChapters: jest.fn(async () => [1]),
          getVerses: jest.fn(async () => []),
          openOsisFile: jest.fn(async () => 'C:/tmp/niv.osis'),
          importFromOsis: jest.fn(async () => 7),
          getOnlineSources: jest.fn(async () => []),
          onDownloadProgress: jest.fn(() => jest.fn())
        }
      }
    })
    ;(global as any).alert = jest.fn()
    ;(global as any).prompt = jest.fn(() => 'NIV')

    render(<BiblePicker />)
    const button = await screen.findByRole('button', { name: /import osis bible/i })
    await act(async () => {
      fireEvent.click(button)
    })
    await waitFor(() => expect((window as any).worship.bibles.openOsisFile).toHaveBeenCalled())
  })
})
