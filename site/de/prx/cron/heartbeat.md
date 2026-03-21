---
title: Heartbeat
description: Periodische Gesundheitsprufungen und Statusberichte im PRX-Cron-System.
---

# Heartbeat

Der Heartbeat ist eine periodische Gesundheitsprufung, die den Betriebsstatus des PRX-Daemons uberwacht. Er lauft in einem konfigurierbaren Intervall (Standard: 30 Sekunden) und berichtet uber den Systemzustand.

## Was gepruft wird

- **Daemon-Prozess** -- ist der Daemon reaktionsfahig
- **Anbieter-Konnektivitat** -- sind die konfigurierten LLM-Anbieter erreichbar
- **Speicherverbrauch** -- liegt der Speicherverbrauch innerhalb der Grenzen
- **Festplattenplatz** -- ist ausreichend Festplattenplatz fur die Datenspeicherung verfugbar
- **Aktive Sitzungen** -- Anzahl und Status laufender Agentensitzungen

## Gesundheitsstatus

Der Heartbeat veroffentlicht den Status uber:

- Log-Eintrage auf Debug-Level
- Den `/health`-API-Endpunkt
- Prometheus-Metriken (wenn aktiviert)
- Optionale externe Gesundheitsprufungs-URL

## Konfiguration

```toml
[cron.heartbeat]
interval_secs = 30
check_providers = true
check_disk_space = true
disk_space_threshold_mb = 100
external_health_url = ""  # optional: Status an externe URL senden
```

## Verwandte Seiten

- [Cron-System-Ubersicht](./)
- [Observability](/de/prx/observability/)
- [Prometheus-Metriken](/de/prx/observability/prometheus)
