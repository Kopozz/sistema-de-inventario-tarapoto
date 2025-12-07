import { createPool } from 'mysql2/promise';

// Configura los datos de tu conexión a XAMPP
export const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'db_rectificadoraderepuesto',
  charset: 'utf8mb4'
});

console.log('Conectado a la base de datos db_rectificadoraderepuesto');