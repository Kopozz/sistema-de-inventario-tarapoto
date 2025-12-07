import { pool } from './db.js';
import crypto from 'crypto';

async function debugReset() {
  const email = 'pauljared96@gmail.com';
  const newPassword = 'NewPassword123!';
  
  try {
    console.log('1. Setting valid token in DB...');
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour
    
    // Ensure the date is formatted for MySQL if needed, or rely on driver
    // MySQL driver usually handles JS Date objects correctly
    
    await pool.query(
      'UPDATE Usuario SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?',
      [token, expiry, email]
    );
    console.log(`   Token set: ${token}`);

    console.log('2. Calling reset-password API...');
    try {
      const response = await fetch('http://localhost:3000/api/usuarios/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          contraseña: newPassword
        })
      });

      const data = await response.json();
      console.log('   Response Status:', response.status);
      console.log('   Response Data:', data);

    } catch (apiError) {
      console.error('   Fetch Error:', apiError);
    }

  } catch (error) {
    console.error('Script Error:', error);
  } finally {
    process.exit();
  }
}

debugReset();
