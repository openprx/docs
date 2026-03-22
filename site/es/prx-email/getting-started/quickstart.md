---
title: Inicio Rápido
description: "Configura PRX-Email, crea tu primera cuenta, sincroniza tu bandeja de entrada y envía un email en menos de 5 minutos."
---

# Inicio Rápido

Esta guía te lleva de cero a una configuración de email funcional en menos de 5 minutos. Al final, tendrás PRX-Email configurado con una cuenta, la bandeja de entrada sincronizada y un email de prueba enviado.

::: tip Prerrequisitos
Necesitas Rust 1.85+ instalado. Consulta la [Guía de Instalación](./installation) para dependencias de compilación.
:::

## Paso 1: Añadir PRX-Email a tu Proyecto

Crea un nuevo proyecto Rust o añade a uno existente:

```bash
cargo new my-email-app
cd my-email-app
```

Añade la dependencia a `Cargo.toml`:

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

## Paso 2: Inicializar la Base de Datos

PRX-Email usa SQLite para toda la persistencia. Abre un store y ejecuta migraciones:

```rust
use prx_email::db::{EmailStore, EmailRepository, NewAccount};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Open (or create) a SQLite database file
    let store = EmailStore::open("./email.db")?;

    // Run migrations to create all tables
    store.migrate()?;

    // Create a repository for database operations
    let repo = EmailRepository::new(&store);

    println!("Database initialized successfully.");
    Ok(())
}
```

La base de datos se crea con modo WAL, claves foráneas habilitadas y un timeout de espera ocupada de 5 segundos por defecto.

## Paso 3: Crear una Cuenta de Email

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

## Paso 4: Configurar el Transporte y Crear el Plugin

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

## Paso 5: Sincronizar tu Bandeja de Entrada

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

## Paso 6: Listar Mensajes

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

## Paso 7: Enviar un Email

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

## Paso 8: Comprobar Métricas

```rust
let metrics = plugin.metrics_snapshot();
println!("Sync attempts: {}", metrics.sync_attempts);
println!("Sync success:  {}", metrics.sync_success);
println!("Sync failures: {}", metrics.sync_failures);
println!("Send failures: {}", metrics.send_failures);
println!("Retry count:   {}", metrics.retry_count);
```

## Lo Que Tienes Ahora

Después de completar estos pasos, tu aplicación tiene:

| Componente | Estado |
|-----------|--------|
| Base de datos SQLite | Inicializada con esquema completo |
| Cuenta de email | Creada y configurada |
| Sincronización IMAP | Conectada y obteniendo mensajes |
| Buzón de salida SMTP | Listo con pipeline de envío atómico |
| Métricas | Rastreando operaciones de sincronización y envío |

## Ajustes Comunes de Proveedores

| Proveedor | Host IMAP | Puerto IMAP | Host SMTP | Puerto SMTP | Auth |
|-----------|-----------|-------------|-----------|-------------|------|
| Gmail | `imap.gmail.com` | 993 | `smtp.gmail.com` | 465 | Contraseña de app u OAuth |
| Outlook | `outlook.office365.com` | 993 | `smtp.office365.com` | 587 | OAuth (recomendado) |
| Yahoo | `imap.mail.yahoo.com` | 993 | `smtp.mail.yahoo.com` | 465 | Contraseña de app |
| Fastmail | `imap.fastmail.com` | 993 | `smtp.fastmail.com` | 465 | Contraseña de app |

::: warning Gmail
Gmail requiere una **Contraseña de App** (con 2FA habilitado) u **OAuth 2.0**. Las contraseñas regulares no funcionan con IMAP/SMTP. Consulta la [Guía OAuth](../accounts/oauth) para instrucciones de configuración.
:::

## Siguientes Pasos

- [Configuración IMAP](../accounts/imap) -- Ajustes IMAP avanzados y sincronización de múltiples carpetas
- [Configuración SMTP](../accounts/smtp) -- Pipeline de buzón de salida, lógica de reintento y manejo de adjuntos
- [Autenticación OAuth](../accounts/oauth) -- Configura OAuth para Gmail y Outlook
- [Almacenamiento SQLite](../storage/) -- Ajuste de base de datos y planificación de capacidad
