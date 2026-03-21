---
title: Session Worker
description: Prozessisolierte Sitzungsausführung in PRX für Fehlertoleranz und Ressourcenbegrenzung.
---

# Session Worker

Der Session Worker bietet Prozessebenen-Isolierung für Agentensitzungen. Anstatt alle Sitzungen in einem einzigen Prozess auszuführen, kann PRX dedizierte Worker-Prozesse erzeugen, die Fehler eindämmen und Ressourcenlimits auf Betriebssystemebene erzwingen.

## Motivation

Prozessisolierung bietet mehrere Vorteile:

- **Fehlereindämmung** -- ein Absturz in einer Sitzung beeinträchtigt nicht die anderen
- **Ressourcenlimits** -- Erzwingung von Pro-Sitzung-Speicher- und CPU-Limits über cgroups oder OS-Mechanismen
- **Sicherheitsgrenze** -- Sitzungen mit unterschiedlichen Vertrauensstufen laufen in separaten Adressräumen
- **Ordnungsgemäße Degradation** -- der Hauptprozess kann fehlgeschlagene Worker neu starten

## Architektur

```
┌──────────────┐
│  Main Process │
│  (Supervisor) │
│               │
│  ┌──────────┐ │    ┌─────────────┐
│  │ Session A ├─┼───►│ Worker Proc │
│  └──────────┘ │    └─────────────┘
│  ┌──────────┐ │    ┌─────────────┐
│  │ Session B ├─┼───►│ Worker Proc │
│  └──────────┘ │    └─────────────┘
└──────────────┘
```

Der Hauptprozess fungiert als Supervisor und kommuniziert mit Workern über IPC (Unix-Domain-Sockets oder Pipes).

## Kommunikationsprotokoll

Worker kommunizieren mit dem Supervisor über ein längen-präfixiertes JSON-Protokoll über den IPC-Kanal:

1. **Spawn** -- Supervisor sendet Sitzungskonfiguration an den Worker
2. **Nachrichten** -- bidirektionales Streaming von Benutzer-/Agenten-Nachrichten
3. **Heartbeat** -- periodische Gesundheitsprüfungen
4. **Shutdown** -- ordnungsgemäßes Beendigungssignal

## Konfiguration

```toml
[agent.worker]
enabled = false
ipc_socket_dir = "/tmp/prx-workers"
heartbeat_interval_secs = 10
max_restart_attempts = 3
```

## Ressourcenlimits

Unter Linux kann der Session Worker cgroup-basierte Ressourcenlimits anwenden:

```toml
[agent.worker.limits]
memory_limit_mb = 256
cpu_shares = 512
```

## Verwandte Seiten

- [Agenten-Laufzeit](./runtime) -- Architekturübersicht
- [Agenten-Schleife](./loop) -- Zentraler Ausführungszyklus
- [Sicherheits-Sandbox](/de/prx/security/sandbox) -- Sandbox-Backends
