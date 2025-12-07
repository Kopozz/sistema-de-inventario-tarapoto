-- =====================================================
-- ESTRUCTURA POSTGRESQL CON NOMBRES EN MINÚSCULAS
-- Sistema de Inventario - Rectificadora de Repuestos
-- =====================================================
-- IMPORTANTE: Primero eliminar las tablas anteriores
-- =====================================================

-- Eliminar tablas existentes (en orden por dependencias)
DROP TABLE IF EXISTS movimientoinventario CASCADE;
DROP TABLE IF EXISTS detalleventa CASCADE;
DROP TABLE IF EXISTS venta CASCADE;
DROP TABLE IF EXISTS producto CASCADE;
DROP TABLE IF EXISTS proveedor CASCADE;
DROP TABLE IF EXISTS categoria CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS rol CASCADE;

-- También eliminar las versiones con comillas
DROP TABLE IF EXISTS "MovimientoInventario" CASCADE;
DROP TABLE IF EXISTS "DetalleVenta" CASCADE;
DROP TABLE IF EXISTS "Venta" CASCADE;
DROP TABLE IF EXISTS "Producto" CASCADE;
DROP TABLE IF EXISTS "Proveedor" CASCADE;
DROP TABLE IF EXISTS "Categoria" CASCADE;
DROP TABLE IF EXISTS "Usuario" CASCADE;
DROP TABLE IF EXISTS "Rol" CASCADE;

-- =====================================================
-- TABLA: rol
-- =====================================================
CREATE TABLE rol (
    idrol SERIAL PRIMARY KEY,
    nombrerol VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) DEFAULT NULL
);

-- =====================================================
-- TABLA: usuario
-- =====================================================
CREATE TABLE usuario (
    idusuario SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    nombrecompleto VARCHAR(150) DEFAULT NULL,
    contraseña VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20) DEFAULT NULL,
    fotoperfil TEXT DEFAULT NULL,
    direccion VARCHAR(200) DEFAULT NULL,
    fechanacimiento TIMESTAMP DEFAULT NULL,
    cargo VARCHAR(100) DEFAULT NULL,
    biografia TEXT DEFAULT NULL,
    estado SMALLINT DEFAULT 1,
    fechahoracreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fechafinsesion TIMESTAMP DEFAULT NULL,
    idrol INTEGER NOT NULL REFERENCES rol(idrol),
    resettoken VARCHAR(100) DEFAULT NULL,
    resettokenexpiry TIMESTAMP DEFAULT NULL
);

-- =====================================================
-- TABLA: categoria
-- =====================================================
CREATE TABLE categoria (
    idcategoria SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255) DEFAULT NULL,
    estado SMALLINT DEFAULT 1,
    codigoprefix VARCHAR(10) DEFAULT NULL
);

-- =====================================================
-- TABLA: proveedor
-- =====================================================
CREATE TABLE proveedor (
    idproveedor SERIAL PRIMARY KEY,
    nombrecontacto VARCHAR(100) NOT NULL,
    direccion VARCHAR(255) DEFAULT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20) DEFAULT NULL,
    ruc VARCHAR(20) DEFAULT NULL,
    estado SMALLINT DEFAULT 1
);

-- =====================================================
-- TABLA: producto
-- =====================================================
CREATE TABLE producto (
    idproducto SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) DEFAULT NULL,
    imagen TEXT DEFAULT NULL,
    marca VARCHAR(50) DEFAULT NULL,
    modelocompatible VARCHAR(100) DEFAULT NULL,
    ubicacion VARCHAR(50) DEFAULT NULL,
    precioventa DECIMAL(10,2) DEFAULT 0.00,
    preciocompra DECIMAL(10,2) DEFAULT 0.00,
    stockactual INTEGER DEFAULT 0,
    stockminimo INTEGER DEFAULT 0,
    estado SMALLINT DEFAULT 1,
    fechaactualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecharegistro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    idcategoria INTEGER REFERENCES categoria(idcategoria) ON DELETE SET NULL,
    idproveedor INTEGER REFERENCES proveedor(idproveedor) ON DELETE SET NULL
);

-- =====================================================
-- TABLA: venta
-- =====================================================
CREATE TABLE venta (
    idventa SERIAL PRIMARY KEY,
    clientedocumento VARCHAR(20) DEFAULT NULL,
    clientenombre VARCHAR(150) NOT NULL,
    estado VARCHAR(30) DEFAULT 'completada',
    metodopago VARCHAR(50) DEFAULT 'efectivo',
    numeroventa VARCHAR(20) NOT NULL UNIQUE,
    montototal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fechahora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    idusuario INTEGER NOT NULL REFERENCES usuario(idusuario),
    idcliente INTEGER DEFAULT NULL
);

-- =====================================================
-- TABLA: detalleventa
-- =====================================================
CREATE TABLE detalleventa (
    iddetalleventa SERIAL PRIMARY KEY,
    cantidad INTEGER NOT NULL,
    precioventaunitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    idventa INTEGER NOT NULL REFERENCES venta(idventa) ON DELETE CASCADE,
    idproducto INTEGER NOT NULL REFERENCES producto(idproducto)
);

-- =====================================================
-- TABLA: movimientoinventario
-- =====================================================
CREATE TABLE movimientoinventario (
    idmovimientoinventario SERIAL PRIMARY KEY,
    cantidad INTEGER NOT NULL,
    fechahora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT DEFAULT NULL,
    preciounitario DECIMAL(10,2) DEFAULT NULL,
    tipomovimiento VARCHAR(50) NOT NULL,
    idproducto INTEGER NOT NULL REFERENCES producto(idproducto) ON DELETE CASCADE,
    idusuario INTEGER NOT NULL REFERENCES usuario(idusuario),
    idventa INTEGER REFERENCES venta(idventa) ON DELETE SET NULL
);

-- =====================================================
-- DATOS INICIALES: Roles
-- =====================================================
INSERT INTO rol (idrol, nombrerol, descripcion) VALUES
(1, 'Administrador', 'Acceso completo al sistema'),
(2, 'Vendedor', 'Acceso a ventas y consultas de inventario');

-- =====================================================
-- USUARIO ADMIN: admin@rectificadora.com / admin123
-- =====================================================
INSERT INTO usuario (nombre, nombrecompleto, contraseña, email, estado, idrol)
VALUES (
    'Administrador',
    'Administrador del Sistema',
    '$2b$10$w9LpIw6WXgeISNY4cLJOcOUaYbZ5qV0D72g1L53ASlHaNWsFx5zSW',
    'admin@rectificadora.com',
    1,
    1
);

-- =====================================================
-- CATEGORÍAS
-- =====================================================
INSERT INTO categoria (nombre, descripcion, estado, codigoprefix) VALUES
('Motores', 'Repuestos de motor', 1, 'MOT'),
('Frenos', 'Sistema de frenos', 1, 'FRE'),
('Suspensión', 'Sistema de suspensión', 1, 'SUS'),
('Transmisión', 'Sistema de transmisión', 1, 'TRA'),
('Eléctricos', 'Componentes eléctricos', 1, 'ELE');

-- =====================================================
-- PROVEEDORES
-- =====================================================
INSERT INTO proveedor (nombrecontacto, email, telefono, direccion, ruc, estado) VALUES
('Repuestos Honda Peru', 'ventas@hondaperu.com', '01-4567890', 'Av. Industrial 456, Lima', '20123456789', 1),
('Yamaha Distribuidor', 'contacto@yamahadist.com', '01-9876543', 'Jr. Comercio 123, Lima', '20987654321', 1),
('Moto Parts SAC', 'info@motoparts.pe', '042-523456', 'Jr. Tarapoto 789', '20456789123', 1);

-- =====================================================
-- PRODUCTOS
-- =====================================================
INSERT INTO producto (codigo, nombre, descripcion, marca, modelocompatible, ubicacion, preciocompra, precioventa, stockactual, stockminimo, idcategoria, idproveedor, estado) VALUES
('MOT-001', 'Piston STD 150cc', 'Piston estandar para motos 150cc', 'Honda', 'CG150/CBF150', 'A-1-01', 45.00, 75.00, 25, 5, 1, 1, 1),
('MOT-002', 'Kit de Anillos 150cc', 'Juego de anillos para piston 150cc', 'Honda', 'CG150/CBF150', 'A-1-02', 18.00, 35.00, 40, 10, 1, 1, 1),
('MOT-003', 'Biela Completa 125cc', 'Biela con rodamientos para motor 125cc', 'Yamaha', 'YBR125/FZ16', 'A-1-03', 85.00, 145.00, 12, 3, 1, 2, 1),
('FRE-001', 'Pastillas de Freno Delantero', 'Juego de pastillas disco delantero', 'Yamaha', 'FZ/Fazer', 'B-2-01', 22.00, 40.00, 35, 10, 2, 2, 1),
('FRE-002', 'Pastillas de Freno Trasero', 'Juego de pastillas disco trasero', 'Yamaha', 'FZ/Fazer', 'B-2-02', 18.00, 32.00, 28, 8, 2, 2, 1),
('FRE-003', 'Disco de Freno Delantero', 'Disco ventilado 240mm', 'Honda', 'CB190R', 'B-2-03', 65.00, 110.00, 8, 2, 2, 1, 1),
('TRA-001', 'Kit de Arrastre Completo', 'Cadena + Piñon + Corona', 'DID', 'Honda CG150', 'C-3-01', 85.00, 150.00, 15, 4, 4, 1, 1),
('TRA-002', 'Cadena 428H x 120', 'Cadena reforzada 428 pasos', 'RK', 'Universal 150cc', 'C-3-02', 35.00, 65.00, 20, 5, 4, 3, 1),
('ELE-001', 'Bujia NGK CR7HSA', 'Bujia de encendido original', 'NGK', 'Universal 4T', 'D-4-01', 8.00, 18.00, 100, 30, 5, 3, 1),
('ELE-002', 'Regulador de Voltaje', 'Rectificador regulador 12V', 'Generico', 'Universal', 'D-4-02', 25.00, 50.00, 12, 3, 5, 3, 1),
('ELE-003', 'Bateria 12V 5Ah', 'Bateria sellada libre mantenimiento', 'Yuasa', 'Universal', 'D-4-03', 55.00, 95.00, 10, 3, 5, 2, 1),
('SUS-001', 'Amortiguador Trasero', 'Amortiguador trasero 320mm', 'Generico', 'Universal', 'E-5-01', 45.00, 85.00, 14, 4, 3, 3, 1),
('SUS-002', 'Rodamiento Direccion', 'Juego rodamientos de direccion', 'NTN', 'Universal', 'E-5-02', 18.00, 35.00, 25, 8, 3, 3, 1);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT 'Estructura creada correctamente' AS resultado;
SELECT 'Usuarios: ' || COUNT(*) FROM usuario;
SELECT 'Categorias: ' || COUNT(*) FROM categoria;
SELECT 'Proveedores: ' || COUNT(*) FROM proveedor;
SELECT 'Productos: ' || COUNT(*) FROM producto;
