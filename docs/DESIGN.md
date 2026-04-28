# Diseño y marca

## Identidad

- **Nombre**: Neta. (siempre con punto final)
- **Tagline**: "Tu negocio, claro como el agua."
- **Logo**: texto `Neta.` con punto en `#E8A598`. Componente: `<Logo size="sm|md|lg|xl">`
- **Tono**: cercano, claro, en español neutro LATAM. Sin tecnicismos.

## Paleta

| Token | Hex | Uso |
|---|---|---|
| `bg` | `#0F0F0F` | Fondo general |
| `surface` | `#1A1A1A` | Cards, modales |
| `border` | `#2A2A2A` | Bordes sutiles |
| `accent` | `#E8A598` | Nude rosado — botones primarios, foco, brand |
| `gold` | `#D4A96A` | Champagne — acentos secundarios, breakdowns |
| `primary` | `#FFFFFF` | Texto principal |
| `muted` | `#A0A0A0` | Texto secundario, labels |
| `positive` | `#6EE7B7` | Verde — ingresos, mejoras, success |
| `negative` | `#FDA4AF` | Rosa rojo — gastos, errores, suspensión |

Definidos en `tailwind.config.js`. Nunca hardcodear hex en componentes — usar las clases de Tailwind (`bg-bg`, `text-accent`, etc.).

## Tipografía

- **Familia**: Inter (Google Fonts). Pesos cargados: 300, 400, 500, 600, 700.
- Tamaños vía Tailwind. Headers: `text-xl`/`text-2xl`/`text-3xl` con `font-semibold` y `tracking-tight`.

## Componentes UI

### Cards
```tsx
<div className="neta-card">  // bg-surface, border, rounded-2xl, p-5
```

### Inputs
```tsx
<input className="neta-input" />  // bg-bg, border, rounded-xl, px-4 py-3, focus:border-accent
<label className="neta-label">  // text-sm text-muted mb-2
```

### Botones
```tsx
<button className="neta-btn-primary">    // Acento, alto contraste
<button className="neta-btn-ghost">       // Outline sutil
<button className="neta-btn-danger">      // Rojo suave para borrar
```

### Especiales
- `<Logo size="...">` — el wordmark
- `<Modal title="..." onClose={...} footer={...}>` — modal mobile-friendly
- `<Select value onChange options={[...]}>` — dropdown estilizado
- `<MoneyInput value onChange currency>` — input con símbolo y formato miles
- `<MonthSelector value onChange>` — selector de mes con flechas
- `<ListSkeleton rows={N}>` y `<DashboardSkeleton>` — placeholders con shimmer
- `<Empty title hint icon>` — estado vacío

## Reglas UX

- **Mobile-first**, base 375px. Sin scroll horizontal en ninguna vista.
- Bottom nav fija de 5 tabs en mobile (Inicio, Servicios, Clientes, Gastos, Config).
- Sidebar izquierda en desktop ≥768px.
- Toasts: arriba centrado, máximo 2s, no bloquean.
- Dropdowns muestran las opciones de la usuaria. Si vacías → mensaje "Configura tus opciones en Configuración".
- Todos los valores monetarios respetan `profile.currency`.
- Confirmaciones críticas: `useConfirm()` con `variant: 'danger'` cuando aplique.
- Animaciones sutiles: `animate-fade-in` (200ms) y `animate-slide-up` (250ms) ya definidas.

## Fondo de partículas

`<Particles>` — Canvas con dots tipo constelaciones. Color mezcla blanco + nude + champagne. Halo radial suave + líneas entre dots cercanos. Reactivo al mouse en desktop. Honra `prefers-reduced-motion`. Densidad: 36 dots mobile, 80 desktop.

No tocar a menos que se vuelva a ajustar intensidad.

## Voice & copy

Ejemplos del tono:
- Vacío de procedimientos: *"Aún no hay procedimientos este mes — Toca «+» para registrar el primero."*
- Toast de éxito: *"Registrado"*, *"Actualizado"*, *"Eliminado"*
- Onboarding: *"Vamos a dejar tu espacio listo en 30 segundos."*
- Meta superada: *"¡Meta superada! Vas N% por encima."*

Evita: "su", "usted", "sistema", "registro" (como sustantivo). Prefiere: "tu", "tienes", "guardar", "agregar".

## Iconografía

`lucide-react`. Iconos consistentes y reconocibles:
- Dashboard: `LayoutDashboard`
- Procedimientos: `ClipboardList`
- Clientes: `Users`
- Gastos: `Wallet`
- Configuración: `Settings`
- Meta: `Target`
- Subir: `TrendingUp` · Bajar: `TrendingDown`
