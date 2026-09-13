import api from './apiClient'

export const getMyInspections = () => api.get('/api/inspections')
export const requestInspection = (data) => api.post('/api/inspections', data)
