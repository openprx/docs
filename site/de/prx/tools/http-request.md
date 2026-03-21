---
title: HTTP-Anfrage
description: HTTP-Anfragen an APIs mit Domain-Whitelisting, konfigurierbaren Antwortgrossen-Limits und Timeout-Durchsetzung stellen.
---

# HTTP-Anfrage

Das `http_request`-Werkzeug ermoglicht PRX-Agenten, direkte HTTP-Anfragen an externe APIs zu stellen. Es ist fur strukturierte API-Interaktionen konzipiert -- JSON-Daten abrufen, REST-Endpunkte aufrufen, Webhooks senden -- und nicht fur allgemeines Web-Browsing. Das Werkzeug erzwingt eine standardmassig verweigernde Domain-Richtlinie: Nur Domains, die explizit in `allowed_domains` aufgefuhrt sind, sind erreichbar.

HTTP-Anfrage ist Feature-gesteuert und erfordert `http_request.enabled = true` in der Konfiguration. Im Gegensatz zum Browser-Werkzeug, das Webseiten rendert, arbeitet das HTTP-Anfrage-Werkzeug auf Protokollebene, was es schneller und geeigneter fur API-Integrationen macht.

Das Werkzeug unterstutzt alle Standard-HTTP-Methoden (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS), benutzerdefinierte Header, Anfrage-Bodies und konfigurierbare Timeouts. Antwort-Bodies werden bis zu einer konfigurierbaren Maximalgrosse erfasst, um Speichererschopfung zu verhindern.

## Konfiguration

```toml
[http_request]
enabled = true
allowed_domains = [
  "api.github.com",
  "api.openai.com",
  "api.anthropic.com",
  "httpbin.org"
]
max_response_size = 1000000   # Maximale Antwort-Body-Grosse in Bytes (1 MB)
timeout_secs = 30             # Anfrage-Timeout in Sekunden
```

### Domain-Whitelist

Die `allowed_domains`-Liste ist die primare Sicherheitskontrolle fur das HTTP-Anfrage-Werkzeug. Nur Anfragen an Domains in dieser Liste sind erlaubt. Domain-Matching-Regeln:

| Muster | Beispiel | Stimmt uberein mit |
|--------|---------|-------------------|
| Exakte Domain | `"api.github.com"` | Nur `api.github.com` |
| Platzhalter-Subdomain | `"*.github.com"` | `api.github.com`, `raw.github.com` usw. |
| Top-Level-Domain | `"github.com"` | Nur `github.com` (nicht Subdomains standardmassig) |

::: warning
Eine leere `allowed_domains`-Liste bedeutet, dass keine HTTP-Anfragen erlaubt sind, selbst wenn das Werkzeug aktiviert ist. Dies ist der sichere Standard.
:::

## Verwendung

### GET-Anfrage

Daten von einer REST-API abrufen:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "GET",
    "url": "https://api.github.com/repos/openprx/prx/releases/latest",
    "headers": {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer ghp_xxxxxxxxxxxx"
    }
  }
}
```

### POST-Anfrage

Daten an einen API-Endpunkt senden:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "POST",
    "url": "https://api.example.com/webhooks",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{\"event\": \"task_completed\", \"data\": {\"task_id\": 42}}"
  }
}
```

### PUT-Anfrage

Eine Ressource aktualisieren:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "PUT",
    "url": "https://api.example.com/config/settings",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer token-here"
    },
    "body": "{\"theme\": \"dark\", \"language\": \"en\"}"
  }
}
```

### DELETE-Anfrage

Eine Ressource entfernen:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "DELETE",
    "url": "https://api.example.com/items/42",
    "headers": {
      "Authorization": "Bearer token-here"
    }
  }
}
```

## Parameter

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `method` | `string` | Nein | `"GET"` | HTTP-Methode: `"GET"`, `"POST"`, `"PUT"`, `"PATCH"`, `"DELETE"`, `"HEAD"`, `"OPTIONS"` |
| `url` | `string` | Ja | -- | Die vollstandige anzufragende URL. Muss HTTPS oder HTTP sein. Die Domain muss in `allowed_domains` stehen. |
| `headers` | `object` | Nein | `{}` | Schlussel-Wert-Zuordnung von HTTP-Headern fur die Anfrage |
| `body` | `string` | Nein | -- | Anfrage-Body (fur POST-, PUT-, PATCH-Methoden) |
| `timeout_secs` | `integer` | Nein | Konfigurationswert (`30`) | Per-Anfrage-Timeout-Uberschreibung in Sekunden |

**Ruckgabe:**

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `success` | `bool` | `true`, wenn die Anfrage abgeschlossen wurde (auch bei Nicht-2xx-Statuscodes) |
| `output` | `string` | Antwort-Body (Text), gekurzt auf `max_response_size`. Enthalt Statuscode und Header in strukturierter Ausgabe. |
| `error` | `string?` | Fehlermeldung, wenn die Anfrage fehlschlug (Domain blockiert, Timeout, Verbindungsfehler) |

### Antwortformat

Das Werkzeug gibt eine strukturierte Ausgabe zuruck mit:

```
Status: 200 OK
Content-Type: application/json

{
  "name": "prx",
  "version": "0.8.0",
  ...
}
```

Fur Nicht-Text-Antworten (Binardaten) meldet das Werkzeug die Antwortgrosse und den Content-Type, ohne den Body einzuschliessen.

## Haufige Muster

### API-Integration

Das HTTP-Anfrage-Werkzeug wird haufig zur Integration mit externen Diensten verwendet:

```
Agent denkt: Der Benutzer mochte den CI-Status seines PR prufen.
  1. [http_request] GET https://api.github.com/repos/owner/repo/pulls/42/checks
  2. [parst JSON-Antwort]
  3. [meldet Status an Benutzer]
```

### Webhook-Zustellung

Benachrichtigungen an externe Systeme senden:

```
Agent denkt: Aufgabe abgeschlossen, muss den Webhook benachrichtigen.
  1. [http_request] POST https://hooks.slack.com/services/T.../B.../xxx
     body: {"text": "Task #42 completed successfully"}
```

### Datenabruf

Strukturierte Daten zur Analyse abrufen:

```
Agent denkt: Muss Paketmetadaten nachschlagen.
  1. [http_request] GET https://crates.io/api/v1/crates/tokio
  2. [extrahiert Version, Download-Anzahl, Abhangigkeiten]
```

## Sicherheit

### Standardmassig verweigert

Das HTTP-Anfrage-Werkzeug verwendet ein standardmassig verweigerndes Sicherheitsmodell. Wenn eine Domain nicht explizit in `allowed_domains` aufgefuhrt ist, wird die Anfrage blockiert, bevor eine Netzwerkverbindung hergestellt wird. Dies verhindert:

- **Server-Side Request Forgery (SSRF)**: Der Agent kann keine Anfragen an interne Netzwerkadressen (`localhost`, `10.x.x.x`, `192.168.x.x`) stellen, es sei denn, explizit erlaubt
- **Datenexfiltration**: Der Agent kann keine Daten an beliebige externe Server senden
- **DNS-Rebinding**: Die Domain wird zum Anfragezeitpunkt gepruft, nicht nur bei der DNS-Auflosung

### Anmeldedaten-Behandlung

Das HTTP-Anfrage-Werkzeug injiziert keine Anmeldedaten automatisch. Wenn der Agent sich bei einer API authentifizieren muss, muss er Authentifizierungs-Header explizit in den Werkzeugaufruf-Argumenten angeben. Das bedeutet:

- API-Schlussel sind im Werkzeugaufruf (und Audit-Protokoll) sichtbar
- Der Agent kann nur Anmeldedaten verwenden, die ihm gegeben oder aus dem Gedachtnis abgerufen wurden
- Anmeldedaten-Leckage an nicht autorisierte Domains wird durch die Domain-Whitelist verhindert

Erwagen Sie die Verwendung von `[security.tool_policy]`, um `http_request` fur sensible API-Aufrufe als uberwacht zu markieren:

```toml
[security.tool_policy.tools]
http_request = "supervised"
```

### Antwortgrossen-Limits

Die `max_response_size`-Einstellung (Standard: 1 MB) verhindert Speichererschopfung durch unerwartet grosse Antworten. Antworten, die dieses Limit uberschreiten, werden gekurzt und ein Hinweis wird an die Ausgabe angehangt.

### Timeout-Schutz

Die `timeout_secs`-Einstellung (Standard: 30 Sekunden) verhindert, dass der Agent bei langsamen oder nicht reagierenden Servern hangt. Timeouts werden auf Verbindungsebene durchgesetzt.

### Proxy-Unterstutzung

Wenn `[proxy]` konfiguriert ist, werden HTTP-Anfragen uber den konfigurierten Proxy geleitet:

```toml
[proxy]
enabled = true
https_proxy = "socks5://127.0.0.1:1080"
no_proxy = ["localhost", "127.0.0.1"]
```

### Audit-Protokollierung

Alle HTTP-Anfragen werden im Audit-Protokoll aufgezeichnet, wenn aktiviert, einschliesslich:

- Anfragemethode und URL
- Anfrage-Header (mit redigierten sensiblen Werten)
- Antwort-Statuscode
- Antwortgrosse
- Erfolgs-/Fehlerstatus

## Verwandte Seiten

- [Web-Suche](/de/prx/tools/web-search) -- das Web durchsuchen und Seiteninhalte abrufen
- [Browser-Werkzeug](/de/prx/tools/browser) -- vollstandige Browser-Automatisierung fur Webseiten
- [MCP-Integration](/de/prx/tools/mcp) -- Verbindung zu externen Werkzeugen uber MCP-Protokoll
- [Konfigurationsreferenz](/de/prx/config/reference) -- `[http_request]`-Konfigurationsfelder
- [Proxy-Konfiguration](/de/prx/config/reference#proxy) -- Ausgehende Proxy-Einstellungen
- [Werkzeuge-Ubersicht](/de/prx/tools/) -- alle Werkzeuge und Registry-System
