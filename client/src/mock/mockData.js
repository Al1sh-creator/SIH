// ─── Mock data for Demo Mode ─────────────────────────────────────────────
// Used when VITE_DEMO_MODE=true or when the backend isn't running yet.

export const MOCK_USER = {
  id: 1,
  name: 'Ramesh Patel',
  email: 'ramesh@farmsense.ai',
  phone: '+91 98765 43210',
  is_admin: true,
}

export const MOCK_FARM = {
  id: 1,
  name: "Patel Farm",
  state: "Gujarat",
  district: "Anand",
  taluka: "Anklav",
  village: "Karamsad",
  pincode: "388325",
  soil_type: "Black",
  total_area_acres: 8,
  latitude: 22.47,
  longitude: 72.96,
  fields: [
    { id: 1, name: "North Field",  crop_name: "Kapas",    crop_stage: "flowering", area_acres: 3, soil_type: "Black" },
    { id: 2, name: "South Field",  crop_name: "Moong",    crop_stage: "growing",   area_acres: 2.5, soil_type: "Black" },
    { id: 3, name: "West Field",   crop_name: "Groundnut", crop_stage: "sowing",   area_acres: 2.5, soil_type: "Red" },
  ],
}

export const MOCK_WEATHER = [
  { date: new Date(Date.now() + 0 * 86400000).toISOString(), condition: "sunny",   temp_max: 34, temp_min: 24, rainfall: 0  },
  { date: new Date(Date.now() + 1 * 86400000).toISOString(), condition: "cloudy",  temp_max: 31, temp_min: 23, rainfall: 0  },
  { date: new Date(Date.now() + 2 * 86400000).toISOString(), condition: "rain",    temp_max: 27, temp_min: 22, rainfall: 12 },
  { date: new Date(Date.now() + 3 * 86400000).toISOString(), condition: "thunder", temp_max: 25, temp_min: 21, rainfall: 28 },
  { date: new Date(Date.now() + 4 * 86400000).toISOString(), condition: "shower",  temp_max: 28, temp_min: 22, rainfall: 6  },
  { date: new Date(Date.now() + 5 * 86400000).toISOString(), condition: "sunny",   temp_max: 33, temp_min: 24, rainfall: 0  },
  { date: new Date(Date.now() + 6 * 86400000).toISOString(), condition: "sunny",   temp_max: 35, temp_min: 25, rainfall: 0  },
]

export const MOCK_ALERTS = [
  {
    id: 1, severity: "critical", type: "Heavy Rainfall",
    message: "28mm rainfall expected this Thursday. Your Kapas in North Field is at flowering stage — consider early harvest or protect with drainage.",
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(), is_read: false,
  },
  {
    id: 2, severity: "warning", type: "Heat Stress",
    message: "Temperature may reach 42°C on Sunday. Irrigate your Moong field in early morning (before 7am) to reduce heat stress.",
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(), is_read: false,
  },
  {
    id: 3, severity: "info", type: "Pest Risk",
    message: "Moderate aphid risk detected for Kapas at flowering stage. Check undersides of leaves. Apply neem oil if infestation found.",
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(), is_read: true,
  },
  {
    id: 4, severity: "warning", type: "Soil Moisture",
    message: "Soil moisture low in West Field (Groundnut at sowing stage). Irrigate within 24 hours for proper germination.",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(), is_read: true,
  },
]

export const MOCK_SUGGESTIONS = [
  {
    id: 1, category: "irrigation", priority: "high",
    title: "Irrigate North Field before Thursday rain",
    suggestion_text: "Your Kapas is at flowering stage and needs consistent moisture. Irrigate today (Tue) so the crop is not stressed before the storm hits Thursday.",
    created_at: new Date().toISOString(),
  },
  {
    id: 2, category: "fertilizer", priority: "medium",
    title: "Apply Urea to Moong in South Field",
    suggestion_text: "Moong at growing stage typically needs a nitrogen top-dressing. Apply 20kg Urea/acre this week. Avoid applying if rain is forecast within 24 hours.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3, category: "pest_risk", priority: "high",
    title: "Scout Kapas for Bollworm",
    suggestion_text: "Current temperature and humidity profile matches peak bollworm activity window. Check 10 random plants per field. If >5% damage, apply recommended pesticide.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 4, category: "harvest", priority: "low",
    title: "Groundnut harvest window: 3-4 weeks",
    suggestion_text: "Based on your sowing date and current growing conditions, expected harvest window is mid-August. Monitor for pod fill completion.",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 5, category: "irrigation", priority: "medium",
    title: "Skip irrigation on rain days",
    suggestion_text: "Skip Wednesday and Thursday irrigation for all fields. Forecasted 28mm rainfall will adequately cover crop water needs.",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
]

export const MOCK_CROP_COMPARISON = [
  { crop_name: "Moong",     suitability_score: 0.92, yield_quintal: 8.4,  profit_per_acre: 18400, market_price: 7800 },
  { crop_name: "Kapas",     suitability_score: 0.78, yield_quintal: 14.2, profit_per_acre: 14200, market_price: 6500 },
  { crop_name: "Groundnut", suitability_score: 0.65, yield_quintal: 12.8, profit_per_acre: 11800, market_price: 5500 },
  { crop_name: "Bajra",     suitability_score: 0.58, yield_quintal: 18.0, profit_per_acre: 8900,  market_price: 2400 },
]

export const MOCK_HISTORY_ALERTS = [
  {
    id: 5, severity: "critical", type: "Frost Risk",
    message: "Temperature dropped to 4°C last Tuesday. Frost protection measures advised for Rabi crops.",
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(), is_read: true,
  },
  {
    id: 6, severity: "warning", type: "Wind Speed",
    message: "Strong winds (45 km/h) expected. Stake tall crops to prevent lodging.",
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(), is_read: true,
  },
]
