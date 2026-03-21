---
title: Tunnel & NAT-Traversal
description: Ubersicht uber das PRX-Tunnelsystem zum Exponieren lokaler Agenteninstanzen fur externe Webhooks, Kanale und Dienste.
---

# Tunnel & NAT-Traversal

PRX-Agenten mussen haufig eingehende Verbindungen empfangen -- Webhook-Callbacks von GitHub, Telegram-Updates, Slack-Events oder Inter-Knoten-Kommunikation. Beim Betrieb hinter einem NAT oder einer Firewall bietet das Tunnel-Subsystem automatischen Ingress durch Aufbau einer ausgehenden Verbindung zu einem Tunnel-Anbieter und Zuordnung einer offentlichen URL zu Ihrer lokalen PRX-Instanz.

## Warum Tunneling wichtig ist

Viele PRX-Funktionen erfordern einen offentlich erreichbaren Endpunkt:

- **Webhook-Kanale** -- Telegram, Discord, Slack und GitHub senden alle Events an eine von Ihnen bereitgestellte URL. Ohne einen offentlichen Endpunkt konnen diese Kanale keine Nachrichten an Ihren Agenten zustellen.
- **OAuth2-Callbacks** -- Anbieter-Authentifizierungsablaufe leiten den Browser an eine lokale URL um. Tunnel ermoglichen dies auch wenn PRX in einem privaten Netzwerk lauft.
- **Knoten-zu-Knoten-Kommunikation** -- Verteilte PRX-Bereitstellungen erfordern, dass Knoten einander erreichen konnen. Tunnel uberbrucken Knoten uber verschiedene Netzwerke.
- **MCP-Server-Hosting** -- Wenn PRX als MCP-Server fur externe Clients fungiert, bietet der Tunnel den offentlichen Endpunkt.

## Unterstutzte Backends

PRX wird mit vier Tunnel-Backends und einem No-Op-Fallback ausgeliefert:

| Backend | Anbieter | Kostenloses Kontingent | Benutzerdefinierte Domain | Auth erforderlich | Zero-Trust |
|---------|----------|----------------------|--------------------------|-------------------|------------|
| [Cloudflare Tunnel](./cloudflare) | Cloudflare | Ja | Ja (mit Zone) | Ja (`cloudflared`) | Ja |
| [Tailscale Funnel](./tailscale) | Tailscale | Ja (personlich) | Uber MagicDNS | Ja (Tailscale-Konto) | Ja |
| [ngrok](./ngrok) | ngrok | Ja (begrenzt) | Ja (kostenpflichtig) | Ja (Auth-Token) | Nein |
| Benutzerdefinierter Befehl | Beliebig | Abhangig | Abhangig | Abhangig | Abhangig |
| Keiner | -- | -- | -- | -- | -- |

## Architektur

Das Tunnel-Subsystem basiert auf dem `Tunnel`-Trait:

```rust
#[async_trait]
pub trait Tunnel: Send + Sync {
    /// Tunnel starten und die offentliche URL zuruckgeben.
    async fn start(&mut self) -> Result<String>;

    /// Tunnel stoppen und Ressourcen bereinigen.
    async fn stop(&mut self) -> Result<()>;

    /// Prufen, ob der Tunnel gesund ist und die offentliche URL erreichbar ist.
    async fn health_check(&self) -> Result<bool>;
}
```

Jedes Backend implementiert diesen Trait. Die `TunnelProcess`-Struktur verwaltet den zugrunde liegenden Kindprozess (z.B. `cloudflared`, `tailscale`, `ngrok`) -- handhabt Spawn, stdout/stderr-Erfassung, ordnungsgemasses Herunterfahren und automatischen Neustart bei Fehlern.

```
┌─────────────────────────────────────────────┐
│                PRX-Gateway                   │
│            (localhost:8080)                   │
└──────────────────┬──────────────────────────┘
                   │ (lokal)
┌──────────────────▼──────────────────────────┐
│              TunnelProcess                   │
│  ┌──────────────────────────────────┐       │
│  │  cloudflared / tailscale / ngrok │       │
│  │  (Kindprozess)                   │       │
│  └──────────────┬───────────────────┘       │
└─────────────────┼───────────────────────────┘
                  │ (ausgehendes TLS)
┌─────────────────▼───────────────────────────┐
│     Tunnel-Anbieter-Edge-Netzwerk            │
│    https://your-agent.example.com            │
└──────────────────────────────────────────────┘
```

## Konfiguration

Den Tunnel in `config.toml` konfigurieren:

```toml
[tunnel]
# Backend-Auswahl: "cloudflare" | "tailscale" | "ngrok" | "custom" | "none"
backend = "cloudflare"

# Lokale Adresse, an die der Tunnel Traffic weiterleitet.
# Sollte mit Ihrer Gateway-Listen-Adresse ubereinstimmen.
local_addr = "127.0.0.1:8080"

# Gesundheitsprufungsintervall in Sekunden. Der Tunnel wird neu gestartet,
# wenn die Gesundheitsprufung `max_failures`-mal hintereinander fehlschlagt.
health_check_interval_secs = 30
max_failures = 3

# Auto-Erkennung: wenn backend = "auto", sucht PRX nach verfugbaren
# Tunnel-Binaries in der Reihenfolge: cloudflared, tailscale, ngrok.
# Fallt auf "none" mit einer Warnung zuruck, wenn nichts gefunden wird.
```

### Backend-spezifische Konfiguration

Jedes Backend hat seinen eigenen Konfigurationsabschnitt. Details finden Sie auf den einzelnen Backend-Seiten:

- [Cloudflare Tunnel](./cloudflare) -- `[tunnel.cloudflare]`
- [Tailscale Funnel](./tailscale) -- `[tunnel.tailscale]`
- [ngrok](./ngrok) -- `[tunnel.ngrok]`

### Benutzerdefiniertes Befehls-Backend

Fur Tunnel-Anbieter, die nicht nativ unterstutzt werden, verwenden Sie das `custom`-Backend:

```toml
[tunnel]
backend = "custom"

[tunnel.custom]
# Der auszufuhrende Befehl. Muss Traffic auf local_addr akzeptieren und
# die offentliche URL innerhalb von startup_timeout_secs auf stdout ausgeben.
command = "bore"
args = ["local", "8080", "--to", "bore.pub"]
startup_timeout_secs = 15

# Optional: Regex zum Extrahieren der offentlichen URL aus stdout.
# Die erste Capture-Gruppe wird als URL verwendet.
url_pattern = "listening at (https?://[\\S]+)"
```

## Auto-Erkennung

Wenn `backend = "auto"`, durchsucht PRX `$PATH` nach Tunnel-Binaries in dieser Reihenfolge:

1. `cloudflared` -- bevorzugt fur seine Zero-Trust-Fahigkeiten
2. `tailscale` -- bevorzugt fur privates Mesh-Networking
3. `ngrok` -- weit verbreitet, einfache Einrichtung

Wenn keines gefunden wird, wird der Tunnel deaktiviert und PRX protokolliert eine Warnung. Webhook-abhangige Kanale funktionieren ohne einen Tunnel oder eine offentliche IP nicht.

## TunnelProcess-Lebenszyklus

Die `TunnelProcess`-Struktur verwaltet den Kindprozess-Lebenszyklus:

| Phase | Beschreibung |
|-------|-------------|
| **Spawn** | Das Tunnel-Binary mit konfigurierten Argumenten starten |
| **URL-Extraktion** | stdout auf die offentliche URL parsen (innerhalb von `startup_timeout_secs`) |
| **Uberwachung** | Periodische Gesundheitsprufungen uber HTTP GET an die offentliche URL |
| **Neustart** | Wenn `max_failures` aufeinanderfolgende Gesundheitsprufungen fehlschlagen, stoppen und neu starten |
| **Herunterfahren** | SIGTERM senden, 5 Sekunden warten, dann SIGKILL falls noch laufend |

## Umgebungsvariablen

Die Tunnel-Konfiguration kann auch uber Umgebungsvariablen gesetzt werden, die Vorrang vor `config.toml` haben:

| Variable | Beschreibung |
|----------|-------------|
| `PRX_TUNNEL_BACKEND` | Das Tunnel-Backend uberschreiben |
| `PRX_TUNNEL_LOCAL_ADDR` | Die lokale Weiterleitungsadresse uberschreiben |
| `PRX_TUNNEL_URL` | Tunnel-Start uberspringen und diese URL verwenden |
| `CLOUDFLARE_TUNNEL_TOKEN` | Cloudflare-Tunnel-Token |
| `NGROK_AUTHTOKEN` | ngrok-Authentifizierungstoken |

Das Setzen von `PRX_TUNNEL_URL` ist nutzlich, wenn Sie bereits einen Reverse-Proxy oder Load-Balancer haben, der PRX offentlich exponiert. Das Tunnel-Subsystem uberspringt die Prozessverwaltung und verwendet die bereitgestellte URL direkt.

## Sicherheitsuberlegungen

- **TLS-Terminierung** -- Alle unterstutzten Backends terminieren TLS am Anbieter-Edge. Traffic zwischen dem Anbieter und Ihrer lokalen PRX-Instanz reist uber einen verschlusselten Tunnel.
- **Zugriffskontrolle** -- Cloudflare und Tailscale unterstutzen identitatsbasierte Zugriffsrichtlinien. Verwenden Sie diese beim Exponieren sensibler Agenten-Endpunkte.
- **Anmeldedaten-Speicherung** -- Tunnel-Tokens und Auth-Schlussel werden im PRX-Secrets-Manager gespeichert. Committen Sie sie niemals in die Versionskontrolle.
- **Prozessisolierung** -- `TunnelProcess` lauft als separater Kindprozess. Er teilt keinen Speicher mit der PRX-Agenten-Laufzeit.

## Fehlerbehebung

| Symptom | Ursache | Losung |
|---------|---------|--------|
| Tunnel startet, aber Webhooks schlagen fehl | URL nicht an Kanalkonfiguration weitergegeben | Prufen, ob `tunnel.public_url` vom Kanal verwendet wird |
| Tunnel startet wiederholt neu | Gesundheitsprufung trifft falschen Endpunkt | Verifizieren, dass `local_addr` mit Ihrer Gateway-Listen-Adresse ubereinstimmt |
| "binary not found"-Fehler | Tunnel-CLI nicht installiert | Das entsprechende Binary installieren (`cloudflared`, `tailscale`, `ngrok`) |
| Timeout bei URL-Extraktion | Tunnel-Binary braucht zu lange zum Starten | `startup_timeout_secs` erhohen |

## Verwandte Seiten

- [Cloudflare Tunnel](./cloudflare)
- [Tailscale Funnel](./tailscale)
- [ngrok](./ngrok)
- [Gateway-Konfiguration](/de/prx/gateway)
- [Sicherheits-Ubersicht](/de/prx/security/)
