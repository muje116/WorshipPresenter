import React from 'react'
import { useStore } from '../store'

type Props = {
  outId: number
}

type State = {
  slideTitle?: string
  mode?: string
  theme?: {
    bg?: string
    color?: string
    backgroundImage?: string
    fontSize?: number
  }
}

export const OutputView: React.FC<Props> = ({ outId }) => {
  const perOutLook = useStore((state) => state.looks?.[outId]) || {}
  const [state, setState] = React.useState<State>({ slideTitle: 'Idle' })

  React.useEffect(() => {
    if ((window as any).worship?.outputs?.onOutputState) {
      (window as any).worship.outputs.onOutputState((payload: any) => {
        if (payload?.outputId === outId && payload?.state) {
          setState(payload.state)
        }
      })
    }
    // Initialize
    if ((window as any).worship?.outputs?.setState) {
      (window as any).worship.outputs.setState(outId, { slideTitle: 'Idle' })
    }
  }, [outId])

  const mode = state?.mode
  const slide = state?.slideTitle ?? 'Idle'
  const theme = state?.theme
  const lookBg = perOutLook.background

  // Determine background
  const bgImage = theme?.backgroundImage
  const bgColor = lookBg ?? theme?.bg ?? (mode === 'black' ? '#000' : '#111')
  const textColor = theme?.color ?? '#fff'
  const fontSize = theme?.fontSize ?? 48

  // Check if background is a video
  const isVideo = bgImage && (bgImage.endsWith('.mp4') || bgImage.endsWith('.mov') || bgImage.endsWith('.webm'))

  // Convert file path to file:// URL if needed
  const bgImageUrl = bgImage ? (bgImage.startsWith('http') || bgImage.startsWith('file://') ? bgImage : `file://${bgImage}`) : null

  return (
    <div
      style={{
        height: '100vh',
        width: '100%',
        backgroundColor: bgColor,
        color: textColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Image */}
      {bgImageUrl && !isVideo && (
        <img
          src={bgImageUrl}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )}

      {/* Background Video */}
      {bgImageUrl && isVideo && (
        <video
          src={bgImageUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )}

      {/* Overlay for better text readability */}
      {(bgImageUrl || mode === 'black') && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: mode === 'black' ? '#000' : 'rgba(0,0,0,0.4)',
            zIndex: 1
          }}
        />
      )}

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          padding: '40px 60px',
          maxWidth: '90%',
          textShadow: '2px 2px 8px rgba(0,0,0,0.8)'
        }}
      >
        {mode === 'black' ? (
          <div style={{ fontSize: 72, fontWeight: 700 }}>
            BLACK
          </div>
        ) : mode === 'logo' ? (
          <div style={{ fontSize: 72, fontWeight: 700 }}>
            Church Logo
          </div>
        ) : (
          <div
            style={{
              fontSize: fontSize,
              fontWeight: 700,
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap'
            }}
          >
            {slide}
          </div>
        )}
      </div>

      {/* Debug info (top left corner, very subtle) */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 12,
          fontSize: 10,
          opacity: 0.3,
          color: '#888',
          zIndex: 10
        }}
      >
        Output {outId} {mode ? `| ${mode.toUpperCase()}` : ''}
      </div>
    </div>
  )
}
