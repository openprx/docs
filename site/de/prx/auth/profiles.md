---
title: Anbieterprofile
description: Benannte Authentifizierungsprofile zur Verwaltung mehrerer Anbieterkonten in PRX.
---

# Anbieterprofile

Anbieterprofile ermöglichen die Konfiguration mehrerer Authentifizierungskontexte für denselben Anbieter. Dies ist nützlich, wenn Sie separate Konten für private und berufliche Nutzung haben oder zwischen Entwicklungs- und Produktions-API-Schlüsseln wechseln.

## Überblick

Ein Profil ist eine benannte Konfiguration, die enthält:

- Anbieter-Identifikator
- Authentifizierungsdaten (API-Schlüssel oder OAuth2-Tokens)
- Modellpräferenzen
- Ratenlimit-Überschreibungen

## Konfiguration

```toml
[[auth.profiles]]
name = "personal"
provider = "anthropic"
api_key = "sk-ant-personal-..."
default_model = "claude-haiku"

[[auth.profiles]]
name = "work"
provider = "anthropic"
api_key = "sk-ant-work-..."
default_model = "claude-sonnet-4-6"
```

## Profile wechseln

```bash
# Use a specific profile
prx chat --profile work

# Set default profile
prx auth set-default work

# List profiles
prx auth profiles
```

## Umgebungsvariablen

Profile können Umgebungsvariablen für Anmeldedaten referenzieren:

```toml
[[auth.profiles]]
name = "ci"
provider = "anthropic"
api_key = "${ANTHROPIC_API_KEY}"
```

## Verwandte Seiten

- [Authentifizierungsübersicht](./)
- [OAuth2-Flows](./oauth2)
- [Geheimnisverwaltung](/de/prx/security/secrets)
