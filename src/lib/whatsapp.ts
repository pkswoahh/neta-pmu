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
