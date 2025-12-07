import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '../utils/api'
import { useToast } from './ToastProvider'

export default function MovementModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [formData, setFormData] = useState({
    idProducto: '',
    tipo: 'entrada',
    cantidad: '',
    descripcion: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      setFormData({
        idProducto: '',
        tipo: 'entrada',
        cantidad: '',
        descripcion: ''
      })
    }
  }, [isOpen])

  const fetchProducts = async () => {
    try {
      const response = await apiFetch('/api/productos')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.productos || [])
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.idProducto || !formData.cantidad) {
      toast.notify('Completa todos los campos requeridos', { type: 'error' })
      return
    }

    const parseId = parseInt(formData.idProducto)
    const selectedProduct = products.find(p => p.idProducto === parseId)
    
    if (formData.tipo === 'salida' && parseInt(formData.cantidad) > selectedProduct.stock) {
      toast.notify('No hay suficiente stock', { type: 'error' })
      return
    }

    setLoading(true)
    try {
      const payload = {
        tipoMovimiento: formData.tipo,
        idProducto: parseId,
        cantidad: parseInt(formData.cantidad),
        descripcion: formData.descripcion
      }

      const response = await apiFetch('/api/movimientos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.notify('Movimiento registrado correctamente', { type: 'success' })
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.notify(error.mensaje || 'Error al registrar movimiento', { type: 'error' })
      }
    } catch (error) {
      toast.notify('Error al registrar movimiento', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const selectedProduct = products.find(p => p.idProducto === parseInt(formData.idProducto))

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
            <h2>📊 Nuevo Movimiento de Inventario</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-grid single-column">
                <div className="input-group">
                  <label>Tipo de Movimiento <span className="required">*</span></label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    required
                  >
                    <option value="entrada">➕ Entrada (Agregar Stock)</option>
                    <option value="salida">➖ Salida (Reducir Stock)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Producto <span className="required">*</span></label>
                  <select
                    name="idProducto"
                    value={formData.idProducto}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map(product => (
                      <option key={product.idProducto} value={product.idProducto}>
                        {product.nombre} (Stock actual: {product.stock})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProduct && (
                  <div style={{ 
                    padding: '1rem', 
                    background: 'rgba(99, 102, 241, 0.1)', 
                    borderRadius: '10px',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '0.875rem',
                          color: 'rgba(234, 234, 234, 0.7)'
                        }}>
                          Stock Actual
                        </p>
                        <p style={{ 
                          margin: '0.25rem 0 0 0',
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          color: '#6366f1'
                        }}>
                          {selectedProduct.stock} unidades
                        </p>
                      </div>
                      <div>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '0.875rem',
                          color: 'rgba(234, 234, 234, 0.7)'
                        }}>
                          Precio
                        </p>
                        <p style={{ 
                          margin: '0.25rem 0 0 0',
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          color: '#10b981'
                        }}>
                          S/ {parseFloat(selectedProduct.precio).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="input-group">
                  <label>Cantidad <span className="required">*</span></label>
                  <input
                    type="number"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={handleChange}
                    placeholder="0"
                    min="1"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Descripción/Motivo</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Ej: Compra a proveedor, Devolución, Ajuste de inventario..."
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="primary" disabled={loading}>
                {loading ? '⏳ Registrando...' : '✅ Registrar Movimiento'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
