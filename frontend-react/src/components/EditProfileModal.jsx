import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const Icons = {
  X: () => '✕',
  User: () => '👤',
  Phone: () => '📱',
  MapPin: () => '📍',
  Calendar: () => '📅',
  Briefcase: () => '💼',
  FileText: () => '📝',
  Camera: () => '📷'
}

export default function EditProfileModal({ isOpen, onClose, currentUser, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    fotoPerfil: '',
    direccion: '',
    fechaNacimiento: '',
    cargo: '',
    biografia: ''
  })
  const [loading, setLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)

  useEffect(() => {
    if (currentUser && isOpen) {
      setFormData({
        nombre: currentUser.nombre || '',
        telefono: currentUser.telefono || '',
        fotoPerfil: currentUser.fotoPerfil || '',
        direccion: currentUser.direccion || '',
        fechaNacimiento: currentUser.fechaNacimiento?.split('T')[0] || '',
        cargo: currentUser.cargo || '',
        biografia: currentUser.biografia || ''
      })
      setPreviewImage(currentUser.fotoPerfil || null)
    }
  }, [currentUser, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Preview de imagen
    if (name === 'fotoPerfil') {
      setPreviewImage(value)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validar tamaño (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe superar los 2MB')
        return
      }

      // Convertir a base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
        setFormData(prev => ({ ...prev, fotoPerfil: base64String }))
        setPreviewImage(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      // Usar URL relativa para que funcione tanto en desarrollo como en producción
      const baseUrl = import.meta.env.VITE_API_URL || ''
      const response = await fetch(`${baseUrl}/api/usuarios/perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess(data.usuario)
        onClose()
      } else {
        alert(data.message || 'Error al actualizar perfil')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar perfil')
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
          style={{ maxWidth: '700px' }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>✏️ Editar Mi Perfil</h2>
            <button className="modal-close" onClick={onClose}>
              <Icons.X />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Preview de foto de perfil */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 1rem',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid rgba(99, 102, 241, 0.3)',
                  background: previewImage ? 'transparent' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.innerHTML = '<div style="font-size: 3rem; color: white;">👤</div>'
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '3rem', color: 'white' }}>👤</div>
                  )}
                </div>
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="imageUpload"
                  style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  <Icons.Camera /> Cambiar Foto
                </label>
                <p style={{ fontSize: '0.75rem', color: 'rgba(234, 234, 234, 0.5)', marginTop: '0.5rem' }}>
                  JPG, PNG o GIF - Máx. 2MB
                </p>
              </div>

              <div className="form-grid">
                <div className="input-group full-width">
                  <label><Icons.User /> Nombre Completo <span className="required">*</span></label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Juan Pérez García"
                  />
                </div>

                <div className="input-group">
                  <label><Icons.Phone /> Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Ej: +51 999888777"
                  />
                </div>

                <div className="input-group">
                  <label><Icons.Calendar /> Fecha de Nacimiento</label>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group full-width">
                  <label><Icons.MapPin /> Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    placeholder="Ej: Av. Principal 123, Lima"
                  />
                </div>

                <div className="input-group full-width">
                  <label><Icons.Briefcase /> Cargo / Puesto</label>
                  <input
                    type="text"
                    name="cargo"
                    value={formData.cargo}
                    onChange={handleChange}
                    placeholder="Ej: Vendedor Senior, Administrador"
                  />
                </div>

                <div className="input-group full-width">
                  <label><Icons.FileText /> Biografía / Descripción</label>
                  <textarea
                    name="biografia"
                    value={formData.biografia}
                    onChange={handleChange}
                    placeholder="Cuéntanos un poco sobre ti..."
                    rows="3"
                  />
                </div>

                <div className="input-group full-width">
                  <label>🔗 URL de Foto de Perfil (opcional)</label>
                  <input
                    type="url"
                    name="fotoPerfil"
                    value={formData.fotoPerfil}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/foto.jpg"
                  />
                  <p style={{ fontSize: '0.75rem', color: 'rgba(234, 234, 234, 0.5)', marginTop: '0.25rem' }}>
                    También puedes subir una imagen arriba ↑
                  </p>
                </div>
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
