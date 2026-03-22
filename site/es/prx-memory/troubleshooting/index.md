---
title: Resolución de Problemas
description: "Problemas comunes de PRX-Memory y soluciones para configuración, embedding, reranking, almacenamiento e integración MCP."
---

# Resolución de Problemas

Esta página cubre los problemas comunes encontrados al ejecutar PRX-Memory, junto con sus causas y soluciones.

## Problemas de Configuración

### "PRX_EMBED_API_KEY is not configured"

**Causa:** Se solicitó un recall semántico remoto pero no se estableció ninguna clave de API de embedding.

**Solución:** Establece el proveedor de embedding y la clave de API:

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_api_key
```

O usa una clave de respaldo específica del proveedor:

```bash
JINA_API_KEY=your_api_key
```

::: tip
Si no necesitas búsqueda semántica, PRX-Memory funciona sin configuración de embedding usando solo coincidencia léxica.
:::

### "Unsupported rerank provider"

**Causa:** La variable `PRX_RERANK_PROVIDER` contiene un valor no reconocido.

**Solución:** Usa uno de los valores soportados:

```bash
PRX_RERANK_PROVIDER=jina        # or cohere, pinecone, pinecone-compatible, none
```

### "Unsupported embed provider"

**Causa:** La variable `PRX_EMBED_PROVIDER` contiene un valor no reconocido.

**Solución:** Usa uno de los valores soportados:

```bash
PRX_EMBED_PROVIDER=openai-compatible  # or jina, gemini
```

## Problemas de Sesión

### "session_expired"

**Causa:** Una sesión de streaming HTTP superó su TTL sin ser renovada.

**Solución:** Renueva la sesión antes de que expire o aumenta el TTL:

```bash
# Renew the session
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"

# Or increase the TTL (default: 300000ms = 5 minutes)
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000
```

## Problemas de Almacenamiento

### Archivo de base de datos no encontrado

**Causa:** La ruta especificada en `PRX_MEMORY_DB` no existe o no es escribible.

**Solución:** Asegúrate de que el directorio existe y la ruta es correcta:

```bash
mkdir -p ./data
PRX_MEMORY_DB=./data/memory-db.json
```

::: tip
Usa rutas absolutas para evitar problemas con cambios de directorio de trabajo.
:::

### Base de datos JSON grande lenta al cargar

**Causa:** El backend JSON carga el archivo completo en memoria al inicio. Para bases de datos con más de 10,000 entradas, esto puede ser lento.

**Solución:** Migra al backend SQLite:

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

Usa la herramienta `memory_migrate` para transferir los datos existentes.

## Problemas de Observabilidad

### Alerta de desbordamiento de cardinalidad de métricas

**Causa:** Demasiados valores de etiqueta distintos en las dimensiones de alcance de recall, categoría o proveedor de reranking.

**Solución:** Aumenta los límites de cardinalidad o normaliza tus entradas:

```bash
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_METRICS_MAX_RECALL_CATEGORY_LABELS=64
PRX_METRICS_MAX_RERANK_PROVIDER_LABELS=32
```

Cuando se superan los límites, los nuevos valores de etiqueta se descartan silenciosamente y se cuentan en `prx_memory_metrics_label_overflow_total`.

### Umbrales de alerta demasiado sensibles

**Causa:** Los umbrales de alerta por defecto pueden generar falsos positivos durante el despliegue inicial.

**Solución:** Ajusta los umbrales según tus tasas de error esperadas:

```bash
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.10
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.30
```

## Problemas de Compilación

### Característica LanceDB no disponible

**Causa:** El indicador de característica `lancedb-backend` no fue habilitado en tiempo de compilación.

**Solución:** Recompila con el indicador de característica:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

### Errores de compilación en Linux

**Causa:** Dependencias del sistema faltantes para compilar código nativo.

**Solución:** Instala las dependencias de compilación:

```bash
# Debian/Ubuntu
sudo apt install -y build-essential pkg-config libssl-dev

# Fedora
sudo dnf install -y gcc openssl-devel pkg-config
```

## Verificación de Salud

Usa el endpoint de salud HTTP para verificar que el servidor está funcionando correctamente:

```bash
curl -sS http://127.0.0.1:8787/health
```

Comprueba las métricas para el estado operacional:

```bash
curl -sS http://127.0.0.1:8787/metrics/summary
```

## Comandos de Validación

Ejecuta la suite de validación completa para verificar tu instalación:

```bash
# Multi-client validation
./scripts/run_multi_client_validation.sh

# Soak test (60 seconds, 4 QPS)
./scripts/run_soak_http.sh 60 4
```

## Obtener Ayuda

- **Repositorio:** [github.com/openprx/prx-memory](https://github.com/openprx/prx-memory)
- **Issues:** [github.com/openprx/prx-memory/issues](https://github.com/openprx/prx-memory/issues)
- **Documentación:** [docs/README.md](https://github.com/openprx/prx-memory/blob/main/docs/README.md)
