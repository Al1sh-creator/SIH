import apiClient from './apiClient'

export const runAIAnalysis = () => apiClient.post('/api/analysis/run')
export const getLatestAnalysis = () => apiClient.get('/api/analysis/latest')
