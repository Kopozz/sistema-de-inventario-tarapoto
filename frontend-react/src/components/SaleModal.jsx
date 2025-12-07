import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '../utils/api'
import { useToast } from './ToastProvider'

export default function SaleModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    nombreCliente: '',
    documentoCliente: '',
    metodoPago: 'efectivo'
  })

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      setCart([])
      setSelectedProduct(null)
      setSearchTerm('')
      setFormData({
        nombreCliente: '',
        documentoCliente: '',
        metodoPago: 'efectivo'
      })
    }
  }, [isOpen])

  const fetchProducts = async () => {
    try {
      const response = await apiFetch('/api/productos')
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Productos recibidos:', data.productos)
        setProducts(data.productos || [])
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
    }
  }

  const handleAddToCart = () => {
    if (!selectedProduct) {
      toast.notify('Selecciona un producto', { type: 'error' })
      return
    }

    const product = selectedProduct
    const availableStock = getAvailableStock(product.idProducto)

    if (quantity > availableStock) {
      toast.notify(`Stock insuficiente. Disponible: ${availableStock}`, { type: 'error' })
      return
    }

    const existingItem = cart.find(item => item.idProducto === product.idProducto)
    
    if (existingItem) {
      if (existingItem.cantidad + quantity > (product.stockActual || product.stock)) {
        toast.notify('No puedes agregar más de lo disponible en stock', { type: 'error' })
        return
      }
      setCart(cart.map(item => 
        item.idProducto === product.idProducto
          ? { ...item, cantidad: item.cantidad + quantity }
          : item
      ))
    } else {
      setCart([...cart, {
        idProducto: product.idProducto,
        codigo: product.codigo,
        nombre: product.nombre,
        imagen: product.imagen,
        categoria: product.nombreCategoria,
        precio: parseFloat(product.precioVenta || product.precio),
        cantidad: quantity,
        stock: product.stockActual || product.stock
      }])
    }

    setSelectedProduct(null)
    setQuantity(1)
    toast.notify(`✅ ${product.nombre} agregado`, { type: 'success' })
  }

  // Calcular stock disponible (stock original - cantidad en carrito)
  const getAvailableStock = (productId) => {
    const product = products.find(p => p.idProducto === productId)
    if (!product) return 0
    const inCart = cart.find(item => item.idProducto === productId)
    const cartQty = inCart ? inCart.cantidad : 0
    return (product.stockActual || product.stock || 0) - cartQty
  }

  // Filtrar productos por búsqueda
  const filteredProducts = products.filter(p => {
    const search = searchTerm.toLowerCase()
    return (
      p.nombre?.toLowerCase().includes(search) ||
      p.codigo?.toLowerCase().includes(search) ||
      p.nombreCategoria?.toLowerCase().includes(search)
    )
  })

  const handleRemoveFromCart = (idProducto) => {
    setCart(cart.filter(item => item.idProducto !== idProducto))
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (Number(item.precio || 0) * item.cantidad), 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (cart.length === 0) {
      toast.notify('Agrega productos a la venta', { type: 'error' })
      return
    }

    if (!formData.nombreCliente) {
      toast.notify('Ingresa el nombre del cliente', { type: 'error' })
      return
    }

    setLoading(true)
    try {
      const ventaData = {
        nombreCliente: formData.nombreCliente,
        documentoCliente: formData.documentoCliente || null,
        metodoPago: formData.metodoPago,
        total: calculateTotal(),
        detalles: cart.map(item => ({
          idProducto: item.idProducto,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
          subtotal: item.precio * item.cantidad
        }))
      }

      const response = await apiFetch('/api/ventas', {
        method: 'POST',
        body: JSON.stringify(ventaData)
      })

      if (response.ok) {
        const result = await response.json()
        toast.notify(`✅ Venta ${result.numeroVenta || '#' + result.idVenta} registrada correctamente`, { type: 'success' })
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.notify(error.message || 'Error al registrar venta', { type: 'error' })
      }
    } catch (error) {
      toast.notify('Error al registrar venta', { type: 'error' })
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
          style={{ maxWidth: '700px' }}
        >
          <div className="modal-header">
            <h2>✨ Nueva Venta</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Datos del Cliente */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ 
                  marginBottom: '1rem', 
                  fontSize: '1.1rem',
                  color: '#6366f1',
                  fontWeight: '600'
                }}>
                  👤 Datos del Cliente
                </h3>
                <div className="form-grid">
                  <div className="input-group full-width">
                    <label>Nombre <span className="required">*</span></label>
                    <input
                      type="text"
                      value={formData.nombreCliente}
                      onChange={(e) => setFormData({...formData, nombreCliente: e.target.value})}
                      placeholder="Nombre completo del cliente"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Documento</label>
                    <input
                      type="text"
                      value={formData.documentoCliente}
                      onChange={(e) => setFormData({...formData, documentoCliente: e.target.value})}
                      placeholder="DNI, RUC, etc. (opcional)"
                    />
                  </div>
                  <div className="input-group">
                    <label>Método de Pago <span className="required">*</span></label>
                    <select
                      value={formData.metodoPago}
                      onChange={(e) => setFormData({...formData, metodoPago: e.target.value})}
                      required
                    >
                      <option value="efectivo">💵 Efectivo</option>
                      <option value="tarjeta">💳 Tarjeta</option>
                      <option value="transferencia">🏦 Transferencia</option>
                      <option value="yape">📱 Yape</option>
                      <option value="plin">💸 Plin</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Agregar Productos */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ 
                  marginBottom: '1rem', 
                  fontSize: '1.1rem',
                  color: '#6366f1',
                  fontWeight: '600'
                }}>
                  📦 Seleccionar Productos
                </h3>
                
                {/* Búsqueda */}
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="🔍 Buscar por nombre, código o categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Grid de productos */}
                <div style={{ 
                  maxHeight: '250px', 
                  overflowY: 'auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '0.75rem',
                  padding: '0.5rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '10px'
                }}>
                  {filteredProducts.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
                      No se encontraron productos
                    </div>
                  ) : (
                    filteredProducts.map(product => {
                      const availableStock = getAvailableStock(product.idProducto)
                      const isSelected = selectedProduct?.idProducto === product.idProducto
                      const isOutOfStock = availableStock <= 0
                      
                      return (
                        <div
                          key={product.idProducto}
                          onClick={() => !isOutOfStock && setSelectedProduct(product)}
                          style={{
                            padding: '0.75rem',
                            background: isSelected 
                              ? 'rgba(99, 102, 241, 0.3)' 
                              : isOutOfStock 
                                ? 'rgba(239, 68, 68, 0.1)' 
                                : 'rgba(255,255,255,0.05)',
                            border: isSelected 
                              ? '2px solid #6366f1' 
                              : '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                            opacity: isOutOfStock ? 0.5 : 1,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Imagen */}
                          <div style={{ 
                            width: '100%', 
                            height: '80px', 
                            marginBottom: '0.5rem',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: 'rgba(99, 102, 241, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {product.imagen ? (
                              <img 
                                src={product.imagen} 
                                alt={product.nombre}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <span style={{ fontSize: '2rem' }}>📦</span>
                            )}
                          </div>
                          
                          {/* Código */}
                          <div style={{ 
                            fontSize: '0.7rem', 
                            color: '#6366f1',
                            fontWeight: '600',
                            marginBottom: '0.25rem'
                          }}>
                            {product.codigo}
                          </div>
                          
                          {/* Nombre */}
                          <div style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {product.nombre}
                          </div>
                          
                          {/* Precio y Stock */}
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.8rem'
                          }}>
                            <span style={{ color: '#10b981', fontWeight: '700' }}>
                              S/ {Number(product.precioVenta || product.precio || 0).toFixed(2)}
                            </span>
                            <span style={{ 
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              background: availableStock <= 0 
                                ? 'rgba(239, 68, 68, 0.2)' 
                                : availableStock <= 5 
                                  ? 'rgba(251, 146, 60, 0.2)' 
                                  : 'rgba(16, 185, 129, 0.2)',
                              color: availableStock <= 0 
                                ? '#ef4444' 
                                : availableStock <= 5 
                                  ? '#fb923c' 
                                  : '#10b981'
                            }}>
                              {availableStock <= 0 ? 'Agotado' : `Stock: ${availableStock}`}
                            </span>
                          </div>
                          
                          {/* Categoría */}
                          {product.nombreCategoria && (
                            <div style={{ 
                              marginTop: '0.5rem',
                              fontSize: '0.65rem',
                              padding: '0.2rem 0.4rem',
                              background: 'rgba(59, 130, 246, 0.15)',
                              borderRadius: '4px',
                              color: '#3b82f6',
                              display: 'inline-block'
                            }}>
                              {product.nombreCategoria}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Producto seleccionado y cantidad */}
                {selectedProduct && (
                  <div style={{ 
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '10px',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    {/* Preview imagen */}
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: 'rgba(99, 102, 241, 0.2)',
                      flexShrink: 0
                    }}>
                      {selectedProduct.imagen ? (
                        <img src={selectedProduct.imagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600' }}>{selectedProduct.nombre}</div>
                      <div style={{ fontSize: '0.85rem', color: '#10b981' }}>
                        S/ {Number(selectedProduct.precioVenta || selectedProduct.precio || 0).toFixed(2)} × {quantity} = S/ {(Number(selectedProduct.precioVenta || selectedProduct.precio || 0) * quantity).toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Cantidad */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        type="button"
                        onClick={() => quantity > 1 && setQuantity(q => q - 1)}
                        style={{ 
                          width: '30px', height: '30px', 
                          borderRadius: '6px', border: 'none',
                          background: 'rgba(255,255,255,0.1)',
                          color: 'white', cursor: 'pointer',
                          fontSize: '1.2rem'
                        }}
                      >−</button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        max={getAvailableStock(selectedProduct.idProducto)}
                        style={{ width: '50px', textAlign: 'center' }}
                      />
                      <button 
                        type="button"
                        onClick={() => quantity < getAvailableStock(selectedProduct.idProducto) && setQuantity(q => q + 1)}
                        style={{ 
                          width: '30px', height: '30px', 
                          borderRadius: '6px', border: 'none',
                          background: 'rgba(255,255,255,0.1)',
                          color: 'white', cursor: 'pointer',
                          fontSize: '1.2rem'
                        }}
                      >+</button>
                    </div>
                    
                    {/* Agregar */}
                    <button
                      type="button"
                      className="primary"
                      onClick={handleAddToCart}
                      style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}
                    >
                      + Agregar
                    </button>
                  </div>
                )}
              </div>

              {/* Carrito */}
              {cart.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ 
                    marginBottom: '1rem', 
                    fontSize: '1.1rem',
                    color: '#6366f1',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    🛒 Productos en la Venta 
                    <span style={{ 
                      background: '#6366f1', 
                      color: 'white', 
                      padding: '0.15rem 0.5rem', 
                      borderRadius: '10px',
                      fontSize: '0.8rem'
                    }}>
                      {cart.length} {cart.length === 1 ? 'item' : 'items'}
                    </span>
                  </h3>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '50px' }}></th>
                          <th>Producto</th>
                          <th style={{ textAlign: 'center' }}>Cantidad</th>
                          <th style={{ textAlign: 'right' }}>Precio Unit.</th>
                          <th style={{ textAlign: 'right' }}>Subtotal</th>
                          <th style={{ width: '50px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map(item => (
                          <tr key={item.idProducto}>
                            {/* Imagen */}
                            <td style={{ padding: '0.5rem' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                background: 'rgba(99, 102, 241, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {item.imagen ? (
                                  <img src={item.imagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <span style={{ fontSize: '1.2rem' }}>📦</span>
                                )}
                              </div>
                            </td>
                            {/* Info Producto */}
                            <td>
                              <div style={{ fontWeight: '600' }}>{item.nombre}</div>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                                <span style={{ fontSize: '0.75rem', color: '#6366f1' }}>{item.codigo}</span>
                                {item.categoria && (
                                  <span style={{ 
                                    fontSize: '0.65rem',
                                    padding: '0.1rem 0.3rem',
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    borderRadius: '3px',
                                    color: '#3b82f6'
                                  }}>
                                    {item.categoria}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: '600' }}>×{item.cantidad}</td>
                            <td style={{ textAlign: 'right' }}>S/ {Number(item.precio || 0).toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontWeight: '700', color: '#10b981' }}>
                              S/ {(Number(item.precio || 0) * item.cantidad).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() => handleRemoveFromCart(item.idProducto)}
                                title="Eliminar"
                                style={{ color: '#ef4444' }}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ 
                    textAlign: 'right', 
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '10px',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                  }}>
                    <span style={{ fontSize: '1.1rem', color: 'rgba(234, 234, 234, 0.7)' }}>
                      Total a Pagar:{' '}
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#6366f1' }}>
                      S/ {calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {cart.length === 0 && (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '10px',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  marginBottom: '1rem'
                }}>
                  <p style={{ color: 'rgba(234, 234, 234, 0.5)', margin: 0 }}>
                    🛒 No hay productos agregados
                  </p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="primary" disabled={loading || cart.length === 0}>
                {loading ? '⏳ Procesando...' : '✅ Registrar Venta'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
