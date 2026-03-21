---
title: Sicherheit
description: Ubersicht uber das PRX-Sicherheitsmodell mit Richtlinien-Engine, Sandbox, Geheimnisverwaltung und Bedrohungsmodell.
---

# Sicherheit

Sicherheit ist ein grundlegendes Anliegen in PRX. Als autonomes Agenten-Framework muss PRX sorgfaltig kontrollieren, welche Aktionen Agenten durchfuhren konnen, auf welche Daten sie zugreifen konnen und wie sie mit externen Systemen interagieren.

## Sicherheitsschichten

PRX implementiert Tiefenverteidigung durch mehrere Sicherheitsschichten:

| Schicht | Komponente | Zweck |
|---------|-----------|-------|
| Richtlinie | [Richtlinien-Engine](./policy-engine) | Deklarative Regeln fur Werkzeugzugriff und Datenfluss |
| Isolation | [Sandbox](./sandbox) | Prozess-/Container-Isolation fur Werkzeugausfuhrung |
| Authentifizierung | [Pairing](./pairing) | Gerate-Pairing und Identitatsuberprufung |
| Geheimnisse | [Geheimnisverwaltung](./secrets) | Sichere Speicherung fur API-Schlussel und Anmeldedaten |

## Konfiguration

```toml
[security]
sandbox_backend = "bubblewrap"  # "docker" | "firejail" | "bubblewrap" | "landlock" | "none"
require_tool_approval = true
max_tool_calls_per_turn = 10

[security.policy]
default_action = "deny"
```

## Bedrohungsmodell

Das [Bedrohungsmodell](./threat-model) von PRX berucksichtigt feindliche Eingaben, Prompt-Injection, Werkzeugmissbrauch und Datenexfiltration als primare Bedrohungsvektoren.

## Verwandte Seiten

- [Richtlinien-Engine](./policy-engine)
- [Pairing](./pairing)
- [Sandbox](./sandbox)
- [Geheimnisverwaltung](./secrets)
- [Bedrohungsmodell](./threat-model)
