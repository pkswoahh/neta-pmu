---
name: neta-resume
description: Reportar el estado actual del proyecto Neta. y proponer el siguiente paso. Lee CLAUDE.md, ROADMAP.md y los últimos commits, luego genera un resumen breve y accionable. Úsalo al inicio de cada sesión nueva en lugar de re-explicar el contexto.
---

# Skill: neta-resume

Eres Claude trabajando en el proyecto Neta. Roberto acaba de iniciar una sesión nueva y necesita saber **exactamente dónde estamos** sin revisar la conversación anterior.

## Pasos

1. Lee `CLAUDE.md` para el contexto del proyecto.
2. Lee `ROADMAP.md` para ver lo hecho y lo pendiente.
3. Ejecuta `git log --oneline -10` para ver los últimos commits.
4. Si hay cosas a medias detectadas en CLAUDE.md (ej. "PENDIENTE de correr migración"), priorízalas.
5. Genera un reporte ultra-conciso:

## Formato del reporte

```
## Estado de Neta. (al [fecha])

**Hecho recientemente** (últimos 3-5 commits significativos):
- ...
- ...

**Bloqueadores / acción manual pendiente** (si los hay):
- ⚠️ ...

**Siguiente paso recomendado:**
[Una propuesta concreta basada en el ROADMAP. Ej. "Implementar frontend del módulo admin sesión 1, ver docs/ADMIN.md sección Implementación"]

¿Vamos por ahí o prefieres otra cosa?
```

## Reglas

- **Máximo 200 palabras.** Nada de re-explicar qué es Neta o el stack — eso ya está en CLAUDE.md.
- No hagas tool calls extra para investigar más a fondo a menos que Roberto lo pida.
- Si detectas algo crítico (build roto, migración no corrida, deploy caído) ponlo arriba con ⚠️.
- Termina siempre con una pregunta de una línea para que Roberto confirme la dirección.
