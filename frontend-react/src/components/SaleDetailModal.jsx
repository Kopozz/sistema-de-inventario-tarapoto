import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '../utils/api'

export default function SaleDetailModal({ isOpen, onClose, sale }) {
  const [loading, setLoading] = useState(false)
  const [saleDetails, setSaleDetails] = useState(null)

  useEffect(() => {
    if (isOpen && sale) {
      fetchSaleDetails()
    }
  }, [isOpen, sale])

  const fetchSaleDetails = async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/ventas/${sale.idVenta}`)
      if (response.ok) {
        const data = await response.json()
        setSaleDetails(data.venta || data)
      }
    } catch (error) {
      console.error('Error al cargar detalles:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMethodIcon = (method) => {
    const icons = {
      efectivo: '💵',
      tarjeta: '💳',
      transferencia: '🏦',
      yape: '📱',
      plin: '💸'
    }
    return icons[method?.toLowerCase()] || '💰'
  }

  const getMethodLabel = (method) => {
    const labels = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia',
      yape: 'Yape',
      plin: 'Plin'
    }
    return labels[method?.toLowerCase()] || method || 'N/A'
  }

  if (!isOpen || !sale) return null

  const displayData = saleDetails || sale
  const detalles = displayData.detalles || []

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
          style={{ maxWidth: '750px' }}
        >
          <div className="modal-header">
            <h2>📋 Detalle de Venta</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="loading-spinner">Cargando detalles...</div>
              </div>
            ) : (
              <>
                {/* Header con número de venta */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))',
                  borderRadius: '12px',
                  border: '1px solid rgba(99, 102, 241, 0.3)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                      Número de Venta
                    </div>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: '700', 
                      color: '#6366f1'
                    }}>
                      {displayData.numeroVenta || `V-${displayData.idVenta}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                      Fecha
                    </div>
                    <div style={{ fontWeight: '500' }}>
                      {formatDate(displayData.fechaVenta)}
                    </div>
                  </div>
                </div>

                {/* Info del cliente y pago */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  {/* Cliente */}
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      👤 Cliente
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                      {displayData.nombreCliente || 'Cliente General'}
                    </div>
                    {displayData.documentoCliente && (
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
                        Doc: {displayData.documentoCliente}
                      </div>
                    )}
                  </div>

                  {/* Método de Pago */}
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      💳 Método de Pago
                    </div>
                    <div style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: 'rgba(16, 185, 129, 0.15)',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>
                        {getMethodIcon(displayData.metodoPago)}
                      </span>
                      <span style={{ fontWeight: '600', color: '#10b981' }}>
                        {getMethodLabel(displayData.metodoPago)}
                      </span>
                    </div>
                  </div>

                  {/* Vendedor */}
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      🏪 Vendedor
                    </div>
                    <div style={{ fontWeight: '600' }}>
                      {displayData.nombreVendedor || displayData.vendedorNombre || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Productos de la venta */}
                <div>
                  <h3 style={{ 
                    marginBottom: '1rem', 
                    fontSize: '1.1rem',
                    color: '#6366f1',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    📦 Productos Vendidos
                    <span style={{ 
                      background: '#6366f1', 
                      color: 'white', 
                      padding: '0.15rem 0.5rem', 
                      borderRadius: '10px',
                      fontSize: '0.8rem'
                    }}>
                      {detalles.length} {detalles.length === 1 ? 'producto' : 'productos'}
                    </span>
                  </h3>

                  {detalles.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '2rem',
                      color: 'rgba(255,255,255,0.5)',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '10px'
                    }}>
                      No se encontraron detalles de productos
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th style={{ width: '50px' }}></th>
                            <th>Producto</th>
                            <th style={{ textAlign: 'center' }}>Cantidad</th>
                            <th style={{ textAlign: 'right' }}>Precio Unit.</th>
                            <th style={{ textAlign: 'right' }}>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detalles.map((item, index) => (
                            <tr key={item.idDetalleVenta || index}>
                              {/* Imagen */}
                              <td style={{ padding: '0.5rem' }}>
                                <div style={{
                                  width: '45px',
                                  height: '45px',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  background: 'rgba(99, 102, 241, 0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {item.imagen ? (
                                    <img 
                                      src={item.imagen} 
                                      alt="" 
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                  ) : (
                                    <span style={{ fontSize: '1.5rem' }}>📦</span>
                                  )}
                                </div>
                              </td>
                              {/* Producto info */}
                              <td>
                                <div style={{ fontWeight: '600' }}>
                                  {item.nombreProducto || item.nombre || 'Producto'}
                                </div>
                                <div style={{ 
                                  display: 'flex', 
                                  gap: '0.5rem', 
                                  alignItems: 'center',
                                  marginTop: '0.25rem'
                                }}>
                                  {item.codigoProducto && (
                                    <span style={{ 
                                      fontSize: '0.75rem', 
                                      color: '#6366f1',
                                      fontWeight: '500'
                                    }}>
                                      {item.codigoProducto}
                                    </span>
                                  )}
                                  {item.nombreCategoria && (
                                    <span style={{ 
                                      fontSize: '0.65rem',
                                      padding: '0.1rem 0.4rem',
                                      background: 'rgba(59, 130, 246, 0.15)',
                                      borderRadius: '4px',
                                      color: '#3b82f6'
                                    }}>
                                      {item.nombreCategoria}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: '600' }}>
                                ×{item.cantidad}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                S/ {parseFloat(item.precioUnitario || 0).toFixed(2)}
                              </td>
                              <td style={{ 
                                textAlign: 'right', 
                                fontWeight: '700', 
                                color: '#10b981' 
                              }}>
                                S/ {parseFloat(item.subtotal || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div style={{ 
                  marginTop: '1.5rem',
                  padding: '1.25rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)' }}>
                      Total de la Venta
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                      {detalles.length} producto(s)
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '2rem', 
                    fontWeight: '800', 
                    color: '#10b981'
                  }}>
                    S/ {(parseFloat(displayData.total || displayData.montoTotal || detalles.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0))).toFixed(2)}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
