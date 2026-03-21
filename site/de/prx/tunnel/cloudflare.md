---
title: Cloudflare Tunnel
description: PRX mit Cloudflare Tunnel fur Zero-Trust-Ingress mittels cloudflared integrieren.
---

# Cloudflare Tunnel

Cloudflare Tunnel (fruher Argo Tunnel) erstellt eine verschlusselte, nur ausgehende Verbindung von Ihrer PRX-Instanz zum Edge-Netzwerk von Cloudflare. Keine offentliche IP, offene Firewall-Ports oder Portweiterleitung erforderlich. Cloudflare terminiert TLS und leitet Traffic uber den Tunnel an Ihren lokalen Agenten weiter.

## Ubersicht

Cloudflare Tunnel ist das empfohlene Backend fur Produktions-PRX-Bereitstellungen, da es bietet:

- **Zero-Trust-Zugang** -- Integration mit Cloudflare Access zur Identitatsverifizierung vor dem Erreichen Ihres Agenten
- **Benutzerdefinierte Domains** -- Ihre eigene Domain mit automatischen HTTPS-Zertifikaten verwenden
- **DDoS-Schutz** -- Traffic durchlauft das Cloudflare-Netzwerk und schirmt Ihren Origin ab
- **Hohe Zuverlassigkeit** -- Cloudflare halt mehrere Edge-Verbindungen fur Redundanz aufrecht
- **Kostenloses Kontingent** -- Cloudflare Tunnel sind im kostenlosen Plan verfugbar

## Voraussetzungen

1. Ein Cloudflare-Konto (kostenloses Kontingent ist ausreichend)
2. `cloudflared`-CLI auf der Maschine installiert, auf der PRX lauft
3. Eine zu Ihrem Cloudflare-Konto hinzugefugte Domain (fur benannte Tunnel)

### cloudflared installieren

```bash
# Debian / Ubuntu
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-main.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] \
  https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared

# macOS
brew install cloudflared

# Binary-Download (alle Plattformen)
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

## Konfiguration

### Quick Tunnel (Keine Domain erforderlich)

Die einfachste Einrichtung verwendet Cloudflares Quick Tunnel, der eine zufallige `*.trycloudflare.com`-Subdomain zuweist. Keine Cloudflare-Konto-Konfiguration uber die Installation von `cloudflared` hinaus erforderlich:

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"

[tunnel.cloudflare]
# Quick-Tunnel-Modus: kein Token, kein benannter Tunnel.
# Eine zufallige trycloudflare.com-URL wird bei jedem Start zugewiesen.
mode = "quick"
```

Quick Tunnel sind ideal fur Entwicklung und Tests. Die URL andert sich bei jedem Neustart, sodass Sie Webhook-Registrierungen entsprechend aktualisieren mussen.

### Benannter Tunnel (Persistente Domain)

Fur die Produktion verwenden Sie einen benannten Tunnel mit einem stabilen Hostnamen:

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"

[tunnel.cloudflare]
mode = "named"

# Das Tunnel-Token, erhalten von `cloudflared tunnel create`.
# Kann auch uber die Umgebungsvariable CLOUDFLARE_TUNNEL_TOKEN gesetzt werden.
token = "eyJhIjoiNjY..."

# Der offentliche Hostname, der zu diesem Tunnel routet.
# Muss im Cloudflare-Dashboard oder uber cloudflared-CLI konfiguriert werden.
hostname = "agent.example.com"
```

### Einen benannten Tunnel erstellen

```bash
# 1. cloudflared mit Ihrem Cloudflare-Konto authentifizieren
cloudflared tunnel login

# 2. Einen benannten Tunnel erstellen
cloudflared tunnel create prx-agent
# Ausgabe: Created tunnel prx-agent with id <TUNNEL_ID>

# 3. Einen DNS-Eintrag erstellen, der auf den Tunnel zeigt
cloudflared tunnel route dns prx-agent agent.example.com

# 4. Das Tunnel-Token abrufen (fur config.toml)
cloudflared tunnel token prx-agent
# Ausgabe: eyJhIjoiNjY...
```

## Konfigurationsreferenz

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|-------------|
| `mode` | string | `"quick"` | `"quick"` fur zufallige URLs, `"named"` fur persistente Hostnamen |
| `token` | string | -- | Benanntes Tunnel-Token (erforderlich fur `mode = "named"`) |
| `hostname` | string | -- | Offentlicher Hostname fur benannten Tunnel |
| `cloudflared_path` | string | `"cloudflared"` | Pfad zum `cloudflared`-Binary |
| `protocol` | string | `"auto"` | Transportprotokoll: `"auto"`, `"quic"`, `"http2"` |
| `edge_ip_version` | string | `"auto"` | IP-Version fur Edge-Verbindungen: `"auto"`, `"4"`, `"6"` |
| `retries` | integer | `5` | Anzahl der Verbindungswiederholungen vor Aufgabe |
| `grace_period_secs` | integer | `30` | Sekunden Wartezeit vor dem Schliessen aktiver Verbindungen |
| `metrics_port` | integer | -- | Wenn gesetzt, `cloudflared`-Metriken auf diesem Port exponieren |
| `log_level` | string | `"info"` | `cloudflared`-Log-Level: `"debug"`, `"info"`, `"warn"`, `"error"` |

## Zero-Trust-Zugang

Cloudflare Access fugt eine Identitatsschicht vor Ihrem Tunnel hinzu. Benutzer mussen sich authentifizieren (uber SSO, E-Mail-OTP oder Service-Tokens) bevor sie Ihre PRX-Instanz erreichen.

### Zugriffsrichtlinien einrichten

1. Zum Cloudflare Zero Trust Dashboard navigieren
2. Eine Access-Anwendung fur Ihren Tunnel-Hostnamen erstellen
3. Eine Zugriffsrichtlinie mit den gewunschten Identitatsanforderungen hinzufugen

```
Cloudflare Access-Richtlinien-Beispiel:
  Anwendung: agent.example.com
  Regel: Erlauben
  Einschliessen:
    - E-Mail endet mit: @ihrefirma.com
    - Service-Token: prx-webhook-token
```

Service-Tokens sind nutzlich fur automatisierte Webhook-Sender (GitHub, Slack), die keine interaktive Authentifizierung durchfuhren konnen. Konfigurieren Sie das Token in den Headern Ihres Webhook-Anbieters:

```
CF-Access-Client-Id: <client-id>
CF-Access-Client-Secret: <client-secret>
```

## Gesundheitsprufungen

PRX uberwacht die Cloudflare-Tunnel-Gesundheit durch:

1. Prufen, ob der `cloudflared`-Kindprozess lauft
2. Senden eines HTTP GET an die offentliche URL und Verifizierung einer 2xx-Antwort
3. Parsen der `cloudflared`-Metriken (wenn `metrics_port` konfiguriert ist) fur den Verbindungsstatus

Wenn der Tunnel ungesund wird, protokolliert PRX eine Warnung und versucht `cloudflared` neu zu starten. Der Neustart folgt einer exponentiellen Backoff-Strategie: 5s, 10s, 20s, 40s, bis zu maximal 5 Minuten zwischen Versuchen.

## Logs und Debugging

`cloudflared` stdout und stderr werden von `TunnelProcess` erfasst und auf `DEBUG`-Level ins PRX-Log geschrieben. Um die Ausfuhrlichkeit zu erhohen:

```toml
[tunnel.cloudflare]
log_level = "debug"
```

Gangige Log-Nachrichten und ihre Bedeutung:

| Log-Nachricht | Bedeutung |
|---------------|---------|
| `Connection registered` | Tunnel zum Cloudflare-Edge hergestellt |
| `Retrying connection` | Edge-Verbindung abgebrochen, Wiederverbindung wird versucht |
| `Serve tunnel error` | Fataler Fehler, Tunnel wird neu gestartet |
| `Registered DNS record` | DNS-Route erfolgreich erstellt |

## Beispiel: Vollstandiges Produktions-Setup

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"
health_check_interval_secs = 30
max_failures = 3

[tunnel.cloudflare]
mode = "named"
token = "${CLOUDFLARE_TUNNEL_TOKEN}"
hostname = "agent.mycompany.com"
protocol = "quic"
retries = 5
grace_period_secs = 30
log_level = "info"
```

```bash
# Token uber Umgebungsvariable setzen
export CLOUDFLARE_TUNNEL_TOKEN="eyJhIjoiNjY..."

# PRX starten -- Tunnel startet automatisch
prx start
```

## Sicherheitshinweise

- Das Tunnel-Token gewahrt vollen Zugriff auf den benannten Tunnel. Speichern Sie es im PRX-Secrets-Manager oder ubergeben Sie es uber Umgebungsvariable. Committen Sie es niemals in die Versionskontrolle.
- Quick Tunnel unterstutzen keine Access-Richtlinien. Verwenden Sie benannte Tunnel fur die Produktion.
- `cloudflared` lauft als Kindprozess mit denselben Benutzerberechtigungen wie PRX. Erwagen Sie, PRX unter einem dedizierten Dienstkonto mit minimalen Berechtigungen auszufuhren.
- Der gesamte Traffic zwischen `cloudflared` und Cloudflares Edge ist mit TLS 1.3 oder QUIC verschlusselt.

## Verwandte Seiten

- [Tunnel-Ubersicht](./)
- [Tailscale Funnel](./tailscale)
- [ngrok](./ngrok)
- [Sicherheits-Ubersicht](/de/prx/security/)
- [Secrets-Verwaltung](/de/prx/security/secrets)
