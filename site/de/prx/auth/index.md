---
title: Authentifizierung
description: Überblick über das PRX-Authentifizierungssystem einschließlich OAuth2-Flows und Anbieterprofile.
---

# Authentifizierung

PRX unterstützt mehrere Authentifizierungsmechanismen für LLM-Anbieter, API-Zugriff und Inter-Node-Kommunikation. Das Auth-System behandelt OAuth2-Flows, API-Schlüsselverwaltung und anbieterspezifische Authentifizierung.

## Überblick

Die Authentifizierung in PRX arbeitet auf mehreren Ebenen:

| Ebene | Mechanismus | Zweck |
|-------|-----------|---------|
| Anbieter-Auth | OAuth2 / API-Schlüssel | Authentifizierung bei LLM-Anbietern |
| Gateway-Auth | Bearer-Tokens | Authentifizierung von API-Clients |
| Node-Auth | Ed25519-Pairing | Authentifizierung verteilter Nodes |

## Anbieter-Authentifizierung

Jeder LLM-Anbieter hat seine eigene Authentifizierungsmethode:

- **API-Schlüssel** -- statischer Schlüssel in Anfrage-Headern übermittelt (die meisten Anbieter)
- **OAuth2** -- Browser-basierter Autorisierungs-Flow (Anthropic, Google, GitHub Copilot)
- **AWS IAM** -- Rollenbasierte Authentifizierung für Bedrock

## Konfiguration

```toml
[auth]
default_method = "api_key"

[auth.oauth2]
redirect_port = 8400
token_cache_path = "~/.local/share/openprx/tokens"
```

## Verwandte Seiten

- [OAuth2-Flows](./oauth2)
- [Anbieterprofile](./profiles)
- [Geheimnisverwaltung](/de/prx/security/secrets)
