---
title: Inicio Rápido
description: "Almacena y recupera tu primera memoria con PRX-Memory en 7 pasos."
---

# Inicio Rápido

## Paso 1 - Compilar el Daemon

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd
```

## Paso 2 - Iniciar el Servidor

**Modo stdio (para clientes MCP como Claude Code):**

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/release/prx-memoryd
```

**Modo HTTP (para acceso en red):**

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
./target/release/prx-memoryd
```

## Paso 3 - Configurar tu Cliente MCP

Añade PRX-Memory al archivo de configuración de tu cliente MCP:

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/data/memory-db.json"
      }
    }
  }
}
```

## Paso 4 - Almacenar una Memoria

Usa la herramienta `memory_store` para añadir una entrada de memoria:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_store",
    "arguments": {
      "text": "Always validate inputs before processing to prevent injection attacks.",
      "scope": "global",
      "tags": ["security", "validation"],
      "importance": 0.9
    }
  }
}
```

## Paso 5 - Recuperar Memorias

Usa la herramienta `memory_recall` para buscar memorias:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "memory_recall",
    "arguments": {
      "query": "input validation security",
      "limit": 5
    }
  }
}
```

## Paso 6 - Habilitar Búsqueda Semántica

Para búsqueda semántica, configura un proveedor de embedding:

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_jina_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
./target/release/prx-memoryd
```

## Paso 7 - Habilitar Reranking

Para mayor precisión en la recuperación, añade un proveedor de reranking:

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_jina_key \
PRX_RERANK_PROVIDER=cohere \
PRX_RERANK_API_KEY=your_cohere_key \
PRX_RERANK_MODEL=rerank-v3.5 \
./target/release/prx-memoryd
```

## Herramientas MCP Disponibles

| Herramienta | Descripción |
|-------------|-------------|
| `memory_store` | Almacenar una nueva entrada de memoria |
| `memory_recall` | Recuperar memorias que coincidan con una consulta |
| `memory_update` | Actualizar una entrada de memoria existente |
| `memory_forget` | Eliminar una entrada de memoria por ID |
| `memory_export` | Exportar todas las memorias a formato portátil |
| `memory_import` | Importar memorias desde una exportación |
| `memory_migrate` | Migrar entre backends de almacenamiento |
| `memory_reembed` | Re-embeber todas las memorias con el modelo actual |
| `memory_compact` | Compactar y optimizar el almacenamiento |
| `memory_evolve` | Evolucionar memorias con pruebas train/holdout |
| `memory_skill_manifest` | Retornar el manifiesto de habilidades de gobernanza |

## Siguientes Pasos

- [Motor de Embedding](../embedding/) -- Configurar búsqueda semántica
- [Motor de Reranking](../reranking/) -- Mejorar la precisión de recuperación
- [Backends de Almacenamiento](../storage/) -- Elegir el backend correcto para producción
- [Integración MCP](../mcp/) -- Referencia completa del protocolo MCP
