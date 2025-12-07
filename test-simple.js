// Test simplificado
import 'dotenv/config';

const API = 'http://localhost:3000';

console.log('=== TEST REGISTRO ===');

try {
  const res = await fetch(`${API}/api/usuarios/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      nombre: 'Test User',
      email: 'test' + Date.now() + '@test.com',
      'contraseña': 'Test123!',
      telefono: '999888777'
    })
  });
  
  console.log('Status:', res.status);
  console.log('Headers:', res.headers.get('content-type'));
  
  const text = await res.text();
  console.log('Response:', text.substring(0, 200));
} catch (e) {
  console.error('Error:', e.message);
}
