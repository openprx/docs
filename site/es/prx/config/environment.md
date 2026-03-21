---
title: Variables de entorno
description: Variables de entorno para la configuracion de PRX -- claves API, rutas y sobreescrituras en tiempo de ejecucion.
---

# Variables de entorno

PRX lee variables de entorno para claves API, rutas de configuracion y sobreescrituras en tiempo de ejecucion. Las variables de entorno tienen precedencia sobre los valores en `config.toml` para campos sensibles como las claves API.

## Rutas de configuracion

| Variable | Por defecto | Descripcion |
|----------|-------------|-------------|
| `OPENPRX_CONFIG_DIR` | `~/.openprx` | Sobreescribir el directorio de configuracion. PRX busca `config.toml` y `config.d/` dentro de este directorio |
| `OPENPRX_WORKSPACE` | `~/.openprx/workspace` | Sobreescribir el directorio del espacio de trabajo (memoria, sesiones, datos) |

Cuando `OPENPRX_CONFIG_DIR` esta definida, tiene precedencia sobre `OPENPRX_WORKSPACE` y el marcador de espacio de trabajo activo.

Orden de resolucion del directorio de configuracion:

1. `OPENPRX_CONFIG_DIR` (maxima prioridad)
2. `OPENPRX_WORKSPACE`
3. Marcador de espacio de trabajo activo (`~/.openprx/active_workspace.toml`)
4. `~/.openprx/` (por defecto)

## Claves API de proveedores

Cada proveedor tiene una variable de entorno dedicada. PRX las verifica antes de recurrir al campo `api_key` en `config.toml`.

### Proveedores principales

| Variable | Proveedor |
|----------|-----------|
| `ANTHROPIC_API_KEY` | Anthropic (Claude) |
| `OPENAI_API_KEY` | OpenAI |
| `GEMINI_API_KEY` | Google Gemini |
| `GOOGLE_API_KEY` | Google Gemini (alternativa) |
| `OPENROUTER_API_KEY` | OpenRouter |
| `OLLAMA_API_KEY` | Ollama (normalmente no necesaria) |
| `GLM_API_KEY` | Zhipu GLM |
| `ZAI_API_KEY` | Z.AI |
| `MINIMAX_API_KEY` | Minimax |
| `MOONSHOT_API_KEY` | Moonshot |
| `DASHSCOPE_API_KEY` | Alibaba Qwen (DashScope) |

### Tokens OAuth

Algunos proveedores soportan autenticacion OAuth ademas de (o en lugar de) claves API:

| Variable | Proveedor | Descripcion |
|----------|-----------|-------------|
| `ANTHROPIC_OAUTH_TOKEN` | Anthropic | Token OAuth de Claude Code |
| `CLAUDE_CODE_ACCESS_TOKEN` | Anthropic | Token de acceso de Claude Code (alternativa) |
| `CLAUDE_CODE_REFRESH_TOKEN` | Anthropic | Token de actualizacion de Claude Code para renovacion automatica |
| `MINIMAX_OAUTH_TOKEN` | Minimax | Token de acceso OAuth de Minimax |
| `MINIMAX_OAUTH_REFRESH_TOKEN` | Minimax | Token de actualizacion OAuth de Minimax |
| `MINIMAX_OAUTH_CLIENT_ID` | Minimax | Sobreescritura de ID de cliente OAuth |
| `MINIMAX_OAUTH_REGION` | Minimax | Region OAuth (`global` o `cn`) |
| `QWEN_OAUTH_TOKEN` | Qwen | Token de acceso OAuth de Qwen |
| `QWEN_OAUTH_REFRESH_TOKEN` | Qwen | Token de actualizacion OAuth de Qwen |
| `QWEN_OAUTH_CLIENT_ID` | Qwen | Sobreescritura de ID de cliente OAuth de Qwen |
| `QWEN_OAUTH_RESOURCE_URL` | Qwen | Sobreescritura de URL de recurso OAuth de Qwen |

### Proveedores compatibles / de terceros

| Variable | Proveedor |
|----------|-----------|
| `GROQ_API_KEY` | Groq |
| `MISTRAL_API_KEY` | Mistral |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `XAI_API_KEY` | xAI (Grok) |
| `TOGETHER_API_KEY` | Together AI |
| `FIREWORKS_API_KEY` | Fireworks AI |
| `PERPLEXITY_API_KEY` | Perplexity |
| `COHERE_API_KEY` | Cohere |
| `NVIDIA_API_KEY` | NVIDIA NIM |
| `VENICE_API_KEY` | Venice |
| `LLAMACPP_API_KEY` | servidor llama.cpp |
| `KIMI_CODE_API_KEY` | Kimi Code (Moonshot) |
| `QIANFAN_API_KEY` | Baidu Qianfan |
| `CLOUDFLARE_API_KEY` | Cloudflare AI |
| `VERCEL_API_KEY` | Vercel AI |

### Respaldo

| Variable | Descripcion |
|----------|-------------|
| `API_KEY` | Respaldo generico usado cuando no se establece una variable especifica del proveedor |

## Variables de herramientas y canales

| Variable | Descripcion |
|----------|-------------|
| `BRAVE_API_KEY` | Clave API de Brave Search (para `[web_search]` con `provider = "brave"`) |
| `GITHUB_TOKEN` | Token de acceso personal de GitHub (usado por habilidades e integraciones) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta del archivo ADC de Google Cloud (Gemini via cuenta de servicio) |

## Variables de tiempo de ejecucion

| Variable | Descripcion |
|----------|-------------|
| `OPENPRX_VERSION` | Sobreescribir la cadena de version reportada |
| `OPENPRX_AUTOSTART_CHANNELS` | Establecer a `"1"` para auto-iniciar los listeners de canales al arrancar |
| `OPENPRX_EVOLUTION_CONFIG` | Sobreescribir la ruta de configuracion de evolucion |
| `OPENPRX_EVOLUTION_DEBUG_RAW` | Habilitar logging de depuracion crudo de evolucion |

## Sustitucion de variables en la configuracion

PRX **no** expande nativamente la sintaxis `${VAR_NAME}` dentro de `config.toml`. Sin embargo, puedes lograr la sustitucion de variables de entorno a traves de estos enfoques:

### 1. Usar variables de entorno directamente

Para claves API, PRX automaticamente verifica la variable de entorno correspondiente. No necesitas referenciarlas en el archivo de configuracion:

```toml
# No se necesita api_key -- PRX verifica ANTHROPIC_API_KEY automaticamente
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
```

### 2. Usar un wrapper de shell

Genera `config.toml` desde una plantilla usando `envsubst` o similar:

```bash
envsubst < config.toml.template > ~/.openprx/config.toml
```

### 3. Usar configuracion dividida con secretos

Mantiene los secretos en un archivo separado que se genera desde variables de entorno en el momento del despliegue:

```bash
# Generar fragmento de secretos
cat > ~/.openprx/config.d/secrets.toml << EOF
api_key = "$ANTHROPIC_API_KEY"

[channels_config.telegram]
bot_token = "$TELEGRAM_BOT_TOKEN"
EOF
```

## Soporte de archivos `.env`

PRX no carga archivos `.env` automaticamente. Si necesitas soporte de archivos `.env`, usa uno de estos enfoques:

### Con systemd

Agrega `EnvironmentFile` a tu unidad de servicio:

```ini
[Service]
EnvironmentFile=/opt/openprx/.env
ExecStart=/usr/local/bin/openprx
```

### Con un wrapper de shell

Carga el archivo `.env` antes de iniciar PRX:

```bash
#!/bin/bash
set -a
source /opt/openprx/.env
set +a
exec openprx
```

### Con direnv

Si usas [direnv](https://direnv.net/), coloca un archivo `.envrc` en tu directorio de trabajo:

```bash
# .envrc
export ANTHROPIC_API_KEY="sk-ant-..."
export TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
```

## Recomendaciones de seguridad

- **Nunca commits claves API** al control de versiones. Usa variables de entorno o secretos cifrados.
- El subsistema `[secrets]` de PRX cifra campos sensibles en `config.toml` con ChaCha20-Poly1305. Habilitalo con `[secrets] encrypt = true` (habilitado por defecto).
- El `.dockerignore` que viene con PRX excluye archivos `.env` y `.env.*` de las compilaciones de contenedores.
- Los logs de auditoria redactan automaticamente claves API y tokens.
- Cuando uses `OPENPRX_CONFIG_DIR` para apuntar a un directorio compartido, asegura los permisos de archivo adecuados (`chmod 600 config.toml`).
