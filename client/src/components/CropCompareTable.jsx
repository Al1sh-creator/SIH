import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

/**
 * CropCompareTable — comparison table + bar chart
 * Props: results [] — array of {
 *   crop_name, suitability_score, yield_quintal, profit_per_acre, market_price
 * }
 */
export default function CropCompareTable({ results = [] }) {
  if (!results.length) return null

  // Normalize data to handle both mock format and real backend format
  const normalizedResults = results.map(r => ({
    crop_name: r.crop_name,
    suitability_score: r.soil_suitability_score !== undefined ? r.soil_suitability_score : Math.round(r.suitability_score * 100),
    yield_quintal: r.total_yield_quintal ?? r.yield_quintal,
    profit_per_acre: r.net_profit ?? r.profit_per_acre,
    market_price: r.market_price_per_quintal ?? r.market_price,
  }))

  const chartData = normalizedResults.map((r) => ({
    name: r.crop_name,
    Yield: r.yield_quintal,
    Profit: r.profit_per_acre,
    Score: r.suitability_score,
  }))

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm font-body">
          <thead className="bg-background border-b border-gray-100">
            <tr>
              {['Crop', 'Suitability', 'Yield (q/acre)', 'Profit (₹/acre)', 'Market Price'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {normalizedResults.map((r, i) => (
              <tr key={r.crop_name} className={`hover:bg-background transition-colors ${i === 0 ? 'bg-light/40' : ''}`}>
                <td className="px-5 py-3.5 font-semibold text-gray-800">
                  {i === 0 && <span className="mr-1.5">🥇</span>}
                  {r.crop_name}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[80px]">
                      <div
                        className="bg-secondary h-1.5 rounded-full"
                        style={{ width: `${r.suitability_score}%` }}
                      />
                    </div>
                    <span className="font-stat text-gray-700">
                      {r.suitability_score}%
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 font-stat text-gray-700">{r.yield_quintal}</td>
                <td className="px-5 py-3.5 font-stat font-semibold text-primary">
                  ₹{r.profit_per_acre?.toLocaleString('en-IN')}
                </td>
                <td className="px-5 py-3.5 font-stat text-gray-600">
                  ₹{r.market_price?.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar chart */}
      <div className="card">
        <h3 className="font-heading font-semibold text-gray-800 mb-4">Profit & Yield Comparison</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'Inter' }} />
            <YAxis tick={{ fontSize: 12, fontFamily: 'JetBrains Mono' }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Profit" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Yield" fill="#52B788" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Score" fill="#4361EE" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
