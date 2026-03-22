---
title: Distribución de Escritorio
description: "Distribuye aplicaciones de escritorio macOS, Windows y Linux a través de Fenfa con descargas directas."
---

# Distribución de Escritorio

Fenfa distribuye aplicaciones de escritorio (macOS, Windows, Linux) mediante descargas directas de archivos. Los usuarios de escritorio visitan la página del producto, hacen clic en el botón de descarga y reciben el archivo instalador para su plataforma.

## Formatos Soportados

| Plataforma | Formatos Comunes | Notas |
|------------|-----------------|-------|
| macOS | `.dmg`, `.pkg`, `.zip` | DMG para imágenes de disco, PKG para instaladores, ZIP para bundles de apps |
| Windows | `.exe`, `.msi`, `.zip` | EXE para instaladores, MSI para Windows Installer, ZIP para portable |
| Linux | `.deb`, `.rpm`, `.appimage`, `.tar.gz` | DEB para Debian/Ubuntu, RPM para Fedora/RHEL, AppImage para universal |

## Configurar Variantes de Escritorio

Crea variantes para cada combinación de plataforma y arquitectura que soportes:

### macOS

```bash
# Apple Silicon
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "macos",
    "display_name": "macOS (Apple Silicon)",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "dmg",
    "min_os": "12.0"
  }'

# Intel
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "macos",
    "display_name": "macOS (Intel)",
    "identifier": "com.example.myapp",
    "arch": "x86_64",
    "installer_type": "dmg",
    "min_os": "12.0"
  }'
```

::: tip Binario Universal
Si compilas un binario universal de macOS, crea una única variante con `arch: "universal"` en lugar de variantes arm64 y x86_64 separadas.
:::

### Windows

```bash
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "windows",
    "display_name": "Windows",
    "identifier": "com.example.myapp",
    "arch": "x64",
    "installer_type": "exe",
    "min_os": "10"
  }'
```

### Linux

```bash
# DEB for Debian/Ubuntu
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "linux",
    "display_name": "Linux (DEB)",
    "identifier": "com.example.myapp",
    "arch": "x86_64",
    "installer_type": "deb"
  }'

# AppImage (universal)
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "linux",
    "display_name": "Linux (AppImage)",
    "identifier": "com.example.myapp",
    "arch": "x86_64",
    "installer_type": "appimage"
  }'
```

## Detección de Plataforma

La página de producto de Fenfa detecta el sistema operativo del visitante via User-Agent y resalta el botón de descarga correspondiente. Los usuarios de escritorio ven la variante de su plataforma en primer lugar, con otras plataformas disponibles debajo.

## Subir Builds de Escritorio

La subida funciona igual que para plataformas móviles:

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_macos_arm64" \
  -F "app_file=@MyApp-arm64.dmg" \
  -F "version=2.0.0" \
  -F "build=200" \
  -F "changelog=Native Apple Silicon support"
```

::: info Sin Detección Automática para Escritorio
A diferencia de los archivos IPA de iOS y APK de Android, los binarios de escritorio (DMG, EXE, DEB, etc.) no contienen metadatos estandarizados que Fenfa pueda extraer automáticamente. Siempre proporciona `version` y `build` explícitamente al subir builds de escritorio.
:::

## Ejemplo de Integración con CI/CD

Un flujo de trabajo de GitHub Actions que sube builds para todas las plataformas de escritorio:

```yaml
jobs:
  upload:
    strategy:
      matrix:
        include:
          - platform: macos
            variant_id: var_macos_arm64
            file: dist/MyApp-arm64.dmg
          - platform: windows
            variant_id: var_windows_x64
            file: dist/MyApp-Setup.exe
          - platform: linux
            variant_id: var_linux_x64
            file: dist/MyApp.AppImage
    steps:
      - name: Upload to Fenfa
        run: |
          curl -X POST ${{ secrets.FENFA_URL }}/upload \
            -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
            -F "variant_id=${{ matrix.variant_id }}" \
            -F "app_file=@${{ matrix.file }}" \
            -F "version=${{ github.ref_name }}" \
            -F "build=${{ github.run_number }}"
```

## Siguientes Pasos

- [Distribución iOS](./ios) -- Instalación OTA de iOS y vinculación UDID
- [Distribución Android](./android) -- Distribución de APK para Android
- [API de Subida](../api/upload) -- Referencia completa del endpoint de subida
