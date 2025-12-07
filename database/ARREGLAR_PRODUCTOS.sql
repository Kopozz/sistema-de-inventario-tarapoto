USE db_rectificadoraderepuesto;

-- Actualizar todos los productos para que tengan estado = 1
UPDATE Producto SET estado = 1 WHERE estado IS NULL OR estado = 0;

-- Verificar los productos
SELECT idProducto, codigo, nombre, precioVenta, stockActual, estado FROM Producto;
