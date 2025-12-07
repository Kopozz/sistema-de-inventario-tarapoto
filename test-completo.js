// Test exhaustivo de todos los endpoints principales
import 'dotenv/config';

const API = 'http://localhost:3000';
let token = '';
let errores = [];
let exitosos = [];

async function test(nombre, url, options = {}) {
  try {
    const res = await fetch(`${API}${url}`, {
      ...options,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers }
    });
    const data = await res.json();
    
    if (res.ok) {
      exitosos.push(`✅ ${nombre}`);
      return data;
    } else {
      errores.push(`❌ ${nombre}: ${data.message || data.error}`);
      return null;
    }
  } catch (e) {
    errores.push(`❌ ${nombre}: ${e.message}`);
    return null;
  }
}

// Login
console.log('🔐 Iniciando sesión...');
const loginRes = await fetch(`${API}/api/usuarios/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@rectificadora.com', contraseña: 'admin123' })
});
const loginData = await loginRes.json();
if (loginData.token) {
  token = loginData.token;
  exitosos.push('✅ Login');
  console.log('   Usuario:', loginData.usuario.nombre, '| Rol ID:', loginData.usuario.idRol);
} else {
  errores.push('❌ Login: ' + loginData.message);
}

console.log('\n📊 Probando endpoints...\n');

// Categorías
const cats = await test('GET /api/categorias', '/api/categorias');
if (cats?.categorias) console.log('   Categorías:', cats.categorias.length);

// Productos
const prods = await test('GET /api/productos', '/api/productos');
if (prods?.productos) {
  console.log('   Productos:', prods.productos.length);
  if (prods.productos[0]) {
    console.log('   Ejemplo: precioVenta=' + prods.productos[0].precioVenta + ', stock=' + prods.productos[0].stockActual);
  }
}

// Proveedores
const provs = await test('GET /api/proveedores', '/api/proveedores');
if (provs?.proveedores) console.log('   Proveedores:', provs.proveedores.length);

// Dashboard
const dash = await test('GET /api/estadisticas/dashboard', '/api/estadisticas/dashboard');
if (dash) {
  console.log('   Dashboard: productos=' + dash.totalProductos + ', valorInventario=' + dash.valorInventario);
}

// Ventas
const ventas = await test('GET /api/ventas', '/api/ventas');
if (ventas?.ventas !== undefined) console.log('   Ventas:', ventas.ventas.length);

// Usuarios (solo admin)
const users = await test('GET /api/usuarios', '/api/usuarios');
if (users?.usuarios) console.log('   Usuarios:', users.usuarios.length);

// Roles
const roles = await test('GET /api/roles', '/api/roles');
if (roles?.roles) console.log('   Roles:', roles.roles.length);

// Perfil
const perfil = await test('GET /api/usuarios/perfil', '/api/usuarios/perfil');
if (perfil?.usuario) console.log('   Mi perfil: ' + perfil.usuario.nombre + ' (idRol: ' + perfil.usuario.idRol + ')');

// Reportes - stock bajo
const stockBajo = await test('GET /api/estadisticas/stock-bajo', '/api/estadisticas/stock-bajo');
if (stockBajo?.productos !== undefined) console.log('   Stock bajo:', stockBajo.productos.length);

// Resumen
console.log('\n========================================');
console.log('📊 RESUMEN DE PRUEBAS');
console.log('========================================');
console.log(`✅ Exitosos: ${exitosos.length}`);
console.log(`❌ Errores: ${errores.length}`);

if (errores.length > 0) {
  console.log('\n⚠️ ERRORES:');
  errores.forEach(e => console.log('  ' + e));
}

console.log('\n' + (errores.length === 0 ? '🎉 TODOS LOS ENDPOINTS FUNCIONAN!' : '⚠️ Hay errores que corregir'));
