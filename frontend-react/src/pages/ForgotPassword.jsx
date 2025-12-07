import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../components/ToastProvider'
import ThemeSwitch from '../components/ThemeSwitch'
import { api } from '../utils/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const toast = useToast()

  // Estado del tema (modo día/noche)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : true
  })
  const [themeLoading, setThemeLoading] = useState(false) // Loader para cambio de tema

  // Aplicar tema al cargar y cuando cambie
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('theme-dark')
      document.body.classList.remove('light-mode')
    } else {
      document.body.classList.add('light-mode')
      document.body.classList.remove('theme-dark')
    }
    const newTheme = isDarkMode ? 'dark' : 'light'
    localStorage.setItem('theme', newTheme)
    // Disparar evento para que App.jsx actualice el fondo
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'theme',
      newValue: newTheme
    }))
  }, [isDarkMode])

  // Cambiar tema con animación
  const toggleTheme = () => {
    setThemeLoading(true) // Activar loader
    setTimeout(() => {
      const newTheme = !isDarkMode
      setIsDarkMode(newTheme)
      localStorage.setItem('theme', newTheme ? 'dark' : 'light')
      setTimeout(() => {
        setThemeLoading(false) // Desactivar loader después de aplicar cambios
      }, 500) // Medio segundo para que se apliquen los estilos
    }, 300) // Pequeño delay para mostrar el loader
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    
    try {
      const response = await api.post('/api/usuarios/forgot-password', { email })
      setSuccess(response.message || 'Si el correo existe, recibirás un enlace de recuperación.')
      toast.notify('Enlace de recuperación enviado (revisa tu email)', { type: 'success' })
      setEmail('') // Limpiar formulario
    } catch (err) {
      console.error('Error al solicitar recuperación:', err)
      const mensaje = err.response?.data?.message || 'Error al enviar el enlace de recuperación'
      setError(mensaje)
      toast.notify(mensaje, { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="center">
      {/* Animación de cambio de tema */}
      <AnimatePresence>
        {themeLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                scale: { duration: 0.5, repeat: Infinity }
              }}
              style={{
                fontSize: '3rem'
              }}
            >
              {!isDarkMode ? '🌙' : '☀️'}
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                color: '#f97316',
                fontSize: '1.25rem',
                fontWeight: 600
              }}
            >
              Cambiando a modo {!isDarkMode ? 'oscuro' : 'claro'}...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón de cambio de tema */}
      <motion.div 
        className="theme-switch-login"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000
        }}
      >
        <ThemeSwitch checked={isDarkMode} onChange={toggleTheme} />
      </motion.div>

      <motion.section 
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <header className="card__header">
          <motion.div 
            className="logo-container" 
            aria-label="Logo Rectificación de Repuestos"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 150 }}
          >
            <img src="/assets/logo.png" alt="Rectificación de Repuestos en Tarapoto" className="auth-logo" />
          </motion.div>
          <h1 className="title">Recuperar contraseña</h1>
          <p className="subtitle">Te enviaremos un enlace para restablecerla</p>
        </header>
        <form className="form" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e)=>setEmail(e.target.value)} 
              required 
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          <motion.button 
            className="primary" 
            type="submit" 
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </motion.button>
          {error && <p className="error">⚠ {error}</p>}
          {success && (
            <motion.p 
              className="error" 
              style={{borderColor:'rgba(34,197,94,.35)', color:'#bbf7d0', background:'rgba(34,197,94,.12)'}}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              ✔ {success}
            </motion.p>
          )}
          <p className="card__footer">
            <Link className="link" to="/">← Volver al inicio de sesión</Link>
          </p>
        </form>
      </motion.section>

      {/* Footer con derechos reservados */}
      <motion.footer 
        className="auth-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p>© {new Date().getFullYear()} Rectificación de Repuestos en Tarapoto S.A.C.</p>
        <p>Todos los derechos reservados</p>
      </motion.footer>
    </main>
  )
}
