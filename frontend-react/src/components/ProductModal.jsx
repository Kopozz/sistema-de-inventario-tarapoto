import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '../utils/api'
import { useToast } from './ToastProvider'

import Product3DViewer from './Product3DViewer'
import ErrorBoundary from './ErrorBoundary'

export default function ProductModal({ isOpen, onClose, product, onSuccess }) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [show3D, setShow3D] = useState(false) // Toggle 3D view
  // ... (rest of file)
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    codigoProducto: '', // UI -> backend: codigo
    nombre: '',
    descripcion: '',
    imagen: '',
    marca: '',
    modeloCompatible: '',
    ubicacion: '',
    precioCompra: '', // UI -> backend: precioCompra
    precio: '', // UI -> backend: precioVenta
    stock: '', // UI -> backend: stockActual
    stockMinimo: '',
    idCategoria: '',
    idProveedor: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchCategoriesAndSuppliers()
      if (product) {
        setFormData({
          codigoProducto: product.codigo || '',
          nombre: product.nombre || '',
          descripcion: product.descripcion || '',
          imagen: product.imagen || '',
          marca: product.marca || '',
          modeloCompatible: product.modeloCompatible || '',
          ubicacion: product.ubicacion || '',
          precioCompra: product.precioCompra ?? '',
          precio: product.precioVenta ?? '',
          stock: product.stockActual ?? product.stock ?? '',
          stockMinimo: product.stockMinimo ?? '',
          idCategoria: product.idCategoria || '',
          idProveedor: product.idProveedor || ''
        })
        setImagePreview(product.imagen || null)
      } else {
        setFormData({
          codigoProducto: '',
          nombre: '',
          descripcion: '',
          imagen: '',
          marca: '',
          modeloCompatible: '',
          ubicacion: '',
          precioCompra: '',
          precio: '',
          stock: '',
          stockMinimo: '',
          idCategoria: '',
          idProveedor: ''
        })
        setImagePreview(null)
      }
    }
  }, [isOpen, product])

  const fetchCategoriesAndSuppliers = async () => {
    try {
      const [catRes, supRes] = await Promise.all([
        apiFetch('/api/categorias'),
        apiFetch('/api/proveedores')
      ])
      
      if (catRes.ok) {
        const catData = await catRes.json()
        setCategories(catData.categorias || [])
      }
      
      if (supRes.ok) {
        const supData = await supRes.json()
        setSuppliers(supData.proveedores || [])
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    }
  }

  // Obtener siguiente código de producto según categoría
  const fetchNextCode = async (idCategoria) => {
    if (!idCategoria) return
    try {
      const response = await apiFetch(`/api/productos/siguiente-codigo/${idCategoria}`)
      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, codigoProducto: data.codigo }))
      }
    } catch (error) {
      console.error('Error al generar código:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Si cambia la categoría y es un producto nuevo, generar código automático
    if (name === 'idCategoria' && value && !product) {
      fetchNextCode(value)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validar tamaño (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.notify('La imagen no debe superar 2MB', { type: 'error' })
        return
      }
      
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast.notify('Por favor selecciona una imagen válida', { type: 'error' })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result
        setFormData(prev => ({ ...prev, imagen: base64 }))
        setImagePreview(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imagen: '' }))
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.nombre || !formData.precio || !formData.stock) {
      toast.notify('Por favor completa los campos obligatorios', { type: 'error' })
      return
    }

    setLoading(true)
    try {
      const url = product 
        ? `/api/productos/${product.idProducto}` 
        : '/api/productos'

      const method = product ? 'PUT' : 'POST'

      // Mapear al contrato del backend
      const payload = {
        codigo: formData.codigoProducto,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        imagen: formData.imagen || null,
        marca: formData.marca,
        modeloCompatible: formData.modeloCompatible,
        ubicacion: formData.ubicacion,
        precioCompra: formData.precioCompra === '' ? 0 : Number(formData.precioCompra),
        precioVenta: formData.precio === '' ? 0 : Number(formData.precio),
        stockActual: formData.stock === '' ? 0 : Number(formData.stock),
        stockMinimo: formData.stockMinimo === '' ? 0 : Number(formData.stockMinimo),
        idCategoria: formData.idCategoria || null,
        idProveedor: formData.idProveedor || null
      }

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.notify(
          product ? 'Producto actualizado correctamente' : 'Producto creado correctamente',
          { type: 'success' }
        )
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.notify(error.mensaje || 'Error al guardar producto', { type: 'error' })
      }
    } catch (error) {
      toast.notify('Error al guardar producto', { type: 'error' })
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
          style={{ maxWidth: '600px' }}
        >
          <div className="modal-header">
            <h2>{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-grid">
                {/* Categoría primero para generar código automático */}
                <div className="input-group">
                  <label>Categoría <span className="required">*</span></label>
                  <select
                    name="idCategoria"
                    value={formData.idCategoria}
                    onChange={handleChange}
                    required={!product}
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categories.map(cat => (
                      <option key={cat.idCategoria} value={cat.idCategoria}>
                        {cat.codigoPrefix ? `[${cat.codigoPrefix}] ` : ''}{cat.nombre}
                      </option>
                    ))}
                  </select>
                  {!product && <small style={{ color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                    Al seleccionar se generará el código automáticamente
                  </small>}
                </div>

                <div className="input-group">
                  <label>Código <span className="required">*</span></label>
                  <input
                    type="text"
                    name="codigoProducto"
                    value={formData.codigoProducto}
                    onChange={handleChange}
                    placeholder={product ? "Código actual" : "Se genera al seleccionar categoría"}
                    required
                    disabled={!!product}
                    readOnly={!product}
                    style={!product ? { backgroundColor: 'rgba(99, 102, 241, 0.1)', cursor: 'not-allowed' } : {}}
                  />
                </div>

                <div className="input-group">
                  <label>Nombre <span className="required">*</span></label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Nombre del producto"
                    required
                  />
                </div>

                <div className="input-group full-width">
                  <label>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Descripción del producto (opcional)"
                    rows="3"
                  />
                </div>

                {/* Sección de imagen */}
                <div className="input-group full-width">
                  <label>Imagen del Producto</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Toggle entre 2D y 3D */}
                    <div style={{ width: '100%', marginBottom: '0.5rem', display: 'flex', gap: '1rem' }}>
                      <button 
                        type="button" 
                        onClick={() => setShow3D(false)}
                        className={!show3D ? 'primary' : 'secondary'}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      >
                        📷 Foto 2D
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShow3D(true)}
                        className={show3D ? 'primary' : 'secondary'}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      >
                        🧊 Vista 3D
                      </button>
                    </div>

                    {show3D ? (
                      <div style={{ 
                        width: '100%', 
                        height: '300px', 
                        background: 'radial-gradient(circle at center, #2a2d3e 0%, #1a1c29 100%)', 
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                         <ErrorBoundary fallback={
                           <div style={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                             <p>⚠️ Error al cargar vista 3D</p>
                           </div>
                         }>
                           <Product3DViewer 
                             category={categories.find(c => c.idCategoria == formData.idCategoria)?.nombre} 
                             color="#f97316"
                           />
                         </ErrorBoundary>
                      </div>
                    ) : (
                      <>
                        {imagePreview ? (
                          <div style={{ position: 'relative' }}>
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              style={{ 
                                width: '120px', 
                                height: '120px', 
                                objectFit: 'cover', 
                                borderRadius: '8px',
                                border: '2px solid rgba(255,255,255,0.1)'
                              }} 
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              width: '120px',
                              height: '120px',
                              border: '2px dashed rgba(255,255,255,0.2)',
                              borderRadius: '8px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: 'rgba(255,255,255,0.5)',
                              fontSize: '12px',
                              textAlign: 'center',
                              padding: '8px'
                            }}
                          >
                            <span style={{ fontSize: '24px', marginBottom: '4px' }}>📷</span>
                            Click para subir
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          style={{ display: 'none' }}
                        />
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                          <p style={{ margin: '0 0 4px 0' }}>Formatos: JPG, PNG, GIF</p>
                          <p style={{ margin: 0 }}>Tamaño máximo: 2MB</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="input-group">
                  <label>Marca</label>
                  <input
                    type="text"
                    name="marca"
                    value={formData.marca}
                    onChange={handleChange}
                    placeholder="Ej: Toyota, Hyundai..."
                  />
                </div>

                <div className="input-group">
                  <label>Modelo Compatible</label>
                  <input
                    type="text"
                    name="modeloCompatible"
                    value={formData.modeloCompatible}
                    onChange={handleChange}
                    placeholder="Ej: Corolla 2020"
                  />
                </div>

                <div className="input-group">
                  <label>Ubicación en Almacén</label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleChange}
                    placeholder="Ej: Estante A-3"
                  />
                </div>

                <div className="input-group">
                  <label>Precio Compra (S/)</label>
                  <input
                    type="number"
                    name="precioCompra"
                    value={formData.precioCompra}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="input-group">
                  <label>Precio Venta (S/) <span className="required">*</span></label>
                  <input
                    type="number"
                    name="precio"
                    value={formData.precio}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Stock <span className="required">*</span></label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Stock Mínimo</label>
                  <input
                    type="number"
                    name="stockMinimo"
                    value={formData.stockMinimo}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="input-group full-width">
                  <label>Proveedor</label>
                  <select
                    name="idProveedor"
                    value={formData.idProveedor}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar proveedor...</option>
                    {suppliers.map(sup => (
                      <option key={sup.idProveedor} value={sup.idProveedor}>
                        {sup.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="primary" disabled={loading}>
                {loading ? 'Guardando...' : product ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
