---
title: Referencia de Configuración
description: "Referencia completa de configuración para Fenfa. Opciones del archivo de configuración, variables de entorno, ajustes de almacenamiento y credenciales de la API de Apple Developer."
---

# Referencia de Configuración

Fenfa puede configurarse a través de un archivo `config.json`, variables de entorno o el panel de administración (para ajustes de runtime como almacenamiento y API de Apple).

## Precedencia de Configuración

1. **Variables de entorno** -- Prioridad más alta, sobreescriben todo
2. **Archivo config.json** -- Cargado al iniciar
3. **Valores predeterminados** -- Usados cuando no se especifica nada

## Archivo de Configuración

Crea un `config.json` en el directorio de trabajo (o móntalo en Docker):

```json
{
  "server": {
    "port": "8000",
    "primary_domain": "https://dist.example.com",
    "secondary_domains": [
      "https://cdn1.example.com",
      "https://cdn2.example.com"
    ],
    "organization": "Your Company Name",
    "bundle_id_prefix": "com.yourcompany.fenfa",
    "data_dir": "data",
    "db_path": "data/fenfa.db",
    "dev_proxy_front": "",
    "dev_proxy_admin": ""
  },
  "auth": {
    "upload_tokens": ["your-upload-token"],
    "admin_tokens": ["your-admin-token"]
  }
}
```

## Ajustes del Servidor

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `server.port` | string | `"8000"` | Puerto de escucha HTTP |
| `server.primary_domain` | string | `"http://localhost:8000"` | URL pública usada en manifiestos, callbacks y enlaces de descarga |
| `server.secondary_domains` | string[] | `[]` | Dominios adicionales (CDN, acceso alternativo) |
| `server.organization` | string | `"Fenfa Distribution"` | Nombre de organización mostrado en perfiles de configuración móvil de iOS |
| `server.bundle_id_prefix` | string | `""` | Prefijo de bundle ID para perfiles generados |
| `server.data_dir` | string | `"data"` | Directorio para la base de datos SQLite |
| `server.db_path` | string | `"data/fenfa.db"` | Ruta explícita del archivo de base de datos |
| `server.dev_proxy_front` | string | `""` | URL del servidor dev Vite para la página pública (solo desarrollo) |
| `server.dev_proxy_admin` | string | `""` | URL del servidor dev Vite para el panel de administración (solo desarrollo) |

::: warning Dominio Principal
El ajuste `primary_domain` es crítico para la distribución OTA de iOS. Debe ser la URL HTTPS que los usuarios finales acceden. Los archivos manifest de iOS usan esta URL para enlaces de descarga, y los callbacks UDID redirigen a este dominio.
:::

## Autenticación

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `auth.upload_tokens` | string[] | `["dev-upload-token"]` | Tokens para la API de subida |
| `auth.admin_tokens` | string[] | `["dev-admin-token"]` | Tokens para la API de administración (incluye permiso de subida) |

::: danger Cambiar Tokens Predeterminados
Los tokens predeterminados (`dev-upload-token` y `dev-admin-token`) son solo para desarrollo. Cámbialos siempre antes de desplegar en producción.
:::

Se soportan múltiples tokens para cada ámbito, lo que permite emitir diferentes tokens a diferentes pipelines de CI/CD o miembros del equipo y revocarlos individualmente.

## Variables de Entorno

Sobreescribe cualquier valor de configuración con variables de entorno:

| Variable | Equivalente en Config | Descripción |
|----------|-----------------------|-------------|
| `FENFA_PORT` | `server.port` | Puerto de escucha HTTP |
| `FENFA_DATA_DIR` | `server.data_dir` | Directorio de la base de datos |
| `FENFA_PRIMARY_DOMAIN` | `server.primary_domain` | URL de dominio público |
| `FENFA_ADMIN_TOKEN` | `auth.admin_tokens[0]` | Token de administrador (reemplaza el primer token) |
| `FENFA_UPLOAD_TOKEN` | `auth.upload_tokens[0]` | Token de subida (reemplaza el primer token) |

Ejemplo:

```bash
FENFA_PORT=9000 \
FENFA_PRIMARY_DOMAIN=https://dist.example.com \
FENFA_ADMIN_TOKEN=secure-random-token \
./fenfa
```

## Configuración de Almacenamiento

### Almacenamiento Local (Predeterminado)

Los archivos se almacenan en `uploads/{product_id}/{variant_id}/{release_id}/filename.ext` relativo al directorio de trabajo. No se necesita configuración adicional.

### Almacenamiento Compatible con S3

Configura el almacenamiento S3 en el panel de administración bajo **Ajustes > Almacenamiento**, o via la API:

```bash
curl -X PUT http://localhost:8000/admin/api/settings \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storage_type": "s3",
    "s3_endpoint": "https://account-id.r2.cloudflarestorage.com",
    "s3_bucket": "fenfa-uploads",
    "s3_access_key": "your-access-key",
    "s3_secret_key": "your-secret-key",
    "s3_public_url": "https://cdn.example.com"
  }'
```

Proveedores soportados:
- **Cloudflare R2** -- Sin tarifas de egreso, compatible con S3
- **AWS S3** -- S3 estándar
- **MinIO** -- Almacenamiento compatible con S3 auto-alojado
- Cualquier proveedor compatible con S3

::: tip Dominio de Subida
Si tu dominio principal tiene límites de CDN en el tamaño de archivo, configura `upload_domain` como un dominio separado que evite las restricciones de CDN para subidas de archivos grandes.
:::

## API de Apple Developer

Configura las credenciales de la API de Apple Developer para el registro automático de dispositivos. Configúralas en el panel de administración bajo **Ajustes > API de Apple Developer**, o via la API:

| Campo | Descripción |
|-------|-------------|
| `apple_key_id` | ID de clave API de App Store Connect |
| `apple_issuer_id` | ID del emisor (formato UUID) |
| `apple_private_key` | Contenido de la clave privada en formato PEM |
| `apple_team_id` | ID de tu equipo de Apple Developer |

Ver [Distribución iOS](../distribution/ios) para instrucciones de configuración.

## Base de Datos

Fenfa usa SQLite via GORM. El archivo de base de datos se crea automáticamente en el `db_path` configurado. Las migraciones se ejecutan automáticamente al iniciar.

::: info Copia de Seguridad
Para hacer una copia de seguridad de Fenfa, copia el archivo de base de datos SQLite y el directorio `uploads/`. Para almacenamiento S3, solo el archivo de base de datos necesita copia de seguridad local.
:::

## Ajustes de Desarrollo

Para desarrollo local con recarga en caliente:

```json
{
  "server": {
    "dev_proxy_front": "http://localhost:5173",
    "dev_proxy_admin": "http://localhost:5174"
  }
}
```

Cuando `dev_proxy_front` o `dev_proxy_admin` están configurados, Fenfa redirige las solicitudes al servidor de desarrollo Vite en lugar de servir el frontend embebido. Esto habilita el reemplazo de módulos en caliente durante el desarrollo.

## Siguientes Pasos

- [Despliegue con Docker](../deployment/docker) -- Configuración de Docker y volúmenes
- [Despliegue en Producción](../deployment/production) -- Proxy inverso y endurecimiento de seguridad
- [Descripción General de API](../api/) -- Detalles de autenticación de la API
