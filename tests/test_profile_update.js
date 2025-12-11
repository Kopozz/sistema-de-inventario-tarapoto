// Test para verificar actualización de perfil
import 'dotenv/config';

const API = 'http://localhost:3000';

async function testProfileUpdate() {
  try {
    // 1. Primero hacer login para obtener token
    console.log('🔐 Iniciando sesión...');
    const loginRes = await fetch(`${API}/api/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@rectificadora.com',
        'contraseña': 'admin123'
      })
    });

    if (!loginRes.ok) {
      const error = await loginRes.json();
      console.error('❌ Error en login:', error);
      return;
    }

    const loginData = await loginRes.json();
    console.log('✅ Login exitoso, token obtenido');

    // 2. Probar actualización de perfil
    console.log('\n📝 Probando actualización de perfil...');
    const profileRes = await fetch(`${API}/api/usuarios/perfil`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        nombre: 'Administrador',
        telefono: '123456789'
      })
    });

    console.log('📨 Status:', profileRes.status);
    
    const responseText = await profileRes.text();
    console.log('📄 Respuesta raw:', responseText);

    try {
      const profileData = JSON.parse(responseText);
      if (profileRes.ok) {
        console.log('✅ Perfil actualizado exitosamente:', profileData);
      } else {
        console.error('❌ Error al actualizar perfil:', profileData);
      }
    } catch (parseError) {
      console.error('❌ Error parseando respuesta:', parseError.message);
    }

  } catch (error) {
    console.error('❌ Error completo:', error);
  }
}

testProfileUpdate();
