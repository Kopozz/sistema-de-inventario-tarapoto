import { pool } from './db.js';

async function elevateUser() {
  try {
    // 1. Get Admin Role ID
    const [roles] = await pool.query('SELECT idRol, nombreRol FROM Rol WHERE nombreRol LIKE ?', ['%Admin%']);
    if (roles.length === 0) {
      console.log('Error: Could not find Admin role');
      process.exit(1);
    }
    const adminRoleId = roles[0].idRol;
    console.log(`Found Admin Role: ${roles[0].nombreRol} (ID: ${adminRoleId})`);

    // 2. Update User
    const [result] = await pool.query(
      'UPDATE Usuario SET idRol = ? WHERE email = ?', 
      [adminRoleId, 'pauljared96@gmail.com']
    );

    if (result.affectedRows > 0) {
      console.log('✅ User Paul Medina updated to Administrator successfully.');
    } else {
      console.log('❌ User not found or already admin.');
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

elevateUser();
