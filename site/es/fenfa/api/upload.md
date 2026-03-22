---
title: API de Subida
description: "Sube builds de apps a Fenfa via la API REST. Subida estándar y subida inteligente con extracción automática de metadatos."
---

# API de Subida

Fenfa proporciona dos endpoints de subida: una subida estándar para metadatos explícitos, y una subida inteligente que detecta automáticamente los metadatos del paquete subido.

## Subida Estándar

```
POST /upload
Content-Type: multipart/form-data
X-Auth-Token: <upload_token or admin_token>
```

### Campos de Solicitud

| Campo | Requerido | Tipo | Descripción |
|-------|-----------|------|-------------|
| `variant_id` | Sí | string | ID de la variante objetivo (ej. `var_def456`) |
| `app_file` | Sí | file | Archivo binario (IPA, APK, DMG, EXE, etc.) |
| `version` | No | string | Cadena de versión (ej. "1.2.0") |
| `build` | No | integer | Número de build (ej. 120) |
| `channel` | No | string | Canal de distribución (ej. "internal", "beta") |
| `min_os` | No | string | Versión mínima del OS (ej. "15.0") |
| `changelog` | No | string | Texto de notas de la versión |

### Ejemplo

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0" \
  -F "build=120" \
  -F "channel=beta" \
  -F "min_os=15.0" \
  -F "changelog=Bug fixes and performance improvements"
```

### Respuesta (201 Created)

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
      "ios_install": "itms-services://?action=download-manifest&url=https://dist.example.com/ios/rel_b1cqa/manifest.plist"
    }
  }
}
```

El objeto `urls` proporciona enlaces listos para usar:
- `page` -- URL de la página de descarga del producto
- `download` -- URL de descarga binaria directa
- `ios_manifest` -- URL del manifest plist de iOS (solo variantes iOS)
- `ios_install` -- URL de instalación `itms-services://` completa (solo variantes iOS)

## Subida Inteligente

```
POST /admin/api/smart-upload
Content-Type: multipart/form-data
X-Auth-Token: <admin_token>
```

La subida inteligente acepta los mismos campos que la subida estándar pero detecta automáticamente los metadatos del paquete subido.

::: tip Qué se Detecta Automáticamente
Para **archivos IPA**: bundle ID, versión (CFBundleShortVersionString), número de build (CFBundleVersion), icono de la app, versión mínima de iOS.

Para **archivos APK**: nombre del paquete, nombre de versión, código de versión, icono de la app, versión mínima del SDK.

Los formatos de escritorio (DMG, EXE, DEB, etc.) no soportan detección automática. Proporciona versión y build explícitamente.
:::

### Ejemplo

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

Los campos proporcionados explícitamente sobreescriben los valores detectados automáticamente:

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0-rc1" \
  -F "changelog=Release candidate 1"
```

## Respuestas de Error

### ID de Variante Ausente (400)

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### Token Inválido (401)

```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "invalid or missing auth token"
  }
}
```

### Variante No Encontrada (404)

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "variant not found"
  }
}
```

## Ejemplos de CI/CD

### GitHub Actions

```yaml
- name: Upload iOS build to Fenfa
  run: |
    RESPONSE=$(curl -s -X POST ${{ secrets.FENFA_URL }}/upload \
      -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
      -F "variant_id=${{ secrets.FENFA_IOS_VARIANT }}" \
      -F "app_file=@build/MyApp.ipa" \
      -F "version=${{ github.ref_name }}" \
      -F "build=${{ github.run_number }}" \
      -F "changelog=${{ github.event.head_commit.message }}")
    echo "Upload response: $RESPONSE"
    echo "Download URL: $(echo $RESPONSE | jq -r '.data.urls.page')"
```

### GitLab CI

```yaml
upload:
  stage: deploy
  script:
    - |
      curl -X POST ${FENFA_URL}/upload \
        -H "X-Auth-Token: ${FENFA_UPLOAD_TOKEN}" \
        -F "variant_id=${FENFA_VARIANT_ID}" \
        -F "app_file=@build/output/app-release.apk" \
        -F "version=${CI_COMMIT_TAG}" \
        -F "build=${CI_PIPELINE_IID}" \
        -F "channel=beta"
  only:
    - tags
```

### Script de Shell

```bash
#!/bin/bash
# upload.sh - Upload a build to Fenfa
FENFA_URL="https://dist.example.com"
TOKEN="your-upload-token"
VARIANT="var_def456"
FILE="$1"
VERSION="$2"

if [ -z "$FILE" ] || [ -z "$VERSION" ]; then
  echo "Usage: ./upload.sh <file> <version>"
  exit 1
fi

curl -X POST "${FENFA_URL}/upload" \
  -H "X-Auth-Token: ${TOKEN}" \
  -F "variant_id=${VARIANT}" \
  -F "app_file=@${FILE}" \
  -F "version=${VERSION}" \
  -F "build=$(date +%s)"
```

## Siguientes Pasos

- [API de Administración](./admin) -- Referencia completa de endpoints de administración
- [Gestión de Versiones](../products/releases) -- Gestiona las versiones subidas
- [Descripción General de Distribución](../distribution/) -- Cómo las subidas llegan a los usuarios finales
