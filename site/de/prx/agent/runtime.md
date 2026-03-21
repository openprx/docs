---
title: Agenten-Laufzeitarchitektur
description: Überblick über die PRX-Agenten-Laufzeit, einschließlich Ausführungsmodell, Prozessisolierung und Lebenszyklusverwaltung.
---

# Agenten-Laufzeitarchitektur

Die PRX-Agenten-Laufzeit ist die zentrale Ausführungs-Engine, die alles autonome Agentenverhalten antreibt. Sie verwaltet den Lebenszyklus von Agentensitzungen, koordiniert den Werkzeug-Dispatch, behandelt Streaming-Antworten und erzwingt Ressourcenlimits.

## Architekturübersicht

Die Laufzeit basiert auf einer ereignisgesteuerten Architektur, bei der jede Agentensitzung in einem isolierten Ausführungskontext läuft. Die Hauptkomponenten sind:

- **Session Manager** -- erstellt und verfolgt aktive Agentensitzungen
- **Agenten-Schleife** -- die zentrale Dispatch-Schleife, die LLM-Antworten verarbeitet und Werkzeugaufrufe ausführt
- **Gedächtnisschicht** -- bietet Kontextabruf und Kompaktierung über Runden hinweg
- **Werkzeugregistrierung** -- verwaltet verfügbare Werkzeuge und deren Berechtigungsrichtlinien

```
┌─────────────────────────────────────────┐
│              Session Manager             │
│  ┌───────────┐  ┌───────────┐           │
│  │ Session A  │  │ Session B  │  ...     │
│  │ ┌───────┐  │  │ ┌───────┐  │         │
│  │ │ Loop  │  │  │ │ Loop  │  │         │
│  │ │ Memory│  │  │ │ Memory│  │         │
│  │ │ Tools │  │  │ │ Tools │  │         │
│  │ └───────┘  │  │ └───────┘  │         │
│  └───────────┘  └───────────┘           │
└─────────────────────────────────────────┘
```

## Ausführungsmodell

Jede Agentensitzung folgt einem Anfrage-Antwort-Zyklus:

1. **Benutzereingabe empfangen** -- Textnachricht, Werkzeugergebnis oder Systemereignis
2. **Kontext aufbauen** -- System-Prompt, Gedächtnis und Gesprächsverlauf zusammenstellen
3. **LLM-Inferenz** -- Antwort vom konfigurierten Anbieter streamen
4. **Werkzeug-Dispatch** -- wenn das LLM Werkzeugaufrufe ausgibt, diese in der Sandbox ausführen
5. **Schleife oder Rückgabe** -- Schleife fortsetzen, wenn Werkzeuge aufgerufen wurden, oder endgültige Antwort zurückgeben

## Konfiguration

Das Laufzeitverhalten kann in `config.toml` angepasst werden:

```toml
[agent]
max_turns = 50
max_tool_calls_per_turn = 10
session_timeout_secs = 3600
stream_buffer_size = 64

[agent.limits]
max_concurrent_sessions = 8
max_memory_mb = 512
```

## Prozessisolierung

Agentensitzungen können optional in separaten Prozessen für Fehlerisolierung laufen. Siehe [Session Worker](./session-worker) für Details zum prozessisolierten Ausführungsmodell.

## Verwandte Seiten

- [Agenten-Schleife](./loop) -- Werkzeug-Dispatch, Streaming, Gedächtnisabruf
- [Sub-Agenten](./subagents) -- Erzeugung von Kind-Agenten mit Nebenläufigkeitskontrolle
- [Session Worker](./session-worker) -- Prozessisolierte Sitzungsausführung
