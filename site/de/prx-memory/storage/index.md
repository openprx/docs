---
title: Speicher-Backends
description: "Übersicht der PRX-Memory-Speicher-Backends, einschließlich JSON-dateibasiertem Speicher, SQLite mit Vektorerweiterungen und optionalem LanceDB."
---

# Speicher-Backends

PRX-Memory unterstützt mehrere Speicher-Backends zur Persistierung von Erinnerungen und ihren Vektorembeddings. Das `prx-memory-storage`-Crate bietet eine einheitliche Schnittstelle, die alle Backends implementieren.

## Verfügbare Backends

| Backend | Konfigurationswert | Vektorunterstützung | Persistenz | Geeignet für |
|---------|-------------------|--------------------|-----------|----|
| JSON | `json` | In Einträgen eingebettet | Dateibasiert | Entwicklung, kleine Datensätze |
| SQLite | `sqlite` | Eingebaute Vektorspalten | Dateibasiert | Produktion, mittlere Datensätze |
| LanceDB | `lancedb` | Nativer Vektorindex | Verzeichnisbasiert | Große Datensätze, schnelle ANN-Suche |

::: tip Standard-Backend
Das Standard-Backend ist JSON (`PRX_MEMORY_BACKEND=json`), das keine zusätzliche Einrichtung erfordert. Für Produktionsbereitstellungen wird SQLite empfohlen.
:::

## JSON-Backend

Das einfachste Backend speichert alle Erinnerungen in einer einzigen JSON-Datei. Es ist ideal für Entwicklung, Tests und kleine Speichersätze (unter 10.000 Einträge).

```bash
PRX_MEMORY_BACKEND=json
PRX_MEMORY_DB=./data/memory-db.json
```

**Vorteile:**
- Null Einrichtung -- einfach einen Dateipfad angeben.
- Menschenlesbar -- mit jedem Texteditor inspizieren und bearbeiten.
- Portabel -- die Datei kopieren, um die gesamte Speicherdatenbank zu verschieben.

**Einschränkungen:**
- Die gesamte Datei wird beim Start in den Arbeitsspeicher geladen.
- Schreiboperationen schreiben die vollständige Datei neu.
- Keine indizierte Vektorsuche -- Brute-Force-Scan für Ähnlichkeit.

## SQLite-Backend

SQLite bietet ACID-Transaktionen, indizierte Abfragen und eingebaute Vektorspaltenunterstützung für effiziente Ähnlichkeitssuche.

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

Siehe [SQLite-Speicher](./sqlite) für detaillierte Konfiguration.

## LanceDB-Backend (Optional)

LanceDB bietet native Approximate-Nearest-Neighbor (ANN)-Vektorsuche mit spaltenbasiertem Speicher. Mit dem `lancedb-backend`-Feature-Flag aktivieren:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

```bash
PRX_MEMORY_BACKEND=lancedb
PRX_MEMORY_DB=./data/lancedb
```

::: warning Feature-Flag erforderlich
LanceDB-Unterstützung ist nicht im Standard-Build enthalten. Das `lancedb-backend`-Feature-Flag muss zur Kompilierzeit aktiviert werden.
:::

## Backend auswählen

| Szenario | Empfohlenes Backend |
|----------|-------------------|
| Lokale Entwicklung | JSON |
| Produktion mit <100k Einträgen | SQLite |
| Produktion mit >100k Einträgen | LanceDB |
| Menschenlesbaren Speicher benötigt | JSON |
| ACID-Transaktionen benötigt | SQLite |
| Schnelle ANN-Vektorsuche benötigt | LanceDB |

## Speicheroperationen

PRX-Memory bietet Tools für die Speicherwartung:

| Tool | Beschreibung |
|------|-------------|
| `memory_export` | Alle Erinnerungen in ein portables Format exportieren |
| `memory_import` | Erinnerungen aus einem Export importieren |
| `memory_migrate` | Zwischen Speicher-Backends migrieren |
| `memory_compact` | Speicher optimieren und Platz zurückgewinnen |
| `memory_reembed` | Alle Erinnerungen mit einem neuen Modell neu einbetten |

## Nächste Schritte

- [SQLite-Speicher](./sqlite) -- SQLite-Konfiguration und Feinabstimmung
- [Vektorsuche](./vector-search) -- Wie Vektorähnlichkeitssuche funktioniert
- [Konfigurationsreferenz](../configuration/) -- Alle Umgebungsvariablen
