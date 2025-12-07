import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '../utils/api'
import { useToast } from './ToastProvider'

export default function SupplierModal({ isOpen, onClose, supplier, onSuccess }) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: ''
  })

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        setFormData({
          nombre: supplier.nombre || '',
          email: supplier.email || '',
          telefono: supplier.telefono || '',
          direccion: supplier.direccion || ''
        })
      } else {
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          direccion: ''
        })
      }
    }
  }, [isOpen, supplier])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.nombre || !formData.email) {
      toast.notify('Nombre y email son obligatorios', { type: 'error' })
      return
    }

    setLoading(true)
    try {
      const url = supplier 
        ? `/api/proveedores/${supplier.idProveedor}` 
        : '/api/proveedores'
      
      const method = supplier ? 'PUT' : 'POST'
      
      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.notify(
          supplier ? 'Proveedor actualizado correctamente' : 'Proveedor creado correctamente',
          { type: 'success' }
        )
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.notify(error.mensaje || 'Error al guardar proveedor', { type: 'error' })
      }
    } catch (error) {
      toast.notify('Error al guardar proveedor', { type: 'error' })
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
            <h2>{supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
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
                    placeholder="Nombre del proveedor"
                    required
                    autoFocus
                  />
                </div>

                <div className="input-group">
                  <label>Email <span className="required">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Número de teléfono (opcional)"
                  />
                </div>

                <div className="input-group">
                  <label>Dirección</label>
                  <textarea
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    placeholder="Dirección completa (opcional)"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="primary" disabled={loading}>
                {loading ? 'Guardando...' : supplier ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
