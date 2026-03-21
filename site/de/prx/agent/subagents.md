---
title: Sub-Agenten
description: Wie PRX Kind-Agenten für parallele Aufgabenausführung erzeugt, einschließlich Nebenläufigkeitslimits und Tiefenkontrolle.
---

# Sub-Agenten

PRX unterstützt die Erzeugung von Sub-Agenten (Kind-Agenten) innerhalb einer laufenden Agentensitzung. Dies ermöglicht parallele Aufgabenzerlegung, bei der ein Eltern-Agent Arbeit an spezialisierte Kinder delegiert, die nebenläufig ausgeführt werden.

## Überblick

Sub-Agenten sind leichtgewichtige Agenteninstanzen, die:

- Die Anbieterkonfiguration und Anmeldedaten des Eltern-Agenten teilen
- Ihren eigenen Gesprächsverlauf und Gedächtnisbereich haben
- Innerhalb der Sandbox-Richtlinie des Eltern-Agenten ausgeführt werden
- Ergebnisse an den Eltern-Agenten zurückmelden, wenn sie fertig sind

## Erzeugungsmodell

Ein Eltern-Agent kann Sub-Agenten über das eingebaute `spawn_agent`-Werkzeug erzeugen. Jedes Kind erhält:

- Eine Aufgabenbeschreibung (System-Prompt-Überschreibung)
- Eine optionale Menge erlaubter Werkzeuge (Teilmenge der Werkzeuge des Eltern-Agenten)
- Ein maximales Runden-Budget

```
Parent Agent
  ├── Sub-agent 1 (research task)
  ├── Sub-agent 2 (code generation)
  └── Sub-agent 3 (validation)
```

## Nebenläufigkeitslimits

Um Ressourcenerschöpfung zu verhindern, erzwingt PRX Nebenläufigkeitslimits:

```toml
[agent.subagents]
max_concurrent = 4
max_depth = 3
max_total_spawns = 20
child_timeout_secs = 300
```

- **max_concurrent** -- maximale Anzahl gleichzeitig laufender Kind-Agenten
- **max_depth** -- maximale Verschachtelungstiefe (Sub-Agenten, die Sub-Agenten erzeugen)
- **max_total_spawns** -- Gesamtes Erzeugungsbudget pro Stammsitzung
- **child_timeout_secs** -- Timeout für die individuelle Kind-Ausführung

## Tiefenkontrolle

Jeder Sub-Agent verfolgt seine Tiefenebene. Wenn die maximale Tiefe erreicht ist, wird das `spawn_agent`-Werkzeug aus den verfügbaren Werkzeugen des Kindes entfernt, was weitere Verschachtelung verhindert.

## Ergebnisaggregation

Wenn alle Kinder fertig sind, werden ihre Ergebnisse gesammelt und dem Eltern-Agenten als Werkzeugaufruf-Ergebnisse präsentiert. Der Eltern-Agent kann dann die Ausgaben zu einer endgültigen Antwort zusammenfassen.

## Verwandte Seiten

- [Agenten-Laufzeit](./runtime) -- Architekturübersicht
- [Agenten-Schleife](./loop) -- Zentraler Ausführungszyklus
- [Session Worker](./session-worker) -- Prozessisolierung
