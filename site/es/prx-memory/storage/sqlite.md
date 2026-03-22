---
title: Almacenamiento SQLite
description: "Configurar y ajustar el backend de almacenamiento SQLite para PRX-Memory con columnas vectoriales y consultas indexadas."
---

# Almacenamiento SQLite

El backend SQLite proporciona un motor de almacenamiento robusto basado en archivos con transacciones ACID, consultas indexadas y soporte de columnas vectoriales integrado. Es el backend recomendado para despliegues en producción con hasta 100,000 memorias.

## Configuración

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

El archivo de base de datos se crea automáticamente en la primera ejecución. Todas las tablas, índices y columnas vectoriales son inicializados por PRX-Memory.

## Descripción del Esquema

El backend SQLite almacena memorias en un esquema estructurado:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | TEXT | Identificador único de memoria |
| `text` | TEXT | Contenido de la memoria |
| `scope` | TEXT | Alcance de la memoria (global, proyecto, etc.) |
| `tags` | TEXT | Array JSON de etiquetas |
| `importance` | REAL | Puntuación de importancia (0.0--1.0) |
| `created_at` | TEXT | Timestamp ISO 8601 |
| `updated_at` | TEXT | Timestamp ISO 8601 |
| `embedding` | BLOB | Embedding vectorial (si está habilitado) |
| `metadata` | TEXT | Metadatos JSON adicionales |

## Almacenamiento Vectorial

Cuando el embedding está habilitado, los datos vectoriales se almacenan como columnas BLOB en la misma tabla que la entrada de memoria. Esta co-ubicación simplifica las consultas y evita el overhead de joins.

La búsqueda de similitud vectorial usa cálculo de similitud coseno de fuerza bruta sobre los vectores almacenados. Para conjuntos de datos de menos de 100,000 entradas, esto proporciona tiempos de consulta por debajo de un segundo (p95 inferior a 123ms según benchmarks).

## Mantenimiento

### Compactación

Con el tiempo, las eliminaciones y actualizaciones pueden dejar espacio fragmentado. Usa `memory_compact` para recuperar espacio:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_compact",
    "arguments": {}
  }
}
```

### Respaldo

El archivo de base de datos SQLite puede respaldarse simplemente copiando el archivo mientras el servidor está detenido:

```bash
cp ./data/memory.db ./data/memory.db.backup
```

::: warning
No copies el archivo de base de datos mientras el servidor está en ejecución. SQLite usa write-ahead logging (WAL) y una copia de archivo durante escrituras puede producir un respaldo corrupto. Detén el servidor primero o usa la herramienta `memory_export` para una exportación segura.
:::

### Migración desde JSON

Para migrar del backend JSON a SQLite:

1. Exporta tus memorias usando `memory_export`.
2. Cambia la configuración del backend a SQLite.
3. Importa los datos exportados usando `memory_import`.

O usa la herramienta `memory_migrate` para una migración directa.

## Siguientes Pasos

- [Búsqueda Vectorial](./vector-search) -- Cómo funciona la búsqueda por similitud internamente
- [Descripción General del Almacenamiento](./index) -- Comparar todos los backends
- [Referencia de Configuración](../configuration/) -- Todas las variables de entorno
