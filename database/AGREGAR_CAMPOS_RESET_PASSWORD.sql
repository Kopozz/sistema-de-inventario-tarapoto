-- Agregar campos para recuperación de contraseña
-- Sistema de Inventario - Rectificación de Repuestos

USE db_rectificadoraderepuesto;

-- Agregar campos para token de recuperación
ALTER TABLE Usuario 
ADD COLUMN resetToken VARCHAR(100) NULL,
ADD COLUMN resetTokenExpiry DATETIME NULL;

-- Verificar que se agregaron correctamente
DESCRIBE Usuario;

-- Consulta para verificar
SELECT 'Campos de recuperación agregados correctamente' AS Mensaje;
