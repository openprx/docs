---
title: Markdown Memory Backend
description: File-based memory storage using Markdown files, ideal for version control and single-user setups.
---

# Markdown Memory Backend

The Markdown backend stocke memories as structured Markdown files on disk. This est le plus simple backend et works well for single-user CLI setups where you want memories to be human-readable et version-controllable.

## Apercu

Les souvenirs sont organises sous forme de fichiers Markdown dans un repertoire configurable. Chaque entree de souvenir est une section within a file, grouped by topic or date. The format is designed to be both machine-parseable and human-readable.

## File Structure

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

## Configuration

```toml
[memory]
backend = "markdown"

[memory.markdown]
directory = "~/.local/share/openprx/memory"
max_file_size_kb = 512
auto_archive_days = 30
```

## Search

Le backend Markdown utilise une simple recherche grep en texte integral pour le rappel. Bien que moins sophistiquee que la recherche semantique, it is fast and necessite no additional dependencies.

## Limiteations

- Non semantic similarity search
- Linear scan for retrieval (slower with large memory stores)
- Concurrent write access is not safe without file locking

## Voir aussi Pages

- [Memory System Overview](./)
- [SQLite Backend](./sqlite) -- fou plus structured storage
- [Memory Hygiene](./hygiene)
