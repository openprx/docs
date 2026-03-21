---
title: Markdown Memory Backend
description: File-based memory storage using Markdown files, ideal for version control and single-user setups.
---

# Markdown Memory Backend

The Markdown backend stores memories as structured Markdown files on disk. This is the simplest backend and works well for single-user CLI setups where you want memories to be human-readable and version-controllable.

## Overview

Memories are organized as Markdown files in a configurable directory. Each memory entry is a section within a file, grouped by topic or date. The format is designed to be both machine-parseable and human-readable.

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

The Markdown backend uses simple full-text grep for recall. While not as sophisticated as semantic search, it is fast and requires no additional dependencies.

## Limitations

- No semantic similarity search
- Linear scan for retrieval (slower with large memory stores)
- Concurrent write access is not safe without file locking

## Related Pages

- [Memory System Overview](./)
- [SQLite Backend](./sqlite) -- for more structured storage
- [Memory Hygiene](./hygiene)
