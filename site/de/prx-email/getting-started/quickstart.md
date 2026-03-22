---
title: Schnellstart
description: "PRX-Email einrichten, erstes Konto erstellen, Posteingang synchronisieren und in weniger als 5 Minuten eine E-Mail senden."
---

# Schnellstart

Diese Anleitung führt in weniger als 5 Minuten von null zu einem funktionierenden E-Mail-Setup. Am Ende ist PRX-Email mit einem Konto konfiguriert, der Posteingang synchronisiert und eine Test-E-Mail gesendet.

::: tip Voraussetzungen
Rust 1.85+ muss installiert sein. Build-Abhängigkeiten finden sich im [Installationshandbuch](./installation).
:::

## Schritt 1: PRX-Email zum Projekt hinzufügen

Ein neues Rust-Projekt erstellen oder zu einem bestehenden hinzufügen:

```bash
cargo new my-email-app
cd my-email-app
```

Die Abhängigkeit zur `Cargo.toml` hinzufügen:

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

## Schritt 2: Datenbank initialisieren

PRX-Email verwendet SQLite für alle Persistenz. Einen Store öffnen und Migrationen ausführen:

```rust
use prx_email::db::{EmailStore, EmailRepository, NewAccount};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // SQLite-Datenbankdatei öffnen (oder erstellen)
    let store = EmailStore::open("./email.db")?;

    // Migrationen ausführen, um alle Tabellen zu erstellen
    store.migrate()?;

    // Repository für Datenbankoperationen erstellen
    let repo = EmailRepository::new(&store);

    println!("Database initialized successfully.");
    Ok(())
}
```

Die Datenbank wird standardmäßig mit WAL-Modus, aktivierten Fremdschlüsseln und einem 5-Sekunden-Busy-Timeout erstellt.

## Schritt 3: E-Mail-Konto erstellen

```rust
let now = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)?
    .as_secs() as i64;

let account_id = repo.create_account(&NewAccount {
    email: "you@example.com".to_string(),
    display_name: Some("Your Name".to_string()),
    now_ts: now,
})?;

println!("Created account ID: {}", account_id);
```

## Schritt 4: Transport konfigurieren und Plugin erstellen

```rust
use prx_email::plugin::{
    EmailPlugin, EmailTransportConfig, ImapConfig, SmtpConfig,
    AuthConfig, AttachmentPolicy,
};

let config = EmailTransportConfig {
    imap: ImapConfig {
        host: "imap.example.com".to_string(),
        port: 993,
        user: "you@example.com".to_string(),
        auth: AuthConfig {
            password: Some("your-app-password".to_string()),
            oauth_token: None,
        },
    },
    smtp: SmtpConfig {
        host: "smtp.example.com".to_string(),
        port: 465,
        user: "you@example.com".to_string(),
        auth: AuthConfig {
            password: Some("your-app-password".to_string()),
            oauth_token: None,
        },
    },
    attachment_store: None,
    attachment_policy: AttachmentPolicy::default(),
};

let plugin = EmailPlugin::new_with_config(repo, config);
```

## Schritt 5: Posteingang synchronisieren

```rust
use prx_email::plugin::SyncRequest;

let result = plugin.sync(SyncRequest {
    account_id,
    folder: Some("INBOX".to_string()),
    cursor: None,
    now_ts: now,
    max_messages: 50,
});

match result {
    Ok(()) => println!("Inbox synced successfully."),
    Err(e) => eprintln!("Sync failed: {:?}", e),
}
```

## Schritt 6: Nachrichten auflisten

```rust
use prx_email::plugin::ListMessagesRequest;

let messages = plugin.list(ListMessagesRequest {
    account_id,
    limit: 10,
})?;

for msg in &messages {
    println!(
        "[{}] {} - {}",
        msg.message_id,
        msg.sender.as_deref().unwrap_or("unknown"),
        msg.subject.as_deref().unwrap_or("(no subject)"),
    );
}
```

## Schritt 7: E-Mail senden

```rust
use prx_email::plugin::SendEmailRequest;

let response = plugin.send(SendEmailRequest {
    account_id,
    to: "recipient@example.com".to_string(),
    subject: "Hello from PRX-Email".to_string(),
    body_text: "This is a test email sent via PRX-Email.".to_string(),
    now_ts: now,
    attachment: None,
    failure_mode: None,
});

if response.ok {
    let result = response.data.as_ref().unwrap();
    println!("Sent! Outbox ID: {}, Status: {}", result.outbox_id, result.status);
} else {
    let error = response.error.as_ref().unwrap();
    eprintln!("Send failed: {:?} - {}", error.code, error.message);
}
```

## Schritt 8: Metriken prüfen

```rust
let metrics = plugin.metrics_snapshot();
println!("Sync attempts: {}", metrics.sync_attempts);
println!("Sync success:  {}", metrics.sync_success);
println!("Sync failures: {}", metrics.sync_failures);
println!("Send failures: {}", metrics.send_failures);
println!("Retry count:   {}", metrics.retry_count);
```

## Was jetzt vorhanden ist

Nach Abschluss dieser Schritte verfügt die Anwendung über:

| Komponente | Status |
|-----------|--------|
| SQLite-Datenbank | Initialisiert mit vollständigem Schema |
| E-Mail-Konto | Erstellt und konfiguriert |
| IMAP-Synchronisation | Verbunden und Nachrichten abrufend |
| SMTP-Postausgang | Bereit mit atomarer Sende-Pipeline |
| Metriken | Verfolgt Sync- und Sendeoperationen |

## Häufige Provider-Einstellungen

| Provider | IMAP-Host | IMAP-Port | SMTP-Host | SMTP-Port | Auth |
|----------|-----------|-----------|-----------|-----------|------|
| Gmail | `imap.gmail.com` | 993 | `smtp.gmail.com` | 465 | App-Passwort oder OAuth |
| Outlook | `outlook.office365.com` | 993 | `smtp.office365.com` | 587 | OAuth (empfohlen) |
| Yahoo | `imap.mail.yahoo.com` | 993 | `smtp.mail.yahoo.com` | 465 | App-Passwort |
| Fastmail | `imap.fastmail.com` | 993 | `smtp.fastmail.com` | 465 | App-Passwort |

::: warning Gmail
Gmail erfordert entweder ein **App-Passwort** (mit aktivierter 2FA) oder **OAuth 2.0**. Normale Passwörter funktionieren nicht mit IMAP/SMTP. Setup-Anweisungen finden sich im [OAuth-Handbuch](../accounts/oauth).
:::

## Nächste Schritte

- [IMAP-Konfiguration](../accounts/imap) -- Erweiterte IMAP-Einstellungen und Multi-Ordner-Synchronisation
- [SMTP-Konfiguration](../accounts/smtp) -- Postausgangs-Pipeline, Wiederholungslogik und Anhangverarbeitung
- [OAuth-Authentifizierung](../accounts/oauth) -- OAuth für Gmail und Outlook einrichten
- [SQLite-Speicher](../storage/) -- Datenbankoptimierung und Kapazitätsplanung
