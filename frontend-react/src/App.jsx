import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Auth from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ToastProvider from './components/ToastProvider.jsx'

export default function App() {
  const location = useLocation()
  const [theme, setTheme] = useState(() => {
    // Leer tema guardado inmediatamente para evitar parpadeo
    return localStorage.getItem('theme') || 'dark'
  })

  useEffect(() => {
    // Aplicar tema al body inmediatamente
    document.body.className = theme === 'light' ? 'light-mode' : 'theme-dark'
    localStorage.setItem('theme', theme)
  }, [theme])

  // Escuchar cambios de tema desde otros componentes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'theme') {
        setTheme(e.newValue || 'dark')
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const gradientStyle = theme === 'light'
    ? { background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 25%, #ffedd5 50%, #fed7aa 75%, #fb923c 100%)' }
    : { background: 'radial-gradient(125% 125% at 50% 10%, #000000 40%, #2b0707 100%)' }

  return (
    <ToastProvider>
      {/* Global gradient background wrapper */}
      <div className="app-gradient-root">
        {/* Gradient background - cambia según el tema */}
        <div
          className="absolute inset-0 z-0"
          style={{
            ...gradientStyle,
            transition: 'background 0.3s ease'
          }}
        />

        <div className="relative z-10" style={{ minHeight: '100vh', width: '100%' }}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Auth />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/restablecer-contrasena/:token" element={<ResetPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
    </ToastProvider>
  )
}
