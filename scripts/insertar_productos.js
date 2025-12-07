// Script para insertar productos con imágenes via API
// Ejecutar con: node insertar_productos.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'http://localhost:3000';

// Primero hacer login para obtener token
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

// Convertir imagen a base64
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

// Crear categoría
async function crearCategoria(token, categoria) {
  const response = await fetch(`${API_BASE}/api/categorias`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(categoria)
  });
  const data = await response.json();
  return data;
}

// Obtener categorías existentes
async function obtenerCategorias(token) {
  const response = await fetch(`${API_BASE}/api/categorias`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data.categorias || [];
}

// Crear producto
async function crearProducto(token, producto) {
  const response = await fetch(`${API_BASE}/api/productos`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(producto)
  });
  const data = await response.json();
  return data;
}

// Directorio de imágenes
const IMAGES_DIR = 'C:/Users/User/.gemini/antigravity/brain/ddf3559d-2a45-4f3e-8b3d-af1d86778283';

async function main() {
  console.log('🚀 Insertando productos con imágenes...\n');
  
  // Login
  console.log('🔐 Iniciando sesión...');
  const token = await login();
  if (!token) {
    console.error('❌ Error al iniciar sesión');
    return;
  }
  console.log('✅ Sesión iniciada\n');

  // Obtener categorías existentes
  let categorias = await obtenerCategorias(token);
  
  // Si no hay categorías, crearlas
  if (categorias.length === 0) {
    console.log('📁 Creando categorías...');
    const categoriasData = [
      { nombre: 'Motor', descripcion: 'Repuestos de motor: pistones, anillos, bielas' },
      { nombre: 'Frenos', descripcion: 'Sistema de frenado: pastillas, discos, zapatas' },
      { nombre: 'Transmision', descripcion: 'Cadenas, piñones, coronas, kit de arrastre' },
      { nombre: 'Electrico', descripcion: 'Bujias, bobinas, reguladores, baterias' },
      { nombre: 'Suspension', descripcion: 'Amortiguadores, horquillas, rodamientos' }
    ];
    
    for (const cat of categoriasData) {
      const result = await crearCategoria(token, cat);
      console.log(`  ✅ ${cat.nombre}: ID ${result.idCategoria || 'ya existe'}`);
    }
    
    // Recargar categorías
    categorias = await obtenerCategorias(token);
  }
  
  console.log(`\n📋 Categorías disponibles: ${categorias.length}`);
  
  // Mapear categorías por nombre
  const catMap = {};
  for (const cat of categorias) {
    catMap[cat.nombre.toLowerCase()] = cat.idCategoria;
  }
  
  // Buscar imágenes generadas
  const files = fs.readdirSync(IMAGES_DIR);
  const imageFiles = files.filter(f => f.endsWith('.png'));
  console.log(`\n🖼️ Imágenes encontradas: ${imageFiles.length}`);
  
  // Productos a insertar con sus imágenes
  const productos = [
    {
      codigo: 'MOT-001',
      nombre: 'Piston STD 150cc',
      descripcion: 'Piston estandar para motos 150cc de alta calidad',
      marca: 'Honda',
      modeloCompatible: 'CG150/CBF150',
      ubicacion: 'A-1-01',
      precioCompra: 45.00,
      precioVenta: 75.00,
      stockActual: 25,
      stockMinimo: 5,
      categoria: 'motor',
      imagenFile: imageFiles.find(f => f.includes('piston_150cc'))
    },
    {
      codigo: 'MOT-002',
      nombre: 'Kit de Anillos 150cc',
      descripcion: 'Juego de anillos para piston 150cc',
      marca: 'Honda',
      modeloCompatible: 'CG150/CBF150',
      ubicacion: 'A-1-02',
      precioCompra: 18.00,
      precioVenta: 35.00,
      stockActual: 40,
      stockMinimo: 10,
      categoria: 'motor',
      imagenFile: imageFiles.find(f => f.includes('piston_rings'))
    },
    {
      codigo: 'FRE-001',
      nombre: 'Pastillas de Freno Delantero',
      descripcion: 'Juego de pastillas disco delantero alta duracion',
      marca: 'Yamaha',
      modeloCompatible: 'FZ/Fazer',
      ubicacion: 'B-2-01',
      precioCompra: 22.00,
      precioVenta: 40.00,
      stockActual: 35,
      stockMinimo: 10,
      categoria: 'frenos',
      imagenFile: imageFiles.find(f => f.includes('brake_pads'))
    },
    {
      codigo: 'FRE-003',
      nombre: 'Disco de Freno Delantero',
      descripcion: 'Disco ventilado 240mm alta performance',
      marca: 'Honda',
      modeloCompatible: 'CB190R',
      ubicacion: 'B-2-03',
      precioCompra: 65.00,
      precioVenta: 110.00,
      stockActual: 8,
      stockMinimo: 2,
      categoria: 'frenos',
      imagenFile: imageFiles.find(f => f.includes('brake_disc'))
    },
    {
      codigo: 'TRA-001',
      nombre: 'Kit de Arrastre Completo',
      descripcion: 'Cadena DID + Piñon + Corona premium',
      marca: 'DID',
      modeloCompatible: 'Honda CG150',
      ubicacion: 'C-3-01',
      precioCompra: 85.00,
      precioVenta: 150.00,
      stockActual: 15,
      stockMinimo: 4,
      categoria: 'transmision',
      imagenFile: imageFiles.find(f => f.includes('chain_kit'))
    },
    {
      codigo: 'ELE-001',
      nombre: 'Bujia NGK CR7HSA',
      descripcion: 'Bujia de encendido original NGK',
      marca: 'NGK',
      modeloCompatible: 'Universal 4T',
      ubicacion: 'D-4-01',
      precioCompra: 8.00,
      precioVenta: 18.00,
      stockActual: 100,
      stockMinimo: 30,
      categoria: 'electrico',
      imagenFile: imageFiles.find(f => f.includes('spark_plug'))
    },
    {
      codigo: 'ELE-004',
      nombre: 'Bateria 12V 5Ah',
      descripcion: 'Bateria sellada libre mantenimiento Yuasa',
      marca: 'Yuasa',
      modeloCompatible: 'Universal',
      ubicacion: 'D-4-04',
      precioCompra: 55.00,
      precioVenta: 95.00,
      stockActual: 10,
      stockMinimo: 3,
      categoria: 'electrico',
      imagenFile: imageFiles.find(f => f.includes('battery_12v'))
    },
    {
      codigo: 'SUS-001',
      nombre: 'Amortiguador Trasero',
      descripcion: 'Amortiguador trasero 320mm reforzado',
      marca: 'Generico',
      modeloCompatible: 'Universal',
      ubicacion: 'E-5-01',
      precioCompra: 45.00,
      precioVenta: 85.00,
      stockActual: 14,
      stockMinimo: 4,
      categoria: 'suspension',
      imagenFile: imageFiles.find(f => f.includes('rear_shock'))
    }
  ];
  
  console.log('\n📦 Insertando productos...\n');
  
  for (const prod of productos) {
    // Obtener imagen base64
    let imagen = null;
    if (prod.imagenFile) {
      const imagePath = path.join(IMAGES_DIR, prod.imagenFile);
      imagen = imageToBase64(imagePath);
    }
    
    const productoData = {
      codigo: prod.codigo,
      nombre: prod.nombre,
      descripcion: prod.descripcion,
      imagen: imagen,
      marca: prod.marca,
      modeloCompatible: prod.modeloCompatible,
      ubicacion: prod.ubicacion,
      precioCompra: prod.precioCompra,
      precioVenta: prod.precioVenta,
      stockActual: prod.stockActual,
      stockMinimo: prod.stockMinimo,
      idCategoria: catMap[prod.categoria] || null
    };
    
    try {
      const result = await crearProducto(token, productoData);
      if (result.idProducto) {
        console.log(`✅ ${prod.codigo} - ${prod.nombre} (ID: ${result.idProducto}) ${imagen ? '🖼️' : ''}`);
      } else {
        console.log(`⚠️ ${prod.codigo} - ${result.message || 'ya existe'}`);
      }
    } catch (error) {
      console.log(`❌ ${prod.codigo} - Error: ${error.message}`);
    }
  }
  
  console.log('\n✅ Proceso completado!');
  console.log('🌐 Abre http://localhost:5174 para ver los productos');
}

main().catch(console.error);
