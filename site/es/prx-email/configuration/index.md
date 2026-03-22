---
title: Referencia de Configuración
description: "Referencia completa de la configuración de PRX-Email incluyendo ajustes de transporte, opciones de almacenamiento, políticas de adjuntos, variables de entorno y ajuste de runtime."
---

# Referencia de Configuración

Esta página es la referencia completa de todas las opciones de configuración, variables de entorno y ajustes de runtime de PRX-Email.

## Configuración de Transporte

El struct `EmailTransportConfig` configura tanto las conexiones IMAP como SMTP:

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

### Ajustes IMAP

| Campo | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `imap.host` | `String` | (requerido) | Nombre de host del servidor IMAP |
| `imap.port` | `u16` | (requerido) | Puerto del servidor IMAP (típicamente 993) |
| `imap.user` | `String` | (requerido) | Nombre de usuario IMAP |
| `imap.auth.password` | `Option<String>` | `None` | Contraseña para auth LOGIN |
| `imap.auth.oauth_token` | `Option<String>` | `None` | Token OAuth para XOAUTH2 |

### Ajustes SMTP

| Campo | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `smtp.host` | `String` | (requerido) | Nombre de host del servidor SMTP |
| `smtp.port` | `u16` | (requerido) | Puerto del servidor SMTP (465 o 587) |
| `smtp.user` | `String` | (requerido) | Nombre de usuario SMTP |
| `smtp.auth.password` | `Option<String>` | `None` | Contraseña para PLAIN/LOGIN |
| `smtp.auth.oauth_token` | `Option<String>` | `None` | Token OAuth para XOAUTH2 |

### Reglas de Validación

- `imap.host` y `smtp.host` no deben estar vacíos
- `imap.user` y `smtp.user` no deben estar vacíos
- Exactamente uno de `password` u `oauth_token` debe estar establecido para cada protocolo
- `attachment_policy.max_size_bytes` debe ser mayor que 0
- `attachment_policy.allowed_content_types` no debe estar vacío

## Configuración de Almacenamiento

### StoreConfig

| Campo | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `enable_wal` | `bool` | `true` | Habilitar modo de journal WAL |
| `busy_timeout_ms` | `u64` | `5000` | Timeout de ocupado de SQLite en milisegundos |
| `wal_autocheckpoint_pages` | `i64` | `1000` | Páginas entre puntos de control automáticos |
| `synchronous` | `SynchronousMode` | `Normal` | Modo de sincronización: `Full`, `Normal` o `Off` |

### Pragmas SQLite Aplicados

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;        -- when enable_wal = true
PRAGMA synchronous = NORMAL;      -- matches synchronous setting
PRAGMA wal_autocheckpoint = 1000; -- matches wal_autocheckpoint_pages
```

## Política de Adjuntos

### AttachmentPolicy

| Campo | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `max_size_bytes` | `usize` | `26,214,400` (25 MiB) | Tamaño máximo de adjunto |
| `allowed_content_types` | `HashSet<String>` | Ver abajo | Tipos MIME permitidos |

### Tipos MIME Permitidos por Defecto

| Tipo MIME | Descripción |
|-----------|-------------|
| `application/pdf` | Documentos PDF |
| `image/jpeg` | Imágenes JPEG |
| `image/png` | Imágenes PNG |
| `text/plain` | Archivos de texto plano |
| `application/zip` | Archivos ZIP |

### AttachmentStoreConfig

| Campo | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `enabled` | `bool` | (requerido) | Habilitar persistencia de adjuntos |
| `dir` | `String` | (requerido) | Directorio raíz para adjuntos almacenados |

::: warning Seguridad de Rutas
Las rutas de adjuntos se validan contra ataques de traversal de directorios. Cualquier ruta que se resuelva fuera de la raíz `dir` configurada se rechaza, incluyendo escapes basados en symlinks.
:::

## Configuración del Runner de Sincronización

### SyncRunnerConfig

| Campo | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `max_concurrency` | `usize` | `4` | Trabajos máximos por ciclo del runner |
| `base_backoff_seconds` | `i64` | `10` | Retroceso inicial en fallo |
| `max_backoff_seconds` | `i64` | `300` | Retroceso máximo (5 minutos) |

## Variables de Entorno

### Gestión de Tokens OAuth

| Variable | Descripción |
|----------|-------------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | Token de acceso OAuth IMAP |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | Token de acceso OAuth SMTP |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | Expiración del token IMAP (segundos Unix) |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | Expiración del token SMTP (segundos Unix) |

El prefijo predeterminado es `PRX_EMAIL`. Usa `reload_auth_from_env("PRX_EMAIL")` para cargarlos en runtime.

### Plugin WASM

| Variable | Predeterminado | Descripción |
|----------|----------------|-------------|
| `PRX_EMAIL_ENABLE_REAL_NETWORK` | sin establecer (deshabilitado) | Establece en `1` para habilitar IMAP/SMTP real desde el contexto WASM |

## Límites de API

| Límite | Valor | Descripción |
|--------|-------|-------------|
| Límite mínimo de list/search | 1 | Parámetro `limit` mínimo |
| Límite máximo de list/search | 500 | Parámetro `limit` máximo |
| Truncado de mensajes de debug | 160 caracteres | Los mensajes de debug del proveedor se truncan |
| Longitud del snippet del mensaje | 120 caracteres | Snippets de mensaje auto-generados |

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| `Validation` | Fallo de validación de entrada (campos vacíos, límites fuera de rango, características desconocidas) |
| `FeatureDisabled` | Operación bloqueada por indicador de característica |
| `Network` | Error de conexión o protocolo IMAP/SMTP |
| `Provider` | El proveedor de email rechazó la operación |
| `Storage` | Error de base de datos SQLite |

## Constantes del Buzón de Salida

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| Base de retroceso | 5 segundos | Retroceso de reintento inicial |
| Fórmula de retroceso | `5 * 2^retries` | Crecimiento exponencial |
| Reintentos máximos | Sin límite | Acotado por el crecimiento del retroceso |
| Clave de idempotencia | `outbox-{id}-{retries}` | Message-ID determinista |

## Indicadores de Características

| Indicador | Descripción | Nivel de Riesgo |
|-----------|-------------|----------------|
| `inbox_read` | Listar y obtener mensajes | Bajo |
| `inbox_search` | Buscar mensajes por consulta | Bajo |
| `email_send` | Enviar nuevos emails | Medio |
| `email_reply` | Responder a emails existentes | Medio |
| `outbox_retry` | Reintentar mensajes fallidos del buzón de salida | Bajo |

## Registro

PRX-Email genera logs estructurados a stderr en el formato:

```
[prx_email][structured] {"event":"...","account":...,"folder":...,"message_id":...,"run_id":...,"error_code":...}
[prx_email][debug] context | details
```

### Seguridad

- Los tokens OAuth, contraseñas y claves de API **nunca se registran**
- Las direcciones de email se redactan en los logs de debug (p. ej., `a***@example.com`)
- Los mensajes de debug del proveedor se sanitizan: los encabezados de autorización se redactan y la salida se trunca a 160 caracteres

## Siguientes Pasos

- [Instalación](../getting-started/installation) -- Configura PRX-Email
- [Gestión de Cuentas](../accounts/) -- Configura cuentas y características
- [Resolución de Problemas](../troubleshooting/) -- Resuelve problemas de configuración
