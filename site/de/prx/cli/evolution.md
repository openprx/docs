---
title: prx evolution
description: Die PRX-Selbstentwicklungs-Engine überwachen und steuern.
---

# prx evolution

Untersuchen und steuern Sie die Selbstentwicklungs-Engine. PRX unterstützt drei Stufen autonomer Entwicklung: L1 (Gedächtnis), L2 (Prompts) und L3 (Strategien). Dieser Befehl ermöglicht es Ihnen, den Entwicklungsstatus zu prüfen, den Verlauf einzusehen, die Konfiguration zu aktualisieren und manuelle Entwicklungszyklen auszulösen.

## Verwendung

```bash
prx evolution <UNTERBEFEHL> [OPTIONS]
```

## Unterbefehle

### `prx evolution status`

Aktuellen Zustand der Entwicklungs-Engine anzeigen.

```bash
prx evolution status [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--json` | `-j` | `false` | Ausgabe als JSON |

**Beispielausgabe:**

```
 Evolution Engine Status
 ───────────────────────
 Engine:    running
 L1 Memory:    enabled   (last: 2h ago, next: in 4h)
 L2 Prompt:    enabled   (last: 1d ago, next: in 23h)
 L3 Strategy:  disabled
 Total cycles: 142
 Rollbacks:    3
```

### `prx evolution history`

Entwicklungsverlaufsprotokoll anzeigen.

```bash
prx evolution history [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--limit` | `-n` | `20` | Anzahl der anzuzeigenden Einträge |
| `--level` | `-l` | alle | Nach Stufe filtern: `l1`, `l2`, `l3` |
| `--json` | `-j` | `false` | Ausgabe als JSON |

```bash
# Letzte 10 L2-Entwicklungen anzeigen
prx evolution history --limit 10 --level l2
```

**Beispielausgabe:**

```
 Time                Level  Action                          Status
 2026-03-21 08:00    L1     memory consolidation            success
 2026-03-20 20:00    L1     memory consolidation            success
 2026-03-20 09:00    L2     prompt refinement (system)      success
 2026-03-19 14:22    L2     prompt refinement (tool-use)    rolled back
```

### `prx evolution config`

Entwicklungskonfiguration anzeigen oder aktualisieren.

```bash
prx evolution config [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--set` | | | Konfigurationswert setzen (z.B. `--set l1.enabled=true`) |
| `--json` | `-j` | `false` | Ausgabe als JSON |

```bash
# Aktuelle Konfiguration anzeigen
prx evolution config

# L3-Strategieentwicklung aktivieren
prx evolution config --set l3.enabled=true

# L1-Intervall auf 2 Stunden setzen
prx evolution config --set l1.interval=7200
```

### `prx evolution trigger`

Entwicklungszyklus manuell auslösen.

```bash
prx evolution trigger [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--level` | `-l` | `l1` | Auszulösende Entwicklungsstufe: `l1`, `l2`, `l3` |
| `--dry-run` | | `false` | Entwicklung in der Vorschau anzeigen, ohne Änderungen anzuwenden |

```bash
# L1-Gedächtnisentwicklung auslösen
prx evolution trigger --level l1

# L2-Prompt-Entwicklung in der Vorschau anzeigen
prx evolution trigger --level l2 --dry-run
```

## Entwicklungsstufen

| Stufe | Ziel | Beschreibung |
|-------|------|-------------|
| **L1** | Gedächtnis | Konsolidiert, dedupliziert und organisiert Gedächtniseinträge |
| **L2** | Prompts | Verfeinert System-Prompts und Werkzeugnutzungsanweisungen basierend auf Interaktionsmustern |
| **L3** | Strategien | Passt übergeordnete Verhaltensstrategien an (erfordert explizites Opt-in) |

Alle Entwicklungsänderungen sind reversibel. Die Engine pflegt einen Rollback-Verlauf und setzt Änderungen automatisch zurück, die zu verschlechterter Leistung führen.

## Verwandte Themen

- [Selbstentwicklungsübersicht](/de/prx/self-evolution/) -- Architektur und Konzepte
- [L1: Gedächtnisentwicklung](/de/prx/self-evolution/l1-memory) -- Details zur Gedächtniskonsolidierung
- [L2: Prompt-Entwicklung](/de/prx/self-evolution/l2-prompt) -- Prompt-Verfeinerungspipeline
- [L3: Strategieentwicklung](/de/prx/self-evolution/l3-strategy) -- Strategieanpassung
- [Entwicklungssicherheit](/de/prx/self-evolution/safety) -- Rollback- und Sicherheitsmechanismen
