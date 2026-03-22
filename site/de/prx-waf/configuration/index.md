---
title: Konfigurationsübersicht
description: "Funktionsweise der PRX-WAF-Konfiguration. TOML-Konfigurationsdateistruktur, Umgebungsvariablen-Overrides und das Verhältnis zwischen dateibasierter und datenbankgespeicherter Konfiguration."
---

# Konfiguration

PRX-WAF wird über eine TOML-Datei konfiguriert, die über das `-c` / `--config`-Flag übergeben wird. Der Standardpfad ist `configs/default.toml`.

```bash
prx-waf -c /etc/prx-waf/config.toml run
```

## Konfigurationsquellen

PRX-WAF verwendet zwei Konfigurationsebenen:

| Quelle | Umfang | Beschreibung |
|--------|--------|-------------|
| TOML-Datei | Server-Start | Proxy-Ports, Datenbank-URL, Cache, HTTP/3, Sicherheit, Cluster |
| Datenbank | Laufzeit | Hosts, Regeln, Zertifikate, Plugins, Tunnel, Benachrichtigungen |

Die TOML-Datei enthält Einstellungen, die beim Start benötigt werden (Ports, Datenbankverbindung, Cluster-Konfiguration). Laufzeiteinstellungen wie Hosts und Regeln werden in PostgreSQL gespeichert und über die Admin-UI oder REST-API verwaltet.

## Konfigurationsdateistruktur

Die TOML-Konfigurationsdatei hat die folgenden Abschnitte:

```toml
[proxy]          # Reverse-Proxy-Listener-Adressen
[api]            # Admin-API-Listener-Adresse
[storage]        # PostgreSQL-Verbindung
[cache]          # Antwort-Cache-Einstellungen
[http3]          # HTTP/3 QUIC-Einstellungen
[security]       # Admin-API-Sicherheit (IP-Allowlist, Ratenbegrenzung, CORS)
[rules]          # Regel-Engine-Einstellungen (Verzeichnis, Hot-Reload, Quellen)
[crowdsec]       # CrowdSec-Integration
[cluster]        # Cluster-Modus (optional)
```

### Minimale Konfiguration

Eine minimale Konfiguration für die Entwicklung:

```toml
[proxy]
listen_addr = "0.0.0.0:80"

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

### Produktionskonfiguration

Eine Produktionskonfiguration mit allen Sicherheitsfunktionen:

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"
worker_threads  = 4

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url    = "postgresql://prx_waf:STRONG_PASSWORD@db.internal:5432/prx_waf"
max_connections = 20

[cache]
enabled          = true
max_size_mb      = 512
default_ttl_secs = 120
max_ttl_secs     = 3600

[security]
admin_ip_allowlist     = ["10.0.0.0/8"]
max_request_body_bytes = 10485760
api_rate_limit_rps     = 100
cors_origins           = ["https://admin.example.com"]

[rules]
dir                    = "rules/"
hot_reload             = true
reload_debounce_ms     = 500
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## Host-Konfiguration

Hosts können für statische Bereitstellungen in der TOML-Datei definiert werden:

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "127.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

::: tip
Für dynamische Umgebungen Hosts über die Admin-UI oder REST-API statt der TOML-Datei verwalten. Datenbankgespeicherte Hosts haben Vorrang vor TOML-definierten Hosts.
:::

## Datenbankmigrationen

PRX-WAF enthält 8 Migrationsdateien, die das erforderliche Datenbankschema erstellen:

```bash
# Migrationen ausführen
prx-waf -c configs/default.toml migrate

# Standard-Admin-Benutzer erstellen
prx-waf -c configs/default.toml seed-admin
```

Migrationen sind idempotent und können mehrfach sicher ausgeführt werden.

## Docker-Umgebung

In Docker-Bereitstellungen werden Konfigurationswerte typischerweise in `docker-compose.yml` gesetzt:

```yaml
services:
  prx-waf:
    environment:
      - DATABASE_URL=postgresql://prx_waf:prx_waf@postgres:5432/prx_waf
    volumes:
      - ./configs/default.toml:/app/configs/default.toml
```

## Nächste Schritte

- [Konfigurationsreferenz](./reference) -- Jeder TOML-Schlüssel dokumentiert mit Typen und Standardwerten
- [Installation](../getting-started/installation) -- Ersteinrichtung und Datenbankmigrationen
- [Cluster-Modus](../cluster/) -- Clusterspezifische Konfiguration
