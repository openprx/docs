---
title: Konfigurationsreferenz
description: Vollständige Feld-für-Feld-Referenz für alle PRX-Konfigurationsabschnitte und -Optionen.
---

# Konfigurationsreferenz

Diese Seite dokumentiert jeden Konfigurationsabschnitt und jedes Feld in der PRX-Datei `config.toml`. Felder mit einem Standardwert können weggelassen werden -- PRX verwendet dann den Standardwert.

## Hauptebene (Standardeinstellungen)

Diese Felder erscheinen auf der Hauptebene von `config.toml`, außerhalb jedes Abschnittsheaders.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `default_provider` | `string` | `"openrouter"` | Anbieter-ID oder Alias (z.B. `"anthropic"`, `"openai"`, `"ollama"`) |
| `default_model` | `string` | `"anthropic/claude-sonnet-4.6"` | Modellbezeichner, der über den ausgewählten Anbieter geroutet wird |
| `default_temperature` | `float` | `0.7` | Sampling-Temperatur (0.0--2.0). Niedriger = deterministischer |
| `api_key` | `string?` | `null` | API-Schlüssel für den ausgewählten Anbieter. Wird durch anbieterspezifische Umgebungsvariablen überschrieben |
| `api_url` | `string?` | `null` | Basis-URL-Überschreibung für die Anbieter-API (z.B. entfernter Ollama-Endpunkt) |

```toml
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7
api_key = "sk-ant-..."
```

## `[gateway]`

HTTP-Gateway-Server für Webhook-Endpunkte, Pairing und die Web-API.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `host` | `string` | `"127.0.0.1"` | Bindungsadresse. Verwenden Sie `"0.0.0.0"` für öffentlichen Zugriff |
| `port` | `u16` | `16830` | Lauschport |
| `require_pairing` | `bool` | `true` | Geräte-Pairing erforderlich, bevor API-Anfragen akzeptiert werden |
| `allow_public_bind` | `bool` | `false` | Bindung an Nicht-Localhost ohne Tunnel erlauben |
| `pair_rate_limit_per_minute` | `u32` | `5` | Maximale Pairing-Anfragen pro Minute pro Client |
| `webhook_rate_limit_per_minute` | `u32` | `60` | Maximale Webhook-Anfragen pro Minute pro Client |
| `api_rate_limit_per_minute` | `u32` | `120` | Maximale API-Anfragen pro Minute pro authentifiziertem Token |
| `trust_forwarded_headers` | `bool` | `false` | `X-Forwarded-For` / `X-Real-IP`-Header vertrauen (nur hinter Reverse-Proxy aktivieren) |
| `request_timeout_secs` | `u64` | `300` | HTTP-Handler-Zeitlimit in Sekunden |
| `idempotency_ttl_secs` | `u64` | `300` | TTL für Webhook-Idempotenzschlüssel |

```toml
[gateway]
host = "127.0.0.1"
port = 16830
require_pairing = true
api_rate_limit_per_minute = 120
```

::: warning
Änderungen an `host` oder `port` erfordern einen vollständigen Neustart. Diese Werte werden beim Serverstart gebunden und können nicht per Hot-Reload geändert werden.
:::

## `[channels_config]`

Übergeordnete Kanalkonfiguration. Einzelne Kanäle sind verschachtelte Unterabschnitte.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `cli` | `bool` | `true` | Interaktiven CLI-Kanal aktivieren |
| `message_timeout_secs` | `u64` | `300` | Zeitlimit pro Nachrichtenverarbeitung (LLM + Werkzeuge) |

### `[channels_config.telegram]`

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `bot_token` | `string` | *(erforderlich)* | Telegram Bot-API-Token von @BotFather |
| `allowed_users` | `string[]` | `[]` | Erlaubte Telegram-Benutzer-IDs oder Benutzernamen. Leer = alle ablehnen |
| `mention_only` | `bool` | `false` | In Gruppen nur auf Nachrichten antworten, die den Bot @-erwähnen |
| `stream_mode` | `"off" \| "partial"` | `"off"` | Streaming-Modus: `off` sendet vollständige Antwort, `partial` bearbeitet einen Entwurf fortschreitend |
| `draft_update_interval_ms` | `u64` | `1000` | Mindestintervall zwischen Entwurfsbearbeitungen (Ratenbegrenzungsschutz) |
| `interrupt_on_new_message` | `bool` | `false` | Laufende Antwort abbrechen, wenn derselbe Benutzer eine neue Nachricht sendet |

```toml
[channels_config.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["alice", "bob"]
mention_only = true
stream_mode = "partial"
```

### `[channels_config.discord]`

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `bot_token` | `string` | *(erforderlich)* | Discord-Bot-Token vom Developer Portal |
| `guild_id` | `string?` | `null` | Auf eine einzelne Gilde (Server) beschränken |
| `allowed_users` | `string[]` | `[]` | Erlaubte Discord-Benutzer-IDs. Leer = alle ablehnen |
| `listen_to_bots` | `bool` | `false` | Nachrichten anderer Bots verarbeiten (eigene Nachrichten werden immer ignoriert) |
| `mention_only` | `bool` | `false` | Nur auf @-Erwähnungen antworten |

```toml
[channels_config.discord]
bot_token = "MTIz..."
guild_id = "987654321"
allowed_users = ["111222333"]
mention_only = true
```

### `[channels_config.slack]`

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `bot_token` | `string` | *(erforderlich)* | Slack-Bot-OAuth-Token (`xoxb-...`) |
| `app_token` | `string?` | `null` | App-Level-Token für Socket Mode (`xapp-...`) |
| `channel_id` | `string?` | `null` | Auf einen einzelnen Kanal beschränken |
| `allowed_users` | `string[]` | `[]` | Erlaubte Slack-Benutzer-IDs. Leer = alle ablehnen |
| `mention_only` | `bool` | `false` | In Gruppen nur auf @-Erwähnungen antworten |

### `[channels_config.lark]`

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `app_id` | `string` | *(erforderlich)* | Lark/Feishu App-ID |
| `app_secret` | `string` | *(erforderlich)* | Lark/Feishu App Secret |
| `encrypt_key` | `string?` | `null` | Ereignis-Verschlüsselungsschlüssel |
| `verification_token` | `string?` | `null` | Ereignis-Verifizierungstoken |
| `allowed_users` | `string[]` | `[]` | Erlaubte Benutzer-IDs. Leer = alle ablehnen |
| `use_feishu` | `bool` | `false` | Feishu (China) API-Endpunkte statt Lark (international) verwenden |
| `receive_mode` | `"websocket" \| "webhook"` | `"websocket"` | Nachrichtenempfangsmodus |
| `port` | `u16?` | `null` | Webhook-Lauschport (nur für Webhook-Modus) |
| `mention_only` | `bool` | `false` | Nur auf @-Erwähnungen antworten |

PRX unterstützt auch diese zusätzlichen Kanäle (konfiguriert unter `[channels_config.*]`):

- **Matrix** -- `homeserver`, `access_token`, Raum-Allowlists
- **Signal** -- über signal-cli REST API
- **WhatsApp** -- Cloud API oder Web-Modus
- **iMessage** -- nur macOS, Kontakt-Allowlists
- **DingTalk** -- Stream Mode mit `client_id` / `client_secret`
- **QQ** -- Offizielles Bot-SDK mit `app_id` / `app_secret`
- **E-Mail** -- IMAP/SMTP
- **IRC** -- Server, Kanal, Nick
- **Mattermost** -- URL + Bot-Token
- **Nextcloud Talk** -- Basis-URL + App-Token
- **Webhook** -- Generische eingehende Webhooks

## `[memory]`

Gedächtnis-Backend für Gesprächsverlauf, Wissen und Embeddings.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `backend` | `string` | `"sqlite"` | Backend-Typ: `"sqlite"`, `"lucid"`, `"postgres"`, `"markdown"`, `"none"` |
| `auto_save` | `bool` | `true` | Benutzereingaben automatisch im Gedächtnis speichern |
| `acl_enabled` | `bool` | `false` | Gedächtnis-Zugriffskontrolllisten aktivieren |
| `hygiene_enabled` | `bool` | `true` | Regelmäßige Archivierung und Aufbewahrungsbereinigung durchführen |
| `archive_after_days` | `u32` | `7` | Tages-/Sitzungsdateien älter als diesen Wert archivieren |
| `purge_after_days` | `u32` | `30` | Archivierte Dateien älter als diesen Wert löschen |
| `conversation_retention_days` | `u32` | `3` | SQLite: Gesprächszeilen älter als diesen Wert bereinigen |
| `daily_retention_days` | `u32` | `7` | SQLite: Tageszeilen älter als diesen Wert bereinigen |
| `embedding_provider` | `string` | `"none"` | Embedding-Anbieter: `"none"`, `"openai"`, `"custom:<URL>"` |
| `embedding_model` | `string` | `"text-embedding-3-small"` | Embedding-Modellname |
| `embedding_dimensions` | `usize` | `1536` | Embedding-Vektordimensionen |
| `vector_weight` | `f64` | `0.7` | Gewicht für Vektorähnlichkeit bei Hybridsuche (0.0--1.0) |
| `keyword_weight` | `f64` | `0.3` | Gewicht für BM25-Stichwortsuche (0.0--1.0) |
| `min_relevance_score` | `f64` | `0.4` | Minimale Hybrid-Punktzahl zur Aufnahme ins Gedächtnis im Kontext |
| `embedding_cache_size` | `usize` | `10000` | Maximale Embedding-Cache-Einträge vor LRU-Verdrängung |
| `snapshot_enabled` | `bool` | `false` | Kernerinnerungen nach `MEMORY_SNAPSHOT.md` exportieren |
| `snapshot_on_hygiene` | `bool` | `false` | Snapshot während Hygiene-Durchläufen ausführen |
| `auto_hydrate` | `bool` | `true` | Automatisch aus Snapshot laden, wenn `brain.db` fehlt |

```toml
[memory]
backend = "sqlite"
auto_save = true
embedding_provider = "openai"
embedding_model = "text-embedding-3-small"
embedding_dimensions = 1536
vector_weight = 0.7
keyword_weight = 0.3
```

## `[router]`

Heuristischer LLM-Router für Multi-Modell-Bereitstellungen. Bewertet Kandidatenmodelle mit einer gewichteten Formel, die Fähigkeit, Elo-Rating, Kosten und Latenz kombiniert.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `false` | Heuristisches Routing aktivieren |
| `alpha` | `f32` | `0.0` | Ähnlichkeitspunktzahl-Gewicht |
| `beta` | `f32` | `0.5` | Fähigkeitspunktzahl-Gewicht |
| `gamma` | `f32` | `0.3` | Elo-Punktzahl-Gewicht |
| `delta` | `f32` | `0.1` | Kostenstrafe-Koeffizient |
| `epsilon` | `f32` | `0.1` | Latenzstrafe-Koeffizient |
| `knn_enabled` | `bool` | `false` | KNN-semantisches Routing aus Verlauf aktivieren |
| `knn_min_records` | `usize` | `10` | Minimale Verlaufseinträge, bevor KNN das Routing beeinflusst |
| `knn_k` | `usize` | `7` | Anzahl nächster Nachbarn für die Abstimmung |

### `[router.automix]`

Adaptive Eskalationsrichtlinie: mit einem günstigen Modell beginnen, bei sinkender Konfidenz auf Premium eskalieren.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `false` | Automix-Eskalation aktivieren |
| `confidence_threshold` | `f32` | `0.7` | Eskalieren, wenn Konfidenz unter diesen Wert fällt (0.0--1.0) |
| `cheap_model_tiers` | `string[]` | `[]` | Modellebenen, die als "günstig zuerst" gelten |
| `premium_model_id` | `string` | `""` | Für Eskalation verwendetes Modell |

```toml
[router]
enabled = true
beta = 0.5
gamma = 0.3
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
premium_model_id = "anthropic/claude-sonnet-4-6"
```

## `[security]`

Betriebssystemebene-Sicherheit: Sandboxing, Ressourcenlimits und Audit-Logging.

### `[security.sandbox]`

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool?` | `null` (automatische Erkennung) | Sandbox-Isolation aktivieren |
| `backend` | `string` | `"auto"` | Backend: `"auto"`, `"landlock"`, `"firejail"`, `"bubblewrap"`, `"docker"`, `"none"` |
| `firejail_args` | `string[]` | `[]` | Benutzerdefinierte Firejail-Argumente |

### `[security.resources]`

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `max_memory_mb` | `u32` | `512` | Maximaler Speicher pro Befehl (MB) |
| `max_cpu_time_seconds` | `u64` | `60` | Maximale CPU-Zeit pro Befehl |
| `max_subprocesses` | `u32` | `10` | Maximale Anzahl von Unterprozessen |
| `memory_monitoring` | `bool` | `true` | Speichernutzungsüberwachung aktivieren |

### `[security.audit]`

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `true` | Audit-Logging aktivieren |
| `log_path` | `string` | `"audit.log"` | Pfad zur Audit-Logdatei (relativ zum Konfigurationsverzeichnis) |
| `max_size_mb` | `u32` | `100` | Maximale Loggröße vor Rotation |
| `sign_events` | `bool` | `false` | Ereignisse mit HMAC signieren zur Manipulationserkennung |

```toml
[security.sandbox]
backend = "landlock"

[security.resources]
max_memory_mb = 1024
max_cpu_time_seconds = 120

[security.audit]
enabled = true
sign_events = true
```

## `[observability]`

Metriken- und verteiltes Tracing-Backend.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `backend` | `string` | `"none"` | Backend: `"none"`, `"log"`, `"prometheus"`, `"otel"` |
| `otel_endpoint` | `string?` | `null` | OTLP-Endpunkt-URL (z.B. `"http://localhost:4318"`) |
| `otel_service_name` | `string?` | `null` | Dienstname für OTel-Collector (Standard: `"prx"`) |

```toml
[observability]
backend = "otel"
otel_endpoint = "http://localhost:4318"
otel_service_name = "prx-production"
```

## `[mcp]`

[Model Context Protocol](https://modelcontextprotocol.io/) Server-Integration. PRX fungiert als MCP-Client und verbindet sich mit externen MCP-Servern für zusätzliche Werkzeuge.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `false` | MCP-Client-Integration aktivieren |

### `[mcp.servers.<name>]`

Jeder benannte Server ist ein Unterabschnitt unter `[mcp.servers]`.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `true` | Server-spezifischer Aktivierungsschalter |
| `transport` | `"stdio" \| "http"` | `"stdio"` | Transporttyp |
| `command` | `string?` | `null` | Befehl für stdio-Modus |
| `args` | `string[]` | `[]` | Befehlsargumente für stdio-Modus |
| `url` | `string?` | `null` | URL für HTTP-Transport |
| `env` | `map<string, string>` | `{}` | Umgebungsvariablen für stdio-Modus |
| `startup_timeout_ms` | `u64` | `10000` | Start-Zeitlimit |
| `request_timeout_ms` | `u64` | `30000` | Zeitlimit pro Anfrage |
| `tool_name_prefix` | `string` | `"mcp"` | Präfix für bereitgestellte Werkzeugnamen |
| `allow_tools` | `string[]` | `[]` | Werkzeug-Allowlist (leer = alle) |
| `deny_tools` | `string[]` | `[]` | Werkzeug-Denylist |

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]

[mcp.servers.remote-api]
transport = "http"
url = "http://localhost:8090/mcp"
request_timeout_ms = 60000
```

## `[browser]`

Browser-Automatisierungswerkzeug-Konfiguration.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `false` | `browser_open`-Werkzeug aktivieren |
| `allowed_domains` | `string[]` | `[]` | Erlaubte Domains (exakter Treffer oder Subdomain-Übereinstimmung) |
| `session_name` | `string?` | `null` | Benannte Browser-Sitzung für Automatisierung |

```toml
[browser]
enabled = true
allowed_domains = ["docs.rs", "github.com", "*.example.com"]
```

## `[web_search]`

Websuche- und URL-Abruf-Werkzeugkonfiguration.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `false` | `web_search`-Werkzeug aktivieren |
| `provider` | `string` | `"duckduckgo"` | Suchanbieter: `"duckduckgo"` (kostenlos) oder `"brave"` (API-Schlüssel erforderlich) |
| `brave_api_key` | `string?` | `null` | Brave Search API-Schlüssel |
| `max_results` | `usize` | `5` | Maximale Ergebnisse pro Suche (1--10) |
| `timeout_secs` | `u64` | `15` | Anfrage-Zeitlimit |
| `fetch_enabled` | `bool` | `true` | `web_fetch`-Werkzeug aktivieren |
| `fetch_max_chars` | `usize` | `10000` | Maximale von `web_fetch` zurückgegebene Zeichen |

```toml
[web_search]
enabled = true
provider = "brave"
brave_api_key = "BSA..."
max_results = 5
fetch_enabled = true
```

## `[xin]`

Xin (Herz/Geist) autonome Aufgaben-Engine -- plant und führt Hintergrundaufgaben aus, einschließlich Evolution, Fitnessprüfungen und Hygiene-Operationen.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `false` | Xin-Aufgaben-Engine aktivieren |
| `interval_minutes` | `u32` | `5` | Tick-Intervall in Minuten (Minimum 1) |
| `max_concurrent` | `usize` | `4` | Maximale gleichzeitige Aufgabenausführungen pro Tick |
| `max_tasks` | `usize` | `128` | Maximale Gesamtaufgaben im Speicher |
| `stale_timeout_minutes` | `u32` | `60` | Minuten, bevor eine laufende Aufgabe als veraltet markiert wird |
| `builtin_tasks` | `bool` | `true` | Integrierte Systemaufgaben automatisch registrieren |
| `evolution_integration` | `bool` | `false` | Xin die Evolutions-/Fitness-Planung verwalten lassen |

```toml
[xin]
enabled = true
interval_minutes = 10
max_concurrent = 4
builtin_tasks = true
evolution_integration = true
```

## `[cost]`

Ausgabenlimits und Preise pro Modell zur Kostenverfolgung.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `false` | Kostenverfolgung aktivieren |
| `daily_limit_usd` | `f64` | `10.0` | Tägliches Ausgabenlimit in USD |
| `monthly_limit_usd` | `f64` | `100.0` | Monatliches Ausgabenlimit in USD |
| `warn_at_percent` | `u8` | `80` | Warnung, wenn Ausgaben diesen Prozentsatz des Limits erreichen |
| `allow_override` | `bool` | `false` | Anfragen erlauben, das Budget mit `--override`-Flag zu überschreiten |

```toml
[cost]
enabled = true
daily_limit_usd = 25.0
monthly_limit_usd = 500.0
warn_at_percent = 80
```

## `[reliability]`

Wiederholungs- und Fallback-Kettenkonfiguration für robusten Anbieterzugriff.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `max_retries` | `u32` | `3` | Maximale Wiederholungsversuche bei vorübergehenden Fehlern |
| `fallback_providers` | `string[]` | `[]` | Geordnete Liste von Fallback-Anbieternamen |

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

## `[secrets]`

Verschlüsselter Zugangsdatenspeicher mit ChaCha20-Poly1305.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `encrypt` | `bool` | `true` | Verschlüsselung für API-Schlüssel und Token in der Konfiguration aktivieren |

## `[auth]`

Einstellungen für den Import externer Zugangsdaten.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `codex_auth_json_auto_import` | `bool` | `true` | OAuth-Zugangsdaten automatisch aus Codex CLI `auth.json` importieren |
| `codex_auth_json_path` | `string` | `"~/.codex/auth.json"` | Pfad zur Codex CLI-Auth-Datei |

## `[proxy]`

Ausgehende HTTP/HTTPS/SOCKS5-Proxy-Konfiguration.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `false` | Proxy aktivieren |
| `http_proxy` | `string?` | `null` | HTTP-Proxy-URL |
| `https_proxy` | `string?` | `null` | HTTPS-Proxy-URL |
| `all_proxy` | `string?` | `null` | Fallback-Proxy für alle Schemata |
| `no_proxy` | `string[]` | `[]` | Umgehungsliste (gleiches Format wie `NO_PROXY`) |
| `scope` | `string` | `"zeroclaw"` | Bereich: `"environment"`, `"zeroclaw"`, `"services"` |
| `services` | `string[]` | `[]` | Dienst-Selektoren, wenn Bereich `"services"` ist |

```toml
[proxy]
enabled = true
https_proxy = "socks5://127.0.0.1:1080"
no_proxy = ["localhost", "127.0.0.1", "*.internal"]
scope = "zeroclaw"
```
