import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '../utils/api'
import { useToast } from './ToastProvider'

export default function CategoryModal({ isOpen, onClose, category, onSuccess }) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  })

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          nombre: category.nombre || '',
          descripcion: category.descripcion || ''
        })
      } else {
        setFormData({
          nombre: '',
          descripcion: ''
        })
      }
    }
  }, [isOpen, category])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.nombre) {
      toast.notify('El nombre es obligatorio', { type: 'error' })
      return
    }

    setLoading(true)
    try {
      const url = category 
        ? `/api/categorias/${category.idCategoria}` 
        : '/api/categorias'
      
      const method = category ? 'PUT' : 'POST'
      
      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.notify(
          category ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente',
          { type: 'success' }
        )
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.notify(error.mensaje || 'Error al guardar categoría', { type: 'error' })
      }
    } catch (error) {
      toast.notify('Error al guardar categoría', { type: 'error' })
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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>{category ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-grid single-column">
                <div className="input-group">
                  <label>Nombre <span className="required">*</span></label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Nombre de la categoría"
                    required
                    autoFocus
                  />
                </div>

                <div className="input-group">
                  <label>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Descripción de la categoría (opcional)"
                    rows="4"
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="primary" disabled={loading}>
                {loading ? 'Guardando...' : category ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
