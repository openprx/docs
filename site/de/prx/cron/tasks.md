---
title: Integrierte Aufgaben
description: Referenz fur integrierte geplante Aufgaben im PRX-Cron-System.
---

# Integrierte Aufgaben

PRX enthalt mehrere integrierte Cron-Aufgaben, die routinemassige Wartung handhaben. Diese Aufgaben laufen automatisch, wenn das Cron-System aktiviert ist.

## Aufgabenreferenz

| Aufgabe | Standardzeitplan | Beschreibung |
|---------|-----------------|-------------|
| `heartbeat` | Alle 30s | System-Gesundheitsprufung |
| `memory-hygiene` | Taglich um 3:00 | Gedachtnis-Eintrage komprimieren und bereinigen |
| `log-rotation` | Taglich um 0:00 | Alte Log-Dateien rotieren und komprimieren |
| `cache-cleanup` | Stundlich | Abgelaufene Cache-Eintrage entfernen |
| `metrics-export` | Alle 5m | Metriken in konfigurierte Backends exportieren |
| `signature-update` | Alle 6h | Bedrohungssignaturen aktualisieren (wenn PRX-SD-Integration aktiviert) |

## Konfiguration

Jede integrierte Aufgabe kann einzeln aktiviert/deaktiviert und umgeplant werden:

```toml
[cron.builtin.memory_hygiene]
enabled = true
schedule = "0 3 * * *"

[cron.builtin.log_rotation]
enabled = true
schedule = "0 0 * * *"
max_log_age_days = 30

[cron.builtin.cache_cleanup]
enabled = true
schedule = "0 * * * *"
```

## Benutzerdefinierte Aufgaben

Zusatzlich zu integrierten Aufgaben konnen Sie benutzerdefinierte Agentenaufgaben definieren, die einen Prompt nach Zeitplan ausfuhren:

```toml
[[cron.tasks]]
name = "weekly-cleanup"
schedule = "0 2 * * 0"  # Sonntags um 2:00 Uhr
action = "agent"
prompt = "Review and archive old conversation logs"
timeout_secs = 300
```

## Verwandte Seiten

- [Cron-System-Ubersicht](./)
- [Heartbeat](./heartbeat)
- [Gedachtnis-Hygiene](/de/prx/memory/hygiene)
