---
title: prx auth
description: Gerer les profils d'authentification OAuth pour les fournisseurs LLM et les services.
---

# prx auth

Gerer les profils d'authentification OAuth. PRX utilise les flux OAuth2 pour les fournisseurs et services qui les prennent en charge (GitHub Copilot, Google Gemini, etc.). Les profils d'authentification stockent les tokens de maniere securisee dans le stockage de secrets PRX.

## Utilisation

```bash
prx auth <SOUS-COMMANDE> [OPTIONS]
```

## Sous-commandes

### `prx auth login`

S'authentifier aupres d'un fournisseur ou d'un service.

```bash
prx auth login [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--provider` | `-P` | | Fournisseur aupres duquel s'authentifier (ex. `github-copilot`, `google-gemini`) |
| `--profile` | | `default` | Profil nomme pour plusieurs comptes |
| `--browser` | | `true` | Ouvrir le navigateur pour le flux OAuth |
| `--device-code` | | `false` | Utiliser le flux de code d'appareil (pour les environnements sans interface graphique) |

```bash
# Se connecter a GitHub Copilot
prx auth login --provider github-copilot

# Flux de code d'appareil (sans navigateur)
prx auth login --provider github-copilot --device-code

# Se connecter avec un profil nomme
prx auth login --provider google-gemini --profile work
```

Le flux de connexion :

1. PRX ouvre un navigateur (ou affiche un code d'appareil) vers la page de consentement OAuth du fournisseur
2. Vous autorisez PRX dans le navigateur
3. PRX recoit et stocke de maniere securisee les tokens d'acces et de rafraichissement
4. Le token est automatiquement utilise pour les appels API subsequents

### `prx auth refresh`

Rafraichir manuellement un token d'acces expire.

```bash
prx auth refresh [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--provider` | `-P` | tous | Fournisseur a rafraichir (rafraichit tous si omis) |
| `--profile` | | `default` | Profil nomme a rafraichir |

```bash
# Rafraichir tous les tokens de fournisseurs
prx auth refresh

# Rafraichir un fournisseur specifique
prx auth refresh --provider github-copilot
```

::: tip
Le rafraichissement des tokens se fait automatiquement pendant le fonctionnement normal. Utilisez cette commande uniquement pour le depannage des problemes d'authentification.
:::

### `prx auth logout`

Supprimer les identifiants stockes pour un fournisseur.

```bash
prx auth logout [OPTIONS]
```

| Drapeau | Court | Defaut | Description |
|---------|-------|--------|-------------|
| `--provider` | `-P` | | Fournisseur dont se deconnecter (requis) |
| `--profile` | | `default` | Profil nomme dont se deconnecter |
| `--all` | | `false` | Se deconnecter de tous les fournisseurs et profils |

```bash
# Se deconnecter de GitHub Copilot
prx auth logout --provider github-copilot

# Se deconnecter de tout
prx auth logout --all
```

## Profils d'authentification

Les profils permettent d'avoir plusieurs comptes pour le meme fournisseur. Cela est utile lorsque vous avez des comptes professionnels et personnels distincts.

```bash
# Se connecter avec deux comptes Google differents
prx auth login --provider google-gemini --profile personal
prx auth login --provider google-gemini --profile work

# Utiliser un profil specifique dans le chat
prx chat --provider google-gemini  # utilise le profil "default"
```

Definissez le profil actif par fournisseur dans le fichier de configuration :

```toml
[providers.google-gemini]
auth_profile = "work"
```

## Stockage des tokens

Les tokens sont chiffres en utilisant le chiffrement ChaCha20-Poly1305 et stockes dans le stockage de secrets PRX a `~/.local/share/prx/secrets/`. La cle de chiffrement est derivee de l'identite de la machine.

## Voir aussi

- [Apercu de l'authentification](/fr/prx/auth/) -- architecture d'authentification
- [Flux OAuth2](/fr/prx/auth/oauth2) -- documentation detaillee du flux OAuth2
- [Profils d'authentification](/fr/prx/auth/profiles) -- gestion des profils
- [Stockage de secrets](/fr/prx/security/secrets) -- comment les tokens sont stockes de maniere securisee
