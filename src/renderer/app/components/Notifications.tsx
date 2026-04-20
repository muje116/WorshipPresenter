import React from 'react'

export type ToastTone = 'info' | 'success' | 'warn'
export type ToastItem = { id: number; title: string; detail?: string; tone?: ToastTone }

type Props = {
  items: ToastItem[]
  onDismiss: (id: number) => void
}

export const Notifications: React.FC<Props> = ({ items, onDismiss }) => (
  <div className="toast-stack" aria-live="polite" aria-label="Notifications">
    {items.map((item) => (
      <div key={item.id} className={`toast toast-${item.tone || 'info'}`}>
        <div className="toast-content">
          <strong>{item.title}</strong>
          {item.detail ? <small>{item.detail}</small> : null}
        </div>
        <button className="toast-close" onClick={() => onDismiss(item.id)} title="Dismiss notification">x</button>
      </div>
    ))}
  </div>
)
