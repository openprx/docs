---
title: API de Administración
description: "Referencia completa de la API de administración de Fenfa para gestionar productos, variantes, versiones, dispositivos, ajustes y exportaciones."
---

# API de Administración

Todos los endpoints de administración requieren el encabezado `X-Auth-Token` con un token de ámbito administrador. Los tokens de administrador tienen acceso completo a todas las operaciones de la API, incluyendo subida.

## Productos

### Listar Productos

```
GET /admin/api/products
```

Devuelve todos los productos con su información básica.

```bash
curl http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

### Crear Producto

```
POST /admin/api/products
Content-Type: application/json
```

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `name` | Sí | Nombre de visualización del producto |
| `slug` | Sí | Identificador URL (único) |
| `description` | No | Descripción del producto |

```bash
curl -X POST http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "MyApp", "slug": "myapp", "description": "Cross-platform app"}'
```

### Obtener Producto

```
GET /admin/api/products/:productID
```

Devuelve el producto con todas sus variantes.

### Actualizar Producto

```
PUT /admin/api/products/:productID
Content-Type: application/json
```

### Eliminar Producto

```
DELETE /admin/api/products/:productID
```

::: danger Eliminación en Cascada
Eliminar un producto elimina permanentemente todas sus variantes, versiones y archivos subidos.
:::

## Variantes

### Crear Variante

```
POST /admin/api/products/:productID/variants
Content-Type: application/json
```

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `platform` | Sí | `ios`, `android`, `macos`, `windows`, `linux` |
| `display_name` | Sí | Nombre legible por humanos |
| `identifier` | Sí | Bundle ID o nombre de paquete |
| `arch` | No | Arquitectura de CPU |
| `installer_type` | No | Tipo de archivo (`ipa`, `apk`, `dmg`, etc.) |
| `min_os` | No | Versión mínima del OS |
| `sort_order` | No | Orden de visualización (menor = primero) |

### Actualizar Variante

```
PUT /admin/api/variants/:variantID
Content-Type: application/json
```

### Eliminar Variante

```
DELETE /admin/api/variants/:variantID
```

::: danger Eliminación en Cascada
Eliminar una variante elimina permanentemente todas sus versiones y archivos subidos.
:::

### Estadísticas de Variante

```
GET /admin/api/variants/:variantID/stats
```

Devuelve conteos de descargas y otras estadísticas de la variante.

## Versiones

### Eliminar Versión

```
DELETE /admin/api/releases/:releaseID
```

Elimina la versión y su archivo binario subido.

## Publicación

Controla si un producto/app es visible en la página de descarga pública.

### Publicar

```
PUT /admin/api/apps/:appID/publish
```

### Despublicar

```
PUT /admin/api/apps/:appID/unpublish
```

## Eventos

### Consultar Eventos

```
GET /admin/api/events
```

Devuelve eventos de visita, clic y descarga. Soporta parámetros de consulta para filtrado.

| Parámetro | Descripción |
|-----------|-------------|
| `type` | Tipo de evento (`visit`, `click`, `download`) |
| `variant_id` | Filtrar por variante |
| `release_id` | Filtrar por versión |

## Dispositivos iOS

### Listar Dispositivos

```
GET /admin/api/ios_devices
```

Devuelve todos los dispositivos iOS que han completado la vinculación UDID.

### Registrar Dispositivo con Apple

```
POST /admin/api/devices/:deviceID/register-apple
```

Registra un único dispositivo en tu cuenta de Apple Developer.

### Registro en Lote de Dispositivos

```
POST /admin/api/devices/register-apple
```

Registra todos los dispositivos no registrados con Apple en una única operación de lote.

## API de Apple Developer

### Comprobar Estado

```
GET /admin/api/apple/status
```

Devuelve si las credenciales de la API de Apple Developer están configuradas y son válidas.

### Listar Dispositivos Apple

```
GET /admin/api/apple/devices
```

Devuelve los dispositivos registrados en tu cuenta de Apple Developer.

## Ajustes

### Obtener Ajustes

```
GET /admin/api/settings
```

Devuelve los ajustes actuales del sistema (dominios, organización, tipo de almacenamiento).

### Actualizar Ajustes

```
PUT /admin/api/settings
Content-Type: application/json
```

Los campos actualizables incluyen:
- `primary_domain` -- URL pública para manifiestos y callbacks
- `secondary_domains` -- Dominios CDN o alternativos
- `organization` -- Nombre de organización en perfiles iOS
- `storage_type` -- `local` o `s3`
- Configuración S3 (endpoint, bucket, claves, URL pública)
- Credenciales de la API de Apple Developer

### Obtener Configuración de Subida

```
GET /admin/api/upload-config
```

Devuelve la configuración actual de subida incluyendo tipo de almacenamiento y límites.

## Exportaciones

Exporta datos como archivos CSV para análisis externo:

| Endpoint | Datos |
|----------|-------|
| `GET /admin/exports/releases.csv` | Todas las versiones con metadatos |
| `GET /admin/exports/events.csv` | Todos los eventos |
| `GET /admin/exports/ios_devices.csv` | Todos los dispositivos iOS |

```bash
# Example: export all releases
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Siguientes Pasos

- [API de Subida](./upload) -- Referencia del endpoint de subida
- [Configuración](../configuration/) -- Opciones de configuración del servidor
- [Despliegue en Producción](../deployment/production) -- Asegura tu API de administración
