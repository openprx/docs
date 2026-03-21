---
title: Gerate-Pairing
description: Gerate-Pairing und Identitatsuberprufung fur die PRX-Agenten-Authentifizierung.
---

# Gerate-Pairing

PRX verwendet ein Gerate-Pairing-Modell zur Authentifizierung von Agenteninstanzen und zur Vertrauensherstellung zwischen Nodes. Das Pairing stellt sicher, dass nur autorisierte Gerate sich mit dem Agenten verbinden und ihn steuern konnen.

## Ubersicht

Der Pairing-Prozess:

1. Eine eindeutige Gerateidentitat generieren (Ed25519-Schlusselpaar)
2. Offentliche Schlussel zwischen Controller und Agent austauschen
3. Identitat uber ein Challenge-Response-Protokoll verifizieren
4. Einen verschlusselten Kommunikationskanal einrichten

## Pairing-Ablauf

```
Controller                    Agent
    │                           │
    │──── Pairing-Anfrage ─────►│
    │                           │
    │◄─── Challenge ───────────│
    │                           │
    │──── Signierte Antwort ───►│
    │                           │
    │◄─── Pairing bestatigt ───│
```

## Konfiguration

```toml
[security.pairing]
require_pairing = true
max_paired_devices = 5
challenge_timeout_secs = 30
```

## Gepaarte Gerate verwalten

```bash
prx pair list          # Gepaarte Gerate auflisten
prx pair add           # Pairing-Ablauf starten
prx pair remove <id>   # Ein gepaartes Gerat entfernen
prx pair revoke-all    # Alle Pairings widerrufen
```

## Verwandte Seiten

- [Sicherheitsubersicht](./)
- [Nodes](/de/prx/nodes/)
- [Geheimnisverwaltung](./secrets)
