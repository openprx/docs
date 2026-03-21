---
title: Backend de memoria SQLite
description: Almacenamiento de memoria en base de datos local usando SQLite con busqueda de texto completo FTS5.
---

# Backend de memoria SQLite

El backend SQLite almacena memorias en una base de datos SQLite local con indexacion de busqueda de texto completo FTS5. Esto proporciona almacenamiento estructurado con recuperacion rapida manteniendo todo local.

## Vision general

SQLite es el backend de memoria por defecto para PRX. Ofrece un buen equilibrio entre rendimiento, funcionalidades y simplicidad:

- Busqueda de texto completo via extension FTS5
- Transacciones ACID para escrituras confiables
- Cero configuracion (base de datos de archivo unico)
- Eficiente para hasta decenas de miles de entradas de memoria

## Esquema

El backend SQLite usa las siguientes tablas principales:

- `memories` -- almacena entradas de memoria individuales con metadatos
- `memories_fts` -- tabla virtual FTS5 para busqueda de texto completo
- `topics` -- categorizacion por temas para organizacion de memoria

## Configuracion

```toml
[memory]
backend = "sqlite"

[memory.sqlite]
path = "~/.local/share/openprx/memory.db"
journal_mode = "wal"
busy_timeout_ms = 5000
```

## Busqueda de texto completo

El indice FTS5 habilita busqueda de texto completo clasificada a traves de todas las entradas de memoria. Las consultas soportan:

- Operadores booleanos (AND, OR, NOT)
- Coincidencia de frases con comillas
- Coincidencia de prefijos con asterisco
- Busqueda especifica por columna

## Paginas relacionadas

- [Vision general del sistema de memoria](./)
- [Backend PostgreSQL](./postgres) -- para despliegues multi-usuario
- [Higiene de memoria](./hygiene)
