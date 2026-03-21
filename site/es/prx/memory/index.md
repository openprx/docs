---
title: Sistema de memoria
description: Vision general del sistema de memoria de PRX con 5 backends de almacenamiento para contexto persistente del agente.
---

# Sistema de memoria

PRX proporciona un sistema de memoria flexible que permite a los agentes persistir y recuperar contexto entre conversaciones. El sistema de memoria soporta 5 backends de almacenamiento, cada uno optimizado para diferentes escenarios de despliegue.

## Vision general

El sistema de memoria cumple tres funciones principales:

- **Recuperacion** -- obtener interacciones pasadas y hechos relevantes antes de cada llamada LLM
- **Almacenamiento** -- persistir informacion importante extraida de conversaciones
- **Compactacion** -- resumir y comprimir memorias antiguas para ajustarse a los limites de contexto

## Backends de almacenamiento

| Backend | Persistencia | Busqueda | Ideal para |
|---------|-------------|----------|------------|
| [Markdown](./markdown) | Basado en archivos | Grep de texto completo | CLI de usuario unico, memoria con control de versiones |
| [SQLite](./sqlite) | Base de datos local | FTS5 texto completo | Despliegues locales, equipos pequenos |
| [PostgreSQL](./postgres) | Base de datos remota | pg_trgm + FTS | Despliegues de servidor multi-usuario |
| [Embeddings](./embeddings) | Almacen de vectores | Similitud semantica | Recuperacion estilo RAG, bases de conocimiento grandes |
| En memoria | Ninguna (solo sesion) | Escaneo lineal | Sesiones efimeras, pruebas |

## Configuracion

Selecciona y configura el backend de memoria en `config.toml`:

```toml
[memory]
backend = "sqlite"  # "markdown" | "sqlite" | "postgres" | "embeddings" | "memory"
max_recall_items = 20
recall_relevance_threshold = 0.3

[memory.sqlite]
path = "~/.local/share/openprx/memory.db"

[memory.postgres]
url = "postgresql://user:pass@localhost/prx"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768
```

## Ciclo de vida de la memoria

1. **Extraccion** -- despues de cada turno de conversacion, el sistema extrae hechos clave
2. **Deduplicacion** -- los nuevos hechos se comparan contra memorias existentes
3. **Almacenamiento** -- los hechos unicos se persisten en el backend configurado
4. **Recuperacion** -- antes de cada llamada LLM, se obtienen memorias relevantes
5. **Higiene** -- mantenimiento periodico compacta y poda entradas obsoletas

## Paginas relacionadas

- [Backend Markdown](./markdown)
- [Backend SQLite](./sqlite)
- [Backend PostgreSQL](./postgres)
- [Backend de embeddings](./embeddings)
- [Higiene de memoria](./hygiene)
