import React from 'react'

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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
