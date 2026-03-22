---
title: Démarrage rapide
description: "Faire fonctionner Fenfa et téléverser votre premier build d'application en 5 minutes."
---

# Démarrage rapide

Ce guide vous accompagne dans le démarrage de Fenfa, la création d'un produit, le téléversement d'un build et le partage de la page de téléchargement -- le tout en moins de 5 minutes.

## Étape 1 : Démarrer Fenfa

```bash
docker run -d --name fenfa -p 8000:8000 fenfa/fenfa:latest
```

Ouvrez `http://localhost:8000/admin` dans votre navigateur. Connectez-vous avec le jeton d'administration par défaut : `dev-admin-token`.

## Étape 2 : Créer un produit

1. Dans le panneau d'administration, cliquez sur **Produits** dans la barre latérale.
2. Cliquez sur **Créer un produit**.
3. Remplissez les détails du produit :
   - **Nom** : Le nom de votre application (ex. "MonApp")
   - **Slug** : Identifiant convivial pour l'URL (ex. "monapp") -- c'est l'URL de la page de téléchargement
   - **Description** : Brève description de votre application
4. Cliquez sur **Enregistrer**.

## Étape 3 : Ajouter une variante

Une variante représente une cible de build spécifique à une plateforme. Chaque produit peut avoir plusieurs variantes (iOS, Android, macOS, etc.).

1. Ouvrez le produit que vous venez de créer.
2. Cliquez sur **Ajouter une variante**.
3. Configurez la variante :
   - **Plateforme** : Sélectionnez la plateforme cible (ex. "ios")
   - **Nom d'affichage** : Nom lisible par l'humain (ex. "iOS App Store")
   - **Identifiant** : Bundle ID ou nom de package (ex. "com.example.myapp")
   - **Architecture** : Architecture CPU (ex. "arm64")
   - **Type d'installateur** : Type de fichier (ex. "ipa", "apk", "dmg")
4. Cliquez sur **Enregistrer**.

## Étape 4 : Téléverser un build

### Via le panneau d'administration

1. Naviguez vers la variante que vous avez créée.
2. Cliquez sur **Téléverser une version**.
3. Sélectionnez votre fichier de build (IPA, APK, DMG, etc.).
4. Remplissez la version et le journal des modifications (optionnel -- Fenfa détecte automatiquement depuis les métadonnées IPA/APK).
5. Cliquez sur **Téléverser**.

### Via API (CI/CD)

Téléversez directement depuis votre pipeline de build :

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: dev-upload-token" \
  -F "variant_id=var_xxxxx" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.0.0" \
  -F "changelog=Initial release"
```

::: tip Téléversement intelligent
Utilisez l'endpoint de téléversement intelligent pour la détection automatique des métadonnées :
```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: dev-admin-token" \
  -F "variant_id=var_xxxxx" \
  -F "app_file=@build/MyApp.ipa"
```
Cela extrait automatiquement le bundle ID, la version, le numéro de build et l'icône du package téléversé.
:::

## Étape 5 : Partager la page de téléchargement

Votre application est maintenant disponible à :

```
http://localhost:8000/products/monapp
```

Cette page propose :

- **Détection de plateforme** -- Affiche automatiquement le bon bouton de téléchargement selon l'appareil du visiteur.
- **Code QR** -- Scannez pour ouvrir la page de téléchargement sur un appareil mobile.
- **Journaux de modifications par version** -- Chaque version affiche sa version et son journal des modifications.
- **Installation iOS OTA** -- Les builds iOS utilisent `itms-services://` pour l'installation directe (nécessite HTTPS en production).

Partagez cette URL ou le code QR avec vos testeurs et parties prenantes.

## Quelle est la prochaine étape ?

| Objectif | Guide |
|----------|-------|
| Configurer la distribution iOS ad-hoc avec liaison UDID | [Distribution iOS](../distribution/ios) |
| Configurer S3/R2 pour un stockage de fichiers évolutif | [Configuration](../configuration/) |
| Automatiser les téléversements depuis CI/CD | [API de téléversement](../api/upload) |
| Déployer derrière Nginx avec HTTPS | [Déploiement en production](../deployment/production) |
| Ajouter des variantes Android, macOS et Windows | [Variantes de plateforme](../products/variants) |
