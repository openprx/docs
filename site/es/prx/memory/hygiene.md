---
title: Higiene de memoria
description: Mantenimiento automatico de memoria incluyendo compactacion, deduplicacion y poda de entradas obsoletas.
---

# Higiene de memoria

La higiene de memoria se refiere a los procesos de mantenimiento automatico que mantienen el sistema de memoria saludable, relevante y dentro de los presupuestos de tamano. PRX ejecuta tareas de higiene periodicamente para compactar, deduplicar y podar memorias.

## Vision general

Sin higiene, los almacenes de memoria crecen sin limites y la calidad de recuperacion se degrada a medida que entradas irrelevantes diluyen los resultados de busqueda. El sistema de higiene aborda esto a traves de:

- **Compactacion** -- resumir grupos de memorias relacionadas en entradas concisas
- **Deduplicacion** -- fusionar entradas semanticamente duplicadas
- **Poda** -- eliminar memorias obsoletas o de baja relevancia
- **Archivado** -- mover memorias antiguas a almacenamiento frio

## Pipeline de higiene

```
Trigger (schedule or threshold)
    │
    ▼
┌──────────────┐
│ Deduplication │──── Merge near-duplicates
└──────┬───────┘
       ▼
┌──────────────┐
│  Compaction   │──── Summarize related entries
└──────┬───────┘
       ▼
┌──────────────┐
│   Pruning     │──── Remove stale entries
└──────┬───────┘
       ▼
┌──────────────┐
│   Archival    │──── Move to cold storage
└──────────────┘
```

## Configuracion

```toml
[memory.hygiene]
enabled = true
schedule = "daily"  # "hourly" | "daily" | "weekly"
max_entries = 10000
compaction_threshold = 100  # compact when group exceeds this size
prune_after_days = 90
dedup_similarity_threshold = 0.95
```

## Activacion manual

Puedes activar manualmente la higiene desde el CLI:

```bash
prx memory compact
prx memory prune --older-than 90d
prx memory stats
```

## Paginas relacionadas

- [Vision general del sistema de memoria](./)
- [Auto-evolucion L1](/es/prx/self-evolution/l1-memory) -- Compactacion de memoria en la auto-evolucion
