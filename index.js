import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { pool } from './db.js'; // Importa tu conexión a la BD
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import { enviarEmailRecuperacion, enviarEmailConfirmacionCambio } from './emailService.js';
import { setupSwagger } from './swagger.js';

// Nota: Los servicios adicionales (Redis, Cron, Storage) fueron deshabilitados temporalmente
// Para habilitar: descomentar las líneas de abajo
// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);
// const cacheService = require('./services/cacheService.js');
// const storageService = require('./services/storageService.js');
// const cronService = require('./services/cronService.js');
// const reportService = require('./services/reportService.js');

// Cargar variables de entorno
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'inventarioSecretKey2025';
const PORT = process.env.PORT || 3000;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

// 1. Inicializa el servidor
const app = express();

// Documentación API
setupSwagger(app);

// Configuración de paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== MIDDLEWARES DE SEGURIDAD =====
// Helmet - Protege con headers HTTP seguros
app.use(helmet({
  contentSecurityPolicy: false, // Desactivar solo si usas inline scripts
  crossOriginEmbedderPolicy: false
}));

// CORS configurado: Permitir cualquier origen en desarrollo para evitar bloqueos
app.use(cors({
  origin: true, // Refleja el origen de la petición automáticamente
  credentials: true,
  optionsSuccessStatus: 200
}));

// Parsear JSON con límite aumentado para imágenes base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Servir archivos estáticos del frontend construido
app.use(express.static(path.join(__dirname, 'frontend-react', 'dist')));

// NOTA: La ruta catch-all para SPA se define al final del archivo (después de las rutas API)

// 2. ENDPOINTS / RUTAS DE API

// ===== RATE LIMITERS =====
// Rate limiter para login (proteger contra fuerza bruta)
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5, // máximo 5 intentos
  message: { message: 'Demasiados intentos de inicio de sesión. Por favor, intenta nuevamente en 15 minutos.' },
  standardHeaders: true, // Retorna info de rate limit en headers `RateLimit-*`
  legacyHeaders: false, // Desactiva headers `X-RateLimit-*`
  handler: (req, res) => {
    res.status(429).json({
      message: 'Demasiados intentos de inicio de sesión desde esta IP. Por favor, intenta nuevamente más tarde.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiter general para APIs (opcional)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: { message: 'Demasiadas solicitudes desde esta IP.' }
});

// Middleware para verificar JWT
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token no proporcionado' });
  jwt.verify(token, JWT_SECRET, (err, usuario) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.usuario = usuario;
    next();
  });
}

// ===== RUTA DE PRUEBA =====
app.get('/ping', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1 + 1 AS solution');
    res.json(result[0]); // Debería devolver: { "solution": 2 }
  } catch (error) {
    res.status(500).json({ message: 'Error al conectar a la BD' });
  }
});

// ===== ENDPOINTS CRUD DE CATEGORÍAS =====

// ===== ENDPOINT: CREAR CATEGORÍA =====
app.post('/api/categorias', verificarToken, async (req, res) => {
  try {
    let { nombre, descripcion, estado } = req.body;
    nombre = quitarTildes((nombre || '').trim());
    descripcion = quitarTildes((descripcion || '').trim());

    console.log('📥 Solicitud para crear categoría:', { nombre, descripcion, estado });

    // Validar campos
    if (!nombre) {
      return res.status(400).json({
        message: 'El nombre es obligatorio.'
      });
    }

    // El estado por defecto es 1 (activo) si no se envía
    const estadoCategoria = estado !== undefined ? estado : 1;

    // Validación de duplicados en categorías por nombre (solo activas)
    const [existeCategoria] = await pool.query('SELECT 1 FROM Categoria WHERE nombre = ? AND estado = 1', [nombre]);
    if (existeCategoria.length > 0) {
      return res.status(409).json({ message: 'Ya existe una categoría activa con ese nombre.' });
    }

    // Insertar la nueva categoría
    const [resultado] = await pool.query(
      'INSERT INTO Categoria (nombre, descripcion, estado) VALUES (?, ?, ?)',
      [nombre, descripcion || null, estadoCategoria]
    );

    console.log('✅ Categoría creada exitosamente:', resultado.insertId);

    res.status(201).json({
      message: 'Categoría creada exitosamente',
      idCategoria: resultado.insertId,
      nombre,
      descripcion,
      estado: estadoCategoria
    });
  } catch (error) {
    console.error('❌ Error al crear categoría:', error);
    res.status(500).json({
      message: 'Error al crear categoría',
      error: error.message
    });
  }
});

// ===== ENDPOINT: LISTAR CATEGORÍAS =====
app.get('/api/categorias', verificarToken, async (req, res) => {
  try {
  // Traer categorias con conteo de productos y prefijo de código
  const [categorias] = await pool.query(`
    SELECT c.idcategoria, c.nombre, c.descripcion, c.estado, c.codigoprefix,
           COUNT(p.idproducto) AS totalproductos,
           STRING_AGG(p.nombre, E'\n' ORDER BY p.nombre) AS productos
    FROM categoria c
    LEFT JOIN producto p ON p.idcategoria = c.idcategoria
    GROUP BY c.idcategoria
    ORDER BY c.idcategoria
  `);
    res.status(200).json({
      categorias
    });
  } catch (error) {
    console.error('Error al listar categorías:', error);
    res.status(500).json({
      message: 'Error al obtener categorías',
      error: error.message
    });
  }
});

// ===== ENDPOINT: LISTAR CATEGORÍA POR ID =====
app.get('/api/categorias/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
  const [categorias] = await pool.query(`
    SELECT c.idcategoria, c.nombre, c.descripcion, c.estado,
           COUNT(p.idproducto) AS totalproductos,
           STRING_AGG(p.nombre, E'\n' ORDER BY p.nombre) AS productos
    FROM categoria c
    LEFT JOIN producto p ON p.idcategoria = c.idcategoria
    WHERE c.idcategoria = ?
    GROUP BY c.idcategoria
  `, [id]);
    if (categorias.length === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    res.status(200).json({ categoria: categorias[0] });
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({ message: 'Error al obtener categoría', error: error.message });
  }
});

// ===== ENDPOINT: EDITAR CATEGORÍA =====
app.put('/api/categorias/:id', verificarToken, async (req, res) => {
  try {
  const { id } = req.params;
  const { nombre, descripcion, estado } = req.body;

    // Validar campos
    if (!nombre && !descripcion && estado === undefined) {
      return res.status(400).json({ message: 'Debe enviar al menos un campo para actualizar.' });
    }

    // Construir consulta dinámica
    let query = 'UPDATE Categoria SET ';
    const params = [];
    if (nombre) {
      query += 'nombre = ?';
      params.push(nombre);
    }
    if (descripcion) {
      if (params.length > 0) query += ', ';
      query += 'descripcion = ?';
      params.push(descripcion);
    }
    if (estado !== undefined) {
      if (params.length > 0) query += ', ';
      query += 'estado = ?';
      params.push(estado);
    }
    query += ' WHERE idCategoria = ?';
    params.push(id);

    const [resultado] = await pool.query(query, params);
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    res.status(200).json({ message: 'Categoría actualizada exitosamente' });
  } catch (error) {
    console.error('Error al editar categoría:', error);
    res.status(500).json({ message: 'Error al editar categoría', error: error.message });
  }
});

// ===== ENDPOINT: ELIMINAR CATEGORÍA =====
app.delete('/api/categorias/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si la categoría existe
    const [categoria] = await pool.query('SELECT * FROM Categoria WHERE idCategoria = ?', [id]);
    if (categoria.length === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    
    // Verificar si tiene productos asociados (solo activos)
    const [productos] = await pool.query('SELECT COUNT(*) as total FROM Producto WHERE idCategoria = ? AND estado = 1', [id]);
    if (productos[0].total > 0) {
      return res.status(409).json({ 
        message: 'No se puede eliminar la categoría porque tiene productos asociados',
        detalles: `Hay ${productos[0].total} producto(s) utilizando esta categoría`
      });
    }
    
    // Si no tiene productos, proceder con eliminación lógica
    const [resultado] = await pool.query('UPDATE Categoria SET estado = 0 WHERE idCategoria = ?', [id]);
    res.status(200).json({ message: 'Categoría marcada como inactiva (eliminación lógica)' });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ message: 'Error al eliminar categoría', error: error.message });
  }
});

// ===== ENDPOINTS CRUD DE PROVEEDORES =====

// Listar todos los proveedores
app.get('/api/proveedores', verificarToken, async (req, res) => {
  try {
  // El frontend espera: idProveedor, nombre, email, telefono, direccion
  const [proveedores] = await pool.query('SELECT idProveedor, nombreContacto AS nombre, email, telefono, direccion FROM Proveedor WHERE estado = 1');
  res.status(200).json({ proveedores });
  } catch (error) {
    console.error('Error al listar proveedores:', error);
    res.status(500).json({ message: 'Error al obtener proveedores', error: error.message });
  }
});

// Listar proveedor por ID
app.get('/api/proveedores/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [proveedores] = await pool.query('SELECT idProveedor, nombreContacto AS nombre, email, telefono, direccion FROM Proveedor WHERE idProveedor = ?', [id]);
    if (proveedores.length === 0) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    res.status(200).json({ proveedor: proveedores[0] });
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({ message: 'Error al obtener proveedor', error: error.message });
  }
});

// Crear proveedor
// Función para eliminar tildes
function quitarTildes(str) {
  if (!str) return str;
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

app.post('/api/proveedores', verificarToken, async (req, res) => {
  try {
    let { nombre, email, telefono, direccion } = req.body;
    nombre = quitarTildes(nombre);
    direccion = quitarTildes(direccion);
    if (!nombre || !email) {
      return res.status(400).json({ message: 'Todos los campos obligatorios: nombre, email' });
    }

    // Validación de duplicados en proveedores (solo activos)
    const [existeProveedor] = await pool.query('SELECT * FROM Proveedor WHERE email = ? AND estado = 1', [email]);
    if (existeProveedor.length > 0) {
      return res.status(409).json({ message: 'Ya existe un proveedor con ese email.' });
    }

    const [resultado] = await pool.query(
      'INSERT INTO Proveedor (nombreContacto, email, telefono, direccion, estado) VALUES (?, ?, ?, ?, 1)',
      [nombre, email, telefono, direccion]
    );
    res.status(201).json({
      message: 'Proveedor creado exitosamente',
      idProveedor: resultado.insertId,
      nombre,
      email,
      telefono,
      direccion
    });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ message: 'Error al crear proveedor', error: error.message });
  }
});

// Editar proveedor
app.put('/api/proveedores/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    let { nombre, email, telefono, direccion } = req.body;
    nombre = quitarTildes(nombre);
    direccion = quitarTildes(direccion);
    if (!nombre && !email && !telefono && !direccion) {
      return res.status(400).json({ message: 'Debe enviar al menos un campo para actualizar.' });
    }
    let query = 'UPDATE Proveedor SET ';
    const params = [];
    if (nombre) {
      query += 'nombreContacto = ?';
      params.push(nombre);
    }
    if (email) {
      if (params.length > 0) query += ', ';
      query += 'email = ?';
      params.push(email);
    }
    if (telefono) {
      if (params.length > 0) query += ', ';
      query += 'telefono = ?';
      params.push(telefono);
    }
    if (direccion) {
      if (params.length > 0) query += ', ';
      query += 'direccion = ?';
      params.push(direccion);
    }
    query += ' WHERE idProveedor = ?';
    params.push(id);
    const [resultado] = await pool.query(query, params);
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    res.status(200).json({ message: 'Proveedor actualizado exitosamente' });
  } catch (error) {
    console.error('Error al editar proveedor:', error);
    res.status(500).json({ message: 'Error al editar proveedor', error: error.message });
  }
});

// Eliminar proveedor
app.delete('/api/proveedores/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el proveedor existe
    const [proveedor] = await pool.query('SELECT * FROM Proveedor WHERE idProveedor = ?', [id]);
    if (proveedor.length === 0) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    
    // Verificar si tiene productos asociados (solo activos)
    const [productos] = await pool.query('SELECT COUNT(*) as total FROM Producto WHERE idProveedor = ? AND estado = 1', [id]);
    if (productos[0].total > 0) {
      return res.status(409).json({ 
        message: 'No se puede eliminar el proveedor porque tiene productos asociados',
        detalles: `Hay ${productos[0].total} producto(s) de este proveedor`
      });
    }
    
    // Si no tiene productos, proceder con eliminación lógica
    const [resultado] = await pool.query('UPDATE Proveedor SET estado = 0 WHERE idProveedor = ?', [id]);
    res.status(200).json({ message: 'Proveedor marcado como inactivo (eliminación lógica)' });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({ message: 'Error al eliminar proveedor', error: error.message });
  }
});

// ===== ENDPOINTS CRUD DE PRODUCTOS =====

// Listar todos los productos
app.get('/api/productos', verificarToken, async (req, res) => {
  try {
    const [productos] = await pool.query(`
      SELECT 
        p.idProducto, p.codigo, p.nombre, p.descripcion, p.imagen, p.marca, p.modeloCompatible, p.ubicacion,
        p.precioCompra, p.precioVenta, p.precioVenta AS precio, p.stockActual, p.stockActual AS stock, p.stockMinimo, p.idCategoria, p.idProveedor,
        p.fechaRegistro, p.fechaActualizacion,
        c.nombre AS nombreCategoria
      FROM Producto p
      LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
      WHERE p.estado = 1
    `);
    res.status(200).json({ productos });
  } catch (error) {
    console.error('Error al listar productos:', error);
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
});

// Buscar productos por nombre, código, categoría o proveedor (debe ir antes de ":id")
app.get('/api/productos/buscar', verificarToken, async (req, res) => {
  try {
    const { nombre, codigo, idCategoria, idProveedor } = req.query;
    let query = `
      SELECT 
        p.*, c.nombre AS nombreCategoria
      FROM Producto p
      LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
      WHERE 1=1`;
    const params = [];
    if (nombre) {
      query += ' AND p.nombre LIKE ?';
      params.push(`%${nombre}%`);
    }
    if (codigo) {
      query += ' AND p.codigo LIKE ?';
      params.push(`%${codigo}%`);
    }
    if (idCategoria) {
      query += ' AND p.idCategoria = ?';
      params.push(idCategoria);
    }
    if (idProveedor) {
      query += ' AND p.idProveedor = ?';
      params.push(idProveedor);
    }
    const [productos] = await pool.query(query, params);
    res.status(200).json({ productos });
  } catch (error) {
    console.error('Error en búsqueda de productos:', error);
    res.status(500).json({ message: 'Error al buscar productos', error: error.message });
  }
});

// Listar producto por ID
app.get('/api/productos/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [productos] = await pool.query(`
      SELECT 
        p.idProducto, p.codigo, p.nombre, p.descripcion, p.imagen, p.marca, p.modeloCompatible, p.ubicacion,
        p.precioCompra, p.precioVenta, p.stockActual, p.stockMinimo, p.idCategoria, p.idProveedor,
        p.fechaRegistro, p.fechaActualizacion,
        c.nombre AS nombreCategoria
      FROM Producto p
      LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
      WHERE p.idProducto = ?
    `, [id]);
    if (productos.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.status(200).json({ producto: productos[0] });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ message: 'Error al obtener producto', error: error.message });
  }
});

// Generar siguiente código de producto por categoría
app.get('/api/productos/siguiente-codigo/:idCategoria', verificarToken, async (req, res) => {
  try {
    const { idCategoria } = req.params;
    
    // Obtener el prefijo de la categoría
    const [categoria] = await pool.query(
      'SELECT codigoPrefix FROM Categoria WHERE idCategoria = ?',
      [idCategoria]
    );
    
    if (categoria.length === 0 || !categoria[0].codigoPrefix) {
      return res.status(400).json({ message: 'Categoría no encontrada o sin prefijo de código' });
    }
    
    const prefix = categoria[0].codigoPrefix;
    
    // Buscar el máximo número usado con ese prefijo
    const [productos] = await pool.query(
      `SELECT codigo FROM Producto WHERE codigo LIKE ? ORDER BY codigo DESC LIMIT 1`,
      [`${prefix}-%`]
    );
    
    let siguienteNumero = 1;
    if (productos.length > 0) {
      // Extraer el número del código existente (ej: MOT-005 -> 5)
      const codigoActual = productos[0].codigo;
      const partes = codigoActual.split('-');
      if (partes.length >= 2) {
        const numero = parseInt(partes[1], 10);
        if (!isNaN(numero)) {
          siguienteNumero = numero + 1;
        }
      }
    }
    
    // Formatear con ceros a la izquierda (3 dígitos)
    const codigoGenerado = `${prefix}-${String(siguienteNumero).padStart(3, '0')}`;
    
    res.status(200).json({ codigo: codigoGenerado, prefix });
  } catch (error) {
    console.error('Error al generar código:', error);
    res.status(500).json({ message: 'Error al generar código', error: error.message });
  }
});

// Crear producto
app.post('/api/productos', verificarToken, async (req, res) => {
  try {
    let { codigo, nombre, descripcion, imagen, marca, modeloCompatible, ubicacion, precioCompra, precioVenta, stockActual, stockMinimo, idCategoria, idProveedor } = req.body;
    nombre = quitarTildes(nombre);
    descripcion = quitarTildes(descripcion);
    marca = quitarTildes(marca);
    modeloCompatible = quitarTildes(modeloCompatible);
    ubicacion = quitarTildes(ubicacion);
    if (!codigo || !nombre) {
      return res.status(400).json({ message: 'Código y nombre son obligatorios.' });
    }

    // Validar categoría si se envía
    if (idCategoria !== undefined && idCategoria !== null) {
      const [cat] = await pool.query('SELECT idCategoria FROM Categoria WHERE idCategoria = ? AND estado = 1', [idCategoria]);
      if (cat.length === 0) {
        return res.status(400).json({ message: 'La categoría especificada no existe o está inactiva.' });
      }
    }

    // Validación de duplicados en productos (solo activos)
    const [existeCodigo] = await pool.query('SELECT * FROM Producto WHERE codigo = ? AND estado = 1', [codigo]);
    if (existeCodigo.length > 0) {
      return res.status(409).json({ message: 'Ya existe un producto activo con ese código.' });
    }

    const [resultado] = await pool.query(
      'INSERT INTO Producto (codigo, nombre, descripcion, imagen, marca, modeloCompatible, ubicacion, precioCompra, precioVenta, stockActual, stockMinimo, idCategoria, idProveedor, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [codigo, nombre, descripcion || null, imagen || null, marca || null, modeloCompatible || null, ubicacion || null, precioCompra || 0, precioVenta || 0, stockActual || 0, stockMinimo || 0, idCategoria || null, idProveedor || null]
    );
    // Obtener nombre de categoría para respuesta
    let nombreCategoria = null;
    if (idCategoria) {
      const [catName] = await pool.query('SELECT nombre FROM Categoria WHERE idCategoria = ?', [idCategoria]);
      nombreCategoria = catName[0]?.nombre || null;
    }

    res.status(201).json({
      message: 'Producto creado exitosamente',
      idProducto: resultado.insertId,
      codigo,
      nombre,
      descripcion,
      marca,
      modeloCompatible,
      ubicacion,
      precioCompra,
      precioVenta,
      stockActual,
      stockMinimo,
      idCategoria,
      idProveedor,
      nombreCategoria
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: 'Error al crear producto', error: error.message });
  }
});

// Editar producto
app.put('/api/productos/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    let { codigo, nombre, descripcion, imagen, marca, modeloCompatible, ubicacion, precioCompra, precioVenta, stockActual, stockMinimo, idCategoria, idProveedor } = req.body;
    nombre = quitarTildes(nombre);
    descripcion = quitarTildes(descripcion);
    marca = quitarTildes(marca);
    modeloCompatible = quitarTildes(modeloCompatible);
    ubicacion = quitarTildes(ubicacion);
    
    if (!codigo && !nombre && !descripcion && imagen === undefined && !marca && !modeloCompatible && !ubicacion && precioCompra === undefined && precioVenta === undefined && stockActual === undefined && stockMinimo === undefined && idCategoria === undefined && idProveedor === undefined) {
      return res.status(400).json({ message: 'Debe enviar al menos un campo para actualizar.' });
    }
    
    // Validar categoría si se envía
    if (idCategoria !== undefined && idCategoria !== null) {
      const [cat] = await pool.query('SELECT idCategoria FROM Categoria WHERE idCategoria = ? AND estado = 1', [idCategoria]);
      if (cat.length === 0) {
        return res.status(400).json({ message: 'La categoría especificada no existe o está inactiva.' });
      }
    }

    let query = 'UPDATE Producto SET ';
    const params = [];
    
    if (codigo) { query += 'codigo = ?'; params.push(codigo); }
    if (nombre) { if (params.length > 0) query += ', '; query += 'nombre = ?'; params.push(nombre); }
    if (descripcion !== undefined) { if (params.length > 0) query += ', '; query += 'descripcion = ?'; params.push(descripcion); }
    if (imagen !== undefined) { if (params.length > 0) query += ', '; query += 'imagen = ?'; params.push(imagen); }
    if (marca !== undefined) { if (params.length > 0) query += ', '; query += 'marca = ?'; params.push(marca); }
    if (modeloCompatible !== undefined) { if (params.length > 0) query += ', '; query += 'modeloCompatible = ?'; params.push(modeloCompatible); }
    if (ubicacion !== undefined) { if (params.length > 0) query += ', '; query += 'ubicacion = ?'; params.push(ubicacion); }
    if (precioCompra !== undefined) { if (params.length > 0) query += ', '; query += 'precioCompra = ?'; params.push(precioCompra); }
    if (precioVenta !== undefined) { if (params.length > 0) query += ', '; query += 'precioVenta = ?'; params.push(precioVenta); }
    if (stockActual !== undefined) { if (params.length > 0) query += ', '; query += 'stockActual = ?'; params.push(stockActual); }
    if (stockMinimo !== undefined) { if (params.length > 0) query += ', '; query += 'stockMinimo = ?'; params.push(stockMinimo); }
  if (idCategoria !== undefined) { if (params.length > 0) query += ', '; query += 'idCategoria = ?'; params.push(idCategoria); }
  if (idProveedor !== undefined) { if (params.length > 0) query += ', '; query += 'idProveedor = ?'; params.push(idProveedor); }
    
    query += ' WHERE idProducto = ?';
    params.push(id);
    
    const [resultado] = await pool.query(query, params);
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // Devolver nombreCategoria actualizado en respuesta
    let nombreCategoria = null;
    if (idCategoria) {
      const [catName] = await pool.query('SELECT nombre FROM Categoria WHERE idCategoria = ?', [idCategoria]);
      nombreCategoria = catName[0]?.nombre || null;
    }
    res.status(200).json({ message: 'Producto actualizado exitosamente', nombreCategoria });
  } catch (error) {
    console.error('Error al editar producto:', error);
    res.status(500).json({ message: 'Error al editar producto', error: error.message });
  }
});

// Eliminar producto
app.delete('/api/productos/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el producto existe
    const [producto] = await pool.query('SELECT * FROM Producto WHERE idProducto = ?', [id]);
    if (producto.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // Verificar si tiene ventas asociadas (DetalleVenta)
    const [ventas] = await pool.query('SELECT COUNT(*) as total FROM DetalleVenta WHERE idProducto = ?', [id]);
    if (ventas[0].total > 0) {
      return res.status(409).json({ 
        message: 'No se puede eliminar el producto porque tiene ventas registradas',
        detalles: `Este producto aparece en ${ventas[0].total} venta(s)`
      });
    }
    
    // Verificar si tiene movimientos de inventario
    const [movimientos] = await pool.query('SELECT COUNT(*) as total FROM MovimientoInventario WHERE idProducto = ?', [id]);
    if (movimientos[0].total > 0) {
      return res.status(409).json({ 
        message: 'No se puede eliminar el producto porque tiene movimientos de inventario',
        detalles: `Este producto tiene ${movimientos[0].total} movimiento(s) registrado(s)`
      });
    }
    
    // Si no tiene ventas ni movimientos, proceder con eliminación lógica
    const [resultado] = await pool.query('UPDATE Producto SET estado = 0 WHERE idProducto = ?', [id]);
    res.status(200).json({ message: 'Producto marcado como inactivo (eliminación lógica)' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ message: 'Error al eliminar producto', error: error.message });
  }
});

// ===== ENDPOINTS DE VENTAS Y DETALLE VENTA =====

// Registrar una venta con sus detalles
app.post('/api/ventas', verificarToken, async (req, res) => {
  let conn;
  try {
    let { nombreCliente, documentoCliente, metodoPago, total, detalles } = req.body;
    nombreCliente = quitarTildes(nombreCliente);

    // Validar datos principales
    if (!nombreCliente || total === undefined || !Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({ message: 'Nombre del cliente, total y detalles son obligatorios.' });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const idUsuario = req.usuario.idUsuario;
    const fechaHora = new Date();
    const year = fechaHora.getFullYear();

    // Generar número de venta automático (formato: V-YYYY-0001)
    const [lastVenta] = await conn.query(
      `SELECT numeroVenta FROM Venta 
       WHERE numeroVenta LIKE ? 
       ORDER BY idVenta DESC LIMIT 1`,
      [`V-${year}-%`]
    );

    let numeroVenta;
    if (lastVenta.length > 0 && lastVenta[0].numeroVenta) {
      // Extraer el número secuencial y sumar 1
      const lastNumber = parseInt(lastVenta[0].numeroVenta.split('-')[2]);
      const nextNumber = lastNumber + 1;
      numeroVenta = `V-${year}-${nextNumber.toString().padStart(4, '0')}`;
    } else {
      // Primera venta del año
      numeroVenta = `V-${year}-0001`;
    }

    // Insertar venta principal con numeroVenta y metodoPago
    const [ventaResult] = await conn.query(
      'INSERT INTO Venta (numeroVenta, clienteNombre, clienteDocumento, montoTotal, metodoPago, fechaHora, estado, idUsuario) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [numeroVenta, nombreCliente, documentoCliente || null, total, metodoPago || 'efectivo', fechaHora, 1, idUsuario]
    );
    const idVenta = ventaResult.insertId;

    // Insertar detalles de venta y actualizar stock
    for (const detalle of detalles) {
      const { cantidad, precioUnitario, subtotal, idProducto } = detalle;
      if (!cantidad || precioUnitario === undefined || !subtotal || !idProducto) {
        await conn.rollback();
        return res.status(400).json({ message: 'Todos los campos de detalle son obligatorios.' });
      }

      // Validación de stock suficiente
      const [producto] = await conn.query('SELECT stockActual FROM Producto WHERE idProducto = ?', [idProducto]);
      if (!producto[0] || producto[0].stockActual < cantidad) {
        await conn.rollback();
        return res.status(400).json({ message: `Stock insuficiente para el producto con ID ${idProducto}` });
      }

      // Insertar detalle
      await conn.query(
        'INSERT INTO DetalleVenta (cantidad, precioVentaUnitario, subtotal, idVenta, idProducto) VALUES (?, ?, ?, ?, ?)',
        [cantidad, precioUnitario, subtotal, idVenta, idProducto]
      );
      
      // Actualizar stock del producto
      await conn.query(
        'UPDATE Producto SET stockActual = stockActual - ? WHERE idProducto = ?',
        [cantidad, idProducto]
      );
      
      // Registrar movimiento de inventario (vinculado a la venta)
      await conn.query(
        'INSERT INTO MovimientoInventario (tipoMovimiento, cantidad, fechaHora, idProducto, idUsuario, idVenta, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['salida', cantidad, fechaHora, idProducto, idUsuario, idVenta, `Venta ${numeroVenta}`]
      );
    }

    await conn.commit();
    res.status(201).json({ 
      message: 'Venta registrada exitosamente', 
      idVenta,
      numeroVenta 
    });
  } catch (error) {
    if (conn) {
      try { await conn.rollback(); } catch (_) {}
    }
    console.error('Error al registrar venta:', error);
    res.status(500).json({ message: 'Error al registrar venta', error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

// Listar todas las ventas
app.get('/api/ventas', verificarToken, async (req, res) => {
  try {
    const [ventas] = await pool.query(`
      SELECT v.*, u.nombre as nombreVendedor 
      FROM Venta v 
      LEFT JOIN Usuario u ON v.idUsuario = u.idUsuario 
      ORDER BY v.fechaHora DESC
    `);
    res.status(200).json({ ventas });
  } catch (error) {
    console.error('Error al listar ventas:', error);
    res.status(500).json({ message: 'Error al obtener ventas', error: error.message });
  }
});

// Ver detalles de una venta (con info completa de productos)
app.get('/api/ventas/:id/detalles', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [detalles] = await pool.query(`
      SELECT 
        dv.idDetalleVenta, dv.cantidad, dv.precioUnitario, dv.subtotal,
        p.idProducto, p.codigo AS codigoProducto, p.nombre AS nombreProducto, 
        p.imagen, p.marca,
        c.nombre AS nombreCategoria
      FROM DetalleVenta dv
      LEFT JOIN Producto p ON dv.idProducto = p.idProducto
      LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
      WHERE dv.idVenta = ?
    `, [id]);
    res.status(200).json({ detalles });
  } catch (error) {
    console.error('Error al obtener detalles de venta:', error);
    res.status(500).json({ message: 'Error al obtener detalles de venta', error: error.message });
  }
});

// Ver venta completa con detalles
app.get('/api/ventas/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener datos de la venta
    const [ventas] = await pool.query(`
      SELECT v.*, u.nombre as nombreVendedor 
      FROM Venta v 
      LEFT JOIN Usuario u ON v.idUsuario = u.idUsuario 
      WHERE v.idVenta = ?
    `, [id]);
    
    if (ventas.length === 0) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    const venta = ventas[0];
    
    // Obtener detalles con info de productos
    const [detalles] = await pool.query(`
      SELECT 
        dv.idDetalleVenta, dv.cantidad, dv.precioVentaUnitario AS precioUnitario, dv.subtotal,
        p.idProducto, p.codigo AS codigoProducto, p.nombre AS nombreProducto, 
        p.imagen, p.marca,
        c.nombre AS nombreCategoria
      FROM DetalleVenta dv
      LEFT JOIN Producto p ON dv.idProducto = p.idProducto
      LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
      WHERE dv.idVenta = ?
    `, [id]);
    
    res.status(200).json({ 
      venta: {
        ...venta,
        detalles
      }
    });
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({ message: 'Error al obtener venta', error: error.message });
  }
});

// Eliminar venta (Admin/Corrección) - Revierte Stock
app.delete('/api/ventas/:id', verificarToken, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1. Obtener detalles para revertir stock
    const [detalles] = await conn.query('SELECT * FROM DetalleVenta WHERE idVenta = ?', [id]);
    
    // 2. Revertir Stock y eliminar Detalles
    for (const d of detalles) {
      await conn.query('UPDATE Producto SET stockActual = stockActual + ? WHERE idProducto = ?', [d.cantidad, d.idProducto]);
    }
    await conn.query('DELETE FROM DetalleVenta WHERE idVenta = ?', [id]);

    // 3. Eliminar Movimientos de Inventario asociados
    await conn.query('DELETE FROM MovimientoInventario WHERE idVenta = ?', [id]);

    // 4. Eliminar Venta
    const [resVenta] = await conn.query('DELETE FROM Venta WHERE idVenta = ?', [id]);

    if (resVenta.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    await conn.commit();
    res.status(200).json({ message: 'Venta eliminada y stock revertido correctamente' });
  } catch (error) {
    if (conn) try { await conn.rollback(); } catch (_) {}
    console.error('Error al eliminar venta:', error);
    res.status(500).json({ message: 'Error al eliminar venta', error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

// ===== ENDPOINTS DE BÚSQUEDA Y FILTROS AVANZADOS =====

// (Ruta de búsqueda movida arriba para evitar colisiones con ":id")

// Filtrar ventas por fecha, cliente o usuario
app.get('/api/ventas/filtrar', verificarToken, async (req, res) => {
  try {
    const { fechaInicio, fechaFin, clienteNombre, idUsuario } = req.query;
    let query = 'SELECT * FROM Venta WHERE 1=1';
    const params = [];
    if (fechaInicio && fechaFin) {
      query += ' AND fechaHora BETWEEN ? AND ?';
      params.push(fechaInicio, fechaFin);
    }
    if (clienteNombre) {
      query += ' AND clienteNombre LIKE ?';
      params.push(`%${clienteNombre}%`);
    }
    if (idUsuario) {
      query += ' AND idUsuario = ?';
      params.push(idUsuario);
    }
    const [ventas] = await pool.query(query, params);
    res.status(200).json({ ventas });
  } catch (error) {
    console.error('Error en filtro de ventas:', error);
    res.status(500).json({ message: 'Error al filtrar ventas', error: error.message });
  }
});

// ===== ENDPOINTS DE REPORTES =====

// Reporte de productos con bajo stock
app.get('/api/reportes/bajo-stock', verificarToken, async (req, res) => {
  try {
    const { limite } = req.query;
    const stockLimite = limite ? parseInt(limite) : 5;
    const [productos] = await pool.query(`
      SELECT 
        p.*, c.nombre AS nombreCategoria
      FROM Producto p
      LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
      WHERE p.stockActual <= ?
      ORDER BY p.stockActual ASC
    `, [stockLimite]);
    res.status(200).json({ productos });
  } catch (error) {
    console.error('Error en reporte de bajo stock:', error);
    res.status(500).json({ message: 'Error al obtener reporte de bajo stock', error: error.message });
  }
});

// Reporte de ventas por rango de fechas
app.get('/api/reportes/ventas-fechas', verificarToken, async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ message: 'Debe enviar fechaInicio y fechaFin.' });
    }
    const [ventas] = await pool.query('SELECT * FROM Venta WHERE fechaHora BETWEEN ? AND ?', [fechaInicio, fechaFin]);
    res.status(200).json({ ventas });
  } catch (error) {
    console.error('Error en reporte de ventas por fechas:', error);
    res.status(500).json({ message: 'Error al obtener reporte de ventas', error: error.message });
  }
});

// Reporte de movimientos de inventario por producto
app.get('/api/reportes/movimientos-producto/:idProducto', verificarToken, async (req, res) => {
  try {
    const { idProducto } = req.params;
    const [movimientos] = await pool.query('SELECT * FROM MovimientoInventario WHERE idProducto = ?', [idProducto]);
    res.status(200).json({ movimientos });
  } catch (error) {
    console.error('Error en reporte de movimientos:', error);
    res.status(500).json({ message: 'Error al obtener movimientos de inventario', error: error.message });
  }
});

// ===== ENDPOINTS CRUD DE MOVIMIENTOS DE INVENTARIO =====

// Registrar movimiento de inventario
app.post('/api/movimientos', verificarToken, async (req, res) => {
  try {
    let { tipoMovimiento, cantidad, fechaHora, idProducto, idUsuario, idVenta, observaciones, descripcion } = req.body;
    
    // Usar ID del token si no viene en body (preferible usar token por seguridad)
    if (!idUsuario && req.usuario) {
      idUsuario = req.usuario.idUsuario;
    }
    
    // Usar fecha actual si no viene
    if (!fechaHora) {
      fechaHora = new Date();
    }
    
    // Mapear descripcion a observaciones si es necesario
    const obs = observaciones || descripcion || null;

    if (!tipoMovimiento || cantidad === undefined || !idProducto || !idUsuario) {
      return res.status(400).json({ message: 'Tipo, Cantidad y Producto son obligatorios.' });
    }
    // Insertar movimiento
    const [resultado] = await pool.query(
      'INSERT INTO MovimientoInventario (tipoMovimiento, cantidad, fechaHora, idProducto, idUsuario, idVenta, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tipoMovimiento, cantidad, fechaHora, idProducto, idUsuario, idVenta || null, obs]
    );
    // Actualizar stock si es entrada o salida
    if (tipoMovimiento === 'entrada') {
      await pool.query('UPDATE Producto SET stockActual = stockActual + ? WHERE idProducto = ?', [cantidad, idProducto]);
    } else if (tipoMovimiento === 'salida') {
      await pool.query('UPDATE Producto SET stockActual = stockActual - ? WHERE idProducto = ?', [cantidad, idProducto]);
    }
    res.status(201).json({ message: 'Movimiento registrado exitosamente', idMovimientoInventario: resultado.insertId });
  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    res.status(500).json({ message: 'Error al registrar movimiento', error: error.message });
  }
});

// Listar todos los movimientos de inventario (con filtros y paginación)
app.get('/api/movimientos', verificarToken, async (req, res) => {
  try {
    const { 
      tipoMovimiento, 
      idProducto, 
      idUsuario, 
      fechaInicio, 
      fechaFin,
      page = 1,
      limit = 50
    } = req.query;

    // Construir query con filtros
    let query = `
      SELECT 
        mi.idMovimientoInventario,
        mi.tipoMovimiento,
        mi.cantidad,
        mi.fechaHora,
        mi.observaciones,
        p.nombre as productoNombre,
        p.codigo as productoCodigo,
        c.nombre as nombreCategoria,
        u.nombreCompleto as usuarioNombre
      FROM MovimientoInventario mi
      LEFT JOIN Producto p ON mi.idProducto = p.idProducto
      LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
      LEFT JOIN Usuario u ON mi.idUsuario = u.idUsuario
      WHERE 1=1
    `;
    const params = [];
    
    // Aplicar filtros
    if (tipoMovimiento) {
      query += ' AND mi.tipoMovimiento = ?';
      params.push(tipoMovimiento);
    }
    
    if (idProducto) {
      query += ' AND mi.idProducto = ?';
      params.push(idProducto);
    }
    
    if (idUsuario) {
      query += ' AND mi.idUsuario = ?';
      params.push(idUsuario);
    }
    
    if (fechaInicio && fechaFin) {
      query += ' AND mi.fechaHora BETWEEN ? AND ?';
      params.push(fechaInicio, fechaFin);
    }
    
    query += ' ORDER BY mi.fechaHora DESC';
    
    // Paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    // Ejecutar query
    const [movimientos] = await pool.query(query, params);
    
    // Obtener total de registros (sin límite)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM MovimientoInventario mi
      WHERE 1=1
    `;
    const countParams = [];
    
    if (tipoMovimiento) {
      countQuery += ' AND mi.tipoMovimiento = ?';
      countParams.push(tipoMovimiento);
    }
    if (idProducto) {
      countQuery += ' AND mi.idProducto = ?';
      countParams.push(idProducto);
    }
    if (idUsuario) {
      countQuery += ' AND mi.idUsuario = ?';
      countParams.push(idUsuario);
    }
    if (fechaInicio && fechaFin) {
      countQuery += ' AND mi.fechaHora BETWEEN ? AND ?';
      countParams.push(fechaInicio, fechaFin);
    }
    
    const [countResult] = await pool.query(countQuery, countParams);
    const totalRegistros = countResult[0].total;
    const totalPaginas = Math.ceil(totalRegistros / parseInt(limit));
    
    res.status(200).json({ 
      movimientos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRegistros,
        totalPages: totalPaginas
      }
    });
  } catch (error) {
    console.error('Error al listar movimientos:', error);
    res.status(500).json({ message: 'Error al obtener movimientos', error: error.message });
  }
});

// Eliminar movimiento (Solo para correcciones/admin)
app.delete('/api/movimientos/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [movs] = await pool.query('SELECT * FROM MovimientoInventario WHERE idMovimientoInventario = ?', [id]);
    if (movs.length === 0) {
      return res.status(404).json({ message: 'Movimiento no encontrado' });
    }
    
    const mov = movs[0];
    
    await pool.query('DELETE FROM MovimientoInventario WHERE idMovimientoInventario = ?', [id]);
    
    if (mov.tipoMovimiento === 'entrada') {
      await pool.query('UPDATE Producto SET stockActual = stockActual - ? WHERE idProducto = ?', [mov.cantidad, mov.idProducto]);
    } else if (mov.tipoMovimiento === 'salida') {
      await pool.query('UPDATE Producto SET stockActual = stockActual + ? WHERE idProducto = ?', [mov.cantidad, mov.idProducto]);
    }
    
    res.status(200).json({ message: 'Movimiento eliminado y stock revertido' });
  } catch (error) {
    console.error('Error al eliminar movimiento:', error);
    res.status(500).json({ message: 'Error al eliminar movimiento', error: error.message });
  }
});

// Consultar movimientos por producto
app.get('/api/movimientos/producto/:idProducto', verificarToken, async (req, res) => {
  try {
    const { idProducto } = req.params;
    const [movimientos] = await pool.query(`
      SELECT mi.*, p.nombre as productoNombre, p.codigo as productoCodigo, c.nombre as nombreCategoria
      FROM MovimientoInventario mi
      LEFT JOIN Producto p ON mi.idProducto = p.idProducto
      LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
      WHERE mi.idProducto = ?
      ORDER BY mi.fechaHora DESC
    `, [idProducto]);
    res.status(200).json({ movimientos });
  } catch (error) {
    console.error('Error al obtener movimientos por producto:', error);
    res.status(500).json({ message: 'Error al obtener movimientos por producto', error: error.message });
  }
});

// Consultar movimientos por usuario
app.get('/api/movimientos/usuario/:idUsuario', verificarToken, async (req, res) => {
  try {
    const { idUsuario } = req.params;
    const [movimientos] = await pool.query(`
      SELECT mi.*, p.nombre as productoNombre, p.codigo as productoCodigo, c.nombre as nombreCategoria
      FROM MovimientoInventario mi
      LEFT JOIN Producto p ON mi.idProducto = p.idProducto
      LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
      WHERE mi.idUsuario = ?
      ORDER BY mi.fechaHora DESC
    `, [idUsuario]);
    res.status(200).json({ movimientos });
  } catch (error) {
    console.error('Error al obtener movimientos por usuario:', error);
    res.status(500).json({ message: 'Error al obtener movimientos por usuario', error: error.message });
  }
});

// ===== ENDPOINT: REGISTRO DE USUARIOS =====
app.post('/api/usuarios/registro',
  // Validaciones con express-validator
  body('nombre').trim().isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('contraseña').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  async (req, res) => {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Errores de validación',
        errors: errors.array() 
      });
    }

    try {
      const { nombre, email, contraseña, telefono } = req.body;

    // Verificar si el email ya existe
    const [usuarioExistente] = await pool.query(
      'SELECT * FROM Usuario WHERE email = ?',
      [email]
    );

    if (usuarioExistente.length > 0) {
      return res.status(409).json({ 
        message: 'El email ya está registrado' 
      });
    }

    // Encriptar la contraseña
    const contraseñaHasheada = await bcrypt.hash(contraseña, BCRYPT_ROUNDS);

    // Insertar el nuevo usuario en la base de datos
    // Por defecto, estado = 1 (activo) y idRol = 2 (Vendedor)
    // Incluye teléfono si fue proporcionado
    const [resultado] = await pool.query(
      'INSERT INTO Usuario (nombre, nombreCompleto, email, contraseña, telefono, estado, idRol, fechaHoraCreacion) VALUES (?, ?, ?, ?, ?, 1, 2, NOW())',
      [nombre, nombre, email, contraseñaHasheada, telefono || null]
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      idUsuario: resultado.insertId,
      nombre,
      email,
      telefono: telefono || null
    });

    } catch (error) {
      console.error('Error en el registro:', error);
      res.status(500).json({ 
        message: 'Error al registrar usuario',
        error: error.message 
      });
    }
  }
);

// ===== ENDPOINT: LOGIN DE USUARIOS =====
app.post('/api/usuarios/login',
  loginLimiter, // Aplicar rate limiting
  // Validaciones
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('contraseña').notEmpty().withMessage('La contraseña es requerida'),
  async (req, res) => {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Errores de validación',
        errors: errors.array() 
      });
    }

    try {
      const { email, contraseña } = req.body;

    // Buscar el usuario por email
    const [usuarios] = await pool.query(
      'SELECT * FROM Usuario WHERE email = ?',
      [email]
    );

    // Verificar si el usuario existe
    if (usuarios.length === 0) {
      return res.status(401).json({ 
        message: 'Credenciales incorrectas' 
      });
    }

    const usuario = usuarios[0];

    // Verificar si el usuario está activo
    if (usuario.estado !== 1) {
      return res.status(403).json({ 
        message: 'Usuario inactivo. Contacte al administrador.' 
      });
    }

    // Comparar la contraseña ingresada con la hasheada en la BD
    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);

    if (!contraseñaValida) {
      return res.status(401).json({ 
        message: 'Credenciales incorrectas' 
      });
    }

    // Generar JWT para el cliente
    const token = jwt.sign({
      idUsuario: usuario.idUsuario,
      nombre: usuario.nombre || usuario.nombreCompleto, // Usar 'nombre' como principal
      nombreCompleto: usuario.nombreCompleto,
      email: usuario.email,
      idRol: usuario.idRol,
    }, JWT_SECRET, { expiresIn: '8h' });

    res.status(200).json({
      message: 'Login exitoso',
      token,
      usuario: {
        idUsuario: usuario.idUsuario,
        nombre: usuario.nombre || usuario.nombreCompleto, // ⭐ CAMPO PRINCIPAL
        nombreCompleto: usuario.nombreCompleto,
        email: usuario.email,
        telefono: usuario.telefono,
        fotoPerfil: usuario.fotoPerfil,
        direccion: usuario.direccion,
        fechaNacimiento: usuario.fechaNacimiento,
        cargo: usuario.cargo,
        biografia: usuario.biografia,
        estado: usuario.estado,
        fechaHoraCreacion: usuario.fechaHoraCreacion,
        idRol: usuario.idRol
      }
    });

    } catch (error) {
      console.error('Error en el login:', error);
      res.status(500).json({ 
        message: 'Error al iniciar sesión',
        error: error.message 
      });
    }
  }
);

// ===== ENDPOINT: SOLICITAR RECUPERACIÓN DE CONTRASEÑA =====
app.post('/api/usuarios/forgot-password',
  // loginLimiter, // Deshabilitado temporalmente para facilitar pruebas
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  async (req, res) => {
    console.log('📨 Incoming forgot-password request:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Email inválido',
        errors: errors.array() 
      });
    }

    try {
      const { email } = req.body;

      // Buscar usuario por email
      const [usuarios] = await pool.query(
        'SELECT idUsuario, nombre, nombreCompleto, email FROM Usuario WHERE email = ?',
        [email]
      );

      // Por seguridad, siempre devolvemos el mismo mensaje aunque el email no exista
      // Esto previene que atacantes descubran qué emails están registrados
      if (usuarios.length === 0) {
        return res.status(200).json({ 
          message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación en breve.' 
        });
      }

      const usuario = usuarios[0];

      // Generar token seguro
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora desde ahora

      // Guardar token en la base de datos
      await pool.query(
        'UPDATE Usuario SET resetToken = ?, resetTokenExpiry = ? WHERE idUsuario = ?',
        [resetToken, resetTokenExpiry, usuario.idUsuario]
      );

      // Enviar email
      const nombreUsuario = usuario.nombre || usuario.nombreCompleto;
      const resultado = await enviarEmailRecuperacion(usuario.email, nombreUsuario, resetToken);

      if (!resultado.success) {
        console.error('Error al enviar email de recuperación:', resultado.error);
        return res.status(500).json({ 
          message: 'Error al enviar el email de recuperación. Por favor, intenta más tarde.' 
        });
      }

      console.log(`✅ Email de recuperación enviado a: ${usuario.email}`);
      res.status(200).json({ 
        message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación en breve.',
        debug: process.env.NODE_ENV === 'development' ? { token: resetToken } : undefined // Solo para desarrollo
      });

    } catch (error) {
      console.error('Error en forgot-password:', error);
      res.status(500).json({ 
        message: 'Error al procesar la solicitud',
        error: error.message 
      });
    }
  }
);

// ===== ENDPOINT: RESTABLECER CONTRASEÑA CON TOKEN =====
app.post('/api/usuarios/reset-password',
  body('token').notEmpty().withMessage('Token requerido'),
  body('contraseña')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener mayúsculas, minúsculas y números'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Datos inválidos',
        errors: errors.array() 
      });
    }

    try {
      const { token, contraseña } = req.body;

      // Buscar usuario con token válido y no expirado
      const [usuarios] = await pool.query(
        'SELECT idUsuario, nombre, email, resetToken, resetTokenExpiry FROM Usuario WHERE resetToken = ?',
        [token]
      );
      
      console.log('🔍 Debug Reset:', {
        tokenRecibido: token,
        usuariosEncontrados: usuarios.length
      });

      if (usuarios.length > 0) {
        console.log('   Usuario encontrado:', usuarios[0].email);
        console.log('   Token en BD:', usuarios[0].resetToken);
        console.log('   Expiry en BD:', usuarios[0].resetTokenExpiry);
        console.log('   Tiempo Actual:', new Date());
        
        // Verificación manual de fecha
        const now = new Date();
        const expiry = new Date(usuarios[0].resetTokenExpiry);
        if (expiry <= now) {
          console.log('   ❌ EL TOKEN HA EXPIRADO (Verificación manual)');
        } else {
          console.log('   ✅ TOKEN VÁLIDO (Verificación manual)');
        }
      } else {
        console.log('   ❌ No se encontró usuario con ese token');
      }

      // Re-query original para mantener lógica exacta
      const [usuariosValidos] = await pool.query(
        'SELECT idUsuario, nombre, email FROM Usuario WHERE resetToken = ? AND resetTokenExpiry > NOW()',
        [token]
      );

      if (usuarios.length === 0) {
        return res.status(400).json({ 
          message: 'Token inválido o expirado. Por favor, solicita un nuevo enlace de recuperación.' 
        });
      }

      const usuario = usuarios[0];

      // Hashear nueva contraseña
      const contraseñaHasheada = await bcrypt.hash(contraseña, BCRYPT_ROUNDS);

      // Actualizar contraseña y limpiar token
      await pool.query(
        'UPDATE Usuario SET contraseña = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE idUsuario = ?',
        [contraseñaHasheada, usuario.idUsuario]
      );

      console.log(`✅ Contraseña restablecida para: ${usuario.email}`);
      
      // Enviar email de confirmación (no bloqueante)
      const nombreUsuario = usuario.nombre || 'Usuario';
      enviarEmailConfirmacionCambio(usuario.email, nombreUsuario).catch(console.error);

      res.status(200).json({ 
        message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.' 
      });

    } catch (error) {
      console.error('Error en reset-password:', error);
      res.status(500).json({ 
        message: 'Error al restablecer la contraseña',
        error: error.message 
      });
    }
  }
);

// ===== ENDPOINT: CAMBIAR ESTADO DE USUARIO (ACTIVAR/DESACTIVAR) =====
// ===== ENDPOINT: VERIFICAR TOKEN Y OBTENER DATOS DEL USUARIO =====
app.get('/api/usuarios/me', verificarToken, async (req, res) => {
  try {
    const { idUsuario } = req.usuario;
    const [usuarios] = await pool.query(
      `SELECT u.idUsuario, u.nombre, u.email, u.telefono, u.fotoPerfil,
        u.direccion, u.fechaNacimiento, u.cargo, u.biografia,
        u.estado, u.fechaHoraCreacion AS fechaCreacion, u.idRol, r.nombreRol
       FROM Usuario u
       INNER JOIN Rol r ON u.idRol = r.idRol
       WHERE u.idUsuario = ?`,
      [idUsuario]
    );
    if (usuarios.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({ usuario: usuarios[0] });
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    res.status(500).json({ message: 'Error al obtener datos del usuario', error: error.message });
  }
});

// ===== ENDPOINT: REFRESH TOKEN (renovar token antes de expirar) =====
app.post('/api/usuarios/refresh', verificarToken, async (req, res) => {
  try {
    const { idUsuario, nombreCompleto, email, idRol } = req.usuario;
    
    // Verificar que el usuario sigue activo
    const [usuarios] = await pool.query(
      'SELECT estado FROM Usuario WHERE idUsuario = ?',
      [idUsuario]
    );
    
    if (usuarios.length === 0 || usuarios[0].estado !== 1) {
      return res.status(403).json({ message: 'Usuario inactivo o no encontrado' });
    }
    
    // Generar nuevo token con los mismos datos
    const newToken = jwt.sign(
      { idUsuario, nombreCompleto, email, idRol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    res.status(200).json({ 
      message: 'Token renovado exitosamente',
      token: newToken 
    });
  } catch (error) {
    console.error('Error al renovar token:', error);
    res.status(500).json({ message: 'Error al renovar token', error: error.message });
  }
});

// ===== ENDPOINT: CAMBIAR CONTRASEÑA (requiere contraseña actual) =====
app.post('/api/usuarios/cambiar-contraseña', verificarToken, async (req, res) => {
  try {
    const { idUsuario } = req.usuario;
    const { contraseñaActual, contraseñaNueva } = req.body;
    
    if (!contraseñaActual || !contraseñaNueva) {
      return res.status(400).json({ message: 'Debe enviar contraseña actual y nueva' });
    }
    
    if (contraseñaNueva.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }
    
    // Obtener usuario
    const [usuarios] = await pool.query(
      'SELECT contraseña FROM Usuario WHERE idUsuario = ?',
      [idUsuario]
    );
    
    if (usuarios.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar contraseña actual
    const contraseñaValida = await bcrypt.compare(contraseñaActual, usuarios[0].contraseña);
    if (!contraseñaValida) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }
    
    // Hashear nueva contraseña
    const nuevaHasheada = await bcrypt.hash(contraseñaNueva, BCRYPT_ROUNDS);
    
    // Actualizar contraseña
    await pool.query(
      'UPDATE Usuario SET contraseña = ? WHERE idUsuario = ?',
      [nuevaHasheada, idUsuario]
    );
    
    res.status(200).json({ message: 'Contraseña cambiada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Error al cambiar contraseña', error: error.message });
  }
});

// ===== ENDPOINT: LOGOUT (Actualizar fechaFinSesion) =====
app.patch('/api/usuarios/logout', verificarToken, async (req, res) => {
  try {
    const { idUsuario } = req.usuario;
    
    // Actualizar fechaFinSesion con la hora actual
    await pool.query(
      'UPDATE Usuario SET fechaFinSesion = NOW() WHERE idUsuario = ?',
      [idUsuario]
    );
    
    res.status(200).json({ 
      message: 'Sesión cerrada exitosamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({ 
      message: 'Error al cerrar sesión', 
      error: error.message 
    });
  }
});

// ===== ENDPOINTS DE ESTADÍSTICAS DEL DASHBOARD =====

// Obtener estadísticas generales del dashboard
app.get('/api/estadisticas/dashboard', verificarToken, async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const inicioDeMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Total de productos
    const [totalProductos] = await pool.query(
      'SELECT COUNT(*) as total FROM Producto WHERE estado = 1'
    );
    
    // Ventas de hoy
    const [ventasHoy] = await pool.query(
      'SELECT COUNT(*) as total, COALESCE(SUM(montototal), 0) as monto FROM venta WHERE DATE(fechahora) = CURRENT_DATE'
    );
    
    // Ventas del mes
    const [ventasMes] = await pool.query(
      'SELECT COUNT(*) as total, COALESCE(SUM(montoTotal), 0) as monto FROM Venta WHERE fechaHora >= ?',
      [inicioDeMes]
    );
    
    // Productos con stock bajo (stockActual <= stockMinimo)
    const [productosStockBajo] = await pool.query(
      'SELECT COUNT(*) as total FROM Producto WHERE stockActual <= stockMinimo AND estado = 1'
    );
    
    // Valor total del inventario
    const [valorInventario] = await pool.query(
      'SELECT COALESCE(SUM(stockActual * precioCompra), 0) as total FROM Producto WHERE estado = 1'
    );
    
    // Top 5 productos más vendidos (del mes)
    const [topProductos] = await pool.query(`
      SELECT p.nombre, p.codigo, SUM(dv.cantidad) as totalVendido, 
             COALESCE(SUM(dv.subtotal), 0) as ingresoTotal
      FROM DetalleVenta dv
      INNER JOIN Producto p ON dv.idProducto = p.idProducto
      INNER JOIN Venta v ON dv.idVenta = v.idVenta
      WHERE v.fechaHora >= ?
      GROUP BY p.idProducto, p.nombre, p.codigo
      ORDER BY totalVendido DESC
      LIMIT 5
    `, [inicioDeMes]);
    
    // Productos con stock bajo (detalles)
    const [productosAlerta] = await pool.query(`
      SELECT idProducto, codigo, nombre, stockActual, stockMinimo
      FROM Producto 
      WHERE stockActual <= stockMinimo AND estado = 1
      ORDER BY stockActual ASC
      LIMIT 10
    `);
    
    // Ventas por Categoría (para gráfico circular)
    const [ventasPorCategoria] = await pool.query(`
      SELECT c.nombre, COUNT(dv.idProducto) as cantidad, COALESCE(SUM(dv.subtotal), 0) as total
      FROM DetalleVenta dv
      INNER JOIN Producto p ON dv.idProducto = p.idProducto
      INNER JOIN Categoria c ON p.idCategoria = c.idCategoria
      INNER JOIN Venta v ON dv.idVenta = v.idVenta
      WHERE v.fechaHora >= ?
      GROUP BY c.idCategoria, c.nombre
    `, [inicioDeMes]);

    // Ventas por día (últimos 7 días) para gráfico
    const [ventasPorDia] = await pool.query(`
      SELECT DATE(fechahora) as fecha, 
             COUNT(*) as cantidad, 
             COALESCE(SUM(montototal), 0) as total
      FROM venta
      WHERE fechahora >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(fechahora)
      ORDER BY fecha ASC
    `);
    
    res.json({
      totalProductos: totalProductos[0].total,
      ventasHoy: {
        cantidad: ventasHoy[0].total,
        monto: parseFloat(ventasHoy[0].monto)
      },
      ventasMes: {
        cantidad: ventasMes[0].total,
        monto: parseFloat(ventasMes[0].monto)
      },
      productosStockBajo: productosStockBajo[0].total,
      valorInventario: parseFloat(valorInventario[0].total),
      topProductos: topProductos.map(p => ({
        ...p,
        totalVendido: parseInt(p.totalVendido),
        ingresoTotal: parseFloat(p.ingresoTotal)
      })),
      productosAlerta,
      ventasPorDia: ventasPorDia.map(v => ({
        fecha: v.fecha,
        cantidad: parseInt(v.cantidad),
        total: parseFloat(v.total)
      })),
      ventasPorCategoria: ventasPorCategoria.map(c => ({
        nombre: c.nombre,
        value: parseFloat(c.total), // Para Recharts
        total: parseFloat(c.total),
        cantidad: parseInt(c.cantidad)
      }))
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
});

// ===== NUEVO: Reporte de Ventas por Fechas =====
app.get('/api/reportes/ventas-fechas', verificarToken, async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ message: 'Debe proporcionar fechaInicio y fechaFin' });
    }

    // Ajustar fechas para cubrir el día completo
    // fechaInicio 00:00:00
    const start = new Date(fechaInicio);
    start.setHours(0, 0, 0, 0);

    // fechaFin 23:59:59
    const end = new Date(fechaFin);
    end.setHours(23, 59, 59, 999);

    const [ventas] = await pool.query(`
      SELECT v.idVenta, v.numeroVenta, v.fechaHora, v.montoTotal, v.metodoPago, 
             v.estado, COALESCE(u.nombre, 'Cliente General') as clienteNombre
      FROM Venta v
      LEFT JOIN Usuario u ON v.idCliente = u.idUsuario
      WHERE v.fechaHora BETWEEN ? AND ?
      ORDER BY v.fechaHora DESC
    `, [start, end]);

    res.json({ ventas });
  } catch (error) {
    console.error('Error al generar reporte de ventas:', error);
    res.status(500).json({ message: 'Error al generar reporte', error: error.message });
  }
});

// Obtener productos con stock bajo
app.get('/api/estadisticas/stock-bajo', verificarToken, async (req, res) => {
  try {
    const [productos] = await pool.query(`
      SELECT p.*, c.nombre as nombreCategoria
      FROM Producto p
      LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
      WHERE p.stockActual <= p.stockMinimo AND p.estado = 1
      ORDER BY p.stockActual ASC
    `);
    
    res.json({ productos });
  } catch (error) {
    console.error('Error al obtener productos con stock bajo:', error);
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
});

// ===== ENDPOINTS DE GESTIÓN DE PERFILES =====

// Obtener perfil del usuario actual
app.get('/api/usuarios/perfil', verificarToken, async (req, res) => {
  try {
    const { idUsuario } = req.usuario;
    const [usuarios] = await pool.query(
      `SELECT u.idusuario, u.nombre, u.nombrecompleto, u.email, u.telefono, u.fotoperfil,
        u.direccion, u.fechanacimiento, u.cargo, u.biografia,
        u.estado, u.fechahoracreacion AS fechacreacion, u.idrol, r.nombrerol
       FROM usuario u
       INNER JOIN rol r ON u.idrol = r.idrol
       WHERE u.idusuario = ?`,
      [idUsuario]
    );
    if (usuarios.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({ usuario: usuarios[0] });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
});

// Actualizar perfil del usuario actual
app.put('/api/usuarios/perfil', verificarToken, async (req, res) => {
  try {
    const { idUsuario } = req.usuario;
    let { nombre, telefono, fotoPerfil, direccion, fechaNacimiento, cargo, biografia } = req.body;
    
    console.log('🔄 Intentando actualizar perfil del usuario:', idUsuario);
    console.log('📦 Datos recibidos:', { nombre, telefono, fotoPerfil: fotoPerfil ? '(imagen presente)' : null, direccion, fechaNacimiento, cargo, biografia });
    
    // Normalizar fechaNacimiento si viene en formato dd/mm/yyyy
    if (fechaNacimiento && typeof fechaNacimiento === 'string') {
      // aceptar formatos yyyy-mm-dd o dd/mm/yyyy
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaNacimiento)) {
        const [dd, mm, yyyy] = fechaNacimiento.split('/');
        fechaNacimiento = `${yyyy}-${mm}-${dd}`;
      }
    }

    // Validar tamaño de foto base64 (aprox) si es data URL
    if (fotoPerfil && typeof fotoPerfil === 'string' && fotoPerfil.startsWith('data:')) {
      // Tamaño aproximado = (longitud - cabecera) * 0.75 bytes
      const metaEnd = fotoPerfil.indexOf(',');
      const b64 = metaEnd > 0 ? fotoPerfil.slice(metaEnd + 1) : fotoPerfil;
      const approxBytes = Math.floor(b64.length * 0.75);
      // permitir hasta ~3MB
      if (approxBytes > 3 * 1024 * 1024) {
        return res.status(400).json({ message: 'La imagen supera el tamaño máximo permitido (3MB)' });
      }
    }

    // Construir query dinámicamente solo con campos presentes
    // IMPORTANTE: Usar nombres de columnas en minúsculas para PostgreSQL
    const updates = [];
    const values = [];
    
    if (nombre !== undefined && nombre !== null && nombre !== '') { 
      updates.push('nombre = ?, nombrecompleto = ?'); 
      values.push(nombre, nombre); 
    }
    if (telefono !== undefined && telefono !== null) { 
      updates.push('telefono = ?'); 
      values.push(telefono); 
    }
    if (fotoPerfil !== undefined && fotoPerfil !== null) { 
      updates.push('fotoperfil = ?'); 
      values.push(fotoPerfil); 
    }
    if (direccion !== undefined && direccion !== null) { 
      updates.push('direccion = ?'); 
      values.push(direccion); 
    }
    if (fechaNacimiento !== undefined && fechaNacimiento !== null) { 
      updates.push('fechanacimiento = ?'); 
      values.push(fechaNacimiento); 
    }
    if (cargo !== undefined && cargo !== null) { 
      updates.push('cargo = ?'); 
      values.push(cargo); 
    }
    if (biografia !== undefined && biografia !== null) { 
      updates.push('biografia = ?'); 
      values.push(biografia); 
    }
    
    // Validar que haya al menos un campo para actualizar
    if (updates.length === 0) {
      console.log('⚠️ No hay campos para actualizar');
      return res.status(400).json({ message: 'Debe proporcionar al menos un campo para actualizar' });
    }
    
    values.push(idUsuario);
    
    // IMPORTANTE: Nombres de tabla y columnas en minúsculas para PostgreSQL
    const query = `UPDATE usuario SET ${updates.join(', ')} WHERE idusuario = ?`;
    console.log('📝 Query SQL:', query);
    console.log('📝 Valores:', values.map((v, i) => i === values.length - 1 ? v : (typeof v === 'string' && v.length > 50 ? v.substring(0, 50) + '...' : v)));
    
    await pool.query(query, values);
    
    // Obtener datos actualizados del usuario
    // IMPORTANTE: Nombres de columnas en minúsculas para PostgreSQL
    const [usuarios] = await pool.query(
      `SELECT u.idusuario, u.nombre, u.nombrecompleto, u.email, u.telefono, u.fotoperfil, 
              u.direccion, u.fechanacimiento, u.cargo, u.biografia,
              u.estado, u.fechahoracreacion AS fechacreacion, u.idrol, r.nombrerol
       FROM usuario u
       INNER JOIN rol r ON u.idrol = r.idrol
       WHERE u.idusuario = ?`,
      [idUsuario]
    );
    
    console.log('✅ Perfil actualizado exitosamente');
    
    res.json({ 
      message: 'Perfil actualizado exitosamente', 
      usuario: usuarios[0] 
    });
  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error al actualizar perfil', error: error.message });
  }
});

// ===== ENDPOINTS DE GESTIÓN DE USUARIOS (SOLO ADMIN) =====

// Middleware para verificar que el usuario es admin
const verificarAdmin = (req, res, next) => {
  if (req.usuario.idRol !== 1) {
    return res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
  }
  next();
};

// Obtener todos los usuarios (solo admin)
app.get('/api/usuarios', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { estado, rol } = req.query;
    
    let query = `
      SELECT u.idusuario, u.nombre, u.email, u.telefono, u.fotoperfil,
        u.direccion, u.fechanacimiento, u.cargo, u.biografia,
        u.estado, u.fechahoracreacion AS fechacreacion, u.fechafinsesion,
        u.idrol, r.nombrerol,
        CASE 
          WHEN u.fechafinsesion IS NULL THEN 0
          WHEN u.fechafinsesion >= NOW() - INTERVAL '1 minute' THEN 0
          ELSE 0
        END AS enlinea
      FROM usuario u
      INNER JOIN rol r ON u.idrol = r.idrol
      WHERE 1=1
    `;
    
    const values = [];
    
    if (estado !== undefined) {
      query += ' AND u.estado = ?';
      values.push(parseInt(estado));
    }
    
    if (rol !== undefined) {
      query += ' AND u.idRol = ?';
      values.push(parseInt(rol));
    }
    
    query += ' ORDER BY u.fechaHoraCreacion DESC';
    
    console.log('📋 Ejecutando query para listar usuarios con filtros:', { estado, rol });
    const [usuarios] = await pool.query(query, values);
    
    // Determinar quién está en línea basado en el ID del usuario autenticado
    const usuarioAutenticadoId = req.usuario.idUsuario;
    const usuariosConEstadoSesion = usuarios.map(u => ({
      ...u,
      enSesion: u.idUsuario === usuarioAutenticadoId ? 1 : 0
    }));
    
    console.log('✅ Usuarios encontrados:', usuariosConEstadoSesion.length);
    console.log('🔐 Usuario autenticado:', usuarioAutenticadoId);
    
    res.json({ usuarios: usuariosConEstadoSesion });
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
});

// Obtener un usuario específico (solo admin)
app.get('/api/usuarios/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [usuario] = await pool.query(
      `SELECT u.idUsuario, u.nombre, u.email, u.telefono, u.fotoPerfil,
        u.direccion, u.fechaNacimiento, u.cargo, u.biografia,
        u.estado, u.fechaHoraCreacion AS fechaCreacion, u.fechaFinSesion,
        u.idRol, r.nombreRol
       FROM Usuario u
       INNER JOIN Rol r ON u.idRol = r.idRol
       WHERE u.idUsuario = ?`,
      [id]
    );
    
    if (usuario.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json({ usuario: usuario[0] });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
});

// Actualizar rol de un usuario (solo admin)
app.patch('/api/usuarios/:id/rol', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { idRol } = req.body;
    
    // Validar que el rol existe
    const [rol] = await pool.query('SELECT * FROM Rol WHERE idRol = ?', [idRol]);
    if (rol.length === 0) {
      return res.status(400).json({ message: 'Rol no válido' });
    }
    
    // No permitir cambiar el rol del propio admin
    if (parseInt(id) === req.usuario.idUsuario) {
      return res.status(400).json({ message: 'No puedes cambiar tu propio rol' });
    }
    
    await pool.query('UPDATE Usuario SET idRol = ? WHERE idUsuario = ?', [idRol, id]);
    
    // Obtener usuario actualizado
    const [usuario] = await pool.query(
      `SELECT u.idUsuario, u.nombre, u.email, u.idRol, r.nombreRol, u.estado
       FROM Usuario u
       INNER JOIN Rol r ON u.idRol = r.idRol
       WHERE u.idUsuario = ?`,
      [id]
    );
    
    res.json({ 
      message: 'Rol actualizado exitosamente', 
      usuario: usuario[0] 
    });
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ message: 'Error al actualizar rol', error: error.message });
  }
});

// Actualizar estado de un usuario (solo admin)
app.patch('/api/usuarios/:id/estado', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    // No permitir desactivar al propio admin
    if (parseInt(id) === req.usuario.idUsuario) {
      return res.status(400).json({ message: 'No puedes cambiar tu propio estado' });
    }
    
    await pool.query('UPDATE Usuario SET estado = ? WHERE idUsuario = ?', [estado ? 1 : 0, id]);
    
    res.json({ 
      message: `Usuario ${estado ? 'activado' : 'desactivado'} exitosamente` 
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
  }
});

// Eliminar usuario (solo admin)
app.delete('/api/usuarios/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // No permitir eliminar al propio admin
    if (parseInt(id) === req.usuario.idUsuario) {
      return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
    }
    
    // Verificar si el usuario tiene ventas asociadas
    const [ventas] = await pool.query('SELECT COUNT(*) as total FROM Venta WHERE idUsuario = ?', [id]);
    
    if (ventas[0].total > 0) {
      // Si tiene ventas, solo desactivar el usuario en lugar de eliminarlo
      await pool.query('UPDATE Usuario SET estado = 0 WHERE idUsuario = ?', [id]);
      return res.json({ 
        message: 'Usuario desactivado (tiene ventas asociadas)', 
        desactivado: true 
      });
    }
    
    // Si no tiene ventas, eliminar completamente
    await pool.query('DELETE FROM Usuario WHERE idUsuario = ?', [id]);
    
    res.json({ 
      message: 'Usuario eliminado exitosamente', 
      eliminado: true 
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
});

// Obtener todos los roles (solo admin)
app.get('/api/roles', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT * FROM Rol ORDER BY idRol');
    res.json({ roles });
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ message: 'Error al obtener roles', error: error.message });
  }
});

// NOTA: Los endpoints de reportes, servicios y cache fueron deshabilitados temporalmente
// Para habilitarlos, descomentar los imports de servicios al inicio del archivo

// ===== RUTA CATCH-ALL PARA SPA (debe ir después de todas las rutas API) =====
// Usa regex en lugar de '*' para compatibilidad con Express 5
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend-react', 'dist', 'index.html'));
});

// 3. Inicia el servidor
const server = app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 JWT configurado: ${JWT_SECRET !== 'inventarioSecretKey2025' ? 'Personalizado ✓' : 'Por defecto (cambiar en producción) ⚠️'}`);
  console.log(`========================================`);
  console.log(`Presiona Ctrl+C para detener el servidor`);
});

// Manejar cierre graceful del servidor
process.on('SIGINT', async () => {
  console.log('\n🔴 Cerrando servidor...');
  server.close();
  await pool.end();
  console.log('✅ Servidor cerrado correctamente');
  process.exit(0);
});