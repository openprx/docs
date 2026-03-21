---
title: Herramientas de memoria
description: Cinco herramientas para almacenar, recuperar, buscar y gestionar la memoria persistente a largo plazo del agente con soporte de categorias y aplicacion de ACL.
---

# Herramientas de memoria

PRX proporciona cinco herramientas de memoria que dan a los agentes la capacidad de persistir conocimiento entre conversaciones, recordar contexto relevante y gestionar su almacen de memoria a largo plazo.

El sistema de memoria soporta tres categorias integradas -- `core` (hechos permanentes), `daily` (notas de sesion) y `conversation` (contexto de chat) -- mas categorias personalizadas definidas por el usuario. Cada herramienta tiene reconocimiento de ACL: cuando el control de acceso a memoria esta habilitado, las operaciones se restringen basandose en reglas de acceso por principal.

## Configuracion

```toml
[memory]
backend = "sqlite"              # "markdown" | "sqlite" | "postgres" | "embeddings" | "memory"
auto_save = true                # Auto-guardar entrada de conversacion en memoria
acl_enabled = false             # Habilitar listas de control de acceso
max_recall_items = 20           # Maximo de items devueltos por recall/search
recall_relevance_threshold = 0.3  # Puntuacion minima de relevancia para recall
```

## Referencia de herramientas

### memory_store

Almacena un hecho, preferencia, nota o pieza de conocimiento en memoria a largo plazo.

### memory_forget

Elimina una entrada especifica de la memoria a largo plazo por clave.

### memory_get

Recupera una entrada de memoria especifica por su clave exacta. Con reconocimiento de ACL cuando esta habilitada.

### memory_recall

Recuerda memorias por palabra clave o similitud semantica. Esta herramienta se **deshabilita completamente** cuando `memory.acl_enabled = true`.

### memory_search

Busqueda de texto completo y vectorial en todas las entradas de memoria. A diferencia de `memory_recall`, permanece disponible cuando ACL esta habilitada, pero aplica restricciones de acceso por principal en los resultados.

## Seguridad

### Aplicacion de ACL

Cuando `memory.acl_enabled = true`:

| Herramienta | Comportamiento ACL |
|------------|-------------------|
| `memory_store` | Almacena entradas con la propiedad del principal actual |
| `memory_forget` | Solo permite olvidar entradas propiedad del principal actual |
| `memory_get` | Solo devuelve entradas a las que el principal actual tiene acceso |
| `memory_recall` | **Completamente deshabilitada** (eliminada del registro de herramientas) |
| `memory_search` | Solo devuelve entradas a las que el principal actual tiene acceso |

## Relacionado

- [Sistema de memoria](/es/prx/memory/) -- arquitectura y backends de almacenamiento
- [Backend Markdown](/es/prx/memory/markdown) -- almacenamiento de memoria basado en archivos
- [Backend SQLite](/es/prx/memory/sqlite) -- almacenamiento en base de datos local
- [Backend PostgreSQL](/es/prx/memory/postgres) -- almacenamiento en base de datos remota
- [Embeddings](/es/prx/memory/embeddings) -- configuracion de busqueda vectorial
- [Higiene de memoria](/es/prx/memory/hygiene) -- limpieza automatica y archivado
- [Vision general de herramientas](/es/prx/tools/) -- todas las herramientas y sistema de registro
