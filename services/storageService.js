/**
 * Servicio de Almacenamiento de Imágenes
 * Usa Railway Bucket para almacenar imágenes de productos
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuración del bucket
let bucketConfig = {
  url: null,
  accessKey: null,
  isConfigured: false
};

/**
 * Inicializar configuración del bucket
 */
function initStorage() {
  const bucketUrl = process.env.BUCKET_URL || process.env.RAILWAY_BUCKET_URL;
  const accessKey = process.env.BUCKET_ACCESS_KEY || process.env.RAILWAY_BUCKET_ACCESS_KEY;

  if (bucketUrl) {
    bucketConfig = {
      url: bucketUrl.replace(/\/$/, ''), // Quitar trailing slash
      accessKey: accessKey || '',
      isConfigured: true
    };
    console.log('✅ Bucket de imágenes configurado');
  } else {
    console.log('⚠️ Bucket no configurado, usando almacenamiento en base de datos');
  }

  return bucketConfig.isConfigured;
}

/**
 * Subir imagen al bucket
 * @param {string} base64Data - Imagen en formato base64
 * @param {string} filename - Nombre del archivo (sin extensión)
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
async function uploadImage(base64Data, filename) {
  // Si no hay bucket configurado, devolver null para que use base64 en BD
  if (!bucketConfig.isConfigured) {
    return { success: false, useBase64: true };
  }

  try {
    // Extraer el tipo de imagen y los datos
    let imageData = base64Data;
    let mimeType = 'image/jpeg';
    let extension = 'jpg';

    if (base64Data.includes('data:')) {
      const matches = base64Data.match(/data:([^;]+);base64,(.+)/);
      if (matches) {
        mimeType = matches[1];
        imageData = matches[2];
        extension = mimeType.split('/')[1] || 'jpg';
        if (extension === 'jpeg') extension = 'jpg';
      }
    }

    // Generar nombre único
    const uniqueFilename = `${filename}-${Date.now()}.${extension}`;
    const buffer = Buffer.from(imageData, 'base64');

    // Subir al bucket usando fetch o http
    const uploadUrl = `${bucketConfig.url}/${uniqueFilename}`;
    
    const response = await uploadToUrl(uploadUrl, buffer, mimeType);
    
    if (response.success) {
      return {
        success: true,
        url: `${bucketConfig.url}/${uniqueFilename}`,
        filename: uniqueFilename
      };
    } else {
      console.error('Error al subir imagen:', response.error);
      return { success: false, useBase64: true, error: response.error };
    }

  } catch (error) {
    console.error('Error en uploadImage:', error.message);
    return { success: false, useBase64: true, error: error.message };
  }
}

/**
 * Subir archivo a URL usando http/https
 */
function uploadToUrl(url, buffer, contentType) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname,
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          'Content-Length': buffer.length
        }
      };

      if (bucketConfig.accessKey) {
        options.headers['Authorization'] = `Bearer ${bucketConfig.accessKey}`;
      }

      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: `Status ${res.statusCode}: ${data}` });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.write(buffer);
      req.end();

    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
}

/**
 * Eliminar imagen del bucket
 * @param {string} filename - Nombre del archivo a eliminar
 */
async function deleteImage(filename) {
  if (!bucketConfig.isConfigured || !filename) {
    return { success: false };
  }

  try {
    const deleteUrl = `${bucketConfig.url}/${filename}`;
    const parsedUrl = new URL(deleteUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    return new Promise((resolve) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname,
        method: 'DELETE',
        headers: {}
      };

      if (bucketConfig.accessKey) {
        options.headers['Authorization'] = `Bearer ${bucketConfig.accessKey}`;
      }

      const req = protocol.request(options, (res) => {
        resolve({ success: res.statusCode >= 200 && res.statusCode < 300 });
      });

      req.on('error', () => resolve({ success: false }));
      req.end();
    });

  } catch (error) {
    console.error('Error al eliminar imagen:', error.message);
    return { success: false };
  }
}

/**
 * Obtener URL pública de una imagen
 * @param {string} imagePath - Path o URL de la imagen
 * @returns {string} - URL completa de la imagen
 */
function getImageUrl(imagePath) {
  if (!imagePath) return null;
  
  // Si ya es una URL completa, devolverla
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Si es base64, devolverlo tal cual (el frontend lo maneja)
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }

  // Si es solo un filename, construir URL del bucket
  if (bucketConfig.isConfigured) {
    return `${bucketConfig.url}/${imagePath}`;
  }

  return imagePath;
}

/**
 * Verificar si el bucket está configurado
 */
function isBucketConfigured() {
  return bucketConfig.isConfigured;
}

/**
 * Procesar imagen para guardar
 * Intenta subir al bucket, si falla usa base64
 * @param {string} imageData - Datos de la imagen (base64 o URL)
 * @param {string} productCode - Código del producto para el nombre
 * @returns {Promise<{type: 'url'|'base64', value: string}>}
 */
async function processImage(imageData, productCode) {
  if (!imageData) {
    return { type: 'none', value: null };
  }

  // Si ya es una URL del bucket, mantenerla
  if (imageData.startsWith('http') && !imageData.startsWith('data:')) {
    return { type: 'url', value: imageData };
  }

  // Si hay bucket configurado, intentar subir
  if (bucketConfig.isConfigured && imageData.startsWith('data:')) {
    const result = await uploadImage(imageData, `producto-${productCode}`);
    if (result.success) {
      return { type: 'url', value: result.url };
    }
  }

  // Fallback: usar base64 en la BD
  return { type: 'base64', value: imageData };
}

module.exports = {
  initStorage,
  uploadImage,
  deleteImage,
  getImageUrl,
  isBucketConfigured,
  processImage
};
