import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mirage } from 'ldrs/react'
import 'ldrs/react/Mirage.css'
import { useToast } from '../components/ToastProvider'
import ThemeSwitch from '../components/ThemeSwitch'

const API_BASE = 'http://localhost:3000'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [cooldown, setCooldown] = useState(0) // segundos de espera tras fallos
  const [shakeError, setShakeError] = useState(false) // trigger para animación shake
  const toast = useToast()

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

  // Limpiar formulario cuando viene de logout
  useEffect(() => {
    // Verificar si se cerró sesión (viene de logout)
    const justLoggedOut = sessionStorage.getItem('just_logged_out')
    if (justLoggedOut) {
      // Limpiar flag y NO cargar email guardado
      sessionStorage.removeItem('just_logged_out')
      setEmail('')
      setPassword('')
      
      // Forzar limpieza del autocompletado del navegador
      setTimeout(() => {
        const emailInput = document.getElementById('email')
        const passwordInput = document.getElementById('password')
        if (emailInput) emailInput.value = ''
        if (passwordInput) passwordInput.value = ''
      }, 100)
      return
    }
    
    // Si NO viene de logout, cargar email recordado
    const savedEmail = localStorage.getItem('remembered_email')
    if (savedEmail && rememberMe) {
      setEmail(savedEmail)
    }
  }, [])

  // Validación simple del formulario
  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 4 && !loading
  }, [email, password, loading])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, contraseña: password })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Credenciales incorrectas')
  // Guardar token según preferencia
  if (rememberMe) {
    localStorage.setItem('token', data.token)
  } else {
    sessionStorage.setItem('token', data.token)
  }
  // Guardar email si se marcó recordarme
  if (rememberMe) {
    localStorage.setItem('remembered_email', email)
  } else {
    localStorage.removeItem('remembered_email')
  }
  // Mostrar loader Mirage por 3 segundos antes de navegar
  await new Promise((r) => setTimeout(r, 3000))
  navigate('/dashboard')
  toast.notify('Sesión iniciada correctamente', { type: 'success' })
    } catch (err) {
      setError(err.message)
      toast.notify(err.message || 'Error al iniciar sesión', { type: 'error' })
      // Trigger animación shake
      setShakeError(true)
      setTimeout(() => setShakeError(false), 500)
      // Rate limit visual: 3 intentos fallidos => cooldown 10s
      const attempts = Number(sessionStorage.getItem('login_attempts') || '0') + 1
      sessionStorage.setItem('login_attempts', String(attempts))
      if (attempts % 3 === 0) {
        let wait = 10
        setCooldown(wait)
        const id = setInterval(() => {
          wait -= 1
          setCooldown(wait)
          if (wait <= 0) {
            clearInterval(id)
          }
        }, 1000)
      }
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          x: shakeError ? [0, -10, 10, -10, 10, 0] : 0
        }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: shakeError ? 0.4 : 0.3 }}
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
          <h1 className="title">Bienvenido</h1>
          <p className="subtitle">Inicia sesión para continuar</p>
        </header>
        <form className="form" onSubmit={onSubmit} autoComplete="off">
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input 
              id="email" 
              name="email-login"
              type="email" 
              value={email} 
              onChange={(e)=>setEmail(e.target.value)} 
              required 
              placeholder="tucorreo@ejemplo.com"
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <div className="password-wrapper">
              <input
                id="password"
                name="password-login"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                onKeyUp={(e)=> setCapsLockOn(e.getModifierState && e.getModifierState('CapsLock'))}
                onKeyDown={(e)=> setCapsLockOn(e.getModifierState && e.getModifierState('CapsLock'))}
                required
                placeholder="********"
                autoComplete="off"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? '🙈 Ocultar' : '👁️ Mostrar'}
              </button>
            </div>
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: capsLockOn ? 1 : 0, y: capsLockOn ? 0 : -4 }}
              transition={{ duration: 0.2 }}
              style={{ height: 18 }}
            >
              {capsLockOn && <p className="caps-hint">Bloq Mayús está activado</p>}
            </motion.div>
          </div>
          <div className="login-row">
            <label className="remember">
              <input type="checkbox" checked={rememberMe} onChange={(e)=>setRememberMe(e.target.checked)} /> Recordarme
            </label>
            <a className="link" href="/forgot-password" style={{ fontSize: '14px' }}>¿Olvidaste tu contraseña?</a>
          </div>
          <motion.button 
            className="primary" 
            type="submit" 
            disabled={!canSubmit || cooldown > 0}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {cooldown > 0 ? `Reintenta en ${cooldown}s` : 'Iniciar Sesión'}
          </motion.button>

          {error && <p className="error" role="alert">⚠ {error}</p>}
          <p className="card__footer">¿No tienes una cuenta? <a className="link" href="/signup">Regístrate</a></p>
        </form>
      </motion.section>

      {loading && (
        <div className="loader-overlay">
          <div className="loader-bg" />
          <div className="loader-spinner" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
            <Mirage size={60} speed={2.5} color="#ffffff" />
          </div>
        </div>
      )}

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
