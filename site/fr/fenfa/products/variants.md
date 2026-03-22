---
title: Variantes de plateforme
description: "Configurer les variantes spécifiques aux plateformes pour iOS, Android, macOS, Windows et Linux sous un produit Fenfa."
---

# Variantes de plateforme

Une variante représente une cible de build spécifique à une plateforme sous un produit. Chaque variante a sa propre plateforme, son identifiant (bundle ID ou nom de package), son architecture et son type d'installateur. Les versions sont téléversées vers des variantes spécifiques.

## Plateformes prises en charge

| Plateforme | Exemple d'identifiant | Type d'installateur | Architecture |
|------------|-----------------------|---------------------|--------------|
| `ios` | `com.example.myapp` | `ipa` | `arm64` |
| `android` | `com.example.myapp` | `apk` | `universal`, `arm64-v8a`, `armeabi-v7a` |
| `macos` | `com.example.myapp` | `dmg`, `pkg`, `zip` | `arm64`, `x86_64`, `universal` |
| `windows` | `com.example.myapp` | `exe`, `msi`, `zip` | `x64`, `arm64` |
| `linux` | `com.example.myapp` | `deb`, `rpm`, `appimage`, `tar.gz` | `x86_64`, `aarch64` |

## Créer une variante

### Via le panneau d'administration

1. Ouvrez le produit auquel vous souhaitez ajouter une variante.
2. Cliquez sur **Ajouter une variante**.
3. Remplissez les champs :

| Champ | Requis | Description |
|-------|--------|-------------|
| Plateforme | Oui | Plateforme cible (`ios`, `android`, `macos`, `windows`, `linux`) |
| Nom d'affichage | Oui | Nom lisible par l'humain (ex. "iOS", "Android ARM64") |
| Identifiant | Oui | Bundle ID ou nom de package |
| Architecture | Non | Architecture CPU |
| Type d'installateur | Non | Type de fichier (`ipa`, `apk`, `dmg`, etc.) |
| OS minimum | Non | Exigence de version OS minimum |
| Ordre de tri | Non | Ordre d'affichage sur la page de téléchargement (plus petit = en premier) |

4. Cliquez sur **Enregistrer**.

### Via API

```bash
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ios",
    "display_name": "iOS",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "ipa",
    "min_os": "15.0"
  }'
```

Réponse :

```json
{
  "ok": true,
  "data": {
    "id": "var_def456",
    "product_id": "prd_abc123",
    "platform": "ios",
    "display_name": "iOS",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "ipa",
    "min_os": "15.0",
    "published": true,
    "sort_order": 0
  }
}
```

## Configuration typique d'un produit

Un produit multi-plateforme typique pourrait avoir ces variantes :

```
MyApp (Produit)
├── iOS (com.example.myapp, ipa, arm64)
├── Android (com.example.myapp, apk, universal)
├── macOS Apple Silicon (com.example.myapp, dmg, arm64)
├── macOS Intel (com.example.myapp, dmg, x86_64)
├── Windows (com.example.myapp, exe, x64)
└── Linux (com.example.myapp, appimage, x86_64)
```

::: tip Architecture unique vs. multiples
Pour les plateformes qui prennent en charge les binaires universels (comme Android ou macOS), vous pouvez créer une seule variante avec l'architecture `universal`. Pour les plateformes où vous distribuez des binaires séparés par architecture, créez une variante par architecture.
:::

## Mettre à jour une variante

```bash
curl -X PUT http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "iOS (Ad-Hoc)",
    "min_os": "16.0"
  }'
```

## Supprimer une variante

::: danger Suppression en cascade
La suppression d'une variante supprime définitivement toutes ses versions et fichiers téléversés.
:::

```bash
curl -X DELETE http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Statistiques de variante

Obtenez les statistiques de téléchargement pour une variante spécifique :

```bash
curl http://localhost:8000/admin/api/variants/var_def456/stats \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Format d'ID

Les IDs de variante utilisent le préfixe `var_` suivi d'une chaîne aléatoire (ex. `var_def456`).

## Étapes suivantes

- [Gestion des versions](./releases) -- Téléverser des builds vers vos variantes
- [Distribution iOS](../distribution/ios) -- Configuration de variante spécifique à iOS pour OTA et liaison UDID
- [Distribution bureau](../distribution/desktop) -- Considérations de distribution macOS, Windows et Linux
