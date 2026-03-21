---
title: Backend de memoria PostgreSQL
description: Almacenamiento de memoria en base de datos remota usando PostgreSQL para despliegues de servidor multi-usuario.
---

# Backend de memoria PostgreSQL

El backend PostgreSQL almacena memorias en una base de datos PostgreSQL remota, habilitando memoria compartida entre multiples usuarios e instancias del agente. Este es el backend recomendado para despliegues en servidor.

## Vision general

El backend PostgreSQL proporciona:

- Memoria compartida entre multiples instancias de PRX
- Busqueda de texto completo via `tsvector` y `pg_trgm`
- Seguridad a nivel de fila para aislamiento multi-tenant
- Escalabilidad horizontal para despliegues grandes

## Configuracion

```toml
[memory]
backend = "postgres"

[memory.postgres]
url = "postgresql://prx:password@localhost:5432/prx_memory"
max_connections = 5
schema = "memory"
```

## Aislamiento multi-usuario

Cuando multiples usuarios comparten un backend de memoria PostgreSQL, las memorias de cada usuario estan aisladas por ID de usuario. El backend usa consultas parametrizadas para todas las operaciones para prevenir inyeccion SQL.

## Migracion

El backend PostgreSQL incluye migraciones automaticas del esquema que se ejecutan al iniciar. No se requieren pasos manuales de migracion.

## Paginas relacionadas

- [Vision general del sistema de memoria](./)
- [Backend SQLite](./sqlite) -- para despliegues locales
- [Higiene de memoria](./hygiene)
