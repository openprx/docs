---
title: Referencia CLI
description: Referencia completa de la interfaz de linea de comandos de prx.
---

# Referencia CLI

El binario `prx` es el punto de entrada unico para todas las operaciones de PRX -- chat interactivo, gestion del demonio, administracion de canales y diagnosticos del sistema.

## Opciones globales

Estas opciones son aceptadas por todos los subcomandos.

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Ruta al archivo de configuracion |
| `--log-level` | `-l` | `info` | Verbosidad del log: `trace`, `debug`, `info`, `warn`, `error` |
| `--no-color` | | `false` | Deshabilitar salida con colores |
| `--quiet` | `-q` | `false` | Suprimir salida no esencial |
| `--help` | `-h` | | Mostrar informacion de ayuda |
| `--version` | `-V` | | Mostrar version |

## Comandos

| Comando | Descripcion |
|---------|-------------|
| [`prx agent`](./agent) | Interaccion LLM de un solo turno (compatible con pipes) |
| [`prx chat`](./chat) | Chat enriquecido en terminal con streaming e historial |
| [`prx daemon`](./daemon) | Iniciar el runtime completo de PRX (gateway + canales + cron + evolucion) |
| [`prx gateway`](./gateway) | Servidor gateway HTTP/WebSocket independiente |
| [`prx onboard`](./onboard) | Asistente de configuracion interactivo |
| [`prx channel`](./channel) | Gestion de canales (list, add, remove, start, doctor) |
| [`prx cron`](./cron) | Gestion de tareas cron (list, add, remove, pause, resume) |
| [`prx evolution`](./evolution) | Operaciones de autoevolucion (status, history, config, trigger) |
| [`prx auth`](./auth) | Gestion de perfiles OAuth (login, refresh, logout) |
| [`prx config`](./config) | Operaciones de configuracion (schema, split, merge, get, set) |
| [`prx doctor`](./doctor) | Diagnosticos del sistema (salud del demonio, estado de canales, disponibilidad de modelos) |
| [`prx service`](./service) | Gestion de servicios systemd/OpenRC (install, start, stop, status) |
| [`prx skills`](./skills) | Gestion de habilidades (list, install, remove) |
| `prx status` | Panel de estado del sistema |
| `prx models refresh` | Actualizar catalogos de modelos de proveedores |
| `prx providers` | Listar todos los proveedores de LLM soportados |
| `prx completions` | Generar autocompletado de shell (bash, zsh, fish) |

## Ejemplos rapidos

```bash
# Configuracion inicial
prx onboard

# Iniciar chat interactivo
prx chat

# Consulta de un solo turno (scriptable)
echo "Summarize this file" | prx agent -f report.pdf

# Iniciar el demonio con todos los servicios
prx daemon

# Verificar la salud del sistema
prx doctor
```

## Autocompletado de shell

Genera autocompletado para tu shell y agregalo a tu perfil:

```bash
# Bash
prx completions bash > ~/.local/share/bash-completion/completions/prx

# Zsh
prx completions zsh > ~/.zfunc/_prx

# Fish
prx completions fish > ~/.config/fish/completions/prx.fish
```

## Variables de entorno

PRX respeta las siguientes variables de entorno (estas sobreescriben los valores del archivo de configuracion):

| Variable | Descripcion |
|----------|-------------|
| `PRX_CONFIG` | Ruta al archivo de configuracion (igual que `--config`) |
| `PRX_LOG` | Nivel de log (igual que `--log-level`) |
| `PRX_DATA_DIR` | Directorio de datos (por defecto: `~/.local/share/prx`) |
| `ANTHROPIC_API_KEY` | Clave API del proveedor Anthropic |
| `OPENAI_API_KEY` | Clave API del proveedor OpenAI |
| `GOOGLE_API_KEY` | Clave API del proveedor Google Gemini |

## Relacionado

- [Vision general de configuracion](/es/prx/config/) -- formato y opciones del archivo de configuracion
- [Primeros pasos](/es/prx/getting-started/installation) -- instrucciones de instalacion
- [Solucion de problemas](/es/prx/troubleshooting/) -- errores comunes y soluciones
