import api from './apiClient'

export const getStats = () => api.get('/api/admin/stats')
export const getUsers = () => api.get('/api/admin/users')
export const deleteUser = (id) => api.delete(`/api/admin/users/${id}`)
export const sendBroadcast = (data) => api.post('/api/admin/broadcast', data)
export const getInspections = () => api.get('/api/admin/inspections')
export const updateInspection = (id, data) => api.put(`/api/admin/inspections/${id}`, data)
