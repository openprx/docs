---
title: Systeme Cron
description: Apercu du systeme cron de PRX pour l'execution de taches planifiees et la surveillance par heartbeat.
---

# Systeme Cron

Le systeme cron de PRX fournit l'execution de taches planifiees pour le daemon. Il gere les taches de maintenance recurrentes, la surveillance par heartbeat et les taches planifiees definies par l'utilisateur.

## Apercu

Le systeme cron s'execute dans le cadre du daemon PRX et gere :

- **Heartbeat** -- verifications de sante periodiques et rapports d'etat
- **Taches de maintenance** -- hygiene de la memoire, rotation des journaux, nettoyage du cache
- **Taches utilisateur** -- actions planifiees personnalisees de l'agent

## Architecture

```
┌─────────────────────────────┐
│    Planificateur Cron        │
│                              │
│  ┌────────────────────────┐  │
│  │  Heartbeat (30s)       │  │
│  ├────────────────────────┤  │
│  │  Hygiene memoire       │  │
│  ├────────────────────────┤  │
│  │  Rotation des journaux │  │
│  ├────────────────────────┤  │
│  │  Taches utilisateur    │  │
│  └────────────────────────┘  │
└─────────────────────────────┘
```

## Configuration

```toml
[cron]
enabled = true
timezone = "UTC"

[[cron.tasks]]
name = "daily-report"
schedule = "0 9 * * *"  # cron expression
action = "agent"
prompt = "Generate a daily summary report"
```

## Pages associees

- [Heartbeat](./heartbeat)
- [Taches integrees](./tasks)
