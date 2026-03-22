---
title: Descripción General de la API
description: "Referencia de la API REST de Fenfa. Autenticación basada en tokens, respuestas JSON y endpoints para subir builds, gestionar productos y consultar analíticas."
---

# Descripción General de la API

Fenfa expone una API REST para subir builds, gestionar productos y consultar analíticas. Todas las interacciones programáticas -- desde subidas de CI/CD hasta operaciones del panel de administración -- pasan por esta API.

## URL Base

Todos los endpoints de la API son relativos a la URL de tu servidor Fenfa:

```
https://your-domain.com
```

## Autenticación

Los endpoints protegidos requieren un encabezado `X-Auth-Token`. Fenfa usa dos ámbitos de token:

| Ámbito | Puede Hacer | Encabezado |
|--------|-------------|------------|
| `upload` | Subir builds | `X-Auth-Token: YOUR_UPLOAD_TOKEN` |
| `admin` | Acceso completo de administrador (incluye subida) | `X-Auth-Token: YOUR_ADMIN_TOKEN` |

Los tokens se configuran en `config.json` o via variables de entorno. Ver [Configuración](../configuration/).

::: warning
Las solicitudes a endpoints protegidos sin un token válido reciben una respuesta `401 Unauthorized`.
:::

## Formato de Respuesta

Todas las respuestas JSON siguen una estructura unificada:

**Éxito:**

```json
{
  "ok": true,
  "data": { ... }
}
```

**Error:**

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### Códigos de Error

| Código | Estado HTTP | Descripción |
|--------|-------------|-------------|
| `BAD_REQUEST` | 400 | Parámetros de solicitud inválidos |
| `UNAUTHORIZED` | 401 | Token de autenticación ausente o inválido |
| `FORBIDDEN` | 403 | El token carece del ámbito requerido |
| `NOT_FOUND` | 404 | Recurso no encontrado |
| `INTERNAL_ERROR` | 500 | Error del servidor |

## Resumen de Endpoints

### Endpoints Públicos (Sin Auth)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/products/:slug` | Página de descarga del producto (HTML) |
| GET | `/d/:releaseID` | Descarga directa de archivo |
| GET | `/ios/:releaseID/manifest.plist` | Manifiesto OTA de iOS |
| GET | `/udid/profile.mobileconfig?variant=:id` | Perfil de vinculación UDID |
| POST | `/udid/callback` | Callback UDID (desde iOS) |
| GET | `/udid/status?variant=:id` | Estado de vinculación UDID |
| GET | `/healthz` | Comprobación de salud |

### Endpoints de Subida (Token de Subida)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/upload` | Subir un archivo de build |

### Endpoints de Administración (Token de Admin)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/admin/api/smart-upload` | Subida inteligente con detección automática |
| GET | `/admin/api/products` | Listar productos |
| POST | `/admin/api/products` | Crear producto |
| GET | `/admin/api/products/:id` | Obtener producto con variantes |
| PUT | `/admin/api/products/:id` | Actualizar producto |
| DELETE | `/admin/api/products/:id` | Eliminar producto |
| POST | `/admin/api/products/:id/variants` | Crear variante |
| PUT | `/admin/api/variants/:id` | Actualizar variante |
| DELETE | `/admin/api/variants/:id` | Eliminar variante |
| GET | `/admin/api/variants/:id/stats` | Estadísticas de variante |
| DELETE | `/admin/api/releases/:id` | Eliminar versión |
| PUT | `/admin/api/apps/:id/publish` | Publicar app |
| PUT | `/admin/api/apps/:id/unpublish` | Despublicar app |
| GET | `/admin/api/events` | Consultar eventos |
| GET | `/admin/api/ios_devices` | Listar dispositivos iOS |
| POST | `/admin/api/devices/:id/register-apple` | Registrar dispositivo con Apple |
| POST | `/admin/api/devices/register-apple` | Registro en lote de dispositivos |
| GET | `/admin/api/settings` | Obtener ajustes |
| PUT | `/admin/api/settings` | Actualizar ajustes |
| GET | `/admin/api/upload-config` | Obtener configuración de subida |
| GET | `/admin/api/apple/status` | Estado de la API de Apple |
| GET | `/admin/api/apple/devices` | Dispositivos registrados en Apple |

### Endpoints de Exportación (Token de Admin)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/admin/exports/releases.csv` | Exportar versiones |
| GET | `/admin/exports/events.csv` | Exportar eventos |
| GET | `/admin/exports/ios_devices.csv` | Exportar dispositivos iOS |

## Formato de ID

Todos los IDs de recursos usan un formato de prefijo + cadena aleatoria:

| Prefijo | Recurso |
|---------|---------|
| `prd_` | Producto |
| `var_` | Variante |
| `rel_` | Versión |
| `app_` | App (heredado) |

## Referencias Detalladas

- [API de Subida](./upload) -- Endpoint de subida con referencia de campos y ejemplos
- [API de Administración](./admin) -- Documentación completa de endpoints de administración
