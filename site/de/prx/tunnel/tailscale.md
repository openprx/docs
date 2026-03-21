---
title: Tailscale Funnel
description: Ihren PRX-Agenten mit Tailscale Funnel uber Ihr Tailscale-Mesh-Netzwerk dem Internet exponieren.
---

# Tailscale Funnel

Tailscale Funnel ermoglicht es Ihnen, Ihre lokale PRX-Instanz uber Tailscales Relay-Infrastruktur dem offentlichen Internet zu exponieren. Im Gegensatz zu einem traditionellen Tunnel, der ein Drittanbieter-Edge-Netzwerk erfordert, nutzt Funnel Ihr bestehendes Tailscale-Mesh -- was es zu einer ausgezeichneten Wahl macht, wenn Ihre PRX-Knoten bereits uber Tailscale kommunizieren.

## Ubersicht

Tailscale bietet zwei komplementare Funktionen fur PRX-Konnektivitat:

| Funktion | Umfang | Anwendungsfall |
|----------|--------|---------------|
| **Tailscale Serve** | Privat (nur Tailnet) | PRX fur andere Gerate in Ihrem Tailscale-Netzwerk exponieren |
| **Tailscale Funnel** | Offentlich (Internet) | PRX fur externe Webhooks und Dienste exponieren |

PRX verwendet Funnel fur Webhook-Ingress und Serve fur Knoten-zu-Knoten-Kommunikation innerhalb eines Tailnets.

### Wie Funnel funktioniert

```
Externer Dienst (GitHub, Telegram, etc.)
         │
         ▼ HTTPS
┌─────────────────────┐
│  Tailscale DERP Relay│
│  (Tailscale-Infra)   │
└────────┬────────────┘
         │ WireGuard
┌────────▼────────────┐
│  tailscaled          │
│  (Ihre Maschine)     │
└────────┬────────────┘
         │ localhost
┌────────▼────────────┐
│  PRX-Gateway         │
│  (127.0.0.1:8080)   │
└─────────────────────┘
```

Traffic kommt an Ihrem Tailscale-MagicDNS-Hostnamen an (z.B. `prx-host.tailnet-name.ts.net`), wird uber Tailscales DERP-Relay-Netzwerk uber WireGuard geroutet und an das lokale PRX-Gateway weitergeleitet.

## Voraussetzungen

1. Tailscale auf der Maschine installiert und authentifiziert, auf der PRX lauft
2. Tailscale Funnel fur Ihr Tailnet aktiviert (erfordert Admin-Genehmigung)
3. Der Tailscale-Knoten der Maschine muss Funnel-Fahigkeit in der ACL-Richtlinie haben

### Tailscale installieren

```bash
# Debian / Ubuntu
curl -fsSL https://tailscale.com/install.sh | sh

# macOS
brew install tailscale

# Authentifizieren
sudo tailscale up
```

### Funnel in der ACL-Richtlinie aktivieren

Funnel muss explizit in der ACL-Richtlinie Ihres Tailnets erlaubt werden. Fugen Sie Folgendes zu Ihrer Tailscale-ACL-Datei hinzu (uber die Admin-Konsole):

```json
{
  "nodeAttrs": [
    {
      "target": ["autogroup:member"],
      "attr": ["funnel"]
    }
  ]
}
```

Dies gewahrt allen Mitgliedern die Funnel-Fahigkeit. Fur strengere Kontrolle ersetzen Sie `autogroup:member` durch bestimmte Benutzer oder Tags:

```json
{
  "target": ["tag:prx-agent"],
  "attr": ["funnel"]
}
```

## Konfiguration

### Grundlegende Funnel-Einrichtung

```toml
[tunnel]
backend = "tailscale"
local_addr = "127.0.0.1:8080"

[tunnel.tailscale]
# Funnel exponiert den Dienst dem offentlichen Internet.
# Auf false setzen, um Serve zu verwenden (nur Tailnet-Zugriff).
funnel = true

# Port, der uber Funnel exponiert wird. Tailscale Funnel unterstutzt
# die Ports 443, 8443 und 10000.
port = 443

# HTTPS ist fur Funnel obligatorisch. Tailscale stellt
# automatisch ein Zertifikat uber Let's Encrypt bereit.
```

### Nur-Tailnet-Setup (Serve)

Fur private Knoten-zu-Knoten-Kommunikation ohne offentliche Exponierung:

```toml
[tunnel]
backend = "tailscale"
local_addr = "127.0.0.1:8080"

[tunnel.tailscale]
funnel = false
port = 443
```

## Konfigurationsreferenz

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|-------------|
| `funnel` | boolean | `true` | `true` fur offentlichen Funnel, `false` fur Nur-Tailnet-Serve |
| `port` | integer | `443` | Offentlicher Port (Funnel unterstutzt 443, 8443, 10000) |
| `tailscale_path` | string | `"tailscale"` | Pfad zum `tailscale`-CLI-Binary |
| `hostname` | string | auto-erkannt | MagicDNS-Hostnamen uberschreiben |
| `reset_on_stop` | boolean | `true` | Funnel/Serve-Konfiguration entfernen, wenn PRX stoppt |
| `background` | boolean | `true` | `tailscale serve` im Hintergrundmodus ausfuhren |

## Wie PRX Tailscale verwaltet

Wenn der Tunnel startet, fuhrt PRX aus:

```bash
# Fur Funnel (offentlich)
tailscale funnel --bg --https=443 http://127.0.0.1:8080

# Fur Serve (privat)
tailscale serve --bg --https=443 http://127.0.0.1:8080
```

Das `--bg`-Flag fuhrt Serve/Funnel im Hintergrund innerhalb des `tailscaled`-Daemons aus. PRX muss keinen Kindprozess am Leben halten -- `tailscaled` ubernimmt die Weiterleitung.

Wenn PRX stoppt, bereinigt es durch Ausfuhren von:

```bash
tailscale funnel --https=443 off
# oder
tailscale serve --https=443 off
```

Dieses Verhalten wird durch den Parameter `reset_on_stop` gesteuert.

## Offentliche URL

Die offentliche URL fur Funnel folgt dem MagicDNS-Muster:

```
https://<maschinenname>.<tailnet-name>.ts.net
```

Wenn Ihre Maschine beispielsweise `prx-host` heisst und Ihr Tailnet `example` ist, lautet die URL:

```
https://prx-host.example.ts.net
```

PRX erkennt diesen Hostnamen automatisch durch Parsen der Ausgabe von `tailscale status --json` und konstruiert die vollstandige offentliche URL.

## Gesundheitsprufungen

PRX uberwacht den Tailscale-Tunnel mit zwei Prufungen:

1. **Tailscale-Daemon-Status** -- `tailscale status --json` muss den Knoten als verbunden melden
2. **Funnel-Erreichbarkeit** -- HTTP GET an die offentliche URL muss eine 2xx-Antwort zuruckgeben

Wenn Gesundheitsprufungen fehlschlagen, versucht PRX den Funnel durch erneutes Ausfuhren des `tailscale funnel`-Befehls wiederherzustellen. Wenn `tailscaled` selbst nicht lauft, protokolliert PRX einen Fehler und deaktiviert den Tunnel, bis sich der Daemon erholt.

## ACL-Uberlegungen

Tailscale-ACLs steuern, welche Gerate kommunizieren konnen und welche Funnel verwenden durfen. Wichtige Uberlegungen fur PRX-Bereitstellungen:

### Funnel auf PRX-Knoten beschranken

Taggen Sie Ihre PRX-Maschinen und beschranken Sie den Funnel-Zugriff:

```json
{
  "tagOwners": {
    "tag:prx-agent": ["autogroup:admin"]
  },
  "nodeAttrs": [
    {
      "target": ["tag:prx-agent"],
      "attr": ["funnel"]
    }
  ]
}
```

### Knoten-zu-Knoten-Traffic erlauben

Fur verteilte PRX-Bereitstellungen Traffic zwischen PRX-Knoten erlauben:

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:prx-agent"],
      "dst": ["tag:prx-agent:443"]
    }
  ]
}
```

## Fehlerbehebung

| Symptom | Ursache | Losung |
|---------|---------|--------|
| "Funnel not available" | ACL-Richtlinie fehlt funnel-Attribut | `funnel`-Attribut zum Knoten oder Benutzer in der ACL hinzufugen |
| "not connected"-Status | `tailscaled` lauft nicht | Tailscale-Daemon starten: `sudo tailscale up` |
| Zertifikatsfehler | DNS nicht propagiert | Auf MagicDNS-Propagierung warten (normalerweise < 1 Minute) |
| Port bereits belegt | Anderer Serve/Funnel auf demselben Port | Bestehenden entfernen: `tailscale funnel --https=443 off` |
| 502 Bad Gateway | PRX-Gateway hort nicht zu | Verifizieren, dass `local_addr` mit der Listen-Adresse Ihres Gateways ubereinstimmt |

## Verwandte Seiten

- [Tunnel-Ubersicht](./)
- [Cloudflare Tunnel](./cloudflare)
- [ngrok](./ngrok)
- [Knoten-Kopplung](/de/prx/nodes/pairing)
- [Sicherheits-Ubersicht](/de/prx/security/)
