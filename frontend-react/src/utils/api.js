// Utilidad para realizar llamadas a la API con token automático
// En producción (no localhost), usar URL relativa. En desarrollo, usar localhost:3000
import { useEffect } from 'react'

const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
const API_BASE = import.meta.env.VITE_API_URL || (isProduction ? '' : 'http://localhost:3000')

// Función para obtener el token actual
export function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

// Función para guardar el token
export function setToken(token, remember = true) {
  if (remember) {
    localStorage.setItem('token', token)
  } else {
    sessionStorage.setItem('token', token)
  }
}

// Función para eliminar tokens
export function clearTokens() {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('login_attempts')
}

// Wrapper para fetch con token automático
export async function apiFetch(endpoint, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })
  
  // Si el token expiró (401), redirigir a login
  if (response.status === 401 || response.status === 403) {
    clearTokens()
    window.location.href = '/'
    throw new Error('Sesión expirada')
  }
  
  return response
}

// Función para renovar el token automáticamente antes de que expire
export async function refreshTokenIfNeeded() {
  const token = getToken()
  if (!token) return false
  
  try {
    // Decodificar JWT para verificar expiración
    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = payload.exp - now
    
    // Si falta menos de 30 minutos para expirar, renovar
    if (timeUntilExpiry < 1800 && timeUntilExpiry > 0) {
      const response = await apiFetch('/api/usuarios/refresh', {
        method: 'POST',
      })
      
      if (response.ok) {
        const data = await response.json()
        const remember = !!localStorage.getItem('token')
        setToken(data.token, remember)
        return true
      }
    }
    
    return timeUntilExpiry > 0
  } catch (error) {
    console.error('Error al renovar token:', error)
    return false
  }
}

// Hook para usar en componentes de React
export function useAutoRefreshToken() {
  useEffect(() => {
    // Verificar cada 5 minutos
    const interval = setInterval(refreshTokenIfNeeded, 5 * 60 * 1000)
    
    // Verificar inmediatamente al montar
    refreshTokenIfNeeded()
    
    return () => clearInterval(interval)
  }, [])
}

// Cliente API con métodos convenientes (similar a axios)
export const api = {
  async get(endpoint, options = {}) {
    const response = await apiFetch(endpoint, {
      method: 'GET',
      ...options
    })
    return response.json()
  },

  async post(endpoint, data, options = {}) {
    const response = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    })
    return response.json()
  },

  async put(endpoint, data, options = {}) {
    const response = await apiFetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    })
    return response.json()
  },

  async delete(endpoint, options = {}) {
    const response = await apiFetch(endpoint, {
      method: 'DELETE',
      ...options
    })
    return response.json()
  }
}
