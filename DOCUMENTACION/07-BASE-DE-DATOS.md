# 🗄️ BASE DE DATOS COMPLETA
## Sistema de Inventario - MySQL

---

## 📋 INFORMACIÓN GENERAL

| Propiedad | Valor |
|-----------|-------|
| **Motor** | MySQL 8.0+ |
| **Servidor** | localhost:3306 (XAMPP) |
| **Usuario** | root |
| **Password** | '' (vacío por defecto) |
| **Base de Datos** | `db_rectificadoraderepuesto` |
| **Charset** | utf8mb4_unicode_ci |
| **Engine** | InnoDB |
| **Tablas** | 8 tablas relacionadas |

---

## 📊 DIAGRAMA ENTIDAD-RELACIÓN (ER)

```
┌─────────────┐
│     Rol     │
│─────────────│
│ idRol (PK)  │
│ nombreRol   │
│ descripcion │
└─────┬───────┘
      │ 1
      │
      │ N
┌─────▼───────────────┐
│      Usuario        │
│─────────────────────│
│ idUsuario (PK)      │
│ nombre              │
│ nombreCompleto      │
│ contraseña          │
│ email (UNIQUE)      │
│ telefono            │
│ fotoPerfil          │
│ direccion           │
│ fechaNacimiento     │
│ cargo               │
│ biografia           │
│ estado              │
│ fechaHoraCreacion   │
│ fechaFinSesion      │
│ idRol (FK)          │◄─────────┐
│ resetToken          │          │
│ resetTokenExpiry    │          │
└─────────┬───────────┘          │
          │ 1                    │
          │                      │
          │ N                    │
    ┌─────▼──────┐               │
    │   Venta    │               │
    │────────────│               │
    │idVenta(PK) │               │
    │clienteDoc  │               │
    │clienteNom  │               │
    │estado      │               │
    │metodoPago  │               │
    │numeroVenta │               │
    │montoTotal  │               │
    │fechaHora   │               │
    │idUsuario   │───────────────┘
    └────┬───────┘
         │ 1
         │
         │ N
    ┌────▼────────────┐
    │  DetalleVenta   │
    │─────────────────│
    │idDetalle.. (PK) │
    │cantidad         │
    │precioVentaUnit  │
    │subtotal         │
    │idVenta (FK)     │
    │idProducto (FK)  │───┐
    └─────────────────┘   │
                          │
    ┌─────────────────┐   │
    │   Categoria     │   │
    │─────────────────│   │
    │idCategoria (PK) │   │
    │nombre (UNIQUE)  │   │
    │descripcion      │   │
    │estado           │   │
    └────────┬────────┘   │
             │ 1          │
             │            │
             │ N          │
    ┌────────▼────────────▼─────┐
    │       Producto            │
    │───────────────────────────│
    │ idProducto (PK)           │
    │ codigo (UNIQUE)           │
    │ nombre                    │
    │ descripcion               │
    │ marca                     │
    │ modeloCompatible          │
    │ ubicacion                 │
    │ precioVenta               │
    │ precioCompra              │
    │ stockActual               │
    │ stockMinimo               │
    │ estado                    │
    │ fechaActualizacion        │
    │ fechaRegistro             │
    │ idCategoria (FK)          │
    │ idProveedor (FK)          │◄─┐
    └─────────┬─────────────────┘  │
              │ 1                  │
              │                    │
              │ N                  │
    ┌─────────▼───────────────┐    │
    │ MovimientoInventario    │    │
    │─────────────────────────│    │
    │ idMovimiento.. (PK)     │    │
    │ cantidad                │    │
    │ fechaHora               │    │
    │ observaciones           │    │
    │ precioUnitario          │    │
    │ tipoMovimiento          │    │
    │ idProducto (FK)         │    │
    │ idUsuario (FK)          │    │
    │ idVenta (FK)            │    │
    └─────────────────────────┘    │
                                   │
    ┌──────────────┐               │
    │  Proveedor   │               │
    │──────────────│               │
    │idProveedor PK│               │
    │nombreContacto│               │
    │direccion     │               │
    │email (UNIQUE)│               │
    │telefono      │               │
    │ruc           │               │
    │estado        │               │
    └──────────────┴───────────────┘
```

---

## 🔗 RELACIONES (FOREIGN KEYS)

| Tabla | Campo | Referencia | ON DELETE | ON UPDATE |
|-------|-------|------------|-----------|-----------|
| **Usuario** | idRol | Rol.idRol | RESTRICT | CASCADE |
| **Producto** | idCategoria | Categoria.idCategoria | SET NULL | CASCADE |
| **Producto** | idProveedor | Proveedor.idProveedor | SET NULL | CASCADE |
| **Venta** | idUsuario | Usuario.idUsuario | RESTRICT | CASCADE |
| **DetalleVenta** | idVenta | Venta.idVenta | CASCADE | CASCADE |
| **DetalleVenta** | idProducto | Producto.idProducto | RESTRICT | CASCADE |
| **MovimientoInventario** | idProducto | Producto.idProducto | CASCADE | CASCADE |
| **MovimientoInventario** | idUsuario | Usuario.idUsuario | RESTRICT | CASCADE |
| **MovimientoInventario** | idVenta | Venta.idVenta | SET NULL | CASCADE |

### **Explicación de ON DELETE:**

- **RESTRICT**: No permite eliminar si hay registros relacionados (protege integridad)
- **CASCADE**: Elimina automáticamente los registros relacionados
- **SET NULL**: Establece el campo en NULL si se elimina el registro relacionado

---

## 📝 DESCRIPCIÓN DETALLADA DE CADA TABLA

---

### **1. Rol**
**Propósito:** Define los roles de usuarios del sistema

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| idRol | INT(11) | PRIMARY KEY, AUTO_INCREMENT | ID único del rol |
| nombreRol | VARCHAR(50) | NOT NULL | Nombre del rol (Administrador, Vendedor) |
| descripcion | VARCHAR(255) | NULL | Descripción de permisos del rol |

**Datos iniciales:**
```sql
INSERT INTO Rol (idRol, nombreRol, descripcion) VALUES
(1, 'Administrador', 'Acceso completo al sistema'),
(2, 'Vendedor', 'Acceso a ventas y consultas de inventario');
```

---

### **2. Usuario**
**Propósito:** Almacena información de usuarios del sistema

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| idUsuario | INT(11) | PRIMARY KEY, AUTO_INCREMENT | ID único del usuario |
| nombre | VARCHAR(150) | NOT NULL | Nombre de usuario (para login) |
| nombreCompleto | VARCHAR(150) | NULL | Nombre completo real |
| contraseña | VARCHAR(255) | NOT NULL | Hash bcrypt de la contraseña |
| email | VARCHAR(100) | NOT NULL, UNIQUE | Email único del usuario |
| telefono | VARCHAR(20) | NULL | Teléfono de contacto |
| fotoPerfil | MEDIUMTEXT | NULL | Foto en base64 |
| direccion | VARCHAR(200) | NULL | Dirección física |
| fechaNacimiento | DATETIME | NULL | Fecha de nacimiento |
| cargo | VARCHAR(100) | NULL | Cargo en la empresa |
| biografia | TEXT | NULL | Biografía o descripción |
| estado | TINYINT(1) | DEFAULT 1 | 1=activo, 0=inactivo |
| fechaHoraCreacion | DATETIME | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| fechaFinSesion | DATETIME | NULL | Última fecha de cierre de sesión |
| idRol | INT(11) | NOT NULL, FK | Rol del usuario |
| resetToken | VARCHAR(100) | NULL | Token para reset de contraseña |
| resetTokenExpiry | DATETIME | NULL | Expiración del token |

**Índices:**
- `idx_email` - Búsqueda rápida por email
- `idx_estado` - Filtrar usuarios activos/inactivos
- `fk_usuario_rol` - Relación con Rol

---

### **3. Categoria**
**Propósito:** Clasificación de productos

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| idCategoria | INT(11) | PRIMARY KEY, AUTO_INCREMENT | ID único de categoría |
| nombre | VARCHAR(50) | NOT NULL, UNIQUE | Nombre de la categoría |
| descripcion | VARCHAR(255) | NULL | Descripción de la categoría |
| estado | TINYINT(1) | DEFAULT 1 | 1=activo, 0=inactivo |

**Ejemplos de categorías:**
- Motor (pistones, bielas, ciguenales)
- Frenos (pastillas, discos, líquidos)
- Suspensión (amortiguadores, resortes)
- Eléctrico (baterías, alternadores)
- Transmisión (embragues, cadenas)

**Índices:**
- `idx_nombre` - Búsqueda por nombre
- `idx_estado` - Filtrar activas/inactivas

---

### **4. Proveedor**
**Propósito:** Empresas que suministran productos

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| idProveedor | INT(11) | PRIMARY KEY, AUTO_INCREMENT | ID único del proveedor |
| nombreContacto | VARCHAR(100) | NOT NULL | Nombre de la persona de contacto |
| direccion | VARCHAR(255) | NULL | Dirección física |
| email | VARCHAR(100) | NOT NULL, UNIQUE | Email único del proveedor |
| telefono | VARCHAR(20) | NULL | Teléfono de contacto |
| ruc | VARCHAR(20) | NULL | RUC de la empresa |
| estado | TINYINT(1) | DEFAULT 1 | 1=activo, 0=inactivo |

**Índices:**
- `idx_email` - Búsqueda por email
- `idx_estado` - Filtrar activos/inactivos

---

### **5. Producto**
**Propósito:** Catálogo de productos del inventario

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| idProducto | INT(11) | PRIMARY KEY, AUTO_INCREMENT | ID único del producto |
| codigo | VARCHAR(50) | NOT NULL, UNIQUE | Código único del producto |
| nombre | VARCHAR(100) | NOT NULL | Nombre del producto |
| descripcion | VARCHAR(255) | NULL | Descripción detallada |
| marca | VARCHAR(50) | NULL | Marca del producto |
| modeloCompatible | VARCHAR(100) | NULL | Modelo de moto compatible |
| ubicacion | VARCHAR(50) | NULL | Ubicación física en almacén |
| precioVenta | DECIMAL(10,2) | DEFAULT 0.00 | Precio de venta al público |
| precioCompra | DECIMAL(10,2) | DEFAULT 0.00 | Precio de compra al proveedor |
| stockActual | INT(11) | DEFAULT 0 | Cantidad actual en inventario |
| stockMinimo | INT(11) | DEFAULT 0 | Alerta de stock mínimo |
| estado | TINYINT(1) | DEFAULT 1 | 1=activo, 0=inactivo |
| fechaActualizacion | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Última actualización |
| fechaRegistro | DATETIME | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| idCategoria | INT(11) | NULL, FK | Categoría del producto |
| idProveedor | INT(11) | NULL, FK | Proveedor del producto |

**Índices:**
- `idx_codigo` - Búsqueda por código
- `idx_nombre` - Búsqueda por nombre
- `idx_stock` - Consultas de stock
- `idx_estado` - Filtrar activos/inactivos
- `idx_categoria_estado` - Productos por categoría activos
- `idx_proveedor_estado` - Productos por proveedor activos

---

### **6. Venta**
**Propósito:** Registro de transacciones de venta

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| idVenta | INT(11) | PRIMARY KEY, AUTO_INCREMENT | ID único de la venta |
| clienteDocumento | VARCHAR(20) | NULL | DNI/RUC del cliente |
| clienteNombre | VARCHAR(150) | NOT NULL | Nombre del cliente |
| estado | VARCHAR(30) | DEFAULT 'completada' | Estado de la venta |
| metodoPago | VARCHAR(50) | DEFAULT 'efectivo' | Método de pago |
| numeroVenta | VARCHAR(20) | NOT NULL, UNIQUE | Número único de venta |
| montoTotal | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Total de la venta |
| fechaHora | DATETIME | DEFAULT CURRENT_TIMESTAMP | Fecha y hora de venta |
| idUsuario | INT(11) | NOT NULL, FK | Usuario vendedor |

**Valores de estado:**
- `completada` - Venta exitosa
- `cancelada` - Venta anulada

**Valores de metodoPago:**
- `efectivo`
- `tarjeta`
- `transferencia`
- `yape`
- `plin`

**Índices:**
- `idx_numero_venta` - Búsqueda por número de venta
- `idx_fecha` - Consultas por rango de fechas
- `idx_cliente` - Búsqueda por nombre de cliente
- `idx_usuario_fecha` - Ventas por vendedor y fecha

---

### **7. DetalleVenta**
**Propósito:** Detalle línea por línea de cada venta (carrito)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| idDetalleVenta | INT(11) | PRIMARY KEY, AUTO_INCREMENT | ID único del detalle |
| cantidad | INT(11) | NOT NULL | Cantidad vendida |
| precioVentaUnitario | DECIMAL(10,2) | NOT NULL | Precio unitario al momento de venta |
| subtotal | DECIMAL(10,2) | NOT NULL | cantidad × precioVentaUnitario |
| idVenta | INT(11) | NOT NULL, FK | Venta a la que pertenece |
| idProducto | INT(11) | NOT NULL, FK | Producto vendido |

**Índices:**
- `fk_detalle_venta` - Relación con Venta
- `fk_detalle_producto` - Relación con Producto

**Nota:** Al eliminar una Venta, se eliminan automáticamente sus DetalleVenta (CASCADE)

---

### **8. MovimientoInventario**
**Propósito:** Trazabilidad completa de movimientos de stock

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| idMovimientoInventario | INT(11) | PRIMARY KEY, AUTO_INCREMENT | ID único del movimiento |
| cantidad | INT(11) | NOT NULL | Cantidad (+entrada, -salida) |
| fechaHora | DATETIME | DEFAULT CURRENT_TIMESTAMP | Fecha del movimiento |
| observaciones | TEXT | NULL | Observaciones adicionales |
| precioUnitario | DECIMAL(10,2) | NULL | Precio unitario (si aplica) |
| tipoMovimiento | VARCHAR(50) | NOT NULL | Tipo de movimiento |
| idProducto | INT(11) | NOT NULL, FK | Producto afectado |
| idUsuario | INT(11) | NOT NULL, FK | Usuario que hizo el movimiento |
| idVenta | INT(11) | NULL, FK | Venta relacionada (si aplica) |

**Valores de tipoMovimiento:**
- `entrada` - Ingreso de mercadería
- `salida` - Salida de mercadería
- `ajuste` - Ajuste manual de inventario
- `venta` - Salida por venta
- `devolucion` - Devolución de cliente
- `merma` - Pérdida o daño

**Índices:**
- `idx_tipo` - Filtrar por tipo de movimiento
- `idx_fecha` - Consultas por rango de fechas
- `idx_producto_fecha` - Movimientos por producto y fecha

---

## 📈 CONSULTAS SQL COMUNES

### **1. Productos con stock bajo:**
```sql
SELECT 
    p.codigo,
    p.nombre,
    p.stockActual,
    p.stockMinimo,
    c.nombre AS categoria
FROM Producto p
LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
WHERE p.stockActual <= p.stockMinimo
  AND p.estado = 1
ORDER BY p.stockActual ASC;
```

### **2. Ventas del día con detalle:**
```sql
SELECT 
    v.numeroVenta,
    v.clienteNombre,
    v.montoTotal,
    v.fechaHora,
    u.nombre AS vendedor,
    COUNT(dv.idDetalleVenta) AS items
FROM Venta v
INNER JOIN Usuario u ON v.idUsuario = u.idUsuario
LEFT JOIN DetalleVenta dv ON v.idVenta = dv.idVenta
WHERE DATE(v.fechaHora) = CURDATE()
  AND v.estado = 'completada'
GROUP BY v.idVenta
ORDER BY v.fechaHora DESC;
```

### **3. Productos más vendidos:**
```sql
SELECT 
    p.nombre,
    p.codigo,
    SUM(dv.cantidad) AS total_vendido,
    SUM(dv.subtotal) AS ingresos
FROM DetalleVenta dv
INNER JOIN Producto p ON dv.idProducto = p.idProducto
INNER JOIN Venta v ON dv.idVenta = v.idVenta
WHERE v.estado = 'completada'
  AND v.fechaHora >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY p.idProducto
ORDER BY total_vendido DESC
LIMIT 10;
```

### **4. Trazabilidad de un producto:**
```sql
SELECT 
    mi.fechaHora,
    mi.tipoMovimiento,
    mi.cantidad,
    mi.observaciones,
    u.nombre AS usuario,
    v.numeroVenta
FROM MovimientoInventario mi
INNER JOIN Usuario u ON mi.idUsuario = u.idUsuario
LEFT JOIN Venta v ON mi.idVenta = v.idVenta
WHERE mi.idProducto = ? -- ID del producto
ORDER BY mi.fechaHora DESC;
```

### **5. Resumen de ventas por vendedor:**
```sql
SELECT 
    u.nombreCompleto,
    COUNT(v.idVenta) AS total_ventas,
    SUM(v.montoTotal) AS total_ingresos,
    AVG(v.montoTotal) AS ticket_promedio
FROM Usuario u
INNER JOIN Venta v ON u.idUsuario = v.idUsuario
WHERE v.estado = 'completada'
  AND MONTH(v.fechaHora) = MONTH(NOW())
  AND YEAR(v.fechaHora) = YEAR(NOW())
GROUP BY u.idUsuario
ORDER BY total_ingresos DESC;
```

---

## 🔒 ÍNDICES DE OPTIMIZACIÓN

### **Índices simples:**
```sql
-- Usuario
ALTER TABLE Usuario ADD INDEX idx_email (email);
ALTER TABLE Usuario ADD INDEX idx_estado (estado);

-- Categoria
ALTER TABLE Categoria ADD INDEX idx_nombre (nombre);
ALTER TABLE Categoria ADD INDEX idx_estado (estado);

-- Proveedor
ALTER TABLE Proveedor ADD INDEX idx_email (email);
ALTER TABLE Proveedor ADD INDEX idx_estado (estado);

-- Producto
ALTER TABLE Producto ADD INDEX idx_codigo (codigo);
ALTER TABLE Producto ADD INDEX idx_nombre (nombre);
ALTER TABLE Producto ADD INDEX idx_stock (stockActual);
ALTER TABLE Producto ADD INDEX idx_estado (estado);

-- Venta
ALTER TABLE Venta ADD INDEX idx_numero_venta (numeroVenta);
ALTER TABLE Venta ADD INDEX idx_fecha (fechaHora);
ALTER TABLE Venta ADD INDEX idx_cliente (clienteNombre);

-- MovimientoInventario
ALTER TABLE MovimientoInventario ADD INDEX idx_tipo (tipoMovimiento);
ALTER TABLE MovimientoInventario ADD INDEX idx_fecha (fechaHora);
```

### **Índices compuestos (para consultas frecuentes):**
```sql
-- Productos por categoría activos
ALTER TABLE Producto ADD INDEX idx_categoria_estado (idCategoria, estado);

-- Productos por proveedor activos
ALTER TABLE Producto ADD INDEX idx_proveedor_estado (idProveedor, estado);

-- Ventas por usuario y fecha
ALTER TABLE Venta ADD INDEX idx_usuario_fecha (idUsuario, fechaHora);

-- Movimientos por producto y fecha
ALTER TABLE MovimientoInventario ADD INDEX idx_producto_fecha (idProducto, fechaHora);
```

---

## 🎯 DIAGRAMAS INCLUIDOS EN EL PROYECTO

En la carpeta **`diagramas/`** encontrarás:

### **Diagramas de Clases:**
- `Diagrama_de_Clases.png` - Estructura completa de clases

### **Diagramas de Casos de Uso:**
- `Actores.png` - Actores del sistema
- `Casos_de_Uso.png` - Casos de uso principales
- `Diagrama_Completo_Casos_de_Uso.png` - Vista completa

### **Diagramas de Secuencia:**
- `Secuencia_Login.png` - Flujo de login
- `Secuencia_Dashboard.png` - Carga del dashboard
- `Secuencia_Gestionar_Producto.png` - CRUD de productos
- `Secuencia_Gestionar_Categoria.png` - CRUD de categorías
- `Secuencia_Gestionar_Usuario.png` - CRUD de usuarios
- `Secuencia_Registrar_Venta.png` - Proceso de venta
- `Secuencia_Movimiento_Inventario.png` - Movimientos de stock
- `Secuencia_Recuperar_Contraseña.png` - Reset password

### **Diagramas de Colaboración:**
- `Colaboracion_Login.png`
- `Colaboracion_Dashboard.png`
- `Colaboracion_Crear_Producto.png`
- `Colaboracion_Crear_Categoria.png`
- `Colaboracion_Crear_Usuario.png`
- `Colaboracion_Registrar_Venta.png`
- `Colaboracion_Entrada_Inventario.png`
- `Colaboracion_Recuperar_Contraseña.png`

---

## ✅ VERIFICACIÓN DE INTEGRIDAD

### **Comandos de verificación:**

```sql
-- Verificar tablas creadas
SHOW TABLES;

-- Verificar estructura de una tabla
DESCRIBE Usuario;

-- Verificar Foreign Keys
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'db_rectificadoraderepuesto'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Verificar índices
SHOW INDEX FROM Producto;

-- Contar registros por tabla
SELECT 
    'Usuario' AS tabla, COUNT(*) AS registros FROM Usuario
UNION ALL
SELECT 'Categoria', COUNT(*) FROM Categoria
UNION ALL
SELECT 'Proveedor', COUNT(*) FROM Proveedor
UNION ALL
SELECT 'Producto', COUNT(*) FROM Producto
UNION ALL
SELECT 'Venta', COUNT(*) FROM Venta
UNION ALL
SELECT 'DetalleVenta', COUNT(*) FROM DetalleVenta
UNION ALL
SELECT 'MovimientoInventario', COUNT(*) FROM MovimientoInventario
UNION ALL
SELECT 'Rol', COUNT(*) FROM Rol;
```

---

## 📁 ARCHIVOS SQL DEL PROYECTO

1. **`ESTRUCTURA_BD_COMPLETA.sql`** - Creación de toda la estructura (8 tablas + índices)
2. **`DATOS_PRUEBA.sql`** - Datos iniciales de prueba (categorías, proveedores, productos)
3. **`DATOS_VENTAS_MOVIMIENTOS.sql`** - Ventas y movimientos de ejemplo
4. **`AGREGAR_CAMPOS_RESET_PASSWORD.sql`** - Migración para reset de contraseña

---

## 🎓 CONCLUSIÓN

La base de datos está diseñada con:

✅ **Normalización:** 3FN (Tercera Forma Normal)  
✅ **Integridad Referencial:** Foreign Keys con ON DELETE/UPDATE apropiados  
✅ **Índices Optimizados:** Para consultas frecuentes  
✅ **Trazabilidad:** Completa con MovimientoInventario  
✅ **Escalabilidad:** Preparada para crecer  
✅ **Seguridad:** Contraseñas hasheadas, tokens de reset  

**Todos los diagramas en la carpeta `diagramas/` coinciden exactamente con esta estructura.** ✅
