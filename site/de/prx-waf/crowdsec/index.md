---
title: CrowdSec-Integration
description: "PRX-WAF CrowdSec-Integration für kollaborativen Bedrohungsgeheimdienst. Bouncer-Modus mit In-Memory-Entscheidungscache, AppSec-Modus für Echtzeit-HTTP-Analyse und Log-Pusher für Community-Sharing."
---

# CrowdSec-Integration

PRX-WAF integriert sich mit [CrowdSec](https://www.crowdsec.net/), um kollaborativen, community-gesteuerten Bedrohungsgeheimdienst direkt in die WAF-Erkennungspipeline zu bringen. Anstatt sich ausschließlich auf lokale Regeln und Heuristiken zu verlassen, kann PRX-WAF das CrowdSec-Netzwerk nutzen -- wo Tausende von Maschinen Angriffssignale in Echtzeit teilen -- um bekannte bösartige IPs zu blockieren, Anwendungsschichtangriffe zu erkennen und WAF-Ereignisse zurück an die Community beizutragen.

Die Integration arbeitet in **drei Modi**, die unabhängig oder zusammen verwendet werden können:

| Modus | Zweck | Latenz | Pipeline-Phase |
|-------|-------|--------|---------------|
| **Bouncer** | IPs mit gecachten LAPI-Entscheidungen blockieren | Mikrosekunden (In-Memory) | Phase 16a |
| **AppSec** | Vollständige HTTP-Anfragen via CrowdSec AppSec analysieren | Millisekunden (HTTP-Aufruf) | Phase 16b |
| **Log-Pusher** | WAF-Ereignisse zurück an LAPI melden | Asynchron (gebatcht) | Hintergrund |

## Funktionsweise

### Bouncer-Modus

Der Bouncer-Modus unterhält einen **In-Memory-Entscheidungscache**, der mit der CrowdSec Local API (LAPI) synchronisiert wird. Wenn eine Anfrage in Phase 16a der Erkennungspipeline eintrifft, führt PRX-WAF eine O(1)-Suche im Cache durch:

```
Anfrage-IP ──> DashMap (exakter IP-Match) ──> Treffer? ──> Entscheidung anwenden (ban/captcha/throttle)
                     │
                     └──> Kein Treffer ──> RwLock<Vec> (CIDR-Bereichsscan) ──> Treffer? ──> Entscheidung anwenden
                                                  │
                                                  └──> Kein Treffer ──> Zulassen (weiter zur nächsten Phase)
```

Der Cache wird in einem konfigurierbaren Intervall (Standard: alle 10 Sekunden) durch Abfragen des LAPI `/v1/decisions`-Endpunkts aktualisiert. Dieses Design stellt sicher, dass IP-Suchen nie auf Netzwerk-I/O blockieren -- die Synchronisierung erfolgt in einem Hintergrundtask.

**Datenstrukturen:**

- **DashMap** für exakte IP-Adressen -- lock-freie concurrent Hashmap, O(1)-Suche
- **RwLock\<Vec\>** für CIDR-Bereiche -- bei Cache-Miss sequenziell gescannt, typischerweise eine kleine Menge

**Szenario-Filterung** ermöglicht das Ein- oder Ausschließen von Entscheidungen basierend auf Szenarionamen:

```toml
# Nur bei SSH-Brute-Force- und HTTP-Scanning-Szenarien handeln
scenarios_containing = ["ssh-bf", "http-scan"]

# Entscheidungen aus diesen Szenarien ignorieren
scenarios_not_containing = ["manual"]
```

### AppSec-Modus

Der AppSec-Modus sendet vollständige HTTP-Anfrage-Details an die CrowdSec AppSec-Komponente zur Echtzeit-Analyse. Im Gegensatz zum Bouncer-Modus, der nur IPs prüft, inspiziert AppSec Anfrage-Header, Body, URI und Methode, um Anwendungsschichtangriffe wie SQL-Injection, XSS und Pfad-Traversal zu erkennen.

```
Anfrage ──> Phase 16b ──> POST http://appsec:7422/
                           Body: { method, uri, headers, body }
                           ──> CrowdSec AppSec-Engine
                           ──> Antwort: allow / block (mit Details)
```

AppSec-Prüfungen sind **asynchron** -- PRX-WAF sendet die Anfrage mit einem konfigurierbaren Timeout (Standard: 500ms). Wenn der AppSec-Endpunkt nicht erreichbar ist oder ein Timeout auftritt, bestimmt die `fallback_action`, ob die Anfrage zugelassen, blockiert oder protokolliert wird.

### Log-Pusher

Der Log-Pusher meldet WAF-Sicherheitsereignisse zurück an die CrowdSec LAPI und trägt zum Community-Bedrohungsgeheimdienst-Netzwerk bei. Ereignisse werden gebatcht und periodisch geleert, um die LAPI-Last zu minimieren.

**Batching-Parameter:**

| Parameter | Wert | Beschreibung |
|-----------|------|-------------|
| Batch-Größe | 50 Ereignisse | Leeren, wenn Puffer 50 Ereignisse erreicht |
| Leere-Intervall | 30 Sekunden | Leeren auch wenn Puffer nicht voll |
| Authentifizierung | Machine JWT | Verwendet `pusher_login` / `pusher_password` für Machine-Auth |
| Herunterfahren | Finales Leeren | Alle gepufferten Ereignisse werden vor dem Prozessende geleert |

Der Pusher authentifiziert sich mit der LAPI mit Machine-Anmeldedaten (getrennt vom Bouncer-API-Schlüssel) und postet Ereignisse an den `/v1/alerts`-Endpunkt.

## Konfiguration

Den `[crowdsec]`-Abschnitt zur TOML-Konfigurationsdatei hinzufügen:

```toml
[crowdsec]
# Hauptschalter
enabled = true

# Integrationsmodus: "bouncer", "appsec" oder "both"
mode = "both"

# --- Bouncer-Einstellungen ---
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-api-key"
update_frequency_secs = 10
cache_ttl_secs = 0           # 0 = von LAPI bereitgestellte Dauer verwenden
fallback_action = "allow"    # "allow" | "block" | "log"

# Szenario-Filterung (optional)
scenarios_containing = []
scenarios_not_containing = []

# --- AppSec-Einstellungen ---
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500

# --- Log-Pusher-Einstellungen ---
pusher_login = "machine-id"
pusher_password = "machine-password"
```

### Konfigurationsreferenz

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `enabled` | `boolean` | `false` | CrowdSec-Integration aktivieren |
| `mode` | `string` | `"bouncer"` | Integrationsmodus: `"bouncer"`, `"appsec"` oder `"both"` |
| `lapi_url` | `string` | `"http://127.0.0.1:8080"` | CrowdSec LAPI-Basis-URL |
| `api_key` | `string` | `""` | Bouncer-API-Schlüssel (via `cscli bouncers add` erhalten) |
| `update_frequency_secs` | `integer` | `10` | Wie oft der Entscheidungscache von LAPI aktualisiert wird (Sekunden) |
| `cache_ttl_secs` | `integer` | `0` | Entscheidungs-TTL überschreiben. `0` bedeutet die von LAPI bereitgestellte Dauer verwenden. |
| `fallback_action` | `string` | `"allow"` | Aktion wenn LAPI oder AppSec nicht erreichbar: `"allow"`, `"block"` oder `"log"` |
| `scenarios_containing` | `string[]` | `[]` | Nur Entscheidungen cachen, deren Szenarioname einen dieser Teilstrings enthält. Leer bedeutet alle. |
| `scenarios_not_containing` | `string[]` | `[]` | Entscheidungen ausschließen, deren Szenarioname einen dieser Teilstrings enthält. |
| `appsec_endpoint` | `string` | -- | CrowdSec AppSec-Endpunkt-URL |
| `appsec_key` | `string` | -- | AppSec-API-Schlüssel |
| `appsec_timeout_ms` | `integer` | `500` | AppSec-HTTP-Anfrage-Timeout (Millisekunden) |
| `pusher_login` | `string` | -- | Machine-Login für LAPI-Authentifizierung (Log-Pusher) |
| `pusher_password` | `string` | -- | Machine-Passwort für LAPI-Authentifizierung (Log-Pusher) |

## Einrichtungsanleitung

### Voraussetzungen

1. Eine laufende CrowdSec-Instanz mit von Ihrem PRX-WAF-Host zugänglicher LAPI
2. Ein Bouncer-API-Schlüssel (für Bouncer-Modus)
3. CrowdSec AppSec-Komponente (für AppSec-Modus, optional)
4. Machine-Anmeldedaten (für Log-Pusher, optional)

### Schritt 1: CrowdSec installieren

Falls CrowdSec noch nicht installiert ist:

```bash
# Debian / Ubuntu
curl -s https://install.crowdsec.net | sudo sh
sudo apt install crowdsec

# LAPI-Status überprüfen
sudo cscli metrics
```

### Schritt 2: Bouncer registrieren

```bash
# Bouncer-API-Schlüssel für PRX-WAF erstellen
sudo cscli bouncers add prx-waf-bouncer

# Ausgabe:
# API key for 'prx-waf-bouncer':
#   abc123def456...
#
# Diesen Schlüssel kopieren -- er wird nur einmal angezeigt.
```

### Schritt 3: PRX-WAF konfigurieren

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
```

### Schritt 4: Konnektivität verifizieren

```bash
# Via CLI
prx-waf crowdsec test

# Oder via API
curl http://localhost:9527/api/crowdsec/test -X POST \
  -H "Authorization: Bearer <token>"
```

### Schritt 5 (Optional): AppSec aktivieren

Wenn die CrowdSec AppSec-Komponente läuft:

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500
```

### Schritt 6 (Optional): Log-Pusher aktivieren

Um WAF-Ereignisse an CrowdSec zurückzutragen:

```bash
# Eine Machine auf der CrowdSec LAPI registrieren
sudo cscli machines add prx-waf-pusher --password "your-secure-password"
```

```toml
[crowdsec]
pusher_login = "prx-waf-pusher"
pusher_password = "your-secure-password"
```

### Interaktive Einrichtung

Für eine geführte Einrichtungserfahrung den CLI-Assistenten verwenden:

```bash
prx-waf crowdsec setup
```

Der Assistent führt durch LAPI-URL-Konfiguration, API-Schlüsseleingabe, Modusauswahl und Konnektivitätstests.

## Pipeline-Integration

CrowdSec-Prüfungen werden in **Phase 16** der 16-phasigen WAF-Erkennungspipeline ausgeführt -- die letzte Phase vor dem Proxying zum Upstream-Backend. Diese Positionierung ist bewusst:

1. **Günstigere Prüfungen zuerst.** IP-Allowlist/Blocklist (Phase 1-4), Ratenbegrenzung (Phase 5) und Mustererkennung (Phase 8-13) werden vor CrowdSec ausgeführt und filtern offensichtliche Angriffe heraus.
2. **Bouncer vor AppSec.** Phase 16a (Bouncer) läuft synchron mit Mikrosekunden-Latenz. Nur wenn die IP nicht im Entscheidungscache ist, läuft Phase 16b (AppSec), was einen HTTP-Round-Trip beinhaltet.
3. **Nicht-blockierende Architektur.** Der Entscheidungscache wird in einem Hintergrundtask aktualisiert. AppSec-Aufrufe verwenden asynchrones HTTP mit einem Timeout. Keiner der Modi blockiert den Haupt-Proxy-Thread-Pool.

```
Phase 1-15 (lokale Prüfungen)
    │
    └──> Phase 16a: Bouncer (DashMap/CIDR-Suche, ~1-5 us)
              │
              ├── Entscheidung gefunden ──> Block/Captcha/Throttle
              │
              └── Keine Entscheidung ──> Phase 16b: AppSec (HTTP POST, ~1-50 ms)
                                               │
                                               ├── Block ──> 403 Forbidden
                                               │
                                               └── Allow ──> Proxy zum Upstream
```

## REST-API

Alle CrowdSec-API-Endpunkte erfordern Authentifizierung (JWT-Bearer-Token von der Admin-API).

### Status

```http
GET /api/crowdsec/status
```

Gibt den aktuellen Integrationsstatus einschließlich Verbindungsstatus, Cache-Statistiken und Konfigurationsübersicht zurück.

**Antwort:**

```json
{
  "enabled": true,
  "mode": "both",
  "lapi_connected": true,
  "appsec_connected": true,
  "cache": {
    "exact_ips": 1247,
    "cidr_ranges": 89,
    "last_refresh": "2026-03-21T10:15:30Z",
    "refresh_interval_secs": 10
  },
  "pusher": {
    "authenticated": true,
    "events_sent": 4521,
    "buffer_size": 12
  }
}
```

### Entscheidungen auflisten

```http
GET /api/crowdsec/decisions
```

Gibt alle gecachten Entscheidungen mit Typ, Bereich, Wert und Ablauf zurück.

**Antwort:**

```json
{
  "decisions": [
    {
      "id": 12345,
      "type": "ban",
      "scope": "ip",
      "value": "192.168.1.100",
      "scenario": "crowdsecurity/http-bf-wordpress_bf",
      "duration": "4h",
      "expires_at": "2026-03-21T14:00:00Z"
    },
    {
      "id": 12346,
      "type": "ban",
      "scope": "range",
      "value": "10.0.0.0/24",
      "scenario": "crowdsecurity/ssh-bf",
      "duration": "24h",
      "expires_at": "2026-03-22T10:00:00Z"
    }
  ],
  "total": 1336
}
```

### Entscheidung löschen

```http
DELETE /api/crowdsec/decisions/:id
```

Entfernt eine Entscheidung aus dem lokalen Cache und der LAPI. Nützlich zum Entsperren von Falsch-Positiven.

**Beispiel:**

```bash
curl -X DELETE http://localhost:9527/api/crowdsec/decisions/12345 \
  -H "Authorization: Bearer <token>"
```

### Konnektivität testen

```http
POST /api/crowdsec/test
```

Testet Konnektivität zur LAPI (und AppSec-Endpunkt, falls konfiguriert). Gibt Verbindungsstatus und Latenz zurück.

### Cache-Statistiken

```http
GET /api/crowdsec/stats
```

Gibt detaillierte Cache-Statistiken einschließlich Treffer-/Fehlerquoten und Entscheidungstyp-Aufschlüsselung zurück.

## CLI-Befehle

### Status

```bash
prx-waf crowdsec status
```

Zeigt Integrationsstatus, LAPI-Verbindungsstatus, Cache-Größe und Pusher-Statistiken an.

### Entscheidungen auflisten

```bash
prx-waf crowdsec decisions
```

Gibt eine Tabelle aller aktiven Entscheidungen im lokalen Cache aus.

### Konnektivität testen

```bash
prx-waf crowdsec test
```

Führt eine Konnektivitätsprüfung gegen die LAPI und den AppSec-Endpunkt durch und meldet Latenz und Versionsinformationen.

### Einrichtungsassistent

```bash
prx-waf crowdsec setup
```

Ein interaktiver Assistent, der durch folgende Schritte führt:

1. LAPI-URL- und API-Schlüssel-Konfiguration
2. Modusauswahl (bouncer / appsec / both)
3. AppSec-Endpunkt-Konfiguration (falls zutreffend)
4. Log-Pusher-Anmeldedaten-Einrichtung (optional)
5. Konnektivitätsverifizierung
6. Konfiguration in die TOML-Datei schreiben

## Bereitstellungsmuster

### Nur-Bouncer (Empfohlener Startpunkt)

Die einfachste Bereitstellung. PRX-WAF fragt Entscheidungen von einer CrowdSec LAPI ab und blockiert bekannte bösartige IPs:

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 10
fallback_action = "allow"
```

Geeignet für: die meisten Bereitstellungen, minimaler Overhead, keine zusätzlichen CrowdSec-Komponenten erforderlich.

### Vollintegration (Bouncer + AppSec + Pusher)

Maximaler Schutz mit bidirektionalem Bedrohungsgeheimdienst:

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 10
fallback_action = "log"
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500
pusher_login = "prx-waf-machine"
pusher_password = "secure-password"
```

Geeignet für: Produktionsumgebungen, die sowohl IP-Reputation als auch Anwendungsschichtinspektion sowie Community-Beiträge wünschen.

## Fehlerbehebung

### LAPI-Verbindung abgelehnt

```
CrowdSec LAPI unreachable: connection refused at http://127.0.0.1:8080
```

**Ursache:** CrowdSec LAPI läuft nicht oder lauscht auf einer anderen Adresse.

**Lösung:**
```bash
# CrowdSec-Status prüfen
sudo systemctl status crowdsec

# Verifizieren, dass LAPI lauscht
sudo ss -tlnp | grep 8080

# CrowdSec-Logs prüfen
sudo journalctl -u crowdsec -f
```

### Ungültiger API-Schlüssel

```
CrowdSec LAPI returned 403: invalid API key
```

**Ursache:** Der Bouncer-API-Schlüssel ist falsch oder wurde widerrufen.

**Lösung:**
```bash
# Vorhandene Bouncer auflisten
sudo cscli bouncers list

# Neuen Bouncer-Schlüssel erstellen
sudo cscli bouncers add prx-waf-bouncer
```

### AppSec-Timeout

```
CrowdSec AppSec timeout after 500ms
```

**Ursache:** Der AppSec-Endpunkt ist langsam oder überlastet.

**Lösung:**
- `appsec_timeout_ms` erhöhen (z.B. auf 1000)
- AppSec-Ressourcennutzung prüfen
- `mode = "bouncer"` verwenden, wenn AppSec nicht kritisch ist

### Leerer Entscheidungscache

Wenn `prx-waf crowdsec decisions` keine Einträge zeigt:

1. Verifizieren, dass LAPI Entscheidungen hat: `sudo cscli decisions list`
2. Szenario-Filterung prüfen -- Ihr `scenarios_containing`-Filter ist möglicherweise zu restriktiv
3. Verifizieren, dass der Bouncer-Schlüssel Leseberechtigungen hat

## Nächste Schritte

- [Konfigurationsreferenz](../configuration/reference) -- Vollständige TOML-Konfigurationsreferenz
- [CLI-Referenz](../cli/) -- Alle CLI-Befehle einschließlich CrowdSec-Unterbefehle
- [Regel-Engine](../rules/) -- Wie CrowdSec in die Erkennungspipeline passt
- [Admin-UI](../admin-ui/) -- CrowdSec vom Dashboard aus verwalten
