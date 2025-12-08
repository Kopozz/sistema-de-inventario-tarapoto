/**
 * Servicio de Cron Jobs
 * Ejecuta tareas programadas automáticamente
 */

const cron = require('node-cron');
const reportService = require('./reportService');

// Almacenar referencias a los jobs activos
const activeJobs = {};

/**
 * Inicializar todos los cron jobs
 * @param {object} pool - Pool de conexión a la base de datos
 */
function initCronJobs(pool) {
  console.log('⏰ Inicializando Cron Jobs...');

  // Reporte diario a las 8:00 AM (hora de Perú, UTC-5)
  // En UTC sería las 13:00
  activeJobs.dailyReport = cron.schedule('0 8 * * *', async () => {
    console.log('📊 Ejecutando reporte diario automático...');
    try {
      await reportService.generateDailyReport(pool);
      console.log('✅ Reporte diario completado');
    } catch (error) {
      console.error('❌ Error en reporte diario:', error.message);
    }
  }, {
    timezone: 'America/Lima'
  });

  // Verificación de stock bajo cada 6 horas
  activeJobs.stockCheck = cron.schedule('0 */6 * * *', async () => {
    console.log('📦 Verificando productos con stock bajo...');
    try {
      await reportService.checkLowStock(pool);
      console.log('✅ Verificación de stock completada');
    } catch (error) {
      console.error('❌ Error en verificación de stock:', error.message);
    }
  }, {
    timezone: 'America/Lima'
  });

  // Limpieza de caché cada medianoche
  activeJobs.cacheCleanup = cron.schedule('0 0 * * *', async () => {
    console.log('🧹 Limpieza de caché nocturna...');
    try {
      const cache = require('./cacheService');
      await cache.delByPattern('*');
      console.log('✅ Caché limpiado');
    } catch (error) {
      console.error('❌ Error en limpieza de caché:', error.message);
    }
  }, {
    timezone: 'America/Lima'
  });

  console.log('✅ Cron Jobs configurados:');
  console.log('   📊 Reporte diario: 8:00 AM (Lima)');
  console.log('   📦 Check stock bajo: cada 6 horas');
  console.log('   🧹 Limpieza caché: medianoche');
}

/**
 * Ejecutar reporte manualmente (para pruebas)
 */
async function runManualReport(pool, type = 'daily') {
  console.log(`📊 Ejecutando reporte manual: ${type}`);
  
  try {
    if (type === 'daily') {
      return await reportService.generateDailyReport(pool);
    } else if (type === 'stock') {
      return await reportService.checkLowStock(pool);
    } else {
      return { success: false, error: 'Tipo de reporte no válido' };
    }
  } catch (error) {
    console.error('Error en reporte manual:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Detener todos los cron jobs
 */
function stopAllJobs() {
  Object.keys(activeJobs).forEach(jobName => {
    if (activeJobs[jobName]) {
      activeJobs[jobName].stop();
      console.log(`⏹️ Job '${jobName}' detenido`);
    }
  });
}

/**
 * Obtener estado de los jobs
 */
function getJobsStatus() {
  return Object.keys(activeJobs).map(jobName => ({
    name: jobName,
    running: activeJobs[jobName] ? activeJobs[jobName].running : false
  }));
}

module.exports = {
  initCronJobs,
  runManualReport,
  stopAllJobs,
  getJobsStatus
};
