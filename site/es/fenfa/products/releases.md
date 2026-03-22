---
title: Gestión de Versiones
description: "Sube, versiona y gestiona versiones de apps en Fenfa. Cada versión es un build específico subido a una variante de plataforma."
---

# Gestión de Versiones

Una versión representa un build específico subido bajo una variante. Cada versión tiene una cadena de versión, número de build, changelog y el archivo binario en sí. Las versiones se muestran en la página de descarga del producto en orden cronológico inverso.

## Campos de Versión

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID auto-generado (ej. `rel_b1cqa`) |
| `variant_id` | string | ID de la variante padre |
| `version` | string | Cadena de versión (ej. "1.2.0") |
| `build` | integer | Número de build (ej. 120) |
| `changelog` | text | Notas de la versión (mostradas en la página de descarga) |
| `min_os` | string | Versión mínima del OS |
| `channel` | string | Canal de distribución (ej. "internal", "beta", "production") |
| `size_bytes` | integer | Tamaño del archivo en bytes |
| `sha256` | string | Hash SHA-256 del archivo subido |
| `download_count` | integer | Número de veces que esta versión ha sido descargada |
| `file_name` | string | Nombre de archivo original |
| `file_ext` | string | Extensión de archivo (ej. "ipa", "apk") |
| `created_at` | datetime | Timestamp de subida |

## Subir una Versión

### Subida Estándar

Sube un archivo de build a una variante específica:

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0" \
  -F "build=120" \
  -F "channel=beta" \
  -F "changelog=Bug fixes and performance improvements"
```

Respuesta:

```json
{
  "ok": true,
  "data": {
    "app": {
      "id": "app_xxx",
      "name": "MyApp",
      "platform": "ios",
      "bundle_id": "com.example.myapp"
    },
    "release": {
      "id": "rel_b1cqa",
      "version": "1.2.0",
      "build": 120
    },
    "urls": {
      "page": "https://dist.example.com/products/myapp",
      "download": "https://dist.example.com/d/rel_b1cqa",
      "ios_manifest": "https://dist.example.com/ios/rel_b1cqa/manifest.plist",
      "ios_install": "itms-services://..."
    }
  }
}
```

### Subida Inteligente

El endpoint de subida inteligente detecta automáticamente los metadatos del paquete subido:

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

::: tip Detección Automática
La subida inteligente extrae lo siguiente de archivos IPA y APK:
- **Bundle ID / Nombre de Paquete**
- **Cadena de versión** (CFBundleShortVersionString / versionName)
- **Número de build** (CFBundleVersion / versionCode)
- **Icono de la app** (extraído y almacenado como icono del producto)
- **Versión mínima del OS**

Puedes sobreescribir cualquier campo detectado automáticamente proporcionándolo explícitamente en la solicitud de subida.
:::

### Campos de Subida

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `variant_id` | Sí | ID de la variante objetivo |
| `app_file` | Sí | El archivo binario (IPA, APK, DMG, etc.) |
| `version` | No | Cadena de versión (detectada automáticamente para IPA/APK) |
| `build` | No | Número de build (detectado automáticamente para IPA/APK) |
| `channel` | No | Canal de distribución |
| `min_os` | No | Versión mínima del OS |
| `changelog` | No | Notas de la versión |

## Almacenamiento de Archivos

Los archivos subidos se almacenan en:

```
uploads/{product_id}/{variant_id}/{release_id}/filename.ext
```

Cada versión también tiene un snapshot `meta.json` (solo almacenamiento local) para fines de recuperación.

::: info Almacenamiento S3
Cuando se configura almacenamiento compatible con S3, los archivos se suben al bucket configurado. La estructura de ruta de almacenamiento permanece igual. Ver [Configuración](../configuration/) para la configuración de S3.
:::

## URLs de Descarga

Cada versión proporciona varias URLs:

| URL | Descripción |
|-----|-------------|
| `/d/:releaseID` | Descarga binaria directa (soporta solicitudes HTTP Range) |
| `/ios/:releaseID/manifest.plist` | Manifiesto OTA de iOS (para enlaces `itms-services://`) |
| `/products/:slug` | Página de descarga del producto |
| `/products/:slug?r=:releaseID` | Página del producto con versión específica resaltada |

## Eliminar una Versión

```bash
curl -X DELETE http://localhost:8000/admin/api/releases/rel_b1cqa \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

::: warning
Eliminar una versión elimina permanentemente el archivo binario subido y todos los metadatos asociados.
:::

## Exportar Datos de Versiones

Exporta todas las versiones como CSV para reportes:

```bash
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Integración con CI/CD

Fenfa está diseñado para ser llamado desde pipelines de CI/CD. Un paso típico de GitHub Actions:

```yaml
- name: Upload to Fenfa
  run: |
    curl -X POST ${{ secrets.FENFA_URL }}/upload \
      -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
      -F "variant_id=${{ secrets.FENFA_VARIANT_ID }}" \
      -F "app_file=@build/output/MyApp.ipa" \
      -F "version=${{ github.ref_name }}" \
      -F "build=${{ github.run_number }}" \
      -F "changelog=${{ github.event.head_commit.message }}"
```

## Siguientes Pasos

- [Referencia de la API de Subida](../api/upload) -- Documentación completa del endpoint de subida
- [Distribución iOS](../distribution/ios) -- Manifiesto OTA de iOS e instalación
- [Descripción General de Distribución](../distribution/) -- Cómo las versiones llegan a los usuarios finales
