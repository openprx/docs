---
title: Evolutions-Pipeline
description: Die 4-stufige Selbstevolutions-Pipeline in PRX -- Gate, Analyse, Bewertung, Ausfuhrung.
---

# Evolutions-Pipeline

Jeder Selbstevolutions-Vorschlag in PRX durchlauft eine 4-stufige Pipeline: Gate, Analyse, Bewertung und Ausfuhrung. Diese Pipeline stellt sicher, dass Anderungen wohldurchdacht, sicher und reversibel sind.

## Pipeline-Stufen

```
┌────────┐    ┌─────────┐    ┌────────┐    ┌─────────┐
│  Gate  │───►│ Analyse │───►│Bewertg.│───►│Ausfuhrg.│
└────────┘    └─────────┘    └────────┘    └─────────┘
```

### 1. Gate

Die Gate-Stufe bestimmt, ob ein Evolutionszyklus ausgelost werden soll. Sie pruft:

- Zeitplan-Bedingungen (zeitbasierte Ausloser)
- Datensuffizienz (genugend Stichproben fur die Analyse)
- Systemgesundheit (keine aktiven Vorfalle)
- Ratenlimits (maximale Anderungen pro Zeitfenster)

### 2. Analyse

Die Analyse-Stufe untersucht gesammelte Daten, um Verbesserungsmoglichkeiten zu identifizieren:

- Aggregation von Leistungsmetriken
- Mustererkennung und Anomalie-Identifikation
- Vergleich mit Baselines
- Vorschlagsgenerierung mit erwarteten Auswirkungsschatzungen

### 3. Bewertung

Die Bewertungsstufe evaluiert Vorschlage auf Sicherheit und Korrektheit:

- Integritatsprufungen gegen vordefinierte Invarianten
- Risikobewertung-Scoring
- Konflikterkennung mit bestehenden Richtlinien
- Genehmigungs-Routing (automatisch fur L1, manuell fur L3)

### 4. Ausfuhrung

Die Ausfuhrungsstufe wendet genehmigte Anderungen an:

- Rollback-Snapshot erstellen
- Anderung atomar anwenden
- Auf Regressionssignale uberwachen
- Automatisches Rollback, wenn Integritatsprufungen fehlschlagen

## Konfiguration

```toml
[self_evolution.pipeline]
gate_check_interval_secs = 3600
min_data_points = 100
health_check_url = "http://localhost:3120/health"
```

## Verwandte Seiten

- [Selbstevolutions-Ubersicht](./)
- [Sicherheit & Rollback](./safety)
