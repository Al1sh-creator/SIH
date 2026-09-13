import api from './apiClient'

export const createFarm        = (data)     => api.post('/api/farm/setup', data)
export const getMyFarm         = ()         => api.get('/api/farm/me')
export const updateFarm        = (data)     => api.put('/api/farm/update', data)
export const updateSoilProfile = (data)     => api.put('/api/farm/soil-profile', data)

// Fields
export const addField    = (farmId, data) => api.post(`/api/farm/${farmId}/fields`, data)
export const getFields   = (farmId)       => api.get(`/api/farm/${farmId}/fields`)
export const updateField = (id, data)     => api.put(`/api/fields/update/${id}`, data)
export const deleteField = (id)           => api.delete(`/api/fields/delete/${id}`)
