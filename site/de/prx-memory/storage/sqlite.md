---
title: SQLite-Speicher
description: "Das SQLite-Speicher-Backend für PRX-Memory mit Vektorspalten und indizierten Abfragen konfigurieren und optimieren."
---

# SQLite-Speicher

Das SQLite-Backend bietet eine robuste, dateibasierte Speicher-Engine mit ACID-Transaktionen, indizierten Abfragen und eingebauter Vektorspaltenunterstützung für effiziente Ähnlichkeitssuche. Es ist das empfohlene Backend für Produktionsbereitstellungen mit bis zu 100.000 Erinnerungen.

## Konfiguration

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

Die Datenbankdatei wird beim ersten Start automatisch erstellt. Alle Tabellen, Indizes und Vektorspalten werden von PRX-Memory initialisiert.

## Schema-Übersicht

Das SQLite-Backend speichert Erinnerungen in einem strukturierten Schema:

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| `id` | TEXT | Eindeutiger Erinnerungsbezeichner |
| `text` | TEXT | Erinnerungsinhalt |
| `scope` | TEXT | Erinnerungs-Scope (global, Projekt usw.) |
| `tags` | TEXT | JSON-Array von Tags |
| `importance` | REAL | Wichtigkeitsbewertung (0,0--1,0) |
| `created_at` | TEXT | ISO-8601-Zeitstempel |
| `updated_at` | TEXT | ISO-8601-Zeitstempel |
| `embedding` | BLOB | Vektorembedding (wenn aktiviert) |
| `metadata` | TEXT | Zusätzliche JSON-Metadaten |

## Vektorspeicher

Wenn Embedding aktiviert ist, werden Vektordaten als BLOB-Spalten in derselben Tabelle wie der Speichereintrag gespeichert. Diese Ko-Lokation vereinfacht Abfragen und vermeidet Join-Overhead.

Vektorähnlichkeitssuche verwendet Brute-Force-Kosinus-Ähnlichkeitsberechnung über die gespeicherten Vektoren. Bei Datensätzen unter 100.000 Einträgen bietet dies Sub-Sekunden-Abfragezeiten (p95 unter 123ms basierend auf Benchmarks).

## Wartung

### Komprimierung

Im Laufe der Zeit können Löschungen und Aktualisierungen fragmentierten Speicher hinterlassen. `memory_compact` verwenden, um Platz zurückzugewinnen:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_compact",
    "arguments": {}
  }
}
```

### Backup

Die SQLite-Datenbankdatei kann durch einfaches Kopieren gesichert werden, während der Server gestoppt ist:

```bash
cp ./data/memory.db ./data/memory.db.backup
```

::: warning
Die Datenbankdatei nicht kopieren, während der Server läuft. SQLite verwendet Write-Ahead-Logging (WAL) und eine Dateikopie während des Schreibens kann ein beschädigtes Backup erzeugen. Zuerst den Server stoppen oder das `memory_export`-Tool für einen sicheren Export verwenden.
:::

### Migration von JSON

Um vom JSON-Backend zu SQLite zu migrieren:

1. Erinnerungen mit `memory_export` exportieren.
2. Die Backend-Konfiguration auf SQLite ändern.
3. Die exportierten Daten mit `memory_import` importieren.

Oder das `memory_migrate`-Tool für eine direkte Migration verwenden.

## Nächste Schritte

- [Vektorsuche](./vector-search) -- Wie Ähnlichkeitssuche intern funktioniert
- [Speicher-Übersicht](./index) -- Alle Backends vergleichen
- [Konfigurationsreferenz](../configuration/) -- Alle Umgebungsvariablen
