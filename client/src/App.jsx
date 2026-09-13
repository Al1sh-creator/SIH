import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Alerts from './pages/Alerts'
import Suggestions from './pages/Suggestions'
import CropComparison from './pages/CropComparison'
import FarmProfile from './pages/FarmProfile'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Settings from './pages/Settings'
import Weather from './pages/Weather'
import GovSchemes from './pages/GovSchemes'
import DiseaseDetection from './pages/DiseaseDetection'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public */}
            <Route path="/"          element={<Landing />} />
            <Route path="/login"           element={<Login />} />
            <Route path="/register"         element={<Register />} />
            <Route path="/forgot-password"  element={<ForgotPassword />} />
            <Route path="/reset-password"   element={<ResetPassword />} />

            {/* Protected */}
            <Route path="/onboarding"      element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/alerts"          element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="/suggestions"     element={<ProtectedRoute><Suggestions /></ProtectedRoute>} />
            <Route path="/crop-comparison" element={<ProtectedRoute><CropComparison /></ProtectedRoute>} />
            <Route path="/farm-profile"    element={<ProtectedRoute><FarmProfile /></ProtectedRoute>} />
            <Route path="/weather"         element={<ProtectedRoute><Weather /></ProtectedRoute>} />
            <Route path="/schemes"         element={<ProtectedRoute><GovSchemes /></ProtectedRoute>} />
            <Route path="/settings"        element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/disease-detection" element={<ProtectedRoute><DiseaseDetection /></ProtectedRoute>} />
            <Route path="/admin"           element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
