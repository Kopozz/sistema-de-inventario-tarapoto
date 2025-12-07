-- =====================================================
-- DATOS DE PRUEBA PARA POSTGRESQL/SUPABASE
-- Sistema de Inventario - Rectificadora de Repuestos
-- =====================================================
-- Ejecutar este script en Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PASO 1: Usuario Administrador
-- Email: admin@rectificadora.com | Password: admin123
-- =====================================================
INSERT INTO "Usuario" (nombre, "nombreCompleto", "contraseña", email, estado, "idRol")
VALUES (
    'Administrador',
    'Administrador del Sistema',
    '$2b$10$N9qo8uLOickgx2ZMRZoMy.Mrh5HVb0X9G8RtGhQv0PvKqVBfQ4Jvi',
    'admin@rectificadora.com',
    1,
    1
)
ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre;

-- Usuario vendedor de prueba
-- Email: vendedor@rectificadora.com | Password: vendedor123
INSERT INTO "Usuario" (nombre, "nombreCompleto", "contraseña", email, estado, "idRol")
VALUES (
    'Juan Vendedor',
    'Juan Carlos Perez',
    '$2b$10$N9qo8uLOickgx2ZMRZoMy.Mrh5HVb0X9G8RtGhQv0PvKqVBfQ4Jvi',
    'vendedor@rectificadora.com',
    1,
    2
)
ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre;

-- =====================================================
-- PASO 2: Actualizar Categorías con prefijos de código
-- =====================================================
UPDATE "Categoria" SET "codigoPrefix" = 'MOT' WHERE nombre = 'Motores';
UPDATE "Categoria" SET "codigoPrefix" = 'FRE' WHERE nombre = 'Frenos';
UPDATE "Categoria" SET "codigoPrefix" = 'SUS' WHERE nombre = 'Suspensión';
UPDATE "Categoria" SET "codigoPrefix" = 'TRA' WHERE nombre = 'Transmisión';
UPDATE "Categoria" SET "codigoPrefix" = 'ELE' WHERE nombre = 'Eléctricos';

-- Agregar más categorías si no existen
INSERT INTO "Categoria" (nombre, descripcion, estado, "codigoPrefix") VALUES
('Carrocería', 'Plásticos, carenados, espejos', 1, 'CAR')
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- PASO 3: Proveedores de Prueba
-- =====================================================
INSERT INTO "Proveedor" ("nombreContacto", email, telefono, direccion, ruc, estado) VALUES
('Repuestos Honda Peru', 'ventas@hondaperu.com', '01-4567890', 'Av. Industrial 456, Lima', '20123456789', 1),
('Yamaha Distribuidor', 'contacto@yamahadist.com', '01-9876543', 'Jr. Comercio 123, Lima', '20987654321', 1),
('Moto Parts SAC', 'info@motoparts.pe', '042-523456', 'Jr. Tarapoto 789, Tarapoto', '20456789123', 1)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- PASO 4: Productos de Prueba
-- =====================================================

-- Productos de MOTOR
INSERT INTO "Producto" (codigo, nombre, descripcion, marca, "modeloCompatible", ubicacion, "precioCompra", "precioVenta", "stockActual", "stockMinimo", "idCategoria", "idProveedor", estado) VALUES
('MOT-001', 'Piston STD 150cc', 'Piston estandar para motos 150cc', 'Honda', 'CG150/CBF150', 'A-1-01', 45.00, 75.00, 25, 5, 
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Motores' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'ventas@hondaperu.com' LIMIT 1), 1),
('MOT-002', 'Kit de Anillos 150cc', 'Juego de anillos para piston 150cc', 'Honda', 'CG150/CBF150', 'A-1-02', 18.00, 35.00, 40, 10,
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Motores' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'ventas@hondaperu.com' LIMIT 1), 1),
('MOT-003', 'Biela Completa 125cc', 'Biela con rodamientos para motor 125cc', 'Yamaha', 'YBR125/FZ16', 'A-1-03', 85.00, 145.00, 12, 3,
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Motores' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'contacto@yamahadist.com' LIMIT 1), 1),
('MOT-004', 'Juego de Valvulas', 'Par de valvulas admision y escape', 'Generico', 'Universal 150cc', 'A-1-04', 25.00, 50.00, 30, 8,
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Motores' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'info@motoparts.pe' LIMIT 1), 1),
('MOT-005', 'Junta de Culata', 'Empaque de culata motor 150cc', 'Honda', 'CG150', 'A-1-05', 8.00, 18.00, 50, 15,
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Motores' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'ventas@hondaperu.com' LIMIT 1), 1)
ON CONFLICT (codigo) DO NOTHING;

-- Productos de FRENOS
INSERT INTO "Producto" (codigo, nombre, descripcion, marca, "modeloCompatible", ubicacion, "precioCompra", "precioVenta", "stockActual", "stockMinimo", "idCategoria", "idProveedor", estado) VALUES
('FRE-001', 'Pastillas de Freno Delantero', 'Juego de pastillas disco delantero', 'Yamaha', 'FZ/Fazer', 'B-2-01', 22.00, 40.00, 35, 10,
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Frenos' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'contacto@yamahadist.com' LIMIT 1), 1),
('FRE-002', 'Pastillas de Freno Trasero', 'Juego de pastillas disco trasero', 'Yamaha', 'FZ/Fazer', 'B-2-02', 18.00, 32.00, 28, 8,
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Frenos' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'contacto@yamahadist.com' LIMIT 1), 1),
('FRE-003', 'Disco de Freno Delantero', 'Disco ventilado 240mm', 'Honda', 'CB190R', 'B-2-03', 65.00, 110.00, 8, 2,
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Frenos' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'ventas@hondaperu.com' LIMIT 1), 1),
('FRE-004', 'Zapatas de Freno', 'Juego de zapatas freno tambor', 'Generico', 'Universal', 'B-2-04', 12.00, 25.00, 45, 15,
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Frenos' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'info@motoparts.pe' LIMIT 1), 1)
ON CONFLICT (codigo) DO NOTHING;

-- Productos de TRANSMISION
INSERT INTO "Producto" (codigo, nombre, descripcion, marca, "modeloCompatible", ubicacion, "precioCompra", "precioVenta", "stockActual", "stockMinimo", "idCategoria", "idProveedor", estado) VALUES
('TRA-001', 'Kit de Arrastre Completo', 'Cadena + Piñon + Corona', 'DID', 'Honda CG150', 'C-3-01', 85.00, 150.00, 15, 4,
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Transmisión' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'ventas@hondaperu.com' LIMIT 1), 1),
('TRA-002', 'Cadena 428H x 120', 'Cadena reforzada 428 pasos', 'RK', 'Universal 150cc', 'C-3-02', 35.00, 65.00, 20, 5,
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Transmisión' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'info@motoparts.pe' LIMIT 1), 1),
('TRA-003', 'Piñon de Ataque 14T', 'Piñon 14 dientes paso 428', 'Generico', 'Universal', 'C-3-03', 12.00, 25.00, 40, 12,
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Transmisión' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'info@motoparts.pe' LIMIT 1), 1)
ON CONFLICT (codigo) DO NOTHING;

-- Productos de ELECTRICO
INSERT INTO "Producto" (codigo, nombre, descripcion, marca, "modeloCompatible", ubicacion, "precioCompra", "precioVenta", "stockActual", "stockMinimo", "idCategoria", "idProveedor", estado) VALUES
('ELE-001', 'Bujia NGK CR7HSA', 'Bujia de encendido original', 'NGK', 'Universal 4T', 'D-4-01', 8.00, 18.00, 100, 30,
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Eléctricos' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'info@motoparts.pe' LIMIT 1), 1),
('ELE-002', 'Regulador de Voltaje', 'Rectificador regulador 12V', 'Generico', 'Universal', 'D-4-02', 25.00, 50.00, 12, 3,
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Eléctricos' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'info@motoparts.pe' LIMIT 1), 1),
('ELE-003', 'Bobina de Encendido', 'Bobina de alta tension', 'Honda', 'CG/CB', 'D-4-03', 35.00, 65.00, 8, 2,
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Eléctricos' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'ventas@hondaperu.com' LIMIT 1), 1),
('ELE-004', 'Bateria 12V 5Ah', 'Bateria sellada libre mantenimiento', 'Yuasa', 'Universal', 'D-4-04', 55.00, 95.00, 10, 3,
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Eléctricos' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'contacto@yamahadist.com' LIMIT 1), 1)
ON CONFLICT (codigo) DO NOTHING;

-- Productos de SUSPENSION
INSERT INTO "Producto" (codigo, nombre, descripcion, marca, "modeloCompatible", ubicacion, "precioCompra", "precioVenta", "stockActual", "stockMinimo", "idCategoria", "idProveedor", estado) VALUES
('SUS-001', 'Amortiguador Trasero', 'Amortiguador trasero 320mm', 'Generico', 'Universal', 'E-5-01', 45.00, 85.00, 14, 4,
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Suspensión' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'info@motoparts.pe' LIMIT 1), 1),
('SUS-002', 'Rodamiento Direccion', 'Juego rodamientos de direccion', 'NTN', 'Universal', 'E-5-02', 18.00, 35.00, 25, 8,
    (SELECT "idCategoria" FROM "Categoria" WHERE nombre = 'Suspensión' LIMIT 1),
    (SELECT "idProveedor" FROM "Proveedor" WHERE email = 'info@motoparts.pe' LIMIT 1), 1)
ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- VERIFICACION
-- =====================================================
SELECT 'Usuarios:' AS tabla, COUNT(*) AS total FROM "Usuario";
SELECT 'Categorias:' AS tabla, COUNT(*) AS total FROM "Categoria";
SELECT 'Proveedores:' AS tabla, COUNT(*) AS total FROM "Proveedor";
SELECT 'Productos:' AS tabla, COUNT(*) AS total FROM "Producto";

SELECT '✅ DATOS DE PRUEBA INSERTADOS CORRECTAMENTE!' AS resultado;
