# Neta.

Tu negocio, claro como el agua.

Herramienta de gestión para micropigmentadoras independientes en LATAM y USA.

## Stack

React 18 · TypeScript · Vite · Supabase (PostgreSQL + Auth + RLS) · Tailwind CSS · Netlify

## Setup local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo
2. En el SQL Editor, pega y ejecuta el contenido de `supabase/schema.sql`
3. En **Authentication → Providers**:
   - Habilita **Email** (puedes desactivar la confirmación por correo en desarrollo)
   - Habilita **Google** y configura el OAuth client (consulta la guía oficial de Supabase)
4. En **Authentication → URL Configuration**, agrega tu URL local (`http://localhost:5173`) a *Redirect URLs*

### 3. Variables de entorno

Copia `.env.example` a `.env` y rellena con los valores de tu proyecto Supabase:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Estos valores los encuentras en **Supabase → Project Settings → API**.

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

## Deploy en Netlify

1. Conecta el repo `neta-pmu` en Netlify
2. Build command: `npm run build` · Publish directory: `dist` (ya está en `netlify.toml`)
3. Agrega las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
4. En Supabase → Authentication → URL Configuration, agrega tu URL pública de Netlify a *Redirect URLs*

## Estructura

```
src/
├── components/      # Logo, AppLayout, Modal, Toast, Particles, MoneyInput, MonthSelector, Empty
├── contexts/        # AuthContext, ProfileContext
├── lib/             # supabase client, utils (formato, fechas, moneda)
├── pages/           # Login, Onboarding, Dashboard, Procedimientos, Gastos, Configuracion
├── styles/          # globals.css (Tailwind + componentes Neta)
├── types/           # database types
├── App.tsx          # rutas y guards
└── main.tsx         # entry
supabase/
└── schema.sql       # esquema completo + RLS + trigger de seed
```

## Seguridad y multi-tenant

- Todas las tablas con RLS activado y políticas que comparan `auth.uid()` contra `user_id`
- Cada usuaria solo ve y modifica sus propios datos
- Opciones por defecto sembradas con un trigger en `auth.users` al crear cuenta
