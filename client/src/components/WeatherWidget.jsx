const WEATHER_ICONS = {
  clear:    '☀️', sunny: '☀️',
  cloudy:   '☁️', overcast: '☁️',
  rain:     '🌧️', drizzle: '🌦️', shower: '🌦️',
  thunder:  '⛈️', storm: '⛈️',
  fog:      '🌫️', mist: '🌫️',
  snow:     '❄️',
  wind:     '💨',
}

function getIcon(condition = '') {
  const key = Object.keys(WEATHER_ICONS).find((k) =>
    condition.toLowerCase().includes(k)
  )
  return WEATHER_ICONS[key] || '🌤️'
}

/**
 * WeatherWidget — 16-Day Forecast strip
 * Props: forecast [] — array of { date, condition, temp_max, temp_min, rainfall }
 */
export default function WeatherWidget({ forecast = [] }) {
  if (!forecast.length) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="flex gap-3 overflow-x-auto pb-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="shrink-0 w-16 h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card animate-slide-up">
      <h3 className="font-heading font-semibold text-gray-800 mb-4">16-Day Forecast</h3>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {forecast.map((day, i) => {
          const date  = new Date(day.date)
          const label = i === 0 ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'short' })

          return (
            <div
              key={day.date}
              className="shrink-0 flex flex-col items-center gap-1.5 bg-background rounded-xl px-3 py-3 min-w-[64px]"
            >
              <p className="text-[11px] font-medium text-gray-500 font-body">{label}</p>
              <span className="text-2xl">{getIcon(day.condition)}</span>
              <p className="text-sm font-stat font-bold text-gray-800">{day.temp_max}°</p>
              <p className="text-[11px] text-gray-400 font-stat">{day.temp_min}°</p>
              {day.rainfall > 0 && (
                <p className="text-[10px] text-info font-mono">💧{day.rainfall}mm</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
