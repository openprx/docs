---
title: prx onboard
description: Asistente de configuracion interactivo para la primera configuracion de PRX.
---

# prx onboard

Ejecuta el asistente de configuracion para configurar PRX por primera vez. El asistente te guia a traves de la seleccion de proveedor, configuracion de clave API, configuracion de canales y preferencias basicas.

## Uso

```bash
prx onboard [OPTIONS]
```

## Opciones

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--quick` | `-q` | `false` | Modo rapido -- preguntas minimas, valores predeterminados razonables |
| `--provider` | `-P` | | Pre-seleccionar un proveedor (omite el paso de seleccion de proveedor) |
| `--config` | `-c` | `~/.config/prx/config.toml` | Ruta de salida del archivo de configuracion |
| `--force` | `-f` | `false` | Sobrescribir el archivo de configuracion existente |
| `--non-interactive` | | `false` | Modo no interactivo (requiere `--provider` y variables de entorno para las claves) |

## Pasos del asistente

El asistente interactivo te guia a traves de los siguientes pasos:

1. **Seleccion de proveedor** -- elige tu proveedor de LLM principal (Anthropic, OpenAI, Ollama, etc.)
2. **Configuracion de clave API** -- ingresa y valida tu clave API
3. **Seleccion de modelo** -- elige un modelo por defecto del proveedor seleccionado
4. **Configuracion de canales** (opcional) -- configura uno o mas canales de mensajeria
5. **Backend de memoria** -- elige donde almacenar la memoria de conversacion (markdown, SQLite, PostgreSQL)
6. **Seguridad** -- configura el codigo de emparejamiento y las preferencias de sandbox
7. **Revision de configuracion** -- previsualiza la configuracion generada y confirma

## Ejemplos

```bash
# Asistente interactivo completo
prx onboard

# Configuracion rapida con Anthropic
prx onboard --quick --provider anthropic

# No interactivo (clave API desde variable de entorno)
export ANTHROPIC_API_KEY="sk-ant-..."
prx onboard --non-interactive --provider anthropic

# Escribir configuracion en una ruta personalizada
prx onboard --config /etc/prx/config.toml

# Re-ejecutar asistente (sobrescribir configuracion existente)
prx onboard --force
```

## Modo rapido

El modo rapido (`--quick`) omite los pasos opcionales y usa valores predeterminados razonables:

- Backend de memoria: SQLite
- Seguridad: sandbox habilitado, sin emparejamiento requerido
- Canales: ninguno (agregar despues con `prx channel add`)
- Evolucion: deshabilitada (habilitar despues en la configuracion)

Esta es la forma mas rapida de obtener una configuracion funcional:

```bash
prx onboard --quick --provider ollama
```

## Post-configuracion

Despues de completar la configuracion inicial, puedes:

```bash
# Verificar la configuracion
prx doctor

# Comenzar a chatear
prx chat

# Agregar mas canales
prx channel add

# Iniciar el demonio completo
prx daemon
```

## Relacionado

- [Primeros pasos](/es/prx/getting-started/quickstart) -- guia de inicio rapido
- [Vision general de configuracion](/es/prx/config/) -- formato y opciones del archivo de configuracion
- [prx config](./config) -- modificar la configuracion despues de la configuracion inicial
- [prx channel](./channel) -- agregar canales despues de la configuracion inicial
