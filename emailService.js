import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración del transportador de email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verificar conexión al iniciar
transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ Error al conectar con el servidor de email:', error.message);
    console.log('⚠️  Verifica las credenciales en el archivo .env');
  } else {
    console.log('✅ Servidor de email listo para enviar mensajes');
  }
});

/**
 * Plantilla HTML para email de recuperación de contraseña
 */
function getPasswordResetTemplate(nombre, resetLink) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background: #f3f4f6;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .logo {
            background: white;
            width: 120px;
            height: 120px;
            margin: 0 auto 20px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }
        .logo img {
            max-width: 90px;
            max-height: 90px;
        }
        .header h1 {
            color: white;
            font-size: 24px;
            font-weight: 700;
            margin: 0;
        }
        .header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            margin-top: 8px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #1f2937;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .message {
            color: #4b5563;
            line-height: 1.6;
            font-size: 15px;
            margin-bottom: 30px;
        }
        .button-container {
            text-align: center;
            margin: 35px 0;
        }
        .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
            transition: transform 0.2s;
        }
        .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(249, 115, 22, 0.4);
        }
        .info-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .info-box p {
            color: #92400e;
            font-size: 14px;
            margin: 0;
        }
        .link-text {
            background: #f3f4f6;
            padding: 12px;
            border-radius: 8px;
            word-break: break-all;
            font-size: 13px;
            color: #6b7280;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
        }
        .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .company-info {
            margin-bottom: 15px;
        }
        .company-name {
            color: #1f2937;
            font-weight: 700;
            font-size: 16px;
            margin-bottom: 5px;
        }
        .company-details {
            color: #6b7280;
            font-size: 13px;
            line-height: 1.5;
        }
        .social-links {
            margin: 20px 0;
        }
        .social-links a {
            display: inline-block;
            margin: 0 8px;
            color: #f97316;
            text-decoration: none;
            font-size: 14px;
        }
        .copyright {
            color: #9ca3af;
            font-size: 12px;
            margin-top: 15px;
        }
        .divider {
            height: 1px;
            background: #e5e7eb;
            margin: 25px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <img src="cid:logo" alt="Logo Rectificación de Repuestos">
            </div>
            <h1>Recuperación de Contraseña</h1>
            <p>Sistema de Gestión de Inventario</p>
        </div>
        
        <div class="content">
            <p class="greeting">Hola, ${nombre}</p>
            
            <p class="message">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en nuestro Sistema de Gestión de Inventario.
            </p>
            
            <p class="message">
                Si no realizaste esta solicitud, puedes ignorar este correo de forma segura. Tu contraseña actual permanecerá sin cambios.
            </p>
            
            <div class="button-container">
                <a href="${resetLink}" class="reset-button">Restablecer Contraseña</a>
            </div>
            
            <div class="info-box">
                <p><strong>⏱️ Importante:</strong> Este enlace es válido solo por 1 hora por razones de seguridad.</p>
            </div>
            
            <p class="message" style="margin-top: 25px;">
                Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
            </p>
            
            <div class="link-text">${resetLink}</div>
            
            <div class="divider"></div>
            
            <p class="message" style="font-size: 13px; color: #6b7280;">
                <strong>Consejos de seguridad:</strong><br>
                • Nunca compartas tu contraseña con nadie<br>
                • Utiliza una contraseña fuerte y única<br>
                • Si no solicitaste este cambio, contacta con soporte inmediatamente
            </p>
        </div>
        
        <div class="footer">
            <div class="company-info">
                <div class="company-name">Rectificación de Repuestos en Tarapoto S.A.C.</div>
                <div class="company-details">
                    📍 Tarapoto, San Martín - Perú<br>
                    📧 contacto@rectificadora.com<br>
                    📞 +51 942 123 456
                </div>
            </div>
            
            <div class="social-links">
                <a href="#">Facebook</a> • 
                <a href="#">Instagram</a> • 
                <a href="#">WhatsApp</a>
            </div>
            
            <div class="copyright">
                © ${new Date().getFullYear()} Rectificación de Repuestos en Tarapoto S.A.C. Todos los derechos reservados.
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Enviar email de recuperación de contraseña
 */
export async function enviarEmailRecuperacion(email, nombre, token) {
  try {
    const resetLink = `${process.env.FRONTEND_URL}/restablecer-contrasena/${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Rectificación de Repuestos" <rectificadora.tarapoto@gmail.com>',
      to: email,
      subject: '🔐 Recuperación de Contraseña - Sistema de Inventario',
      html: getPasswordResetTemplate(nombre, resetLink),
      attachments: [
        {
          filename: 'logo.png',
          path: path.join(__dirname, 'frontend-react', 'public', 'assets', 'logo.png'),
          cid: 'logo' // mismo cid que en la imagen del HTML
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de recuperación enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Plantilla HTML para confirmación de cambio de contraseña
 */
function getPasswordChangedTemplate(nombre) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contraseña Actualizada</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; background: #f3f4f6; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 30px; text-align: center; }
        .logo { background: white; width: 120px; height: 120px; margin: 0 auto 20px; border-radius: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2); }
        .logo img { max-width: 90px; max-height: 90px; }
        .header h1 { color: white; font-size: 24px; font-weight: 700; margin: 0; }
        .header p { color: rgba(255, 255, 255, 0.9); font-size: 14px; margin-top: 8px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
        .message { color: #4b5563; line-height: 1.6; font-size: 15px; margin-bottom: 20px; }
        .alert-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 25px 0; border-radius: 8px; }
        .alert-box p { color: #b91c1c; font-size: 14px; margin: 0; }
        .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .company-name { color: #1f2937; font-weight: 700; font-size: 16px; margin-bottom: 5px; }
        .company-details { color: #6b7280; font-size: 13px; line-height: 1.5; }
        .copyright { color: #9ca3af; font-size: 12px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <img src="cid:logo" alt="Logo">
            </div>
            <h1>Contraseña Actualizada</h1>
            <p>Seguridad de la Cuenta</p>
        </div>
        
        <div class="content">
            <p class="greeting">Hola, ${nombre}</p>
            
            <p class="message">
                Te informamos que la contraseña de tu cuenta ha sido modificada exitosamente.
            </p>
            
            <p class="message">
                Si realizaste este cambio, no es necesario que hagas nada más.
            </p>

            <div class="alert-box">
                <p><strong>⚠️ ¿No fuiste tú?</strong><br>
                Si no has solicitado este cambio, por favor contacta al soporte inmediatamente y cambia tu contraseña nuevamente para proteger tu cuenta.</p>
            </div>
            
            <p class="message">
                <strong>Equipo de Soporte</strong><br>
                Rectificación de Repuestos en Tarapoto S.A.C.
            </p>
        </div>
        
        <div class="footer">
            <div class="company-name">Rectificación de Repuestos en Tarapoto S.A.C.</div>
            <div class="company-details">
                📍 Tarapoto, San Martín - Perú<br>
                📧 contacto@rectificadora.com
            </div>
            <div class="copyright">
                © ${new Date().getFullYear()} Todos los derechos reservados.
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Enviar email de confirmación de cambio de contraseña
 */
export async function enviarEmailConfirmacionCambio(email, nombre) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Seguridad - Rectificación de Repuestos" <rectificadora.tarapoto@gmail.com>',
      to: email,
      subject: '🛡️ Aviso de Seguridad: Tu contraseña ha sido cambiada',
      html: getPasswordChangedTemplate(nombre),
      attachments: [
        {
          filename: 'logo.png',
          path: path.join(__dirname, 'frontend-react', 'public', 'assets', 'logo.png'),
          cid: 'logo'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de confirmación enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error al enviar email de confirmación:', error);
    return { success: false, error: error.message };
  }
}

export default transporter;
