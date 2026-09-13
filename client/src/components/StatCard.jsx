/**
 * StatCard — a single metric tile on the dashboard
 * Props: title, value, icon, trend (optional), trendLabel (optional), color (optional)
 */
export default function StatCard({ title, value, icon, trend, trendLabel, color = 'primary' }) {
  const colorMap = {
    primary:   'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    warning:   'bg-warning/10 text-warning',
    danger:    'bg-danger/10 text-danger',
    info:      'bg-info/10 text-info',
  }

  return (
    <div className="card hover:shadow-card-hover transition-shadow duration-200 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 font-body uppercase tracking-wide">{title}</p>
          <p className="mt-2 text-3xl font-stat font-bold text-gray-900">{value}</p>
          {trend !== undefined && (
            <p className={`mt-1 text-xs font-body ${trend >= 0 ? 'text-secondary' : 'text-danger'}`}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% {trendLabel || ''}
            </p>
          )}
        </div>
        <span className={`text-2xl p-3 rounded-xl ${colorMap[color] || colorMap.primary}`}>
          {icon}
        </span>
      </div>
    </div>
  )
}
