---
title: Backend de memoria Markdown
description: Almacenamiento de memoria basado en archivos usando archivos Markdown, ideal para control de versiones y configuraciones de usuario unico.
---

# Backend de memoria Markdown

El backend Markdown almacena memorias como archivos Markdown estructurados en disco. Este es el backend mas simple y funciona bien para configuraciones CLI de usuario unico donde deseas que las memorias sean legibles por humanos y controlables por versiones.

## Vision general

Las memorias se organizan como archivos Markdown en un directorio configurable. Cada entrada de memoria es una seccion dentro de un archivo, agrupada por tema o fecha. El formato esta disenado para ser tanto analizable por maquina como legible por humanos.

## Estructura de archivos

```
~/.local/share/openprx/memory/
  ├── facts.md          # Extracted key facts
  ├── preferences.md    # User preferences
  ├── projects/
  │   ├── project-a.md  # Project-specific memories
  │   └── project-b.md
  └── archive/
      └── 2026-02.md    # Archived older memories
```

## Configuracion

```toml
[memory]
backend = "markdown"

[memory.markdown]
directory = "~/.local/share/openprx/memory"
max_file_size_kb = 512
auto_archive_days = 30
```

## Busqueda

El backend Markdown usa grep simple de texto completo para la recuperacion. Aunque no es tan sofisticado como la busqueda semantica, es rapido y no requiere dependencias adicionales.

## Limitaciones

- Sin busqueda por similitud semantica
- Escaneo lineal para la recuperacion (mas lento con almacenes de memoria grandes)
- El acceso concurrente de escritura no es seguro sin bloqueo de archivos

## Paginas relacionadas

- [Vision general del sistema de memoria](./)
- [Backend SQLite](./sqlite) -- para almacenamiento mas estructurado
- [Higiene de memoria](./hygiene)
