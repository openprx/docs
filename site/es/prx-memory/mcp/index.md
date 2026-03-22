---
title: Integración MCP
description: "Integración del protocolo MCP de PRX-Memory, herramientas soportadas, recursos, plantillas y modos de transporte."
---

# Integración MCP

PRX-Memory está construido como un servidor MCP (Model Context Protocol) nativo. Expone operaciones de memoria como herramientas MCP, habilidades de gobernanza como recursos MCP, y plantillas de payload para interacciones de memoria estandarizadas.

## Modos de Transporte

### stdio

El transporte stdio se comunica sobre entrada/salida estándar, lo que lo hace ideal para integración directa con clientes MCP como Claude Code, Codex y OpenClaw.

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

### HTTP

El transporte HTTP proporciona un servidor accesible por red con endpoints operacionales adicionales.

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

Endpoints exclusivos de HTTP:

| Endpoint | Descripción |
|----------|-------------|
| `GET /health` | Verificación de salud |
| `GET /metrics` | Métricas Prometheus |
| `GET /metrics/summary` | Resumen de métricas JSON |
| `POST /mcp/session/renew` | Renovar sesión de streaming |

## Configuración del Cliente MCP

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

::: tip
Usa rutas absolutas tanto para `command` como para `PRX_MEMORY_DB` para evitar problemas de resolución de rutas.
:::

## Herramientas MCP

PRX-Memory expone las siguientes herramientas a través de la interfaz MCP `tools/call`:

### Operaciones de Memoria Centrales

| Herramienta | Descripción |
|-------------|-------------|
| `memory_store` | Almacenar una nueva entrada de memoria con texto, alcance, etiquetas y metadatos |
| `memory_recall` | Recuperar memorias que coincidan con una consulta usando búsqueda léxica, vectorial y rerankada |
| `memory_update` | Actualizar una entrada de memoria existente |
| `memory_forget` | Eliminar una entrada de memoria por ID |

### Operaciones en Bulk

| Herramienta | Descripción |
|-------------|-------------|
| `memory_export` | Exportar todas las memorias a un formato JSON portátil |
| `memory_import` | Importar memorias desde una exportación |
| `memory_migrate` | Migrar entre backends de almacenamiento |
| `memory_reembed` | Re-embeber todas las memorias con el modelo de embedding actual |
| `memory_compact` | Compactar y optimizar el almacenamiento |

### Evolución

| Herramienta | Descripción |
|-------------|-------------|
| `memory_evolve` | Evolucionar memoria usando aceptación train/holdout con restricción por compuerta |

### Descubrimiento de Habilidades

| Herramienta | Descripción |
|-------------|-------------|
| `memory_skill_manifest` | Retornar el manifiesto de habilidades para habilidades de gobernanza |

## Recursos MCP

PRX-Memory expone paquetes de habilidades de gobernanza como recursos MCP:

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/list", "params": {}}
```

Leer un recurso específico:

```json
{"jsonrpc": "2.0", "id": 2, "method": "resources/read", "params": {"uri": "prx://skills/governance"}}
```

## Plantillas de Recursos

Las plantillas de payload ayudan a los clientes a construir operaciones de memoria estandarizadas:

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/templates/list", "params": {}}
```

Usar una plantilla para generar un payload de almacenamiento:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "prx://templates/memory-store?text=Pitfall:+always+handle+errors&scope=global"
  }
}
```

## Sesiones de Streaming

El transporte HTTP soporta Server-Sent Events (SSE) para respuestas en streaming. Las sesiones tienen un TTL configurable:

```bash
PRX_MEMORY_STREAM_SESSION_TTL_MS=300000  # 5 minutes
```

Renovar una sesión antes de que expire:

```bash
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"
```

## Perfiles de Estandarización

PRX-Memory soporta dos perfiles de estandarización que controlan cómo se etiquetan y validan las entradas de memoria:

| Perfil | Descripción |
|--------|-------------|
| `zero-config` | Restricciones mínimas, acepta cualquier etiqueta y alcance (por defecto) |
| `governed` | Normalización estricta de etiquetas, límites de ratio y restricciones de calidad |

```bash
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend
```

## Siguientes Pasos

- [Inicio Rápido](../getting-started/quickstart) -- Primeras operaciones de almacenamiento y recuperación
- [Referencia de Configuración](../configuration/) -- Todas las variables de entorno
- [Resolución de Problemas](../troubleshooting/) -- Problemas comunes de MCP
