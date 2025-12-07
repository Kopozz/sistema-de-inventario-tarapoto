import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeSwitch from '../components/ThemeSwitch';
import { api } from '../utils/api';
import { useToast } from '../components/ToastProvider';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    contraseña: '',
    confirmarContraseña: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [themeLoading, setThemeLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });

  // Calcular fortaleza de contraseña
  useEffect(() => {
    if (!formData.contraseña) {
      setPasswordStrength({ score: 0, text: '', color: '' });
      return;
    }

    let score = 0;
    const password = formData.contraseña;

    // Longitud
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Complejidad
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    let text = '';
    let color = '';

    if (score < 3) {
      text = 'Débil';
      color = '#ef4444';
    } else if (score < 5) {
      text = 'Media';
      color = '#f59e0b';
    } else if (score < 6) {
      text = 'Fuerte';
      color = '#10b981';
    } else {
      text = 'Muy Fuerte';
      color = '#059669';
    }

    setPasswordStrength({ score, text, color });
  }, [formData.contraseña]);

  // Sincronizar tema
  useEffect(() => {
    const syncTheme = () => {
      const isDark = document.body.classList.contains('theme-dark');
      if (isDark) {
        document.body.classList.remove('light-mode');
      } else {
        document.body.classList.add('light-mode');
      }
    };

    syncTheme();
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  const handleThemeToggle = () => {
    setThemeLoading(true);
    setTimeout(() => {
      const isDark = document.body.classList.contains('theme-dark');
      if (isDark) {
        document.body.classList.remove('theme-dark');
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
      } else {
        document.body.classList.add('theme-dark');
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
      }
      window.dispatchEvent(new Event('storage'));
      setTimeout(() => setThemeLoading(false), 800);
    }, 0);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar contraseñas
    if (formData.contraseña !== formData.confirmarContraseña) {
      toast.notify('Las contraseñas no coinciden', { type: 'error' });
      return;
    }

    if (formData.contraseña.length < 6) {
      toast.notify('La contraseña debe tener al menos 6 caracteres', { type: 'error' });
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.contraseña)) {
      toast.notify('La contraseña debe contener mayúsculas, minúsculas y números', { type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/usuarios/reset-password', {
        token,
        contraseña: formData.contraseña
      });

      // api.post returns the parsed JSON directly, so use response.message
      toast.notify(response.message || 'Contraseña restablecida exitosamente', { type: 'success' });
      
      // Limpiar formulario
      setFormData({
        contraseña: '',
        confirmarContraseña: ''
      });

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/auth');
      }, 2000);

    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      // Handle both API errors (if api throws) and JS errors
      const mensaje = error.message || error.response?.data?.message || 'Error al restablecer la contraseña';
      toast.notify(mensaje, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center">
      {/* Botón de cambio de tema */}
      <motion.div 
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
        <ThemeSwitch checked={document.body.classList.contains('theme-dark')} onChange={handleThemeToggle} />
      </motion.div>
      
      <AnimatePresence>
        {themeLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.8)',
              padding: '2rem 3rem',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              style={{ fontSize: '3rem' }}
            >
              {document.body.classList.contains('theme-dark') ? '🌙' : '☀️'}
            </motion.div>
            <p style={{ color: 'white', margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>
              Cambiando a modo {document.body.classList.contains('theme-dark') ? 'noche' : 'día'}...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card">
        {/* Logo */}
        <div className="logo-container">
          <img src="/assets/logo.png" alt="Logo" className="auth-logo" />
        </div>

        {/* Título */}
        {/* Título */}
        <h2 className="title" style={{ textAlign: 'center' }}>Restablecer Contraseña</h2>
        <p style={{ 
          textAlign: 'center', 
          fontSize: '0.9rem', 
          marginBottom: '1.5rem',
          opacity: 0.8 
        }}>
          Ingresa tu nueva contraseña segura
        </p>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="form">
          {/* Nueva Contraseña */}
          <div className="field">
            <label htmlFor="contraseña">Nueva Contraseña</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="contraseña"
                name="contraseña"
                placeholder="Ingresa tu nueva contraseña"
                value={formData.contraseña}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.6)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            
            {/* Indicador de fortaleza */}
            {formData.contraseña && (
              <div className="password-strength" style={{ marginTop: '8px' }}>
                <div className="strength-bar">
                  <div 
                    className="strength-fill"
                    style={{ 
                      width: `${(passwordStrength.score / 7) * 100}%`,
                      background: passwordStrength.color 
                    }}
                  />
                </div>
                <span style={{ color: passwordStrength.color, fontSize: '0.85rem' }}>
                  {passwordStrength.text}
                </span>
              </div>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div className="field">
            <label htmlFor="confirmarContraseña">Confirmar Contraseña</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmarContraseña"
                name="confirmarContraseña"
                placeholder="Confirma tu nueva contraseña"
                value={formData.confirmarContraseña}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.6)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            
            {/* Validación de coincidencia */}
            {formData.confirmarContraseña && formData.contraseña !== formData.confirmarContraseña && (
              <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.3rem', display: 'block' }}>
                Las contraseñas no coinciden
              </span>
            )}
            {formData.confirmarContraseña && formData.contraseña === formData.confirmarContraseña && (
              <span style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '0.3rem', display: 'block' }}>
                ✓ Las contraseñas coinciden
              </span>
            )}
          </div>

          {/* Requisitos de contraseña */}
          <div style={{ 
            background: 'rgba(249, 115, 22, 0.1)', 
            padding: '0.8rem', 
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(249, 115, 22, 0.2)'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: 'var(--text-primary)' }}>La contraseña debe contener:</p>
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              <li style={{ color: formData.contraseña.length >= 6 ? '#10b981' : 'inherit' }}>
                Al menos 6 caracteres
              </li>
              <li style={{ color: /[A-Z]/.test(formData.contraseña) ? '#10b981' : 'inherit' }}>
                Al menos una mayúscula
              </li>
              <li style={{ color: /[a-z]/.test(formData.contraseña) ? '#10b981' : 'inherit' }}>
                Al menos una minúscula
              </li>
              <li style={{ color: /\d/.test(formData.contraseña) ? '#10b981' : 'inherit' }}>
                Al menos un número
              </li>
            </ul>
          </div>

          {/* Botón de submit */}
          <button type="submit" className="primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
          </button>

          {/* Link de regreso */}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/auth" style={{ 
              color: 'var(--primary)', 
              textDecoration: 'none',
              fontSize: '0.9rem' 
            }}>
              ← Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
