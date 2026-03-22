---
title: Kontoverwaltung
description: "E-Mail-Konten in PRX-Email erstellen, konfigurieren und verwalten. Unterstützt Multi-Konto-Setups mit unabhängigen IMAP/SMTP-Konfigurationen."
---

# Kontoverwaltung

PRX-Email unterstützt mehrere E-Mail-Konten, jedes mit eigener IMAP- und SMTP-Konfiguration, Authentifizierungsdaten und Feature-Flags. Konten werden in der SQLite-Datenbank gespeichert und durch eine eindeutige `account_id` identifiziert.

## Konto erstellen

Das `EmailRepository` verwenden, um ein neues Konto zu erstellen:

```rust
use prx_email::db::{EmailRepository, NewAccount};

let account_id = repo.create_account(&NewAccount {
    email: "alice@example.com".to_string(),
    display_name: Some("Alice".to_string()),
    now_ts: current_timestamp(),
})?;
```

### Kontofelder

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `id` | `i64` | Automatisch generierter Primärschlüssel |
| `email` | `String` | E-Mail-Adresse (als IMAP/SMTP-Benutzer verwendet) |
| `display_name` | `Option<String>` | Lesbarer Name für das Konto |
| `created_at` | `i64` | Unix-Zeitstempel der Erstellung |
| `updated_at` | `i64` | Unix-Zeitstempel der letzten Aktualisierung |

## Konto abrufen

```rust
let account = repo.get_account(account_id)?;
if let Some(acct) = account {
    println!("Email: {}", acct.email);
    println!("Name: {}", acct.display_name.unwrap_or_default());
}
```

## Multi-Konto-Setup

Jedes Konto arbeitet unabhängig mit eigenem:

- **IMAP-Verbindung** -- Separater Server, Port und Anmeldedaten
- **SMTP-Verbindung** -- Separater Server, Port und Anmeldedaten
- **Ordner** -- Synchronisierte Ordnerliste pro Konto
- **Synchronisationsstatus** -- Cursor-Tracking pro Konto/Ordner-Paar
- **Feature-Flags** -- Unabhängige Feature-Aktivierung
- **Postausgang** -- Separate Sendewarteschlange mit pro-Nachrichten-Tracking

```rust
// Konto 1: Gmail mit OAuth
let gmail_id = repo.create_account(&NewAccount {
    email: "alice@gmail.com".to_string(),
    display_name: Some("Alice (Gmail)".to_string()),
    now_ts: now,
})?;

// Konto 2: Arbeitsemail mit Passwort
let work_id = repo.create_account(&NewAccount {
    email: "alice@company.com".to_string(),
    display_name: Some("Alice (Work)".to_string()),
    now_ts: now,
})?;
```

## Feature-Flags

PRX-Email verwendet Feature-Flags, um zu steuern, welche Funktionen pro Konto aktiviert sind. Dies unterstützt schrittweises Rollout neuer Features.

### Verfügbare Feature-Flags

| Flag | Beschreibung |
|------|-------------|
| `inbox_read` | Nachrichten auflisten und lesen erlauben |
| `inbox_search` | Nachrichten durchsuchen erlauben |
| `email_send` | Neue E-Mails senden erlauben |
| `email_reply` | Auf E-Mails antworten erlauben |
| `outbox_retry` | Fehlgeschlagene Postausgangs-Nachrichten erneut versuchen erlauben |

### Feature-Flags verwalten

```rust
// Feature für ein bestimmtes Konto aktivieren
plugin.set_account_feature(account_id, "email_send", true, now)?;

// Feature deaktivieren
plugin.set_account_feature(account_id, "email_send", false, now)?;

// Globalen Standard für alle Konten setzen
plugin.set_feature_default("inbox_read", true, now)?;

// Prüfen, ob ein Feature aktiviert ist
let enabled = plugin.is_feature_enabled(account_id, "email_send")?;
```

### Prozentualer Rollout

Features für einen Prozentsatz der Konten ausrollen:

```rust
// email_send für 50% der Konten aktivieren
let enabled = plugin.apply_percentage_rollout(
    account_id,
    "email_send",
    50,  // Prozentsatz
    now,
)?;
println!("Feature enabled for this account: {}", enabled);
```

Der Rollout verwendet `account_id % 100`, um Konten deterministisch Buckets zuzuweisen, wodurch konsistentes Verhalten über Neustarts hinweg gewährleistet wird.

## Ordnerverwaltung

Ordner werden automatisch während der IMAP-Synchronisation erstellt, oder manuell erstellt werden:

```rust
use prx_email::db::NewFolder;

let folder_id = repo.create_folder(&NewFolder {
    account_id,
    name: "INBOX".to_string(),
    path: "INBOX".to_string(),
    now_ts: now,
})?;
```

### Ordner auflisten

```rust
let folders = repo.list_folders(account_id)?;
for folder in &folders {
    println!("{}: {} ({})", folder.id, folder.name, folder.path);
}
```

## Nächste Schritte

- [IMAP-Konfiguration](./imap) -- IMAP-Server-Verbindungen einrichten
- [SMTP-Konfiguration](./smtp) -- SMTP-Sende-Pipeline konfigurieren
- [OAuth-Authentifizierung](./oauth) -- OAuth für Gmail und Outlook einrichten
