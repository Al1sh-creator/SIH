import api from './apiClient'

export const getCropsList = (season = '') => api.get(`/api/crops/list${season ? `?season=${season}` : ''}`)

// Body: { farm_id, season, crop_keys[], land_size }
export const compareCrops = (data) => api.post('/api/crops/compare', data)
