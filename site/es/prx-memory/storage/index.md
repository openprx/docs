---
title: Backends de Almacenamiento
description: "Descripción general de los backends de almacenamiento de PRX-Memory incluyendo almacenamiento basado en archivos JSON, SQLite con extensiones vectoriales y LanceDB opcional."
---

# Backends de Almacenamiento

PRX-Memory soporta múltiples backends de almacenamiento para persistir memorias y sus embeddings vectoriales. El crate `prx-memory-storage` proporciona una interfaz unificada que todos los backends implementan.

## Backends Disponibles

| Backend | Valor de Configuración | Soporte Vectorial | Persistencia | Ideal Para |
|---------|----------------------|-------------------|--------------|------------|
| JSON | `json` | Embebido en entradas | Basado en archivo | Desarrollo, conjuntos de datos pequeños |
| SQLite | `sqlite` | Columnas vectoriales integradas | Basado en archivo | Producción, conjuntos de datos medianos |
| LanceDB | `lancedb` | Índice vectorial nativo | Basado en directorio | Grandes conjuntos de datos, búsqueda ANN rápida |

::: tip Backend por Defecto
El backend por defecto es JSON (`PRX_MEMORY_BACKEND=json`), que no requiere configuración adicional. Para despliegues en producción, se recomienda SQLite.
:::

## Backend JSON

El backend más simple almacena todas las memorias en un único archivo JSON. Es ideal para desarrollo, pruebas y conjuntos de memorias pequeños (menos de 10,000 entradas).

```bash
PRX_MEMORY_BACKEND=json
PRX_MEMORY_DB=./data/memory-db.json
```

**Ventajas:**
- Sin configuración -- solo especifica una ruta de archivo.
- Legible por humanos -- inspecciona y edita con cualquier editor de texto.
- Portátil -- copia el archivo para mover tu base de datos de memorias completa.

**Limitaciones:**
- El archivo completo se carga en memoria al inicio.
- Las operaciones de escritura reescriben el archivo completo.
- Sin búsqueda vectorial indexada -- escaneo de fuerza bruta para similitud.

## Backend SQLite

SQLite proporciona transacciones ACID, consultas indexadas y soporte de columnas vectoriales integrado para búsqueda de similitud eficiente.

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

Ver [Almacenamiento SQLite](./sqlite) para configuración detallada.

## Backend LanceDB (Opcional)

LanceDB proporciona búsqueda vectorial de vecino más cercano aproximado (ANN) nativa con almacenamiento columnar. Habilítalo con el indicador de característica `lancedb-backend`:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

```bash
PRX_MEMORY_BACKEND=lancedb
PRX_MEMORY_DB=./data/lancedb
```

::: warning Indicador de Característica Requerido
El soporte de LanceDB no está incluido en la compilación por defecto. Debes habilitar el indicador de característica `lancedb-backend` en tiempo de compilación.
:::

## Elegir un Backend

| Escenario | Backend Recomendado |
|-----------|---------------------|
| Desarrollo local | JSON |
| Producción con <100k entradas | SQLite |
| Producción con >100k entradas | LanceDB |
| Necesita almacenamiento legible por humanos | JSON |
| Necesita transacciones ACID | SQLite |
| Necesita búsqueda vectorial ANN rápida | LanceDB |

## Operaciones de Almacenamiento

PRX-Memory proporciona herramientas para el mantenimiento del almacenamiento:

| Herramienta | Descripción |
|-------------|-------------|
| `memory_export` | Exportar todas las memorias a un formato portátil |
| `memory_import` | Importar memorias desde una exportación |
| `memory_migrate` | Migrar entre backends de almacenamiento |
| `memory_compact` | Optimizar el almacenamiento y recuperar espacio |
| `memory_reembed` | Re-embeber todas las memorias con un nuevo modelo |

## Siguientes Pasos

- [Almacenamiento SQLite](./sqlite) -- Configuración y ajuste de SQLite
- [Búsqueda Vectorial](./vector-search) -- Cómo funciona la búsqueda por similitud vectorial
- [Referencia de Configuración](../configuration/) -- Todas las variables de entorno
