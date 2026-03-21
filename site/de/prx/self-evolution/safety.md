---
title: Evolutions-Sicherheit
description: Rollback-Schutz, Integritatsprufungen und Sicherheitsmechanismen fur die PRX-Selbstevolution.
---

# Evolutions-Sicherheit

Sicherheit hat hochste Prioritat im Selbstevolutions-System. Jede Anderung beinhaltet Rollback-Fahigkeit, Pre-/Post-Integritatsprufungen und automatische Regressionserkennung, um schadliche Modifikationen zu verhindern.

## Sicherheitsmechanismen

### Rollback-Schutz

Jede Evolutionsanderung erstellt vor der Anwendung einen Snapshot. Wenn Probleme erkannt werden, kann das System sofort auf den vorherigen Zustand zuruckkehren:

- **Automatisches Rollback** -- wird ausgelost, wenn Post-Change-Integritatsprufungen fehlschlagen
- **Manuelles Rollback** -- uber die CLI fur menschlich initiierte Rucknahmen verfugbar
- **Zeitbasiertes Rollback** -- Anderungen werden automatisch ruckgangig gemacht, wenn sie nicht innerhalb des Rollback-Fensters explizit bestatigt werden

### Integritatsprufungen

Vor und nach jeder Anderung validiert das System:

- Kernfunktionalitat funktioniert noch (Smoke-Tests)
- Sicherheitsinvarianten werden eingehalten (z.B. keine Abschwachung der Sicherheitsrichtlinie)
- Leistungsmetriken bleiben innerhalb akzeptabler Grenzen
- Keine zirkularen Abhangigkeiten oder konfligierenden Regeln

### Regressionserkennung

Nach Anwendung einer Anderung uberwacht das System Schlusselmetriken fur einen konfigurierbaren Zeitraum:

- Aufgabenabschlussrate
- Fehlerrate
- Durchschnittliche Antwortqualitat
- Benutzerzufriedenheits-Signale

Wenn sich eine Metrik uber einen Schwellenwert hinaus verschlechtert, wird die Anderung automatisch zuruckgerollt.

## Konfiguration

```toml
[self_evolution.safety]
rollback_enabled = true
rollback_window_hours = 168  # 7 Tage
sanity_check_timeout_secs = 30
regression_monitoring_hours = 24
max_regression_threshold = 0.1  # 10% Verschlechterung lost Rollback aus
```

## CLI-Befehle

```bash
prx evolution status          # Aktiven Evolutionszustand anzeigen
prx evolution rollback        # Die letzte Anderung zuruckrollen
prx evolution history         # Evolutionsverlauf anzeigen
prx evolution approve <id>    # Einen ausstehenden Vorschlag genehmigen
```

## Verwandte Seiten

- [Selbstevolutions-Ubersicht](./)
- [Evolutions-Pipeline](./pipeline)
- [Sicherheitsrichtlinien-Engine](/de/prx/security/policy-engine)
