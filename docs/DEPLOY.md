# Deploy y operación

## URLs

| Recurso | URL |
|---|---|
| Producción | https://neta-pmu.netlify.app |
| Repo | https://github.com/pkswoahh/neta-pmu |
| Supabase project | https://jolxvidopodflypelwxn.supabase.co |
| Supabase dashboard | https://supabase.com/dashboard/project/jolxvidopodflypelwxn |

## Cómo se despliega

Auto: push a `main` → Netlify build automático → deploy.

Build:
- Comando: `npm run build` (configurado en `netlify.toml`)
- Output: `dist/`
- Redirects SPA: `/* → /index.html 200` (en `netlify.toml`)

## Variables de entorno

Configuradas en **Netlify → Site settings → Environment variables** y en `.env` local (no commiteado):

```
VITE_SUPABASE_URL=https://jolxvidopodflypelwxn.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Si rotas claves, actualizar ambos lugares + redeploy.

## Supabase URL configuration

En **Supabase → Authentication → URL Configuration**:

- **Site URL**: `https://neta-pmu.netlify.app`
- **Redirect URLs**:
  - `https://neta-pmu.netlify.app/**`
  - `https://neta-pmu.netlify.app/cambiar-password`

Para desarrollo local, agregar también:
- `http://localhost:5173/**`
- `http://localhost:5173/cambiar-password`

## Email confirmation

Actualmente **DESACTIVADO** (toggle off en Supabase → Auth → Sign In / Providers → Email → "Confirm email").

El código (Login.tsx) ya maneja ambos casos. Cuando salga el dominio propio:
1. Activar toggle en Supabase
2. Personalizar el template del email en Supabase → Auth → Templates

## Cómo correr una migración SQL

1. Abrir migración nueva en `supabase/migrations/00X_*.sql`
2. Ir a Supabase → SQL Editor → New query
3. Pegar contenido completo
4. Run (botón verde)
5. Aceptar el prompt de "destructive operations" si aparece (es normal, son `drop policy if exists`)
6. Verificar success en panel Results
7. Marcar como corrida en `docs/DATABASE.md`

## Camino al dominio propio

Cuando llegue el dominio (sugerencias: `neta.app`, `usaneta.com`, `holaneta.com`, `pmuneta.com`):

1. Comprar en Namecheap / Cloudflare (~$10-15 USD/año)
2. Netlify → Domain management → Add custom domain
3. Seguir las instrucciones de DNS (apuntar nameservers a Netlify o agregar CNAME)
4. SSL automático (Let's Encrypt)
5. Volver a Supabase → Auth → URL Configuration → cambiar Site URL al dominio nuevo + agregarlo a Redirect URLs (mantener el `.netlify.app` un tiempo)
6. Activar email confirmation
7. Comprar email Workspace o usar Cloudflare Email Routing para `hola@<dominio>`
8. Actualizar `src/lib/constants.ts` con el dominio del email de soporte real

## Service Worker — gotchas

- Está en `autoUpdate` silencioso. Cuando despliegues una versión nueva, las usuarias activas la reciben en segundos pero **deben recargar** para verla.
- Si reportan "no veo la nueva función" → instrucciones: cerrar todas las pestañas o hacer hard refresh (Ctrl+Shift+R en Windows, Cmd+Shift+R en Mac).
- Pendiente del ROADMAP: cambiar a `prompt` con toast "Hay nueva versión, recarga".
