---
title: prx agent
description: Interaccion LLM de un solo turno para scripting y piping.
---

# prx agent

Ejecuta una interaccion LLM de un solo turno. El agente procesa un prompt, devuelve la respuesta y finaliza. Disenado para scripting, piping e integracion con otras herramientas.

## Uso

```bash
prx agent [OPTIONS] [PROMPT]
```

Si se omite `PROMPT`, la entrada se lee desde stdin.

## Opciones

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--provider` | `-P` | por defecto de config | Proveedor de LLM a usar |
| `--model` | `-m` | por defecto del proveedor | Identificador del modelo |
| `--system` | `-s` | | Prompt de sistema personalizado |
| `--file` | `-f` | | Adjuntar un archivo al contexto del prompt |
| `--no-tools` | | `false` | Deshabilitar el uso de herramientas |
| `--no-memory` | | `false` | Deshabilitar lecturas y escrituras de memoria |
| `--json` | `-j` | `false` | Salida en JSON crudo |
| `--temperature` | `-t` | por defecto del proveedor | Temperatura de muestreo (0.0 - 2.0) |
| `--max-tokens` | | por defecto del proveedor | Tokens maximos de respuesta |
| `--timeout` | | `120` | Tiempo de espera en segundos |

## Ejemplos

```bash
# Pregunta simple
prx agent "What is the capital of France?"

# Redirigir contenido para analisis
cat error.log | prx agent "Summarize these errors"

# Adjuntar un archivo
prx agent -f report.pdf "Summarize the key findings"

# Usar un modelo especifico
prx agent -P anthropic -m claude-sonnet-4-20250514 "Explain quantum entanglement"

# Salida JSON para scripting
prx agent --json "List 5 programming languages" | jq '.content'

# Encadenar con otros comandos
git diff HEAD~1 | prx agent "Write a commit message for this diff"
```

## Stdin vs argumento

El prompt puede proporcionarse como argumento posicional o a traves de stdin. Cuando ambos estan presentes, se concatenan (contenido de stdin primero, luego el argumento como instrucciones).

```bash
# Solo argumento
prx agent "Hello"

# Solo stdin
echo "Hello" | prx agent

# Ambos: stdin como contexto, argumento como instruccion
cat data.csv | prx agent "Find anomalies in this dataset"
```

## Adjuntos de archivos

La opcion `--file` agrega el contenido del archivo al contexto del prompt. Se pueden adjuntar multiples archivos:

```bash
prx agent -f src/main.rs -f src/lib.rs "Review this code for bugs"
```

Los tipos de archivo soportados incluyen archivos de texto, PDFs, imagenes (para modelos con capacidad de vision) y formatos de documento comunes.

## Codigos de salida

| Codigo | Significado |
|--------|-------------|
| `0` | Exito |
| `1` | Error general (configuracion invalida, fallo de red) |
| `2` | Tiempo de espera excedido |
| `3` | Error del proveedor (limite de velocidad, fallo de autenticacion) |

## Relacionado

- [prx chat](./chat) -- chat interactivo multi-turno
- [Vision general de proveedores](/es/prx/providers/) -- proveedores de LLM soportados
- [Vision general de herramientas](/es/prx/tools/) -- herramientas disponibles durante la ejecucion del agente
