// Script para probar conexión a Supabase
import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
const { Pool } = pg;

console.log('🔍 Probando conexión a Supabase...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada ✓' : 'NO ENCONTRADA ❌');

if (!process.env.DATABASE_URL) {
  console.log('Variables individuales:');
  console.log('  DB_HOST:', process.env.DB_HOST);
  console.log('  DB_USER:', process.env.DB_USER);
  console.log('  DB_NAME:', process.env.DB_NAME);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

try {
  console.log('\n📡 Intentando conexión...');
  const result = await pool.query('SELECT NOW() as hora');
  console.log('✅ CONEXIÓN EXITOSA!');
  console.log('   Hora del servidor:', result.rows[0].hora);
  
  // Verificar si las tablas existen
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  console.log('\n📋 Tablas encontradas:', tables.rows.length);
  tables.rows.forEach(t => console.log('   -', t.table_name));
  
} catch (error) {
  console.error('❌ ERROR DE CONEXIÓN:');
  console.error('   Mensaje:', error.message);
  console.error('   Código:', error.code);
} finally {
  await pool.end();
  console.log('\n🔌 Conexión cerrada');
}
