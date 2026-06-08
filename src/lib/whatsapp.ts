// Links de WhatsApp (wa.me) con mensaje pre-cargado.
//
// El celular se guarda ya en formato internacional (+código país + número)
// mediante <PhoneInput>, así que aquí solo extraemos los dígitos. Los números
// antiguos guardados sin código quedarían incompletos (caso marginal: datos
// previos a esta versión).

// Celular → solo dígitos aptos para wa.me. null si no hay dígitos.
export function toWhatsappNumber(phone: string): string | null {
  let d = (phone ?? '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2) // prefijo internacional 00…
  return d || null
}

// Link wa.me con mensaje pre-cargado. null si el celular no es usable.
export function whatsappLink(phone: string, message: string): string | null {
  const num = toWhatsappNumber(phone)
  return num ? `https://wa.me/${num}?text=${encodeURIComponent(message)}` : null
}

// Plantilla editable de recordatorio (se muestra en Configuración como punto de
// partida cuando la usuaria quiere personalizar su mensaje).
export const DEFAULT_REMINDER_TEMPLATE =
  '¡Hola {nombre}! 😊 Te recuerdo tu cita de {procedimiento} el {fecha} a las {hora}. Te espero en {negocio}. Cualquier cosa me escribes por aquí. ¡Nos vemos! 💕'

export interface ReminderVars {
  nombre: string
  procedimiento: string
  fecha: string
  hora: string
  negocio: string
}

// Reemplaza los placeholders. Si alguno queda vacío, colapsa los espacios
// dobles para que no se note el hueco.
export function renderReminder(template: string, vars: ReminderVars): string {
  return template
    .replace(/\{nombre\}/g, vars.nombre)
    .replace(/\{procedimiento\}/g, vars.procedimiento)
    .replace(/\{fecha\}/g, vars.fecha)
    .replace(/\{hora\}/g, vars.hora)
    .replace(/\{negocio\}/g, vars.negocio)
    .replace(/ {2,}/g, ' ')
    .trim()
}
