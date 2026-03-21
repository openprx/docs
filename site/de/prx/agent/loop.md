---
title: Agenten-Schleife
description: Die zentrale Agenten-Schleife in PRX, einschließlich Werkzeug-Dispatch, Streaming, Gedächtnisabruf und Kontextkompaktierung.
---

# Agenten-Schleife

Die Agenten-Schleife ist der zentrale Ausführungszyklus, der jede PRX-Agentensitzung antreibt. Jede Iteration verarbeitet eine LLM-Antwort, dispatcht Werkzeugaufrufe, verwaltet das Gedächtnis und entscheidet, ob fortgefahren oder eine endgültige Antwort zurückgegeben wird.

## Schleifenlebenszyklus

```
User Message
    │
    ▼
┌─────────────┐
│ Build Context│──── Memory Recall
└──────┬──────┘
       ▼
┌─────────────┐
│ LLM Inference│──── Streaming Response
└──────┬──────┘
       ▼
┌─────────────┐
│ Parse Output │──── Tool Calls / Text
└──────┬──────┘
       ▼
   Tool Calls?
   ├── Yes ──→ Execute Tools ──→ Loop Again
   └── No  ──→ Return Response
```

## Werkzeug-Dispatch

Wenn die LLM-Antwort Werkzeugaufrufe enthält, führt die Schleife folgende Schritte aus:

1. Validiert jeden Werkzeugaufruf gegen die Sicherheitsrichtlinie
2. Führt genehmigte Aufrufe aus (potenziell parallel)
3. Sammelt die Ergebnisse und gibt sie an das LLM zurück
4. Setzt die Schleife für den nächsten Inferenzschritt fort

## Streaming

PRX streamt LLM-Antworten Token für Token an den Client und puffert gleichzeitig zur Werkzeugaufruf-Erkennung. Die Streaming-Pipeline unterstützt:

- Echtzeit-Token-Weiterleitung an CLI- oder WebSocket-Clients
- Gegendruck-Behandlung bei langsamen Clients
- Ordnungsgemäßer Abbruch über Ctrl+C oder API-Signale

## Gedächtnisabruf

Vor jedem LLM-Aufruf ruft die Schleife relevanten Kontext aus dem Gedächtnissystem ab:

- Letzte Gesprächsrunden (gleitendes Fenster)
- Semantische Suchergebnisse aus dem Embedding-Speicher
- Angeheftete Fakten und Benutzerpräferenzen

## Kontextkompaktierung

Wenn das Gespräch das Kontextfenster des Modells überschreitet, löst die Schleife eine Kompaktierung aus:

1. Ältere Runden in eine komprimierte Darstellung zusammenfassen
2. Werkzeugaufruf-Ergebnisse beibehalten, die noch referenziert werden
3. System-Prompt und angeheftete Erinnerungen intakt halten

## Konfiguration

```toml
[agent.loop]
max_iterations = 50
parallel_tool_calls = true
compaction_threshold_tokens = 80000
compaction_strategy = "summarize"  # or "truncate"
```

## Verwandte Seiten

- [Agenten-Laufzeit](./runtime) -- Architekturübersicht
- [Sub-Agenten](./subagents) -- Erzeugung von Kind-Agenten
- [Gedächtnissystem](/de/prx/memory/) -- Gedächtnis-Backends und Abruf
