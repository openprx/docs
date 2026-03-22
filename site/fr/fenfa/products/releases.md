---
title: Gestion des versions
description: "Téléverser, versionner et gérer les versions d'application dans Fenfa. Chaque version est un build spécifique téléversé vers une variante de plateforme."
---

# Gestion des versions

Une version représente un build spécifique téléversé sous une variante. Chaque version a une chaîne de version, un numéro de build, un journal des modifications et le fichier binaire lui-même. Les versions sont affichées sur la page de téléchargement du produit dans l'ordre chronologique inverse.

## Champs d'une version

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | ID auto-généré (ex. `rel_b1cqa`) |
| `variant_id` | string | ID de la variante parente |
| `version` | string | Chaîne de version (ex. "1.2.0") |
| `build` | integer | Numéro de build (ex. 120) |
| `changelog` | text | Notes de version (affichées sur la page de téléchargement) |
| `min_os` | string | Version OS minimum |
| `channel` | string | Canal de distribution (ex. "internal", "beta", "production") |
| `size_bytes` | integer | Taille du fichier en octets |
| `sha256` | string | Hash SHA-256 du fichier téléversé |
| `download_count` | integer | Nombre de fois que cette version a été téléchargée |
| `file_name` | string | Nom de fichier original |
| `file_ext` | string | Extension de fichier (ex. "ipa", "apk") |
| `created_at` | datetime | Horodatage de téléversement |

## Téléverser une version

### Téléversement standard

Téléversez un fichier de build vers une variante spécifique :

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

Réponse :

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

### Téléversement intelligent

L'endpoint de téléversement intelligent détecte automatiquement les métadonnées du package téléversé :

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

::: tip Détection automatique
Le téléversement intelligent extrait les éléments suivants depuis les fichiers IPA et APK :
- **Bundle ID / Nom de package**
- **Chaîne de version** (CFBundleShortVersionString / versionName)
- **Numéro de build** (CFBundleVersion / versionCode)
- **Icône de l'application** (extraite et stockée comme icône du produit)
- **Version OS minimum**

Vous pouvez toujours remplacer n'importe quel champ auto-détecté en le fournissant explicitement dans la requête de téléversement.
:::

### Champs de téléversement

| Champ | Requis | Description |
|-------|--------|-------------|
| `variant_id` | Oui | ID de la variante cible |
| `app_file` | Oui | Le fichier binaire (IPA, APK, DMG, etc.) |
| `version` | Non | Chaîne de version (auto-détectée pour IPA/APK) |
| `build` | Non | Numéro de build (auto-détecté pour IPA/APK) |
| `channel` | Non | Canal de distribution |
| `min_os` | Non | Version OS minimum |
| `changelog` | Non | Notes de version |

## Stockage des fichiers

Les fichiers téléversés sont stockés à :

```
uploads/{product_id}/{variant_id}/{release_id}/filename.ext
```

Chaque version a également un snapshot `meta.json` (stockage local uniquement) à des fins de récupération.

::: info Stockage S3
Lorsque le stockage compatible S3 est configuré, les fichiers sont téléversés vers le bucket configuré. La structure du chemin de stockage reste la même. Consultez [Configuration](../configuration/) pour la configuration S3.
:::

## URLs de téléchargement

Chaque version fournit plusieurs URLs :

| URL | Description |
|-----|-------------|
| `/d/:releaseID` | Téléchargement binaire direct (prend en charge les requêtes HTTP Range) |
| `/ios/:releaseID/manifest.plist` | Manifeste iOS OTA (pour les liens `itms-services://`) |
| `/products/:slug` | Page de téléchargement du produit |
| `/products/:slug?r=:releaseID` | Page produit avec une version spécifique mise en évidence |

## Supprimer une version

```bash
curl -X DELETE http://localhost:8000/admin/api/releases/rel_b1cqa \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

::: warning
La suppression d'une version supprime définitivement le fichier binaire téléversé et toutes les métadonnées associées.
:::

## Exporter les données des versions

Exportez toutes les versions en CSV pour les rapports :

```bash
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Intégration CI/CD

Fenfa est conçu pour être appelé depuis des pipelines CI/CD. Une étape GitHub Actions typique :

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

## Étapes suivantes

- [Référence API de téléversement](../api/upload) -- Documentation complète de l'endpoint de téléversement
- [Distribution iOS](../distribution/ios) -- Manifeste iOS OTA et installation
- [Aperçu de distribution](../distribution/) -- Comment les versions atteignent les utilisateurs finaux
