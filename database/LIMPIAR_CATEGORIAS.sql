-- =====================================================
-- LIMPIEZA SEGURA DE CATEGORÍAS
-- =====================================================

USE db_rectificadoraderepuesto;

-- Desactivar verificación de FK temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- VER ESTADO ACTUAL
-- =====================================================
SELECT idCategoria, nombre FROM Categoria ORDER BY nombre;

-- =====================================================
-- PASO 1: Crear las 6 categorías definitivas (si no existen)
-- =====================================================

-- Primero, asegurar que existan las 6 principales
INSERT IGNORE INTO Categoria (nombre, descripcion, estado) VALUES
('Motor', 'Repuestos de motor: pistones, anillos, bielas, valvulas', 1),
('Frenos', 'Sistema de frenado: pastillas, discos, zapatas, cables', 1),
('Transmision', 'Cadenas, piñones, coronas, kit de arrastre', 1),
('Electrico', 'Bujias, bobinas, reguladores, baterias', 1),
('Suspension', 'Amortiguadores, horquillas, rodamientos, resortes', 1),
('Carroceria', 'Plasticos, carenados, espejos, manubrios', 1);

-- =====================================================
-- PASO 2: Obtener IDs de las categorías principales
-- =====================================================
SET @id_motor = (SELECT MIN(idCategoria) FROM Categoria WHERE LOWER(nombre) = 'motor');
SET @id_frenos = (SELECT MIN(idCategoria) FROM Categoria WHERE LOWER(nombre) = 'frenos');
SET @id_transmision = (SELECT MIN(idCategoria) FROM Categoria WHERE LOWER(nombre) = 'transmision');
SET @id_electrico = (SELECT MIN(idCategoria) FROM Categoria WHERE LOWER(nombre) = 'electrico');
SET @id_suspension = (SELECT MIN(idCategoria) FROM Categoria WHERE LOWER(nombre) = 'suspension');
SET @id_carroceria = (SELECT MIN(idCategoria) FROM Categoria WHERE LOWER(nombre) = 'carroceria');

-- =====================================================
-- PASO 3: Reasignar productos por código de producto
-- =====================================================

-- MOT-* -> Motor
UPDATE Producto SET idCategoria = @id_motor WHERE codigo LIKE 'MOT-%';

-- FRE-* -> Frenos  
UPDATE Producto SET idCategoria = @id_frenos WHERE codigo LIKE 'FRE-%';

-- TRA-* -> Transmision
UPDATE Producto SET idCategoria = @id_transmision WHERE codigo LIKE 'TRA-%';

-- ELE-* -> Electrico
UPDATE Producto SET idCategoria = @id_electrico WHERE codigo LIKE 'ELE-%';

-- SUS-* -> Suspension
UPDATE Producto SET idCategoria = @id_suspension WHERE codigo LIKE 'SUS-%';

-- CAR-* -> Carroceria
UPDATE Producto SET idCategoria = @id_carroceria WHERE codigo LIKE 'CAR-%';

-- ROD-* -> Suspension (rodamientos van en suspension)
UPDATE Producto SET idCategoria = @id_suspension WHERE codigo LIKE 'ROD-%';

-- REF-* -> Motor (refrigeracion del motor)
UPDATE Producto SET idCategoria = @id_motor WHERE codigo LIKE 'REF-%';

-- =====================================================
-- PASO 4: Eliminar categorías duplicadas y no deseadas
-- =====================================================

-- Eliminar ROCA
DELETE FROM Categoria WHERE LOWER(nombre) LIKE '%roca%';

-- Eliminar duplicados de Motor (solo mantener @id_motor)
DELETE FROM Categoria WHERE LOWER(nombre) = 'motor' AND idCategoria != @id_motor;

-- Eliminar duplicados de Frenos
DELETE FROM Categoria WHERE LOWER(nombre) = 'frenos' AND idCategoria != @id_frenos;

-- Eliminar duplicados de Suspension
DELETE FROM Categoria WHERE LOWER(nombre) = 'suspension' AND idCategoria != @id_suspension;

-- Eliminar categorías mal escritas o redundantes
DELETE FROM Categoria WHERE LOWER(nombre) = 'trasmision';
DELETE FROM Categoria WHERE LOWER(nombre) = 'sistema electrico';
DELETE FROM Categoria WHERE LOWER(nombre) = 'carroceria y accesorios';
DELETE FROM Categoria WHERE LOWER(nombre) = 'refrigeracion';
DELETE FROM Categoria WHERE LOWER(nombre) = 'rodamientos';

-- Reactivar FK
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
SELECT '--- CATEGORÍAS LIMPIAS ---' AS Resultado;
SELECT idCategoria, nombre, descripcion FROM Categoria WHERE estado = 1 ORDER BY nombre;

SELECT '--- PRODUCTOS POR CATEGORÍA ---' AS Resultado;
SELECT c.nombre AS Categoria, COUNT(p.idProducto) AS Productos
FROM Categoria c
LEFT JOIN Producto p ON c.idCategoria = p.idCategoria AND p.estado = 1
WHERE c.estado = 1
GROUP BY c.idCategoria, c.nombre
ORDER BY Productos DESC;
