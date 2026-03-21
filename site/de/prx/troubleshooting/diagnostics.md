---
title: Diagnostik
description: Detaillierte Diagnoseverfahren und Werkzeuge zum Debuggen von PRX-Problemen.
---

# Diagnostik

Diese Seite behandelt erweiterte Diagnoseverfahren zur Untersuchung von PRX-Problemen, die durch die grundlegenden Fehlerbehebungsschritte nicht gelost werden.

## Diagnosebefehle

### prx doctor

Die umfassende Gesundheitsprufung:

```bash
prx doctor
```

Die Ausgabe umfasst:
- Konfigurationsvalidierungsergebnisse
- Anbieter-Konnektivitatstests
- Systemabhangigkeitsprufungen
- Zusammenfassung der Ressourcennutzung

### prx debug

Debug-Level-Logging fur detaillierte Operationsspuren aktivieren:

```bash
PRX_LOG=debug prx daemon
```

Oder in der Konfiguration setzen:

```toml
[observability]
log_level = "debug"
```

### prx info

Systeminformationen anzeigen:

```bash
prx info
```

Zeigt:
- PRX-Version und Build-Informationen
- Betriebssystem und Architektur
- Konfigurierte Anbieter und deren Status
- Gedachtnis-Backend-Typ und -Grosse
- Plugin-Anzahl und -Status

## Log-Analyse

PRX-Logs sind strukturiertes JSON (wenn `log_format = "json"`). Wichtige Felder:

| Feld | Beschreibung |
|------|-------------|
| `level` | Log-Level (debug, info, warn, error) |
| `target` | Rust-Modulpfad |
| `session_id` | Zugehorige Sitzungs-ID |
| `provider` | Beteiligter LLM-Anbieter |
| `duration_ms` | Operationsdauer |
| `error` | Fehlerdetails (falls zutreffend) |

## Netzwerkdiagnostik

Anbieter-Konnektivitat testen:

```bash
# Anthropic-API testen
prx provider test anthropic

# Alle konfigurierten Anbieter testen
prx provider test --all

# Netzwerk aus der Sandbox prufen
prx sandbox test-network
```

## Leistungsprofiling

Den Metriken-Endpunkt aktivieren und Prometheus/Grafana fur die Leistungsanalyse verwenden:

```toml
[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"
```

Wichtige zu uberwachende Metriken:
- `prx_llm_request_duration_seconds` -- LLM-Latenz
- `prx_sessions_active` -- gleichzeitige Sitzungen
- `prx_memory_usage_bytes` -- Speicherverbrauch

## Verwandte Seiten

- [Fehlerbehebungs-Ubersicht](./)
- [Observability](/de/prx/observability/)
- [Prometheus-Metriken](/de/prx/observability/prometheus)
