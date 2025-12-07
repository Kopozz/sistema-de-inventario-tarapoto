import dotenv from 'dotenv';
dotenv.config(); // Cargar variables de entorno PRIMERO

import pg from 'pg';
const { Pool } = pg;

// Configuración de conexión a PostgreSQL
// Usa DATABASE_URL si está disponible, sino usa variables individuales

let poolConfig;

if (process.env.DATABASE_URL) {
  // Supabase o Railway proporcionan DATABASE_URL
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
  console.log('✅ Usando DATABASE_URL para conexión PostgreSQL');
} else {
  // Desarrollo local con variables individuales
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

// Crear un objeto pool con métodos compatibles con mysql2
export const pool = {
  // Query con conversión automática de ? a $1, $2, etc.
  query: async (text, params) => {
    let paramIndex = 0;
    const convertedText = text.replace(/\?/g, () => `$${++paramIndex}`);
    
    try {
      const result = await originalPool.query(convertedText, params);
      return [result.rows, result.fields];
    } catch (error) {
      console.error('❌ Error en query PostgreSQL:', error.message);
      console.error('   Query:', convertedText.substring(0, 100));
      throw error;
    }
  },
  
  // Para transacciones - compatible con mysql2 getConnection
  getConnection: async () => {
    const client = await originalPool.connect();
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
  },
  
  // Para cerrar el pool al terminar
  end: () => originalPool.end()
};

console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);