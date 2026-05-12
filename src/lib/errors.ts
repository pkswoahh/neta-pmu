/**
 * Traduce errores de Supabase (auth, postgres, network) a mensajes en español
 * amables para la usuaria. Si el error no se reconoce, devuelve un mensaje
 * genérico o el mensaje original si parece útil en español.
 */

interface ErrorLike {
  message?: string
  code?: string
  status?: number
  error_description?: string
}

const MESSAGE_PATTERNS: Array<[string, string]> = [
  // Auth — credenciales y signup
  ['invalid login credentials',           'Email o contraseña incorrectos.'],
  ['email not confirmed',                 'Debes confirmar tu correo antes de entrar. Revisa tu bandeja de entrada.'],
  ['user already registered',             'Ya existe una cuenta con ese email. Intenta entrar.'],
  ['user already exists',                 'Ya existe una cuenta con ese email. Intenta entrar.'],
  ['password should be at least 6',       'La contraseña debe tener al menos 6 caracteres.'],
  ['password should be at least',         'La contraseña es demasiado corta.'],
  ['signup requires a valid password',    'Ingresa una contraseña válida.'],
  ['user not found',                      'No encontramos una cuenta con ese email.'],
  ['new password should be different',    'La nueva contraseña debe ser distinta de la anterior.'],
  ['same password',                       'La nueva contraseña debe ser distinta de la anterior.'],
  ['unable to validate email',            'Ese email no parece válido. Revísalo.'],
  ['invalid email',                       'Ese email no parece válido. Revísalo.'],

  // Auth — tokens, sesión, OAuth
  ['token has expired or is invalid',     'El enlace ya no es válido. Pide uno nuevo.'],
  ['otp_expired',                         'El enlace ya no es válido. Pide uno nuevo.'],
  ['invalid refresh token',               'Tu sesión expiró. Vuelve a entrar.'],
  ['refresh token not found',             'Tu sesión expiró. Vuelve a entrar.'],
  ['jwt expired',                         'Tu sesión expiró. Vuelve a entrar.'],
  ['auth session missing',                'Tu sesión expiró. Vuelve a entrar.'],
  ['provider is not enabled',             'Ese método de acceso no está habilitado todavía.'],
  ['oauth',                               'No pudimos completar el acceso con Google. Intenta de nuevo.'],

  // Auth — rate limit
  ['email rate limit exceeded',           'Enviamos demasiados correos recientemente. Espera unos minutos.'],
  ['rate limit',                          'Demasiados intentos. Espera unos minutos e intenta de nuevo.'],
  ['too many requests',                   'Demasiados intentos. Espera unos minutos e intenta de nuevo.'],

  // Postgres / PostgREST
  ['duplicate key',                       'Este registro ya existe.'],
  ['violates unique constraint',          'Este registro ya existe.'],
  ['violates foreign key',                'No se puede hacer esto porque hay datos relacionados.'],
  ['violates not-null',                   'Falta completar un campo obligatorio.'],
  ['violates check constraint',           'Algún dato no cumple las reglas. Revísalo.'],
  ['permission denied',                   'No tienes permiso para hacer esto.'],
  ['row-level security',                  'No tienes permiso para hacer esto.'],
  ['violates row-level security',         'No tienes permiso para hacer esto.'],

  // Red
  ['failed to fetch',                     'Problema de conexión. Revisa tu internet e intenta de nuevo.'],
  ['networkerror',                        'Problema de conexión. Revisa tu internet e intenta de nuevo.'],
  ['load failed',                         'Problema de conexión. Revisa tu internet e intenta de nuevo.'],
  ['fetch failed',                        'Problema de conexión. Revisa tu internet e intenta de nuevo.'],
]

const CODE_MAP: Record<string, string> = {
  '23505': 'Este registro ya existe.',
  '23503': 'No se puede hacer esto porque hay datos relacionados.',
  '23502': 'Falta completar un campo obligatorio.',
  '23514': 'Algún dato no cumple las reglas. Revísalo.',
  '42501': 'No tienes permiso para hacer esto.',
  'PGRST301': 'Tu sesión expiró. Vuelve a entrar.',
  'PGRST116': 'No encontramos el registro.',
  'over_email_send_rate_limit': 'Enviamos demasiados correos recientemente. Espera unos minutos.',
  'over_request_rate_limit': 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
  'email_address_invalid': 'Ese email no parece válido. Revísalo.',
  'weak_password': 'Esa contraseña es muy débil. Elige una más segura.',
  'same_password': 'La nueva contraseña debe ser distinta de la anterior.',
}

const SPANISH_HINT = /[ñáéíóú¿¡]|\b(no|ya|el|la|los|las|debe|error|ese|esa|esto|tu|tus|aquí|así)\b/i

export function translateError(err: unknown, fallback = 'Algo falló, intenta de nuevo.'): string {
  if (!err) return fallback

  // String directo
  if (typeof err === 'string') return matchOrFallback(err, fallback)

  const e = err as ErrorLike

  if (e.code && CODE_MAP[e.code]) return CODE_MAP[e.code]

  const raw = e.message ?? e.error_description
  if (!raw) return fallback

  return matchOrFallback(raw, fallback)
}

function matchOrFallback(raw: string, fallback: string): string {
  const msg = raw.toLowerCase()
  for (const [pattern, translation] of MESSAGE_PATTERNS) {
    if (msg.includes(pattern)) return translation
  }
  // Mensaje no reconocido: si ya parece español (acentos, palabras comunes), pásalo;
  // si no, usa el fallback genérico para no mostrar inglés crudo.
  return SPANISH_HINT.test(raw) ? raw : fallback
}
