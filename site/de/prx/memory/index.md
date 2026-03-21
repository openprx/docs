---
title: Gedachtnissystem
description: Ubersicht uber das PRX-Gedachtnissystem mit 5 Speicher-Backends fur persistenten Agentenkontext.
---

# Gedachtnissystem

PRX bietet ein flexibles Gedachtnissystem, das es Agenten ermoglicht, Kontext uber Gesprache hinweg zu persistieren und abzurufen. Das Gedachtnissystem unterstutzt 5 Speicher-Backends, die jeweils fur verschiedene Bereitstellungsszenarien optimiert sind.

## Ubersicht

Das Gedachtnissystem erfullt drei primare Funktionen:

- **Abruf** -- relevante vergangene Interaktionen und Fakten vor jedem LLM-Aufruf abrufen
- **Speicherung** -- wichtige Informationen aus Gesprachen extrahieren und persistieren
- **Komprimierung** -- alte Erinnerungen zusammenfassen und komprimieren, um in Kontextlimits zu passen

## Speicher-Backends

| Backend | Persistenz | Suche | Geeignet fur |
|---------|-----------|-------|-------------|
| [Markdown](./markdown) | Dateibasiert | Volltext-Grep | Einzelbenutzer-CLI, versionskontrolliertes Gedachtnis |
| [SQLite](./sqlite) | Lokale Datenbank | FTS5-Volltext | Lokale Bereitstellungen, kleine Teams |
| [PostgreSQL](./postgres) | Remote-Datenbank | pg_trgm + FTS | Multi-User-Server-Bereitstellungen |
| [Embeddings](./embeddings) | Vektorspeicher | Semantische Ahnlichkeit | RAG-Abruf, grosse Wissensbasen |
| In-Memory | Keine (nur Sitzung) | Linearer Scan | Ephemere Sitzungen, Tests |

## Konfiguration

Wahlen und konfigurieren Sie das Gedachtnis-Backend in `config.toml`:

```toml
[memory]
backend = "sqlite"  # "markdown" | "sqlite" | "postgres" | "embeddings" | "memory"
max_recall_items = 20
recall_relevance_threshold = 0.3

[memory.sqlite]
path = "~/.local/share/openprx/memory.db"

[memory.postgres]
url = "postgresql://user:pass@localhost/prx"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768
```

## Gedachtnis-Lebenszyklus

1. **Extraktion** -- nach jeder Gesprachsrunde extrahiert das System Schlusselfakten
2. **Deduplizierung** -- neue Fakten werden mit bestehenden Erinnerungen verglichen
3. **Speicherung** -- einzigartige Fakten werden im konfigurierten Backend persistiert
4. **Abruf** -- vor jedem LLM-Aufruf werden relevante Erinnerungen abgerufen
5. **Hygiene** -- periodische Wartung komprimiert und bereinigt veraltete Eintrage

## Verwandte Seiten

- [Markdown-Backend](./markdown)
- [SQLite-Backend](./sqlite)
- [PostgreSQL-Backend](./postgres)
- [Embeddings-Backend](./embeddings)
- [Gedachtnis-Hygiene](./hygiene)
