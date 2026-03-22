---
title: Autenticación OAuth
description: "Configura la autenticación XOAUTH2 de OAuth 2.0 para PRX-Email con Gmail y Outlook. Gestión del ciclo de vida de tokens, proveedores de actualización y recarga en caliente."
---

# Autenticación OAuth

PRX-Email soporta autenticación OAuth 2.0 via el mecanismo XOAUTH2 tanto para IMAP como para SMTP. Esto es requerido para Outlook/Office 365 y recomendado para Gmail. El plugin proporciona seguimiento de expiración de tokens, proveedores de actualización conectables y recarga en caliente desde el entorno.

## Cómo Funciona XOAUTH2

XOAUTH2 reemplaza la autenticación tradicional por contraseña con un token de acceso OAuth. El cliente envía una cadena con formato especial durante IMAP AUTHENTICATE o SMTP AUTH:

```
user=<email>\x01auth=Bearer <access_token>\x01\x01
```

PRX-Email maneja esto automáticamente cuando `auth.oauth_token` está establecido.

## Configuración OAuth de Gmail

### 1. Crear Credenciales de Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Habilita la API de Gmail
4. Crea credenciales OAuth 2.0 (tipo de aplicación de escritorio)
5. Anota el **Client ID** y el **Client Secret**

### 2. Obtener un Token de Acceso

Usa el playground OAuth de Google o tu propio flujo OAuth para obtener un token de acceso con los siguientes scopes:

- `https://mail.google.com/` (acceso completo IMAP/SMTP)

### 3. Configurar PRX-Email

```rust
use prx_email::plugin::{AuthConfig, ImapConfig, SmtpConfig};

let auth = AuthConfig {
    password: None,
    oauth_token: Some("ya29.your-access-token-here".to_string()),
};

let imap = ImapConfig {
    host: "imap.gmail.com".to_string(),
    port: 993,
    user: "you@gmail.com".to_string(),
    auth: auth.clone(),
};

let smtp = SmtpConfig {
    host: "smtp.gmail.com".to_string(),
    port: 465,
    user: "you@gmail.com".to_string(),
    auth,
};
```

## Configuración OAuth de Outlook

PRX-Email incluye un script de bootstrap para Outlook/Office 365 OAuth que maneja el flujo completo de código de autorización.

### 1. Registrar una App de Azure

1. Ve a [Azure Portal App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Registra una nueva aplicación
3. Establece una URI de redirección (p. ej., `http://localhost:53682/callback`)
4. Anota el **Application (client) ID** y el **Directory (tenant) ID**
5. En Permisos de API, añade:
   - `offline_access`
   - `https://outlook.office.com/IMAP.AccessAsUser.All`
   - `https://outlook.office.com/SMTP.Send`

### 2. Ejecutar el Script de Bootstrap

```bash
cd /path/to/prx_email
chmod +x scripts/outlook_oauth_bootstrap.sh

CLIENT_ID='your-azure-client-id' \
TENANT='your-tenant-id-or-common' \
REDIRECT_URI='http://localhost:53682/callback' \
./scripts/outlook_oauth_bootstrap.sh
```

El script:
1. Imprime una URL de autorización -- ábrela en tu navegador
2. Espera a que pegues la URL de callback o el código de autorización
3. Intercambia el código por tokens de acceso y actualización
4. Guarda los tokens en `./outlook_oauth.local.env` con `chmod 600`

### Opciones del Script

| Indicador | Descripción |
|-----------|-------------|
| `--output <file>` | Ruta de salida personalizada (por defecto: `./outlook_oauth.local.env`) |
| `--dry-run` | Imprime la URL de autorización y sale |
| `-h`, `--help` | Muestra información de uso |

### Variables de Entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `CLIENT_ID` | Sí | ID de cliente de la aplicación Azure |
| `TENANT` | Sí | ID de tenant, o `common`/`organizations`/`consumers` |
| `REDIRECT_URI` | Sí | URI de redirección registrada en la app Azure |
| `SCOPE` | No | Scopes personalizados (por defecto: IMAP + SMTP + offline_access) |

::: warning Seguridad
Nunca confirmes el archivo de tokens generado. Añade `*.local.env` a tu `.gitignore`.
:::

### 3. Cargar Tokens

Después de que el script de bootstrap genere los tokens, carga el archivo env y configura PRX-Email:

```bash
source ./outlook_oauth.local.env
```

```rust
let auth = AuthConfig {
    password: None,
    oauth_token: Some(std::env::var("OUTLOOK_ACCESS_TOKEN")?),
};
```

## Gestión del Ciclo de Vida de Tokens

### Seguimiento de Expiración

PRX-Email rastrea los timestamps de expiración de tokens OAuth por protocolo (IMAP/SMTP):

```rust
// Set expiry via environment
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800000000");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800000000");
```

Antes de cada operación, el plugin verifica si el token expira en 60 segundos. Si lo hace, se intenta una actualización.

### Proveedor de Actualización Conectable

Implementa el trait `OAuthRefreshProvider` para manejar la actualización automática de tokens:

```rust
use prx_email::plugin::{
    OAuthRefreshProvider, RefreshedOAuthToken, ApiError, ErrorCode,
};

struct MyRefreshProvider {
    client_id: String,
    client_secret: String,
    refresh_token: String,
}

impl OAuthRefreshProvider for MyRefreshProvider {
    fn refresh_token(
        &self,
        protocol: &str,
        user: &str,
        current_token: &str,
    ) -> Result<RefreshedOAuthToken, ApiError> {
        // Call your OAuth provider's token endpoint
        // Return the new access token and optional expiry
        Ok(RefreshedOAuthToken {
            token: "new-access-token".to_string(),
            expires_at: Some(now + 3600),
        })
    }
}
```

Adjunta el proveedor al crear el plugin:

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(MyRefreshProvider {
        client_id: "...".to_string(),
        client_secret: "...".to_string(),
        refresh_token: "...".to_string(),
    }));
```

### Recarga en Caliente desde el Entorno

Recarga los tokens OAuth en runtime sin reiniciar:

```rust
// Set new tokens in environment
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-imap-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-smtp-token");
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800003600");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800003600");

// Trigger reload
plugin.reload_auth_from_env("PRX_EMAIL");
```

El método `reload_auth_from_env` lee variables de entorno con el prefijo dado y actualiza los tokens OAuth IMAP/SMTP y los timestamps de expiración. Cuando se carga un token OAuth, la contraseña correspondiente se borra para mantener el invariante de uno-de-dos-auth.

### Recarga Completa de Configuración

Para una reconfiguración completa del transporte:

```rust
plugin.reload_config(new_transport_config)?;
```

Esto valida la nueva configuración y reemplaza la configuración de transporte completa de forma atómica.

## Variables de Entorno OAuth

| Variable | Descripción |
|----------|-------------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | Token de acceso OAuth IMAP |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | Token de acceso OAuth SMTP |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | Expiración del token IMAP (segundos Unix) |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | Expiración del token SMTP (segundos Unix) |

El prefijo se pasa a `reload_auth_from_env()`. Para la configuración predeterminada de PRX-Email, usa `PRX_EMAIL` como prefijo.

## Mejores Prácticas de Seguridad

1. **Nunca registres tokens.** PRX-Email sanitiza los mensajes de debug y redacta el contenido relacionado con autorización.
2. **Usa tokens de actualización.** Los tokens de acceso expiran; siempre implementa un proveedor de actualización para uso en producción.
3. **Almacena los tokens de forma segura.** Usa permisos de archivo (`chmod 600`) y nunca confirmes archivos de tokens en control de versiones.
4. **Rota los tokens regularmente.** Incluso con actualización automática, verifica periódicamente que los tokens se estén rotando.

## Siguientes Pasos

- [Gestión de Cuentas](./index) -- Gestionar cuentas e indicadores de características
- [Referencia de Configuración](../configuration/) -- Todas las variables de entorno y ajustes
- [Resolución de Problemas](../troubleshooting/) -- Resolución de errores relacionados con OAuth
