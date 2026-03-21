---
title: Cron-System
description: Ubersicht uber das PRX-Cron-System fur geplante Aufgabenausfuhrung und Heartbeat-Uberwachung.
---

# Cron-System

Das PRX-Cron-System bietet geplante Aufgabenausfuhrung fur den Daemon. Es handhabt wiederkehrende Wartungsaufgaben, Heartbeat-Uberwachung und benutzerdefinierte geplante Aufgaben.

## Ubersicht

Das Cron-System lauft als Teil des PRX-Daemons und verwaltet:

- **Heartbeat** -- periodische Gesundheitsprufungen und Statusberichte
- **Wartungsaufgaben** -- Gedachtnis-Hygiene, Log-Rotation, Cache-Bereinigung
- **Benutzeraufgaben** -- benutzerdefinierte geplante Agentenaktionen

## Architektur

```
┌─────────────────────────┐
│     Cron-Scheduler       │
│                          │
│  ┌────────────────────┐  │
│  │  Heartbeat (30s)   │  │
│  ├────────────────────┤  │
│  │  Gedachtnis-Hygiene│  │
│  ├────────────────────┤  │
│  │  Log-Rotation      │  │
│  ├────────────────────┤  │
│  │  Benutzeraufgaben  │  │
│  └────────────────────┘  │
└─────────────────────────┘
```

## Konfiguration

```toml
[cron]
enabled = true
timezone = "UTC"

[[cron.tasks]]
name = "daily-report"
schedule = "0 9 * * *"  # Cron-Ausdruck
action = "agent"
prompt = "Generate a daily summary report"
```

## Verwandte Seiten

- [Heartbeat](./heartbeat)
- [Integrierte Aufgaben](./tasks)
