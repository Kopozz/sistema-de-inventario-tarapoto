import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../components/ToastProvider'
import ThemeSwitch from '../components/ThemeSwitch'

const API_BASE = 'http://localhost:3000'

export default function Signup() {
  const navigate = useNavigate()
  const toast = useToast()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  // Estado del tema (modo día/noche)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : true
  })
  const [themeLoading, setThemeLoading] = useState(false) // Loader para cambio de tema

  // Aplicar tema al cargar
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('theme-dark')
      document.body.classList.remove('light-mode')
    } else {
      document.body.classList.add('light-mode')
      document.body.classList.remove('theme-dark')
    }
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

  // Calcular fortaleza de contraseña (0-4)
  const passwordStrength = useMemo(() => {
    if (!password) return 0
    let score = 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    return score
  }, [password])

  const strengthLabel = ['', 'Débil', 'Aceptable', 'Buena', 'Fuerte'][passwordStrength]
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'][passwordStrength]

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      toast.notify('Las contraseñas no coinciden', { type: 'error' })
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/usuarios/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre, 
          email, 
          contraseña: password
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'No se pudo registrar')
      setOk('Usuario registrado. Ahora puedes iniciar sesión.')
      toast.notify('Usuario registrado correctamente', { type: 'success' })
      setTimeout(()=> navigate('/'), 1200)
    } catch (err) {
      setError(err.message)
      toast.notify(err.message || 'Error al registrarse', { type: 'error' })
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
              {isDarkMode ? '☀️' : '🌙'}
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
              Cambiando a modo {isDarkMode ? 'claro' : 'oscuro'}...
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="title">Crear cuenta</h1>
          </motion.div>
          <p className="subtitle">Regístrate como vendedor</p>
        </header>
        <form className="form" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="nombre">Nombre completo</label>
            <input 
              id="nombre" 
              type="text"
              value={nombre} 
              onChange={(e)=>setNombre(e.target.value)} 
              placeholder="Ej: Juan Pérez García"
              required 
            />
          </div>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e)=>setEmail(e.target.value)} 
              placeholder="tu@email.com"
              required 
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              placeholder="Mínimo 6 caracteres"
              minLength="6"
              required 
            />
            {password && (
              <motion.div 
                className="password-strength"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.2 }}
              >
                <div className="strength-bar">
                  <motion.div 
                    className="strength-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${(passwordStrength / 4) * 100}%` }}
                    style={{ backgroundColor: strengthColor }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="strength-label" style={{ color: strengthColor }}>{strengthLabel}</span>
              </motion.div>
            )}
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input 
              id="confirmPassword" 
              type="password" 
              value={confirmPassword} 
              onChange={(e)=>setConfirmPassword(e.target.value)} 
              placeholder="Repite tu contraseña"
              minLength="6"
              required 
            />
          </div>
          <motion.button 
            className="primary" 
            type="submit" 
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? 'Registrando...' : 'Registrarme'}
          </motion.button>
          {error && <p className="error">⚠ {error}</p>}
          {ok && (
            <motion.p 
              className="error" 
              style={{borderColor:'rgba(34,197,94,.35)', color:'#bbf7d0', background:'rgba(34,197,94,.12)'}}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              ✔ {ok}
            </motion.p>
          )}
          <p className="card__footer">¿Ya tienes cuenta? <Link className="link" to="/">Inicia sesión</Link></p>
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
