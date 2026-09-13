import api from './apiClient'

export const register           = (data) => api.post('/api/auth/register', data)
export const login              = (data) => api.post('/api/auth/login', data)
export const googleLogin        = (data) => api.post('/api/auth/google', data)
export const getMe              = ()     => api.get('/api/auth/me')
export const updatePhone        = (data) => api.put('/api/auth/phone', data)
export const forgotPassword     = (data) => api.post('/api/auth/forgot-password', data)
export const resetPassword      = (data) => api.post('/api/auth/reset-password', data)
export const resendVerification = ()     => api.post('/api/auth/resend-verification')

