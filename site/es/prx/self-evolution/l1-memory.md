---
title: "L1: Evolucion de memoria"
description: Capa 1 de auto-evolucion en PRX que cubre compactacion de memoria y agrupacion por temas.
---

# L1: Evolucion de memoria

La capa 1 es la capa de auto-evolucion mas frecuente y de menor riesgo. Opera sobre el sistema de memoria del agente, compactando automaticamente entradas redundantes y agrupando recuerdos relacionados por tema.

## Vision general

La evolucion L1 se ejecuta despues de cada sesion (o segun un cronograma configurable) y realiza:

- **Compactacion** -- fusionar multiples entradas de memoria relacionadas en resumenes concisos
- **Agrupacion por temas** -- agrupar recuerdos por similitud semantica
- **Puntuacion de relevancia** -- ajustar pesos de memoria basandose en frecuencia de acceso
- **Poda** -- eliminar recuerdos que se han vuelto obsoletos o contradichos

## Como funciona

1. Despues de que una sesion termina, L1 analiza los recuerdos recien almacenados
2. Identifica clusters de entradas relacionadas usando similitud de embeddings
3. Los clusters que exceden un umbral de tamano se compactan en resumenes
4. Las puntuaciones de relevancia de memoria se actualizan basandose en frecuencia de recuperacion

## Configuracion

```toml
[self_evolution.l1]
enabled = true
schedule = "after_session"  # o "hourly", "daily"
compaction_threshold = 10
cluster_similarity = 0.8
min_access_count = 2
```

## Paginas relacionadas

- [Vision general de auto-evolucion](./)
- [Higiene de memoria](/es/prx/memory/hygiene)
- [L2: Optimizacion de prompt](./l2-prompt)
