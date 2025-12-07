// Script para limpiar categorías duplicadas via API
import fs from 'fs';

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

async function getCategorias(token) {
  const response = await fetch(`${API_BASE}/api/categorias`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data.categorias || [];
}

async function getProductos(token) {
  const response = await fetch(`${API_BASE}/api/productos`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data.productos || [];
}

async function updateProducto(token, idProducto, idCategoria) {
  const response = await fetch(`${API_BASE}/api/productos/${idProducto}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ idCategoria })
  });
  return response.ok;
}

async function deleteCategoria(token, idCategoria) {
  const response = await fetch(`${API_BASE}/api/categorias/${idCategoria}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.ok;
}

async function updateCategoria(token, idCategoria, data) {
  const response = await fetch(`${API_BASE}/api/categorias/${idCategoria}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return response.ok;
}

// Categorías definitivas que queremos mantener
const CATEGORIAS_FINALES = {
  'motor': 'Repuestos de motor: pistones, anillos, bielas, valvulas',
  'frenos': 'Sistema de frenado: pastillas, discos, zapatas, cables',
  'transmision': 'Cadenas, piñones, coronas, kit de arrastre',  
  'electrico': 'Sistema electrico: bujias, bobinas, reguladores, baterias',
  'suspension': 'Amortiguadores, horquillas, rodamientos, resortes',
  'carroceria': 'Plasticos, carenados, espejos, manubrios'
};

// Mapeo de prefijo de código a categoría
const CODIGO_A_CATEGORIA = {
  'MOT': 'motor',
  'FRE': 'frenos',
  'TRA': 'transmision',
  'ELE': 'electrico',
  'SUS': 'suspension',
  'CAR': 'carroceria',
  'ROD': 'suspension',
  'REF': 'motor'
};

async function main() {
  console.log('🧹 Limpiando categorías duplicadas...\n');
  
  const token = await login();
  console.log('✅ Sesión iniciada\n');

  // Obtener todas las categorías
  let categorias = await getCategorias(token);
  console.log(`📁 Categorías encontradas: ${categorias.length}`);
  
  categorias.forEach(c => console.log(`   - [${c.idCategoria}] ${c.nombre}`));
  console.log('');

  // Crear mapa de nombre normalizado -> mejor ID
  const mejorIdPorNombre = {};
  for (const cat of categorias) {
    const nombreNorm = cat.nombre.toLowerCase()
      .replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
      .replace('transmision', 'transmision').replace('trasmision', 'transmision')
      .replace('sistema electrico', 'electrico')
      .replace('carroceria y accesorios', 'carroceria');
    
    // Mapear variantes al nombre base
    let nombreBase = nombreNorm;
    if (nombreNorm.includes('motor')) nombreBase = 'motor';
    if (nombreNorm.includes('freno')) nombreBase = 'frenos';
    if (nombreNorm.includes('transm') || nombreNorm.includes('trasm')) nombreBase = 'transmision';
    if (nombreNorm.includes('electri')) nombreBase = 'electrico';
    if (nombreNorm.includes('suspension')) nombreBase = 'suspension';
    if (nombreNorm.includes('carroceri')) nombreBase = 'carroceria';
    
    // Guardar el menor ID para cada nombre base
    if (!mejorIdPorNombre[nombreBase] || cat.idCategoria < mejorIdPorNombre[nombreBase]) {
      mejorIdPorNombre[nombreBase] = cat.idCategoria;
    }
  }
  
  console.log('📌 IDs seleccionados por categoría:');
  Object.entries(mejorIdPorNombre).forEach(([nombre, id]) => {
    if (CATEGORIAS_FINALES[nombre]) {
      console.log(`   - ${nombre}: ID ${id}`);
    }
  });
  console.log('');

  // Obtener productos y reasignarlos
  const productos = await getProductos(token);
  console.log(`📦 Reasignando ${productos.length} productos...\n`);

  for (const producto of productos) {
    const prefijo = producto.codigo?.split('-')[0]?.toUpperCase();
    const categoriaDestino = CODIGO_A_CATEGORIA[prefijo];
    
    if (categoriaDestino && mejorIdPorNombre[categoriaDestino]) {
      const idCategoriaCorrecta = mejorIdPorNombre[categoriaDestino];
      
      if (producto.idCategoria !== idCategoriaCorrecta) {
        const ok = await updateProducto(token, producto.idProducto, idCategoriaCorrecta);
        if (ok) {
          console.log(`   ✅ ${producto.codigo} -> ${categoriaDestino}`);
        }
      }
    }
  }
  console.log('');

  // Ahora eliminar categorías duplicadas
  console.log('🗑️ Eliminando categorías duplicadas...\n');
  
  // Recargar categorías
  categorias = await getCategorias(token);
  
  const idsAMantener = new Set(Object.values(mejorIdPorNombre).filter(id => 
    Object.keys(CATEGORIAS_FINALES).some(nombre => mejorIdPorNombre[nombre] === id)
  ));
  
  for (const cat of categorias) {
    const nombreNorm = cat.nombre.toLowerCase();
    
    // Si es ROCA, eliminar
    if (nombreNorm.includes('roca')) {
      const ok = await deleteCategoria(token, cat.idCategoria);
      console.log(`   🗑️ Eliminada: ${cat.nombre} ${ok ? '✓' : '✗'}`);
      continue;
    }
    
    // Si no es una de las principales o es duplicado, eliminar
    const esCategoriaPrincipal = Object.keys(CATEGORIAS_FINALES).some(nombre => {
      const id = mejorIdPorNombre[nombre];
      return id === cat.idCategoria;
    });
    
    if (!esCategoriaPrincipal) {
      const ok = await deleteCategoria(token, cat.idCategoria);
      console.log(`   🗑️ Eliminada: ${cat.nombre} (duplicada) ${ok ? '✓' : '✗'}`);
    }
  }

  // Actualizar descripciones de las que quedan
  console.log('\n📝 Actualizando descripciones...');
  for (const [nombre, descripcion] of Object.entries(CATEGORIAS_FINALES)) {
    const id = mejorIdPorNombre[nombre];
    if (id) {
      await updateCategoria(token, id, { descripcion });
      console.log(`   ✅ ${nombre}: descripción actualizada`);
    }
  }

  // Verificación final
  console.log('\n--- RESULTADO FINAL ---');
  const categoriasFinales = await getCategorias(token);
  console.log(`\n📁 Categorías finales: ${categoriasFinales.length}`);
  categoriasFinales.forEach(c => console.log(`   [${c.idCategoria}] ${c.nombre}`));

  console.log('\n✅ Limpieza completada!');
}

main().catch(console.error);
