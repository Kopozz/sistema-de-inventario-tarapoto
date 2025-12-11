import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import ChangePasswordModal from '../components/ChangePasswordModal'
import ProductModal from '../components/ProductModal'
import CategoryModal from '../components/CategoryModal'
import SupplierModal from '../components/SupplierModal'
import SaleModal from '../components/SaleModal'
import SaleDetailModal from '../components/SaleDetailModal'
import MovementModal from '../components/MovementModal'
import ConfirmDialog from '../components/ConfirmDialog'
import SearchInput from '../components/SearchInput'
import EditProfileModal from '../components/EditProfileModal'
import UserRoleModal from '../components/UserRoleModal'
import { AnimatedIcons } from '../components/AnimatedIcons'
import LottieIcon from '../components/LottieIcon'
import ThemeSwitch from '../components/ThemeSwitch'
import { apiFetch } from '../utils/api'
import { exportToPDF, exportToExcel } from '../utils/export'
import { COMPANY_INFO } from '../utils/company'
import { useToast } from '../components/ToastProvider'

// Usar iconos animados
const Icons = AnimatedIcons

export default function Dashboard() {
  const navigate = useNavigate()
  const toast = useToast()
  const [activeView, setActiveView] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [themeLoading, setThemeLoading] = useState(false) // Loader para cambio de tema
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Cargar preferencia guardada en localStorage
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : true // Por defecto modo oscuro
  })

  // Estados globales para categorías y productos
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])

  // Helper para verificar si el usuario es administrador
  const isAdmin = () => {
    const admin = !!userData && userData.idRol === 1
    console.log('🔐 Verificando admin:', { userData, idRol: userData?.idRol, isAdmin: admin })
    return admin
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await apiFetch('/api/usuarios/me')
        if (response.ok) {
          const data = await response.json()
          console.log('📊 Datos del usuario recibidos:', data.usuario)
          console.log('👤 Rol del usuario:', data.usuario?.idRol, '(1=Admin, 2=Vendedor)')
          console.log('🎭 Nombre del rol:', data.usuario?.nombreRol)
          setUserData(data.usuario)
        } else {
          console.error('❌ Error al obtener datos del usuario:', response.status)
        }
      } catch (error) {
        console.error('❌ Error al obtener datos del usuario:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [])

  // Cargar categorías y productos al inicio
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const resCat = await apiFetch('/api/categorias')
        if (resCat.ok) {
          const data = await resCat.json()
          setCategories(data.categorias || [])
        }
        const resProd = await apiFetch('/api/productos')
        if (resProd.ok) {
          const data = await resProd.json()
          setProducts(data.productos || [])
        }
      } catch (e) {
        toast.error('Error al cargar datos globales')
      }
    }
    fetchAll()
  }, [])

  // Guardar preferencia de tema con animación de carga
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    // Actualizar clase en el body para estilos globales
    document.body.classList.toggle('light-mode', !isDarkMode)
  }, [isDarkMode])

  const toggleTheme = () => {
    setThemeLoading(true) // Activar loader
    setTimeout(() => {
      setIsDarkMode(!isDarkMode)
      setTimeout(() => {
        setThemeLoading(false) // Desactivar loader después de aplicar cambios
      }, 500) // Medio segundo para que se apliquen los estilos
    }, 300) // Pequeño delay para mostrar el loader
  }

  // Responsive: Auto-close sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    // Set initial state
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const logout = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      // Llamar al endpoint de logout para actualizar fechaFinSesion
      if (token) {
        await fetch(`${API_BASE}/api/usuarios/logout`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => {}) // Ignorar errores de red
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      // Limpiar tokens y datos guardados
      localStorage.removeItem('token')
      localStorage.removeItem('remembered_email') // ⭐ Limpiar email recordado
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('login_attempts')
      sessionStorage.setItem('just_logged_out', 'true') // ⭐ Flag para limpiar formulario
      toast.notify('Sesión cerrada correctamente', { type: 'success' })
      navigate('/')
    }
  }

  const handleProfileUpdate = (updatedUser) => {
    setUserData(updatedUser)
    toast.notify('Perfil actualizado correctamente', { type: 'success' })
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', iconName: 'dashboard' },
    { id: 'products', label: 'Productos', iconName: 'products' },
    { id: 'categories', label: 'Categorías', iconName: 'categories' },
    { id: 'suppliers', label: 'Proveedores', iconName: 'suppliers' },
    { id: 'sales', label: 'Ventas', iconName: 'sales' },
    { id: 'inventory', label: 'Inventario', iconName: 'inventory' },
    { id: 'reports', label: 'Reportes', iconName: 'reports' },
    ...(isAdmin() ? [{ id: 'users', label: 'Usuarios', iconName: 'users' }] : []),
    { id: 'settings', label: 'Configuración', iconName: 'settings' },
  ]

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="center" style={{ height: '100vh' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="loading-spinner"
          >
            Cargando...
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className={`dashboard-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Fondo con gradiente según el modo */}
      <div 
        className="dashboard-background"
        style={{
          backgroundImage: isDarkMode 
            ? 'radial-gradient(125% 125% at 50% 10%, #000000 40%, #2b0707 100%)'
            : 'radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #f59e0b 100%)'
        }}
      />

      {/* Loader para cambio de tema */}
      <AnimatePresence>
        {themeLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                scale: { duration: 0.5, repeat: Infinity }
              }}
              style={{
                fontSize: '3rem'
              }}
            >
              {isDarkMode ? '🌙' : '☀️'}
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                color: '#f97316',
                fontSize: '1.25rem',
                fontWeight: 600
              }}
            >
              Cambiando a modo {isDarkMode ? 'oscuro' : 'claro'}...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}
      >
        {/* Logo y Nombre de la Empresa */}
        <div className="sidebar-header">
          <motion.div 
            className="sidebar-logo"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <img src="/assets/logo.png" alt="Logo" className="sidebar-logo-img" />
          </motion.div>
          {sidebarOpen && (
            <motion.div
              className="sidebar-company-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2>Rectificadora de Repuestos en Tarapoto S.A.C</h2>
            </motion.div>
          )}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.id}
              className={`sidebar-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: sidebarOpen ? 4 : 0, backgroundColor: 'rgba(249, 115, 22, 0.1)' }}
            >
              <LottieIcon name={item.iconName} size={22} />
              {sidebarOpen && <span>{item.label}</span>}
            </motion.button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <motion.button
            className="sidebar-item logout"
            onClick={logout}
            whileHover={{ x: sidebarOpen ? 4 : 0, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
          >
            <LottieIcon name="logout" size={22} />
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </motion.button>
        </div>

        {/* Botón Toggle en el borde del sidebar */}
        <motion.button 
          className="sidebar-toggle-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title={sidebarOpen ? 'Contraer menú' : 'Expandir menú'}
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ 
              transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s ease'
            }}
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </motion.button>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-title">
            <h1>{menuItems.find(item => item.id === activeView)?.label || 'Dashboard'}</h1>
          </div>

          <div className="header-user">
            {userData && (
              <>
                <span className="user-name">{userData.nombre || userData.nombreCompleto || 'Usuario'}</span>
                <div className="user-avatar">
                  {(userData.nombre || userData.nombreCompleto)?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </>
            )}
            <div className="theme-switch-container">
              <ThemeSwitch checked={isDarkMode} onChange={toggleTheme} />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="dashboard-content">
          {/* Contenido de Vistas sin Animaciones para Debug */}
          <div className="view-content-wrapper">
              {activeView === 'dashboard' && <DashboardView userData={userData} setActiveView={setActiveView} isAdmin={isAdmin()} />}
              {activeView === 'products' && <ProductsView isAdmin={isAdmin()} categories={categories} products={products} setProducts={setProducts} />}
              {activeView === 'categories' && <CategoriesView isAdmin={isAdmin()} products={products} categories={categories} setCategories={setCategories} isDarkMode={isDarkMode} />}
              {activeView === 'suppliers' && <SuppliersView isAdmin={isAdmin()} />}
              {activeView === 'sales' && <SalesView isAdmin={isAdmin()} />}
              {activeView === 'inventory' && <InventoryView isAdmin={isAdmin()} />}
              {activeView === 'reports' && <ReportsView isAdmin={isAdmin()} />}
              {activeView === 'users' && isAdmin() && <UsersView />}
              {activeView === 'settings' && (
                <SettingsView 
                  userData={userData}
                  onPasswordChange={() => setShowPasswordModal(true)}
                  onProfileUpdate={handleProfileUpdate}
                  isAdmin={isAdmin()}
                />
              )}
          </div>
        </div>
      </main>

      <ChangePasswordModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  )
}

// Vista Dashboard Principal
function DashboardView({ userData, setActiveView }) {
  const [stats, setStats] = useState({
    totalProductos: 0,
    ventasHoy: { cantidad: 0, monto: 0 },
    ventasMes: { cantidad: 0, monto: 0 },
    productosStockBajo: 0,
    valorInventario: 0,
    topProductos: [],
    productosAlerta: [],
    ventasPorDia: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await apiFetch('/api/estadisticas/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { 
      label: 'Total Productos', 
      value: stats.totalProductos, 
      color: '#f97316', 
      icon: 'products', 
      view: 'products',
      description: 'En inventario'
    },
    { 
      label: 'Ventas Hoy', 
      value: stats.ventasHoy.cantidad, 
      color: '#10b981', 
      icon: 'sales', 
      view: 'sales',
  description: `S/ ${stats.ventasHoy.monto.toFixed(2)}`,
      highlight: true
    },
    { 
      label: 'Ventas del Mes', 
      value: stats.ventasMes.cantidad, 
      color: '#6366f1', 
      icon: 'sales', 
      view: 'sales',
  description: `S/ ${stats.ventasMes.monto.toFixed(2)}`
    },
    { 
      label: 'Stock Bajo', 
      value: stats.productosStockBajo, 
      color: stats.productosStockBajo > 0 ? '#ef4444' : '#71717a', 
      icon: 'products', 
      view: 'products',
      description: 'Productos en alerta',
      alert: stats.productosStockBajo > 0
    }
  ]

  const quickActions = [
    { label: 'Nuevo Producto', icon: 'add', view: 'products', color: '#f97316' },
    { label: 'Nueva Categoría', icon: 'add', view: 'categories', color: '#ea580c' },
    { label: 'Registrar Venta', icon: 'sales', view: 'sales', color: '#71717a' },
    { label: 'Ver Reportes', icon: 'reports', view: 'reports', color: '#fb923c' }
  ]

  return (
    <div className="view-container">
      <motion.div 
        className="welcome-card"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>¡Bienvenido, {userData?.nombre || userData?.nombreCompleto || 'Usuario'}!</h2>
        <p>Panel de control del sistema de inventario</p>
      </motion.div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
            style={{ 
              borderTop: `3px solid ${stat.color}`, 
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={() => setActiveView(stat.view)}
          >
            {stat.alert && (
              <motion.div
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)'
                }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
            <div className="stat-icon">
              <LottieIcon name={stat.icon} size={48} />
            </div>
            <div className="stat-info">
              <h3 style={{ color: stat.highlight ? stat.color : '#eaeaea' }}>
                {stat.value}
              </h3>
              <p>{stat.label}</p>
              {stat.description && (
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: stat.highlight ? stat.color : 'rgba(234, 234, 234, 0.5)',
                  marginTop: '0.25rem',
                  fontWeight: stat.highlight ? '600' : '400'
                }}>
                  {stat.description}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="quick-actions">
        <h3>Acciones Rápidas</h3>
        <div className="actions-grid">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              className="action-btn"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveView(action.view)}
              style={{ borderLeft: `4px solid ${action.color}` }}
            >
              <span className="action-icon">
                <LottieIcon name={action.icon} size={28}  />
              </span>
              <span>{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Top Productos Más Vendidos */}
      {stats.topProductos.length > 0 && (
        <motion.div 
          className="recent-activity"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LottieIcon name="reports" size={22} />
            Top Productos del Mes
          </h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style={{ textAlign: 'center' }}>Cantidad Vendida</th>
                  <th style={{ textAlign: 'right' }}>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProductos.map((producto, index) => (
                  <tr key={producto.codigo}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ 
                          width: '28px',
                          height: '28px',
                          background: index === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' :
                                     index === 1 ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' :
                                     index === 2 ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' :
                                     'rgba(99, 102, 241, 0.2)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '0.875rem'
                        }}>
                          {index + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: '600' }}>{producto.nombre}</div>
                          <div style={{ fontSize: '0.85rem', color: 'rgba(234, 234, 234, 0.5)' }}>
                            {producto.codigo}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '600', color: '#6366f1' }}>
                      {producto.totalVendido}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#10b981' }}>
                      S/ {producto.ingresoTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Alertas de Stock Bajo */}
      {stats.productosAlerta.length > 0 && (
        <motion.div 
          className="recent-activity"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}
        >
          <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LottieIcon name="inventory" size={22} color="#ef4444" />
            Productos con Stock Bajo
          </h3>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th style={{ textAlign: 'center' }}>Stock Actual</th>
                  <th style={{ textAlign: 'center' }}>Stock Mínimo</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {stats.productosAlerta.map((producto) => (
                  <tr key={producto.idProducto}>
                    <td style={{ fontWeight: '600', color: '#6366f1' }}>{producto.codigo}</td>
                    <td>{producto.nombre}</td>
                    <td style={{ textAlign: 'center', fontWeight: '700', color: '#ef4444' }}>
                      {producto.stockActual}
                    </td>
                    <td style={{ textAlign: 'center' }}>{producto.stockMinimo}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        background: producto.stockActual === 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(251, 146, 60, 0.2)',
                        border: `1px solid ${producto.stockActual === 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(251, 146, 60, 0.4)'}`,
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: producto.stockActual === 0 ? '#ef4444' : '#fb923c'
                      }}>
                        {producto.stockActual === 0 ? 'Sin Stock' : 'Stock Bajo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <button 
              className="primary"
              onClick={() => setActiveView('products')}
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
            >
              Ver Todos los Productos
            </button>
          </div>
        </motion.div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p className="loading-spinner">⏳ Cargando estadísticas...</p>
        </div>
      )}
    </div>
  )
}

// Vista Productos
function ProductsView({ isAdmin, categories, products, setProducts }) {
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState({
    marca: '',
    modeloCompatible: '',
    ubicacion: '',
    categoria: '',
    stockBajo: false
  })
  const toast = useToast()

  // Mapa de prefijos de código a nombre de categoría como último fallback
  const categoriaPorCodigo = {
    MOT: 'Motor',
    FRE: 'Frenos',
    SUS: 'Suspension',
    ELE: 'Electrico',
    TRA: 'Transmision',
    ROD: 'Rodamientos',
    REF: 'Refrigeracion',
    CAR: 'Carroceria'
  }

  // Mapa idCategoria -> nombre para resolver rápido el nombre de categoría
  const categoriaMap = React.useMemo(() => {
    const map = {}
    for (const c of categories || []) {
      const id = Number(c?.idCategoria)
      if (!Number.isNaN(id)) map[id] = c?.nombre
    }
    return map
  }, [categories])

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await apiFetch('/api/productos')
      if (response.ok) {
        const data = await response.json()
        // Normalizamos productos para que idCategoria sea Number y rellenamos nombreCategoria si falta
        const prods = (data.productos || []).map(p => {
          const idCat = Number(p.idCategoria)
          return {
            ...p,
            idCategoria: Number.isNaN(idCat) ? null : idCat,
            nombreCategoria: p.nombreCategoria || categoriaMap[idCat] || null
          }
        })
        setProducts(prods)
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
      toast.notify('Error al cargar productos', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Cuando el mapa de categorías esté listo, completa nombreCategoria en productos que no lo tengan
  useEffect(() => {
    if (!products?.length) return
    const hasMap = Object.keys(categoriaMap).length > 0
    if (!hasMap) return
    setProducts(prev => prev.map(p => {
      const idCat = Number(p.idCategoria)
      const nombreCat = p.nombreCategoria || categoriaMap[idCat] || null
      return nombreCat === p.nombreCategoria ? p : { ...p, nombreCategoria: nombreCat }
    }))
  }, [categoriaMap])

  const handleEdit = (product) => {
    setSelectedProduct(product)
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!selectedProduct) return
    
    try {
      const response = await apiFetch(`/api/productos/${selectedProduct.idProducto}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.notify('Producto eliminado correctamente', { type: 'success' })
        fetchProducts()
      } else {
        const error = await response.json()
        toast.notify(error.message || 'Error al eliminar producto', { type: 'error' })
      }
    } catch (error) {
      toast.notify('Error al eliminar producto', { type: 'error' })
    } finally {
      setShowDeleteDialog(false)
      setSelectedProduct(null)
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setSelectedProduct(null)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setAdvancedFilters({
      marca: '',
      modeloCompatible: '',
      ubicacion: '',
      categoria: '',
      stockBajo: false
    })
  }

  const filteredProducts = products.filter(product => {
    // Búsqueda básica (nombre o código)
    const matchesBasicSearch = 
      product.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesBasicSearch) return false

    // Filtros avanzados
    if (advancedFilters.marca && !product.marca?.toLowerCase().includes(advancedFilters.marca.toLowerCase())) {
      return false
    }

    if (advancedFilters.modeloCompatible && !product.modeloCompatible?.toLowerCase().includes(advancedFilters.modeloCompatible.toLowerCase())) {
      return false
    }

    if (advancedFilters.ubicacion && !product.ubicacion?.toLowerCase().includes(advancedFilters.ubicacion.toLowerCase())) {
      return false
    }

    if (
      advancedFilters.categoria &&
      Number(product.idCategoria) !== Number(advancedFilters.categoria)
    ) {
      return false
    }

    if (advancedFilters.stockBajo && product.stockActual > product.stockMinimo) {
      return false
    }

    return true
  })

  const hasActiveFilters = advancedFilters.marca || advancedFilters.modeloCompatible || 
                          advancedFilters.ubicacion || advancedFilters.categoria || 
                          advancedFilters.stockBajo

  return (
    <div className="view-container">
      <div className="view-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LottieIcon name="products" size={28} />
          Gestión de Productos
        </h2>
        {isAdmin && (
          <button className="primary" onClick={() => setShowModal(true)}>
            <LottieIcon name="add" size={18} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
            Nuevo Producto
          </button>
        )}
      </div>

      {/* Barra de búsqueda con filtro integrado */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o código..."
            onFilterClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            showFilterActive={showAdvancedSearch || hasActiveFilters}
          />
          {hasActiveFilters && (
            <button 
              className="secondary"
              onClick={clearFilters}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                padding: '0.75rem 1.5rem',
                whiteSpace: 'nowrap'
              }}
            >
              ✕ Limpiar Filtros
            </button>
          )}
        </div>

        {/* Panel de búsqueda avanzada */}
        <AnimatePresence>
          {showAdvancedSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="advanced-search-panel">
                <h3>
                  <LottieIcon iconName="filter" size={20} /> Filtros Avanzados
                </h3>
                <div className="form-grid" style={{ gap: '1rem' }}>
                  <div className="input-group">
                    <label>Marca</label>
                    <input
                      type="text"
                      value={advancedFilters.marca}
                      onChange={(e) => setAdvancedFilters({...advancedFilters, marca: e.target.value})}
                      placeholder="Ej: Toyota, Bosch..."
                    />
                  </div>
                  <div className="input-group">
                    <label>Modelo Compatible</label>
                    <input
                      type="text"
                      value={advancedFilters.modeloCompatible}
                      onChange={(e) => setAdvancedFilters({...advancedFilters, modeloCompatible: e.target.value})}
                      placeholder="Ej: Corolla 2020..."
                    />
                  </div>
                  <div className="input-group">
                    <label>Ubicación</label>
                    <input
                      type="text"
                      value={advancedFilters.ubicacion}
                      onChange={(e) => setAdvancedFilters({...advancedFilters, ubicacion: e.target.value})}
                      placeholder="Ej: Estante A-3..."
                    />
                  </div>
                  <div className="input-group">
                    <label>Categoría</label>
                    <select
                      value={advancedFilters.categoria}
                      onChange={(e) => setAdvancedFilters({...advancedFilters, categoria: e.target.value})}
                    >
                      <option value="">Todas las categorías</option>
                      {categories.map(cat => (
                        <option key={cat.idCategoria} value={cat.idCategoria}>{cat.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group checkbox-group">
                    <input
                      type="checkbox"
                      id="stockBajo"
                      checked={advancedFilters.stockBajo}
                      onChange={(e) => setAdvancedFilters({...advancedFilters, stockBajo: e.target.checked})}
                    />
                    <label htmlFor="stockBajo">
                      <LottieIcon iconName="alert" size={16} /> Solo productos con stock bajo
                    </label>
                  </div>
                </div>
                <div className="advanced-search-tip">
                  <LottieIcon iconName="info" size={16} /> <strong>Tip:</strong> Puedes combinar múltiples filtros para búsquedas más precisas
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indicador de resultados */}
        {(searchTerm || hasActiveFilters) && (
          <div className="results-indicator" style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LottieIcon iconName="chart" size={16} /> Mostrando <strong>{filteredProducts.length}</strong> de {products.length} productos
            </span>
            {hasActiveFilters && (
              <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                {advancedFilters.marca && `Marca: ${advancedFilters.marca} `}
                {advancedFilters.modeloCompatible && `Modelo: ${advancedFilters.modeloCompatible} `}
                {advancedFilters.ubicacion && `Ubicación: ${advancedFilters.ubicacion} `}
                {advancedFilters.stockBajo && `Stock Bajo `}
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <p>Cargando productos...</p>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
            <LottieIcon name="products" size={24} />
            {searchTerm ? 'No se encontraron productos' : 'No hay productos registrados'}
          </p>
          {!searchTerm && (
            <button className="primary" onClick={() => setShowModal(true)}>
              Agregar primer producto
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Imagen</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Ubicación</th>
                <th>Categoría</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th style={{ textAlign: 'right' }}>Precio</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.idProducto}>
                  <td style={{ padding: '0.5rem' }}>
                    {product.imagen ? (
                      <img 
                        src={product.imagen} 
                        alt={product.nombre}
                        style={{
                          width: '48px',
                          height: '48px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid rgba(99, 102, 241, 0.3)'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '2px dashed rgba(99, 102, 241, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        color: 'rgba(99, 102, 241, 0.5)'
                      }}>
                        📦
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: '600', color: '#6366f1' }}>
                    {product.codigo}
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{product.nombre}</div>
                    {product.descripcion && (
                      <div style={{ fontSize: '0.85rem', color: 'rgba(234, 234, 234, 0.5)', marginTop: '0.25rem' }}>
                        {product.descripcion.length > 50 
                          ? product.descripcion.substring(0, 50) + '...' 
                          : product.descripcion}
                      </div>
                    )}
                  </td>
                  <td>
                    {product.marca ? (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(99, 102, 241, 0.15)',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: '500'
                      }}>
                        {product.marca}
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(234, 234, 234, 0.4)', fontSize: '0.85rem' }}>-</span>
                    )}
                  </td>
                  <td>
                    {product.modeloCompatible ? (
                      <span style={{ fontSize: '0.9rem' }}>{product.modeloCompatible}</span>
                    ) : (
                      <span style={{ color: 'rgba(234, 234, 234, 0.4)', fontSize: '0.85rem' }}>-</span>
                    )}
                  </td>
                  <td>
                    {product.ubicacion ? (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(251, 146, 60, 0.15)',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        color: '#fb923c'
                      }}>
                        📍 {product.ubicacion}
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(234, 234, 234, 0.4)', fontSize: '0.85rem' }}>-</span>
                    )}
                  </td>
                  <td>
                    {(() => {
                      // Resolución robusta del nombre de categoría
                      const idCatProd = Number(product.idCategoria)
                      let nombreCat = product.nombreCategoria || categoriaMap[idCatProd] || (categories.find?.(cat => Number(cat.idCategoria) === idCatProd)?.nombre)
                      // Fallback adicional por prefijo de código (p. ej., MOT-*, FRE-*)
                      if (!nombreCat && product.codigo) {
                        const pref = String(product.codigo).split('-')[0]?.toUpperCase()
                        const guess = categoriaPorCodigo[pref]
                        if (guess) nombreCat = guess
                      }
                      if (nombreCat) {
                        return (
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            background: 'rgba(59,130,246,0.12)',
                            border: '1px solid rgba(59,130,246,0.25)',
                            color: '#1d4ed8',
                            fontWeight: 600,
                            fontSize: '0.95rem'
                          }}>{nombreCat}</span>
                        );
                      }
                      return (
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          background: 'rgba(156,163,175,0.12)',
                          border: '1px solid rgba(156,163,175,0.25)',
                          color: '#6b7280',
                          fontWeight: 500,
                          fontSize: '0.95rem'
                        }}>Sin categoría</span>
                      );
                    })()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        fontWeight: '700',
                        color: product.stockActual <= product.stockMinimo ? '#ef4444' : 
                               product.stockActual <= product.stockMinimo * 1.5 ? '#fb923c' : '#10b981'
                      }}>
                        {product.stockActual}
                      </span>
                      {product.stockActual <= product.stockMinimo && (
                        <span title="Stock bajo" style={{ color: '#ef4444', fontSize: '1.2rem' }}>⚠</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(234, 234, 234, 0.5)' }}>
                      Mín: {product.stockMinimo || 0}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: '#10b981' }}>
                    S/ {parseFloat(product.precioVenta || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isAdmin ? (
                      <>
                        <button 
                          className="btn-icon" 
                          onClick={() => handleEdit(product)}
                          title="Editar"
                        >
                          <Icons.Edit />
                        </button>
                        <button 
                          className="btn-icon" 
                          onClick={() => {
                            setSelectedProduct(product)
                            setShowDeleteDialog(true)
                          }}
                          title="Eliminar"
                        >
                          <Icons.Delete />
                        </button>
                      </>
                    ) : (
                      <span style={{ color: 'rgba(234, 234, 234, 0.5)', fontSize: '0.875rem' }}>
                        👁️ Solo lectura
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductModal
        isOpen={showModal}
        onClose={handleModalClose}
        product={selectedProduct}
        onSuccess={fetchProducts}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setSelectedProduct(null)
        }}
        onConfirm={handleDelete}
        title="Eliminar Producto"
        message={`¿Estás seguro de eliminar el producto "${selectedProduct?.nombre}"?`}
        confirmText="Eliminar"
      />
    </div>
  )
}

// Vista Categorías
function CategoriesView({ isAdmin, products = [], categories = [], setCategories, isDarkMode = true }) {
  const [showModal, setShowModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState(null)
  const toast = useToast()

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await apiFetch('/api/categorias')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categorias || [])
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error)
      toast.notify('Error al cargar categorías', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories()
    }
  }, [])

  const handleEdit = (category) => {
    setSelectedCategory(category)
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!selectedCategory) return
    
    try {
      const response = await apiFetch(`/api/categorias/${selectedCategory.idCategoria}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.notify('Categoría eliminada correctamente', { type: 'success' })
        setCategories(prev => prev.filter(cat => cat.idCategoria !== selectedCategory.idCategoria))
      } else {
        const error = await response.json()
        toast.notify(error.message || 'Error al eliminar categoría', { type: 'error' })
      }
    } catch (error) {
      toast.notify('Error al eliminar categoría', { type: 'error' })
    } finally {
      setShowDeleteDialog(false)
      setSelectedCategory(null)
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setSelectedCategory(null)
  }

  // Obtener productos por categoría
  const getProductsByCategory = (categoryId) => {
    return products.filter(p => Number(p.idCategoria) === Number(categoryId))
  }

  // Contar productos activos por categoría
  const countProductsByCategory = (categoryId) => {
    return getProductsByCategory(categoryId).length
  }

  // Calcular valor total del inventario por categoría
  const calculateCategoryValue = (categoryId) => {
    const categoryProducts = getProductsByCategory(categoryId)
    return categoryProducts.reduce((sum, p) => {
      return sum + (Number(p.stockActual || 0) * Number(p.precioVenta || 0))
    }, 0)
  }

  const toggleExpand = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LottieIcon name="categories" size={28} />
          Gestión de Categorías
        </h2>
        {isAdmin && (
          <button className="primary" onClick={() => setShowModal(true)}>
            <LottieIcon name="add" size={18} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
            Nueva Categoría
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner">Cargando categorías...</div>
        </div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <div style={{ marginBottom: '1rem' }}>
            <LottieIcon name="categories" size={64} />
          </div>
          <p>📂 No hay categorías registradas</p>
          {isAdmin && (
            <button className="primary" onClick={() => setShowModal(true)}>
              Agregar primera categoría
            </button>
          )}
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '1.5rem',
          marginTop: '1.5rem'
        }}>
          {categories.map((category, index) => {
            const categoryProducts = getProductsByCategory(category.idCategoria)
            const productCount = categoryProducts.length
            const categoryValue = calculateCategoryValue(category.idCategoria)
            const isExpanded = expandedCategory === category.idCategoria
            
            return (
              <motion.div
                key={category.idCategoria}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  background: isDarkMode 
                    ? 'rgba(30, 30, 30, 0.6)' 
                    : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: isDarkMode
                    ? '1px solid rgba(249, 115, 22, 0.2)'
                    : '1px solid rgba(249, 115, 22, 0.3)',
                  boxShadow: isDarkMode
                    ? '0 4px 16px rgba(0, 0, 0, 0.3)'
                    : '0 4px 16px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                whileHover={{ 
                  y: -4, 
                  boxShadow: isDarkMode
                    ? '0 8px 24px rgba(249, 115, 22, 0.4)'
                    : '0 8px 24px rgba(249, 115, 22, 0.3)',
                  borderColor: 'rgba(249, 115, 22, 0.4)'
                }}
              >
                {/* Badge con el nombre de la categoría */}
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                  zIndex: 10
                }}>
                  <div style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '25px',
                    fontSize: '0.9rem',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                    border: '2px solid rgba(251, 146, 60, 0.6)',
                    color: '#fff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    boxShadow: '0 4px 16px rgba(249, 115, 22, 0.5)',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale'
                  }}>
                    {category.nombre || 'CATEGORÍA'}
                  </div>
                </div>

                {/* Indicador de estado */}
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center'
                }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: category.estado === 1 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    border: `1px solid ${category.estado === 1 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                    color: category.estado === 1 ? '#10b981' : '#ef4444'
                  }}>
                    {category.estado === 1 ? '✓ Activo' : '✕ Inactivo'}
                  </span>
                </div>

                {/* Contenido principal de la tarjeta */}
                <div onClick={() => toggleExpand(category.idCategoria)}>
                  <div style={{ marginBottom: '1rem', marginTop: '4rem' }}>
                    <p style={{ 
                      fontSize: '0.95rem', 
                      fontWeight: '400',
                      color: isDarkMode 
                        ? 'rgba(234, 234, 234, 0.7)'
                        : 'rgba(30, 30, 30, 0.8)',
                      marginBottom: '0.5rem',
                      lineHeight: '1.5'
                    }}>
                      {category.descripcion || 'Sin descripción'}
                    </p>
                  </div>

                  {/* Estadísticas de la categoría */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '1rem',
                    marginTop: '1.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(249, 115, 22, 0.2)'
                  }}>
                    <div style={{
                      textAlign: 'center',
                      padding: '0.75rem',
                      background: 'rgba(99, 102, 241, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                      <div style={{ 
                        fontSize: '1.75rem', 
                        fontWeight: '700', 
                        color: '#6366f1',
                        marginBottom: '0.25rem'
                      }}>
                        {productCount}
                      </div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: isDarkMode 
                          ? 'rgba(234, 234, 234, 0.6)'
                          : 'rgba(30, 30, 30, 0.6)'
                      }}>
                        Productos
                      </div>
                    </div>
                    
                    <div style={{
                      textAlign: 'center',
                      padding: '0.75rem',
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <div style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '700', 
                        color: '#10b981',
                        marginBottom: '0.25rem'
                      }}>
                        S/ {categoryValue.toFixed(2)}
                      </div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: isDarkMode 
                          ? 'rgba(234, 234, 234, 0.6)'
                          : 'rgba(30, 30, 30, 0.6)'
                      }}>
                        Valor Total
                      </div>
                    </div>
                  </div>

                  {/* Botón de expandir/contraer */}
                  <div style={{ 
                    marginTop: '1rem',
                    display: 'flex',
                    justifyContent: 'center',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(249, 115, 22, 0.2)'
                  }}>
                    <button
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f97316',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      {isExpanded ? '▲ Ocultar' : '▼ Ver'} Productos
                    </button>
                  </div>
                </div>

                {/* Lista de productos expandible */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        borderTop: '2px solid rgba(249, 115, 22, 0.3)'
                      }}>
                        <h4 style={{ 
                          fontSize: '1rem', 
                          fontWeight: '600',
                          color: '#f97316',
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <LottieIcon name="products" size={18} />
                          Productos en esta categoría:
                        </h4>
                        
                        {categoryProducts.length === 0 ? (
                          <div style={{
                            textAlign: 'center',
                            padding: '1.5rem',
                            background: isDarkMode
                              ? 'rgba(156, 163, 175, 0.1)'
                              : 'rgba(200, 200, 200, 0.2)',
                            borderRadius: '8px',
                            border: isDarkMode
                              ? '1px dashed rgba(156, 163, 175, 0.3)'
                              : '1px dashed rgba(156, 163, 175, 0.5)'
                          }}>
                            <p style={{ 
                              color: isDarkMode 
                                ? 'rgba(234, 234, 234, 0.5)'
                                : 'rgba(30, 30, 30, 0.5)', 
                              fontSize: '0.9rem' 
                            }}>
                              📦 No hay productos en esta categoría
                            </p>
                          </div>
                        ) : (
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '0.75rem',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            paddingRight: '0.5rem'
                          }}>
                            {categoryProducts.map((product, idx) => (
                              <motion.div
                                key={product.idProducto}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                style={{
                                  padding: '1rem',
                                  background: isDarkMode
                                    ? 'rgba(20, 20, 20, 0.5)'
                                    : 'rgba(240, 240, 240, 0.8)',
                                  borderRadius: '8px',
                                  border: isDarkMode
                                    ? '1px solid rgba(249, 115, 22, 0.15)'
                                    : '1px solid rgba(249, 115, 22, 0.25)',
                                  transition: 'all 0.2s'
                                }}
                                whileHover={{
                                  background: 'rgba(249, 115, 22, 0.1)',
                                  borderColor: 'rgba(249, 115, 22, 0.3)',
                                  x: 4
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ 
                                      fontWeight: '600', 
                                      color: isDarkMode ? '#eaeaea' : '#1a1a1a',
                                      marginBottom: '0.25rem',
                                      fontSize: '0.95rem'
                                    }}>
                                      {product.nombre}
                                    </div>
                                    <div style={{ 
                                      fontSize: '0.8rem', 
                                      color: '#6366f1',
                                      fontWeight: '500',
                                      marginBottom: '0.5rem'
                                    }}>
                                      {product.codigo}
                                    </div>
                                    {product.descripcion && (
                                      <div style={{ 
                                        fontSize: '0.8rem', 
                                        color: isDarkMode
                                          ? 'rgba(234, 234, 234, 0.5)'
                                          : 'rgba(30, 30, 30, 0.6)',
                                        marginTop: '0.25rem'
                                      }}>
                                        {product.descripcion.length > 60 
                                          ? product.descripcion.substring(0, 60) + '...' 
                                          : product.descripcion}
                                      </div>
                                    )}
                                    <div style={{ 
                                      display: 'flex', 
                                      gap: '1rem', 
                                      marginTop: '0.75rem',
                                      flexWrap: 'wrap'
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'rgba(234, 234, 234, 0.5)' }}>
                                          Stock:
                                        </span>
                                        <span style={{ 
                                          fontWeight: '700',
                                          color: product.stockActual <= product.stockMinimo ? '#ef4444' : '#10b981',
                                          fontSize: '0.85rem'
                                        }}>
                                          {product.stockActual}
                                          {product.stockActual <= product.stockMinimo && ' ⚠'}
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'rgba(234, 234, 234, 0.5)' }}>
                                          Precio:
                                        </span>
                                        <span style={{ 
                                          fontWeight: '700',
                                          color: '#10b981',
                                          fontSize: '0.85rem'
                                        }}>
                                          S/ {parseFloat(product.precioVenta || 0).toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botones de acción */}
                {isAdmin && (
                  <div style={{ 
                    marginTop: '1rem',
                    display: 'flex',
                    gap: '0.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(249, 115, 22, 0.2)',
                    justifyContent: 'flex-end'
                  }}
                  onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      className="btn-icon" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(category)
                      }}
                      title="Editar categoría"
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(99, 102, 241, 0.2)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        borderRadius: '6px',
                        color: '#6366f1',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Icons.Edit /> Editar
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCategory(category)
                        setShowDeleteDialog(true)
                      }}
                      title="Eliminar categoría"
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '6px',
                        color: '#ef4444',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Icons.Delete /> Eliminar
                    </button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      <CategoryModal
        isOpen={showModal}
        onClose={handleModalClose}
        category={selectedCategory}
        onSuccess={fetchCategories}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setSelectedCategory(null)
        }}
        onConfirm={handleDelete}
        title="Eliminar Categoría"
        message={`¿Estás seguro de eliminar la categoría "${selectedCategory?.nombre}"? ${
          selectedCategory && getProductsByCategory(selectedCategory.idCategoria).length > 0 
            ? `Esta categoría tiene ${getProductsByCategory(selectedCategory.idCategoria).length} producto(s) asociado(s).` 
            : ''
        }`}
        confirmText="Eliminar"
      />
    </div>
  )
}

// Vista Proveedores
function SuppliersView({ isAdmin }) {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const toast = useToast()

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const response = await apiFetch('/api/proveedores')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.proveedores || [])
      }
    } catch (error) {
      console.error('Error al cargar proveedores:', error)
      toast.notify('Error al cargar proveedores', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier)
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!selectedSupplier) return
    
    try {
      const response = await apiFetch(`/api/proveedores/${selectedSupplier.idProveedor}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.notify('Proveedor eliminado correctamente', { type: 'success' })
        fetchSuppliers()
      } else {
        const error = await response.json()
        toast.notify(error.message || 'Error al eliminar proveedor', { type: 'error' })
      }
    } catch (error) {
      toast.notify('Error al eliminar proveedor', { type: 'error' })
    } finally {
      setShowDeleteDialog(false)
      setSelectedSupplier(null)
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setSelectedSupplier(null)
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="view-container">
      <div className="view-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LottieIcon name="suppliers" size={28} />
          Gestión de Proveedores
        </h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar proveedor..."
          />
          {isAdmin && (
            <button className="primary" onClick={() => setShowModal(true)}>
              <LottieIcon name="add" size={18} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
              Nuevo Proveedor
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p>Cargando proveedores...</p>
      ) : filteredSuppliers.length === 0 ? (
        <div className="empty-state">
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
            <LottieIcon name="suppliers" size={24} />
            {searchTerm ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
          </p>
          {!searchTerm && isAdmin && (
            <button className="primary" onClick={() => setShowModal(true)}>
              Agregar primer proveedor
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.idProveedor}>
                  <td>{supplier.nombre}</td>
                  <td>{supplier.email}</td>
                  <td>{supplier.telefono || '-'}</td>
                  <td>{supplier.direccion || '-'}</td>
                  <td>
                    {isAdmin ? (
                      <>
                        <button 
                          className="btn-icon" 
                          onClick={() => handleEdit(supplier)}
                          title="Editar"
                        >
                          <Icons.Edit />
                        </button>
                        <button 
                          className="btn-icon" 
                          onClick={() => {
                            setSelectedSupplier(supplier)
                            setShowDeleteDialog(true)
                          }}
                          title="Eliminar"
                        >
                          <Icons.Delete />
                        </button>
                      </>
                    ) : (
                      <span style={{ color: 'rgba(234, 234, 234, 0.5)', fontSize: '0.875rem' }}>
                        👁️ Solo lectura
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SupplierModal
        isOpen={showModal}
        onClose={handleModalClose}
        supplier={selectedSupplier}
        onSuccess={fetchSuppliers}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setSelectedSupplier(null)
        }}
        onConfirm={handleDelete}
        title="Eliminar Proveedor"
        message={`¿Estás seguro de eliminar el proveedor "${selectedSupplier?.nombre}"?`}
        confirmText="Eliminar"
      />
    </div>
  )
}

// Vista Ventas
function SalesView() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const toast = useToast()

  useEffect(() => {
    console.log('🟢 SalesView MONTADO')
    fetchSales()
    return () => console.log('🔴 SalesView DESMONTADO')
  }, [])

  const fetchSales = async () => {
    try {
      const response = await apiFetch('/api/ventas')
      if (response.ok) {
        const data = await response.json()
        setSales(data.ventas || [])
      }
    } catch (error) {
      console.error('Error al cargar ventas:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewDetail = (sale) => {
    setSelectedSale(sale)
    setShowDetailModal(true)
  }

  // Calcular estadísticas en tiempo real
  const stats = useMemo(() => {
    if (!sales || sales.length === 0) {
      return { ventasHoy: 0, montoHoy: 0, ventasMes: 0, montoMes: 0, ticketPromedio: 0 }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Inicio del mes actual
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    
    // Filtrar ventas de hoy
    const ventasHoyArr = sales.filter(s => {
      if (!s.fechaHora) return false
      const saleDate = new Date(s.fechaHora)
      if (isNaN(saleDate.getTime())) return false
      // Normalizar fecha de venta a medianoche para comparar solo día
      const saleDay = new Date(saleDate)
      saleDay.setHours(0, 0, 0, 0)
      return saleDay.getTime() === today.getTime()
    })
    
    // Filtrar ventas del mes
    const ventasMesArr = sales.filter(s => {
      if (!s.fechaHora) return false
      const saleDate = new Date(s.fechaHora)
      if (isNaN(saleDate.getTime())) return false
      return saleDate >= startOfMonth
    })
    
    const totalHoy = ventasHoyArr.reduce((sum, s) => sum + (parseFloat(s.montoTotal) || 0), 0)
    const totalMes = ventasMesArr.reduce((sum, s) => sum + (parseFloat(s.montoTotal) || 0), 0)
    const ticketPromedio = sales.length > 0 
      ? sales.reduce((sum, s) => sum + (parseFloat(s.montoTotal) || 0), 0) / sales.length 
      : 0
    
    return {
      ventasHoy: ventasHoyArr.length,
      montoHoy: totalHoy,
      ventasMes: ventasMesArr.length,
      montoMes: totalMes,
      ticketPromedio
    }
  }, [sales])

  return (
    <div className="view-container">
      <div className="view-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LottieIcon name="sales" size={28} />
          Registro de Ventas
        </h2>
        <button className="primary" onClick={() => setShowModal(true)}>
          <LottieIcon name="add" size={18} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
          Nueva Venta
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '10px',
        minHeight: '100px'
      }}>
        {/* Ventas del Día */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.02 }}
          style={{
            flex: '1 1 200px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '1.25rem',
            cursor: 'default'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>💰</span>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Ventas Hoy</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#10b981' }}>
            S/ {stats.montoHoy.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
            {stats.ventasHoy} venta{stats.ventasHoy !== 1 ? 's' : ''} hoy
          </div>
        </motion.div>

        {/* Ventas del Mes */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          style={{
            flex: '1 1 200px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.1))',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '12px',
            padding: '1.25rem',
            cursor: 'default'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📊</span>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Ventas del Mes</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#6366f1' }}>
            S/ {stats.montoMes.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
            {stats.ventasMes} ventas este mes
          </div>
        </motion.div>

        {/* Ticket Promedio */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          style={{
            flex: '1 1 200px',
            background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(234, 88, 12, 0.1))',
            border: '1px solid rgba(251, 146, 60, 0.3)',
            borderRadius: '12px',
            padding: '1.25rem',
            cursor: 'default'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🧾</span>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Ticket Promedio</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fb923c' }}>
            S/ {stats.ticketPromedio.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
            Promedio por venta
          </div>
        </motion.div>

        {/* Total Ventas */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          style={{
            flex: '1 1 200px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(109, 40, 217, 0.1))',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            padding: '1.25rem',
            cursor: 'default'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📈</span>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Total Registros</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#8b5cf6' }}>
            {sales.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
            Ventas en sistema
          </div>
        </motion.div>
      </div>

      {loading ? (
        <p>Cargando ventas...</p>
      ) : sales.length === 0 ? (
        <div className="empty-state">
          <p>🛒 No hay ventas registradas</p>
          <button className="primary" onClick={() => setShowModal(true)}>
            Registrar primera venta
          </button>
        </div>
      ) : (
        <>
          {/* Tabla de ventas */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Venta</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Método de Pago</th>
                  <th>Total</th>
                  <th>Vendedor</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.idVenta}>
                    <td style={{ fontWeight: '600', color: '#6366f1' }}>
                      {sale.numeroVenta || `#${sale.idVenta}`}
                    </td>
                    <td>{formatDate(sale.fechaHora)}</td>
                    <td>{sale.clienteNombre}</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '6px',
                        background: sale.metodoPago === 'efectivo' ? 'rgba(34, 197, 94, 0.15)' : 
                                   sale.metodoPago === 'tarjeta' ? 'rgba(99, 102, 241, 0.15)' :
                                   sale.metodoPago === 'yape' ? 'rgba(147, 51, 234, 0.15)' :
                                   sale.metodoPago === 'plin' ? 'rgba(236, 72, 153, 0.15)' :
                                   'rgba(249, 115, 22, 0.15)',
                        border: `1px solid ${
                          sale.metodoPago === 'efectivo' ? 'rgba(34, 197, 94, 0.3)' : 
                          sale.metodoPago === 'tarjeta' ? 'rgba(99, 102, 241, 0.3)' :
                          sale.metodoPago === 'yape' ? 'rgba(147, 51, 234, 0.3)' :
                          sale.metodoPago === 'plin' ? 'rgba(236, 72, 153, 0.3)' :
                          'rgba(249, 115, 22, 0.3)'
                        }`,
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        {sale.metodoPago === 'efectivo' ? '💵 Efectivo' :
                         sale.metodoPago === 'tarjeta' ? '💳 Tarjeta' :
                         sale.metodoPago === 'yape' ? '📱 Yape' :
                         sale.metodoPago === 'plin' ? '💸 Plin' :
                         sale.metodoPago === 'transferencia' ? '🏦 Transferencia' :
                         sale.metodoPago || 'N/A'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700', color: '#10b981', fontSize: '1.05rem' }}>
                      S/ {parseFloat(sale.montoTotal).toFixed(2)}
                    </td>
                    <td>{sale.nombreVendedor || 'N/A'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn-icon"
                        onClick={() => handleViewDetail(sale)}
                        title="Ver detalle"
                        style={{
                          background: 'rgba(99, 102, 241, 0.1)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          borderRadius: '6px',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          color: '#6366f1'
                        }}
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <SaleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchSales}
      />

      <SaleDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedSale(null)
        }}
        sale={selectedSale}
      />
    </div>
  )
}

// Vista Inventario (Historial de Movimientos Mejorado)
function InventoryView({ isAdmin }) {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const toast = useToast()
  
  // Estados para filtros
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')
  const [filtroProducto, setFiltroProducto] = useState('')
  const [productos, setProductos] = useState([])
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [limit] = useState(20)

  useEffect(() => {
    fetchProductos()
    fetchMovements()

    // Auto-refresh cada 10 segundos para "Tiempo Real"
    const intervalId = setInterval(() => {
      // Solo recargar si no hay modal abierto para evitar saltos
      if (!showModal) {
        fetchMovements(true) // true = silencioso (sin loading spinner global si se desea)
      }
    }, 10000)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    fetchMovements()
  }, [currentPage])

  const fetchProductos = async () => {
    try {
      const response = await apiFetch('/api/productos')
      if (response.ok) {
        const data = await response.json()
        setProductos(data.productos || [])
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
    }
  }

  const fetchMovements = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      
      // Construir query params
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit
      })
      
      if (filtroTipo) params.append('tipoMovimiento', filtroTipo)
      if (filtroFechaInicio) params.append('fechaInicio', filtroFechaInicio)
      if (filtroFechaFin) params.append('fechaFin', filtroFechaFin)
      if (filtroProducto) params.append('idProducto', filtroProducto)
      
      const response = await apiFetch(`/api/movimientos?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setMovements(data.movimientos || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalRegistros(data.pagination?.total || 0)
      } else {
        toast.error('Error al cargar movimientos')
      }
    } catch (error) {
      console.error('Error al cargar movimientos:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = () => {
    setCurrentPage(1) // Resetear a la primera página
    fetchMovements()
  }

  const limpiarFiltros = () => {
    setFiltroTipo('')
    setFiltroFechaInicio('')
    setFiltroFechaFin('')
    setFiltroProducto('')
    setCurrentPage(1)
    setTimeout(() => fetchMovements(), 100)
  }

  const exportarCSV = () => {
    if (movements.length === 0) {
      toast.warning('No hay datos para exportar')
      return
    }

    const headers = ['Fecha', 'Tipo', 'Producto', 'Código', 'Cantidad', 'Observaciones', 'Usuario']
    const rows = movements.map(m => [
      new Date(m.fechaHora).toLocaleString('es-PE'),
      m.tipoMovimiento,
      m.productoNombre || 'N/A',
      m.productoCodigo || 'N/A',
      m.cantidad,
      m.observaciones || '-',
      m.usuarioNombre || 'N/A'
    ])
    
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `movimientos_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Reporte exportado exitosamente')
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPages) {
      setCurrentPage(nuevaPagina)
    }
  }

  const exportMovementsPDF = async () => {
    if (!movements || movements.length === 0) {
      toast.warning('No hay datos para exportar')
      return
    }
    try {
      const columns = ['ID','Fecha y Hora','Tipo','Producto','Categoría','Código','Cantidad','Observaciones','Usuario']
      const rows = movements.map(m => [
        `#${m.idMovimientoInventario}`,
        new Date(m.fechaHora).toLocaleString('es-PE'),
        m.tipoMovimiento,
        m.productoNombre || '-',
        m.nombreCategoria || '-',
        m.productoCodigo || '-',
        m.cantidad,
        m.observaciones || '-',
        m.usuarioNombre || '-'
      ])
      await exportToPDF({ title: 'Historial de Movimientos de Inventario', columns, rows, filename: 'movimientos_inventario' })
      toast.success('PDF exportado exitosamente')
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      toast.error('Error al exportar PDF: ' + error.message)
    }
  }

  const exportMovementsExcel = async () => {
    if (!movements || movements.length === 0) {
      toast.warning('No hay datos para exportar')
      return
    }
    try {
      const columns = ['ID','Fecha y Hora','Tipo','Producto','Categoría','Código','Cantidad','Observaciones','Usuario']
      const rows = movements.map(m => [
        `#${m.idMovimientoInventario}`,
        new Date(m.fechaHora).toLocaleString('es-PE'),
        m.tipoMovimiento,
        m.productoNombre || '-',
        m.nombreCategoria || '-',
        m.productoCodigo || '-',
        m.cantidad,
        m.observaciones || '-',
        m.usuarioNombre || '-'
      ])
      await exportToExcel({ title: 'Movimientos', columns, rows, filename: 'movimientos_inventario' })
      toast.success('Excel exportado exitosamente')
    } catch (error) {
      console.error('Error al exportar Excel:', error)
      toast.error('Error al exportar Excel: ' + error.message)
    }
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LottieIcon name="inventory" size={28} />
          Historial de Movimientos de Inventario
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="secondary" onClick={exportMovementsExcel}>
            <LottieIcon name="excel" size={18} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
            Exportar Excel
          </button>
          <button className="secondary" onClick={exportMovementsPDF}>
            <LottieIcon name="pdf" size={18} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
            Exportar PDF
          </button>
          {isAdmin && (
            <button className="primary" onClick={() => setShowModal(true)}>
              <LottieIcon name="add" size={18} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
              Nuevo Movimiento
            </button>
          )}
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="table-container" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LottieIcon name="filter" size={22} />
          Filtros de Búsqueda
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div className="input-group">
            <label>Tipo de Movimiento</label>
            <select 
              value={filtroTipo} 
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Entrada">Entrada</option>
              <option value="Salida">Salida</option>
            </select>
          </div>

          <div className="input-group">
            <label>Producto</label>
            <select 
              value={filtroProducto} 
              onChange={(e) => setFiltroProducto(e.target.value)}
            >
              <option value="">Todos</option>
              {productos.map((prod) => (
                <option key={prod.idProducto} value={prod.idProducto}>
                  {prod.codigo} - {prod.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Fecha Inicio</label>
            <input
              type="date"
              value={filtroFechaInicio}
              onChange={(e) => setFiltroFechaInicio(e.target.value)}
            />
          </div>

                   <div className="input-group">
            <label>Fecha Fin</label>
            <input
              type="date"
              value={filtroFechaFin}
              onChange={(e) => setFiltroFechaFin(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="secondary" onClick={limpiarFiltros}>
            <LottieIcon name="delete" size={18} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
            Limpiar
          </button>
          <button className="primary" onClick={aplicarFiltros}>
            <LottieIcon name="search" size={18} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
            Buscar
          </button>
        </div>
      </div>

      {/* Información de resultados */}
      <div style={{ 
        marginBottom: '1rem', 
        color: 'rgba(234, 234, 234, 0.7)',
        fontSize: '0.9rem'
      }}>
        Mostrando {movements.length} de {totalRegistros} movimientos
      </div>

      {/* Tabla de Movimientos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
            <LottieIcon name="inventory" size={32} />
            Cargando movimientos...
          </div>
        </div>
      ) : movements.length === 0 ? (
        <div className="empty-state">
          <div style={{ marginBottom: '1rem' }}>
            <LottieIcon name="inventory" size={64} />
          </div>
          <p>No hay movimientos registrados con los filtros aplicados</p>
          <button className="primary" onClick={() => setShowModal(true)}>
            Registrar primer movimiento
          </button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha y Hora</th>
                    <th>Tipo</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Código</th>
                    <th>Cantidad</th>
                    <th>Observaciones</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr key={movement.idMovimientoInventario}>
                      <td style={{ fontWeight: '600' }}>#{movement.idMovimientoInventario}</td>
                      <td>{formatDate(movement.fechaHora)}</td>
                      <td>
                        <span className={`badge ${
                          movement.tipoMovimiento && movement.tipoMovimiento.toLowerCase() === 'entrada' ? 'badge-success' : 'badge-warning'
                        }`}>
                          {movement.tipoMovimiento ? (movement.tipoMovimiento.charAt(0).toUpperCase() + movement.tipoMovimiento.slice(1)) : ''}
                        </span>
                      </td>
                      <td>{movement.productoNombre || 'N/A'}</td>
                      <td>{movement.nombreCategoria || '-'}</td>
                      <td style={{ fontFamily: 'monospace' }}>{movement.productoCodigo || '-'}</td>
                      <td style={{ fontWeight: '600', fontSize: '1rem' }}>
                        {movement.tipoMovimiento && movement.tipoMovimiento.toLowerCase() === 'entrada' ? '+' : '-'}{movement.cantidad}
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {movement.observaciones || '-'}
                      </td>
                      <td>{movement.usuarioNombre || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '1rem',
              marginTop: '1.5rem',
              padding: '1rem'
            }}>
              <button 
                className="secondary" 
                onClick={() => cambiarPagina(currentPage - 1)}
                disabled={currentPage === 1}
                style={{ minWidth: '100px' }}
              >
                ← Anterior
              </button>
              
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem',
                alignItems: 'center'
              }}>
                {[...Array(Math.min(5, totalPages))].map((_, index) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = index + 1;
                  } else if (currentPage <= 3) {
                    pageNum = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + index;
                  } else {
                    pageNum = currentPage - 2 + index;
                  }

                  return (
                    <button
                      key={pageNum}
                      className={currentPage === pageNum ? 'primary' : 'secondary'}
                      onClick={() => cambiarPagina(pageNum)}
                      style={{ 
                        minWidth: '40px',
                        padding: '0.5rem'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button 
                className="secondary" 
                onClick={() => cambiarPagina(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{ minWidth: '100px' }}
              >
                Siguiente →
              </button>
            </div>
          )}

          <div style={{ 
            textAlign: 'center',
            color: 'rgba(234, 234, 234, 0.6)',
            fontSize: '0.875rem',
            marginTop: '0.5rem'
          }}>
            Página {currentPage} de {totalPages}
          </div>
        </>
      )}

      <MovementModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setCurrentPage(1)
          fetchMovements()
        }}
      />
    </div>
  )
}

// Vista Reportes
function ReportsView({ isAdmin }) {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard') // dashboard, sales, inventory
  const [dashboardStats, setDashboardStats] = useState(null)
  
  // Filtros para reporte de ventas
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')
  const [ventasReporte, setVentasReporte] = useState([])
  const [loadingReporte, setLoadingReporte] = useState(false)

  // Datos para gráficos
  const [ventasPorDia, setVentasPorDia] = useState([])
  const [topProductos, setTopProductos] = useState([])
  const [ventasPorCategoria, setVentasPorCategoria] = useState([])

  useEffect(() => {
    cargarEstadisticasGeneral()
  }, [])

  const cargarEstadisticasGeneral = async () => {
    try {
      setLoading(true)
      const response = await apiFetch('/api/estadisticas/dashboard')
      if (response.ok) {
        const data = await response.json()
        setDashboardStats(data)
        setVentasPorDia(data.ventasPorDia || [])
        setTopProductos(data.topProductos || [])
        
        // Simulación de datos para categorías (si el backend no lo envía aún)
        // Idealmente el backend debería enviar esto. Si no, usamos datos mock o calculados.
        // Para este entregable, si no viene del backend, generamos mock basado en ventas.
        if (data.ventasPorCategoria) {
            setVentasPorCategoria(data.ventasPorCategoria)
        } else {
            // Fallback mock para demostración de gráfico
            setVentasPorCategoria([
                { categoria: 'Motor', valor: 3500, porcentaje: 35 },
                { categoria: 'Frenos', valor: 2500, porcentaje: 25 },
                { categoria: 'Eléctrico', valor: 2000, porcentaje: 20 },
                { categoria: 'Transmisión', valor: 1500, porcentaje: 15 },
                { categoria: 'Suspensión', valor: 500, porcentaje: 5 },
            ])
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  const cargarVentasPorFechas = async () => {
    if (!filtroFechaInicio || !filtroFechaFin) {
      toast.notify('Selecciona rango de fechas completo', { type: 'warning' })
      return
    }
    
    // Validar que fechaInicio <= fechaFin
    if (new Date(filtroFechaInicio) > new Date(filtroFechaFin)) {
        toast.notify('Fecha inicio debe ser anterior o igual a fecha fin', { type: 'warning' })
        return
    }

    setLoadingReporte(true)
    try {
        const url = `/api/reportes/ventas-fechas?fechaInicio=${filtroFechaInicio}&fechaFin=${filtroFechaFin}`
        const response = await apiFetch(url)
        
        if (response.ok) {
            const data = await response.json()
            setVentasReporte(data.ventas || [])
            
            if (data.ventas?.length > 0) {
                toast.success(`Se encontraron ${data.ventas.length} ventas`)
            } else {
                toast.notify('No se encontraron ventas en este rango', { type: 'info' })
            }
        } else {
            const err = await response.json()
            toast.error(err.message || 'Error al cargar reporte')
        }
    } catch (error) {
        console.error(error)
        toast.error('Error de conexión al cargar reporte')
    } finally {
        setLoadingReporte(false)
    }
  }

  // Alias para mantener compatibilidad si se usa en otro lugar
  const generarReporteVentas = cargarVentasPorFechas

  const handleExportPDF = async (type) => {
    try {
        if (type === 'ventas') {
            if (ventasReporte.length === 0) {
                toast.notify('Genera el reporte primero', { type: 'warning' })
                return
            }
            const columns = ['N° Venta', 'Fecha', 'Cliente', 'Método', 'Total']
            const rows = ventasReporte.map(v => [
                v.numeroVenta,
                new Date(v.fechaHora).toLocaleDateString(),
                v.clienteNombre || 'Cliente General',
                v.metodoPago,
                `S/ ${parseFloat(v.montoTotal).toFixed(2)}`
            ])
            await exportToPDF({
                title: `Reporte de Ventas (${filtroFechaInicio} al ${filtroFechaFin})`,
                columns,
                rows,
                filename: `ventas_${filtroFechaInicio}_${filtroFechaFin}`
            })
        }
        toast.success('PDF exportado correctamente')
    } catch (e) {
        console.error(e)
        toast.error('Error al exportar PDF')
    }
  }

  const handleExportExcel = async (type) => {
    try {
        if (type === 'ventas') {
            if (ventasReporte.length === 0) {
                toast.notify('Genera el reporte primero', { type: 'warning' })
                return
            }
            const columns = ['ID', 'Numero Venta', 'Fecha', 'Cliente', 'Documento', 'Metodo Pago', 'Total']
            const rows = ventasReporte.map(v => [
                v.idVenta,
                v.numeroVenta,
                new Date(v.fechaHora).toLocaleDateString(),
                v.clienteNombre,
                v.clienteDocumento || '-',
                v.metodoPago,
                v.montoTotal
            ])
            await exportToExcel({
                title: 'Reporte de Ventas',
                columns,
                rows,
                filename: `ventas_${filtroFechaInicio}_${filtroFechaFin}`
            })
        }
        toast.success('Excel exportado correctamente')
    } catch (e) {
        console.error(e)
        toast.error('Error al exportar Excel')
    }
  }

  // Colores para gráficos
  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6']

  if (loading) return <div className="loading-spinner">Cargando reportes...</div>

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Reportes y Análisis</h2>
          <p>Visualiza métricas clave y exporta datos</p>
        </div>
        <div className="header-actions">
           {/* Tabs de navegación interna */}
           <div className="tabs-pills">
               <button 
                className={activeTab === 'dashboard' ? 'active' : ''} 
                onClick={() => setActiveTab('dashboard')}
               >
                 <LottieIcon name="dashboard" size={18} /> Gráficos
               </button>
               <button 
                className={activeTab === 'sales' ? 'active' : ''} 
                onClick={() => setActiveTab('sales')}
               >
                 <LottieIcon name="reports" size={18} /> Detalle Ventas
               </button>
           </div>
        </div>
      </div>

      <div className="view-content">
        
        {/* VISTA DASHBOARD GRÁFICO */}
        {activeTab === 'dashboard' && (
            <div className="charts-grid-layout">
                {/* Gráfico de Ventas (Líneas) */}
                <div className="chart-card wide">
                    <h3>Tendencia de Ventas (Últimos 7 días)</h3>
                    <div className="chart-wrapper" style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={ventasPorDia}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="fecha" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="total" stroke="#f97316" name="Total Ventas (S/)" strokeWidth={3} />
                                <Line type="monotone" dataKey="cantidad" stroke="#3b82f6" name="N° Transacciones" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Productos (Barras) */}
                <div className="chart-card">
                    <h3>Top 5 Productos Más Vendidos</h3>
                    <div className="chart-wrapper" style={{ height: 300 }}>
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProductos} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis type="number" stroke="#9ca3af" />
                                <YAxis dataKey="nombre" type="category" width={100} stroke="#9ca3af" style={{ fontSize: '10px' }} />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{ backgroundColor: '#1f2937', color: '#fff' }} />
                                <Bar dataKey="totalVendido" fill="#10b981" radius={[0, 4, 4, 0]} name="Unidades" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Categorías (Pie) */}
                <div className="chart-card">
                    <h3>Ventas por Categoría</h3>
                    <div className="chart-wrapper" style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={ventasPorCategoria}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="valor"
                                >
                                    {ventasPorCategoria.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `S/ ${value}`} contentStyle={{ backgroundColor: '#1f2937' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        {/* VISTA REPORTE VENTAS */}
        {activeTab === 'sales' && (
            <div className="report-generator-card">
                <div className="filters-bar">
                    <div className="date-inputs">
                        <label>Desde: <input type="date" value={filtroFechaInicio} onChange={e => setFiltroFechaInicio(e.target.value)} /></label>
                        <label>Hasta: <input type="date" value={filtroFechaFin} onChange={e => setFiltroFechaFin(e.target.value)} /></label>
                    </div>
                    <button className="primary" onClick={generarReporteVentas} disabled={loadingReporte}>
                        {loadingReporte ? 'Generando...' : 'Generar Reporte'}
                    </button>
                </div>

                {ventasReporte.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="report-results"
                    >
                        <div className="export-actions">
                            <h4>Resultados ({ventasReporte.length})</h4>
                            <div className="buttons">
                                <button className="secondary" onClick={() => handleExportPDF('ventas')}>
                                    📄 Exportar PDF
                                </button>
                                <button className="secondary" onClick={() => handleExportExcel('ventas')}>
                                    📗 Exportar Excel
                                </button>
                            </div>
                        </div>

                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>N° Venta</th>
                                        <th>Fecha</th>
                                        <th>Cliente</th>
                                        <th>Método</th>
                                        <th style={{textAlign: 'right'}}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ventasReporte.map(v => (
                                        <tr key={v.idVenta}>
                                            <td style={{fontWeight: 'bold', color: '#f97316'}}>{v.numeroVenta}</td>
                                            <td>{new Date(v.fechaHora).toLocaleDateString()} {new Date(v.fechaHora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                            <td>{v.clienteNombre}</td>
                                            <td>
                                                <span className="badge">{v.metodoPago}</span>
                                            </td>
                                            <td style={{textAlign: 'right', fontWeight: 'bold'}}>
                                                S/ {parseFloat(v.montoTotal).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {ventasReporte.length === 0 && !loadingReporte && (
                    <div className="empty-state">
                        <p>Selecciona un rango de fechas para generar el reporte.</p>
                    </div>
                )}
            </div>
        )}

      </div>
      
      {/* Estilos locales para esta vista */}
      <style>{`
        .charts-grid-layout {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
        }
        .chart-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .chart-card.wide {
            grid-column: 1 / -1;
        }
        .tabs-pills {
            display: flex;
            gap: 0.5rem;
            background: rgba(0,0,0,0.2);
            padding: 0.25rem;
            border-radius: 99px;
        }
        .tabs-pills button {
            background: transparent;
            border: none;
            color: #aaa;
            padding: 0.5rem 1rem;
            border-radius: 99px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
        }
        .tabs-pills button.active {
            background: #f97316;
            color: white;
            font-weight: 600;
        }
        .filters-bar {
            display: flex;
            gap: 1rem;
            align-items: flex-end;
            margin-bottom: 2rem;
            background: rgba(255,255,255,0.03);
            padding: 1.5rem;
            border-radius: 12px;
        }
        .date-inputs {
            display: flex;
            gap: 1rem;
        }
        .date-inputs label {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            font-size: 0.85rem;
            color: #aaa;
        }
        .date-inputs input {
            padding: 0.5rem;
            border-radius: 6px;
            border: 1px solid #444;
            background: #222;
            color: white;
        }
        .export-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        .export-actions .buttons {
            display: flex;
            gap: 0.5rem;
        }
      `}</style>
    </div>
  )
}

// Vista Gestión de Usuarios (Solo Admin)
function UsersView() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const toast = useToast()

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterRole) params.append('rol', filterRole)
      if (filterStatus !== '') params.append('estado', filterStatus)

      const url = `/api/usuarios?${params.toString()}`
      console.log('🔍 Cargando usuarios...')
      console.log('📡 URL:', url)
      console.log('🔑 Token existe:', !!localStorage.getItem('token') || !!sessionStorage.getItem('token'))
      
      const response = await apiFetch(url)
      
      console.log('📨 Respuesta HTTP status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Usuarios recibidos:', data.usuarios?.length || 0, 'usuarios')
        console.log('📋 Lista de usuarios:', data.usuarios)
        setUsers(data.usuarios || [])
      } else {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { message: `Error ${response.status}: ${response.statusText}` }
        }
        console.error('❌ Error HTTP:', response.status, errorData)
        toast.notify(errorData.message || 'Error al cargar usuarios', { type: 'error' })
      }
    } catch (error) {
      console.error('❌ Error completo:', error)
      console.error('❌ Tipo de error:', error.name)
      console.error('❌ Mensaje:', error.message)
      toast.notify('Error de conexión al cargar usuarios', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await apiFetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        console.log('🎭 Roles cargados:', data.roles)
        setRoles(data.roles || [])
      }
    } catch (error) {
      console.error('Error al cargar roles:', error)
    }
  }

  // Cargar roles y usuarios al iniciar
  useEffect(() => {
    fetchRoles()
    fetchUsers()
  }, [])

  // Recargar usuarios cuando cambien los filtros
  useEffect(() => {
    if (filterRole !== '' || filterStatus !== '') {
      console.log('🔄 Filtros cambiados, recargando usuarios...')
      fetchUsers()
    }
  }, [filterRole, filterStatus])

  const handleChangeRole = (user) => {
    setSelectedUser(user)
    setShowRoleModal(true)
  }

  const handleToggleStatus = async (user) => {
    try {
      const response = await apiFetch(`/api/usuarios/${user.idUsuario}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: user.estado === 1 ? 0 : 1 })
      })

      if (response.ok) {
        toast.notify(`Usuario ${user.estado === 1 ? 'desactivado' : 'activado'} correctamente`, { type: 'success' })
        fetchUsers()
      } else {
        const data = await response.json()
        toast.notify(data.message || 'Error al cambiar estado', { type: 'error' })
      }
    } catch (error) {
      toast.notify('Error al cambiar estado', { type: 'error' })
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    try {
      const response = await apiFetch(`/api/usuarios/${selectedUser.idUsuario}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        toast.notify(data.message, { type: 'success' })
        fetchUsers()
      } else {
        const data = await response.json()
        toast.notify(data.message || 'Error al eliminar usuario', { type: 'error' })
      }
    } catch (error) {
      toast.notify('Error al eliminar usuario', { type: 'error' })
    } finally {
      setShowDeleteDialog(false)
      setSelectedUser(null)
    }
  }

  // Filtrar solo por búsqueda de texto (nombre/email)
  // Los filtros de rol y estado se manejan en el backend
  const filteredUsers = users.filter(user =>
    !searchTerm || 
    user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LottieIcon name="suppliers" size={28} />
          Gestión de Usuarios
        </h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o email..."
          />
          <span style={{ 
            padding: '0.5rem 1rem', 
            background: 'rgba(99, 102, 241, 0.2)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#6366f1',
            whiteSpace: 'nowrap'
          }}>
            Total: {filteredUsers.length} usuarios
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="table-container" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LottieIcon name="filter" size={22} />
          Filtros Adicionales
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem'
        }}>
          <div className="input-group">
            <label>Rol</label>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="">Todos los roles</option>
              {roles.map(rol => (
                <option key={rol.idRol} value={rol.idRol}>{rol.nombreRol}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Estado</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="1">Activos</option>
              <option value="0">Inactivos</option>
            </select>
          </div>

          <div className="input-group">
            <label style={{ opacity: 0 }}>Acciones</label>
            <button 
              className="secondary" 
              onClick={() => {
              setSearchTerm('')
              setFilterRole('')
              setFilterStatus('')
            }}
          >
            <LottieIcon name="delete" size={18} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
            Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Cargando usuarios...</p>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <p>👥 No se encontraron usuarios</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Teléfono</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.idUsuario}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '4px solid rgba(99, 102, 241, 0.5)',
                        background: user.fotoPerfil ? 'transparent' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {user.fotoPerfil ? (
                          <img 
                            src={user.fotoPerfil} 
                            alt={user.nombre}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.parentElement.innerHTML = '<div style="font-size: 4rem; color: white;">👤</div>'
                            }}
                          />
                        ) : (
                          <div style={{ fontSize: '4rem', color: 'white' }}>
                            {user.nombre?.charAt(0)?.toUpperCase() || '👤'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.nombre}</div>
                        {user.cargo && (
                          <div style={{ fontSize: '0.8rem', color: 'rgba(234, 234, 234, 0.6)' }}>
                            {user.cargo}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      background: user.idRol === 1 ? 'rgba(99, 102, 241, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      color: user.idRol === 1 ? '#6366f1' : '#3b82f6',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <LottieIcon 
                        name={user.idRol === 1 ? 'crown' : 'briefcase'} 
                        size={16} 
                        color={user.idRol === 1 ? '#6366f1' : '#3b82f6'} 
                      />
                      {user.idRol === 1 ? 'Admin' : 'Vendedor'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {/* Estado de cuenta (Activo/Inactivo) - Lo que el filtro usa */}
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        background: user.estado === 1 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: user.estado === 1 ? '#10b981' : '#ef4444',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: user.estado === 1 ? '#10b981' : '#ef4444'
                        }}></span>
                        {user.estado === 1 ? 'Activo' : 'Inactivo'}
                      </span>
                      {/* Indicador de conexión (secundario) */}
                      <span style={{
                        fontSize: '0.75rem',
                        color: user.enSesion === 1 ? '#10b981' : '#6b7280',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: user.enSesion === 1 ? '#10b981' : '#6b7280',
                          boxShadow: user.enSesion === 1 ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none',
                          animation: user.enSesion === 1 ? 'pulse 2s infinite' : 'none'
                        }}></span>
                        {user.enSesion === 1 ? 'En línea' : 'Desconectado'}
                      </span>
                    </div>
                  </td>
                  <td>{user.telefono || '-'}</td>
                  <td>{formatDate(user.fechaCreacion)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleChangeRole(user)}
                      title="Cambiar Rol"
                    >
                      <LottieIcon name="shield" size={20} color="#6366f1" />
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleToggleStatus(user)}
                      title={user.estado === 1 ? 'Desactivar' : 'Activar'}
                    >
                      <LottieIcon name="lock" size={20} color={user.estado === 1 ? '#10b981' : '#9ca3af'} />
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={() => {
                        setSelectedUser(user)
                        setShowDeleteDialog(true)
                      }}
                      title="Eliminar"
                      style={{ color: '#ef4444' }}
                    >
                      <LottieIcon name="delete" size={20} color="#ef4444" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserRoleModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        roles={roles}
        onSuccess={fetchUsers}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setSelectedUser(null)
        }}
        onConfirm={handleDelete}
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar el usuario "${selectedUser?.nombre}"? ${selectedUser?.idRol === 1 ? '⚠️ Este es un administrador.' : ''}`}
        confirmText="Eliminar"
      />
    </div>
  )
}

// Vista Configuración
function SettingsView({ userData, onPasswordChange, onProfileUpdate }) {
  const [showEditProfile, setShowEditProfile] = useState(false)

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible'
    const date = new Date(dateString)
    return date.toLocaleString('es-PE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'No especificado'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-PE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    })
  }

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return edad
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LottieIcon name="settings" size={28} />
          Mi Perfil y Configuración
        </h2>
        <button className="primary" onClick={() => setShowEditProfile(true)}>
          <LottieIcon name="edit" size={18} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
          Editar Perfil
        </button>
      </div>

      {/* Tarjeta de Perfil Principal */}
      <div className="settings-card" style={{ 
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {/* Foto de perfil */}
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '4px solid rgba(99, 102, 241, 0.5)',
            background: userData?.fotoPerfil ? 'transparent' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {userData?.fotoPerfil ? (
              <img 
                src={userData.fotoPerfil} 
                alt={userData.nombre}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML = '<div style="font-size: 4rem; color: white;">👤</div>'
                }}
              />
            ) : (
              <div style={{ fontSize: '4rem', color: 'white' }}>
                {userData?.nombre?.charAt(0)?.toUpperCase() || '👤'}
              </div>
            )}
          </div>

          {/* Información principal */}
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 700 }}>
              {userData?.nombre || 'Usuario'}
            </h2>
            <p style={{ 
              margin: '0 0 0.75rem 0', 
              fontSize: '1.1rem', 
              color: 'rgba(234, 234, 234, 0.7)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {userData?.idRol === 1 ? '👑 Administrador' : '💼 Vendedor'}
              {userData?.cargo && ` • ${userData.cargo}`}
            </p>
            {userData?.biografia && (
              <p style={{ 
                margin: 0, 
                fontSize: '0.95rem', 
                color: 'rgba(234, 234, 234, 0.8)',
                fontStyle: 'italic'
              }}>
                "{userData.biografia}"
              </p>
            )}
          </div>

          {/* Indicador de estado */}
          <div style={{ textAlign: 'center' }}>
            <div className={userData?.estado === 1 ? 'status-indicator-active' : 'status-indicator-inactive'}>
              <span className="status-check-icon">
                {userData?.estado === 1 ? '✓' : '✕'}
              </span>
            </div>
            <p className={userData?.estado === 1 ? 'status-text-active' : 'status-text-inactive'}>
              {userData?.estado === 1 ? 'Activo' : 'Inactivo'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de información detallada */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1.5rem',
        marginTop: '1.5rem'
      }}>
        {/* Información de Contacto */}
        <div className="settings-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <LottieIcon name="phone" size={20} color="#f97316" />
            Información de Contacto
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="info-item">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LottieIcon name="email" size={16} color="#f97316" />
                Email
              </label>
              <p>{userData?.email || 'No disponible'}</p>
            </div>
            <div className="info-item">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LottieIcon name="phone" size={16} color="#f97316" />
                Teléfono
              </label>
              <p>{userData?.telefono || 'No registrado'}</p>
            </div>
            <div className="info-item">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LottieIcon name="location" size={16} color="#f97316" />
                Dirección
              </label>
              <p>{userData?.direccion || 'No especificada'}</p>
            </div>
          </div>
        </div>

        {/* Información Personal */}
        <div className="settings-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <LottieIcon name="user" size={20} color="#f97316" />
            Información Personal
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="info-item">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LottieIcon name="calendar" size={16} color="#f97316" />
                Fecha de Nacimiento
              </label>
              <p>
                {formatDateOnly(userData?.fechaNacimiento)}
                {userData?.fechaNacimiento && (
                  <span style={{ 
                    marginLeft: '0.5rem', 
                    color: 'rgba(234, 234, 234, 0.6)',
                    fontSize: '0.9rem' 
                  }}>
                    ({calcularEdad(userData.fechaNacimiento)} años)
                  </span>
                )}
              </p>
            </div>
            <div className="info-item">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LottieIcon name="briefcase" size={16} color="#f97316" />
                Cargo
              </label>
              <p>{userData?.cargo || 'No especificado'}</p>
            </div>
            <div className="info-item">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LottieIcon name="info" size={16} color="#f97316" />
                ID de Usuario
              </label>
              <p>#{userData?.idUsuario}</p>
            </div>
          </div>
        </div>

        {/* Información de la Cuenta */}
        <div className="settings-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <LottieIcon name="lock" size={20} color="#f97316" />
            Información de la Cuenta
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="info-item">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LottieIcon name="calendar" size={16} color="#f97316" />
                Fecha de Registro
              </label>
              <p style={{ fontSize: '0.9rem' }}>{formatDate(userData?.fechaCreacion)}</p>
            </div>
            <div className="info-item">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LottieIcon name="shield" size={16} color="#f97316" />
                Rol del Sistema
              </label>
              <p>
                <span style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  background: userData?.idRol === 1 ? 'rgba(99, 102, 241, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  color: userData?.idRol === 1 ? '#6366f1' : '#3b82f6',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}>
                  {userData?.nombreRol || (userData?.idRol === 1 ? 'Administrador' : 'Vendedor')}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="settings-card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <LottieIcon name="checkCircle" size={20} color="#f97316" />
          Acciones Rápidas
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="primary" onClick={() => setShowEditProfile(true)}>
            <LottieIcon name="edit" size={18} color="#fff" style={{ display: 'inline-block', marginRight: '0.5rem' }} />
            Editar Perfil
          </button>
          <button className="secondary" onClick={onPasswordChange}>
            <LottieIcon name="key" size={18} color="#f97316" style={{ display: 'inline-block', marginRight: '0.5rem' }} />
            Cambiar Contraseña
          </button>
        </div>
      </div>

      {/* Modal de edición */}
      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        currentUser={userData}
        onSuccess={onProfileUpdate}
      />
    </div>
  )
}

