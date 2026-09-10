import React from 'react'
import { useStore } from '../store'
import { FitText } from './RichText'

type Props = {
  outId: number
  logoImage?: string
}

type State = {
  slideTitle?: string
  slideHtml?: string
  mode?: string
  mediaPath?: string
  mediaType?: 'image' | 'video'
  alertText?: string
  announcementText?: string
  propsText?: string
  liveVideoLabel?: string
  mediaPlayback?: {
    loop?: boolean
    muted?: boolean
    playbackRate?: number
  }
  theme?: {
    bg?: string
    color?: string
    backgroundImage?: string
    fontSize?: number
    fontFamily?: string
    fontWeight?: number
    textAlign?: 'left' | 'center' | 'right'
    verticalAlign?: 'top' | 'center' | 'bottom'
    textBoxWidth?: number
    textBoxHeight?: number
  }
}

const toFileUrl = (input?: string): string | null => {
  if (!input) return null
  if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('file://')) return input
  const normalized = input.replace(/\\/g, '/')
  const absolutePath = normalized.startsWith('/') ? normalized : `/${normalized}`
  return encodeURI(`file://${absolutePath}`)
}

export const OutputView: React.FC<Props> = ({ outId, logoImage }) => {
  const perOutLook = useStore((state) => state.looks?.[outId]) || {}
  const [state, setState] = React.useState<State>({ slideTitle: 'Idle' })
  const videoRef = React.useRef<HTMLVideoElement | null>(null)

  React.useEffect(() => {
    if ((window as any).worship?.outputs?.onOutputState) {
      (window as any).worship.outputs.onOutputState((payload: any) => {
        if (payload?.outputId === outId && payload?.state) {
          setState(payload.state)
        }
      })
    }
    if ((window as any).worship?.outputs?.onOutputAction) {
      (window as any).worship.outputs.onOutputAction((payload: any) => {
        const action = payload?.action
        if (!action) return
        if (action === 'BLACK') {
          setState((prev) => ({ ...prev, mode: 'black' }))
        } else if (action === 'LOGO') {
          setState((prev) => ({ ...prev, mode: 'logo' }))
        } else if (action === 'CLEAR') {
          setState((prev) => ({ ...prev, mode: undefined }))
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
  const slideContent = state?.slideHtml ?? slide
  const theme = state?.theme
  const lookBg = perOutLook.background

  // Determine background
  const bgImage = state?.mediaPath || theme?.backgroundImage
  const bgColor = lookBg ?? theme?.bg ?? (mode === 'black' ? '#000' : '#111')
  const textColor = theme?.color ?? '#fff'
  const fontSize = theme?.fontSize ?? 48
  const fontFamily = theme?.fontFamily ?? 'Manrope'
  const fontWeight = theme?.fontWeight ?? 700
  const textAlign = theme?.textAlign ?? 'center'
  const verticalAlign = theme?.verticalAlign ?? 'center'
  const textBoxWidth = theme?.textBoxWidth ?? 90
  const textBoxHeight = theme?.textBoxHeight ?? 70
  const mediaPlayback = state?.mediaPlayback || {}
  const propsText = state?.propsText || slide
  const announcementText = state?.announcementText || slide
  const alertText = state?.alertText || slide
  const liveVideoLabel = state?.liveVideoLabel || 'Live Camera'

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = mediaPlayback.playbackRate || 1
    }
  }, [mediaPlayback.playbackRate, state?.mediaPath])

  // Check if background is a video
  const inferredType = state?.mediaType || (bgImage && (bgImage.endsWith('.mp4') || bgImage.endsWith('.mov') || bgImage.endsWith('.webm') || bgImage.endsWith('.mkv') || bgImage.endsWith('.avi') ? 'video' : 'image'))
  const isVideo = inferredType === 'video'

  // Convert file path to file:// URL if needed
  const bgImageUrl = toFileUrl(bgImage)
  const layers = perOutLook.layers || ['background', 'media', 'slide_content']
  const has = (layer: string) => layers.includes(layer)

  return (
    <div
      data-testid="output-root"
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
          ref={videoRef}
          src={bgImageUrl}
          autoPlay
          loop={mediaPlayback.loop !== false}
          muted={mediaPlayback.muted !== false}
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
      {(has('announcements') || has('props_overlays') || has('slide_content')) && (bgImageUrl || mode === 'black') && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: mode === 'black'
              ? 'linear-gradient(180deg, rgba(0,0,0,0.92), rgba(0,0,0,0.7))'
              : 'linear-gradient(180deg, rgba(12,18,32,0.35), rgba(0,0,0,0.55))',
            zIndex: 1
          }}
        />
      )}

      {/* Layer: announcements */}
      {has('announcements') && (
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 5,
            padding: '8px 16px',
            borderRadius: 999,
            background: 'rgba(12, 18, 32, 0.82)',
            border: '1px solid rgba(187, 195, 255, 0.25)',
            color: '#fff',
            fontSize: 13,
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}
        >
          Announcements: {announcementText}
        </div>
      )}

      {/* Layer: slide_content */}
      {has('slide_content') && <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          textAlign: 'center',
          display: 'flex',
          alignItems: verticalAlign === 'top' ? 'flex-start' : verticalAlign === 'bottom' ? 'flex-end' : 'center',
          justifyContent: 'center',
          padding: '40px 60px',
          maxWidth: '100%',
          textShadow: '2px 2px 8px rgba(0,0,0,0.8)'
        }}
      >
        {mode === 'black' ? (
          <div data-testid="black-mode" style={{ fontSize: 72, fontWeight: 700 }}>
            BLACK
          </div>
        ) : mode === 'logo' ? (
          logoImage ? (
            <img
              src={toFileUrl(logoImage) || logoImage}
              alt="Church logo"
              style={{ maxWidth: '60%', maxHeight: '60%', objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.35))' }}
            />
          ) : (
            <div style={{ fontSize: 72, fontWeight: 700 }}>
              Church Logo
            </div>
          )
        ) : (
          <FitText
            value={slideContent}
            className="output-fit"
            baseFontSize={fontSize}
            minFontSize={12}
            lineHeight={1.22}
            fontFamily={fontFamily}
            fontWeight={fontWeight}
            textAlign={textAlign}
            verticalAlign={verticalAlign}
            textBoxWidth={textBoxWidth}
            textBoxHeight={textBoxHeight}
            style={{ color: textColor }}
            aria-label={`Output ${outId} slide content`}
          />
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
          Lower Third: {propsText}
        </div>
      )}

      {/* Layer: props_overlays */}
      {has('props_overlays') && mode !== 'black' && (
        <div style={{ position: 'absolute', left: 18, top: 58, zIndex: 5, minWidth: 160, maxWidth: '42%', padding: '8px 12px', borderRadius: 8, background: 'rgba(19, 27, 46, 0.85)', border: '1px solid rgba(187, 195, 255, 0.18)', color: '#fff', fontSize: 12, lineHeight: 1.35, boxShadow: '0 8px 18px rgba(0,0,0,0.22)' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aeb8df', marginBottom: 4 }}>Props</div>
          <div>{propsText}</div>
        </div>
      )}

      {/* Layer: live_video (preview feed) */}
      {has('live_video') && (
        <div style={{ position: 'absolute', right: 18, bottom: 18, zIndex: 5, width: 250, height: 140, borderRadius: 12, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(5,8,15,0.72)', overflow: 'hidden', boxShadow: '0 10px 24px rgba(0,0,0,0.28)' }}>
          <div style={{ position: 'absolute', inset: 0, background: bgImageUrl && isVideo ? 'rgba(0,0,0,0.18)' : 'linear-gradient(135deg, rgba(63,81,181,0.22), rgba(0,0,0,0.45))' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 12, color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c8d0f0' }}>
              <span>Live Feed</span>
              <span style={{ padding: '3px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.12)' }}>On Air</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>{liveVideoLabel}</div>
            <div style={{ fontSize: 11, color: '#c6cde8' }}>{bgImageUrl ? 'Media feed ready' : 'Camera input placeholder'}</div>
          </div>
          {bgImageUrl && isVideo && (
            <video
              src={bgImageUrl}
              autoPlay
              loop={mediaPlayback.loop !== false}
              muted={mediaPlayback.muted !== false}
              playsInline
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}
            />
          )}
        </div>
      )}

      {/* Layer: alerts */}
      {has('alerts') && (
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 6, minWidth: 180, maxWidth: '42%', background: 'linear-gradient(180deg, rgba(229,72,77,0.96), rgba(170,26,32,0.96))', color: '#fff', padding: '8px 10px', borderRadius: 8, fontSize: 12, boxShadow: '0 10px 20px rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.9, marginBottom: 4 }}>Alert</div>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>{alertText}</div>
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
