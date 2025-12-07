import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '../utils/api'
import { useToast } from './ToastProvider'

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  const passwordStrength = React.useMemo(() => {
    if (!newPassword) return 0
    let score = 0
    if (newPassword.length >= 8) score++
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) score++
    if (/\d/.test(newPassword)) score++
    if (/[^a-zA-Z0-9]/.test(newPassword)) score++
    return score
  }, [newPassword])

  const strengthLabel = ['', 'Débil', 'Aceptable', 'Buena', 'Fuerte'][passwordStrength]
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'][passwordStrength]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validaciones
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (currentPassword === newPassword) {
      setError('La nueva contraseña debe ser diferente a la actual')
      return
    }

    setLoading(true)
    try {
      const response = await apiFetch('/api/usuarios/cambiar-contraseña', {
        method: 'POST',
        body: JSON.stringify({
          contraseñaActual: currentPassword,
          contraseñaNueva: newPassword
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar contraseña')
      }

      toast.notify('Contraseña cambiada exitosamente', { type: 'success' })
      
      // Limpiar campos
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // Cerrar modal
      setTimeout(() => onClose(), 1000)
    } catch (err) {
      setError(err.message)
      toast.notify(err.message, { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Cambiar Contraseña</h2>
            <button className="modal-close" onClick={onClose} aria-label="Cerrar">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label htmlFor="current-password">Contraseña Actual</label>
              <div className="password-wrapper">
                <input
                  id="current-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Tu contraseña actual"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="new-password">Nueva Contraseña</label>
              <div className="password-wrapper">
                <input
                  id="new-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
              </div>
              {newPassword && (
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
                  <span className="strength-label" style={{ color: strengthColor }}>
                    {strengthLabel}
                  </span>
                </motion.div>
              )}
            </div>

            <div className="field">
              <label htmlFor="confirm-password">Confirmar Nueva Contraseña</label>
              <div className="password-wrapper">
                <input
                  id="confirm-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repite la nueva contraseña"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <label className="remember" style={{ marginTop: 8 }}>
              <input 
                type="checkbox" 
                checked={showPasswords} 
                onChange={(e) => setShowPasswords(e.target.checked)} 
              />
              Mostrar contraseñas
            </label>

            {error && (
              <motion.p 
                className="error" 
                role="alert"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ⚠ {error}
              </motion.p>
            )}

            <div className="modal-actions">
              <button 
                type="button" 
                className="secondary" 
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <motion.button 
                type="submit" 
                className="primary"
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
