// Países para el selector de celular. Orientado a la clientela real de una
// micropigmentadora (LATAM completo + USA/Canadá + España y algunos más).
// `dial` es el código de marcación sin '+'. Varios comparten código (NANP: +1).

export interface Country {
  iso: string
  name: string
  dial: string
}

export const COUNTRIES: Country[] = [
  { iso: 'CO', name: 'Colombia', dial: '57' },
  { iso: 'MX', name: 'México', dial: '52' },
  { iso: 'US', name: 'Estados Unidos', dial: '1' },
  { iso: 'AR', name: 'Argentina', dial: '54' },
  { iso: 'PE', name: 'Perú', dial: '51' },
  { iso: 'CL', name: 'Chile', dial: '56' },
  { iso: 'EC', name: 'Ecuador', dial: '593' },
  { iso: 'VE', name: 'Venezuela', dial: '58' },
  { iso: 'ES', name: 'España', dial: '34' },
  { iso: 'BO', name: 'Bolivia', dial: '591' },
  { iso: 'PY', name: 'Paraguay', dial: '595' },
  { iso: 'UY', name: 'Uruguay', dial: '598' },
  { iso: 'PA', name: 'Panamá', dial: '507' },
  { iso: 'CR', name: 'Costa Rica', dial: '506' },
  { iso: 'GT', name: 'Guatemala', dial: '502' },
  { iso: 'HN', name: 'Honduras', dial: '504' },
  { iso: 'SV', name: 'El Salvador', dial: '503' },
  { iso: 'NI', name: 'Nicaragua', dial: '505' },
  { iso: 'DO', name: 'Rep. Dominicana', dial: '1' },
  { iso: 'PR', name: 'Puerto Rico', dial: '1' },
  { iso: 'CU', name: 'Cuba', dial: '53' },
  { iso: 'CA', name: 'Canadá', dial: '1' },
  { iso: 'BR', name: 'Brasil', dial: '55' },
  { iso: 'PT', name: 'Portugal', dial: '351' },
  { iso: 'IT', name: 'Italia', dial: '39' },
  { iso: 'FR', name: 'Francia', dial: '33' },
  { iso: 'DE', name: 'Alemania', dial: '49' },
  { iso: 'GB', name: 'Reino Unido', dial: '44' },
  { iso: 'AU', name: 'Australia', dial: '61' },
]

// Bandera emoji a partir del ISO (sin hardcodear cada emoji).
export function flagEmoji(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
}
