-- =====================================================
-- ESTRUCTURA COMPLETA DE LA BASE DE DATOS
-- Sistema de Inventario - Rectificadora de Repuestos
-- =====================================================
-- Esta estructura fue extraída del diagrama y validada
-- con el código del sistema
-- =====================================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS db_rectificadoraderepuesto
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE db_rectificadoraderepuesto;

-- =====================================================
-- TABLA: Rol
-- =====================================================
CREATE TABLE IF NOT EXISTS Rol (
    idRol INT(11) NOT NULL AUTO_INCREMENT,
    nombreRol VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (idRol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: Usuario
-- =====================================================
CREATE TABLE IF NOT EXISTS Usuario (
    idUsuario INT(11) NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    nombreCompleto VARCHAR(150) DEFAULT NULL,
    contraseña VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20) DEFAULT NULL,
    fotoPerfil MEDIUMTEXT DEFAULT NULL,
    direccion VARCHAR(200) DEFAULT NULL,
    fechaNacimiento DATETIME DEFAULT NULL,
    cargo VARCHAR(100) DEFAULT NULL,
    biografia TEXT DEFAULT NULL,
    estado TINYINT(1) DEFAULT 1,
    fechaHoraCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechaFinSesion DATETIME DEFAULT NULL,
    idRol INT(11) NOT NULL,
    resetToken VARCHAR(100) DEFAULT NULL,
    resetTokenExpiry DATETIME DEFAULT NULL,
    PRIMARY KEY (idUsuario),
    KEY idx_email (email),
    KEY idx_estado (estado),
    KEY fk_usuario_rol (idRol),
    CONSTRAINT fk_usuario_rol FOREIGN KEY (idRol) 
        REFERENCES Rol(idRol) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: Categoria
-- =====================================================
CREATE TABLE IF NOT EXISTS Categoria (
    idCategoria INT(11) NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255) DEFAULT NULL,
    estado TINYINT(1) DEFAULT 1,
    PRIMARY KEY (idCategoria),
    KEY idx_nombre (nombre),
    KEY idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: Proveedor
-- =====================================================
CREATE TABLE IF NOT EXISTS Proveedor (
    idProveedor INT(11) NOT NULL AUTO_INCREMENT,
    nombreContacto VARCHAR(100) NOT NULL,
    direccion VARCHAR(255) DEFAULT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20) DEFAULT NULL,
    ruc VARCHAR(20) DEFAULT NULL,
    estado TINYINT(1) DEFAULT 1,
    PRIMARY KEY (idProveedor),
    KEY idx_email (email),
    KEY idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: Producto
-- =====================================================
CREATE TABLE IF NOT EXISTS Producto (
    idProducto INT(11) NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) DEFAULT NULL,
    marca VARCHAR(50) DEFAULT NULL,
    modeloCompatible VARCHAR(100) DEFAULT NULL,
    ubicacion VARCHAR(50) DEFAULT NULL,
    precioVenta DECIMAL(10,2) DEFAULT 0.00,
    precioCompra DECIMAL(10,2) DEFAULT 0.00,
    stockActual INT(11) DEFAULT 0,
    stockMinimo INT(11) DEFAULT 0,
    estado TINYINT(1) DEFAULT 1,
    fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    idCategoria INT(11) DEFAULT NULL,
    idProveedor INT(11) DEFAULT NULL,
    PRIMARY KEY (idProducto),
    KEY idx_codigo (codigo),
    KEY idx_nombre (nombre),
    KEY idx_stock (stockActual),
    KEY idx_estado (estado),
    KEY fk_producto_categoria (idCategoria),
    KEY fk_producto_proveedor (idProveedor),
    CONSTRAINT fk_producto_categoria FOREIGN KEY (idCategoria) 
        REFERENCES Categoria(idCategoria) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    CONSTRAINT fk_producto_proveedor FOREIGN KEY (idProveedor) 
        REFERENCES Proveedor(idProveedor) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: Venta
-- =====================================================
CREATE TABLE IF NOT EXISTS Venta (
    idVenta INT(11) NOT NULL AUTO_INCREMENT,
    clienteDocumento VARCHAR(20) DEFAULT NULL,
    clienteNombre VARCHAR(150) NOT NULL,
    estado VARCHAR(30) DEFAULT 'completada',
    metodoPago VARCHAR(50) DEFAULT 'efectivo',
    numeroVenta VARCHAR(20) NOT NULL UNIQUE,
    montoTotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fechaHora DATETIME DEFAULT CURRENT_TIMESTAMP,
    idUsuario INT(11) NOT NULL,
    PRIMARY KEY (idVenta),
    KEY idx_numero_venta (numeroVenta),
    KEY idx_fecha (fechaHora),
    KEY idx_cliente (clienteNombre),
    KEY fk_venta_usuario (idUsuario),
    CONSTRAINT fk_venta_usuario FOREIGN KEY (idUsuario) 
        REFERENCES Usuario(idUsuario) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: DetalleVenta
-- =====================================================
CREATE TABLE IF NOT EXISTS DetalleVenta (
    idDetalleVenta INT(11) NOT NULL AUTO_INCREMENT,
    cantidad INT(11) NOT NULL,
    precioVentaUnitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    idVenta INT(11) NOT NULL,
    idProducto INT(11) NOT NULL,
    PRIMARY KEY (idDetalleVenta),
    KEY fk_detalle_venta (idVenta),
    KEY fk_detalle_producto (idProducto),
    CONSTRAINT fk_detalle_venta FOREIGN KEY (idVenta) 
        REFERENCES Venta(idVenta) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_producto FOREIGN KEY (idProducto) 
        REFERENCES Producto(idProducto) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: MovimientoInventario
-- =====================================================
CREATE TABLE IF NOT EXISTS MovimientoInventario (
    idMovimientoInventario INT(11) NOT NULL AUTO_INCREMENT,
    cantidad INT(11) NOT NULL,
    fechaHora DATETIME DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT DEFAULT NULL,
    precioUnitario DECIMAL(10,2) DEFAULT NULL,
    tipoMovimiento VARCHAR(50) NOT NULL,
    idProducto INT(11) NOT NULL,
    idUsuario INT(11) NOT NULL,
    idVenta INT(11) DEFAULT NULL,
    PRIMARY KEY (idMovimientoInventario),
    KEY idx_tipo (tipoMovimiento),
    KEY idx_fecha (fechaHora),
    KEY fk_movimiento_producto (idProducto),
    KEY fk_movimiento_usuario (idUsuario),
    KEY fk_movimiento_venta (idVenta),
    CONSTRAINT fk_movimiento_producto FOREIGN KEY (idProducto) 
        REFERENCES Producto(idProducto) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_usuario FOREIGN KEY (idUsuario) 
        REFERENCES Usuario(idUsuario) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_venta FOREIGN KEY (idVenta) 
        REFERENCES Venta(idVenta) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DATOS INICIALES: Roles del sistema
-- =====================================================
INSERT INTO Rol (idRol, nombreRol, descripcion) VALUES
(1, 'Administrador', 'Acceso completo al sistema'),
(2, 'Vendedor', 'Acceso a ventas y consultas de inventario');

-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices compuestos para consultas frecuentes
ALTER TABLE Producto ADD INDEX idx_categoria_estado (idCategoria, estado);
ALTER TABLE Producto ADD INDEX idx_proveedor_estado (idProveedor, estado);
ALTER TABLE Venta ADD INDEX idx_usuario_fecha (idUsuario, fechaHora);
ALTER TABLE MovimientoInventario ADD INDEX idx_producto_fecha (idProducto, fechaHora);

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

ALTER TABLE Usuario COMMENT 'Usuarios del sistema con diferentes roles';
ALTER TABLE Rol COMMENT 'Roles y permisos del sistema';
ALTER TABLE Categoria COMMENT 'Categorías de productos';
ALTER TABLE Proveedor COMMENT 'Proveedores de productos';
ALTER TABLE Producto COMMENT 'Catálogo de productos del inventario';
ALTER TABLE Venta COMMENT 'Registro de ventas realizadas';
ALTER TABLE DetalleVenta COMMENT 'Detalle línea por línea de cada venta';
ALTER TABLE MovimientoInventario COMMENT 'Trazabilidad de movimientos de inventario (entradas/salidas)';

-- =====================================================
-- FIN DE LA ESTRUCTURA
-- =====================================================

-- Verificar tablas creadas
SHOW TABLES;

SELECT 'Base de datos creada exitosamente' AS mensaje;
SELECT '8 tablas creadas con todas sus relaciones' AS detalle;
SELECT 'Listo para cargar datos de prueba' AS siguiente_paso;
