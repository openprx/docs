---
title: Seguridad de evolucion
description: Proteccion de rollback, verificaciones de cordura y mecanismos de seguridad para la auto-evolucion de PRX.
---

# Seguridad de evolucion

La seguridad es la maxima prioridad del sistema de auto-evolucion. Cada cambio incluye capacidad de rollback, verificaciones de cordura pre/post y deteccion automatica de regresiones para prevenir modificaciones daninas.

## Mecanismos de seguridad

### Proteccion de rollback

Cada cambio de evolucion crea una instantanea antes de su aplicacion. Si se detectan problemas, el sistema puede revertir instantaneamente al estado anterior:

- **Rollback automatico** -- se dispara cuando las verificaciones de cordura post-cambio fallan
- **Rollback manual** -- disponible via CLI para reversiones iniciadas por humanos
- **Rollback basado en tiempo** -- los cambios se auto-revierten si no se confirman explicitamente dentro de la ventana de rollback

### Verificaciones de cordura

Antes y despues de cada cambio, el sistema valida:

- La funcionalidad principal sigue funcionando (pruebas de humo)
- Las invariantes de seguridad se mantienen (ej., sin debilitamiento de politicas de seguridad)
- Las metricas de rendimiento permanecen dentro de limites aceptables
- Sin dependencias circulares ni reglas conflictivas

### Deteccion de regresiones

Despues de aplicar un cambio, el sistema monitorea metricas clave durante un periodo configurable:

- Tasa de completacion de tareas
- Tasa de errores
- Calidad promedio de respuestas
- Senales de satisfaccion del usuario

Si alguna metrica se degrada mas alla de un umbral, el cambio se revierte automaticamente.

## Configuracion

```toml
[self_evolution.safety]
rollback_enabled = true
rollback_window_hours = 168  # 7 dias
sanity_check_timeout_secs = 30
regression_monitoring_hours = 24
max_regression_threshold = 0.1  # 10% de degradacion dispara rollback
```

## Comandos CLI

```bash
prx evolution status          # Ver estado activo de evolucion
prx evolution rollback        # Revertir el ultimo cambio
prx evolution history         # Ver historial de evolucion
prx evolution approve <id>    # Aprobar una propuesta pendiente
```

## Paginas relacionadas

- [Vision general de auto-evolucion](./)
- [Pipeline de evolucion](./pipeline)
- [Motor de politicas de seguridad](/es/prx/security/policy-engine)
