---
title: Ollama
description: Configurar Ollama como proveedor LLM en PRX para inferencia LLM local y auto-alojada
---

# Ollama

> Ejecuta LLMs localmente o en infraestructura auto-alojada con Ollama. Soporta vision, llamada nativa a herramientas, modelos de razonamiento y enrutamiento opcional a la nube via Ollama Cloud.

## Requisitos previos

- [Ollama](https://ollama.com/) instalado y ejecutandose localmente, **o**
- Una instancia remota de Ollama con acceso de red

## Configuracion rapida

### 1. Instalar Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Start the server
ollama serve
```

### 2. Descargar un modelo

```bash
ollama pull qwen3
```

### 3. Configurar

```toml
[default]
provider = "ollama"
model = "qwen3"
```

No se requiere clave API para uso local.

### 4. Verificar

```bash
prx doctor models
```

## Modelos disponibles

Cualquier modelo disponible a traves de Ollama puede usarse. Opciones populares incluyen:

| Modelo | Parametros | Vision | Uso de herramientas | Notas |
|--------|-----------|--------|-------------------|-------|
| `qwen3` | 8B | No | Si | Excelente modelo multilingue para codigo |
| `qwen2.5-coder` | 7B | No | Si | Especializado en codigo |
| `llama3.1` | 8B/70B/405B | No | Si | Familia de modelos abiertos de Meta |
| `mistral-nemo` | 12B | No | Si | Razonamiento eficiente |
| `deepseek-r1` | 7B/14B/32B | No | Si | Modelo de razonamiento |
| `llava` | 7B/13B | Si | No | Vision + lenguaje |
| `gemma2` | 9B/27B | No | Si | Modelo abierto de Google |
| `codellama` | 7B/13B/34B | No | No | Llama especializado en codigo |

Ejecuta `ollama list` para ver tus modelos instalados.

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `api_key` | string | opcional | Clave API para instancias remotas/nube de Ollama |
| `api_url` | string | `http://localhost:11434` | URL base del servidor Ollama |
| `model` | string | requerido | Nombre del modelo (ej., `qwen3`, `llama3.1:70b`) |
| `reasoning` | bool | opcional | Habilitar modo `think` para modelos de razonamiento |

## Caracteristicas

### Cero configuracion para uso local

Al ejecutar Ollama localmente, no se necesita clave API ni configuracion especial. PRX se conecta automaticamente a `http://localhost:11434`.

### Llamada nativa a herramientas

PRX usa el soporte nativo de llamada a herramientas de Ollama via `/api/chat`. Las definiciones de herramientas se envian en el cuerpo de la solicitud y los `tool_calls` estructurados son devueltos por modelos compatibles (qwen2.5, llama3.1, mistral-nemo, etc.).

PRX tambien maneja comportamientos peculiares de modelos:
- **Llamadas a herramientas anidadas**: `{"name": "tool_call", "arguments": {"name": "shell", ...}}` se desenvuelven automaticamente
- **Nombres con prefijo**: `tool.shell` se normaliza a `shell`
- **Mapeo de resultados de herramientas**: Los IDs de llamada a herramientas se rastrean y mapean a campos `tool_name` en mensajes de resultado de herramientas posteriores

### Soporte de vision

Los modelos con capacidad de vision (ej., LLaVA) reciben imagenes via el campo nativo `images` de Ollama. PRX extrae automaticamente datos de imagen base64 de marcadores `[IMAGE:...]` y los envia como entradas de imagen separadas.

### Modo de razonamiento

Para modelos de razonamiento (QwQ, DeepSeek-R1, etc.), habilita el parametro `think`:

```toml
[providers.ollama]
reasoning = true
```

Esto envia `"think": true` en la solicitud, habilitando el proceso de razonamiento interno del modelo. Si el modelo devuelve solo un campo `thinking` con contenido vacio, PRX proporciona un mensaje de respaldo elegante.

### Instancias remotas y en la nube

Para conectar a un servidor Ollama remoto:

```toml
[providers.ollama]
api_url = "https://my-ollama-server.example.com:11434"
api_key = "${OLLAMA_API_KEY}"
```

La autenticacion solo se envia para endpoints no locales (cuando el host no es `localhost`, `127.0.0.1` o `::1`).

### Enrutamiento a la nube

Agrega `:cloud` al nombre del modelo para forzar el enrutamiento a traves de una instancia remota de Ollama:

```bash
prx chat --model "qwen3:cloud"
```

El enrutamiento a la nube requiere:
- Un `api_url` no local
- Un `api_key` configurado

### Timeout extendido

Las solicitudes de Ollama usan un timeout de 300 segundos (comparado con 120 segundos para proveedores en la nube), considerando la inferencia potencialmente mas lenta en hardware local.

## Solucion de problemas

### "Is Ollama running?"

El error mas comun. Soluciones:
- Iniciar el servidor: `ollama serve`
- Verificar si el puerto es accesible: `curl http://localhost:11434`
- Si usas un puerto personalizado, actualiza `api_url` en tu configuracion

### Modelo no encontrado

Descarga el modelo primero:
```bash
ollama pull qwen3
```

### Respuestas vacias

Algunos modelos de razonamiento pueden devolver solo contenido `thinking` sin una respuesta final. Esto usualmente significa que el modelo se detuvo prematuramente. Intenta:
- Enviar la solicitud de nuevo
- Usar un modelo diferente
- Deshabilitar el modo de razonamiento si el modelo no lo soporta bien

### Las llamadas a herramientas no funcionan

No todos los modelos de Ollama soportan llamada a herramientas. Modelos que funcionan bien:
- `qwen2.5` / `qwen3`
- `llama3.1`
- `mistral-nemo`
- `command-r`

### Errores de enrutamiento a la nube

- "requested cloud routing, but Ollama endpoint is local": Establece `api_url` a un servidor remoto
- "requested cloud routing, but no API key is configured": Establece `api_key` o `OLLAMA_API_KEY`
