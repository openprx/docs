---
title: Inicio rapido
description: Pon PRX en funcionamiento en 5 minutos. Instala, configura un proveedor de LLM, inicia el demonio y chatea.
---

# Inicio rapido

Esta guia te lleva de cero a un agente PRX en funcionamiento en menos de 5 minutos.

## Paso 1: Instalar PRX

Instala la ultima version:

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

Verifica la instalacion:

```bash
prx --version
```

::: tip
Consulta la [Guia de instalacion](./installation) para metodos alternativos (Cargo, compilacion desde el codigo fuente, Docker).
:::

## Paso 2: Ejecutar el asistente de configuracion inicial

El asistente de configuracion inicial configura tu proveedor de LLM, clave API y ajustes iniciales de forma interactiva:

```bash
prx onboard
```

El asistente te guia a traves de:

1. **Seleccionar un proveedor** -- Anthropic, OpenAI, Ollama, OpenRouter y mas
2. **Ingresar tu clave API** -- almacenada de forma segura en el archivo de configuracion
3. **Elegir un modelo por defecto** -- el asistente obtiene los modelos disponibles de tu proveedor
4. **Configurar un backend de memoria** -- Markdown (por defecto), SQLite o PostgreSQL

Despues de que el asistente finalice, tu configuracion se guarda en `~/.config/openprx/openprx.toml`.

::: info Configuracion rapida
Si ya conoces tu proveedor y modelo, omite el asistente interactivo:

```bash
prx onboard --provider anthropic --api-key sk-ant-... --model claude-sonnet-4-20250514
```

Consulta el [Asistente de configuracion inicial](./onboarding) para todas las opciones.
:::

## Paso 3: Iniciar el demonio

Inicia el demonio PRX en segundo plano. El demonio gestiona el runtime del agente, la API del gateway y todos los canales configurados:

```bash
prx daemon
```

Por defecto, el demonio escucha en `127.0.0.1:3120`. Puedes personalizar el host y el puerto:

```bash
prx daemon --host 0.0.0.0 --port 8080
```

::: tip Ejecutar como servicio
Para despliegues en produccion, instala PRX como un servicio del sistema para que se inicie automaticamente al arrancar:

```bash
prx service install
```

Esto crea una unidad systemd (Linux) o un plist de launchd (macOS). Consulta [prx service](../cli/service) para mas detalles.
:::

## Paso 4: Chatear con PRX

Abre una sesion de chat interactiva directamente en tu terminal:

```bash
prx chat
```

Esto se conecta al demonio en ejecucion y abre un REPL donde puedes hablar con tu LLM configurado. Escribe tu mensaje y presiona Enter:

```
You: What can you help me with?
PRX: I can help you with a wide range of tasks...
```

Tambien puedes especificar un proveedor y modelo para una unica sesion:

```bash
prx chat --provider ollama --model llama3.2
```

Presiona `Ctrl+C` o escribe `/quit` para salir del chat.

## Paso 5: Conectar un canal

PRX soporta 19 canales de mensajeria. Para conectar uno, agrega su configuracion a tu archivo `~/.config/openprx/openprx.toml`.

Por ejemplo, para conectar un bot de Telegram:

```toml
[channels.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["your_telegram_username"]
```

Luego reinicia el demonio para que tome el nuevo canal:

```bash
prx daemon
```

O usa el comando de gestion de canales:

```bash
prx channel add telegram
```

Consulta la [Vision general de canales](../channels/) para la lista completa de plataformas soportadas y su configuracion.

## Paso 6: Verificar el estado

Visualiza el estado actual de tu instancia PRX:

```bash
prx status
```

Esto muestra:

- **Version** y ruta del binario
- **Espacio de trabajo** (directorio)
- **Configuracion** (ubicacion del archivo)
- **Proveedor** y modelo en uso
- **Canales activos** y su estado de conexion
- **Backend de memoria** y estadisticas
- **Tiempo de actividad** y uso de recursos

Ejemplo de salida:

```
PRX Status

Version:     0.3.0
Workspace:   /home/user/.local/share/openprx
Config:      /home/user/.config/openprx/openprx.toml
Provider:    anthropic (claude-sonnet-4-20250514)
Memory:      markdown (/home/user/.local/share/openprx/memory)
Channels:    telegram (connected), cli (active)
Gateway:     http://127.0.0.1:3120
Uptime:      2h 15m
```

## Que sigue?

Ahora que PRX esta en funcionamiento, explora el resto de la documentacion:

| Tema | Descripcion |
|------|-------------|
| [Asistente de configuracion inicial](./onboarding) | Profundiza en todas las opciones de configuracion inicial |
| [Canales](../channels/) | Conecta Telegram, Discord, Slack y 16 mas |
| [Proveedores](../providers/) | Configura y cambia entre proveedores de LLM |
| [Herramientas](../tools/) | Explora las 46+ herramientas integradas |
| [Autoevolucion](../self-evolution/) | Aprende sobre el sistema de evolucion L1/L2/L3 |
| [Configuracion](../config/) | Referencia completa de configuracion con todas las opciones |
| [Referencia CLI](../cli/) | Referencia completa de comandos |
