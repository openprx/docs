---
title: Konfigurationsreferenz
description: "Vollständige Referenz für jeden PRX-WAF TOML-Konfigurationsschlüssel, einschließlich Typen, Standardwerten und detaillierten Beschreibungen."
---

# Konfigurationsreferenz

Diese Seite dokumentiert jeden Konfigurationsschlüssel in der PRX-WAF TOML-Konfigurationsdatei. Die Standardkonfigurationsdatei ist `configs/default.toml`.

## Proxy-Einstellungen (`[proxy]`)

Einstellungen, die den Reverse-Proxy-Listener steuern.

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `listen_addr` | `string` | `"0.0.0.0:80"` | HTTP-Listener-Adresse |
| `listen_addr_tls` | `string` | `"0.0.0.0:443"` | HTTPS-Listener-Adresse |
| `worker_threads` | `integer \| null` | `null` (CPU-Anzahl) | Anzahl der Proxy-Worker-Threads. Bei null wird die Anzahl der logischen CPU-Kerne verwendet. |

## API-Einstellungen (`[api]`)

Einstellungen für die Management-API und Admin-UI.

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `listen_addr` | `string` | `"127.0.0.1:9527"` | Admin-API + UI-Listener-Adresse. In der Produktion an `127.0.0.1` binden, um den Zugriff auf localhost zu beschränken. |

## Speicher-Einstellungen (`[storage]`)

PostgreSQL-Datenbankverbindung.

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `database_url` | `string` | `"postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"` | PostgreSQL-Verbindungs-URL |
| `max_connections` | `integer` | `20` | Maximale Anzahl von Datenbankverbindungen im Pool |

## Cache-Einstellungen (`[cache]`)

Antwort-Caching-Konfiguration mit einem In-Memory-moka-LRU-Cache.

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `enabled` | `boolean` | `true` | Antwort-Caching aktivieren |
| `max_size_mb` | `integer` | `256` | Maximale Cache-Größe in Megabyte |
| `default_ttl_secs` | `integer` | `60` | Standard-Time-to-Live für gecachte Antworten (Sekunden) |
| `max_ttl_secs` | `integer` | `3600` | Maximale TTL-Begrenzung (Sekunden). Antworten können unabhängig von Upstream-Headern nicht länger gecacht werden. |

## HTTP/3-Einstellungen (`[http3]`)

HTTP/3 via QUIC (Quinn-Bibliothek).

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `enabled` | `boolean` | `false` | HTTP/3-Unterstützung aktivieren |
| `listen_addr` | `string` | `"0.0.0.0:443"` | QUIC-Listener-Adresse (UDP) |
| `cert_pem` | `string` | -- | Pfad zum TLS-Zertifikat (PEM-Format) |
| `key_pem` | `string` | -- | Pfad zum privaten TLS-Schlüssel (PEM-Format) |

::: warning
HTTP/3 erfordert gültige TLS-Zertifikate. Sowohl `cert_pem` als auch `key_pem` müssen gesetzt sein, wenn `enabled = true`.
:::

## Sicherheitseinstellungen (`[security]`)

Admin-API- und Proxy-Sicherheitskonfiguration.

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `admin_ip_allowlist` | `string[]` | `[]` | Liste der IPs/CIDRs, die auf die Admin-API zugreifen dürfen. Leer bedeutet alle zulassen. |
| `max_request_body_bytes` | `integer` | `10485760` (10 MB) | Maximale Anfrage-Body-Größe in Bytes. Anfragen, die dies überschreiten, werden mit 413 abgelehnt. |
| `api_rate_limit_rps` | `integer` | `0` | Pro-IP-Ratenbegrenzung für die Admin-API (Anfragen pro Sekunde). `0` bedeutet deaktiviert. |
| `cors_origins` | `string[]` | `[]` | CORS-erlaubte Origins für die Admin-API. Leer bedeutet alle Origins zulassen. |

## Regel-Einstellungen (`[rules]`)

Regel-Engine-Konfiguration.

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `dir` | `string` | `"rules/"` | Verzeichnis mit Regeldateien |
| `hot_reload` | `boolean` | `true` | Dateisystemüberwachung für automatischen Regel-Reload aktivieren |
| `reload_debounce_ms` | `integer` | `500` | Entprellfenster für Dateiänderungsereignisse (Millisekunden) |
| `enable_builtin_owasp` | `boolean` | `true` | Eingebaute OWASP CRS-Regeln aktivieren |
| `enable_builtin_bot` | `boolean` | `true` | Eingebaute Bot-Erkennungsregeln aktivieren |
| `enable_builtin_scanner` | `boolean` | `true` | Eingebaute Scanner-Erkennungsregeln aktivieren |

### Regelquellen (`[[rules.sources]]`)

Mehrere Regelquellen konfigurieren (lokale Verzeichnisse oder Remote-URLs):

| Schlüssel | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `name` | `string` | Ja | Quellenname (z.B. `"custom"`, `"owasp-crs"`) |
| `path` | `string` | Nein | Lokaler Verzeichnispfad |
| `url` | `string` | Nein | Remote-URL für das Abrufen von Regeln |
| `format` | `string` | Ja | Regelformat: `"yaml"`, `"json"` oder `"modsec"` |
| `update_interval` | `integer` | Nein | Auto-Update-Intervall in Sekunden (nur Remote-Quellen) |

```toml
[[rules.sources]]
name   = "custom"
path   = "rules/custom/"
format = "yaml"

[[rules.sources]]
name            = "owasp-crs"
url             = "https://example.com/rules/owasp.yaml"
format          = "yaml"
update_interval = 86400
```

## CrowdSec-Einstellungen (`[crowdsec]`)

CrowdSec-Bedrohungsgeheimdienst-Integration.

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `enabled` | `boolean` | `false` | CrowdSec-Integration aktivieren |
| `mode` | `string` | `"bouncer"` | Integrationsmodus: `"bouncer"`, `"appsec"` oder `"both"` |
| `lapi_url` | `string` | `"http://127.0.0.1:8080"` | CrowdSec LAPI-URL |
| `api_key` | `string` | `""` | Bouncer-API-Schlüssel |
| `update_frequency_secs` | `integer` | `10` | Aktualisierungsintervall des Entscheidungscaches (Sekunden) |
| `fallback_action` | `string` | `"allow"` | Aktion, wenn LAPI nicht erreichbar ist: `"allow"`, `"block"` oder `"log"` |
| `appsec_endpoint` | `string` | -- | AppSec-HTTP-Inspektions-Endpunkt-URL (optional) |
| `appsec_key` | `string` | -- | AppSec-API-Schlüssel (optional) |

## Host-Konfiguration (`[[hosts]]`)

Statische Host-Einträge (können auch über Admin-UI/API verwaltet werden):

| Schlüssel | Typ | Erforderlich | Beschreibung |
|-----------|-----|-------------|-------------|
| `host` | `string` | Ja | Zu matchender Domainname |
| `port` | `integer` | Ja | Lausch-Port (üblicherweise 80 oder 443) |
| `remote_host` | `string` | Ja | Upstream-Backend-IP oder Hostname |
| `remote_port` | `integer` | Ja | Upstream-Backend-Port |
| `ssl` | `boolean` | Nein | HTTPS zum Upstream verwenden (Standard: false) |
| `guard_status` | `boolean` | Nein | WAF-Schutz aktivieren (Standard: true) |

## Cluster-Einstellungen (`[cluster]`)

Multi-Knoten-Cluster-Konfiguration. Siehe [Cluster-Modus](../cluster/) für Details.

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `enabled` | `boolean` | `false` | Cluster-Modus aktivieren |
| `node_id` | `string` | `""` (auto) | Eindeutiger Knotenbezeichner. Wird automatisch generiert, wenn leer. |
| `role` | `string` | `"auto"` | Knotenrolle: `"auto"`, `"main"` oder `"worker"` |
| `listen_addr` | `string` | `"0.0.0.0:16851"` | QUIC-Lausch-Adresse für Inter-Knoten-Kommunikation |
| `seeds` | `string[]` | `[]` | Seed-Knoten-Adressen für Cluster-Beitritt |

### Cluster-Krypto (`[cluster.crypto]`)

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `ca_cert` | `string` | -- | Pfad zum CA-Zertifikat (PEM) |
| `ca_key` | `string` | -- | Pfad zum privaten CA-Schlüssel (nur Main-Knoten) |
| `node_cert` | `string` | -- | Pfad zum Knotenzertifikat (PEM) |
| `node_key` | `string` | -- | Pfad zum privaten Knotenschlüssel (PEM) |
| `auto_generate` | `boolean` | `true` | Zertifikate beim ersten Start automatisch generieren |
| `ca_validity_days` | `integer` | `3650` | CA-Zertifikatsgültigkeit (Tage) |
| `node_validity_days` | `integer` | `365` | Knotenzertifikatsgültigkeit (Tage) |
| `renewal_before_days` | `integer` | `7` | So viele Tage vor Ablauf automatisch erneuern |

### Cluster-Sync (`[cluster.sync]`)

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `rules_interval_secs` | `integer` | `10` | Regel-Versions-Check-Intervall |
| `config_interval_secs` | `integer` | `30` | Konfigurations-Sync-Intervall |
| `events_batch_size` | `integer` | `100` | Ereignis-Batch bei dieser Anzahl leeren |
| `events_flush_interval_secs` | `integer` | `5` | Ereignisse leeren auch wenn Batch nicht voll |
| `stats_interval_secs` | `integer` | `10` | Statistik-Melde-Intervall |
| `events_queue_size` | `integer` | `10000` | Ereigniswarteschlangengröße (älteste bei Füllung verwerfen) |

### Cluster-Wahl (`[cluster.election]`)

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `timeout_min_ms` | `integer` | `150` | Minimaler Wahltimeout (ms) |
| `timeout_max_ms` | `integer` | `300` | Maximaler Wahltimeout (ms) |
| `heartbeat_interval_ms` | `integer` | `50` | Main-zu-Worker-Heartbeat-Intervall (ms) |
| `phi_suspect` | `float` | `8.0` | Phi-Accrual-Verdacht-Schwellenwert |
| `phi_dead` | `float` | `12.0` | Phi-Accrual-Tot-Schwellenwert |

### Cluster-Health (`[cluster.health]`)

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `check_interval_secs` | `integer` | `5` | Health-Check-Häufigkeit |
| `max_missed_heartbeats` | `integer` | `3` | Peer nach N verpassten Heartbeats als ungesund markieren |

## Vollständige Standardkonfiguration

Als Referenz die [default.toml](https://github.com/openprx/prx-waf/blob/main/configs/default.toml)-Datei im Repository konsultieren.

## Nächste Schritte

- [Konfigurationsübersicht](./index) -- Wie Konfigurationsebenen zusammenarbeiten
- [Cluster-Bereitstellung](../cluster/deployment) -- Clusterspezifische Konfiguration
- [Regel-Engine](../rules/) -- Regel-Engine-Einstellungen im Detail
