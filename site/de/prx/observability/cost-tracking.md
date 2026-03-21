---
title: Kostenverfolgung
description: Token-Verbrauch, API-Kosten und Budgetwarnungen uber alle LLM-Anbieter in PRX verfolgen.
---

# Kostenverfolgung

PRX enthalt ein integriertes Kostenverfolgungssystem, das den Token-Verbrauch und die API-Ausgaben uber alle LLM-Anbieter uberwacht. Der `CostTracker` akkumuliert den Verbrauch pro Anfrage, pro Sitzung und pro Anbieter -- und gibt Ihnen volle Transparenz daruber, wie Ihre Agenten API-Ressourcen nutzen.

## Ubersicht

Jede LLM-Anfrage in PRX erzeugt einen `TokenUsage`-Datensatz, der Eingabe-Tokens, Ausgabe-Tokens und die zugehorigen Kosten enthalt. Diese Datensatze werden vom `CostTracker` aggregiert und konnen fur Berichte, Budgetdurchsetzung und Anomalieerkennung abgefragt werden.

```
LLM-Anfrage
    │
    ├── Anbieter gibt Nutzungsmetadaten zuruck
    │   (input_tokens, output_tokens, Cache-Treffer)
    │
    ▼
TokenUsage-Datensatz erstellt
    │
    ├── Im CostTracker akkumuliert
    │   ├── Aufschlusselung pro Anfrage
    │   ├── Summen pro Sitzung
    │   ├── Summen pro Anbieter
    │   └── Summen pro Modell
    │
    ├── Budgetprufung (wenn Limits konfiguriert)
    │   ├── Unter Budget → weiter
    │   └── Uber Budget → Warnung / Hartstopp
    │
    └── In Observability-Pipeline geschrieben
        (Metriken, Logs, Tracing-Spans)
```

## Konfiguration

Kostenverfolgung in `config.toml` aktivieren und konfigurieren:

```toml
[cost]
enabled = true

# Wahrung fur Anzeigezwecke (beeinflusst nicht die Berechnungen).
currency = "USD"

# Wie oft akkumulierte Kosten in persistenten Speicher geschrieben werden.
flush_interval_secs = 60

# Kostendaten uber Neustarts hinweg persistieren.
persist = true
persist_path = "~/.local/share/openprx/cost.db"
```

### Budgetlimits

Ausgabenlimits festlegen, um unkontrollierte Kosten zu verhindern:

```toml
[cost.budget]
# Tagliches Ausgabenlimit uber alle Anbieter.
daily_limit = 10.00

# Monatliches Ausgabenlimit.
monthly_limit = 200.00

# Pro-Sitzung-Limit (wird beim Start einer neuen Sitzung zuruckgesetzt).
session_limit = 2.00

# Aktion bei Erreichen eines Limits: "warn" oder "stop".
# "warn" protokolliert eine Warnung, lasst aber Anfragen weiter zu.
# "stop" blockiert weitere LLM-Anfragen bis zum Zurucksetzen der Periode.
on_limit = "warn"
```

### Pro-Anbieter-Limits

Budgetlimits fur bestimmte Anbieter uberschreiben:

```toml
[cost.budget.providers.openai]
daily_limit = 5.00
monthly_limit = 100.00

[cost.budget.providers.anthropic]
daily_limit = 8.00
monthly_limit = 150.00
```

## TokenUsage-Struktur

Jede LLM-Anfrage erzeugt einen `TokenUsage`-Datensatz:

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `input_tokens` | u64 | Anzahl der Tokens im Prompt (System + Benutzer + Kontext) |
| `output_tokens` | u64 | Anzahl der Tokens in der Modellantwort |
| `cache_read_tokens` | u64 | Tokens aus dem Anbieter-Cache bedient (Anthropic Prompt-Caching) |
| `cache_write_tokens` | u64 | Tokens in den Anbieter-Cache geschrieben |
| `total_tokens` | u64 | `input_tokens + output_tokens` |
| `cost` | f64 | Geschatzte Kosten in konfigurierter Wahrung |
| `provider` | string | Anbietername (z.B. "openai", "anthropic") |
| `model` | string | Modell-Identifikator (z.B. "gpt-4o", "claude-sonnet-4-20250514") |
| `timestamp` | datetime | Zeitpunkt der Anfrage |
| `session_id` | string | Agentensitzung, die die Anfrage erzeugt hat |

## CostTracker

Der `CostTracker` ist der zentrale Aggregationspunkt fur allen Token-Verbrauch. Er halt laufende Summen nach Anbieter, nach Modell, pro Sitzung, taglich (wird um Mitternacht UTC zuruckgesetzt) und monatlich (wird am 1. zuruckgesetzt). Der Tracker ist threadsicher und wird nach jeder LLM-Antwort aktualisiert.

## Preisdaten

PRX pflegt eine integrierte Preistabelle fur gangige Anbieter und Modelle. Preise sind pro Million Tokens definiert:

| Anbieter | Modell | Eingabe (pro 1M) | Ausgabe (pro 1M) |
|----------|--------|------------------|------------------|
| OpenAI | gpt-4o | $2,50 | $10,00 |
| OpenAI | gpt-4o-mini | $0,15 | $0,60 |
| OpenAI | o3 | $10,00 | $40,00 |
| Anthropic | claude-sonnet-4-20250514 | $3,00 | $15,00 |
| Anthropic | claude-haiku-35-20241022 | $0,80 | $4,00 |
| Anthropic | claude-opus-4-20250514 | $15,00 | $75,00 |
| Google | gemini-2.0-flash | $0,075 | $0,30 |
| DeepSeek | deepseek-chat | $0,14 | $0,28 |

### Benutzerdefinierte Preise

Preise fur Modelle uberschreiben oder hinzufugen, die nicht in der integrierten Tabelle enthalten sind:

```toml
[cost.pricing."openai/gpt-4o"]
input_per_million = 2.50
output_per_million = 10.00

[cost.pricing."custom/my-model"]
input_per_million = 1.00
output_per_million = 3.00
```

Fur selbst gehostete Modelle (Ollama, vLLM), bei denen API-Aufrufe kostenlos sind, Preise auf Null setzen:

```toml
[cost.pricing."ollama/llama3"]
input_per_million = 0.0
output_per_million = 0.0
```

## Nutzungsberichte

### CLI-Befehle

```bash
# Aktuelle Sitzungskostenzusammenfassung anzeigen
prx cost

# Tagliche Aufschlusselung anzeigen
prx cost --period daily

# Monatliche Aufschlusselung nach Anbieter anzeigen
prx cost --period monthly --group-by provider

# Kosten fur einen bestimmten Zeitraum anzeigen
prx cost --from 2026-03-01 --to 2026-03-15

# Als CSV exportieren
prx cost --period monthly --format csv > costs.csv

# Als JSON exportieren (fur programmatische Nutzung)
prx cost --period daily --format json
```

### Beispielausgabe

```
PRX-Kostenbericht (2026-03-21)
════════════════════════════════════════════════════
Anbieter     Modell                   Tokens (ein/aus)   Kosten
─────────────────────────────────────────────────────────────
anthropic    claude-sonnet-4-20250514      45,2K / 12,8K    $0,33
openai       gpt-4o                  22,1K / 8,4K     $0,14
openai       gpt-4o-mini              8,3K / 3,1K     $0,00
─────────────────────────────────────────────────────────────
Gesamt                               75,6K / 24,3K    $0,47

Budgetstatus:
  Sitzung:  $0,47 / $2,00 (23,5%)
  Taglich:  $3,82 / $10,00 (38,2%)
  Monatlich: $42,15 / $200,00 (21,1%)
```

## Budgetwarnungen

Wenn die Kosten sich einem Budgetlimit nahern, ergreift PRX Massnahmen basierend auf der `on_limit`-Einstellung:

| Schwellenwert | `on_limit = "warn"` | `on_limit = "stop"` |
|---------------|--------------------|--------------------|
| 80% des Limits | Warnung protokollieren | Warnung protokollieren |
| 100% des Limits | Fehler protokollieren, fortfahren | LLM-Anfragen blockieren, Benutzer benachrichtigen |
| Limit-Zurucksetzung (neuer Tag/Monat) | Zahler zurucksetzen | Zahler zurucksetzen, Anfragen freigeben |

Budgetwarnungen werden auch als Observability-Ereignisse emittiert. Wenn Prometheus-Metriken aktiviert sind, werden die folgenden Gauges exportiert:

```
prx_cost_daily_total{currency="USD"} 3.82
prx_cost_monthly_total{currency="USD"} 42.15
prx_cost_session_total{currency="USD"} 0.47
prx_cost_budget_daily_remaining{currency="USD"} 6.18
prx_cost_budget_monthly_remaining{currency="USD"} 157.85
```

## Integration mit Observability

Kostendaten integrieren sich in den PRX-Observability-Stack:

- **Prometheus** -- Token-Zahler und Kosten-Gauges pro Anbieter/Modell
- **OpenTelemetry** -- `prx.tokens.input`, `prx.tokens.output`, `prx.cost` Span-Attribute
- **Logs** -- Kosten pro Anfrage auf DEBUG-Level protokolliert, Budgetwarnungen auf WARN-Level

## Sicherheitshinweise

- Kostendaten konnen Nutzungsmuster offenlegen. Beschranken Sie den Zugriff auf Kostenberichte in Multi-User-Bereitstellungen.
- Die persistente Kostendatenbank (`cost.db`) enthalt Nutzungsverlauf. Beziehen Sie sie in Ihre Backup-Strategie ein.
- Budgetlimits werden lokal durchgesetzt. Sie interagieren nicht mit anbieterseitigen Ausgabenlimits. Konfigurieren Sie beide fur Tiefenverteidigung.

## Verwandte Seiten

- [Observability-Ubersicht](/de/prx/observability/)
- [Prometheus-Metriken](/de/prx/observability/prometheus)
- [OpenTelemetry](/de/prx/observability/opentelemetry)
- [Anbieter-Konfiguration](/de/prx/providers/)
