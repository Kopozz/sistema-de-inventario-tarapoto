import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar' }) {
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
          style={{ maxWidth: '400px' }}
        >
          <div className="modal-header">
            <h2>{title || '¿Estás seguro?'}</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <p style={{ marginBottom: '1.5rem', color: 'rgba(234, 234, 234, 0.8)' }}>
              {message || '¿Deseas continuar con esta acción?'}
            </p>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={onClose}>
                {cancelText}
              </button>
              <button 
                type="button" 
                className="primary" 
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                }}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
