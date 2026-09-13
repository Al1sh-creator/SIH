import api from './apiClient'

export const getAlerts          = (farmId) => api.get(`/api/alerts?farm_id=${farmId}`)
export const markAlertRead      = (id)     => api.put(`/api/alerts/${id}/read`)
export const getAlertHistory    = ()       => api.get('/api/alerts/history')
export const generateDemoAlerts = ()       => api.post('/api/alerts/demo')
