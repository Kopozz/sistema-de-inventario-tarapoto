// Test endpoints
import 'dotenv/config';

async function getToken() {
  const res = await fetch('http://localhost:3000/api/usuarios/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@rectificadora.com', contraseña: 'admin123' })
  });
  const data = await res.json();
  return data.token;
}

const token = await getToken();

// Test categorias
console.log('\n=== CATEGORÍAS ===');
const catRes = await fetch('http://localhost:3000/api/categorias', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const catData = await catRes.json();
console.log('Status:', catRes.status);
console.log('Data:', JSON.stringify(catData, null, 2));

// Test productos
console.log('\n=== PRODUCTOS (primeros 2) ===');
const prodRes = await fetch('http://localhost:3000/api/productos', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const prodData = await prodRes.json();
console.log('Status:', prodRes.status);
console.log('Total:', prodData.productos?.length);
if (prodData.productos?.[0]) {
  console.log('Primer producto:', JSON.stringify(prodData.productos[0], null, 2));
}

// Test dashboard
console.log('\n=== DASHBOARD ===');
const dashRes = await fetch('http://localhost:3000/api/estadisticas/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const dashData = await dashRes.json();
console.log('Status:', dashRes.status);
console.log('Data:', JSON.stringify(dashData, null, 2));
