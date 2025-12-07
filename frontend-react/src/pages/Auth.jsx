import React, { useEffect, useMemo, useState } from 'react'
import ThemeSwitch from '../components/ThemeSwitch'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { mirage } from 'ldrs'
import { useToast } from '../components/ToastProvider'

// Registrar el loader
mirage.register()

// Detectar producción por hostname (no localhost = producción)
const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
const API_BASE = isProduction ? '' : 'http://localhost:3000'

export default function Auth() {
  const [darkMode, setDarkMode] = useState(true)
  const [themeLoading, setThemeLoading] = useState(false) // Loader para cambio de tema
  const [mode, setMode] = useState('login') // 'login' o 'signup'
  const navigate = useNavigate()
  const toast = useToast()

  // Estados para Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [shakeError, setShakeError] = useState(false)

  // Estados para Signup
  const [signupNombre, setSignupNombre] = useState('')
  const [signupTelefono, setSignupTelefono] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [signupOk, setSignupOk] = useState('')
  const [showSignupPassword, setShowSignupPassword] = useState(false)

  // Cargar email recordado
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email')
    if (savedEmail) setLoginEmail(savedEmail)
  }, [])

  // Validación Login
  const canSubmitLogin = useMemo(() => {
    return loginEmail.trim().length > 3 && loginPassword.length >= 4 && !loginLoading
  }, [loginEmail, loginPassword, loginLoading])

  // Fortaleza de contraseña para Signup
  const passwordStrength = useMemo(() => {
    if (!signupPassword) return 0
    let score = 0
    if (signupPassword.length >= 8) score++
    if (/[a-z]/.test(signupPassword) && /[A-Z]/.test(signupPassword)) score++
    if (/\d/.test(signupPassword)) score++
    if (/[^a-zA-Z0-9]/.test(signupPassword)) score++
    return score
  }, [signupPassword])

  const strengthLabel = ['', 'Débil', 'Aceptable', 'Buena', 'Fuerte'][passwordStrength]
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'][passwordStrength]

  // Handler Login
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, contraseña: loginPassword })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Credenciales incorrectas')

      if (rememberMe) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('remembered_email', loginEmail)
      } else {
        sessionStorage.setItem('token', data.token)
        localStorage.removeItem('remembered_email')
      }

      await new Promise((r) => setTimeout(r, 3000))
      navigate('/dashboard')
      toast.notify('Sesión iniciada correctamente', { type: 'success' })
    } catch (err) {
      setLoginError(err.message)
      toast.notify(err.message || 'Error al iniciar sesión', { type: 'error' })
      setShakeError(true)
      setTimeout(() => setShakeError(false), 500)

      const attempts = Number(sessionStorage.getItem('login_attempts') || '0') + 1
      sessionStorage.setItem('login_attempts', String(attempts))
      if (attempts % 3 === 0) {
        let wait = 10
        setCooldown(wait)
        const id = setInterval(() => {
          wait -= 1
          setCooldown(wait)
          if (wait <= 0) clearInterval(id)
        }, 1000)
      }
    } finally {
      setLoginLoading(false)
    }
  }

  // Handler Signup
  const handleSignup = async (e) => {
    e.preventDefault()
    setSignupError('')
    setSignupOk('')
    setSignupLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/usuarios/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: signupNombre,
          telefono: signupTelefono,
          email: signupEmail, 
          contraseña: signupPassword, 
          idRol: 2 
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'No se pudo registrar')
      setSignupOk('Usuario registrado. Ahora puedes iniciar sesión.')
      toast.notify('Usuario registrado correctamente', { type: 'success' })
      setTimeout(() => setMode('login'), 1200)
    } catch (err) {
      setSignupError(err.message)
      toast.notify(err.message || 'Error al registrarse', { type: 'error' })
    } finally {
      setSignupLoading(false)
    }
  }

  // Animar fondo y tema
  useEffect(() => {
    document.body.classList.toggle('theme-light', !darkMode)
    document.body.classList.toggle('theme-dark', darkMode)
    if (darkMode) {
      document.body.classList.add('theme-dark')
      document.body.classList.remove('light-mode')
    } else {
      document.body.classList.add('light-mode')
      document.body.classList.remove('theme-dark')
    }
    const newTheme = darkMode ? 'dark' : 'light'
    localStorage.setItem('theme', newTheme)
    // Disparar evento para que App.jsx actualice el fondo
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'theme',
      newValue: newTheme
    }))
  }, [darkMode])

  // Cambiar tema con animación
  const handleThemeToggle = () => {
    setThemeLoading(true) // Activar loader
    setTimeout(() => {
      setDarkMode(!darkMode)
      setTimeout(() => {
        setThemeLoading(false) // Desactivar loader después de aplicar cambios
      }, 500) // Medio segundo para que se apliquen los estilos
    }, 300) // Pequeño delay para mostrar el loader
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
              {darkMode ? '☀️' : '🌙'}
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
              Cambiando a modo {darkMode ? 'claro' : 'oscuro'}...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position: 'absolute', top: 32, right: 32, zIndex: 20 }}>
        <ThemeSwitch checked={darkMode} onChange={handleThemeToggle} />
      </div>
      <motion.div 
        className="auth-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          x: shakeError ? [0, -10, 10, -10, 10, 0] : 0
        }}
        transition={{ duration: shakeError ? 0.4 : 0.3 }}
      >
        <div className="auth-slider" style={{ transform: `translateX(-${mode === 'signup' ? 50 : 0}%)` }}>
          {/* Panel Login */}
          <motion.section className="auth-panel">
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
            <form className="form" onSubmit={handleLogin}>
              <div className="field">
                <label htmlFor="login-email">Correo electrónico</label>
                <input 
                  id="login-email" 
                  type="email" 
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)} 
                  required 
                  placeholder="tucorreo@ejemplo.com" 
                />
              </div>
              <div className="field">
                <label htmlFor="login-password">Contraseña</label>
                <div className="password-wrapper">
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyUp={(e) => setCapsLockOn(e.getModifierState && e.getModifierState('CapsLock'))}
                    onKeyDown={(e) => setCapsLockOn(e.getModifierState && e.getModifierState('CapsLock'))}
                    required
                    placeholder="********"
                    autoComplete="current-password"
                  />
                  <label className="toggle-password-eye">
                    <input
                      type="checkbox"
                      checked={showLoginPassword}
                      onChange={(e) => setShowLoginPassword(e.target.checked)}
                      aria-label={showLoginPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    />
                    <svg className="eye" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z" /></svg>
                    <svg className="eye-slash" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 640 512"><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zM223.1 149.5C248.6 126.2 282.7 112 320 112c79.5 0 144 64.5 144 144c0 24.9-6.3 48.3-17.4 68.7L408 294.5c8.4-19.3 10.6-41.4 4.8-63.3c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3c0 10.2-2.4 19.8-6.6 28.3l-90.3-70.8zM373 389.9c-16.4 6.5-34.3 10.1-53 10.1c-79.5 0-144-64.5-144-144c0-6.9 .5-13.6 1.4-20.2L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5L373 389.9z" /></svg>
                  </label>
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
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Recordarme
                </label>
                <a className="link" href="/forgot-password" style={{ fontSize: '14px' }}>¿Olvidaste tu contraseña?</a>
              </div>
              <motion.button 
                className="primary" 
                type="submit" 
                disabled={!canSubmitLogin || cooldown > 0}
                whileHover={{ scale: loginLoading ? 1 : 1.02 }}
                whileTap={{ scale: loginLoading ? 1 : 0.98 }}
              >
                {cooldown > 0 ? `Reintenta en ${cooldown}s` : 'Iniciar Sesión'}
              </motion.button>
              {loginError && <p className="error" role="alert">⚠ {loginError}</p>}
              <p className="card__footer">
                ¿No tienes una cuenta? <button type="button" className="link" onClick={() => setMode('signup')}>Regístrate</button>
              </p>
            </form>
          </motion.section>

          {/* Panel Signup */}
          <motion.section className="auth-panel">
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
              <h1 className="title">Crear cuenta</h1>
              <p className="subtitle">Regístrate como vendedor</p>
            </header>
            <form className="form" onSubmit={handleSignup}>
              <div className="field">
                <label htmlFor="signup-nombre">Nombre completo</label>
                <input 
                  id="signup-nombre" 
                  value={signupNombre} 
                  onChange={(e) => setSignupNombre(e.target.value)} 
                  required 
                  placeholder="Ej: Juan Pérez García"
                />
              </div>
              <div className="field">
                <label htmlFor="signup-telefono">Teléfono (opcional)</label>
                <input 
                  id="signup-telefono" 
                  type="tel"
                  value={signupTelefono} 
                  onChange={(e) => setSignupTelefono(e.target.value)} 
                  placeholder="Ej: 942123456"
                  pattern="[0-9]{9}"
                  title="Ingrese un número de 9 dígitos"
                />
              </div>
              <div className="field">
                <label htmlFor="signup-email">Correo electrónico</label>
                <input 
                  id="signup-email" 
                  type="email" 
                  value={signupEmail} 
                  onChange={(e) => setSignupEmail(e.target.value)} 
                  required 
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="field">
                <label htmlFor="signup-password">Contraseña</label>
                <div className="password-wrapper">
                  <input 
                    id="signup-password" 
                    type={showSignupPassword ? 'text' : 'password'}
                    value={signupPassword} 
                    onChange={(e) => setSignupPassword(e.target.value)} 
                    required 
                  />
                  <label className="toggle-password-eye">
                    <input
                      type="checkbox"
                      checked={showSignupPassword}
                      onChange={(e) => setShowSignupPassword(e.target.checked)}
                      aria-label={showSignupPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    />
                    <svg className="eye" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z" /></svg>
                    <svg className="eye-slash" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 640 512"><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zM223.1 149.5C248.6 126.2 282.7 112 320 112c79.5 0 144 64.5 144 144c0 24.9-6.3 48.3-17.4 68.7L408 294.5c8.4-19.3 10.6-41.4 4.8-63.3c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3c0 10.2-2.4 19.8-6.6 28.3l-90.3-70.8zM373 389.9c-16.4 6.5-34.3 10.1-53 10.1c-79.5 0-144-64.5-144-144c0-6.9 .5-13.6 1.4-20.2L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5L373 389.9z" /></svg>
                  </label>
                </div>
                {signupPassword && (
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
              <motion.button 
                className="primary" 
                type="submit" 
                disabled={signupLoading}
                whileHover={{ scale: signupLoading ? 1 : 1.02 }}
                whileTap={{ scale: signupLoading ? 1 : 0.98 }}
              >
                {signupLoading ? 'Registrando...' : 'Registrarme'}
              </motion.button>
              {signupError && <p className="error">⚠ {signupError}</p>}
              {signupOk && (
                <motion.p 
                  className="error" 
                  style={{ borderColor: 'rgba(34,197,94,.35)', color: '#bbf7d0', background: 'rgba(34,197,94,.12)' }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  ✔ {signupOk}
                </motion.p>
              )}
              <p className="card__footer">
                ¿Ya tienes cuenta? <button type="button" className="link" onClick={() => setMode('login')}>Inicia sesión</button>
              </p>
            </form>
          </motion.section>
        </div>
      </motion.div>

      {loginLoading && (
        <div className="loader-overlay">
          <div className="loader-bg" />
          <div className="loader-spinner" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
            <l-mirage size="60" speed="2.5" color="#ffffff"></l-mirage>
          </div>
        </div>
      )}

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
