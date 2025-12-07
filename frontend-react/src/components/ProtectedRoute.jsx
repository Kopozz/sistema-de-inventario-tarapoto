import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

// Función para decodificar JWT y validar expiración
function isTokenValid(token) {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Math.floor(Date.now() / 1000)
    return payload.exp > now
  } catch (e) {
    return false
  }
}

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  
  if (!token || !isTokenValid(token)) {
    // Limpiar tokens inválidos o expirados
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    return <Navigate to="/" replace state={{ from: location }} />
  }
  
  return children
}
