---
title: Distribution bureau
description: "Distribuer des applications bureau macOS, Windows et Linux via Fenfa avec des téléchargements directs."
---

# Distribution bureau

Fenfa distribue les applications bureau (macOS, Windows, Linux) via des téléchargements de fichiers directs. Les utilisateurs bureau visitent la page produit, cliquent sur le bouton de téléchargement et reçoivent le fichier d'installation pour leur plateforme.

## Formats pris en charge

| Plateforme | Formats courants | Notes |
|------------|-----------------|-------|
| macOS | `.dmg`, `.pkg`, `.zip` | DMG pour les images disque, PKG pour les installateurs, ZIP pour les bundles d'applications |
| Windows | `.exe`, `.msi`, `.zip` | EXE pour les installateurs, MSI pour Windows Installer, ZIP pour le portable |
| Linux | `.deb`, `.rpm`, `.appimage`, `.tar.gz` | DEB pour Debian/Ubuntu, RPM pour Fedora/RHEL, AppImage pour l'universel |

## Configurer les variantes bureau

Créez des variantes pour chaque combinaison de plateforme et d'architecture que vous prenez en charge :

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

::: tip Binaire universel
Si vous compilez un binaire macOS universel, créez une seule variante avec `arch: "universal"` au lieu de variantes séparées arm64 et x86_64.
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
# DEB pour Debian/Ubuntu
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

# AppImage (universel)
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

## Détection de plateforme

La page produit de Fenfa détecte le système d'exploitation du visiteur via le User-Agent et met en évidence le bouton de téléchargement correspondant. Les utilisateurs bureau voient la variante de leur plateforme en haut, avec les autres plateformes disponibles en dessous.

## Téléverser des builds bureau

Le téléversement fonctionne de la même façon que pour les plateformes mobiles :

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_macos_arm64" \
  -F "app_file=@MyApp-arm64.dmg" \
  -F "version=2.0.0" \
  -F "build=200" \
  -F "changelog=Native Apple Silicon support"
```

::: info Pas de détection automatique pour le bureau
Contrairement aux fichiers IPA iOS et APK Android, les binaires bureau (DMG, EXE, DEB, etc.) ne contiennent pas de métadonnées standardisées que Fenfa peut extraire automatiquement. Fournissez toujours `version` et `build` explicitement lors du téléversement de builds bureau.
:::

## Exemple d'intégration CI/CD

Un workflow GitHub Actions qui téléverse des builds pour toutes les plateformes bureau :

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

## Étapes suivantes

- [Distribution iOS](./ios) -- Installation iOS OTA et liaison UDID
- [Distribution Android](./android) -- Distribution d'APK Android
- [API de téléversement](../api/upload) -- Référence complète de l'endpoint de téléversement
