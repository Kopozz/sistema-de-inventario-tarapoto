-- =====================================================
-- DATOS DE PRUEBA: Categorías y Productos con Imágenes
-- Sistema de Inventario - Rectificadora de Repuestos
-- =====================================================
-- Ejecutar este script en phpMyAdmin
-- =====================================================

USE db_rectificadoraderepuesto;

-- =====================================================
-- PASO 1: Agregar columna imagen a Producto
-- =====================================================
ALTER TABLE Producto ADD COLUMN IF NOT EXISTS imagen MEDIUMTEXT DEFAULT NULL AFTER descripcion;

-- =====================================================
-- PASO 2: Limpiar datos de prueba anteriores (opcional)
-- =====================================================
-- Descomenta estas líneas si quieres empezar desde cero
-- DELETE FROM DetalleVenta;
-- DELETE FROM MovimientoInventario;
-- DELETE FROM Venta;
-- DELETE FROM Producto;
-- DELETE FROM Categoria WHERE idCategoria > 0;
-- DELETE FROM Proveedor WHERE idProveedor > 0;

-- =====================================================
-- PASO 3: Insertar Categorías de Repuestos de Motos
-- =====================================================
INSERT INTO Categoria (nombre, descripcion, estado) VALUES
('Motor', 'Repuestos relacionados con el motor: pistones, anillos, bielas, valvulas', 1),
('Frenos', 'Sistema de frenado: pastillas, discos, zapatas, cables', 1),
('Transmision', 'Cadenas, piñones, coronas, kit de arrastre', 1),
('Electrico', 'Sistema electrico: bujias, bobinas, reguladores, baterias', 1),
('Suspension', 'Amortiguadores, horquillas, rodamientos, resortes', 1),
('Carroceria', 'Plasticos, carenados, espejos, manubrios', 1)
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

-- =====================================================
-- PASO 4: Insertar Proveedores de Prueba
-- =====================================================
INSERT INTO Proveedor (nombreContacto, email, telefono, direccion, ruc, estado) VALUES
('Repuestos Honda Peru', 'ventas@hondaperu.com', '01-4567890', 'Av. Industrial 456, Lima', '20123456789', 1),
('Yamaha Distribuidor', 'contacto@yamahadist.com', '01-9876543', 'Jr. Comercio 123, Lima', '20987654321', 1),
('Moto Parts SAC', 'info@motoparts.pe', '042-523456', 'Jr. Tarapoto 789', '20456789123', 1)
ON DUPLICATE KEY UPDATE nombreContacto = VALUES(nombreContacto);

-- =====================================================
-- PASO 5: Insertar Productos de Prueba
-- =====================================================

-- Obtener IDs de categorías
SET @cat_motor = (SELECT idCategoria FROM Categoria WHERE nombre = 'Motor' LIMIT 1);
SET @cat_frenos = (SELECT idCategoria FROM Categoria WHERE nombre = 'Frenos' LIMIT 1);
SET @cat_transmision = (SELECT idCategoria FROM Categoria WHERE nombre = 'Transmision' LIMIT 1);
SET @cat_electrico = (SELECT idCategoria FROM Categoria WHERE nombre = 'Electrico' LIMIT 1);
SET @cat_suspension = (SELECT idCategoria FROM Categoria WHERE nombre = 'Suspension' LIMIT 1);
SET @cat_carroceria = (SELECT idCategoria FROM Categoria WHERE nombre = 'Carroceria' LIMIT 1);

-- Obtener ID de proveedor
SET @prov1 = (SELECT idProveedor FROM Proveedor WHERE email = 'ventas@hondaperu.com' LIMIT 1);
SET @prov2 = (SELECT idProveedor FROM Proveedor WHERE email = 'contacto@yamahadist.com' LIMIT 1);
SET @prov3 = (SELECT idProveedor FROM Proveedor WHERE email = 'info@motoparts.pe' LIMIT 1);

-- Productos de MOTOR
INSERT INTO Producto (codigo, nombre, descripcion, marca, modeloCompatible, ubicacion, precioCompra, precioVenta, stockActual, stockMinimo, idCategoria, idProveedor, estado) VALUES
('MOT-001', 'Piston STD 150cc', 'Piston estandar para motos 150cc', 'Honda', 'CG150/CBF150', 'A-1-01', 45.00, 75.00, 25, 5, @cat_motor, @prov1, 1),
('MOT-002', 'Kit de Anillos 150cc', 'Juego de anillos para piston 150cc', 'Honda', 'CG150/CBF150', 'A-1-02', 18.00, 35.00, 40, 10, @cat_motor, @prov1, 1),
('MOT-003', 'Biela Completa 125cc', 'Biela con rodamientos para motor 125cc', 'Yamaha', 'YBR125/FZ16', 'A-1-03', 85.00, 145.00, 12, 3, @cat_motor, @prov2, 1),
('MOT-004', 'Juego de Valvulas', 'Par de valvulas admision y escape', 'Generico', 'Universal 150cc', 'A-1-04', 25.00, 50.00, 30, 8, @cat_motor, @prov3, 1),
('MOT-005', 'Junta de Culata', 'Empaque de culata motor 150cc', 'Honda', 'CG150', 'A-1-05', 8.00, 18.00, 50, 15, @cat_motor, @prov1, 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Productos de FRENOS
INSERT INTO Producto (codigo, nombre, descripcion, marca, modeloCompatible, ubicacion, precioCompra, precioVenta, stockActual, stockMinimo, idCategoria, idProveedor, estado) VALUES
('FRE-001', 'Pastillas de Freno Delantero', 'Juego de pastillas disco delantero', 'Yamaha', 'FZ/Fazer', 'B-2-01', 22.00, 40.00, 35, 10, @cat_frenos, @prov2, 1),
('FRE-002', 'Pastillas de Freno Trasero', 'Juego de pastillas disco trasero', 'Yamaha', 'FZ/Fazer', 'B-2-02', 18.00, 32.00, 28, 8, @cat_frenos, @prov2, 1),
('FRE-003', 'Disco de Freno Delantero', 'Disco ventilado 240mm', 'Honda', 'CB190R', 'B-2-03', 65.00, 110.00, 8, 2, @cat_frenos, @prov1, 1),
('FRE-004', 'Zapatas de Freno', 'Juego de zapatas freno tambor', 'Generico', 'Universal', 'B-2-04', 12.00, 25.00, 45, 15, @cat_frenos, @prov3, 1),
('FRE-005', 'Cable de Freno Trasero', 'Cable con funda freno trasero', 'Generico', 'Universal', 'B-2-05', 8.00, 15.00, 60, 20, @cat_frenos, @prov3, 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Productos de TRANSMISION
INSERT INTO Producto (codigo, nombre, descripcion, marca, modeloCompatible, ubicacion, precioCompra, precioVenta, stockActual, stockMinimo, idCategoria, idProveedor, estado) VALUES
('TRA-001', 'Kit de Arrastre Completo', 'Cadena + Piñon + Corona', 'DID', 'Honda CG150', 'C-3-01', 85.00, 150.00, 15, 4, @cat_transmision, @prov1, 1),
('TRA-002', 'Cadena 428H x 120', 'Cadena reforzada 428 pasos', 'RK', 'Universal 150cc', 'C-3-02', 35.00, 65.00, 20, 5, @cat_transmision, @prov3, 1),
('TRA-003', 'Piñon de Ataque 14T', 'Piñon 14 dientes paso 428', 'Generico', 'Universal', 'C-3-03', 12.00, 25.00, 40, 12, @cat_transmision, @prov3, 1),
('TRA-004', 'Corona 42T', 'Corona 42 dientes paso 428', 'Sunstar', 'Honda/Yamaha', 'C-3-04', 28.00, 55.00, 18, 5, @cat_transmision, @prov3, 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Productos de ELECTRICO
INSERT INTO Producto (codigo, nombre, descripcion, marca, modeloCompatible, ubicacion, precioCompra, precioVenta, stockActual, stockMinimo, idCategoria, idProveedor, estado) VALUES
('ELE-001', 'Bujia NGK CR7HSA', 'Bujia de encendido original', 'NGK', 'Universal 4T', 'D-4-01', 8.00, 18.00, 100, 30, @cat_electrico, @prov3, 1),
('ELE-002', 'Regulador de Voltaje', 'Rectificador regulador 12V', 'Generico', 'Universal', 'D-4-02', 25.00, 50.00, 12, 3, @cat_electrico, @prov3, 1),
('ELE-003', 'Bobina de Encendido', 'Bobina de alta tension', 'Honda', 'CG/CB', 'D-4-03', 35.00, 65.00, 8, 2, @cat_electrico, @prov1, 1),
('ELE-004', 'Bateria 12V 5Ah', 'Bateria sellada libre mantenimiento', 'Yuasa', 'Universal', 'D-4-04', 55.00, 95.00, 10, 3, @cat_electrico, @prov2, 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Productos de SUSPENSION
INSERT INTO Producto (codigo, nombre, descripcion, marca, modeloCompatible, ubicacion, precioCompra, precioVenta, stockActual, stockMinimo, idCategoria, idProveedor, estado) VALUES
('SUS-001', 'Amortiguador Trasero', 'Amortiguador trasero 320mm', 'Generico', 'Universal', 'E-5-01', 45.00, 85.00, 14, 4, @cat_suspension, @prov3, 1),
('SUS-002', 'Rodamiento Direccion', 'Juego rodamientos de direccion', 'NTN', 'Universal', 'E-5-02', 18.00, 35.00, 25, 8, @cat_suspension, @prov3, 1),
('SUS-003', 'Resorte Amortiguador', 'Resorte helicoidal trasero', 'Generico', 'Universal', 'E-5-03', 15.00, 28.00, 20, 6, @cat_suspension, @prov3, 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- =====================================================
-- VERIFICACION
-- =====================================================
SELECT 'Categorias insertadas:' AS Info, COUNT(*) AS Total FROM Categoria WHERE estado = 1;
SELECT 'Productos insertados:' AS Info, COUNT(*) AS Total FROM Producto WHERE estado = 1;
SELECT 'Proveedores insertados:' AS Info, COUNT(*) AS Total FROM Proveedor WHERE estado = 1;

-- Mostrar productos por categoria
SELECT c.nombre AS Categoria, COUNT(p.idProducto) AS Productos
FROM Categoria c
LEFT JOIN Producto p ON c.idCategoria = p.idCategoria AND p.estado = 1
WHERE c.estado = 1
GROUP BY c.idCategoria, c.nombre
ORDER BY c.nombre;

SELECT '✅ Datos de prueba insertados correctamente!' AS Resultado;
