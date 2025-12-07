# 🏭 Sistema de Inventario - Rectificadora de Repuestos

Sistema completo de gestión de inventario con backend Node.js/Express y frontend React + Vite.

## ✨ Características Principales

- ✅ **Autenticación JWT** con sistema de sesiones seguro
- ✅ **Rate Limiting** contra ataques de fuerza bruta
- ✅ **Validaciones** con Express Validator
- ✅ **Helmet.js** para headers de seguridad
- ✅ **CORS configurado** para producción
- ✅ **Variables de entorno** para configuración segura
- ✅ **UI moderna** con React, Framer Motion y animaciones
- ✅ **Cambio de contraseña** integrado
- ✅ **Indicador de fortaleza** de contraseñas
- ✅ **Auto-refresh de tokens** para sesiones continuas

## 🚀 Inicio Rápido

### Opción 1: Inicio Automático (Recomendado)
```powershell
.\iniciar.ps1
```

Este script inicia automáticamente:
- Backend (puerto 3000)
- Frontend (puerto 5174)
- Abre el navegador en http://localhost:5174

### Opción 2: Inicio Manual

#### Terminal 1 - Backend
```powershell
node index.js
```

#### Terminal 2 - Frontend
```powershell
cd frontend-react
npm run dev
```

#### 3. Abrir navegador
Ir a: http://localhost:5174

### Opción 3: Ejecutar Pruebas de Seguridad
```powershell
.\pruebas.ps1
```

Este script verifica:
- ✅ Conectividad con el backend
- ✅ Sistema de autenticación JWT
- ✅ Rate limiting funcionando
- ✅ Validaciones de inputs
- ✅ Refresh token
- ✅ Protección de rutas

## 🔐 Credenciales de Acceso

**Administrador:**
- Email: `admin@rectificadora.com`
- Contraseña: `admin123`

## 📦 Requisitos Previos

- Node.js (v16 o superior)
- MySQL/XAMPP corriendo
- Base de datos: `db_rectificadoraderepuesto`

## 🛠️ Configuración Inicial

### 1. Instalar dependencias del backend
```powershell
npm install
```

Instala:
- express, cors, bcrypt, jsonwebtoken
- mysql2 para conexión a BD
- dotenv para variables de entorno
- express-rate-limit para rate limiting
- helmet para seguridad HTTP
- express-validator para validaciones

### 2. Instalar dependencias del frontend
```powershell
cd frontend-react
npm install
```

Instala:
- React 18
- React Router DOM
- Framer Motion (animaciones)
- Styled Components
- ldrs (loaders)

### 3. Configurar Variables de Entorno
Copia `.env.example` a `.env` y configura:
```env
JWT_SECRET=tu_clave_super_segura_aqui
DB_PASSWORD=tu_password_mysql
```

**⚠️ IMPORTANTE:** Genera una clave JWT segura:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Crear usuario administrador (primera vez)
```powershell
node crearAdmin.js
```

## 📁 Estructura del Proyecto

```
Sistema de Invetario/
├── .env                            # Variables de entorno (NO subir a Git)
├── .env.example                    # Plantilla de variables
├── .gitignore                      # Archivos ignorados por Git
├── backend/                        # Lógica adicional del backend
├── frontend-react/                 # Aplicación React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChangePasswordModal.jsx    # Modal cambiar contraseña
│   │   │   ├── ProtectedRoute.jsx         # Rutas protegidas
│   │   │   ├── ThemeSwitch.jsx            # Switch tema oscuro/claro
│   │   │   └── ToastProvider.jsx          # Notificaciones
│   │   ├── pages/
│   │   │   ├── Auth.jsx                   # Login/Registro
│   │   │   ├── Dashboard.jsx              # Panel principal
│   │   │   ├── Login.jsx                  # Login standalone
│   │   │   ├── Signup.jsx                 # Registro standalone
│   │   │   └── ForgotPassword.jsx         # Recuperar contraseña
│   │   ├── utils/
│   │   │   └── api.js                     # Helpers para API calls
│   │   ├── App.jsx                        # Componente principal
│   │   ├── main.jsx                       # Entry point
│   │   └── styles.css                     # Estilos globales
│   ├── public/
│   │   └── assets/
│   │       └── logo.png                   # Logo de la empresa
│   ├── index.html                         # HTML base
│   ├── vite.config.js                     # Config de Vite
│   └── package.json
├── public/                         # Frontend antiguo (HTML/CSS/JS)
├── index.js                        # Servidor backend principal
├── db.js                           # Configuración de base de datos
├── crearAdmin.js                   # Script crear admin
├── iniciar.ps1                     # Script de inicio automático
├── pruebas.ps1                     # Script de pruebas de seguridad
├── package.json                    # Dependencias del backend
├── README.md                       # Este archivo
├── SEGURIDAD_SESIONES.md          # Análisis de seguridad
└── IMPLEMENTACION_COMPLETA.md     # Guía de implementación
```

## 🔌 Endpoints de API

### Autenticación 🔐
- `POST /api/usuarios/login` - Iniciar sesión (con rate limiting)
- `POST /api/usuarios/registro` - Registrar usuario (con validaciones)
- `GET /api/usuarios/me` - Obtener datos del usuario actual (requiere JWT)
- `POST /api/usuarios/refresh` - Renovar token antes de expirar (requiere JWT)
- `POST /api/usuarios/cambiar-contraseña` - Cambiar contraseña (requiere JWT)
- `PUT /api/usuarios/:id/estado` - Activar/desactivar usuario

### Productos
- `GET /api/productos` - Listar productos
- `POST /api/productos` - Crear producto
- `PUT /api/productos/:id` - Actualizar producto
- `DELETE /api/productos/:id` - Eliminar producto

### Categorías
- `GET /api/categorias` - Listar categorías
- `POST /api/categorias` - Crear categoría
- `PUT /api/categorias/:id` - Actualizar categoría
- `DELETE /api/categorias/:id` - Eliminar categoría

### Proveedores
- `GET /api/proveedores` - Listar proveedores
- `POST /api/proveedores` - Crear proveedor
- `PUT /api/proveedores/:id` - Actualizar proveedor
- `DELETE /api/proveedores/:id` - Eliminar proveedor

### Ventas
- `GET /api/ventas` - Listar ventas
- `POST /api/ventas` - Registrar venta
- `GET /api/ventas/:id/detalles` - Ver detalles de venta

### Movimientos de Inventario
- `GET /api/movimientos` - Listar movimientos
- `POST /api/movimientos` - Registrar movimiento
- `GET /api/movimientos/producto/:id` - Movimientos por producto

## 🔒 Sistema de Autenticación y Seguridad

### JWT (JSON Web Tokens)
- **Expiración**: 8 horas
- **Almacenamiento**: localStorage (recordar) o sessionStorage (sesión temporal)
- **Validación**: Frontend verifica expiración antes de cada ruta
- **Refresh**: Endpoint para renovar token automáticamente

### Rate Limiting
- **Login**: Máximo 5 intentos cada 15 minutos
- **Protección**: Contra ataques de fuerza bruta
- **Respuesta**: HTTP 429 con tiempo de reintento

### Validaciones
- **Email**: Formato válido y normalizado
- **Contraseñas**: Mínimo 6 caracteres
- **Inputs**: Sanitización con express-validator

### Headers de Seguridad (Helmet.js)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security
- Content-Security-Policy

### CORS
- Configurado específicamente para dominios permitidos
- Credenciales habilitadas
- Sin wildcards (*) en producción

## 🐛 Solución de Problemas

### Error: ERR_CONNECTION_REFUSED
- Verifica que el backend esté corriendo (`node index.js`)
- Verifica que MySQL/XAMPP esté activo

### Error: Port 3000 already in use
- Detén el proceso Node.js que esté usando el puerto:
```powershell
Get-Process node | Stop-Process -Force
```

### Frontend no carga
- Asegúrate de que lite-server esté instalado:
```powershell
cd frontend
npm install
```

## 📝 Características de la UI

### Frontend React
- **Framework**: React 18 con hooks
- **Routing**: React Router DOM v6
- **Animaciones**: Framer Motion (transiciones fluidas)
- **Loaders**: ldrs (spinners animados)
- **Estilos**: CSS modules con tema oscuro/claro

### Experiencia de Usuario (UX)
- ✅ Indicador de fortaleza de contraseña
- ✅ Detección de Bloq Mayús
- ✅ Mostrar/ocultar contraseñas
- ✅ Rate limiting visual (cooldown)
- ✅ Notificaciones toast
- ✅ Animaciones suaves
- ✅ Validación en tiempo real
- ✅ Auto-save del email (recordarme)
- ✅ Loader durante operaciones

### Dashboard
- Muestra datos del usuario actual
- Botón para cambiar contraseña
- Modal animado con validaciones
- Cierre de sesión mejorado

## 👨‍💻 Desarrollo

### Modo Desarrollo
```powershell
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend
cd frontend-react
npm run dev
```

### Hot Reload
- Backend: Reinicia manualmente
- Frontend: Vite detecta cambios automáticamente

### URLs
- Backend API: http://localhost:3000
- Frontend Dev: http://localhost:5174
- Frontend Build: `npm run build` en frontend-react/

## 🚀 Preparar para Producción

### 1. Generar JWT_SECRET seguro
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Actualizar .env
```env
NODE_ENV=production
JWT_SECRET=tu_clave_generada_aqui_muy_larga_y_segura
DB_PASSWORD=tu_password_real
```

### 3. Configurar CORS
En `index.js`, actualiza `allowedOrigins`:
```javascript
const allowedOrigins = ['https://tudominio.com']
```

### 4. Build del Frontend
```powershell
cd frontend-react
npm run build
```

### 5. Configurar HTTPS
- Usar Nginx como reverse proxy
- Certificado SSL con Let's Encrypt
- Redirigir HTTP → HTTPS

## 📚 Documentación Adicional

- **SEGURIDAD_SESIONES.md**: Análisis completo del sistema de sesiones
- **IMPLEMENTACION_COMPLETA.md**: Guía detallada de todas las mejoras
- **.env.example**: Plantilla de variables de entorno

## 🔧 Scripts Disponibles

### Backend
```powershell
npm run backend     # Iniciar servidor
node crearAdmin.js  # Crear usuario admin
```

### Frontend
```powershell
npm run dev         # Modo desarrollo
npm run build       # Build para producción
npm run preview     # Preview del build
```

### Utilidades
```powershell
.\iniciar.ps1       # Iniciar todo automáticamente
.\pruebas.ps1       # Ejecutar pruebas de seguridad
```

## 📊 Estado del Proyecto

### Completado ✅
- [x] Backend API completo
- [x] Autenticación JWT
- [x] Sistema de sesiones
- [x] Rate limiting
- [x] Validaciones
- [x] Helmet.js
- [x] Frontend React
- [x] Login/Registro
- [x] Dashboard básico
- [x] Cambio de contraseña
- [x] Variables de entorno
- [x] Documentación completa

### En Desarrollo 🚧
- [ ] CRUD completo de productos
- [ ] CRUD completo de categorías
- [ ] CRUD completo de proveedores
- [ ] Sistema de ventas
- [ ] Reportes e inventario
- [ ] Panel de administración

### Planeado 📋
- [ ] Recuperación de contraseña por email
- [ ] 2FA (autenticación de dos factores)
- [ ] Logs de auditoría
- [ ] Dashboard con estadísticas
- [ ] Exportar reportes PDF/Excel
- [ ] Notificaciones en tiempo real

## 🤝 Contribuir

Este es un proyecto privado, pero si tienes sugerencias:
1. Crea un issue con la propuesta
2. Describe el problema o mejora
3. Incluye ejemplos si es posible

## 📄 Licencia

Todos los derechos reservados - Rectificación de Repuestos en Tarapoto S.A.C. © 2025
