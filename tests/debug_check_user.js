import { pool } from './db.js';

async function checkUser() {
  try {
    const [rows] = await pool.query(
      'SELECT idUsuario, email, resetToken, resetTokenExpiry, NOW() as dbTime FROM Usuario WHERE email = ?',
      ['pauljared96@gmail.com']
    );
    console.log('User State:', rows[0]);
    console.log('Node Time:', new Date());
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}
checkUser();
