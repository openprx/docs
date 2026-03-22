---
title: API de téléversement
description: "Téléverser des builds d'application vers Fenfa via l'API REST. Téléversement standard et téléversement intelligent avec extraction automatique des métadonnées."
---

# API de téléversement

Fenfa fournit deux endpoints de téléversement : un téléversement standard pour les métadonnées explicites, et un téléversement intelligent qui détecte automatiquement les métadonnées du package téléversé.

## Téléversement standard

```
POST /upload
Content-Type: multipart/form-data
X-Auth-Token: <upload_token or admin_token>
```

### Champs de la requête

| Champ | Requis | Type | Description |
|-------|--------|------|-------------|
| `variant_id` | Oui | string | ID de la variante cible (ex. `var_def456`) |
| `app_file` | Oui | fichier | Fichier binaire (IPA, APK, DMG, EXE, etc.) |
| `version` | Non | string | Chaîne de version (ex. "1.2.0") |
| `build` | Non | integer | Numéro de build (ex. 120) |
| `channel` | Non | string | Canal de distribution (ex. "internal", "beta") |
| `min_os` | Non | string | Version OS minimum (ex. "15.0") |
| `changelog` | Non | string | Texte des notes de version |

### Exemple

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

### Réponse (201 Created)

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

L'objet `urls` fournit des liens prêts à l'emploi :
- `page` -- URL de la page de téléchargement du produit
- `download` -- URL de téléchargement binaire direct
- `ios_manifest` -- URL du plist de manifeste iOS (variantes iOS uniquement)
- `ios_install` -- URL d'installation `itms-services://` complète (variantes iOS uniquement)

## Téléversement intelligent

```
POST /admin/api/smart-upload
Content-Type: multipart/form-data
X-Auth-Token: <admin_token>
```

Le téléversement intelligent accepte les mêmes champs que le téléversement standard mais détecte automatiquement les métadonnées du package téléversé.

::: tip Ce qui est auto-détecté
Pour les **fichiers IPA** : bundle ID, version (CFBundleShortVersionString), numéro de build (CFBundleVersion), icône de l'application, version iOS minimum.

Pour les **fichiers APK** : nom de package, nom de version, code de version, icône de l'application, version SDK minimum.

Les formats bureau (DMG, EXE, DEB, etc.) ne prennent pas en charge la détection automatique. Fournissez version et build explicitement.
:::

### Exemple

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

Les champs fournis explicitement remplacent les valeurs auto-détectées :

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0-rc1" \
  -F "changelog=Release candidate 1"
```

## Réponses d'erreur

### ID de variante manquant (400)

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### Jeton invalide (401)

```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "invalid or missing auth token"
  }
}
```

### Variante non trouvée (404)

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "variant not found"
  }
}
```

## Exemples CI/CD

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

### Script Shell

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

## Étapes suivantes

- [API d'administration](./admin) -- Référence complète des endpoints d'administration
- [Gestion des versions](../products/releases) -- Gérer les versions téléversées
- [Aperçu de distribution](../distribution/) -- Comment les téléversements atteignent les utilisateurs finaux
