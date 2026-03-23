---
title: CTE-Konfigurationsreferenz
description: Vollstandige Konfigurationsreferenz fur die PRX Kausale Baum-Engine.
---

# CTE-Konfigurationsreferenz

Die Kausale Baum-Engine wird uber den Abschnitt `[causal_tree]` in Ihrer PRX-Konfigurationsdatei konfiguriert.

> **Die CTE ist standardmassig deaktiviert.** Alle Parameter unten gelten nur, wenn `causal_tree.enabled = true`.

## Vollstandiges Beispiel

```toml
[causal_tree]
enabled = true

w_confidence = 0.50
w_cost = 0.25
w_latency = 0.25

write_decision_log = true
write_metrics = true

[causal_tree.policy]
max_branches = 3
commit_threshold = 0.62
extra_token_ratio_limit = 0.35
extra_latency_budget_ms = 300
rehearsal_timeout_ms = 5000
default_side_effect_mode = "read_only"
circuit_breaker_threshold = 5
circuit_breaker_cooldown_secs = 60
```

## Parameterreferenz

### Parameter der obersten Ebene

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `enabled` | bool | `false` | Hauptschalter. Bei `false` wird die CTE vollstandig umgangen. |
| `w_confidence` | f32 | `0.50` | Bewertungsgewicht fur die Konfidenz-Dimension. |
| `w_cost` | f32 | `0.25` | Bewertungsgewicht fur die Kostenstrafe. |
| `w_latency` | f32 | `0.25` | Bewertungsgewicht fur die Latenzstrafe. |
| `write_decision_log` | bool | `true` | Bei Aktivierung wird fur jede CTE-Entscheidung ein strukturiertes Log ausgegeben. |
| `write_metrics` | bool | `true` | Bei Aktivierung werden CTE-Leistungsmetriken erfasst. |

### Richtlinienparameter (`[causal_tree.policy]`)

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `max_branches` | usize | `3` | Maximale Anzahl von Kandidaten-Branches pro Anfrage. |
| `commit_threshold` | f32 | `0.62` | Minimaler Kompositwert zum Bestatigen eines Branches. |
| `extra_token_ratio_limit` | f32 | `0.35` | Maximales Token-Verhaltnis des CTE-Overheads zur Basisanfrage. |
| `extra_latency_budget_ms` | u64 | `300` | Maximale zusatzliche Latenz der CTE-Pipeline (Millisekunden). |
| `rehearsal_timeout_ms` | u64 | `5000` | Timeout fur einen einzelnen Probelauf (Millisekunden). |
| `default_side_effect_mode` | string | `"read_only"` | Nebeneffekt-Modus. `"read_only"` / `"dry_run"` / `"live"`. |
| `circuit_breaker_threshold` | u32 | `5` | Aufeinanderfolgende Fehler bis zur Auslosung des Schutzschalters. |
| `circuit_breaker_cooldown_secs` | u64 | `60` | Abkuhlzeit des Schutzschalters (Sekunden). |

## Minimale Konfiguration

```toml
[causal_tree]
enabled = true
```

## Verwandte Seiten

- [Kausale Baum-Engine Uberblick](./)
- [Vollstandige Konfigurationsreferenz](/de/prx/config/reference)
