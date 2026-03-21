---
title: Google Gemini
description: Configurar Google Gemini como proveedor LLM en PRX
---

# Google Gemini

> Accede a modelos Gemini via la API de Lenguaje Generativo de Google con soporte para claves API, tokens OAuth de Gemini CLI y ventanas de contexto largas de hasta 2M tokens.

## Requisitos previos

- Una clave API de Google AI Studio de [aistudio.google.com](https://aistudio.google.com/app/apikey), **o**
- Gemini CLI instalado y autenticado (comando `gemini`), **o**
- Una variable de entorno `GEMINI_API_KEY` o `GOOGLE_API_KEY`

## Configuracion rapida

### 1. Obtener clave API

**Opcion A: Clave API (recomendada para la mayoria de usuarios)**

1. Visitar [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Hacer clic en **Create API key**
3. Copiar la clave

**Opcion B: Gemini CLI (cero configuracion para usuarios existentes)**

Si ya usas el Gemini CLI, PRX detecta automaticamente tu token OAuth desde `~/.gemini/oauth_creds.json`. No se necesita configuracion adicional.

### 2. Configurar

```toml
[default]
provider = "gemini"
model = "gemini-2.5-flash"

[providers.gemini]
api_key = "${GEMINI_API_KEY}"
```

O establecer la variable de entorno:

```bash
export GEMINI_API_KEY="AIza..."
```

### 3. Verificar

```bash
prx doctor models
```

## Modelos disponibles

| Modelo | Contexto | Vision | Uso de herramientas | Notas |
|--------|----------|--------|-------------------|-------|
| `gemini-2.5-pro` | 1M | Si | Si | Modelo Gemini mas capaz |
| `gemini-2.5-flash` | 1M | Si | Si | Rapido y economico |
| `gemini-2.0-flash` | 1M | Si | Si | Flash de generacion anterior |
| `gemini-1.5-pro` | 2M | Si | Si | Ventana de contexto mas larga |
| `gemini-1.5-flash` | 1M | Si | Si | Generacion anterior |

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `api_key` | string | opcional | Clave API de Google AI (`AIza...`) |
| `model` | string | `gemini-2.5-flash` | Modelo por defecto a usar |

## Caracteristicas

### Multiples metodos de autenticacion

PRX resuelve credenciales de Gemini en este orden de prioridad:

| Prioridad | Fuente | Como funciona |
|-----------|--------|--------------|
| 1 | Clave API explicita en config | Enviada como parametro de consulta `?key=` a la API publica |
| 2 | Variable de entorno `GEMINI_API_KEY` | Igual que arriba |
| 3 | Variable de entorno `GOOGLE_API_KEY` | Igual que arriba |
| 4 | Token OAuth de Gemini CLI | Enviado como `Authorization: Bearer` a la API interna de Code Assist |

### Integracion OAuth de Gemini CLI

Si te has autenticado con el Gemini CLI (comando `gemini`), PRX automaticamente:

1. Lee `~/.gemini/oauth_creds.json`
2. Verifica la expiracion del token (omite tokens expirados con una advertencia)
3. Enruta solicitudes a la API interna de Code Assist de Google (`cloudcode-pa.googleapis.com`) usando el formato de envoltorio apropiado

Esto significa que los usuarios existentes de Gemini CLI pueden usar PRX con cero configuracion adicional.

### Ventanas de contexto largas

Los modelos Gemini soportan ventanas de contexto extremadamente largas (hasta 2M tokens para Gemini 1.5 Pro). PRX establece `maxOutputTokens` a 8192 por defecto. El historial completo de conversacion se envia como `contents` con el mapeo de roles apropiado (`user`/`model`).

### Instrucciones del sistema

Los prompts del sistema se envian usando el campo nativo `systemInstruction` de Gemini (no como un mensaje regular), asegurando que sean manejados correctamente por el modelo.

### Formato automatico de nombre de modelo

PRX automaticamente antepone `models/` a los nombres de modelo cuando es necesario. Tanto `gemini-2.5-flash` como `models/gemini-2.5-flash` funcionan correctamente.

## Alias del proveedor

Los siguientes nombres resuelven al proveedor Gemini:

- `gemini`
- `google`
- `google-gemini`

## Solucion de problemas

### "Gemini API key not found"

PRX no pudo encontrar ninguna autenticacion. Opciones:

1. Establecer la variable de entorno `GEMINI_API_KEY`
2. Ejecutar el CLI `gemini` para autenticar (los tokens se reutilizaran automaticamente)
3. Obtener una clave API de [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
4. Ejecutar `prx onboard` para configurar interactivamente

### "400 Bad Request: API key not valid" con Gemini CLI

Esto ocurre cuando los tokens OAuth del Gemini CLI se envian al endpoint de la API publica. PRX maneja esto enrutando tokens OAuth al endpoint interno `cloudcode-pa.googleapis.com` automaticamente. Si ves este error, asegurate de estar usando la ultima version de PRX.

### "Gemini CLI OAuth token expired"

Vuelve a ejecutar el CLI `gemini` para renovar tu token. PRX no renueva automaticamente los tokens del Gemini CLI (a diferencia de los tokens OAuth de Anthropic).

### 403 Forbidden

Tu clave API puede no tener habilitada la API de Lenguaje Generativo. Ve a la [Google Cloud Console](https://console.cloud.google.com/) y habilita la **Generative Language API** para tu proyecto.
