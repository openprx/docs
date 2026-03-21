---
title: prx skills
description: Gestionar habilidades instalables que extienden las capacidades del agente PRX.
---

# prx skills

Gestiona las habilidades -- paquetes de capacidades modulares que extienden lo que el agente PRX puede hacer. Las habilidades agrupan prompts, configuraciones de herramientas y plugins WASM en unidades instalables.

## Uso

```bash
prx skills <SUBCOMANDO> [OPTIONS]
```

## Subcomandos

### `prx skills list`

Lista las habilidades instaladas y las habilidades disponibles en el registro.

```bash
prx skills list [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--installed` | | `false` | Mostrar solo las habilidades instaladas |
| `--available` | | `false` | Mostrar solo las disponibles (aun no instaladas) |
| `--json` | `-j` | `false` | Salida en formato JSON |

**Ejemplo de salida:**

```
 Name              Version   Status      Description
 code-review       1.2.0     installed   Automated code review with context
 web-research      1.0.3     installed   Deep web research with source citing
 image-gen         0.9.1     available   Image generation via DALL-E / Stable Diffusion
 data-analysis     1.1.0     available   CSV/JSON data analysis and visualization
 git-workflow      1.0.0     installed   Git branch management and PR creation
```

### `prx skills install`

Instala una habilidad desde el registro o una ruta local.

```bash
prx skills install <NOMBRE|RUTA> [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--version` | `-v` | ultima | Version especifica a instalar |
| `--force` | `-f` | `false` | Reinstalar aunque ya este instalada |

```bash
# Instalar desde el registro
prx skills install code-review

# Instalar una version especifica
prx skills install web-research --version 1.0.2

# Instalar desde ruta local
prx skills install ./my-custom-skill/

# Forzar reinstalacion
prx skills install code-review --force
```

### `prx skills remove`

Desinstala una habilidad.

```bash
prx skills remove <NOMBRE> [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--force` | `-f` | `false` | Omitir confirmacion |

```bash
prx skills remove image-gen
prx skills remove image-gen --force
```

## Estructura de una habilidad

Un paquete de habilidad contiene:

```
my-skill/
  skill.toml          # Metadatos y configuracion de la habilidad
  system_prompt.md    # Instrucciones adicionales del prompt de sistema
  tools.toml          # Definiciones de herramientas y permisos
  plugin.wasm         # Binario de plugin WASM opcional
```

El manifiesto `skill.toml`:

```toml
[skill]
name = "my-skill"
version = "1.0.0"
description = "What this skill does"
author = "your-name"

[permissions]
tools = ["shell", "http_request"]
memory = true
```

## Directorio de habilidades

Las habilidades instaladas se almacenan en:

```
~/.local/share/prx/skills/
  code-review/
  web-research/
  git-workflow/
```

## Relacionado

- [Vision general de plugins](/es/prx/plugins/) -- sistema de plugins WASM
- [Vision general de herramientas](/es/prx/tools/) -- herramientas integradas
- [Guia del desarrollador](/es/prx/plugins/developer-guide) -- construir plugins personalizados
