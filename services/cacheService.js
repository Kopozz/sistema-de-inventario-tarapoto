/**
 * Servicio de Caché con Redis
 * Mejora el rendimiento cacheando consultas frecuentes
 */

const Redis = require('ioredis');

// Conexión a Redis (usa variable de entorno de Railway)
let redis = null;
let isConnected = false;

// Tiempos de expiración en segundos
const CACHE_TTL = {
  PRODUCTOS: 300,      // 5 minutos
  CATEGORIAS: 600,     // 10 minutos
  PROVEEDORES: 600,    // 10 minutos
  DASHBOARD: 60,       // 1 minuto
  VENTAS: 120          // 2 minutos
};

/**
 * Inicializar conexión a Redis
 */
function initRedis() {
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL;
  
  if (!redisUrl) {
    console.log('⚠️ Redis URL no configurada, caché deshabilitado');
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      connectTimeout: 10000
    });

    redis.on('connect', () => {
      isConnected = true;
      console.log('✅ Redis conectado correctamente');
    });

    redis.on('error', (err) => {
      console.error('❌ Error de Redis:', err.message);
      isConnected = false;
    });

    redis.on('close', () => {
      isConnected = false;
      console.log('🔌 Redis desconectado');
    });

    redis.connect().catch(err => {
      console.error('❌ No se pudo conectar a Redis:', err.message);
    });

    return redis;
  } catch (error) {
    console.error('❌ Error al inicializar Redis:', error.message);
    return null;
  }
}

/**
 * Obtener valor del caché
 * @param {string} key - Clave del caché
 * @returns {Promise<any|null>} - Valor parseado o null si no existe
 */
async function get(key) {
  if (!redis || !isConnected) return null;
  
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error al obtener caché:', error.message);
    return null;
  }
}

/**
 * Guardar valor en caché
 * @param {string} key - Clave del caché
 * @param {any} value - Valor a guardar
 * @param {number} ttl - Tiempo de vida en segundos
 */
async function set(key, value, ttl = 300) {
  if (!redis || !isConnected) return false;
  
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error al guardar en caché:', error.message);
    return false;
  }
}

/**
 * Eliminar una clave del caché
 * @param {string} key - Clave a eliminar
 */
async function del(key) {
  if (!redis || !isConnected) return false;
  
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Error al eliminar caché:', error.message);
    return false;
  }
}

/**
 * Eliminar múltiples claves por patrón
 * @param {string} pattern - Patrón de claves (ej: "productos:*")
 */
async function delByPattern(pattern) {
  if (!redis || !isConnected) return false;
  
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (error) {
    console.error('Error al eliminar caché por patrón:', error.message);
    return false;
  }
}

/**
 * Invalidar caché de productos (cuando se crea/edita/elimina)
 */
async function invalidateProductos() {
  await delByPattern('productos:*');
  await del('dashboard:stats');
  console.log('🗑️ Caché de productos invalidado');
}

/**
 * Invalidar caché de categorías
 */
async function invalidateCategorias() {
  await delByPattern('categorias:*');
  await invalidateProductos(); // Los productos dependen de categorías
  console.log('🗑️ Caché de categorías invalidado');
}

/**
 * Invalidar caché de proveedores
 */
async function invalidateProveedores() {
  await delByPattern('proveedores:*');
  console.log('🗑️ Caché de proveedores invalidado');
}

/**
 * Invalidar caché de ventas
 */
async function invalidateVentas() {
  await delByPattern('ventas:*');
  await del('dashboard:stats');
  console.log('🗑️ Caché de ventas invalidado');
}

/**
 * Verificar si Redis está conectado
 */
function isRedisConnected() {
  return isConnected;
}

/**
 * Cerrar conexión a Redis
 */
async function closeRedis() {
  if (redis) {
    await redis.quit();
    console.log('🔌 Conexión Redis cerrada');
  }
}

module.exports = {
  initRedis,
  get,
  set,
  del,
  delByPattern,
  invalidateProductos,
  invalidateCategorias,
  invalidateProveedores,
  invalidateVentas,
  isRedisConnected,
  closeRedis,
  CACHE_TTL
};
