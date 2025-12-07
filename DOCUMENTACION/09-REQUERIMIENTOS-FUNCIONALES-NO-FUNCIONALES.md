# 📋 REQUERIMIENTOS DEL SISTEMA
## Sistema de Inventario - Rectificadora de Repuesto

---

**Fecha:** 29 de octubre de 2025  
**Versión:** 1.0  
**Proyecto:** Sistema de Gestión de Inventario para Rectificadora de Repuestos de Motos  

---

## 📑 ÍNDICE

1. [Requerimientos Funcionales](#requerimientos-funcionales)
2. [Requerimientos No Funcionales](#requerimientos-no-funcionales)
3. [Reglas de Negocio](#reglas-de-negocio)
4. [Casos de Uso](#casos-de-uso)
5. [Restricciones](#restricciones)

---

# 🎯 REQUERIMIENTOS FUNCIONALES

Los requerimientos funcionales describen las funcionalidades específicas que debe proporcionar el sistema.

---

## RF-01: GESTIÓN DE USUARIOS

### **RF-01.1: Registro de Usuarios**
- **Descripción:** El sistema debe permitir al administrador registrar nuevos usuarios en el sistema.
- **Prioridad:** Alta
- **Entradas:**
  - Nombre de usuario (único)
  - Nombre completo
  - Correo electrónico (único)
  - Contraseña (mínimo 6 caracteres)
  - Teléfono
  - Dirección
  - Fecha de nacimiento
  - Cargo
  - Rol (Administrador/Vendedor)
  - Foto de perfil (opcional)
- **Proceso:**
  1. Validar que el nombre de usuario y email sean únicos
  2. Encriptar la contraseña con bcrypt
  3. Asignar rol según selección
  4. Guardar en base de datos
- **Salidas:**
  - Usuario creado con ID único
  - Notificación de éxito
  - Email de bienvenida (futuro)
- **Validaciones:**
  - Email formato válido
  - Usuario no existente
  - Contraseña segura (min 6 caracteres)

### **RF-01.2: Autenticación de Usuarios**
- **Descripción:** El sistema debe permitir a los usuarios iniciar sesión con credenciales válidas.
- **Prioridad:** Crítica
- **Entradas:**
  - Nombre de usuario o email
  - Contraseña
- **Proceso:**
  1. Verificar existencia del usuario
  2. Validar contraseña con bcrypt
  3. Generar token JWT (válido 8 horas)
  4. Registrar fecha/hora de inicio de sesión
- **Salidas:**
  - Token JWT
  - Datos del usuario (sin contraseña)
  - Redirección al Dashboard
- **Validaciones:**
  - Usuario activo (estado = 1)
  - Credenciales correctas
  - No bloqueado por intentos fallidos

### **RF-01.3: Recuperación de Contraseña**
- **Descripción:** El sistema debe permitir a los usuarios recuperar su contraseña mediante email.
- **Prioridad:** Media
- **Entradas:**
  - Correo electrónico registrado
- **Proceso:**
  1. Verificar existencia del email
  2. Generar token único (expira en 1 hora)
  3. Enviar email con enlace de recuperación
  4. Validar token al ingresar nueva contraseña
- **Salidas:**
  - Email con enlace de recuperación
  - Confirmación de cambio de contraseña
- **Validaciones:**
  - Email existente en sistema
  - Token no expirado
  - Nueva contraseña diferente a la anterior

### **RF-01.4: Edición de Perfil**
- **Descripción:** Los usuarios deben poder actualizar su información personal.
- **Prioridad:** Media
- **Entradas:**
  - Nombre completo
  - Email
  - Teléfono
  - Dirección
  - Fecha de nacimiento
  - Cargo
  - Biografía
  - Foto de perfil
- **Proceso:**
  1. Validar datos ingresados
  2. Verificar unicidad de email (si cambió)
  3. Actualizar registro en BD
  4. Mantener contraseña si no se modificó
- **Salidas:**
  - Perfil actualizado
  - Notificación de éxito
- **Validaciones:**
  - Email único (si se modifica)
  - Formato de imagen válido (base64)

### **RF-01.5: Cambio de Contraseña**
- **Descripción:** Los usuarios deben poder cambiar su contraseña actual.
- **Prioridad:** Media
- **Entradas:**
  - Contraseña actual
  - Nueva contraseña
  - Confirmación de nueva contraseña
- **Proceso:**
  1. Verificar contraseña actual
  2. Validar coincidencia de nueva contraseña
  3. Encriptar y guardar
- **Salidas:**
  - Contraseña actualizada
  - Notificación de éxito
- **Validaciones:**
  - Contraseña actual correcta
  - Nuevas contraseñas coinciden
  - Mínimo 6 caracteres

### **RF-01.6: Gestión de Usuarios (Solo Administrador)**
- **Descripción:** El administrador puede listar, editar, activar/desactivar usuarios.
- **Prioridad:** Alta
- **Funciones:**
  - Listar todos los usuarios con filtros
  - Editar rol de usuario
  - Activar/desactivar usuarios
  - Ver estadísticas de usuarios
- **Validaciones:**
  - Solo acceso para rol Administrador
  - No puede desactivarse a sí mismo

---

## RF-02: GESTIÓN DE CATEGORÍAS

### **RF-02.1: Crear Categoría**
- **Descripción:** El sistema debe permitir crear categorías para clasificar productos.
- **Prioridad:** Alta
- **Entradas:**
  - Nombre de categoría (único)
  - Descripción (opcional)
- **Proceso:**
  1. Validar nombre único
  2. Guardar con estado activo
- **Salidas:**
  - Categoría creada con ID
  - Notificación de éxito
- **Validaciones:**
  - Nombre no vacío
  - Mínimo 2 caracteres
  - No duplicados

### **RF-02.2: Listar Categorías**
- **Descripción:** Mostrar todas las categorías registradas con opciones de filtro.
- **Prioridad:** Alta
- **Funciones:**
  - Ver todas las categorías
  - Filtrar por estado (activo/inactivo)
  - Buscar por nombre
  - Ver cantidad de productos por categoría
- **Salidas:**
  - Lista de categorías
  - Total de registros

### **RF-02.3: Editar Categoría**
- **Descripción:** Modificar información de categorías existentes.
- **Prioridad:** Media
- **Entradas:**
  - ID de categoría
  - Nuevo nombre
  - Nueva descripción
- **Validaciones:**
  - Nombre único (excepto el actual)
  - Categoría existente

### **RF-02.4: Activar/Desactivar Categoría**
- **Descripción:** Cambiar estado de categorías sin eliminarlas.
- **Prioridad:** Media
- **Proceso:**
  - Cambiar campo estado (0/1)
  - Mantener historial de productos
- **Validaciones:**
  - No afecta productos existentes
  - Solo cambio de visibilidad

---

## RF-03: GESTIÓN DE PROVEEDORES

### **RF-03.1: Registrar Proveedor**
- **Descripción:** Registrar empresas proveedoras de productos.
- **Prioridad:** Alta
- **Entradas:**
  - Nombre de contacto
  - Email (único)
  - Teléfono
  - Dirección
  - RUC
- **Validaciones:**
  - Email único y válido
  - RUC válido (11 dígitos)
  - Teléfono formato válido

### **RF-03.2: Listar Proveedores**
- **Descripción:** Ver todos los proveedores con opciones de búsqueda.
- **Funciones:**
  - Filtrar por estado
  - Buscar por nombre/email/RUC
  - Ver productos por proveedor
- **Salidas:**
  - Lista completa de proveedores
  - Estadísticas

### **RF-03.3: Editar Proveedor**
- **Descripción:** Actualizar información de proveedores.
- **Validaciones:**
  - Email único (si cambia)
  - Proveedor existente

### **RF-03.4: Activar/Desactivar Proveedor**
- **Descripción:** Cambiar estado sin eliminar registro.
- **Proceso:**
  - Cambiar estado
  - Mantener productos asociados

---

## RF-04: GESTIÓN DE PRODUCTOS (INVENTARIO)

### **RF-04.1: Registrar Producto**
- **Descripción:** Agregar nuevos productos al inventario.
- **Prioridad:** Crítica
- **Entradas:**
  - Código único
  - Nombre
  - Descripción
  - Marca
  - Modelo compatible (moto)
  - Ubicación en almacén
  - Precio de venta
  - Precio de compra
  - Stock inicial
  - Stock mínimo (alerta)
  - Categoría
  - Proveedor
- **Proceso:**
  1. Validar código único
  2. Guardar producto
  3. Crear movimiento de inventario (entrada inicial)
- **Salidas:**
  - Producto registrado con ID
  - Movimiento de inventario generado
- **Validaciones:**
  - Código único
  - Precios mayores a 0
  - Stock no negativo
  - Categoría y proveedor existentes

### **RF-04.2: Listar Productos**
- **Descripción:** Ver catálogo completo de productos.
- **Prioridad:** Crítica
- **Funciones:**
  - Buscar por código/nombre/marca
  - Filtrar por categoría
  - Filtrar por proveedor
  - Filtrar por estado
  - Ver productos con stock bajo
  - Ordenar por diferentes criterios
- **Salidas:**
  - Lista de productos
  - Información de stock
  - Total de productos

### **RF-04.3: Editar Producto**
- **Descripción:** Actualizar información de productos existentes.
- **Prioridad:** Alta
- **Proceso:**
  - Modificar datos del producto
  - Actualizar fecha de modificación
  - NO modificar stock directamente (usar movimientos)
- **Validaciones:**
  - Código único (si cambia)
  - Producto existente
  - Precios válidos

### **RF-04.4: Activar/Desactivar Producto**
- **Descripción:** Cambiar visibilidad de productos.
- **Proceso:**
  - Cambiar estado
  - Ocultar de nuevas ventas
  - Mantener historial

### **RF-04.5: Alertas de Stock Bajo**
- **Descripción:** Notificar cuando productos están bajo stock mínimo.
- **Prioridad:** Alta
- **Proceso:**
  1. Comparar stockActual con stockMinimo
  2. Mostrar alertas en dashboard
  3. Resaltar productos en lista
- **Salidas:**
  - Lista de productos con stock crítico
  - Notificaciones visuales

---

## RF-05: GESTIÓN DE MOVIMIENTOS DE INVENTARIO

### **RF-05.1: Registrar Entrada de Inventario**
- **Descripción:** Registrar ingreso de mercadería al inventario.
- **Prioridad:** Crítica
- **Entradas:**
  - Producto
  - Cantidad
  - Precio unitario de compra
  - Observaciones
  - Usuario que registra
- **Proceso:**
  1. Validar producto existente
  2. Incrementar stockActual
  3. Crear movimiento tipo "entrada"
  4. Actualizar fecha de última modificación
- **Salidas:**
  - Stock actualizado
  - Movimiento registrado
  - Notificación de éxito
- **Validaciones:**
  - Cantidad mayor a 0
  - Precio válido
  - Producto activo

### **RF-05.2: Registrar Salida de Inventario**
- **Descripción:** Registrar salida de productos (no por venta).
- **Prioridad:** Alta
- **Entradas:**
  - Producto
  - Cantidad
  - Motivo (merma, donación, uso interno)
  - Observaciones
- **Proceso:**
  1. Verificar stock disponible
  2. Decrementar stockActual
  3. Crear movimiento tipo "salida"
- **Validaciones:**
  - Cantidad disponible en stock
  - Cantidad mayor a 0

### **RF-05.3: Ajuste de Inventario**
- **Descripción:** Corregir discrepancias en stock (inventario físico).
- **Prioridad:** Alta
- **Entradas:**
  - Producto
  - Stock real contado
  - Observaciones del ajuste
- **Proceso:**
  1. Calcular diferencia (real - sistema)
  2. Actualizar stockActual
  3. Crear movimiento tipo "ajuste"
- **Validaciones:**
  - Solo administrador puede ajustar
  - Requiere observación obligatoria

### **RF-05.4: Historial de Movimientos**
- **Descripción:** Ver trazabilidad completa de movimientos por producto.
- **Prioridad:** Media
- **Funciones:**
  - Filtrar por producto
  - Filtrar por tipo de movimiento
  - Filtrar por rango de fechas
  - Filtrar por usuario
  - Exportar a Excel/PDF
- **Salidas:**
  - Lista de movimientos
  - Usuario responsable
  - Fecha y hora
  - Tipo de movimiento

---

## RF-06: GESTIÓN DE VENTAS

### **RF-06.1: Registrar Venta**
- **Descripción:** Procesar una nueva venta con múltiples productos.
- **Prioridad:** Crítica
- **Entradas:**
  - Cliente (nombre y documento opcional)
  - Lista de productos (código, cantidad, precio)
  - Método de pago
  - Usuario vendedor (automático por JWT)
- **Proceso:**
  1. Validar stock disponible de cada producto
  2. Generar número de venta único (VTA-YYYYMMDD-XXX)
  3. Calcular total de venta
  4. Crear registro de venta
  5. Crear detalles de venta (cada producto)
  6. Decrementar stock de cada producto
  7. Crear movimientos de inventario tipo "venta"
- **Salidas:**
  - Venta registrada con número único
  - Stock actualizado automáticamente
  - Movimientos de inventario generados
  - Comprobante (visualización)
- **Validaciones:**
  - Stock suficiente de cada producto
  - Precios mayores a 0
  - Cantidad mayor a 0
  - Al menos 1 producto en el carrito

### **RF-06.2: Listar Ventas**
- **Descripción:** Ver historial de ventas realizadas.
- **Prioridad:** Alta
- **Funciones:**
  - Filtrar por rango de fechas
  - Filtrar por cliente
  - Filtrar por vendedor
  - Filtrar por método de pago
  - Filtrar por estado
  - Buscar por número de venta
- **Salidas:**
  - Lista de ventas
  - Total vendido
  - Cantidad de ventas

### **RF-06.3: Ver Detalle de Venta**
- **Descripción:** Visualizar información completa de una venta específica.
- **Prioridad:** Media
- **Salidas:**
  - Número de venta
  - Fecha y hora
  - Cliente
  - Vendedor
  - Productos vendidos (código, nombre, cantidad, precio, subtotal)
  - Total de venta
  - Método de pago
  - Estado

### **RF-06.4: Anular Venta**
- **Descripción:** Cancelar una venta y devolver stock.
- **Prioridad:** Media
- **Proceso:**
  1. Verificar venta existente y completada
  2. Cambiar estado a "cancelada"
  3. Devolver stock de cada producto
  4. Crear movimientos de inventario tipo "devolucion"
  5. Registrar motivo de anulación
- **Validaciones:**
  - Solo administrador puede anular
  - Solo ventas del mismo día (configurable)
  - Requiere motivo obligatorio

### **RF-06.5: Exportar Comprobante**
- **Descripción:** Generar PDF del comprobante de venta.
- **Prioridad:** Media
- **Salidas:**
  - PDF con información de venta
  - Logo de empresa
  - Detalle de productos
  - Total

---

## RF-07: REPORTES Y ESTADÍSTICAS

### **RF-07.1: Dashboard Principal**
- **Descripción:** Mostrar resumen ejecutivo del negocio.
- **Prioridad:** Alta
- **Elementos:**
  - Total de ventas del día/mes
  - Productos más vendidos
  - Stock bajo (alertas)
  - Últimas ventas realizadas
  - Gráfico de ventas por día (últimos 7 días)
  - Gráfico de ventas por mes
  - Top 5 productos vendidos
  - Total de productos en inventario
  - Valor total del inventario

### **RF-07.2: Reporte de Ventas**
- **Descripción:** Generar reporte detallado de ventas.
- **Prioridad:** Alta
- **Parámetros:**
  - Rango de fechas
  - Vendedor (opcional)
  - Método de pago (opcional)
- **Salidas:**
  - Lista de ventas
  - Total vendido
  - Cantidad de ventas
  - Ticket promedio
  - Gráfico de ventas por día
  - Exportar a Excel/PDF

### **RF-07.3: Reporte de Productos Más Vendidos**
- **Descripción:** Ver productos con mayor rotación.
- **Prioridad:** Media
- **Parámetros:**
  - Rango de fechas
  - Top N productos (5, 10, 20)
  - Categoría (opcional)
- **Salidas:**
  - Lista de productos
  - Cantidad vendida
  - Ingresos generados
  - Gráfico de barras

### **RF-07.4: Reporte de Inventario Actual**
- **Descripción:** Estado actual del inventario.
- **Prioridad:** Media
- **Funciones:**
  - Ver stock de todos los productos
  - Filtrar por categoría
  - Productos con stock bajo
  - Valor total del inventario
  - Exportar a Excel/PDF

### **RF-07.5: Reporte de Movimientos**
- **Descripción:** Historial de movimientos de inventario.
- **Prioridad:** Media
- **Parámetros:**
  - Rango de fechas
  - Tipo de movimiento
  - Producto (opcional)
  - Usuario (opcional)
- **Salidas:**
  - Lista de movimientos
  - Total de entradas
  - Total de salidas
  - Balance
  - Exportar a Excel/PDF

---

## RF-08: EXPORTACIÓN DE DATOS

### **RF-08.1: Exportar a Excel**
- **Descripción:** Descargar reportes en formato Excel (.xlsx).
- **Prioridad:** Media
- **Aplica a:**
  - Lista de productos
  - Lista de ventas
  - Movimientos de inventario
  - Reporte de ventas

### **RF-08.2: Exportar a PDF**
- **Descripción:** Generar documentos PDF.
- **Prioridad:** Media
- **Aplica a:**
  - Comprobantes de venta
  - Reportes de ventas
  - Inventario actual
  - Lista de productos

---

# 🔒 REQUERIMIENTOS NO FUNCIONALES

Los requerimientos no funcionales especifican criterios de calidad y restricciones del sistema.

---

## RNF-01: SEGURIDAD

### **RNF-01.1: Autenticación**
- **Descripción:** El sistema debe usar JWT (JSON Web Tokens) para autenticación.
- **Especificaciones:**
  - Tokens firmados con clave secreta
  - Expiración de 8 horas
  - Almacenamiento en localStorage del navegador
  - Renovación automática antes de expirar

### **RNF-01.2: Encriptación de Contraseñas**
- **Descripción:** Las contraseñas deben estar encriptadas.
- **Especificaciones:**
  - Uso de bcrypt con salt rounds = 10
  - No almacenar contraseñas en texto plano
  - Hash irreversible

### **RNF-01.3: Protección contra Ataques**
- **Descripción:** Implementar medidas de seguridad básicas.
- **Especificaciones:**
  - Rate limiting (máx 100 peticiones por IP/15min)
  - Helmet.js para headers HTTP seguros
  - CORS configurado correctamente
  - Validación de entrada con express-validator
  - Sanitización de datos

### **RNF-01.4: Control de Acceso Basado en Roles**
- **Descripción:** Restricciones según rol de usuario.
- **Roles:**
  - **Administrador:** Acceso completo
  - **Vendedor:** Solo ventas y consultas
- **Restricciones:**
  - Vendedor NO puede: crear usuarios, ajustar inventario, anular ventas, ver reportes financieros
  - Administrador: Sin restricciones

---

## RNF-02: RENDIMIENTO

### **RNF-02.1: Tiempo de Respuesta**
- **Descripción:** El sistema debe responder en tiempos aceptables.
- **Especificaciones:**
  - Consultas simples: < 500ms
  - Consultas complejas: < 2 segundos
  - Carga inicial del dashboard: < 3 segundos
  - Registro de venta: < 1 segundo

### **RNF-02.2: Capacidad**
- **Descripción:** Soportar volumen de datos esperado.
- **Especificaciones:**
  - Hasta 10,000 productos en catálogo
  - Hasta 100 usuarios simultáneos
  - Hasta 1,000 ventas diarias
  - Historial de 5 años

### **RNF-02.3: Optimización de Consultas**
- **Descripción:** Base de datos optimizada.
- **Especificaciones:**
  - Índices en campos de búsqueda frecuente
  - Paginación en listados (20-50 registros por página)
  - Carga diferida (lazy loading) de imágenes

---

## RNF-03: USABILIDAD

### **RNF-03.1: Interfaz Intuitiva**
- **Descripción:** Fácil de usar sin capacitación extensa.
- **Especificaciones:**
  - Navegación simple y clara
  - Iconos reconocibles
  - Mensajes de error descriptivos
  - Confirmación en acciones críticas (eliminar, anular)

### **RNF-03.2: Responsive Design**
- **Descripción:** Adaptable a diferentes dispositivos.
- **Especificaciones:**
  - Compatible con desktop (1920x1080, 1366x768)
  - Compatible con tablets (768px+)
  - Compatible con móviles (320px+)

### **RNF-03.3: Accesibilidad**
- **Descripción:** Cumplir estándares básicos de accesibilidad.
- **Especificaciones:**
  - Contraste de colores adecuado
  - Tamaño de fuente legible (14px mínimo)
  - Navegación por teclado
  - Etiquetas alt en imágenes

### **RNF-03.4: Feedback Visual**
- **Descripción:** Informar al usuario sobre acciones realizadas.
- **Especificaciones:**
  - Notificaciones toast para acciones exitosas
  - Mensajes de error claros
  - Loaders durante carga
  - Confirmación antes de eliminar

---

## RNF-04: DISPONIBILIDAD

### **RNF-04.1: Tiempo de Actividad**
- **Descripción:** El sistema debe estar disponible la mayor parte del tiempo.
- **Especificaciones:**
  - Uptime objetivo: 99% (8.76 horas de downtime al año)
  - Mantenimiento programado fuera de horario laboral
  - Backup automático diario

### **RNF-04.2: Recuperación ante Fallos**
- **Descripción:** Capacidad de recuperación rápida.
- **Especificaciones:**
  - Backup diario de base de datos
  - Logs de errores para debugging
  - Recuperación en < 4 horas

---

## RNF-05: MANTENIBILIDAD

### **RNF-05.1: Código Limpio**
- **Descripción:** Código fácil de mantener y extender.
- **Especificaciones:**
  - Nomenclatura descriptiva
  - Comentarios en lógica compleja
  - Separación de responsabilidades
  - Componentes reutilizables

### **RNF-05.2: Documentación**
- **Descripción:** Sistema bien documentado.
- **Especificaciones:**
  - README con instrucciones de instalación
  - Documentación de API endpoints
  - Diagramas de arquitectura
  - Manual de usuario

### **RNF-05.3: Versionamiento**
- **Descripción:** Control de versiones del código.
- **Especificaciones:**
  - Uso de Git
  - Commits descriptivos
  - Branches para features

---

## RNF-06: COMPATIBILIDAD

### **RNF-06.1: Navegadores**
- **Descripción:** Compatible con navegadores modernos.
- **Especificaciones:**
  - Chrome 90+
  - Firefox 88+
  - Edge 90+
  - Safari 14+

### **RNF-06.2: Sistemas Operativos**
- **Descripción:** Funcionar en diferentes OS.
- **Especificaciones:**
  - Windows 10/11
  - macOS 10.15+
  - Linux (Ubuntu 20.04+)

---

## RNF-07: ESCALABILIDAD

### **RNF-07.1: Crecimiento de Datos**
- **Descripción:** Soportar crecimiento futuro.
- **Especificaciones:**
  - Base de datos MySQL soporta millones de registros
  - Pool de conexiones configurable
  - Posibilidad de migrar a PostgreSQL

### **RNF-07.2: Modularidad**
- **Descripción:** Fácil agregar nuevas funcionalidades.
- **Especificaciones:**
  - Arquitectura por capas (frontend/backend/database)
  - API REST escalable
  - Componentes React independientes

---

## RNF-08: PORTABILIDAD

### **RNF-08.1: Independencia de Plataforma**
- **Descripción:** No depender de hardware específico.
- **Especificaciones:**
  - Backend Node.js (multiplataforma)
  - Frontend web (sin instalación)
  - Base de datos portable

---

# 📜 REGLAS DE NEGOCIO

## RN-01: GESTIÓN DE STOCK
- El stock nunca puede ser negativo
- Solo se pueden vender productos con stock disponible
- Al registrar una venta, el stock se decrementa automáticamente
- Los ajustes de inventario solo los puede hacer el administrador
- Los productos con stock bajo deben aparecer en alertas

## RN-02: VENTAS
- Toda venta debe tener al menos un producto
- El precio de venta en el detalle se toma del precio actual del producto
- Las ventas solo pueden ser anuladas por el administrador
- Al anular una venta, el stock se devuelve automáticamente
- Cada venta tiene un número único secuencial

## RN-03: USUARIOS
- Un usuario solo puede tener un email
- El nombre de usuario debe ser único
- Las contraseñas deben tener mínimo 6 caracteres
- Solo el administrador puede crear/desactivar usuarios
- Los usuarios inactivos no pueden iniciar sesión

## RN-04: PRODUCTOS
- El código de producto debe ser único
- El precio de venta debe ser mayor o igual al precio de compra (advertencia)
- Un producto debe tener categoría y proveedor asignados
- Los productos inactivos no aparecen en ventas pero mantienen su historial
- La ubicación en almacén es obligatoria

## RN-05: MOVIMIENTOS DE INVENTARIO
- Todo movimiento debe quedar registrado con usuario responsable
- Los movimientos de tipo "venta" se generan automáticamente
- Los movimientos no se pueden eliminar (trazabilidad completa)
- Los ajustes requieren observación obligatoria

## RN-06: CATEGORÍAS Y PROVEEDORES
- El nombre de categoría debe ser único
- El email del proveedor debe ser único
- Al desactivar una categoría/proveedor, los productos asociados se mantienen
- No se pueden eliminar si tienen productos asociados

---

# 🎭 CASOS DE USO PRINCIPALES

## CU-01: Iniciar Sesión
**Actor:** Usuario (Administrador/Vendedor)  
**Precondición:** Usuario registrado y activo  
**Flujo Principal:**
1. Usuario ingresa nombre/email y contraseña
2. Sistema valida credenciales
3. Sistema genera token JWT
4. Sistema redirige al dashboard
5. Usuario visualiza pantalla principal

**Flujo Alternativo:**
- 2a. Credenciales incorrectas → Mostrar error
- 2b. Usuario inactivo → Mostrar mensaje "Usuario deshabilitado"

---

## CU-02: Registrar Venta
**Actor:** Vendedor/Administrador  
**Precondición:** Usuario autenticado, productos en stock  
**Flujo Principal:**
1. Usuario abre modal de nueva venta
2. Usuario ingresa datos del cliente (opcional)
3. Usuario busca y agrega productos al carrito
4. Sistema valida stock disponible
5. Usuario selecciona método de pago
6. Usuario confirma venta
7. Sistema genera número de venta
8. Sistema decrementa stock
9. Sistema crea movimientos de inventario
10. Sistema muestra comprobante

**Flujo Alternativo:**
- 4a. Stock insuficiente → Mostrar error y no permitir agregar
- 6a. Usuario cancela → Vaciar carrito

---

## CU-03: Registrar Producto
**Actor:** Administrador  
**Precondición:** Usuario autenticado con rol Administrador  
**Flujo Principal:**
1. Usuario abre modal de nuevo producto
2. Usuario completa formulario
3. Sistema valida código único
4. Sistema guarda producto
5. Sistema crea movimiento de inventario (entrada inicial)
6. Sistema muestra notificación de éxito

**Flujo Alternativo:**
- 3a. Código duplicado → Mostrar error

---

## CU-04: Consultar Stock Bajo
**Actor:** Administrador/Vendedor  
**Precondición:** Usuario autenticado  
**Flujo Principal:**
1. Usuario accede al dashboard
2. Sistema compara stockActual con stockMinimo
3. Sistema muestra alertas de productos con stock crítico
4. Usuario puede filtrar solo productos con stock bajo

---

## CU-05: Recuperar Contraseña
**Actor:** Usuario (sin autenticar)  
**Precondición:** Email registrado en sistema  
**Flujo Principal:**
1. Usuario hace clic en "¿Olvidaste tu contraseña?"
2. Usuario ingresa email
3. Sistema valida email existente
4. Sistema genera token de recuperación
5. Sistema envía email con enlace
6. Usuario hace clic en enlace
7. Usuario ingresa nueva contraseña
8. Sistema valida token no expirado
9. Sistema actualiza contraseña

**Flujo Alternativo:**
- 3a. Email no existe → Mostrar error
- 8a. Token expirado → Solicitar nuevo enlace

---

# ⚠️ RESTRICCIONES

## Restricciones Técnicas
- **Backend:** Node.js 18+ requerido
- **Frontend:** Navegadores con soporte ES6+
- **Base de Datos:** MySQL 8.0+ requerido
- **RAM mínima servidor:** 2GB
- **Espacio en disco:** 10GB mínimo
- **Conexión a Internet:** Requerida para envío de emails (recuperación de contraseña)

## Restricciones de Negocio
- El sistema es para uso interno de la empresa
- No incluye facturación electrónica (SUNAT)
- No incluye pasarela de pagos online
- No incluye punto de venta con lector de código de barras (futuro)
- No incluye app móvil nativa (futuro)

## Restricciones Legales
- Cumplir con Ley de Protección de Datos Personales (Perú)
- No almacenar datos de tarjetas de crédito
- Backup obligatorio de datos sensibles

---

# 📊 RESUMEN EJECUTIVO

| Categoría | Cantidad |
|-----------|----------|
| **Requerimientos Funcionales** | 37 |
| **Requerimientos No Funcionales** | 18 |
| **Reglas de Negocio** | 6 |
| **Casos de Uso** | 5 principales |
| **Actores** | 2 (Administrador, Vendedor) |

---

## ✅ PRIORIDADES

### **Críticas (Implementadas):**
- Autenticación de usuarios
- Gestión de productos
- Registro de ventas
- Control de stock
- Dashboard con estadísticas

### **Altas (Implementadas):**
- Gestión de categorías
- Gestión de proveedores
- Movimientos de inventario
- Reportes de ventas
- Recuperación de contraseña

### **Medias (Implementadas):**
- Exportación a Excel/PDF
- Alertas de stock bajo
- Historial de movimientos
- Edición de perfil

### **Futuras (No implementadas):**
- Facturación electrónica
- App móvil
- Lector de código de barras
- Notificaciones por email automáticas
- Dashboard en tiempo real con WebSockets
- Integración con sistemas contables

---

**Documento creado por:** Sistema de Documentación Automática  
**Última actualización:** 29 de octubre de 2025  
**Versión del sistema:** 1.0.0  
**Estado:** ✅ Completo y Validado
