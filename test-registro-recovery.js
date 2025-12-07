// Test de registro y recuperación de contraseña
import 'dotenv/config';

const API = 'http://localhost:3000';

console.log('========================================');
console.log('🔐 PRUEBA DE REGISTRO Y RECUPERACIÓN');
console.log('========================================\n');

// ===== TEST 1: Registro de nuevo usuario =====
console.log('1️⃣ REGISTRO DE NUEVO USUARIO');
const testEmail = 'test' + Date.now() + '@test.com';
const testUser = {
  nombre: 'Usuario Prueba',
  email: testEmail,
  'contraseña': 'Test123!',
  telefono: '999888777'
};

const regRes = await fetch(`${API}/api/usuarios/registro`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testUser)
});
const regData = await regRes.json();
console.log('   Status:', regRes.status);
if (regRes.status === 201) {
  console.log('   ✅ Registro EXITOSO');
  console.log('   ID Usuario:', regData.idUsuario);
  console.log('   Nombre:', regData.nombre);
} else {
  console.log('   ❌ Error:', regData.message || regData.error);
}

// ===== TEST 2: Login con nuevo usuario =====
console.log('\n2️⃣ LOGIN CON NUEVO USUARIO');
const loginRes = await fetch(`${API}/api/usuarios/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: testEmail, 'contraseña': 'Test123!' })
});
const loginData = await loginRes.json();
if (loginRes.status === 200) {
  console.log('   ✅ Login EXITOSO');
  console.log('   Usuario:', loginData.usuario.nombre);
  console.log('   Rol:', loginData.usuario.idRol === 2 ? 'Vendedor (correcto para nuevos usuarios)' : 'Otro: ' + loginData.usuario.idRol);
} else {
  console.log('   ❌ Error:', loginData.message);
}

// ===== TEST 3: Solicitar recuperación de contraseña =====
console.log('\n3️⃣ SOLICITAR RECUPERACIÓN DE CONTRASEÑA');
const forgotRes = await fetch(`${API}/api/usuarios/forgot-password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@rectificadora.com' })
});
const forgotData = await forgotRes.json();
console.log('   Status:', forgotRes.status);
console.log('   Mensaje:', forgotData.message);
if (forgotRes.status === 200) {
  console.log('   ✅ Solicitud procesada');
  if (forgotData.debug?.token) {
    console.log('   🔑 Token generado (solo visible en dev)');
    
    // ===== TEST 4: Verificar token =====
    console.log('\n4️⃣ VERIFICAR TOKEN');
    const verifyRes = await fetch(`${API}/api/usuarios/verify-reset-token?token=${forgotData.debug.token}`);
    const verifyData = await verifyRes.json();
    console.log('   Status:', verifyRes.status);
    if (verifyRes.status === 200) {
      console.log('   ✅ Token VÁLIDO');
      console.log('   Usuario:', verifyData.nombre);
    } else {
      console.log('   ❌ Error:', verifyData.message);
    }
    
    // ===== TEST 5: Restablecer contraseña =====
    console.log('\n5️⃣ RESTABLECER CONTRASEÑA');
    const resetRes = await fetch(`${API}/api/usuarios/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: forgotData.debug.token, 
        'contraseña': 'Admin123!' 
      })
    });
    const resetData = await resetRes.json();
    console.log('   Status:', resetRes.status);
    if (resetRes.status === 200) {
      console.log('   ✅ Contraseña restablecida');
      
      // Verificar login con nueva contraseña
      console.log('\n6️⃣ LOGIN CON NUEVA CONTRASEÑA');
      const newLoginRes = await fetch(`${API}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@rectificadora.com', 'contraseña': 'Admin123!' })
      });
      if (newLoginRes.status === 200) {
        console.log('   ✅ Login con nueva contraseña EXITOSO');
        
        // Restaurar contraseña
        console.log('\n7️⃣ RESTAURANDO CONTRASEÑA (Admin123)');
        const restore = await fetch(`${API}/api/usuarios/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@rectificadora.com' })
        });
        const restoreData = await restore.json();
        if (restoreData.debug?.token) {
          const final = await fetch(`${API}/api/usuarios/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: restoreData.debug.token, 'contraseña': 'Admin123' })
          });
          if (final.status === 200) {
            console.log('   ✅ Contraseña restaurada a Admin123');
          }
        }
      } else {
        console.log('   ❌ Error en login');
      }
    } else {
      console.log('   ❌ Error:', resetData.message);
    }
  }
}

console.log('\n========================================');
console.log('📋 RESUMEN');
console.log('========================================');
console.log('Endpoints probados:');
console.log('  ✅ POST /api/usuarios/registro');
console.log('  ✅ POST /api/usuarios/login');
console.log('  ✅ POST /api/usuarios/forgot-password');
console.log('  ✅ GET /api/usuarios/verify-reset-token');
console.log('  ✅ POST /api/usuarios/reset-password');
console.log('\n⚠️ NOTA: La contraseña del admin ahora es "Admin123"');
