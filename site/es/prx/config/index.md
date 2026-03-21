---
title: Configuracion
description: Vision general del sistema de configuracion de PRX -- configuracion basada en TOML con recarga en caliente, archivos divididos, herramientas CLI y exportacion de esquema.
---

# Configuracion

PRX utiliza un sistema de configuracion basado en TOML con soporte de recarga en caliente. Todos los ajustes residen en un unico archivo (con fragmentos divididos opcionales), y la mayoria de los cambios surten efecto inmediatamente sin reiniciar el demonio.

## Ubicacion del archivo de configuracion

El archivo de configuracion principal es:

```
~/.openprx/config.toml
```

PRX resuelve el directorio de configuracion en el siguiente orden:

1. Variable de entorno `OPENPRX_CONFIG_DIR` (si esta definida)
2. Variable de entorno `OPENPRX_WORKSPACE` (si esta definida)
3. Marcador de espacio de trabajo activo (`~/.openprx/active_workspace.toml`)
4. `~/.openprx/` (por defecto)

El directorio del espacio de trabajo (donde se almacenan memoria, sesiones y datos) por defecto es `~/.openprx/workspace/`.

## Formato TOML

La configuracion de PRX usa [TOML](https://toml.io/) -- un formato minimo y legible por humanos. Aqui tienes una configuracion minima funcional:

```toml
# Seleccion de proveedor y modelo
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7

# Clave API (o usa la variable de entorno ANTHROPIC_API_KEY)
api_key = "sk-ant-..."

# Backend de memoria
[memory]
backend = "sqlite"
auto_save = true

# Servidor gateway
[gateway]
port = 16830
host = "127.0.0.1"
```

## Secciones de configuracion

La configuracion esta organizada en estas secciones de nivel superior:

| Seccion | Proposito |
|---------|-----------|
| *(nivel superior)* | Proveedor, modelo, temperatura y clave API por defecto |
| `[gateway]` | Gateway HTTP: host, puerto, emparejamiento, limites de velocidad |
| `[channels_config]` | Canales de mensajeria: Telegram, Discord, Slack, etc. |
| `[channels_config.telegram]` | Configuracion del bot de Telegram |
| `[channels_config.discord]` | Configuracion del bot de Discord |
| `[memory]` | Backend de memoria y configuracion de embeddings |
| `[router]` | Router heuristico de LLM y Automix |
| `[security]` | Sandbox, limites de recursos, logging de auditoria |
| `[autonomy]` | Niveles de autonomia y reglas de alcance de herramientas |
| `[observability]` | Backend de metricas y trazado |
| `[mcp]` | Integracion del servidor Model Context Protocol |
| `[browser]` | Configuracion de la herramienta de automatizacion de navegador |
| `[web_search]` | Configuracion de herramientas de busqueda web y fetch |
| `[xin]` | Motor de tareas autonomas Xin |
| `[reliability]` | Cadenas de reintento y proveedor de respaldo |
| `[cost]` | Limites de gasto y precios de modelos |
| `[cron]` | Definiciones de tareas programadas |
| `[self_system]` | Controles del motor de autoevolucion |
| `[proxy]` | Configuracion de proxy HTTP/HTTPS/SOCKS5 |
| `[secrets]` | Almacen de credenciales cifrado |
| `[auth]` | Importacion de credenciales externas (Codex CLI, etc.) |
| `[storage]` | Proveedor de almacenamiento persistente |
| `[tunnel]` | Exposicion mediante tunel publico |
| `[nodes]` | Configuracion de proxy de nodos remotos |

Consulta la [Referencia de configuracion](/es/prx/config/reference) para la documentacion completa campo por campo.

## Archivos de configuracion divididos

Para despliegues complejos, PRX soporta dividir la configuracion en archivos de fragmentos bajo un directorio `config.d/` junto a `config.toml`:

```
~/.openprx/
  config.toml          # Config principal (nivel superior + sobreescrituras)
  config.d/
    channels.toml      # Seccion [channels_config]
    memory.toml        # Secciones [memory] y [storage]
    security.toml      # Secciones [security] y [autonomy]
    agents.toml        # Secciones [agents] y [sessions_spawn]
    identity.toml      # Secciones [identity] y [identity_bindings]
    network.toml       # Secciones [gateway], [tunnel] y [proxy]
    scheduler.toml     # Secciones [scheduler], [cron] y [heartbeat]
```

Los archivos de fragmentos se fusionan sobre `config.toml` (los fragmentos tienen precedencia). Los archivos se cargan en orden alfabetico.

## Como editar

### Asistente interactivo

El asistente de configuracion te guia a traves de la seleccion de proveedor, configuracion de canales y configuracion de memoria:

```bash
prx onboard
```

### Comandos CLI de configuracion

Visualiza y modifica la configuracion desde la linea de comandos:

```bash
# Mostrar configuracion actual
prx config show

# Editar un valor especifico
prx config set default_provider anthropic
prx config set default_model "anthropic/claude-sonnet-4-6"

# Activar una recarga manual
prx config reload
```

### Edicion directa

Abre `~/.openprx/config.toml` en cualquier editor de texto. Los cambios se detectan automaticamente por el monitor de archivos y se aplican en 1 segundo (consulta [Recarga en caliente](/es/prx/config/hot-reload)).

### Exportacion de esquema

Exporta el esquema completo de configuracion como JSON Schema para autocompletado y validacion en editores:

```bash
prx config schema
```

Esto produce un documento JSON Schema que se puede usar con VS Code, IntelliJ o cualquier editor que soporte validacion de esquemas TOML.

## Recarga en caliente

La mayoria de los cambios de configuracion se aplican inmediatamente sin reiniciar PRX. El monitor de archivos usa una ventana de debounce de 1 segundo y realiza un intercambio atomico de la configuracion activa tras un analisis exitoso. Si el nuevo archivo tiene errores de sintaxis, se mantiene la configuracion anterior y se registra una advertencia.

Consulta [Recarga en caliente](/es/prx/config/hot-reload) para detalles sobre que requiere un reinicio.

## Siguientes pasos

- [Referencia de configuracion](/es/prx/config/reference) -- documentacion completa campo por campo
- [Recarga en caliente](/es/prx/config/hot-reload) -- que cambios se aplican en vivo vs. requieren reinicio
- [Variables de entorno](/es/prx/config/environment) -- variables de entorno, claves API y soporte `.env`
- [Proveedores de LLM](/es/prx/providers/) -- configuracion especifica por proveedor
