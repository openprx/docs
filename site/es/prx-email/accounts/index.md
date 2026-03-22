---
title: Gestión de Cuentas
description: "Crea, configura y gestiona cuentas de email en PRX-Email. Soporta configuraciones multi-cuenta con configuraciones IMAP/SMTP independientes."
---

# Gestión de Cuentas

PRX-Email soporta múltiples cuentas de email, cada una con su propia configuración IMAP y SMTP, credenciales de autenticación e indicadores de características. Las cuentas se almacenan en la base de datos SQLite y se identifican por un `account_id` único.

## Crear una Cuenta

Usa `EmailRepository` para crear una nueva cuenta:

```rust
use prx_email::db::{EmailRepository, NewAccount};

let account_id = repo.create_account(&NewAccount {
    email: "alice@example.com".to_string(),
    display_name: Some("Alice".to_string()),
    now_ts: current_timestamp(),
})?;
```

### Campos de la Cuenta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `i64` | Clave primaria auto-generada |
| `email` | `String` | Dirección de email (usada como usuario IMAP/SMTP) |
| `display_name` | `Option<String>` | Nombre legible por humanos para la cuenta |
| `created_at` | `i64` | Timestamp Unix de creación |
| `updated_at` | `i64` | Timestamp Unix de la última actualización |

## Recuperar una Cuenta

```rust
let account = repo.get_account(account_id)?;
if let Some(acct) = account {
    println!("Email: {}", acct.email);
    println!("Name: {}", acct.display_name.unwrap_or_default());
}
```

## Configuración Multi-Cuenta

Cada cuenta opera de forma independiente con su propia:

- **Conexión IMAP** -- Servidor, puerto y credenciales separados
- **Conexión SMTP** -- Servidor, puerto y credenciales separados
- **Carpetas** -- Lista de carpetas sincronizadas por cuenta
- **Estado de sincronización** -- Seguimiento de cursor por par cuenta/carpeta
- **Indicadores de características** -- Habilitación de características independiente
- **Buzón de salida** -- Cola de envío separada con seguimiento por mensaje

```rust
// Account 1: Gmail with OAuth
let gmail_id = repo.create_account(&NewAccount {
    email: "alice@gmail.com".to_string(),
    display_name: Some("Alice (Gmail)".to_string()),
    now_ts: now,
})?;

// Account 2: Work email with password
let work_id = repo.create_account(&NewAccount {
    email: "alice@company.com".to_string(),
    display_name: Some("Alice (Work)".to_string()),
    now_ts: now,
})?;
```

## Indicadores de Características

PRX-Email usa indicadores de características para controlar qué capacidades están habilitadas por cuenta. Esto soporta el despliegue gradual de nuevas características.

### Indicadores de Características Disponibles

| Indicador | Descripción |
|-----------|-------------|
| `inbox_read` | Permitir listar y leer mensajes |
| `inbox_search` | Permitir buscar mensajes |
| `email_send` | Permitir enviar nuevos emails |
| `email_reply` | Permitir responder emails |
| `outbox_retry` | Permitir reintentar mensajes fallidos del buzón de salida |

### Gestionar Indicadores de Características

```rust
// Enable a feature for a specific account
plugin.set_account_feature(account_id, "email_send", true, now)?;

// Disable a feature
plugin.set_account_feature(account_id, "email_send", false, now)?;

// Set the global default for all accounts
plugin.set_feature_default("inbox_read", true, now)?;

// Check if a feature is enabled
let enabled = plugin.is_feature_enabled(account_id, "email_send")?;
```

### Despliegue Basado en Porcentaje

Despliega características a un porcentaje de cuentas:

```rust
// Enable email_send for 50% of accounts
let enabled = plugin.apply_percentage_rollout(
    account_id,
    "email_send",
    50,  // percentage
    now,
)?;
println!("Feature enabled for this account: {}", enabled);
```

El despliegue usa `account_id % 100` para asignar cuentas a cubos de forma determinista, asegurando un comportamiento consistente entre reinicios.

## Gestión de Carpetas

Las carpetas se crean automáticamente durante la sincronización IMAP, o puedes crearlas manualmente:

```rust
use prx_email::db::NewFolder;

let folder_id = repo.create_folder(&NewFolder {
    account_id,
    name: "INBOX".to_string(),
    path: "INBOX".to_string(),
    now_ts: now,
})?;
```

### Listar Carpetas

```rust
let folders = repo.list_folders(account_id)?;
for folder in &folders {
    println!("{}: {} ({})", folder.id, folder.name, folder.path);
}
```

## Siguientes Pasos

- [Configuración IMAP](./imap) -- Configura las conexiones al servidor IMAP
- [Configuración SMTP](./smtp) -- Configura el pipeline de envío SMTP
- [Autenticación OAuth](./oauth) -- Configura OAuth para Gmail y Outlook
