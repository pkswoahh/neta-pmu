---
name: neta-feature
description: Iniciar la implementación de una feature de Neta. siguiendo los patrones del proyecto. Recibe el nombre o descripción de la feature en $ARGUMENTS. Carga solo los docs relevantes según la feature, propone diseño, y empieza a codear cuando Roberto confirme.
---

# Skill: neta-feature

Roberto quiere construir una feature nueva: **$ARGUMENTS**

## Pasos

1. Lee `CLAUDE.md` y `ROADMAP.md` para confirmar que la feature está en el plan (o es razonable agregarla).
2. Identifica qué área toca y carga **solo** los docs necesarios:
   - Si toca DB / RLS → `docs/DATABASE.md`
   - Si toca admin → `docs/ADMIN.md`
   - Si es UX / componentes nuevos → `docs/DESIGN.md`
   - Si toca pagos → `docs/STRIPE.md`
   - Si es deploy/dominio → `docs/DEPLOY.md`
3. Lee los archivos de código que vas a tocar (no todo el repo, solo los relevantes).
4. Propón un plan corto:
   - Cambios de DB (si aplica)
   - Componentes/páginas nuevas
   - Modificaciones a contextos / utils
   - Test mental: ¿qué se rompería?
5. Espera confirmación de Roberto antes de codear.
6. Implementa siguiendo los patrones del proyecto (ver `docs/ARCHITECTURE.md`).
7. Al cerrar:
   - Verifica build (`npm run build`)
   - Marca `[x]` en `ROADMAP.md` si la feature estaba listada
   - Commit descriptivo + push

## Reglas

- **No re-explicar el proyecto** — ya hay docs.
- **No agregar libs** sin razón fuerte (bundle ya pesa).
- **Mobile-first siempre.** Diseña primero la versión móvil.
- **Mismo idioma**: UI siempre en español neutro LATAM.
- **Reutilizar componentes**: Logo, Modal, Select, MoneyInput, MonthSelector, Empty, Skeleton, Confirm, Toast.
- **Siempre RLS** si tocas DB. Sin excepciones.
- Si la feature requiere migración → `supabase/migrations/00X_*.sql` idempotente, y Roberto debe correrla manualmente en Supabase.
