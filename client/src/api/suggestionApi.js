import api from './apiClient'

export const getSuggestions = (farmId) => api.get(`/api/suggestions?farm_id=${farmId}`)

export const askAI = (query, history) => api.post(`/api/suggestions/ask`, { user_query: query, history })
