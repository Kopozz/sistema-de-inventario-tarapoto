import { pool } from './db.js';

async function findUser() {
  try {
    const [rows] = await pool.query('SELECT * FROM Usuario WHERE nombre LIKE ? OR nombreCompleto LIKE ?', ['%Paul%', '%Paul%']);
    console.log('Found users:', rows);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

findUser();
