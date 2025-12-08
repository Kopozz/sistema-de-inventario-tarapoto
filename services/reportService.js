/**
 * Servicio de Generación de Reportes
 * Genera reportes de ventas y alertas de stock bajo
 * Compatible con PostgreSQL
 */

const nodemailer = require('nodemailer');
const path = require('path');

// Configurar transporter de email
let transporter = null;

function initTransporter() {
  if (!transporter) {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } catch (error) {
      console.log('⚠️ No se pudo configurar el transporter de email:', error.message);
      return null;
    }
  }
  return transporter;
}

/**
 * Generar reporte diario de ventas
 */
async function generateDailyReport(pool) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const fechaInicio = yesterday.toISOString().split('T')[0];

  try {
    // Obtener ventas del día anterior (PostgreSQL)
    const ventasResult = await pool.query(`
      SELECT v.*, u.nombre as vendedor
      FROM "Venta" v
      LEFT JOIN "Usuario" u ON v."idUsuario" = u."idUsuario"
      WHERE DATE(v."fechaHora") = $1
      ORDER BY v."fechaHora" DESC
    `, [fechaInicio]);
    const ventas = ventasResult.rows || [];

    // Obtener totales
    const totalesResult = await pool.query(`
      SELECT 
        COUNT(*) as "totalVentas",
        COALESCE(SUM(total), 0) as "totalMonto"
      FROM "Venta" 
      WHERE DATE("fechaHora") = $1
    `, [fechaInicio]);
    const totales = totalesResult.rows[0] || { totalVentas: 0, totalMonto: 0 };

    // Obtener productos más vendidos
    const topProductosResult = await pool.query(`
      SELECT p.nombre, SUM(dv.cantidad) as "cantidadVendida", SUM(dv.subtotal) as "totalVendido"
      FROM "DetalleVenta" dv
      JOIN "Producto" p ON dv."idProducto" = p."idProducto"
      JOIN "Venta" v ON dv."idVenta" = v."idVenta"
      WHERE DATE(v."fechaHora") = $1
      GROUP BY p."idProducto", p.nombre
      ORDER BY "cantidadVendida" DESC
      LIMIT 5
    `, [fechaInicio]);
    const topProductos = topProductosResult.rows || [];

    // Obtener productos con stock bajo
    const stockBajoResult = await pool.query(`
      SELECT nombre, codigo, "stockActual", "stockMinimo"
      FROM "Producto"
      WHERE "stockActual" <= "stockMinimo" AND estado = 1
      ORDER BY "stockActual" ASC
      LIMIT 10
    `);
    const stockBajo = stockBajoResult.rows || [];

    // Guardar reporte en BD
    const reporteData = {
      fecha: fechaInicio,
      tipo: 'diario',
      totalVentas: parseInt(totales.totalVentas) || 0,
      totalMonto: parseFloat(totales.totalMonto) || 0,
      topProductos,
      stockBajo: stockBajo.length,
      generadoEn: new Date().toISOString()
    };

    await saveReportToDatabase(pool, reporteData);

    // Enviar email con el reporte
    await sendDailyReportEmail({
      fecha: fechaInicio,
      ventas: ventas.length,
      totalMonto: parseFloat(totales.totalMonto) || 0,
      topProductos,
      stockBajo
    });

    console.log('✅ Reporte diario generado:', reporteData);
    return { success: true, data: reporteData };

  } catch (error) {
    console.error('Error generando reporte diario:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verificar productos con stock bajo y enviar alertas
 */
async function checkLowStock(pool) {
  try {
    const result = await pool.query(`
      SELECT 
        p."idProducto", p.nombre, p.codigo, p."stockActual", p."stockMinimo",
        c.nombre as categoria
      FROM "Producto" p
      LEFT JOIN "Categoria" c ON p."idCategoria" = c."idCategoria"
      WHERE p."stockActual" <= p."stockMinimo" 
        AND p.estado = 1
      ORDER BY p."stockActual" ASC
    `);
    const productos = result.rows || [];

    if (productos.length === 0) {
      console.log('✅ No hay productos con stock bajo');
      return { success: true, productosConStockBajo: 0 };
    }

    console.log(`⚠️ ${productos.length} productos con stock bajo detectados`);

    // Guardar alerta en BD
    await saveReportToDatabase(pool, {
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'stock_bajo',
      productosAfectados: productos.length,
      productos: productos.map(p => ({
        codigo: p.codigo,
        nombre: p.nombre,
        stockActual: p.stockActual,
        stockMinimo: p.stockMinimo
      })),
      generadoEn: new Date().toISOString()
    });

    // Enviar email de alerta
    await sendLowStockAlert(productos);

    return { 
      success: true, 
      productosConStockBajo: productos.length,
      productos 
    };

  } catch (error) {
    console.error('Error verificando stock bajo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Guardar reporte en la base de datos (PostgreSQL)
 */
async function saveReportToDatabase(pool, reporteData) {
  try {
    // Verificar si existe la tabla, si no, crearla (PostgreSQL syntax)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "ReporteAutomatico" (
        "idReporte" SERIAL PRIMARY KEY,
        fecha DATE NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        datos JSONB,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(
      'INSERT INTO "ReporteAutomatico" (fecha, tipo, datos) VALUES ($1, $2, $3)',
      [reporteData.fecha, reporteData.tipo, JSON.stringify(reporteData)]
    );

    console.log('💾 Reporte guardado en base de datos');
    return true;
  } catch (error) {
    console.error('Error guardando reporte:', error.message);
    return false;
  }
}

/**
 * Enviar email con reporte diario
 */
async function sendDailyReportEmail(data) {
  const mail = initTransporter();
  if (!mail || !process.env.EMAIL_USER) {
    console.log('⚠️ Email no configurado, saltando envío');
    return false;
  }

  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  try {
    const html = getDailyReportTemplate(data);
    
    await mail.sendMail({
      from: process.env.EMAIL_FROM || '"Sistema de Inventario" <noreply@rectificadora.com>',
      to: adminEmail,
      subject: `📊 Reporte Diario de Ventas - ${data.fecha}`,
      html
    });

    console.log('📧 Email de reporte diario enviado a:', adminEmail);
    return true;
  } catch (error) {
    console.error('Error enviando email de reporte:', error.message);
    return false;
  }
}

/**
 * Enviar alerta de stock bajo
 */
async function sendLowStockAlert(productos) {
  const mail = initTransporter();
  if (!mail || !process.env.EMAIL_USER) {
    console.log('⚠️ Email no configurado, saltando envío');
    return false;
  }

  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  try {
    const html = getLowStockTemplate(productos);
    
    await mail.sendMail({
      from: process.env.EMAIL_FROM || '"Alerta de Inventario" <noreply@rectificadora.com>',
      to: adminEmail,
      subject: `⚠️ ALERTA: ${productos.length} productos con stock bajo`,
      html
    });

    console.log('📧 Alerta de stock bajo enviada a:', adminEmail);
    return true;
  } catch (error) {
    console.error('Error enviando alerta de stock:', error.message);
    return false;
  }
}

/**
 * Template HTML para reporte diario
 */
function getDailyReportTemplate(data) {
  const productosHtml = (data.topProductos || []).map(p => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${p.nombre}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.cantidadVendida}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">S/ ${parseFloat(p.totalVendido || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  const stockBajoHtml = (data.stockBajo || []).length > 0 
    ? data.stockBajo.map(p => `
        <tr style="background: ${p.stockActual === 0 ? '#fee2e2' : '#fef3c7'};">
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.codigo}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.nombre}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center; color: ${p.stockActual === 0 ? '#dc2626' : '#d97706'}; font-weight: bold;">
            ${p.stockActual}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.stockMinimo}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" style="padding: 12px; text-align: center; color: #22c55e;">✅ No hay productos con stock bajo</td></tr>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reporte Diario</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; padding: 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">📊 Reporte Diario de Ventas</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${data.fecha}</p>
    </div>
    
    <div style="padding: 30px;">
      <div style="display: flex; gap: 20px; margin-bottom: 30px;">
        <div style="flex: 1; background: #eff6ff; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #1d4ed8;">${data.ventas || 0}</div>
          <div style="color: #6b7280; font-size: 14px;">Ventas Realizadas</div>
        </div>
        <div style="flex: 1; background: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #16a34a;">S/ ${parseFloat(data.totalMonto || 0).toFixed(2)}</div>
          <div style="color: #6b7280; font-size: 14px;">Total Recaudado</div>
        </div>
      </div>
      
      <h3 style="color: #1f2937; margin-bottom: 15px;">🏆 Productos Más Vendidos</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Producto</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Cantidad</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${productosHtml || '<tr><td colspan="3" style="padding: 12px; text-align: center; color: #6b7280;">Sin ventas hoy</td></tr>'}
        </tbody>
      </table>
      
      <h3 style="color: #1f2937; margin-bottom: 15px;">⚠️ Alertas de Stock Bajo</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #fef3c7;">
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Código</th>
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Producto</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #e5e7eb;">Stock</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #e5e7eb;">Mínimo</th>
          </tr>
        </thead>
        <tbody>
          ${stockBajoHtml}
        </tbody>
      </table>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px; margin: 0;">
        Este reporte fue generado automáticamente por el Sistema de Inventario<br>
        © ${new Date().getFullYear()} Rectificación de Repuestos
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Template HTML para alerta de stock bajo
 */
function getLowStockTemplate(productos) {
  const productosHtml = (productos || []).map(p => `
    <tr style="background: ${p.stockActual === 0 ? '#fee2e2' : 'white'};">
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${p.codigo}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${p.nombre}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${p.categoria || 'Sin categoría'}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold; color: ${p.stockActual === 0 ? '#dc2626' : '#d97706'};">
        ${p.stockActual}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.stockMinimo}</td>
    </tr>
  `).join('');

  const criticos = (productos || []).filter(p => p.stockActual === 0).length;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Alerta de Stock Bajo</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; padding: 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Alerta de Stock Bajo</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${(productos || []).length} productos necesitan reposición</p>
    </div>
    
    <div style="padding: 30px;">
      ${criticos > 0 ? `
        <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
          <strong style="color: #dc2626;">🚨 ${criticos} producto(s) con stock en CERO</strong>
        </div>
      ` : ''}
      
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #fef3c7;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Código</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Producto</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Categoría</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Stock</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Mínimo</th>
          </tr>
        </thead>
        <tbody>
          ${productosHtml}
        </tbody>
      </table>
      
      <div style="margin-top: 25px; padding: 15px; background: #eff6ff; border-radius: 8px;">
        <p style="margin: 0; color: #1d4ed8; font-size: 14px;">
          💡 <strong>Acción sugerida:</strong> Contactar proveedores para reabastecer el inventario.
        </p>
      </div>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px; margin: 0;">
        Sistema de Inventario - Alerta Automática<br>
        ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Obtener historial de reportes (PostgreSQL)
 */
async function getReportHistory(pool, limit = 10) {
  try {
    const result = await pool.query(
      'SELECT * FROM "ReporteAutomatico" ORDER BY "createdAt" DESC LIMIT $1',
      [limit]
    );
    return result.rows || [];
  } catch (error) {
    console.error('Error obteniendo historial:', error.message);
    return [];
  }
}

module.exports = {
  generateDailyReport,
  checkLowStock,
  saveReportToDatabase,
  getReportHistory
};
