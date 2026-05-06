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
    fontFamily?: string
    fontWeight?: number
    textAlign?: 'left' | 'center' | 'right'
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
  const fontFamily = theme?.fontFamily ?? 'Manrope'
  const fontWeight = theme?.fontWeight ?? 700
  const textAlign = theme?.textAlign ?? 'center'

  // Check if background is a video
  const isVideo = bgImage && (bgImage.endsWith('.mp4') || bgImage.endsWith('.mov') || bgImage.endsWith('.webm'))

  // Convert file path to file:// URL if needed
  const bgImageUrl = bgImage ? (bgImage.startsWith('http') || bgImage.startsWith('file://') ? bgImage : `file://${bgImage}`) : null
  const layers = perOutLook.layers || ['slide_content']
  const has = (layer: string) => layers.includes(layer)

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
      {/* Layer: background/image */}
      {has('background') && bgImageUrl && !isVideo && (
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

      {/* Layer: media/video */}
      {has('media') && bgImageUrl && isVideo && (
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

      {/* Layer: announcements / overlays readability */}
      {(has('announcements') || has('props_overlays')) && (bgImageUrl || mode === 'black') && (
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

      {/* Layer: slide_content */}
      {has('slide_content') && <div
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
              fontFamily,
              fontWeight,
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
              textAlign
            }}
          >
            {slide}
          </div>
        )}
      </div>}

      {/* Layer: lower_thirds */}
      {has('lower_thirds') && mode !== 'black' && (
        <div
          style={{
            position: 'absolute',
            left: 32,
            right: 32,
            bottom: 24,
            zIndex: 4,
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 18,
            color: '#fff'
          }}
        >
          Lower Third: {slide}
        </div>
      )}

      {/* Layer: props_overlays */}
      {has('props_overlays') && mode !== 'black' && (
        <div style={{ position: 'absolute', left: 16, top: 48, zIndex: 5, padding: '6px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 12 }}>
          Props Overlay
        </div>
      )}

      {/* Layer: live_video (placeholder for camera/NDI feed) */}
      {has('live_video') && (
        <div style={{ position: 'absolute', right: 16, bottom: 16, zIndex: 5, width: 220, height: 124, borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d7e3ff', fontSize: 12 }}>
          Live Video Layer
        </div>
      )}

      {/* Layer: alerts */}
      {has('alerts') && (
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 6, background: '#ff5252', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>
          Alert Layer
        </div>
      )}

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
