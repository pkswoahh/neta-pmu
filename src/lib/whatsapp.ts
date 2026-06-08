// Links de WhatsApp (wa.me) con mensaje pre-cargado.
//
// El reto: wa.me exige el número con código de país y solo dígitos, pero las
// usuarias guardan el celular en formato libre (normalmente local, sin código).
// Tomamos el país del perfil (derivado en onboarding) para anteponer el código
// de marcación cuando falta. Solo manejamos los 6 países posibles del onboarding.

const DIAL_CODES: Record<string, string> = {
  CO: '57', US: '1', AR: '54', MX: '52', VE: '58', ES: '34',
}

// Celular en formato libre → número apto para wa.me (dígitos + código de país).
// Devuelve null si no hay dígitos.
export function toWhatsappNumber(phone: string, country: string | null): string | null {
  const dial = country ? DIAL_CODES[country] : undefined
  let d = phone.replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('00')) d = d.slice(2)                       // prefijo internacional 00…
  if (dial && d.startsWith(dial) && d.length >= dial.length + 8) return d  // ya trae código
  if (d.startsWith('0')) d = d.slice(1)                        // prefijo nacional 0…
  return dial ? dial + d : d
}

// Link wa.me con mensaje pre-cargado. null si el celular no es usable.
export function whatsappLink(phone: string, country: string | null, message: string): string | null {
  const num = toWhatsappNumber(phone, country)
  return num ? `https://wa.me/${num}?text=${encodeURIComponent(message)}` : null
}
