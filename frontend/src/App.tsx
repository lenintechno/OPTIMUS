import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { ProfileGate } from './components/auth/ProfileGate'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Onboarding } from './pages/Onboarding'
import { Practice } from './pages/Practice'
import { Signup } from './pages/Signup'
import { useAuthStore } from './stores/authStore'

function App() {
  const initialize = useAuthStore((state) => state.initialize)
  useEffect(() => { void initialize() }, [initialize])
  return <BrowserRouter><Routes><Route path="/" element={<Navigate to="/login" replace />} /><Route path="/login" element={<Login />} /><Route path="/signup" element={<Signup />} /><Route path="/onboarding" element={<ProtectedRoute><ProfileGate requiresProfile={false}><Onboarding /></ProfileGate></ProtectedRoute>} /><Route path="/app" element={<ProtectedRoute><ProfileGate requiresProfile><Dashboard /></ProfileGate></ProtectedRoute>} /><Route path="/practice" element={<ProtectedRoute><ProfileGate requiresProfile><Practice /></ProfileGate></ProtectedRoute>} /><Route path="*" element={<Navigate to="/login" replace />} /></Routes></BrowserRouter>
}

export default App
