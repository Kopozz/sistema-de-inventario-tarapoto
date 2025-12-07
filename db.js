import pg from 'pg';
const { Pool } = pg;

// Configuración de conexión a PostgreSQL
// En desarrollo usa variables individuales, en producción usa DATABASE_URL
const isProduction = process.env.NODE_ENV === 'production';

let pool;

if (isProduction && process.env.DATABASE_URL) {
  // Railway proporciona DATABASE_URL automáticamente
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // Desarrollo local o variables individuales
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'db_rectificadoraderepuesto'
  });
}

// Wrapper para mantener compatibilidad con el código existente
// En mysql2 las queries devuelven [rows, fields], en pg devuelve { rows }
const query = async (text, params) => {
  const result = await pool.query(text, params);
  return [result.rows, result.fields];
};

// Exportar pool y función query compatible
export { pool, query };

// Función para obtener una conexión del pool (para transacciones)
export const getConnection = async () => {
  const client = await pool.connect();
  return {
    query: async (text, params) => {
      const result = await client.query(text, params);
      return [result.rows, result.fields];
    },
    beginTransaction: () => client.query('BEGIN'),
    commit: () => client.query('COMMIT'),
    rollback: () => client.query('ROLLBACK'),
    release: () => client.release()
  };
};

// Override pool.query para compatibilidad
pool.query = async (text, params) => {
  // Convertir placeholders de ? a $1, $2, etc.
  let paramIndex = 0;
  const convertedText = text.replace(/\?/g, () => `$${++paramIndex}`);
  
  const result = await pool.connect().then(async client => {
    try {
      const res = await client.query(convertedText, params);
      return res;
    } finally {
      client.release();
    }
  });
  
  return [result.rows, result.fields];
};

// Emular getConnection para compatibilidad con transacciones
pool.getConnection = async () => {
  const client = await pool.connect();
  return {
    query: async (text, params) => {
      let paramIndex = 0;
      const convertedText = text.replace(/\?/g, () => `$${++paramIndex}`);
      const result = await client.query(convertedText, params);
      return [result.rows, result.fields];
    },
    beginTransaction: () => client.query('BEGIN'),
    commit: () => client.query('COMMIT'),
    rollback: () => client.query('ROLLBACK'),
    release: () => client.release()
  };
};

console.log('✅ Conexión PostgreSQL configurada');
console.log(`📍 Entorno: ${isProduction ? 'production' : 'development'}`);