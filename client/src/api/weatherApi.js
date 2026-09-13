import api from './apiClient'

export const getWeatherForecast = () => api.get('/api/weather/forecast')
export const getWeatherToday    = () => api.get('/api/weather/today')
