---
title: Plugin-Architektur
description: Technische Architektur der PRX WASM-Plugin-Laufzeit, einschliesslich der Host-Guest-Grenze und des Speichermodells.
---

# Plugin-Architektur

Das PRX-Plugin-System basiert auf einer WASM-Laufzeit, die eine sichere, portable Ausfuhrungsumgebung fur Drittanbieter-Code bietet. Diese Seite beschreibt die technische Architektur.

## Laufzeit

PRX verwendet die Wasmtime-Laufzeit zur Ausfuhrung von WASM-Plugins. Jede Plugin-Instanz lauft in ihrem eigenen WASM-Store mit isoliertem linearem Speicher.

```
┌──────────────────────────────┐
│         PRX Host             │
│                              │
│  ┌────────────────────────┐  │
│  │    WASM Runtime         │  │
│  │  ┌──────┐  ┌──────┐   │  │
│  │  │Plugin│  │Plugin│   │  │
│  │  │  A   │  │  B   │   │  │
│  │  └──┬───┘  └──┬───┘   │  │
│  │     │         │        │  │
│  │  Host Functions API    │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

## Host-Guest-Grenze

Plugins kommunizieren mit dem Host uber einen definierten Satz von Host-Funktionen. Die Grenze erzwingt:

- **Typsicherheit** -- alle Funktionsparameter werden validiert
- **Ressourcenlimits** -- Speicher- und CPU-Nutzung werden begrenzt
- **Berechtigungsprufungen** -- jeder Host-Funktionsaufruf wird gegen das Berechtigungsmanifest des Plugins autorisiert

## Speichermodell

Jedes Plugin hat seinen eigenen linearen Speicherbereich (Standard 64 MB). Daten werden zwischen Host und Guest uber gemeinsame Speicherpuffer mit expliziter Serialisierung ausgetauscht.

## Plugin-Lebenszyklus

1. **Laden** -- WASM-Binary wird geladen und validiert
2. **Initialisieren** -- die `init()`-Funktion des Plugins wird mit der Konfiguration aufgerufen
3. **Bereit** -- das Plugin registriert seine Fahigkeiten (Werkzeuge, Kanale usw.)
4. **Ausfuhren** -- der Host ruft Plugin-Funktionen nach Bedarf auf
5. **Herunterfahren** -- die `shutdown()`-Funktion des Plugins wird zur Bereinigung aufgerufen

## Verwandte Seiten

- [Plugin-System-Ubersicht](./)
- [Host-Funktionen](./host-functions)
- [Entwicklerhandbuch](./developer-guide)
