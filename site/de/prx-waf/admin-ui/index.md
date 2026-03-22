---
title: Admin-UI
description: "PRX-WAF Vue 3 Admin-Dashboard. JWT + TOTP-Authentifizierung, Host-Verwaltung, Regelverwaltung, Sicherheitsereignisüberwachung, Echtzeit-WebSocket-Dashboard und Benachrichtigungskonfiguration."
---

# Admin-UI

PRX-WAF enthält ein in die Binärdatei eingebettetes Vue 3 + Tailwind CSS Admin-Dashboard. Es bietet eine grafische Oberfläche zur Verwaltung von Hosts, Regeln, Zertifikaten, Sicherheitsereignissen und Cluster-Status.

## Auf die Admin-UI zugreifen

Die Admin-UI wird vom API-Server auf der konfigurierten Adresse bereitgestellt:

```
http://localhost:9527
```

Standard-Anmeldedaten: `admin` / `admin`

::: warning
Das Standard-Passwort sofort nach der ersten Anmeldung ändern. TOTP-Zwei-Faktor-Authentifizierung für Produktionsumgebungen aktivieren.
:::

## Authentifizierung

Die Admin-UI unterstützt zwei Authentifizierungsmechanismen:

| Methode | Beschreibung |
|---------|-------------|
| JWT-Token | Über `/api/auth/login` bezogen, im Browser-LocalStorage gespeichert |
| TOTP (Optional) | Zeitbasiertes Einmalpasswort für Zwei-Faktor-Authentifizierung |

### Login-API

```bash
curl -X POST http://localhost:9527/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

Antwort:

```json
{
  "token": "eyJ...",
  "refresh_token": "..."
}
```

Für TOTP-aktivierte Konten das `totp_code`-Feld einbeziehen:

```json
{"username": "admin", "password": "admin", "totp_code": "123456"}
```

## Dashboard-Abschnitte

### Hosts

Geschützte Domains und ihre Upstream-Backends verwalten:
- Hosts hinzufügen, bearbeiten und löschen
- WAF-Schutz pro Host umschalten
- Traffic-Statistiken pro Host anzeigen

### Regeln

Erkennungsregeln aller Quellen verwalten:
- OWASP CRS, ModSecurity, CVE und benutzerdefinierte Regeln anzeigen
- Einzelne Regeln aktivieren/deaktivieren
- Nach Kategorie, Schweregrad und Quelle suchen und filtern
- Regeln importieren und exportieren

### IP-Regeln

IP-basierte Allow- und Block-Listen verwalten:
- IP-Adressen oder CIDR-Bereiche hinzufügen
- Allow/Block-Aktionen setzen
- Aktive IP-Regeln anzeigen

### URL-Regeln

URL-basierte Erkennungsregeln verwalten:
- URL-Muster mit Regex-Unterstützung hinzufügen
- Block/Log/Allow-Aktionen setzen

### Sicherheitsereignisse

Erkannte Angriffe anzeigen und analysieren:
- Echtzeit-Ereignis-Feed
- Nach Host, Angriffstyp, Quell-IP und Zeitbereich filtern
- Ereignisse als JSON oder CSV exportieren

### Statistiken

Traffic- und Sicherheitsmetriken anzeigen:
- Anfragen pro Sekunde
- Angriffsverteilung nach Typ
- Meist angegriffene Hosts
- Häufigste Quell-IPs
- Antwortcode-Verteilung

### SSL-Zertifikate

TLS-Zertifikate verwalten:
- Aktive Zertifikate und Ablaufdaten anzeigen
- Manuelle Zertifikate hochladen
- Let's Encrypt Auto-Erneuerungsstatus überwachen

### WASM-Plugins

WebAssembly-Plugins verwalten:
- Neue Plugins hochladen
- Geladene Plugins und deren Status anzeigen
- Plugins aktivieren/deaktivieren

### Tunnel

Reverse-Tunnel verwalten:
- WebSocket-basierte Tunnel erstellen und löschen
- Tunnel-Status und Traffic überwachen

### CrowdSec

CrowdSec-Integrationsstatus anzeigen:
- Aktive Entscheidungen von LAPI
- AppSec-Inspektionsergebnisse
- Verbindungsstatus

### Benachrichtigungen

Alarmkanäle konfigurieren:
- E-Mail (SMTP)
- Webhook
- Telegram

## Echtzeit-Überwachung

Die Admin-UI verbindet sich mit einem WebSocket-Endpunkt (`/ws/events`) für Live-Sicherheitsereignis-Streaming. Ereignisse erscheinen in Echtzeit, wenn Angriffe erkannt und blockiert werden.

Sie können sich auch programmatisch mit dem WebSocket verbinden:

```javascript
const ws = new WebSocket("ws://localhost:9527/ws/events");
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Security event:", data);
};
```

## Sicherheitshärtung

### Admin-Zugriff nach IP einschränken

Admin-UI- und API-Zugriff auf vertrauenswürdige Netzwerke beschränken:

```toml
[security]
admin_ip_allowlist = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
```

### Ratenbegrenzung aktivieren

Admin-API vor Brute-Force-Angriffen schützen:

```toml
[security]
api_rate_limit_rps = 100
```

### CORS konfigurieren

Einschränken, welche Origins auf die Admin-API zugreifen können:

```toml
[security]
cors_origins = ["https://admin.example.com"]
```

## Technologie-Stack

| Komponente | Technologie |
|-----------|------------|
| Frontend | Vue 3 + Tailwind CSS |
| Build | Vite |
| State | Pinia |
| HTTP-Client | Axios |
| Charts | Chart.js |
| Einbettung | Statische Dateien, bereitgestellt von Axum |

Der Admin-UI-Quellcode befindet sich unter `web/admin-ui/` im Repository.

## Nächste Schritte

- [Schnellstart](../getting-started/quickstart) -- Ersten geschützten Host einrichten
- [Konfigurationsreferenz](../configuration/reference) -- Admin-Sicherheitseinstellungen
- [CLI-Referenz](../cli/) -- Alternative Kommandozeilen-Verwaltung
