import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const ToastContext = createContext({ notify: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const notify = useCallback((message, opts = {}) => {
    const id = Math.random().toString(36).slice(2)
    const toast = { id, message, type: opts.type || 'info', duration: opts.duration ?? 3000 }
    setToasts((t) => [...t, toast])
    if (toast.duration > 0) {
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id))
      }, toast.duration)
    }
  }, [])

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className={`toast toast--${t.type}`}
              onClick={() => remove(t.id)}
              role="status"
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
