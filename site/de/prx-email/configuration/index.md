---
title: Konfigurationsreferenz
description: "Vollständige Referenz für die PRX-Email-Konfiguration einschließlich Transport-Einstellungen, Speicheroptionen, Anhang-Richtlinien, Umgebungsvariablen und Laufzeitoptimierung."
---

# Konfigurationsreferenz

Diese Seite ist die vollständige Referenz für alle PRX-Email-Konfigurationsoptionen, Umgebungsvariablen und Laufzeiteinstellungen.

## Transport-Konfiguration

Das `EmailTransportConfig`-Struct konfiguriert sowohl IMAP- als auch SMTP-Verbindungen:

```rust
use prx_email::plugin::{
    EmailTransportConfig, ImapConfig, SmtpConfig, AuthConfig,
    AttachmentPolicy, AttachmentStoreConfig,
};

let config = EmailTransportConfig {
    imap: ImapConfig { /* ... */ },
    smtp: SmtpConfig { /* ... */ },
    attachment_store: Some(AttachmentStoreConfig { /* ... */ }),
    attachment_policy: AttachmentPolicy::default(),
};
```

### IMAP-Einstellungen

| Feld | Typ | Standard | Beschreibung |
|------|-----|---------|-------------|
| `imap.host` | `String` | (erforderlich) | IMAP-Server-Hostname |
| `imap.port` | `u16` | (erforderlich) | IMAP-Server-Port (typischerweise 993) |
| `imap.user` | `String` | (erforderlich) | IMAP-Benutzername |
| `imap.auth.password` | `Option<String>` | `None` | Passwort für LOGIN-Auth |
| `imap.auth.oauth_token` | `Option<String>` | `None` | OAuth-Token für XOAUTH2 |

### SMTP-Einstellungen

| Feld | Typ | Standard | Beschreibung |
|------|-----|---------|-------------|
| `smtp.host` | `String` | (erforderlich) | SMTP-Server-Hostname |
| `smtp.port` | `u16` | (erforderlich) | SMTP-Server-Port (465 oder 587) |
| `smtp.user` | `String` | (erforderlich) | SMTP-Benutzername |
| `smtp.auth.password` | `Option<String>` | `None` | Passwort für PLAIN/LOGIN |
| `smtp.auth.oauth_token` | `Option<String>` | `None` | OAuth-Token für XOAUTH2 |

### Validierungsregeln

- `imap.host` und `smtp.host` dürfen nicht leer sein
- `imap.user` und `smtp.user` dürfen nicht leer sein
- Genau eines von `password` oder `oauth_token` muss für jedes Protokoll gesetzt sein
- `attachment_policy.max_size_bytes` muss größer als 0 sein
- `attachment_policy.allowed_content_types` darf nicht leer sein

## Speicher-Konfiguration

### StoreConfig

| Feld | Typ | Standard | Beschreibung |
|------|-----|---------|-------------|
| `enable_wal` | `bool` | `true` | WAL-Journal-Modus aktivieren |
| `busy_timeout_ms` | `u64` | `5000` | SQLite Busy-Timeout in Millisekunden |
| `wal_autocheckpoint_pages` | `i64` | `1000` | Seiten zwischen automatischen Prüfpunkten |
| `synchronous` | `SynchronousMode` | `Normal` | Sync-Modus: `Full`, `Normal` oder `Off` |

### Angewendete SQLite-Pragmas

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;        -- wenn enable_wal = true
PRAGMA synchronous = NORMAL;      -- entspricht synchronous-Einstellung
PRAGMA wal_autocheckpoint = 1000; -- entspricht wal_autocheckpoint_pages
```

## Anhang-Richtlinie

### AttachmentPolicy

| Feld | Typ | Standard | Beschreibung |
|------|-----|---------|-------------|
| `max_size_bytes` | `usize` | `26.214.400` (25 MiB) | Maximale Anhangsgröße |
| `allowed_content_types` | `HashSet<String>` | Siehe unten | Erlaubte MIME-Typen |

### Standard-erlaubte MIME-Typen

| MIME-Typ | Beschreibung |
|---------|-------------|
| `application/pdf` | PDF-Dokumente |
| `image/jpeg` | JPEG-Bilder |
| `image/png` | PNG-Bilder |
| `text/plain` | Nur-Text-Dateien |
| `application/zip` | ZIP-Archive |

### AttachmentStoreConfig

| Feld | Typ | Standard | Beschreibung |
|------|-----|---------|-------------|
| `enabled` | `bool` | (erforderlich) | Anhang-Persistenz aktivieren |
| `dir` | `String` | (erforderlich) | Wurzelverzeichnis für gespeicherte Anhänge |

::: warning Pfadsicherheit
Anhangpfade werden gegen Directory-Traversal-Angriffe validiert. Jeder Pfad, der außerhalb des konfigurierten `dir`-Wurzels aufgelöst wird, wird abgelehnt, einschließlich symlink-basierter Ausbrüche.
:::

## Synchronisationsplaner-Konfiguration

### SyncRunnerConfig

| Feld | Typ | Standard | Beschreibung |
|------|-----|---------|-------------|
| `max_concurrency` | `usize` | `4` | Maximale Jobs pro Runner-Tick |
| `base_backoff_seconds` | `i64` | `10` | Anfänglicher Backoff bei Fehler |
| `max_backoff_seconds` | `i64` | `300` | Maximaler Backoff (5 Minuten) |

## Umgebungsvariablen

### OAuth-Token-Management

| Variable | Beschreibung |
|----------|-------------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | IMAP-OAuth-Zugriffstoken |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | SMTP-OAuth-Zugriffstoken |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | IMAP-Token-Ablauf (Unix-Sekunden) |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | SMTP-Token-Ablauf (Unix-Sekunden) |

Das Standardpräfix ist `PRX_EMAIL`. `reload_auth_from_env("PRX_EMAIL")` verwenden, um diese zur Laufzeit zu laden.

### WASM-Plugin

| Variable | Standard | Beschreibung |
|----------|---------|-------------|
| `PRX_EMAIL_ENABLE_REAL_NETWORK` | nicht gesetzt (deaktiviert) | Auf `1` setzen, um echtes IMAP/SMTP aus dem WASM-Kontext zu aktivieren |

## API-Limits

| Limit | Wert | Beschreibung |
|-------|------|-------------|
| List/search-Limit Minimum | 1 | Minimaler `limit`-Parameter |
| List/search-Limit Maximum | 500 | Maximaler `limit`-Parameter |
| Debug-Nachrichten-Kürzung | 160 Zeichen | Provider-Debug-Nachrichten werden gekürzt |
| Nachrichten-Snippet-Länge | 120 Zeichen | Automatisch generierte Nachrichten-Snippets |

## Fehlercodes

| Code | Beschreibung |
|------|-------------|
| `Validation` | Eingabe-Validierungsfehler (leere Felder, außerhalb des Bereichs liegende Limits, unbekannte Features) |
| `FeatureDisabled` | Operation durch Feature-Flag blockiert |
| `Network` | IMAP/SMTP-Verbindungs- oder Protokollfehler |
| `Provider` | E-Mail-Provider hat die Operation abgelehnt |
| `Storage` | SQLite-Datenbankfehler |

## Postausgangs-Konstanten

| Konstante | Wert | Beschreibung |
|-----------|------|-------------|
| Backoff-Basis | 5 Sekunden | Anfänglicher Wiederholungs-Backoff |
| Backoff-Formel | `5 * 2^retries` | Exponentielles Wachstum |
| Max. Wiederholungen | Unbegrenzt | Begrenzt durch Backoff-Wachstum |
| Idempotenzschlüssel | `outbox-{id}-{retries}` | Deterministische Message-ID |

## Feature-Flags

| Flag | Beschreibung | Risikostufe |
|------|-------------|------------|
| `inbox_read` | Nachrichten auflisten und abrufen | Niedrig |
| `inbox_search` | Nachrichten nach Abfrage durchsuchen | Niedrig |
| `email_send` | Neue E-Mails senden | Mittel |
| `email_reply` | Auf vorhandene E-Mails antworten | Mittel |
| `outbox_retry` | Fehlgeschlagene Postausgangs-Nachrichten erneut versuchen | Niedrig |

## Protokollierung

PRX-Email gibt strukturierte Logs nach stderr aus im Format:

```
[prx_email][structured] {"event":"...","account":...,"folder":...,"message_id":...,"run_id":...,"error_code":...}
[prx_email][debug] context | details
```

### Sicherheit

- OAuth-Token, Passwörter und API-Schlüssel werden **niemals protokolliert**
- E-Mail-Adressen werden in Debug-Logs geschwärzt (z.B. `a***@example.com`)
- Provider-Debug-Nachrichten werden bereinigt: Autorisierungs-Header werden geschwärzt und die Ausgabe auf 160 Zeichen gekürzt

## Nächste Schritte

- [Installation](../getting-started/installation) -- PRX-Email einrichten
- [Kontoverwaltung](../accounts/) -- Konten und Features konfigurieren
- [Fehlerbehebung](../troubleshooting/) -- Konfigurationsprobleme lösen
