---
title: AWS Bedrock
description: Configurar AWS Bedrock como proveedor LLM en PRX
---

# AWS Bedrock

> Accede a modelos fundacionales (Claude, Titan, Llama, Mistral y mas) a traves de la API Converse de AWS Bedrock con autenticacion SigV4, llamada nativa a herramientas y cache de prompts.

## Requisitos previos

- Una cuenta AWS con acceso a modelos de Bedrock habilitado
- Credenciales AWS (Access Key ID + Secret Access Key) con permisos `bedrock:InvokeModel`

## Configuracion rapida

### 1. Habilitar acceso a modelos

1. Abrir la [Consola AWS Bedrock](https://console.aws.amazon.com/bedrock/)
2. Navegar a **Model access** en la barra lateral izquierda
3. Solicitar acceso a los modelos que deseas usar (ej., Anthropic Claude, Meta Llama)

### 2. Configurar credenciales AWS

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"  # optional, defaults to us-east-1
```

### 3. Configurar PRX

```toml
[default]
provider = "bedrock"
model = "anthropic.claude-sonnet-4-20250514-v1:0"
```

### 4. Verificar

```bash
prx doctor models
```

## Modelos disponibles

Los IDs de modelo siguen el formato de Bedrock `<provider>.<model>-<version>`:

| ID del modelo | Proveedor | Contexto | Vision | Uso de herramientas | Notas |
|--------------|----------|----------|--------|-------------------|-------|
| `anthropic.claude-sonnet-4-20250514-v1:0` | Anthropic | 200K | Si | Si | Claude Sonnet 4 |
| `anthropic.claude-sonnet-4-6-v1:0` | Anthropic | 200K | Si | Si | Ultimo Claude Sonnet |
| `anthropic.claude-opus-4-6-v1:0` | Anthropic | 200K | Si | Si | Claude Opus |
| `anthropic.claude-3-5-haiku-20241022-v1:0` | Anthropic | 200K | Si | Si | Modelo Claude rapido |
| `meta.llama3-1-70b-instruct-v1:0` | Meta | 128K | No | Si | Llama 3.1 70B |
| `mistral.mistral-large-2407-v1:0` | Mistral | 128K | No | Si | Mistral Large |
| `amazon.titan-text-premier-v1:0` | Amazon | 32K | No | No | Amazon Titan |

Consulta la [documentacion de AWS Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html) para la lista completa de modelos disponibles en tu region.

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `model` | string | requerido | ID de modelo de Bedrock (ej., `anthropic.claude-sonnet-4-6`) |

La autenticacion se maneja completamente a traves de variables de entorno AWS:

| Variable de entorno | Requerida | Descripcion |
|--------------------|----------|-------------|
| `AWS_ACCESS_KEY_ID` | Si | ID de clave de acceso AWS |
| `AWS_SECRET_ACCESS_KEY` | Si | Clave de acceso secreta AWS |
| `AWS_SESSION_TOKEN` | No | Token de sesion temporal (para roles asumidos) |
| `AWS_REGION` | No | Region AWS (por defecto: `us-east-1`) |
| `AWS_DEFAULT_REGION` | No | Region de respaldo si `AWS_REGION` no esta establecida |

## Caracteristicas

### Firma SigV4 sin dependencias

PRX implementa la firma de solicitudes AWS SigV4 usando solo los crates `hmac` y `sha2`, sin dependencia del SDK de AWS. Esto mantiene el binario pequeno y evita conflictos de versiones del SDK.

### API Converse

PRX usa la API Converse de Bedrock (no la API legacy InvokeModel), que proporciona un formato de mensaje unificado, llamada estructurada a herramientas, soporte de prompts del sistema y formato de respuesta consistente.

### Cache de prompts

PRX aplica heuristicas de cache de prompts de Bedrock: prompts del sistema > 3 KB reciben un bloque `cachePoint`, y conversaciones con > 4 mensajes no del sistema tienen el ultimo mensaje anotado con un `cachePoint`.

## Alias del proveedor

Los siguientes nombres resuelven al proveedor Bedrock:

- `bedrock`
- `aws-bedrock`

## Solucion de problemas

### "AWS Bedrock credentials not set"

Asegurate de que tanto `AWS_ACCESS_KEY_ID` como `AWS_SECRET_ACCESS_KEY` estan establecidas como variables de entorno. PRX no lee de `~/.aws/credentials` ni `~/.aws/config`.

### 403 AccessDeniedException

Causas comunes:
- El usuario/rol IAM no tiene permiso `bedrock:InvokeModel`
- No has solicitado acceso al modelo en la consola de Bedrock
- El modelo no esta disponible en tu region configurada

### SignatureDoesNotMatch

Esto usualmente indica desfase de reloj. Asegurate de que el reloj de tu sistema esta sincronizado:
```bash
# Linux
sudo ntpdate pool.ntp.org
# macOS
sudo sntp -sS pool.ntp.org
```
