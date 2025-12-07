// Script para ACTUALIZAR productos existentes con imágenes
// Ejecutar con: node actualizar_imagenes.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'http://localhost:3000';

async function login() {
  const response = await fetch(`${API_BASE}/api/usuarios/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@rectificadora.com',
      contraseña: 'admin123'
    })
  });
  const data = await response.json();
  return data.token;
}

function imageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).slice(1);
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    console.log(`⚠️ No se encontró imagen: ${imagePath}`);
    return null;
  }
}

async function obtenerProductos(token) {
  const response = await fetch(`${API_BASE}/api/productos`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data.productos || [];
}

async function actualizarProducto(token, idProducto, imagen) {
  const response = await fetch(`${API_BASE}/api/productos/${idProducto}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ imagen })
  });
  return response.ok;
}

const IMAGES_DIR = 'C:/Users/User/.gemini/antigravity/brain/ddf3559d-2a45-4f3e-8b3d-af1d86778283';

// Mapeo de códigos de producto a imágenes
const imagenPorCodigo = {
  'MOT-001': 'piston_150cc',
  'MOT-002': 'piston_rings',
  'FRE-001': 'brake_pads',
  'FRE-003': 'brake_disc',
  'TRA-001': 'chain_kit',
  'ELE-001': 'spark_plug',
  'ELE-004': 'battery_12v',
  'SUS-001': 'rear_shock'
};

async function main() {
  console.log('🚀 Actualizando productos con imágenes...\n');
  
  // Login
  console.log('🔐 Iniciando sesión...');
  const token = await login();
  if (!token) {
    console.error('❌ Error al iniciar sesión');
    return;
  }
  console.log('✅ Sesión iniciada\n');

  // Obtener productos existentes
  const productos = await obtenerProductos(token);
  console.log(`📦 Productos encontrados: ${productos.length}\n`);

  // Buscar archivos de imagen
  const files = fs.readdirSync(IMAGES_DIR);
  const imageFiles = files.filter(f => f.endsWith('.png'));
  console.log(`🖼️ Imágenes disponibles: ${imageFiles.length}\n`);

  let actualizados = 0;

  for (const producto of productos) {
    const imagenKey = imagenPorCodigo[producto.codigo];
    
    if (imagenKey) {
      const imagenFile = imageFiles.find(f => f.includes(imagenKey));
      
      if (imagenFile) {
        const imagePath = path.join(IMAGES_DIR, imagenFile);
        const imagen = imageToBase64(imagePath);
        
        if (imagen) {
          const exito = await actualizarProducto(token, producto.idProducto, imagen);
          if (exito) {
            console.log(`✅ ${producto.codigo} - ${producto.nombre} 🖼️`);
            actualizados++;
          } else {
            console.log(`❌ ${producto.codigo} - Error al actualizar`);
          }
        }
      }
    }
  }

  console.log(`\n✅ Proceso completado! ${actualizados} productos actualizados con imagen`);
  console.log('🌐 Abre http://localhost:5174 para ver los productos');
}

main().catch(console.error);
