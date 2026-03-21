---
title: Middleware
description: Gateway-Middleware-Stack fur Authentifizierung, Ratenlimitierung, CORS und Protokollierung.
---

# Middleware

Das PRX-Gateway verwendet einen komponierbaren Middleware-Stack zur Handhabung von Querschnittsbelangen wie Authentifizierung, Ratenlimitierung, CORS und Anfragenprotokollierung.

## Middleware-Stack

Anfragen durchlaufen den Middleware-Stack in dieser Reihenfolge:

1. **Anfragenprotokollierung** -- eingehende Anfragen mit Zeiterfassung protokollieren
2. **CORS** -- Cross-Origin Resource Sharing-Header handhaben
3. **Authentifizierung** -- Bearer-Tokens oder API-Schlussel validieren
4. **Ratenlimitierung** -- Pro-Client-Anfragelimits erzwingen
5. **Anfrage-Routing** -- an den entsprechenden Handler weiterleiten

## Authentifizierungs-Middleware

```toml
[gateway.auth]
enabled = true
method = "bearer"  # "bearer" | "api_key" | "none"
token_secret = "your-secret-key"
```

## Ratenlimitierung

```toml
[gateway.rate_limit]
enabled = true
requests_per_minute = 60
burst_size = 10
```

## CORS

```toml
[gateway.cors]
allowed_origins = ["https://app.example.com"]
allowed_methods = ["GET", "POST", "PUT", "DELETE"]
allowed_headers = ["Authorization", "Content-Type"]
max_age_secs = 86400
```

## Anfragenprotokollierung

Alle API-Anfragen werden mit Methode, Pfad, Statuscode und Antwortzeit protokolliert. Die Protokollebene kann konfiguriert werden:

```toml
[gateway.logging]
level = "info"  # "debug" | "info" | "warn" | "error"
format = "json"  # "json" | "pretty"
```

## Verwandte Seiten

- [Gateway-Ubersicht](./)
- [HTTP-API](./http-api)
- [Sicherheit](/de/prx/security/)
