import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const Icons = {
  X: () => '✕',
  Shield: () => '🛡️',
  User: () => '👤'
}

export default function UserRoleModal({ isOpen, onClose, user, roles, onSuccess }) {
  const [selectedRole, setSelectedRole] = useState(user?.idRol || 2)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/usuarios/${user.idUsuario}/rol`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ idRol: parseInt(selectedRole) })
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        alert(data.message || 'Error al cambiar rol')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cambiar rol')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !user) return null

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
          style={{ maxWidth: '500px' }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2><Icons.Shield /> Cambiar Rol de Usuario</h2>
            <button className="modal-close" onClick={onClose}>
              <Icons.X />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.User />
                  <strong>{user.nombre}</strong>
                </p>
                <p style={{ margin: '0.25rem 0 0 1.75rem', fontSize: '0.9rem', color: 'rgba(234, 234, 234, 0.7)' }}>
                  {user.email}
                </p>
              </div>

              <div className="input-group">
                <label><Icons.Shield /> Rol del Usuario</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  required
                >
                  {roles && roles.map(rol => (
                    <option key={rol.idRol} value={rol.idRol}>
                      {rol.nombreRol}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '1rem'
              }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(234, 234, 234, 0.8)' }}>
                  ⚠️ <strong>Nota:</strong> Cambiar el rol de un usuario afectará sus permisos inmediatamente.
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="primary"
                disabled={loading}
              >
                {loading ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
