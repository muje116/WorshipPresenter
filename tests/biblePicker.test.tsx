/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BiblePicker } from '../src/renderer/app/components/BiblePicker'

describe('BiblePicker', () => {
  test('renders import button and can trigger import path', async () => {
    ;(global as any).window = Object.assign(window, {
      worship: {
        db: { run: jest.fn(async () => [{ code: 'NIV', name: 'NIV' }]) },
        bibles: {
          openOsisFile: jest.fn(async () => 'C:/tmp/niv.osis'),
          importFromOsis: jest.fn(async () => 7)
        }
      }
    })
    ;(global as any).alert = jest.fn()

    render(<BiblePicker />)
    const button = await screen.findByRole('button', { name: /load osis bible/i })
    fireEvent.click(button)
    expect((window as any).worship.bibles.openOsisFile).toHaveBeenCalled()
  })
})
