---
title: Resolución de Problemas
description: "Soluciones para problemas comunes de PRX-Email incluyendo errores OAuth, fallos de sincronización IMAP, problemas de envío SMTP, errores SQLite y problemas del plugin WASM."
---

# Resolución de Problemas

Esta página cubre los problemas más comunes encontrados al ejecutar PRX-Email, junto con sus causas y soluciones.

## Token OAuth Expirado

**Síntomas:** Las operaciones fallan con código de error `Provider` y un mensaje sobre tokens expirados.

**Posibles Causas:**
- El token de acceso OAuth ha expirado y no hay proveedor de actualización configurado
- La variable de entorno `*_OAUTH_EXPIRES_AT` contiene un timestamp obsoleto
- El proveedor de actualización está devolviendo errores

**Soluciones:**

1. **Verificar timestamps de expiración de tokens:**

```bash
echo $PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT
echo $PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT
# These should be Unix timestamps in the future
```

2. **Recargar manualmente los tokens desde el entorno:**

```rust
// Set fresh tokens
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-token");

// Reload
plugin.reload_auth_from_env("PRX_EMAIL");
```

3. **Implementar un proveedor de actualización** para renovación automática de tokens:

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(my_refresh_provider));
```

4. **Re-ejecutar el script de bootstrap de Outlook** para obtener tokens frescos:

```bash
CLIENT_ID='...' TENANT='...' REDIRECT_URI='...' \
./scripts/outlook_oauth_bootstrap.sh
```

::: tip
PRX-Email intenta actualizar los tokens 60 segundos antes de que expiren. Si tus tokens expiran más rápido que tu intervalo de sincronización, asegúrate de que el proveedor de actualización esté conectado.
:::

## Fallo de Sincronización IMAP

**Síntomas:** `sync()` devuelve un error `Network`, o el runner de sincronización reporta fallos.

**Posibles Causas:**
- Nombre de host o puerto del servidor IMAP incorrectos
- Problemas de conectividad de red
- Fallo de autenticación (contraseña incorrecta o token OAuth expirado)
- Rate limiting del servidor IMAP

**Soluciones:**

1. **Verificar la conectividad con el servidor IMAP:**

```bash
openssl s_client -connect imap.example.com:993 -quiet
```

2. **Comprobar la configuración de transporte:**

```rust
// Ensure host and port are correct
println!("IMAP host: {}", config.imap.host);
println!("IMAP port: {}", config.imap.port);
```

3. **Verificar el modo de autenticación:**

```rust
// Must have exactly one set
assert!(config.imap.auth.password.is_some() ^ config.imap.auth.oauth_token.is_some());
```

4. **Comprobar el estado de retroceso del runner de sincronización.** Después de fallos repetidos, el programador aplica retroceso exponencial. Reinicia temporalmente usando un `now_ts` lejano en el futuro:

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &config);
```

5. **Comprobar logs estructurados** para información de error detallada:

```bash
# Look for sync-related structured logs
grep "prx_email.*sync" /path/to/logs
```

## Fallo de Envío SMTP

**Síntomas:** `send()` devuelve un `ApiResponse` con `ok: false` y un error `Network` o `Provider`.

**Posibles Causas:**
- Nombre de host o puerto del servidor SMTP incorrectos
- Fallo de autenticación
- Dirección del destinatario rechazada por el proveedor
- Rate limiting o cuota de envío superada

**Soluciones:**

1. **Comprobar el estado del buzón de salida:**

```rust
let outbox = plugin.get_outbox(outbox_id)?;
if let Some(msg) = outbox {
    println!("Status: {}", msg.status);
    println!("Retries: {}", msg.retries);
    println!("Last error: {:?}", msg.last_error);
    println!("Next attempt: {}", msg.next_attempt_at);
}
```

2. **Verificar la configuración SMTP:**

```rust
// Check auth mode
println!("Auth: password={}, oauth={}",
    config.smtp.auth.password.is_some(),
    config.smtp.auth.oauth_token.is_some());
```

3. **Comprobar errores de validación.** La API de envío rechaza:
   - `to`, `subject` o `body_text` vacíos
   - Indicador de característica `email_send` deshabilitado
   - Direcciones de email inválidas

4. **Probar con fallo simulado** para verificar el manejo de errores:

```rust
use prx_email::plugin::SendFailureMode;

let response = plugin.send(SendEmailRequest {
    // ... fields ...
    failure_mode: Some(SendFailureMode::Network), // Simulate failure
});
```

## Buzón de Salida Atascado en Estado "sending"

**Síntomas:** Los registros del buzón de salida tienen `status = 'sending'` pero el proceso se cayó antes de la finalización.

**Causa:** El proceso se cayó después de reclamar el registro del buzón de salida pero antes de finalizarlo como `sent` o `failed`.

**Solución:** Recupera manualmente los registros atascados via SQL:

```sql
-- Identify stuck rows (threshold: 15 minutes)
SELECT id, account_id, updated_at
FROM outbox
WHERE status = 'sending' AND updated_at < strftime('%s','now') - 900;

-- Recover to failed and schedule retry
UPDATE outbox
SET status = 'failed',
    last_error = 'recovered_from_stuck_sending',
    next_attempt_at = strftime('%s','now') + 30,
    updated_at = strftime('%s','now')
WHERE status = 'sending' AND updated_at < strftime('%s','now') - 900;
```

## Adjunto Rechazado

**Síntomas:** El envío falla con "attachment exceeds size limit" o "attachment content type is not allowed".

**Soluciones:**

1. **Comprobar la política de adjuntos:**

```rust
let policy = &config.attachment_policy;
println!("Max size: {} bytes", policy.max_size_bytes);
println!("Allowed types: {:?}", policy.allowed_content_types);
```

2. **Verificar el tamaño del archivo** está dentro del límite (predeterminado: 25 MiB).

3. **Añadir el tipo MIME** a la lista permitida si es seguro:

```rust
policy.allowed_content_types.insert("application/vnd.ms-excel".to_string());
```

4. **Para adjuntos basados en ruta**, asegúrate de que la ruta del archivo está bajo la raíz de almacenamiento de adjuntos configurada. Las rutas que contienen `../` o symlinks que se resuelven fuera de la raíz se rechazan.

## Error de Característica Deshabilitada

**Síntomas:** Las operaciones devuelven código de error `FeatureDisabled`.

**Causa:** El indicador de característica para la operación solicitada no está habilitado para la cuenta.

**Solución:**

```rust
// Check current state
let enabled = plugin.is_feature_enabled(account_id, "email_send")?;
println!("email_send enabled: {}", enabled);

// Enable the feature
plugin.set_account_feature(account_id, "email_send", true, now)?;

// Or set the global default
plugin.set_feature_default("email_send", true, now)?;
```

## Errores de Base de Datos SQLite

**Síntomas:** Las operaciones fallan con código de error `Storage`.

**Posibles Causas:**
- El archivo de base de datos está bloqueado por otro proceso
- El disco está lleno
- El archivo de base de datos está corrupto
- Las migraciones no se han ejecutado

**Soluciones:**

1. **Ejecutar migraciones:**

```rust
let store = EmailStore::open("./email.db")?;
store.migrate()?;
```

2. **Comprobar la base de datos bloqueada.** Solo puede haber una conexión de escritura activa a la vez. Aumenta el timeout de espera:

```rust
let config = StoreConfig {
    busy_timeout_ms: 30_000, // 30 seconds
    ..StoreConfig::default()
};
```

3. **Comprobar el espacio en disco:**

```bash
df -h .
```

4. **Reparar o recrear** si la base de datos está corrupta:

```bash
# Back up the existing database
cp email.db email.db.bak

# Check integrity
sqlite3 email.db "PRAGMA integrity_check;"

# If corrupt, export and reimport
sqlite3 email.db ".dump" | sqlite3 email_new.db
```

## Problemas del Plugin WASM

### Error de Guarda de Red

**Síntomas:** Las operaciones de email alojadas en WASM devuelven el error `EMAIL_NETWORK_GUARD`.

**Causa:** El interruptor de seguridad de red no está habilitado.

**Solución:**

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### Capacidad del Host No Disponible

**Síntomas:** Las operaciones devuelven `EMAIL_HOST_CAPABILITY_UNAVAILABLE`.

**Causa:** El runtime del host no proporciona la capacidad de email. Esto ocurre cuando se ejecuta fuera del contexto WASM.

**Solución:** Asegúrate de que el runtime de PRX está configurado para proporcionar host-calls de email al plugin.

## El Runner de Sincronización Sigue Omitiendo Trabajos

**Síntomas:** El runner de sincronización reporta `attempted: 0` aunque los trabajos están configurados.

**Causa:** Todos los trabajos están en retroceso debido a fallos previos.

**Soluciones:**

1. **Comprobar el estado de retroceso de fallos** examinando los logs estructurados.

2. **Verificar la alcanzabilidad de red** y la autenticación IMAP antes de re-ejecutar.

3. **Resetear el retroceso** usando un timestamp lejano en el futuro:

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &default_config);
```

## Alta Tasa de Fallos de Envío

**Síntomas:** Las métricas muestran un alto conteo de `send_failures`.

**Soluciones:**

1. **Inspeccionar los logs estructurados** filtrados por `run_id` y `error_code`:

```bash
grep "prx_email.*send_failed" /path/to/logs
```

2. **Comprobar el modo de auth SMTP.** Asegúrate de que exactamente uno de password u oauth_token esté establecido.

3. **Validar la disponibilidad del proveedor** antes de habilitar el despliegue amplio.

4. **Comprobar las métricas:**

```rust
let metrics = plugin.metrics_snapshot();
println!("Send failures: {}", metrics.send_failures);
println!("Retry count: {}", metrics.retry_count);
```

## Obtener Ayuda

Si ninguna de las soluciones anteriores resuelve tu problema:

1. **Comprobar los issues existentes:** [github.com/openprx/prx_email/issues](https://github.com/openprx/prx_email/issues)
2. **Abrir un nuevo issue** con:
   - Versión de PRX-Email (verifica `Cargo.toml`)
   - Versión del toolchain de Rust (`rustc --version`)
   - Salida de logs estructurados relevante
   - Pasos para reproducir

## Siguientes Pasos

- [Referencia de Configuración](../configuration/) -- Revisar todos los ajustes
- [Autenticación OAuth](../accounts/oauth) -- Resolver problemas específicos de OAuth
- [Almacenamiento SQLite](../storage/) -- Mantenimiento y recuperación de la base de datos
