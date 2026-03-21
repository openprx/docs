---
title: OAuth2-Flows
description: Von PRX unterstützte OAuth2-Authentifizierungsflows für die LLM-Anbieter-Autorisierung.
---

# OAuth2-Flows

PRX implementiert OAuth2-Autorisierungsflows für Anbieter, die Browser-basierte Authentifizierung unterstützen. Dies ermöglicht Benutzern die Authentifizierung, ohne API-Schlüssel manuell verwalten zu müssen.

## Unterstützte Flows

### Authorization Code Flow

Verwendet von Anthropic (Claude Code), Google Gemini CLI und Minimax:

1. PRX öffnet einen Browser zur Autorisierungs-URL des Anbieters
2. Benutzer erteilt die Berechtigung
3. Anbieter leitet zum lokalen Callback-Server von PRX um
4. PRX tauscht den Autorisierungscode gegen Zugriffs- und Refresh-Tokens
5. Tokens werden sicher für die zukünftige Verwendung gespeichert

### Device Code Flow

Verwendet von GitHub Copilot:

1. PRX fordert einen Gerätecode vom Anbieter an
2. Benutzer besucht eine URL und gibt den Gerätecode ein
3. PRX fragt die Autorisierung periodisch ab
4. Nach der Autorisierung werden Tokens empfangen und gespeichert

## Token-Verwaltung

PRX behandelt automatisch:

- Token-Caching zur Vermeidung wiederholter Autorisierung
- Refresh-Token-Rotation bei Ablauf von Zugriffstoken
- Sichere Speicherung von Tokens (verschlüsselt im Ruhezustand)

## Konfiguration

```toml
[auth.oauth2]
redirect_port = 8400
token_cache_path = "~/.local/share/openprx/tokens"
auto_refresh = true
```

## CLI-Befehle

```bash
prx auth login anthropic    # Start OAuth2 flow for Anthropic
prx auth login copilot      # Start device code flow for Copilot
prx auth status              # Show auth status for all providers
prx auth logout anthropic   # Revoke tokens for Anthropic
```

## Verwandte Seiten

- [Authentifizierungsübersicht](./)
- [Anbieterprofile](./profiles)
