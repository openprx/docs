---
title: ngrok-Integration
description: Ihren PRX-Agenten mit ngrok dem Internet exponieren fur schnelle Entwicklung und Webhook-Tests.
---

# ngrok-Integration

ngrok ist ein beliebter Tunneling-Dienst, der sicheren Ingress zu Ihrer lokalen PRX-Instanz erstellt. Es ist der schnellste Weg, um mit Webhooks und externen Integrationen loszulegen -- ein einziger Befehl gibt Ihnen eine offentliche HTTPS-URL, die auf Ihren lokalen Agenten zeigt.

## Ubersicht

ngrok eignet sich am besten fur:

- **Entwicklung und Tests** -- in Sekunden eine offentliche URL erhalten, ohne Konto-Einrichtung
- **Webhook-Prototyping** -- schnell Telegram-, Discord-, GitHub- oder Slack-Integrationen testen
- **Demos und Prasentationen** -- eine temporare offentliche URL teilen, um Ihren Agenten vorzufuhren
- **Umgebungen, in denen Cloudflare oder Tailscale nicht verfugbar sind**

Fur Produktionsbereitstellungen erwagen Sie [Cloudflare Tunnel](./cloudflare) oder [Tailscale Funnel](./tailscale), die bessere Zuverlassigkeit, benutzerdefinierte Domains und Zero-Trust-Zugriffskontrollen bieten.

## Voraussetzungen

1. ngrok-CLI auf der Maschine installiert, auf der PRX lauft
2. Ein ngrok-Konto mit einem Auth-Token (kostenloses Kontingent ist ausreichend)

### ngrok installieren

```bash
# Debian / Ubuntu (uber snap)
sudo snap install ngrok

# macOS
brew install ngrok

# Binary-Download (alle Plattformen)
# https://ngrok.com/download

# Authentifizieren (einmalige Einrichtung)
ngrok config add-authtoken <IHR_AUTH_TOKEN>
```

Ihr Auth-Token erhalten Sie vom [ngrok-Dashboard](https://dashboard.ngrok.com/get-started/your-authtoken).

## Konfiguration

### Grundeinrichtung

```toml
[tunnel]
backend = "ngrok"
local_addr = "127.0.0.1:8080"

[tunnel.ngrok]
# Auth-Token. Kann auch uber die Umgebungsvariable NGROK_AUTHTOKEN gesetzt werden.
# Wenn weggelassen, verwendet ngrok das Token aus seiner lokalen Konfigurationsdatei.
authtoken = ""

# Region fur den Tunnel-Endpunkt.
# Optionen: "us", "eu", "ap", "au", "sa", "jp", "in"
region = "us"
```

### Benutzerdefinierte Domain (Kostenpflichtige Plane)

Kostenpflichtige ngrok-Plane unterstutzen persistente benutzerdefinierte Domains:

```toml
[tunnel]
backend = "ngrok"
local_addr = "127.0.0.1:8080"

[tunnel.ngrok]
authtoken = "${NGROK_AUTHTOKEN}"

# Benutzerdefinierte Domain (erfordert kostenpflichtigen ngrok-Plan)
domain = "agent.example.com"

# Alternativ eine statische ngrok-Subdomain verwenden (bei einigen Planen kostenlos)
# subdomain = "my-prx-agent"
```

### Reservierte Domain

Fur stabile URLs im kostenlosen Kontingent bietet ngrok reservierte Domains:

```toml
[tunnel.ngrok]
authtoken = "${NGROK_AUTHTOKEN}"

# Von ngrok zugewiesene reservierte Domain (z.B. "example-agent.ngrok-free.app")
domain = "example-agent.ngrok-free.app"
```

## Konfigurationsreferenz

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|-------------|
| `authtoken` | string | -- | ngrok-Authentifizierungstoken |
| `region` | string | `"us"` | Tunnel-Region: `"us"`, `"eu"`, `"ap"`, `"au"`, `"sa"`, `"jp"`, `"in"` |
| `domain` | string | -- | Benutzerdefinierte Domain oder reservierte Domain (kostenpflichtige Funktion) |
| `subdomain` | string | -- | Feste Subdomain auf `ngrok-free.app` |
| `ngrok_path` | string | `"ngrok"` | Pfad zum `ngrok`-Binary |
| `inspect` | boolean | `true` | ngrok-Inspektions-Dashboard aktivieren (localhost:4040) |
| `log_level` | string | `"info"` | ngrok-Log-Level: `"debug"`, `"info"`, `"warn"`, `"error"` |
| `metadata` | string | -- | Beliebiger Metadaten-String, der an die Tunnel-Sitzung angehangt wird |
| `basic_auth` | string | -- | HTTP-Basic-Auth im Format `benutzer:passwort` |
| `ip_restrictions` | list | `[]` | Liste erlaubter CIDR-Bereiche (z.B. `["203.0.113.0/24"]`) |
| `circuit_breaker` | float | -- | Fehlerratenschwellenwert (0,0-1,0) zum Auslosen des Circuit Breakers |
| `compression` | boolean | `false` | Antwortkomprimierung aktivieren |

## Wie PRX ngrok verwaltet

Wenn der Tunnel startet, startet PRX ngrok als Kindprozess:

```bash
ngrok http 127.0.0.1:8080 \
  --authtoken=<token> \
  --region=us \
  --log=stdout \
  --log-format=json
```

PRX fragt dann die lokale ngrok-API (`http://127.0.0.1:4040/api/tunnels`) ab, um die zugewiesene offentliche URL abzurufen. Diese URL wird gespeichert und fur Webhook-Registrierung und Kanalkonfiguration verwendet.

### URL-Extraktion

ngrok stellt eine lokale API auf Port 4040 bereit. PRX pollt diesen Endpunkt mit einem Timeout:

```
GET http://localhost:4040/api/tunnels
```

Die Antwort enthalt die offentliche URL:

```json
{
  "tunnels": [
    {
      "public_url": "https://abc123.ngrok-free.app",
      "config": {
        "addr": "http://localhost:8080"
      }
    }
  ]
}
```

Wenn die API nicht innerhalb von `startup_timeout_secs` verfugbar ist, fallt PRX auf das Parsen von stdout fur die URL zuruck.

## Einschrankungen des kostenlosen Kontingents

Das kostenlose ngrok-Kontingent hat mehrere Einschrankungen, die zu beachten sind:

| Einschrankung | Kostenloses Kontingent | Auswirkung auf PRX |
|---------------|----------------------|-------------------|
| Gleichzeitige Tunnel | 1 | Nur eine PRX-Instanz pro ngrok-Konto |
| Verbindungen pro Minute | 40 | Kann hochfrequente Webhooks drosseln |
| Benutzerdefinierte Domains | Nicht verfugbar | URL andert sich bei jedem Neustart |
| IP-Einschrankungen | Nicht verfugbar | Quell-IPs konnen nicht eingeschrankt werden |
| Bandbreite | Begrenzt | Grosse Dateiubertragungen konnen gedrosselt werden |
| Zwischenseite | Beim ersten Besuch angezeigt | Kann einige Webhook-Anbieter storen |

Die Zwischenseite (ngrok's Browser-Warnseite) betrifft nicht den API/Webhook-Traffic -- sie erscheint nur fur Browser-initiierte Anfragen. Einige Webhook-Anbieter konnen jedoch Antworten ablehnen, die sie enthalten. Verwenden Sie einen kostenpflichtigen Plan oder ein anderes Backend fur die Produktion.

## ngrok-Inspektions-Dashboard

Wenn `inspect = true` (Standard), betreibt ngrok ein lokales Web-Dashboard unter `http://localhost:4040`. Dieses Dashboard bietet:

- **Anfrage-Inspektor** -- alle eingehenden Anfragen mit Headern, Body und Antwort anzeigen
- **Wiedergabe** -- jede Anfrage zum Debuggen wiedergeben
- **Tunnel-Status** -- Verbindungsgesundheit, Region und offentliche URL

Dies ist fur das Debugging von Webhook-Integrationen wahrend der Entwicklung unschatzbar.

## Sicherheitsuberlegungen

- **Auth-Token-Schutz** -- das ngrok-Auth-Token gewahrt Tunnel-Erstellungszugriff auf Ihr Konto. Speichern Sie es im PRX-Secrets-Manager oder ubergeben Sie es uber die Umgebungsvariable `NGROK_AUTHTOKEN`.
- **URLs des kostenlosen Kontingents sind offentlich** -- jeder mit der URL kann Ihren Agenten erreichen. Verwenden Sie `basic_auth` oder `ip_restrictions` (kostenpflichtig), um den Zugriff einzuschranken.
- **URL-Rotation** -- URLs des kostenlosen Kontingents andern sich bei Neustart. Wenn Webhook-Anbieter die alte URL cachen, konnen sie keine Events zustellen. Verwenden Sie reservierte Domains oder ein anderes Backend fur stabile URLs.
- **TLS-Terminierung** -- ngrok terminiert TLS an seinem Edge. Traffic zwischen ngrok und Ihrem lokalen PRX durchlauft ngrok's Infrastruktur.
- **Dateninspektion** -- ngrok's Inspektions-Dashboard zeigt Anfrage-/Antwort-Bodies. Deaktivieren Sie es in der Produktion mit `inspect = false`, wenn sensible Daten ubertragen werden.

## Webhook-Integrationsmuster

Ein gangiges Muster fur die Entwicklung: PRX mit ngrok starten, die Webhook-URL registrieren und testen:

```bash
# 1. PRX starten (Tunnel startet automatisch)
prx start

# 2. PRX protokolliert die offentliche URL
# [INFO] Tunnel started: https://abc123.ngrok-free.app

# 3. Webhook-URL bei Ihrem Dienst registrieren
# Telegram: https://abc123.ngrok-free.app/webhook/telegram
# GitHub:   https://abc123.ngrok-free.app/webhook/github

# 4. Anfragen unter http://localhost:4040 inspizieren
```

## Vergleich mit anderen Backends

| Funktion | ngrok | Cloudflare Tunnel | Tailscale Funnel |
|----------|-------|-------------------|------------------|
| Einrichtungszeit | Sekunden | Minuten | Minuten |
| Benutzerdefinierte Domain | Kostenpflichtig | Kostenlos (mit Zone) | Nur MagicDNS |
| Zero-Trust | Nein | Ja (Access) | Ja (ACLs) |
| Kostenloses Kontingent | Ja (begrenzt) | Ja | Ja (personlich) |
| Inspektions-Dashboard | Ja | Nein | Nein |
| Produktionsbereit | Kostenpflichtige Plane | Ja | Ja |

## Fehlerbehebung

| Symptom | Ursache | Losung |
|---------|---------|--------|
| "authentication failed" | Ungultiges oder fehlendes Auth-Token | `ngrok config add-authtoken <token>` ausfuhren |
| URL nicht erkannt | ngrok-API antwortet nicht auf :4040 | Prufen, ob Port 4040 nicht von einem anderen Prozess belegt ist |
| "tunnel session limit" | Kostenloses Kontingent erlaubt 1 Tunnel | Andere ngrok-Sitzungen stoppen oder upgraden |
| Webhooks geben 502 zuruck | PRX-Gateway hort nicht zu | Verifizieren, dass `local_addr` mit Ihrem Gateway ubereinstimmt |
| Zwischenseite wird angezeigt | Browser-Warnung des kostenlosen Kontingents | `--domain` verwenden oder auf kostenpflichtigen Plan upgraden |
| Zufallige Verbindungsabbruche | Verbindungslimits des kostenlosen Kontingents | Upgraden oder zu Cloudflare/Tailscale wechseln |

## Verwandte Seiten

- [Tunnel-Ubersicht](./)
- [Cloudflare Tunnel](./cloudflare)
- [Tailscale Funnel](./tailscale)
- [Sicherheits-Ubersicht](/de/prx/security/)
