# Arquitectura

## Stack y razones

| Capa | Elección | Por qué |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Velocidad de DX, build rápido, ecosistema PMU-friendly |
| Estilos | Tailwind 3 | Mobile-first nativo, dark theme limpio, sin runtime |
| Routing | react-router-dom v6 | SPA simple |
| Backend | Supabase | Postgres real, RLS, Auth, edge functions, generoso plan free |
| Hosting | Netlify | Deploy automático desde GitHub, SSL, CDN, env vars |
| PWA | vite-plugin-pwa + Workbox | Standard, instalable iOS/Android |
| Iconos | lucide-react | Consistente, tree-shakeable |

## Patrones

### Páginas y rutas

Cada página es un archivo en `src/pages/*.tsx`. Las rutas se declaran en `src/App.tsx` con guards:

- `<RequireAuth>` — redirige a `/login` si no hay sesión
- `<RequireAuthAndOnboarded>` — exige sesión + `business_name` set
- `<RequireAdmin>` — (sesión 1 admin pendiente) exige `role = 'admin' | 'support'`

### Estado global

Dos contexts en `src/contexts/`:

- **AuthContext**: sesión de Supabase + `signOut()`. Escucha `onAuthStateChange`.
- **ProfileContext**: `profile`, `options[]`, `byType()`, `refresh()`, `updateProfile()`. Carga automática cuando cambia user.

No usamos Redux/Zustand. La complejidad no lo amerita.

### Forms

Inline en cada página (no librerías). Validación nativa de HTML + chequeos manuales antes de submit. Tras éxito → `toast.show()` y refrescar lista.

### Listas con CRUD

Patrón consistente Procedimientos / Gastos:
- `month` state + `MonthSelector`
- `query`, `filterX` states (filtros en memoria con `useMemo`)
- `<ListSkeleton>` mientras carga
- `<Empty>` si vacío
- Modal con form al editar/crear
- `useConfirm()` para borrar

### Money y formatos

Toda la app respeta `profile.currency`. Helpers en `src/lib/utils.ts`:
- `formatMoney(value, currency)` — display
- `formatThousands(raw)` / `parseThousands(formatted)` — para inputs en vivo
- `currencySymbol(code)`
- `relativeDate(iso)` — "Hoy", "Ayer", "Hace N días"
- `shortDate(iso)` — `dd/mm/yyyy`
- `clientKey(name)` — normalización (lowercase, sin acentos) para búsqueda y agregación

### Aliases TS

`@/` apunta a `src/`. Importar como `@/components/Foo`, no rutas relativas largas.

## Decisiones que valen recordar

- **Tipado de Supabase**: el cliente es untyped (`createClient` sin Database generic). Probamos generic-typed pero peleaba con la firma de inserts. Para apps pequeñas, untyped + interfaces de dominio en `src/types/database.ts` es más limpio.
- **PWA en dev**: `devOptions: { enabled: true }` en `vite.config.ts` para probar el SW en local.
- **Service Worker**: en `autoUpdate` silencioso. Pendiente pasar a `prompt` con toast "recarga". Si reportan no ver nuevas funciones → cache del SW.
- **Acentos en búsqueda**: el helper `clientKey()` normaliza para que "María" matchee con "maria".
- **CSV con BOM**: `downloadCSV()` agrega `﻿` al inicio para que Excel abra UTF-8 correctamente.

## Dónde NO meterse

- No uses `<select>` nativo, hay `<Select>` custom (`src/components/Select.tsx`).
- No uses `confirm()` del navegador, hay `useConfirm()`.
- No agregues librerías sin razón fuerte (bundle ya pesa 460KB).
- No mezcles inglés y español en UI. Todo español.
- No saltes el ROADMAP — actualízalo cuando cierres tareas.
