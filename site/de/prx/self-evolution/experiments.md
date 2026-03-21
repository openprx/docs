---
title: Experimente & Eignungsbewertung
description: A/B-Experiment-Tracking und Eignungsbewertung zur Messung von Selbstevolutions-Verbesserungen in PRX.
---

# Experimente & Eignungsbewertung

Das Selbstevolutions-System in PRX verwendet kontrollierte Experimente und Eignungsbewertung, um zu messen, ob vorgeschlagene Anderungen die Agentenleistung tatsachlich verbessern. Jeder Evolutionsvorschlag uber L1 wird durch ein A/B-Experiment getestet, bevor er dauerhaft ubernommen wird.

## Ubersicht

Das Experimentsystem bietet:

- **A/B-Tests** -- Kontroll- und Behandlungsvarianten nebeneinander ausfuhren
- **Eignungsbewertung** -- Agentenleistung mit einem zusammengesetzten Score quantifizieren
- **Statistische Validierung** -- sicherstellen, dass Verbesserungen signifikant sind, kein zufalliges Rauschen
- **Automatische Konvergenz** -- den Gewinner ubernehmen und den Verlierer zuruckziehen, wenn die Ergebnisse eindeutig sind

## Experiment-Lebenszyklus

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐
│ Erstellen│───►│ Ausfuhren│───►│Evaluieren│───►│Konvergenz │
│          │    │          │    │          │    │           │
│ Varianten│    │ Traffic  │    │ Eignung  │    │ Ubernehmen│
│ definieren│   │ aufteilen│    │vergleichen│   │od. ablehnen│
└──────────┘    └──────────┘    └──────────┘    └───────────┘
```

### 1. Erstellen

Ein Experiment wird erstellt, wenn die Evolutions-Pipeline einen Vorschlag generiert:

- Eine **Kontroll**-Variante, die die aktuelle Konfiguration reprasentiert
- Eine **Behandlungs**-Variante, die die vorgeschlagene Anderung reprasentiert
- Experiment-Parameter: Dauer, Stichprobengrosse, Traffic-Aufteilung

### 2. Ausfuhren

Wahrend des Experiments werden Sitzungen Varianten zugewiesen:

- Sitzungen werden zufallig basierend auf dem Traffic-Aufteilungsverhaltnis zugewiesen
- Jede Sitzung lauft vollstandig unter einer Variante (kein Wechsel wahrend der Sitzung)
- Beide Varianten werden fur denselben Satz von Eignungsmetriken uberwacht

### 3. Evaluieren

Nach Erreichen der Mindestdauer oder Stichprobengrosse:

- Eignungs-Scores werden fur beide Varianten berechnet
- Statistische Signifikanz wird getestet (Standard: 95% Konfidenz)
- Die Effektgrosse wird berechnet, um die praktische Signifikanz zu messen

### 4. Konvergenz

Basierend auf den Evaluierungsergebnissen:

- **Behandlung gewinnt** -- die vorgeschlagene Anderung wird zur Standardkonfiguration ubernommen
- **Kontrolle gewinnt** -- die vorgeschlagene Anderung wird abgelehnt; die Kontrolle bleibt bestehen
- **Nicht eindeutig** -- das Experiment wird verlangert oder die Anderung wird zuruckgestellt

## Konfiguration

```toml
[self_evolution.experiments]
enabled = true
default_duration_hours = 168       # 1 Woche Standard
min_sample_size = 100              # Mindestsitzungen pro Variante
traffic_split = 0.5                # 50/50-Aufteilung zwischen Kontrolle und Behandlung
confidence_level = 0.95            # 95% statistische Konfidenz erforderlich
min_effect_size = 0.02             # Mindestens 2% Verbesserung zur Akzeptanz

[self_evolution.experiments.auto_converge]
enabled = true
check_interval_hours = 24          # Ergebnisse alle 24 Stunden evaluieren
max_duration_hours = 720           # Konvergenz nach 30 Tagen erzwingen
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `true` | Experimentsystem aktivieren oder deaktivieren |
| `default_duration_hours` | `u64` | `168` | Standard-Experimentdauer in Stunden (1 Woche) |
| `min_sample_size` | `usize` | `100` | Mindestsitzungen pro Variante vor der Evaluierung |
| `traffic_split` | `f64` | `0.5` | Anteil der Sitzungen, die der Behandlungsvariante zugewiesen werden (0,0--1,0) |
| `confidence_level` | `f64` | `0.95` | Erforderliches statistisches Konfidenzniveau |
| `min_effect_size` | `f64` | `0.02` | Minimale Eignungsverbesserung (Anteil) zur Akzeptanz der Behandlung |
| `auto_converge.enabled` | `bool` | `true` | Automatisch ubernehmen/ablehnen, wenn Ergebnisse eindeutig sind |
| `auto_converge.check_interval_hours` | `u64` | `24` | Wie oft die Experimentergebnisse gepruft werden |
| `auto_converge.max_duration_hours` | `u64` | `720` | Konvergenz nach dieser Dauer erzwingen (Standard 30 Tage) |

## Struktur des Experimentdatensatzes

Jedes Experiment wird als strukturierter Datensatz verfolgt:

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `experiment_id` | `String` | Eindeutiger Bezeichner (UUIDv7) |
| `decision_id` | `String` | Verknupfung zur auslosenden Entscheidung |
| `layer` | `Layer` | Evolutions-Schicht: `L1`, `L2` oder `L3` |
| `status` | `Status` | `running`, `evaluating`, `converged`, `cancelled` |
| `created_at` | `DateTime<Utc>` | Wann das Experiment erstellt wurde |
| `converged_at` | `Option<DateTime<Utc>>` | Wann das Experiment abgeschlossen wurde |
| `control` | `Variant` | Beschreibung der Kontroll-Variante |
| `treatment` | `Variant` | Beschreibung der Behandlungs-Variante |
| `control_sessions` | `usize` | Anzahl der Sitzungen, die der Kontrolle zugewiesen wurden |
| `treatment_sessions` | `usize` | Anzahl der Sitzungen, die der Behandlung zugewiesen wurden |
| `control_fitness` | `FitnessScore` | Aggregierte Eignung fur die Kontroll-Variante |
| `treatment_fitness` | `FitnessScore` | Aggregierte Eignung fur die Behandlungs-Variante |
| `p_value` | `Option<f64>` | Statistische Signifikanz (niedriger = signifikanter) |
| `winner` | `Option<String>` | `"control"`, `"treatment"` oder `null` wenn nicht eindeutig |

## Eignungsbewertung

Die Eignungsbewertung quantifiziert die Agentenleistung uber mehrere Dimensionen. Der zusammengesetzte Eignungsscore wird verwendet, um Experiment-Varianten zu vergleichen und den Evolutionsfortschritt im Laufe der Zeit zu verfolgen.

### Eignungsdimensionen

| Dimension | Gewicht | Beschreibung | Messmethode |
|-----------|---------|-------------|-------------|
| `response_relevance` | 0,30 | Wie relevant die Agentenantworten auf Benutzeranfragen sind | LLM-als-Richter-Bewertung |
| `task_completion` | 0,25 | Anteil der erfolgreich abgeschlossenen Aufgaben | Werkzeugaufruf-Erfolgsrate |
| `response_latency` | 0,15 | Zeit von der Benutzernachricht bis zum ersten Antwort-Token | Perzentil-basiert (p50, p95) |
| `token_efficiency` | 0,10 | Verbrauchte Tokens pro erfolgreicher Aufgabe | Niedriger ist besser |
| `memory_precision` | 0,10 | Relevanz der abgerufenen Erinnerungen | Abruf-Relevanz-Bewertung |
| `user_satisfaction` | 0,10 | Explizite Benutzer-Feedback-Signale | Daumen hoch/runter, Korrekturen |

### Zusammengesetzter Score

Der zusammengesetzte Eignungsscore ist eine gewichtete Summe:

```
fitness = sum(dimension_score * dimension_weight)
```

Jede Dimension wird vor der Gewichtung auf einen Bereich von 0,0--1,0 normalisiert. Der zusammengesetzte Score liegt ebenfalls im Bereich 0,0--1,0, wobei hoher besser ist.

### Eignungs-Konfiguration

```toml
[self_evolution.fitness]
evaluation_window_hours = 24       # Metriken uber dieses Fenster aggregieren
min_sessions_for_score = 10        # Mindestens 10 Sitzungen fur einen gultigen Score erfordern

[self_evolution.fitness.weights]
response_relevance = 0.30
task_completion = 0.25
response_latency = 0.15
token_efficiency = 0.10
memory_precision = 0.10
user_satisfaction = 0.10

[self_evolution.fitness.thresholds]
minimum_acceptable = 0.50          # Eignung unter diesem Wert lost eine Warnung aus
regression_delta = 0.05            # Eignungsabfall > 5% lost Rollback aus
```

### Eignungs-Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `evaluation_window_hours` | `u64` | `24` | Zeitfenster fur die Aggregation von Eignungsmetriken |
| `min_sessions_for_score` | `usize` | `10` | Mindestsitzungen zur Berechnung eines gultigen Scores |
| `weights.*` | `f64` | *(siehe Tabelle oben)* | Gewicht fur jede Eignungsdimension (muss sich auf 1,0 summieren) |
| `thresholds.minimum_acceptable` | `f64` | `0,50` | Warnschwelle fur niedrige Eignung |
| `thresholds.regression_delta` | `f64` | `0,05` | Maximaler Eignungsabfall vor automatischem Rollback |

## CLI-Befehle

```bash
# Aktive Experimente auflisten
prx evolution experiments --status running

# Ein bestimmtes Experiment anzeigen
prx evolution experiments --id <experiment_id>

# Experimentergebnisse mit Eignungsaufschlusselung anzeigen
prx evolution experiments --id <experiment_id> --details

# Ein laufendes Experiment abbrechen (kehrt zur Kontrolle zuruck)
prx evolution experiments cancel <experiment_id>

# Aktuellen Eignungsscore anzeigen
prx evolution fitness

# Eignungsverlauf uber die Zeit anzeigen
prx evolution fitness --history --last 30d

# Eignungsaufschlusselung nach Dimension anzeigen
prx evolution fitness --breakdown
```

### Beispiel-Eignungsausgabe

```
Current Fitness Score: 0.74

Dimension            Score   Weight  Contribution
response_relevance   0.82    0.30    0.246
task_completion      0.78    0.25    0.195
response_latency     0.69    0.15    0.104
token_efficiency     0.65    0.10    0.065
memory_precision     0.71    0.10    0.071
user_satisfaction    0.60    0.10    0.060

Trend (last 7 days): +0.03 (improving)
```

## Experiment-Beispiele

### L2-Prompt-Optimierung

Ein typisches L2-Experiment testet eine System-Prompt-Anderung:

- **Kontrolle**: aktueller System-Prompt (320 Tokens)
- **Behandlung**: verfeinerter System-Prompt (272 Tokens, 15% kurzer)
- **Hypothese**: kurzerer Prompt gibt Kontextfenster frei, verbessert Antwortrelevanz
- **Dauer**: 7 Tage, 100 Sitzungen pro Variante
- **Ergebnis**: Behandlungs-Eignung 0,75 vs. Kontroll-Eignung 0,72 (p = 0,03), Behandlung ubernommen

### L3-Strategieanderung

Ein L3-Experiment testet eine Routing-Richtlinien-Anderung:

- **Kontrolle**: alle Coding-Aufgaben an Claude Opus routen
- **Behandlung**: einfache Coding-Aufgaben an Claude Sonnet, komplexe an Opus routen
- **Hypothese**: kosteneffizientes Routing ohne Qualitatsverlust
- **Dauer**: 14 Tage, 200 Sitzungen pro Variante
- **Ergebnis**: Behandlungs-Eignung 0,73 vs. Kontroll-Eignung 0,74 (p = 0,42), nicht eindeutig -- Experiment verlangert

## Statistische Methoden

Das Experimentsystem verwendet die folgenden statistischen Methoden:

- **Zwei-Stichproben-t-Test** zum Vergleich der mittleren Eignungswerte zwischen Varianten
- **Mann-Whitney-U-Test** als nicht-parametrische Alternative, wenn Eignungsverteilungen schief sind
- **Bonferroni-Korrektur** wenn mehrere Eignungsdimensionen gleichzeitig verglichen werden
- **Sequenzielle Analyse** mit Alpha-Spending, um fruhes Stoppen zu ermoglichen, wenn Ergebnisse eindeutig signifikant sind

## Einschrankungen

- Experimente erfordern ausreichendes Sitzungsvolumen; Bereitstellungen mit niedrigem Traffic konnen Wochen brauchen, um Signifikanz zu erreichen
- Benutzerzufriedenheits-Signale hangen von explizitem Feedback ab, das sparlich sein kann
- LLM-als-Richter-Bewertung fur Antwortrelevanz fugt der Evaluierungspipeline Latenz und Kosten hinzu
- Es kann nur ein Experiment pro Evolutions-Schicht gleichzeitig laufen, um Konfundierung zu vermeiden
- Eignungs-Scores sind relativ zur spezifischen Bereitstellung; sie sind nicht zwischen verschiedenen PRX-Instanzen vergleichbar

## Verwandte Seiten

- [Selbstevolutions-Ubersicht](./)
- [Entscheidungsprotokoll](./decision-log) -- Entscheidungen, die Experimente auslosen
- [Evolutions-Pipeline](./pipeline) -- die Pipeline, die Vorschlage generiert
- [Sicherheit & Rollback](./safety) -- automatisches Rollback bei Regression
