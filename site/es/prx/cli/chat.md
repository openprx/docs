---
title: prx chat
description: Chat enriquecido en terminal con respuestas en streaming, navegacion de historial y entrada multilinea.
---

# prx chat

Inicia una sesion de chat interactiva en la terminal con respuestas en streaming, historial de conversacion y acceso completo a herramientas.

## Uso

```bash
prx chat [OPTIONS]
```

## Opciones

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--provider` | `-P` | por defecto de config | Proveedor de LLM a usar (ej., `anthropic`, `openai`, `ollama`) |
| `--model` | `-m` | por defecto del proveedor | Identificador del modelo (ej., `claude-sonnet-4-20250514`, `gpt-4o`) |
| `--system` | `-s` | | Prompt de sistema personalizado (sobreescribe la config) |
| `--session` | `-S` | nueva sesion | Reanudar una sesion con nombre |
| `--no-tools` | | `false` | Deshabilitar el uso de herramientas para esta sesion |
| `--no-memory` | | `false` | Deshabilitar lecturas y escrituras de memoria |
| `--no-stream` | | `false` | Esperar la respuesta completa en lugar de streaming |
| `--max-turns` | | ilimitado | Turnos maximos de conversacion antes de salir automaticamente |
| `--temperature` | `-t` | por defecto del proveedor | Temperatura de muestreo (0.0 - 2.0) |

## Controles interactivos

Una vez dentro de la sesion de chat, los siguientes atajos de teclado estan disponibles:

| Tecla | Accion |
|-------|--------|
| `Enter` | Enviar mensaje |
| `Shift+Enter` o `\` seguido de `Enter` | Nueva linea (entrada multilinea) |
| `Up` / `Down` | Navegar por el historial de mensajes |
| `Ctrl+C` | Cancelar la generacion actual |
| `Ctrl+D` | Salir de la sesion de chat |
| `Ctrl+L` | Limpiar pantalla |

## Comandos de barra

Escribe estos comandos directamente en la entrada del chat:

| Comando | Descripcion |
|---------|-------------|
| `/help` | Mostrar comandos disponibles |
| `/model <nombre>` | Cambiar modelo durante la sesion |
| `/provider <nombre>` | Cambiar proveedor durante la sesion |
| `/system <prompt>` | Actualizar prompt de sistema |
| `/clear` | Limpiar historial de conversacion |
| `/save [nombre]` | Guardar la sesion actual |
| `/load <nombre>` | Cargar una sesion guardada |
| `/sessions` | Listar sesiones guardadas |
| `/tools` | Listar herramientas disponibles |
| `/exit` | Salir del chat |

## Ejemplos

```bash
# Iniciar con valores por defecto
prx chat

# Usar un modelo especifico
prx chat --provider anthropic --model claude-sonnet-4-20250514

# Reanudar una sesion anterior
prx chat --session project-planning

# Pregunta rapida con modelo local
prx chat --provider ollama --model llama3

# Limitar a 10 turnos (util para flujos de trabajo automatizados)
prx chat --max-turns 10
```

## Gestion de sesiones

Las sesiones de chat se guardan automaticamente al salir. Cada sesion registra:

- Mensajes de la conversacion (usuario + asistente)
- Llamadas a herramientas y resultados
- Proveedor y modelo utilizados
- Marca de tiempo y duracion

Las sesiones se almacenan en el directorio de datos de PRX (`~/.local/share/prx/sessions/` por defecto).

```bash
# Listar todas las sesiones
prx chat --session ""  # nombre vacio lista las sesiones

# Reanudar por nombre
prx chat --session my-project
```

## Entrada multilinea

Para prompts mas largos, usa el modo multilinea. Presiona `Shift+Enter` para insertar una nueva linea sin enviar. El indicador del prompt cambia de `>` a `...` para mostrar que estas en modo multilinea.

Alternativamente, redirige la entrada desde un archivo:

```bash
# El chat se abre interactivamente, con el contenido del archivo como primer mensaje
prx chat < prompt.txt
```

## Sobreescritura de proveedor y modelo

Las opciones `--provider` y `--model` sobreescriben los valores por defecto de tu archivo de configuracion durante la sesion. Tambien puedes cambiar durante la sesion usando comandos de barra.

```bash
# Iniciar con OpenAI, cambiar a Anthropic durante la conversacion
prx chat --provider openai
# En el chat: /provider anthropic
# En el chat: /model claude-sonnet-4-20250514
```

## Relacionado

- [prx agent](./agent) -- modo no interactivo de un solo turno
- [Vision general de proveedores](/es/prx/providers/) -- proveedores de LLM soportados
- [Vision general de memoria](/es/prx/memory/) -- como funciona la memoria en las conversaciones
- [Vision general de herramientas](/es/prx/tools/) -- herramientas disponibles durante el chat
