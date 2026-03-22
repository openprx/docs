---
title: DNS-Proxy
description: "Einen lokalen DNS-Proxy ausführen, der Adblock-Filterung, IOC-Domain-Feeds und benutzerdefinierte Blocklists in einem einzigen Resolver mit vollständiger Abfrage-Protokollierung kombiniert."
---

# DNS-Proxy

Der Befehl `sd dns-proxy` startet einen lokalen DNS-Proxy-Server, der DNS-Abfragen abfängt und sie durch drei Engines filtert, bevor sie an einen vorgelagerten Resolver weitergeleitet werden:

1. **Adblock-Engine** -- blockiert Werbung, Tracker und bösartige Domains aus Filterlisten
2. **IOC-Domain-Feed** -- blockiert Domains aus Bedrohungsgeheimdienst-Indikatoren für Kompromittierung
3. **Benutzerdefinierte DNS-Blocklist** -- blockiert Domains aus benutzerdefinierten Listen

Abfragen, die einem Filter entsprechen, werden mit `0.0.0.0` (NXDOMAIN) beantwortet. Alle anderen Abfragen werden an den konfigurierten vorgelagerten DNS-Server weitergeleitet. Jede Abfrage und ihr Auflösungsstatus wird in einer JSONL-Datei protokolliert.

## Schnellstart

```bash
# DNS-Proxy mit Standardwerten starten (lauscht 127.0.0.1:53, vorgelagerter 8.8.8.8:53)
sudo sd dns-proxy
```

::: tip
Der Proxy lauscht standardmäßig auf Port 53, was Root-Rechte erfordert. Für unprivilegiertes Testen einen hohen Port wie `--listen 127.0.0.1:5353` verwenden.
:::

## Befehlsoptionen

```bash
sd dns-proxy [OPTIONS]
```

| Option | Standard | Beschreibung |
|--------|---------|-------------|
| `--listen` | `127.0.0.1:53` | Adresse und Port zum Lauschen |
| `--upstream` | `8.8.8.8:53` | Vorgelagerter DNS-Server für nicht blockierte Abfragen |
| `--log-path` | `/tmp/prx-sd-dns.log` | Pfad für die JSONL-Abfrage-Protokolldatei |

## Verwendungsbeispiele

### Grundlegende Verwendung

Proxy mit Standard-Adresse und Google DNS als Upstream starten:

```bash
sudo sd dns-proxy
```

Ausgabe:

```
>>> Starting DNS proxy (listen=127.0.0.1:53, upstream=8.8.8.8:53, log=/tmp/prx-sd-dns.log)
>>> Filter engines: adblock + dns_blocklist + ioc_domains
>>> Press Ctrl+C to stop.
```

### Benutzerdefinierte Lausch-Adresse und Upstream

Cloudflare DNS als Upstream und einen benutzerdefinierten Port verwenden:

```bash
sudo sd dns-proxy --listen 127.0.0.1:5353 --upstream 1.1.1.1:53
```

### Benutzerdefinierter Protokoll-Pfad

Abfrage-Protokolle an einen bestimmten Speicherort schreiben:

```bash
sudo sd dns-proxy --log-path /var/log/prx-sd/dns-queries.jsonl
```

### Kombination mit Adblock

Der DNS-Proxy lädt automatisch Adblock-Filterlisten aus `~/.prx-sd/adblock/`. Für beste Abdeckung:

```bash
# Schritt 1: Adblock-Listen aktivieren und synchronisieren
sudo sd adblock enable
sd adblock sync

# Schritt 2: DNS-Proxy starten (lädt Adblock-Regeln automatisch)
sudo sd dns-proxy
```

Der Proxy liest dieselben zwischengespeicherten Filterlisten wie `sd adblock`. Alle über `sd adblock add` hinzugefügten Listen sind nach dem Neustart automatisch für den Proxy verfügbar.

## System für die Proxy-Nutzung konfigurieren

### Linux (systemd-resolved)

`/etc/systemd/resolved.conf` bearbeiten:

```ini
[Resolve]
DNS=127.0.0.1
```

Dann neu starten:

```bash
sudo systemctl restart systemd-resolved
```

### Linux (resolv.conf)

```bash
echo "nameserver 127.0.0.1" | sudo tee /etc/resolv.conf
```

### macOS

```bash
sudo networksetup -setdnsservers Wi-Fi 127.0.0.1
```

Zum Rückgängigmachen:

```bash
sudo networksetup -setdnsservers Wi-Fi empty
```

::: warning
Die Umleitung des gesamten DNS-Verkehrs zum lokalen Proxy bedeutet, dass wenn der Proxy gestoppt wird, die DNS-Auflösung fehlschlägt, bis die ursprünglichen Einstellungen wiederhergestellt oder der Proxy neu gestartet wird.
:::

## Protokollformat

Der DNS-Proxy schreibt JSONL (ein JSON-Objekt pro Zeile) in den konfigurierten Protokoll-Pfad. Jeder Eintrag enthält:

```json
{
  "timestamp": "2026-03-20T14:30:00.123Z",
  "query": "ads.example.com",
  "type": "A",
  "action": "blocked",
  "filter": "adblock",
  "upstream_ms": null
}
```

```json
{
  "timestamp": "2026-03-20T14:30:00.456Z",
  "query": "docs.example.com",
  "type": "A",
  "action": "forwarded",
  "filter": null,
  "upstream_ms": 12
}
```

| Feld | Beschreibung |
|------|-------------|
| `timestamp` | ISO 8601-Zeitstempel der Abfrage |
| `query` | Der abgefragte Domain-Name |
| `type` | DNS-Eintragstyp (A, AAAA, CNAME usw.) |
| `action` | `blocked` oder `forwarded` |
| `filter` | Welcher Filter übereinstimmte: `adblock`, `ioc`, `blocklist` oder `null` |
| `upstream_ms` | Hin-und-Rück-Zeit zum vorgelagerten DNS (null wenn blockiert) |

## Architektur

```
Client DNS Query (port 53)
        |
        v
  +------------------+
  |  sd dns-proxy     |
  |                  |
  |  1. Adblock      |---> blocked? --> respond 0.0.0.0
  |  2. IOC domains  |---> blocked? --> respond 0.0.0.0
  |  3. DNS blocklist |---> blocked? --> respond 0.0.0.0
  |                  |
  |  Not blocked:    |
  |  Forward to      |---> upstream DNS (e.g. 8.8.8.8)
  |  upstream         |<--- response
  |                  |
  |  Log to JSONL    |
  +------------------+
        |
        v
  Client receives response
```

## Als Dienst ausführen

DNS-Proxy als persistenten systemd-Dienst ausführen:

```bash
# Systemd-Unit-Datei erstellen
sudo tee /etc/systemd/system/prx-sd-dns.service << 'EOF'
[Unit]
Description=PRX-SD DNS Proxy
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/sd dns-proxy --listen 127.0.0.1:53 --upstream 8.8.8.8:53 --log-path /var/log/prx-sd/dns-queries.jsonl
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Aktivieren und starten
sudo systemctl daemon-reload
sudo systemctl enable --now prx-sd-dns
```

::: tip
Für eine vollständig verwaltete Hintergrunderfahrung erwägen Sie stattdessen `sd daemon` zu verwenden, der Echtzeit-Dateiüberwachung, automatische Signatur-Updates kombiniert und um DNS-Proxy-Funktionalität erweitert werden kann.
:::

## Nächste Schritte

- [Adblock-Filterlisten](./adblock) für umfassende Domain-Blockierung konfigurieren
- [Echtzeitüberwachung](../realtime/) für Dateisystemschutz neben DNS-Filterung einrichten
- Die [Konfigurationsreferenz](../configuration/reference) für proxybezogene Einstellungen prüfen
