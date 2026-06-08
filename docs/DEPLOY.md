# Deploy y operación

## URLs

| Recurso | URL |
|---|---|
| Producción | https://netapmu.com (dominio propio desde 2026-04-30) |
| Netlify (alias) | https://neta-pmu.netlify.app |
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

- **Site URL**: `https://netapmu.com`
- **Redirect URLs**:
  - `https://netapmu.com/**`
  - `https://netapmu.com/cambiar-password`
  - `https://neta-pmu.netlify.app/**` (mantener como fallback)
  - `https://neta-pmu.netlify.app/cambiar-password`

Para desarrollo local, agregar también:
- `http://localhost:5173/**`
- `http://localhost:5173/cambiar-password`

## Email / SMTP

**SMTP propio (Resend) — ACTIVO desde 2026-06-07.** Dominio `netapmu.com` verificado en Resend (DKIM + SPF + DMARC en Netlify DNS, todos en el subdominio `send.` / `resend._domainkey` para no tocar el MX de ImprovMX que recibe `hola@`). SMTP configurado en Supabase → Authentication → Emails → SMTP Settings:
- Host `smtp.resend.com` · Port `465` · Username `resend` · Password = API key de Resend (`re_...`)
- Sender: `hola@netapmu.com` / `Neta.`
- Probado con "recuperar contraseña" → llega a Recibidos (no spam) desde `hola@netapmu.com`. ✅

**Email confirmation: todavía DESACTIVADO** (toggle off en Supabase → Auth → Sign In / Providers → Email → "Confirm email"). El código (Login.tsx) ya maneja ambos casos. Para activarlo (Fase 2, pendiente):
1. Supabase → Auth → Email Templates → "Confirm signup": pegar `docs/email-templates/confirm-signup.html` y subject `Confirma tu cuenta — Neta.`
2. Activar el toggle "Confirm email"
3. Probar registro de cuenta nueva → debe llegar el correo de confirmación

## Cómo correr una migración SQL

1. Abrir migración nueva en `supabase/migrations/00X_*.sql`
2. Ir a Supabase → SQL Editor → New query
3. Pegar contenido completo
4. Run (botón verde)
5. Aceptar el prompt de "destructive operations" si aparece (es normal, son `drop policy if exists`)
6. Verificar success en panel Results
7. Marcar como corrida en `docs/DATABASE.md`

## Dominio propio — netapmu.com (activo desde 2026-04-30)

Migración completada:
1. ✅ Dominio comprado: `netapmu.com`
2. ☐ Netlify → Domain management → Add custom domain → DNS configurado
3. ☐ SSL automático (Let's Encrypt — Netlify lo activa solo)
4. ☐ Supabase → Auth → URL Configuration → Site URL y Redirect URLs actualizados
5. ☐ Confirmación de email activada (Auth → Sign In / Providers → Email → "Confirm email")
6. ☐ Email `hola@netapmu.com` configurado (Cloudflare Email Routing o Google Workspace)
7. ✅ `src/lib/constants.ts` — SUPPORT_EMAIL actualizado a `hola@netapmu.com`

## Service Worker — gotchas

- Está en `autoUpdate` silencioso. Cuando despliegues una versión nueva, las usuarias activas la reciben en segundos pero **deben recargar** para verla.
- Si reportan "no veo la nueva función" → instrucciones: cerrar todas las pestañas o hacer hard refresh (Ctrl+Shift+R en Windows, Cmd+Shift+R en Mac).
- Pendiente del ROADMAP: cambiar a `prompt` con toast "Hay nueva versión, recarga".
