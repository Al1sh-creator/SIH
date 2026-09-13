import { useState } from 'react'
import { markAlertRead } from '../api/alertApi'

const SEVERITY_MAP = {
  critical: { badge: 'badge-danger',   icon: '🚨', border: 'border-l-danger'   },
  warning:  { badge: 'badge-warning',  icon: '⚠️',  border: 'border-l-warning'  },
  info:     { badge: 'badge-info',     icon: 'ℹ️',  border: 'border-l-info'     },
}

/**
 * AlertCard — displays a single alert
 * Props: alert { id, type, severity, message, created_at, is_read }
 *        onRead (optional callback after marking read)
 *        demo   (boolean — skips API call when true)
 */
export default function AlertCard({ alert, onRead, demo = false }) {
  const [marking, setMarking] = useState(false)
  const [read, setRead]       = useState(alert.is_read)

  const { badge, icon, border } = SEVERITY_MAP[alert.severity] || SEVERITY_MAP.info

  const handleRead = async () => {
    if (read) return
    setMarking(true)
    try {
      if (!demo) await markAlertRead(alert.id)
      setRead(true)
      onRead?.()
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className={`card border-l-4 ${border} animate-slide-up transition-opacity ${read ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">{icon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={badge}>{alert.severity}</span>
              <span className="text-xs text-gray-400 font-mono">
                {new Date(alert.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-gray-800 font-body leading-relaxed">{alert.message}</p>
            <p className="mt-0.5 text-xs text-gray-500 font-body">{alert.type}</p>
          </div>
        </div>

        {!read && (
          <button
            onClick={handleRead}
            disabled={marking}
            id={`btn-mark-read-${alert.id}`}
            className="shrink-0 text-xs text-gray-400 hover:text-primary transition-colors font-body"
          >
            {marking ? '…' : 'Mark read'}
          </button>
        )}
      </div>
    </div>
  )
}
