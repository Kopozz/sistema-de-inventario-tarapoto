import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
const { Pool } = pg;

// Mapeo de columnas minúsculas a camelCase
const columnMap = {
  // Usuario
  idusuario: 'idUsuario',
  nombrecompleto: 'nombreCompleto',
  'contraseña': 'contraseña',
  fotoperfil: 'fotoPerfil',
  fechanacimiento: 'fechaNacimiento',
  fechahoracreacion: 'fechaHoraCreacion',
  fechafinsesion: 'fechaFinSesion',
  idrol: 'idRol',
  resettoken: 'resetToken',
  resettokenexpiry: 'resetTokenExpiry',
  // Rol
  idrol: 'idRol',
  nombrerol: 'nombreRol',
  // Categoria
  idcategoria: 'idCategoria',
  codigoprefix: 'codigoPrefix',
  totalproductos: 'totalProductos',
  // Proveedor
  idproveedor: 'idProveedor',
  nombrecontacto: 'nombreContacto',
  // Producto
  idproducto: 'idProducto',
  modelocompatible: 'modeloCompatible',
  precioventa: 'precioVenta',
  preciocompra: 'precioCompra',
  stockactual: 'stockActual',
  stockminimo: 'stockMinimo',
  fechaactualizacion: 'fechaActualizacion',
  fecharegistro: 'fechaRegistro',
  nombrecategoria: 'nombreCategoria',
  nombreproveedor: 'nombreProveedor',
  // Venta
  idventa: 'idVenta',
  clientedocumento: 'clienteDocumento',
  clientenombre: 'clienteNombre',
  metodopago: 'metodoPago',
  numeroventa: 'numeroVenta',
  montototal: 'montoTotal',
  fechahora: 'fechaHora',
  idcliente: 'idCliente',
  // DetalleVenta
  iddetalleventa: 'idDetalleVenta',
  precioventaunitario: 'precioVentaUnitario',
  // MovimientoInventario
  idmovimientoinventario: 'idMovimientoInventario',
  tipomovimiento: 'tipoMovimiento',
  preciounitario: 'precioUnitario',
  // Aliases comunes
  totalvendido: 'totalVendido',
  ingresototal: 'ingresoTotal',
  fechacreacion: 'fechaCreacion',
  enlinea: 'enLinea',
  ensesion: 'enSesion'
};

// Función para transformar un objeto (row) de minúsculas a camelCase
function transformRow(row) {
  if (!row || typeof row !== 'object') return row;
  
  const transformed = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = columnMap[key.toLowerCase()] || key;
    transformed[camelKey] = value;
  }
  return transformed;
}

// Función para transformar array de rows
function transformRows(rows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map(transformRow);
}

// Configuración de conexión
let poolConfig;

if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  };
  console.log('✅ Usando DATABASE_URL para conexión PostgreSQL');
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'db_rectificadoraderepuesto'
  };
  console.log('✅ Usando variables individuales para conexión PostgreSQL');
}

const originalPool = new Pool(poolConfig);

// Pool wrapper con transformación automática
export const pool = {
  query: async (text, params) => {
    // Convertir ? a $1, $2, etc.
    let paramIndex = 0;
    const convertedText = text.replace(/\?/g, () => `$${++paramIndex}`);
    
    try {
      const result = await originalPool.query(convertedText, params);
      // Transformar nombres de columnas
      const transformedRows = transformRows(result.rows);
      return [transformedRows, result.fields];
    } catch (error) {
      console.error('❌ Error en query PostgreSQL:', error.message);
      console.error('   Query:', convertedText.substring(0, 150));
      throw error;
    }
  },
  
  getConnection: async () => {
    const client = await originalPool.connect();
    return {
      query: async (text, params) => {
        let paramIndex = 0;
        const convertedText = text.replace(/\?/g, () => `$${++paramIndex}`);
        const result = await client.query(convertedText, params);
        return [transformRows(result.rows), result.fields];
      },
      beginTransaction: () => client.query('BEGIN'),
      commit: () => client.query('COMMIT'),
      rollback: () => client.query('ROLLBACK'),
      release: () => client.release()
    };
  },
  
  end: () => originalPool.end()
};

console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);