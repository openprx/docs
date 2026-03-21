---
title: SQLite-Gedachtnis-Backend
description: Lokale Datenbank-Gedachtnisspeicherung mit SQLite und FTS5-Volltextsuche.
---

# SQLite-Gedachtnis-Backend

Das SQLite-Backend speichert Erinnerungen in einer lokalen SQLite-Datenbank mit FTS5-Volltext-Suchindizierung. Dies bietet strukturierte Speicherung mit schnellem Abruf bei vollstandiger Lokalitat.

## Ubersicht

SQLite ist das Standard-Gedachtnis-Backend fur PRX. Es bietet ein gutes Gleichgewicht aus Leistung, Funktionen und Einfachheit:

- Volltextsuche uber die FTS5-Erweiterung
- ACID-Transaktionen fur zuverlassige Schreibvorgange
- Null Konfiguration (einzelne Datenbankdatei)
- Effizient fur bis zu Zehntausende von Gedachtnis-Eintragen

## Schema

Das SQLite-Backend verwendet die folgenden Kerntabellen:

- `memories` -- speichert einzelne Gedachtnis-Eintrage mit Metadaten
- `memories_fts` -- FTS5-virtuelle Tabelle fur Volltextsuche
- `topics` -- Themenkategorisierung fur Gedachtnis-Organisation

## Konfiguration

```toml
[memory]
backend = "sqlite"

[memory.sqlite]
path = "~/.local/share/openprx/memory.db"
journal_mode = "wal"
busy_timeout_ms = 5000
```

## Volltextsuche

Der FTS5-Index ermoglicht rangierte Volltextsuche uber alle Gedachtnis-Eintrage. Abfragen unterstutzen:

- Boolesche Operatoren (AND, OR, NOT)
- Phrasensuche mit Anfuhrungszeichen
- Prafixsuche mit Sternchen
- Spaltenspezifische Suche

## Verwandte Seiten

- [Gedachtnissystem-Ubersicht](./)
- [PostgreSQL-Backend](./postgres) -- fur Multi-User-Bereitstellungen
- [Gedachtnis-Hygiene](./hygiene)
