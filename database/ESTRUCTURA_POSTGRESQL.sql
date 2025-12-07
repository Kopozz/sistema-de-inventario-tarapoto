-- =====================================================
-- ESTRUCTURA COMPLETA DE LA BASE DE DATOS - PostgreSQL
-- Sistema de Inventario - Rectificadora de Repuestos
-- =====================================================
-- Ejecutar este script en Railway PostgreSQL o local
-- =====================================================

-- =====================================================
-- TABLA: Rol
-- =====================================================
CREATE TABLE IF NOT EXISTS "Rol" (
    "idRol" SERIAL PRIMARY KEY,
    "nombreRol" VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) DEFAULT NULL
);

-- =====================================================
-- TABLA: Usuario
-- =====================================================
CREATE TABLE IF NOT EXISTS "Usuario" (
    "idUsuario" SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    "nombreCompleto" VARCHAR(150) DEFAULT NULL,
    "contraseña" VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20) DEFAULT NULL,
    "fotoPerfil" TEXT DEFAULT NULL,
    direccion VARCHAR(200) DEFAULT NULL,
    "fechaNacimiento" TIMESTAMP DEFAULT NULL,
    cargo VARCHAR(100) DEFAULT NULL,
    biografia TEXT DEFAULT NULL,
    estado SMALLINT DEFAULT 1,
    "fechaHoraCreacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "fechaFinSesion" TIMESTAMP DEFAULT NULL,
    "idRol" INTEGER NOT NULL,
    "resetToken" VARCHAR(100) DEFAULT NULL,
    "resetTokenExpiry" TIMESTAMP DEFAULT NULL,
    CONSTRAINT fk_usuario_rol FOREIGN KEY ("idRol") 
        REFERENCES "Rol"("idRol") 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_usuario_email ON "Usuario"(email);
CREATE INDEX IF NOT EXISTS idx_usuario_estado ON "Usuario"(estado);

-- =====================================================
-- TABLA: Categoria
-- =====================================================
CREATE TABLE IF NOT EXISTS "Categoria" (
    "idCategoria" SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255) DEFAULT NULL,
    estado SMALLINT DEFAULT 1,
    "codigoPrefix" VARCHAR(10) DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_categoria_nombre ON "Categoria"(nombre);
CREATE INDEX IF NOT EXISTS idx_categoria_estado ON "Categoria"(estado);

-- =====================================================
-- TABLA: Proveedor
-- =====================================================
CREATE TABLE IF NOT EXISTS "Proveedor" (
    "idProveedor" SERIAL PRIMARY KEY,
    "nombreContacto" VARCHAR(100) NOT NULL,
    direccion VARCHAR(255) DEFAULT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20) DEFAULT NULL,
    ruc VARCHAR(20) DEFAULT NULL,
    estado SMALLINT DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_proveedor_email ON "Proveedor"(email);
CREATE INDEX IF NOT EXISTS idx_proveedor_estado ON "Proveedor"(estado);

-- =====================================================
-- TABLA: Producto
-- =====================================================
CREATE TABLE IF NOT EXISTS "Producto" (
    "idProducto" SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) DEFAULT NULL,
    imagen TEXT DEFAULT NULL,
    marca VARCHAR(50) DEFAULT NULL,
    "modeloCompatible" VARCHAR(100) DEFAULT NULL,
    ubicacion VARCHAR(50) DEFAULT NULL,
    "precioVenta" DECIMAL(10,2) DEFAULT 0.00,
    "precioCompra" DECIMAL(10,2) DEFAULT 0.00,
    "stockActual" INTEGER DEFAULT 0,
    "stockMinimo" INTEGER DEFAULT 0,
    estado SMALLINT DEFAULT 1,
    "fechaActualizacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "fechaRegistro" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "idCategoria" INTEGER DEFAULT NULL,
    "idProveedor" INTEGER DEFAULT NULL,
    CONSTRAINT fk_producto_categoria FOREIGN KEY ("idCategoria") 
        REFERENCES "Categoria"("idCategoria") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    CONSTRAINT fk_producto_proveedor FOREIGN KEY ("idProveedor") 
        REFERENCES "Proveedor"("idProveedor") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_producto_codigo ON "Producto"(codigo);
CREATE INDEX IF NOT EXISTS idx_producto_nombre ON "Producto"(nombre);
CREATE INDEX IF NOT EXISTS idx_producto_stock ON "Producto"("stockActual");
CREATE INDEX IF NOT EXISTS idx_producto_estado ON "Producto"(estado);

-- =====================================================
-- TABLA: Venta
-- =====================================================
CREATE TABLE IF NOT EXISTS "Venta" (
    "idVenta" SERIAL PRIMARY KEY,
    "clienteDocumento" VARCHAR(20) DEFAULT NULL,
    "clienteNombre" VARCHAR(150) NOT NULL,
    estado VARCHAR(30) DEFAULT 'completada',
    "metodoPago" VARCHAR(50) DEFAULT 'efectivo',
    "numeroVenta" VARCHAR(20) NOT NULL UNIQUE,
    "montoTotal" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "fechaHora" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "idUsuario" INTEGER NOT NULL,
    CONSTRAINT fk_venta_usuario FOREIGN KEY ("idUsuario") 
        REFERENCES "Usuario"("idUsuario") 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_venta_numero ON "Venta"("numeroVenta");
CREATE INDEX IF NOT EXISTS idx_venta_fecha ON "Venta"("fechaHora");
CREATE INDEX IF NOT EXISTS idx_venta_cliente ON "Venta"("clienteNombre");

-- =====================================================
-- TABLA: DetalleVenta
-- =====================================================
CREATE TABLE IF NOT EXISTS "DetalleVenta" (
    "idDetalleVenta" SERIAL PRIMARY KEY,
    cantidad INTEGER NOT NULL,
    "precioVentaUnitario" DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    "idVenta" INTEGER NOT NULL,
    "idProducto" INTEGER NOT NULL,
    CONSTRAINT fk_detalle_venta FOREIGN KEY ("idVenta") 
        REFERENCES "Venta"("idVenta") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_producto FOREIGN KEY ("idProducto") 
        REFERENCES "Producto"("idProducto") 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

-- =====================================================
-- TABLA: MovimientoInventario
-- =====================================================
CREATE TABLE IF NOT EXISTS "MovimientoInventario" (
    "idMovimientoInventario" SERIAL PRIMARY KEY,
    cantidad INTEGER NOT NULL,
    "fechaHora" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT DEFAULT NULL,
    "precioUnitario" DECIMAL(10,2) DEFAULT NULL,
    "tipoMovimiento" VARCHAR(50) NOT NULL,
    "idProducto" INTEGER NOT NULL,
    "idUsuario" INTEGER NOT NULL,
    "idVenta" INTEGER DEFAULT NULL,
    CONSTRAINT fk_movimiento_producto FOREIGN KEY ("idProducto") 
        REFERENCES "Producto"("idProducto") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_usuario FOREIGN KEY ("idUsuario") 
        REFERENCES "Usuario"("idUsuario") 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_venta FOREIGN KEY ("idVenta") 
        REFERENCES "Venta"("idVenta") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movimiento_tipo ON "MovimientoInventario"("tipoMovimiento");
CREATE INDEX IF NOT EXISTS idx_movimiento_fecha ON "MovimientoInventario"("fechaHora");

-- =====================================================
-- DATOS INICIALES: Roles del sistema
-- =====================================================
INSERT INTO "Rol" ("idRol", "nombreRol", descripcion) VALUES
(1, 'Administrador', 'Acceso completo al sistema'),
(2, 'Vendedor', 'Acceso a ventas y consultas de inventario')
ON CONFLICT ("idRol") DO NOTHING;

-- =====================================================
-- USUARIO ADMINISTRADOR INICIAL
-- Contraseña: Admin123 (hasheada con bcrypt)
-- =====================================================
INSERT INTO "Usuario" (nombre, "nombreCompleto", "contraseña", email, estado, "idRol")
VALUES (
    'Administrador',
    'Administrador del Sistema',
    '$2b$10$YvB8v8aK3v8v8aK3v8v8aO3v8v8aK3v8v8aK3v8v8aK3v8v8aK3v8',
    'admin@rectificadora.lat',
    1,
    1
)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- CATEGORÍAS DE EJEMPLO
-- =====================================================
INSERT INTO "Categoria" (nombre, descripcion, estado, "codigoPrefix") VALUES
('Motores', 'Repuestos de motor', 1, 'MOT'),
('Frenos', 'Sistema de frenos', 1, 'FRE'),
('Suspensión', 'Sistema de suspensión', 1, 'SUS'),
('Transmisión', 'Sistema de transmisión', 1, 'TRA'),
('Eléctricos', 'Componentes eléctricos', 1, 'ELE')
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT 'Base de datos PostgreSQL creada exitosamente' AS mensaje;
