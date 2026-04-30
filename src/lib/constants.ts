// Email de soporte. Cuando el dominio propio esté listo, este buzón debe
// existir y atender mensajes. Mientras tanto, se muestra en pantallas de
// gating pero rebotará — decisión consciente de no exponer el Gmail personal.
export const SUPPORT_EMAIL = 'hola@netapmu.com'

// Mapa de moneda → código de país ISO. Usado en onboarding para derivar
// country sin pedírselo a la usuaria.
export const CURRENCY_TO_COUNTRY: Record<string, string> = {
  COP: 'CO',
  USD: 'US',
  ARS: 'AR',
  MXN: 'MX',
  VES: 'VE',
  EUR: 'ES',
}

// Nombre legible de país por código ISO (lo mostramos en admin).
export const COUNTRY_NAMES: Record<string, string> = {
  CO: 'Colombia',
  US: 'Estados Unidos',
  AR: 'Argentina',
  MX: 'México',
  VE: 'Venezuela',
  ES: 'España',
  DO: 'República Dominicana',
}

// Mes de referencia para precios en USD del SaaS.
export const PRICE_MONTHLY_USD = 15

// Días de trial automático al registrarse.
export const TRIAL_DAYS = 14
