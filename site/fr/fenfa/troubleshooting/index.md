---
title: Dépannage
description: "Problèmes courants et solutions lors de l'exécution de Fenfa, y compris les échecs d'installation iOS, les erreurs de téléversement et les problèmes Docker."
---

# Dépannage

Cette page couvre les problèmes courants rencontrés lors de l'exécution de Fenfa et leurs solutions.

## Installation iOS

### "Impossible d'installer" / Échec de l'installation

**Symptômes :** Appuyer sur le bouton d'installation sur iOS affiche "Impossible d'installer" ou rien ne se passe.

**Causes et solutions :**

1. **HTTPS non configuré.** iOS nécessite HTTPS avec un certificat TLS valide pour l'installation OTA. Les certificats auto-signés ne fonctionnent pas.
   - **Correction :** Configurez un proxy inverse avec un certificat TLS valide. Voir [Déploiement en production](../deployment/production).
   - **Pour les tests :** Utilisez `ngrok` pour créer un tunnel HTTPS : `ngrok http 8000`

2. **Mauvais primary_domain.** Le manifeste plist contient des URLs de téléchargement basées sur `primary_domain`. Si c'est incorrect, iOS ne peut pas récupérer l'IPA.
   - **Correction :** Définissez `FENFA_PRIMARY_DOMAIN` sur l'URL HTTPS exacte que les utilisateurs accèdent (ex. `https://dist.example.com`).

3. **Problèmes de certificat.** Le certificat TLS doit couvrir le domaine et être approuvé par iOS.
   - **Correction :** Utilisez Let's Encrypt pour des certificats gratuits et approuvés.

4. **IPA signing expiré.** Le profil de provisionnement ou le certificat de signature peut avoir expiré.
   - **Correction :** Re-signez l'IPA avec un certificat valide et re-téléversez.

### Liaison UDID ne fonctionne pas

**Symptômes :** Le profil mobileconfig s'installe mais l'appareil n'est pas enregistré.

**Causes et solutions :**

1. **URL de callback inaccessible.** L'URL de callback UDID doit être accessible depuis l'appareil.
   - **Correction :** Assurez-vous que `primary_domain` est correct et accessible depuis le réseau de l'appareil.

2. **Nonce expiré.** Les nonces de profil expirent après un délai.
   - **Correction :** Re-téléchargez le profil mobileconfig et réessayez.

## Problèmes de téléversement

### Téléversement échoue avec 401

**Symptôme :** `{"ok": false, "error": {"code": "UNAUTHORIZED", ...}}`

**Correction :** Vérifiez que l'en-tête `X-Auth-Token` contient un jeton valide. Les endpoints de téléversement acceptent à la fois les jetons de téléversement et d'administration.

```bash
# Vérifier que votre jeton fonctionne
curl -H "X-Auth-Token: YOUR_TOKEN" http://localhost:8000/admin/api/products
```

### Téléversement échoue avec 413 (Entité de requête trop grande)

**Symptôme :** Les téléversements de gros fichiers échouent avec une erreur 413.

**Correction :** C'est généralement une limite du proxy inverse, pas de Fenfa lui-même. Augmentez la limite :

**Nginx :**
```nginx
client_max_body_size 2G;
```

**Caddy :**
Caddy n'a pas de limite de taille de corps par défaut, mais si vous en avez défini une :
```
dist.example.com {
    request_body {
        max_size 2GB
    }
    reverse_proxy localhost:8000
}
```

### Le téléversement intelligent ne détecte pas les métadonnées

**Symptôme :** La version et le numéro de build sont vides après un téléversement intelligent.

**Correction :** La détection automatique du téléversement intelligent fonctionne uniquement pour les fichiers IPA et APK. Pour les formats bureau (DMG, EXE, DEB, etc.), fournissez `version` et `build` explicitement dans la requête de téléversement.

## Problèmes Docker

### Le conteneur démarre mais le panneau d'administration est vide

**Symptôme :** Le panneau d'administration se charge mais n'affiche aucune donnée ou une page blanche.

**Correction :** Vérifiez que le conteneur fonctionne et que le mappage de port est correct :

```bash
docker ps
docker logs fenfa
```

### Données perdues après le redémarrage du conteneur

**Symptôme :** Tous les produits, variantes et versions disparaissent après le redémarrage du conteneur.

**Correction :** Montez des volumes persistants :

```bash
docker run -d --name fenfa -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

### Permission refusée sur les volumes montés

**Symptôme :** Fenfa ne parvient pas à écrire dans `/data` ou `/app/uploads`.

**Correction :** Assurez-vous que les répertoires hôtes existent et ont les bonnes permissions :

```bash
mkdir -p data uploads
chmod 777 data uploads  # Ou définir l'UID/GID approprié
```

## Problèmes de base de données

### Erreur "database is locked"

**Symptôme :** SQLite retourne "database is locked" sous haute concurrence.

**Correction :** SQLite gère bien les lectures concurrentes mais sérialise les écritures. Cette erreur se produit généralement sous une charge d'écriture très élevée. Solutions :
- Assurez-vous qu'une seule instance Fenfa écrit dans le même fichier de base de données.
- Si vous exécutez plusieurs instances, utilisez le stockage S3 et une base de données partagée (ou passez à un backend de base de données différent dans une future version).

### Base de données corrompue

**Symptôme :** Fenfa ne démarre pas avec des erreurs SQLite.

**Correction :** Restaurez depuis la sauvegarde :

```bash
# Arrêter Fenfa
docker stop fenfa

# Restaurer la sauvegarde
cp /backups/fenfa-latest.db /path/to/data/fenfa.db

# Redémarrer
docker start fenfa
```

::: tip Prévention
Mettez en place des sauvegardes automatiques quotidiennes. Voir [Déploiement en production](../deployment/production) pour un script de sauvegarde.
:::

## Problèmes réseau

### Le manifeste iOS retourne de mauvaises URLs

**Symptôme :** Le manifeste plist iOS contient `http://localhost:8000` au lieu du domaine public.

**Correction :** Définissez `FENFA_PRIMARY_DOMAIN` sur votre URL HTTPS publique :

```bash
FENFA_PRIMARY_DOMAIN=https://dist.example.com
```

### Téléchargements lents ou expiration

**Symptôme :** Les téléchargements de gros fichiers sont lents ou échouent.

**Corrections possibles :**
- Augmentez le délai d'expiration du proxy inverse : `proxy_read_timeout 600s;` (Nginx)
- Désactivez la mise en tampon des requêtes : `proxy_request_buffering off;` (Nginx)
- Envisagez d'utiliser le stockage compatible S3 avec un CDN pour les gros fichiers

## Obtenir de l'aide

Si votre problème n'est pas couvert ici :

1. Vérifiez les [Issues GitHub](https://github.com/openprx/fenfa/issues) pour les problèmes connus.
2. Consultez les journaux du conteneur : `docker logs fenfa`
3. Ouvrez une nouvelle issue avec :
   - Version de Fenfa (`docker inspect fenfa | grep Image`)
   - Sortie de journaux pertinente
   - Étapes pour reproduire le problème
