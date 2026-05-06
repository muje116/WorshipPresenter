/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { OutputView } from '../src/renderer/app/components/OutputView'
import { useStore } from '../src/renderer/app/store'

describe('OutputView layers', () => {
  test('renders lower thirds layer when enabled', async () => {
    useStore.setState({ looks: { 1: { background: '#222222', template: 'default', layers: ['slide_content', 'lower_thirds'] } } } as any)
    ;(global as any).window = Object.assign(window, {
      worship: {
        outputs: {
          onOutputState: (cb: any) => cb({ outputId: 1, state: { slideTitle: 'Hello', mode: undefined } }),
          setState: () => {}
        }
      }
    })
    render(<OutputView outId={1} />)
    expect(await screen.findByText(/Lower Third:/i)).toBeTruthy()
  })
})
