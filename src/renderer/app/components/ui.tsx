import React from 'react'

export type IconName =
  | 'console'
  | 'library'
  | 'editor'
  | 'scripture'
  | 'media'
  | 'settings'
  | 'help'
  | 'spark'
  | 'search'
  | 'plus'
  | 'send'
  | 'black'
  | 'logo'
  | 'clear'
  | 'pause'
  | 'stop'
  | 'queue'
  | 'chevron'
  | 'folder'
  | 'upload'
  | 'grid'
  | 'list'
  | 'more'
  | 'play'
  | 'check'
  | 'monitor'
  | 'sync'
  | 'eye'
  | 'save'
  | 'trash'
  | 'undo'
  | 'redo'
  | 'type'
  | 'palette'
  | 'info'
  | 'clock'
  | 'external'
  | 'globe'

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  console: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h4M7 12h10M7 16h6M16 8h2" /></>,
  library: <><path d="M5 4.5h13a1 1 0 0 1 1 1v14H6a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2Z" /><path d="M6 17.5h13M8 8h7M8 11.5h7" /></>,
  editor: <><path d="m4 17.5-.8 3.3 3.3-.8L19 7.5a2.3 2.3 0 0 0-3.3-3.3L4 17.5Z" /><path d="m14 5 3 3" /></>,
  scripture: <><path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" /><path d="M8 7h6M8 10.5h6M8 14h4" /><path d="M17 7h2v13h-9" /></>,
  media: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="9" r="1.3" /><path d="m4 17 5-5 3 3 2-2 6 5" /></>,
  settings: <><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /><path d="m19.4 15 .1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3.1 1.3v.2a1.8 1.8 0 1 1-3.6 0v-.2a1.8 1.8 0 0 0-3.1-1.3l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1A1.8 1.8 0 0 0 3.3 12a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 1.3-3.1l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1A1.8 1.8 0 0 0 10.4 3h.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3.1 1.3l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 1.3 3.1h.2a1.8 1.8 0 1 1 0 3.6h-.2a1.8 1.8 0 0 0-1.7 1.3Z" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.5 2.5 0 1 1 4.5 1.5c-.9 1.1-2.2 1.3-2.2 3M12 17h.01" /></>,
  spark: <><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.5 4.5" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  send: <><path d="m21 3-8.5 18-2.3-7.2L3 11.5 21 3Z" /><path d="M10.2 13.8 21 3" /></>,
  black: <><rect x="4" y="4" width="16" height="16" rx="2" /></>,
  logo: <><path d="M4 18V7l4 3 4-6 4 6 4-3v11l-4-2-4 2-4-2-4 2Z" /></>,
  clear: <><path d="m7 7 10 10M17 7 7 17" /><circle cx="12" cy="12" r="9" /></>,
  pause: <><rect x="6" y="5" width="3.5" height="14" rx="1" /><rect x="14.5" y="5" width="3.5" height="14" rx="1" /></>,
  stop: <><rect x="5" y="5" width="14" height="14" rx="2" /></>,
  queue: <><path d="M5 6h14M5 12h14M5 18h9" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
  chevron: <path d="m9 6 6 6-6 6" />,
  folder: <><path d="M3.5 6.5h6l1.8 2h9.2v9a2 2 0 0 1-2 2h-15v-13Z" /><path d="M3.5 9h17" /></>,
  upload: <><path d="M12 15V4M8 8l4-4 4 4M5 14v5h14v-5" /></>,
  grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
  list: <><path d="M8 6h12M8 12h12M8 18h12" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
  play: <path d="m8 5 11 7-11 7V5Z" />,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  monitor: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
  sync: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.2 9A7 7 0 0 1 18.8 7M17.8 15A7 7 0 0 1 5.2 17" /></>,
  eye: <><path d="M2.5 12s3.2-5 9.5-5 9.5 5 9.5 5-3.2 5-9.5 5-9.5-5-9.5-5Z" /><circle cx="12" cy="12" r="2.3" /></>,
  save: <><path d="M5 4h12l2 2v14H5V4Z" /><path d="M8 4v6h8V4M8 16h8" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></>,
  undo: <><path d="M9 7 4 12l5 5" /><path d="M5 12h8a6 6 0 0 1 6 6" /></>,
  redo: <><path d="m15 7 5 5-5 5" /><path d="M19 12h-8a6 6 0 0 0-6 6" /></>,
  type: <><path d="M5 6V4h14v2M12 4v16M8 20h8" /></>,
  palette: <><path d="M12 3a9 9 0 0 0 0 18h1.2a1.8 1.8 0 0 0 1.1-3.2 1.8 1.8 0 0 1 1.1-3.2H17a4 4 0 0 0 4-4A7.6 7.6 0 0 0 12 3Z" /><circle cx="7.5" cy="11" r=".8" fill="currentColor" stroke="none" /><circle cx="9" cy="7.5" r=".8" fill="currentColor" stroke="none" /><circle cx="14" cy="7" r=".8" fill="currentColor" stroke="none" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.2 2.5 3.2 5.5 3.2 9s-1 6.5-3.2 9c-2.2-2.5-3.2-5.5-3.2-9S9.8 5.5 12 3Z" /></>,
}

export const AppIcon: React.FC<{ name: IconName; size?: number; className?: string; strokeWidth?: number }> = ({
  name,
  size = 16,
  className = '',
  strokeWidth = 1.8,
}) => (
  <svg
    className={`app-icon ${className}`.trim()}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {ICON_PATHS[name]}
  </svg>
)

type BaseProps = {
  children: React.ReactNode
  className?: string
}

export const Panel: React.FC<BaseProps & React.HTMLAttributes<HTMLElement>> = ({ children, className = '', ...rest }) => (
  <section className={`panel ${className}`.trim()} {...rest}>{children}</section>
)

export const SectionHeader: React.FC<{ title: string; meta?: string; action?: React.ReactNode }> = ({ title, meta, action }) => (
  <div className="panel-header">
    <h3>{title}</h3>
    <div className="section-header-tools">
      {meta ? <span>{meta}</span> : null}
      {action}
    </div>
  </div>
)

export const Pill: React.FC<BaseProps> = ({ children, className = '' }) => <span className={`ui-pill ${className}`.trim()}>{children}</span>

export const Chip: React.FC<BaseProps> = ({ children, className = '' }) => <span className={`chip ${className}`.trim()}>{children}</span>

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...rest }) => (
  <button className={`icon-button ${className}`.trim()} {...rest} />
)

export const GradientButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...rest }) => (
  <button className={`live-button ${className}`.trim()} {...rest} />
)

export const MediaCard: React.FC<{ title: string; subtitle?: string; active?: boolean; onClick?: () => void }> = ({ title, subtitle, active, onClick }) => (
  <article className={`media-card ${active ? 'live' : ''}`} onClick={onClick}>
    <div className="media-thumb"><span>{title.slice(0, 1).toUpperCase()}</span></div>
    <div className="media-meta"><strong>{title}</strong>{subtitle ? <small>{subtitle}</small> : null}</div>
  </article>
)

export const InspectorCard: React.FC<BaseProps> = ({ children, className = '' }) => <div className={`meta-card ${className}`.trim()}>{children}</div>

export const StatusBadge: React.FC<BaseProps & { tone?: 'live' | 'success' | 'neutral' }> = ({ children, className = '', tone = 'neutral' }) => (
  <span className={`status-badge status-badge-${tone} ${className}`.trim()}>
    {tone === 'live' ? <span className="status-badge-dot" /> : null}
    {children}
  </span>
)
