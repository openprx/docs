---
title: Entscheidungsprotokoll
description: Entscheidungsprotokollierung wahrend Selbstevolutions-Zyklen -- was aufgezeichnet wird, Format, Analyse und Rollback-Nachverfolgung.
---

# Entscheidungsprotokoll

Jede Entscheidung, die wahrend eines Selbstevolutions-Zyklus getroffen wird, wird in einem strukturierten Entscheidungsprotokoll aufgezeichnet. Dieses Protokoll bietet einen vollstandigen Audit-Trail dessen, was das Evolutionssystem entschieden hat, warum es so entschieden hat und was als Ergebnis passiert ist -- und ermoglicht nachträgliche Analyse, Debugging und sicheres Rollback.

## Ubersicht

Das Entscheidungsprotokoll erfasst den vollstandigen Lebenszyklus von Evolutionsentscheidungen:

- **Vorschlagsgenerierung** -- welche Verbesserung vorgeschlagen wurde und warum
- **Evaluierung** -- wie der Vorschlag anhand von Sicherheits- und Eignungskriterien bewertet wurde
- **Urteil** -- ob der Vorschlag genehmigt, abgelehnt oder zuruckgestellt wurde
- **Ausfuhrung** -- welche Anderungen angewendet wurden und ihre unmittelbaren Auswirkungen
- **Ergebnis** -- gemessene Resultate nach der Anderung, einschliesslich etwaiger Regressionen

Im Gegensatz zum Sicherheits-Audit-Protokoll (das alle Sicherheitsereignisse aufzeichnet) konzentriert sich das Entscheidungsprotokoll speziell auf den Entscheidungsprozess des Selbstevolutions-Systems.

## Struktur des Entscheidungsdatensatzes

Jede Entscheidung wird als strukturierter Datensatz gespeichert:

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `decision_id` | `String` | Eindeutiger Bezeichner (UUIDv7, zeitlich geordnet) |
| `cycle_id` | `String` | Der Evolutionszyklus, der diese Entscheidung erzeugt hat |
| `layer` | `Layer` | Evolutions-Schicht: `L1` (Gedachtnis), `L2` (Prompt) oder `L3` (Strategie) |
| `timestamp` | `DateTime<Utc>` | Wann die Entscheidung aufgezeichnet wurde |
| `proposal` | `Proposal` | Die vorgeschlagene Anderung (Typ, Beschreibung, Parameter) |
| `rationale` | `String` | Erklarung, warum diese Anderung vorgeschlagen wurde |
| `data_points` | `usize` | Anzahl der Datenstichproben, die die Entscheidung informiert haben |
| `fitness_before` | `f64` | Eignungsscore vor der Anderung |
| `fitness_after` | `Option<f64>` | Eignungsscore nach der Anderung (nach der Ausfuhrung befullt) |
| `verdict` | `Verdict` | `approved`, `rejected`, `deferred` oder `auto_approved` |
| `verdict_reason` | `String` | Warum das Urteil getroffen wurde (z.B. Ergebnis der Sicherheitsprufung) |
| `executed` | `bool` | Ob die Anderung tatsachlich angewendet wurde |
| `rollback_id` | `Option<String>` | Referenz zum Rollback-Snapshot, falls einer erstellt wurde |
| `outcome` | `Option<Outcome>` | Post-Ausfuhrungsergebnis: `improved`, `neutral`, `regressed` oder `rolled_back` |

### Urteilstypen

| Urteil | Beschreibung | Ausloser |
|--------|-------------|----------|
| `auto_approved` | Automatisch von der Pipeline genehmigt | L1-Anderungen mit Risikoscore unter dem Schwellenwert |
| `approved` | Nach Evaluierung genehmigt | L2/L3-Anderungen, die Sicherheitsprufungen bestehen |
| `rejected` | Von der Sicherheitspipeline abgelehnt | Fehlgeschlagene Integritatsprufungen, zu hohes Risiko oder erkannte Konflikte |
| `deferred` | Zur spateren Evaluierung zuruckgestellt | Unzureichende Daten oder Bedenken bezuglich der Systemgesundheit |

## Konfiguration

```toml
[self_evolution.decision_log]
enabled = true
storage = "file"                # "file" oder "database"
path = "~/.local/share/openprx/decisions/"
format = "jsonl"                # "jsonl" oder "json" (formatiert)
retention_days = 180            # Eintrage automatisch loschen, die alter als 180 Tage sind
max_entries = 10000             # Maximale Eintrage vor Rotation

[self_evolution.decision_log.database]
backend = "sqlite"
path = "~/.local/share/openprx/decisions.db"
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `true` | Entscheidungsprotokollierung aktivieren oder deaktivieren |
| `storage` | `String` | `"file"` | Speicher-Backend: `"file"` oder `"database"` |
| `path` | `String` | `"~/.local/share/openprx/decisions/"` | Verzeichnis fur Protokolldateien (Dateimodus) |
| `format` | `String` | `"jsonl"` | Dateiformat: `"jsonl"` (kompakt) oder `"json"` (menschenlesbar) |
| `retention_days` | `u64` | `180` | Eintrage automatisch loschen, die alter als N Tage sind. 0 = dauerhaft behalten |
| `max_entries` | `usize` | `10000` | Maximale Eintrage pro Datei vor Rotation |
| `database.backend` | `String` | `"sqlite"` | Datenbank-Backend: `"sqlite"` oder `"postgres"` |
| `database.path` | `String` | `""` | Datenbankpfad (SQLite) oder Verbindungs-URL (PostgreSQL) |

## Beispiel-Entscheidungsdatensatz

```json
{
  "decision_id": "019520b0-5678-7000-8000-000000000042",
  "cycle_id": "cycle_2026-03-21T03:00:00Z",
  "layer": "L2",
  "timestamp": "2026-03-21T03:05:12.345Z",
  "proposal": {
    "type": "prompt_refinement",
    "description": "Shorten system prompt preamble by 15% to reduce token usage",
    "parameters": {
      "target": "system_prompt.preamble",
      "old_token_count": 320,
      "new_token_count": 272
    }
  },
  "rationale": "Analysis of 500 sessions shows the preamble consumes 8% of context window with low recall contribution. A/B test variant with shortened preamble showed 3% improvement in response relevance.",
  "data_points": 500,
  "fitness_before": 0.72,
  "fitness_after": 0.75,
  "verdict": "approved",
  "verdict_reason": "Passed all safety checks. Risk score 0.12 (threshold: 0.5). No conflicts with existing policies.",
  "executed": true,
  "rollback_id": "snap_019520b0-5678-7000-8000-000000000043",
  "outcome": "improved"
}
```

## Entscheidungsprotokoll abfragen

### CLI-Befehle

```bash
# Letzte Entscheidungen anzeigen
prx evolution decisions --tail 20

# Nach Schicht filtern
prx evolution decisions --layer L2 --last 30d

# Nach Urteil filtern
prx evolution decisions --verdict rejected --last 7d

# Nach Ergebnis filtern
prx evolution decisions --outcome regressed

# Eine bestimmte Entscheidung mit vollstandigen Details anzeigen
prx evolution decisions --id 019520b0-5678-7000-8000-000000000042

# Entscheidungen fur Analyse exportieren
prx evolution decisions --last 90d --format json > decisions_q1.json
```

### Programmatischer Zugriff

Das Entscheidungsprotokoll ist uber die Gateway-API zuganglich:

```bash
# Letzte Entscheidungen auflisten
curl -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/evolution/decisions?limit=20

# Eine bestimmte Entscheidung abrufen
curl -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/evolution/decisions/019520b0-5678-7000-8000-000000000042
```

## Entscheidungsmuster analysieren

### Genehmigungsrate nach Schicht

Verfolgen Sie, welcher Prozentsatz der Vorschlage auf jeder Schicht genehmigt wird, um die Effektivitat des Evolutionssystems zu verstehen:

```bash
prx evolution stats --last 90d
```

Beispielausgabe:

```
Layer   Proposed  Approved  Rejected  Deferred  Approval Rate
L1      142       138       2         2         97.2%
L2      28        19        6         3         67.9%
L3      5         2         3         0         40.0%
```

### Regressionserkennung

Entscheidungen identifizieren, die zu Regressionen gefuhrt haben:

```bash
prx evolution decisions --outcome regressed --last 90d
```

Jede regredierte Entscheidung enthalt die Werte `fitness_before` und `fitness_after`, was es einfach macht, die Auswirkung zu messen und mit der Anderung zu korrelieren.

### Rollback-Nachverfolgung

Wenn eine Entscheidung zuruckgerollt wird, zeichnet das Protokoll auf:

1. Die ursprungliche Entscheidung mit `outcome = "rolled_back"`
2. Einen neuen Entscheidungsdatensatz fur die Rollback-Aktion selbst
3. Die `rollback_id` verweist zuruck auf den wiederhergestellten Snapshot

Diese Kette ermoglicht es, den vollstandigen Lebenszyklus nachzuverfolgen: Vorschlag, Ausfuhrung, Regressionserkennung und Rollback.

## Rollback aus dem Entscheidungsprotokoll

Um eine bestimmte Entscheidung manuell zuruckzurollen:

```bash
# Die Entscheidung und ihren Rollback-Snapshot anzeigen
prx evolution decisions --id <decision_id>

# Den Snapshot wiederherstellen
prx evolution rollback --snapshot <rollback_id>
```

Die Rollback-Operation erstellt einen neuen Entscheidungsdatensatz, der den manuellen Eingriff dokumentiert.

## Integration mit dem Sicherheitssystem

Das Entscheidungsprotokoll integriert sich mit der Sicherheitspipeline:

- **Vor der Ausfuhrung** -- die Sicherheitspipeline liest vergangene Entscheidungen, um Muster zu erkennen (z.B. wiederholte Fehler im selben Bereich)
- **Nach der Ausfuhrung** -- Regressionssignale losen automatisches Rollback aus, das im Protokoll aufgezeichnet wird
- **Ratenlimitierung** -- die Pipeline pruft das Protokoll, um maximale Anderungen pro Zeitfenster durchzusetzen

## Einschrankungen

- Entscheidungsprotokolle sind lokal fur die PRX-Instanz; Multi-Node-Bereitstellungen erfordern externe Log-Aggregation
- Das Datei-Backend unterstutzt keine indizierten Abfragen; verwenden Sie das Datenbank-Backend fur grossangelegte Analysen
- Eignungs-Scores werden erst nach Abschluss des Beobachtungsfensters befullt (pro Schicht konfigurierbar)
- Zuruckgestellte Entscheidungen werden moglicherweise nie aufgelost, wenn die Zuruckstellungsbedingung nicht erneut evaluiert wird

## Verwandte Seiten

- [Selbstevolutions-Ubersicht](./)
- [Evolutions-Pipeline](./pipeline) -- die 4-stufige Pipeline, die Entscheidungen erzeugt
- [Experimente & Eignung](./experiments) -- A/B-Tests und Eignungsbewertung
- [Sicherheit & Rollback](./safety) -- Sicherheitsprufungen und automatisches Rollback
