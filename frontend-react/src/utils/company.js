export const COMPANY_INFO = {
  name: 'Rectificadora de Repuesto en Tarapoto S.A.C',
  ruc: 'RUC 00000000000',
  address: 'Av. Principal 123, Tarapoto, San Martín',
  phone: '(042) 000-000',
  email: 'contacto@rectificadoratarapoto.com',
  website: 'https://rectificadoratarapoto.example',
  // Si tienes logo (base64 o url pública), puedes agregarlo aquí
  logo: null,
};

export function nowPE() {
  const now = new Date();
  const fecha = now.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  const hora = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return { fecha, hora };
}
