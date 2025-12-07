const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Configuración
const API_BASE = 'http://localhost:3000';
const IMAGES_PATH = 'C:/Users/User/.gemini/antigravity/brain/ddf3559d-2a45-4f3e-8b3d-af1d86778283';

// Simple HTTP client
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });
    
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// Productos de Carrocería
const productosCarroceria = [
  {
    codigo: 'CAR-001',
    nombre: 'Espejo Retrovisor Universal',
    descripcion: 'Espejo retrovisor cromado con montaje negro, compatible con la mayoría de motos',
    imageFile: 'espejo_moto_1764958736308.png',
    marca: 'Generico',
    modeloCompatible: 'Universal',
    ubicacion: 'C-1-01',
    precioCompra: 15.00,
    precioVenta: 28.00,
    stockActual: 25,
    stockMinimo: 8,
    idCategoria: 6 // Carrocería
  },
  {
    codigo: 'CAR-002',
    nombre: 'Manubrio Aluminio Racing',
    descripcion: 'Manubrio de aluminio 22mm estilo racing, acabado plata',
    imageFile: 'manubrio_moto_1764958751196.png',
    marca: 'ProRace',
    modeloCompatible: 'Universal 22mm',
    ubicacion: 'C-1-02',
    precioCompra: 35.00,
    precioVenta: 65.00,
    stockActual: 12,
    stockMinimo: 5,
    idCategoria: 6
  },
  {
    codigo: 'CAR-003',
    nombre: 'Carenado Lateral Deportivo',
    descripcion: 'Panel de carenado lateral negro brillante, estilo deportivo',
    imageFile: 'carenado_moto_1764958764772.png',
    marca: 'SportLine',
    modeloCompatible: 'CBR150/YZF-R15',
    ubicacion: 'C-2-01',
    precioCompra: 55.00,
    precioVenta: 95.00,
    stockActual: 8,
    stockMinimo: 3,
    idCategoria: 6
  },
  {
    codigo: 'CAR-004',
    nombre: 'Guardafango Delantero',
    descripcion: 'Guardafango plástico negro, protección frontal universal',
    imageFile: 'guardafango_moto_1764958779583.png',
    marca: 'Generico',
    modeloCompatible: 'Universal',
    ubicacion: 'C-2-02',
    precioCompra: 18.00,
    precioVenta: 35.00,
    stockActual: 20,
    stockMinimo: 6,
    idCategoria: 6
  },
  {
    codigo: 'CAR-005',
    nombre: 'Asiento Completo Negro',
    descripcion: 'Asiento de moto tapizado en cuero sintético negro',
    imageFile: 'asiento_moto_1764958803031.png',
    marca: 'ComfortRide',
    modeloCompatible: 'CG125/CG150',
    ubicacion: 'C-3-01',
    precioCompra: 45.00,
    precioVenta: 85.00,
    stockActual: 10,
    stockMinimo: 4,
    idCategoria: 6
  },
  {
    codigo: 'CAR-006',
    nombre: 'Tapa Lateral Izquierda',
    descripcion: 'Cubierta lateral izquierda plástica brillante',
    imageFile: 'tapa_lateral_1764958816662.png',
    marca: 'OEM',
    modeloCompatible: 'Bajaj Pulsar',
    ubicacion: 'C-3-02',
    precioCompra: 25.00,
    precioVenta: 48.00,
    stockActual: 15,
    stockMinimo: 5,
    idCategoria: 6
  }
];

// Función para convertir imagen a base64
function imageToBase64(imagePath) {
  try {
    const fullPath = path.join(IMAGES_PATH, imagePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️ Imagen no encontrada: ${fullPath}`);
      return null;
    }
    const imageBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(imagePath).toLowerCase().slice(1);
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const base64 = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
    console.log(`✅ Imagen cargada: ${imagePath} (${(base64.length / 1024).toFixed(1)} KB)`);
    return base64;
  } catch (error) {
    console.error(`❌ Error al cargar imagen ${imagePath}:`, error.message);
    return null;
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando inserción de productos de Carrocería...\n');
  
  // Login
  console.log('🔐 Iniciando sesión...');
  const loginRes = await httpRequest(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@rectificadora.com', password: 'admin123' })
  });
  
  if (!loginRes.ok) {
    throw new Error('Error al iniciar sesión');
  }
  
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('✅ Sesión iniciada\n');
  
  // Insertar productos
  let exitos = 0;
  let errores = 0;
  
  for (const producto of productosCarroceria) {
    console.log(`📦 Insertando: ${producto.codigo} - ${producto.nombre}`);
    
    const imagen = imageToBase64(producto.imageFile);
    
    const payload = {
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      imagen: imagen,
      marca: producto.marca,
      modeloCompatible: producto.modeloCompatible,
      ubicacion: producto.ubicacion,
      precioCompra: producto.precioCompra,
      precioVenta: producto.precioVenta,
      stockActual: producto.stockActual,
      stockMinimo: producto.stockMinimo,
      idCategoria: producto.idCategoria,
      idProveedor: 1
    };
    
    try {
      const res = await httpRequest(`${API_BASE}/api/productos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        console.log(`   ✅ Producto creado exitosamente`);
        exitos++;
      } else {
        const error = await res.json();
        console.log(`   ❌ Error: ${error.message || error.mensaje || 'Error desconocido'}`);
        errores++;
      }
    } catch (error) {
      console.log(`   ❌ Error de conexión: ${error.message}`);
      errores++;
    }
    
    console.log('');
  }
  
  console.log('═'.repeat(50));
  console.log(`📊 RESUMEN:`);
  console.log(`   ✅ Productos creados: ${exitos}`);
  console.log(`   ❌ Errores: ${errores}`);
  console.log('═'.repeat(50));
}

main().catch(console.error);
