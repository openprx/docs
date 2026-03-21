---
title: Gedachtnis-Hygiene
description: Automatische Gedachtniswartung einschliesslich Komprimierung, Deduplizierung und Bereinigung veralteter Eintrage.
---

# Gedachtnis-Hygiene

Gedachtnis-Hygiene bezieht sich auf die automatischen Wartungsprozesse, die das Gedachtnissystem gesund, relevant und innerhalb von Grossenbudgets halten. PRX fuhrt Hygiene-Aufgaben periodisch durch, um Erinnerungen zu komprimieren, zu deduplizieren und zu bereinigen.

## Ubersicht

Ohne Hygiene wachsen Gedachtnisspeicher unbegrenzt und die Abrufqualitat verschlechtert sich, da irrelevante Eintrage Suchergebnisse verwassern. Das Hygiene-System adressiert dies durch:

- **Komprimierung** -- Gruppen verwandter Erinnerungen in kompakte Eintrage zusammenfassen
- **Deduplizierung** -- semantisch doppelte Eintrage zusammenfuhren
- **Bereinigung** -- veraltete oder wenig relevante Erinnerungen entfernen
- **Archivierung** -- alte Erinnerungen in Kaltspeicher verschieben

## Hygiene-Pipeline

```
Ausloser (Zeitplan oder Schwellenwert)
    │
    ▼
┌──────────────┐
│Deduplizierung│──── Fast-Duplikate zusammenfuhren
└──────┬───────┘
       ▼
┌──────────────┐
│ Komprimierung│──── Verwandte Eintrage zusammenfassen
└──────┬───────┘
       ▼
┌──────────────┐
│  Bereinigung │──── Veraltete Eintrage entfernen
└──────┬───────┘
       ▼
┌──────────────┐
│ Archivierung │──── In Kaltspeicher verschieben
└──────────────┘
```

## Konfiguration

```toml
[memory.hygiene]
enabled = true
schedule = "daily"  # "hourly" | "daily" | "weekly"
max_entries = 10000
compaction_threshold = 100  # Komprimieren wenn Gruppe diese Grosse uberschreitet
prune_after_days = 90
dedup_similarity_threshold = 0.95
```

## Manuelle Ausloser

Sie konnen die Hygiene manuell uber die CLI auslosen:

```bash
prx memory compact
prx memory prune --older-than 90d
prx memory stats
```

## Verwandte Seiten

- [Gedachtnissystem-Ubersicht](./)
- [Selbstevolution L1](/de/prx/self-evolution/l1-memory) -- Gedachtnis-Komprimierung in der Selbstevolution
