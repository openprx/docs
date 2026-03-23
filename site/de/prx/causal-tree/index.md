---
title: Kausaler Baum-Engine
description: Uberblick uber die PRX Kausale Baum-Engine (CTE) — spekulative Multi-Branch-Vorhersage mit Probe, Bewertung und automatischem Schutzschalter.
---

# Kausaler Baum-Engine

Die Kausale Baum-Engine (Causal Tree Engine, CTE) ist ein spekulatives Ausfuhrungssystem, das mehrere Antwortstrategien parallel bewertet, bevor die beste bestatigt wird. Sie integriert sich in die PRX-Agenten-Pipeline zwischen Intent-Klassifizierung und LLM-Aufruf.

> **Standardmassig deaktiviert.** Die CTE ist ein Opt-in-Feature. Setzen Sie `causal_tree.enabled = true` in Ihrer Konfigurationsdatei, um sie zu aktivieren.

## Arbeitsablauf

```text
Snapshot → Expansion → Probe → Bewertung → Auswahl → Feedback
```

1. **Snapshot** — Erfasst den aktuellen kausalen Zustand (Sitzungskontext, Budget, Einschrankungen)
2. **Expansion** — Generiert Kandidaten-Branches (direkte Antwort, Tool-Nutzung, Sub-Agent-Delegation)
3. **Probe** — Fuhrt leichtgewichtige "Probelaufe" vielversprechender Branches im Nur-Lese-Modus durch
4. **Bewertung** — Rankt Branches nach einem gewichteten Kompositwert aus Konfidenz, Kosten und Latenz
5. **Auswahl** — Bestatigt den hochstbewerteten Branch bei Erreichen des Schwellenwerts; andernfalls Fallback
6. **Feedback** — Protokolliert die Entscheidung fur Observability und zukunftiges Lernen

## Wann CTE aktivieren

| Szenario | Empfehlung |
|----------|-----------|
| Einfache Q&A, lockerer Chat | CTE **deaktiviert** lassen |
| Multi-Step-Tool-Workflows | CTE aktivieren |
| Autonome Agenten-Tasks (Xin / Selbstentwicklung) | CTE aktivieren |
| Kostenempfindliche Deployments | CTE aktivieren mit strengem `extra_token_ratio_limit` |

## Schnellstart

Fugen Sie Ihrer PRX-Konfigurationsdatei (`~/.openprx/config.toml`) hinzu:

```toml
[causal_tree]
enabled = true
```

Alle anderen Parameter haben sinnvolle Standardwerte. Siehe [Konfigurationsreferenz](./configuration) fur die vollstandige Parameterliste.

## Schutzschalter

- Nach `circuit_breaker_threshold` aufeinanderfolgenden Fehlern (Standard: 5) lost die CTE aus und alle Anfragen umgehen sie
- Nach `circuit_breaker_cooldown_secs` (Standard: 60s) erlaubt der Schutzschalter einen Wiederholungsversuch
- Ein einzelner erfolgreicher Lauf setzt den Fehlerzahler zuruck

## Metriken

| Metrik | Beschreibung |
|--------|-------------|
| `hit_at_1_ratio` | Anteil der Laufe, bei denen der erstplatzierte Branch korrekt war |
| `hit_at_3_ratio` | Anteil, bei dem der korrekte Branch in den Top-3 war |
| `wasted_speculation_ratio` | Durchgefuhrte aber nicht genutzte Proben |
| `commit_success_rate` | Erfolgsrate der Bestatigungen |
| `avg_extra_latency_ms` | Durchschnittliche zusatzliche Latenz pro Lauf |
| `circuit_breaker_trips` | Anzahl der Schutzschalter-Auslosungen |

## Verwandte Seiten

- [Konfigurationsreferenz](./configuration)
- [Agenten-Runtime](/de/prx/agent/runtime)
- [LLM-Router](/de/prx/router/)
- [Observability](/de/prx/observability/)
