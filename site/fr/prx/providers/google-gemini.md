---
title: Google Gemini
description: Configurer Google Gemini comme fournisseur LLM dans PRX
---

# Google Gemini

> Accedez aux modeles Gemini via l'API Google Generative Language avec prise en charge des cles API, des tokens OAuth Gemini CLI et des fenetres de contexte longues jusqu'a 2M de tokens.

## Prerequis

- Une cle API Google AI Studio depuis [aistudio.google.com](https://aistudio.google.com/app/apikey), **ou**
- Gemini CLI installe et authentifie (commande `gemini`), **ou**
- Une variable d'environnement `GEMINI_API_KEY` ou `GOOGLE_API_KEY`

## Configuration rapide

### 1. Obtenir une cle API

**Option A : Cle API (recommandee pour la plupart des utilisateurs)**

1. Visitez [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Cliquez sur **Create API key**
3. Copiez la cle

**Option B : Gemini CLI (zero configuration pour les utilisateurs existants)**

Si vous utilisez deja le Gemini CLI, PRX detecte automatiquement votre token OAuth depuis `~/.gemini/oauth_creds.json`. Aucune configuration supplementaire necessaire.

### 2. Configurer

```toml
[default]
provider = "gemini"
model = "gemini-2.5-flash"

[providers.gemini]
api_key = "${GEMINI_API_KEY}"
```

Ou definissez la variable d'environnement :

```bash
export GEMINI_API_KEY="AIza..."
```

### 3. Verifier

```bash
prx doctor models
```

## Modeles disponibles

| Modele | Contexte | Vision | Outils | Notes |
|--------|----------|--------|--------|-------|
| `gemini-2.5-pro` | 1M | Oui | Oui | Modele Gemini le plus performant |
| `gemini-2.5-flash` | 1M | Oui | Oui | Rapide et economique |
| `gemini-2.0-flash` | 1M | Oui | Oui | Generation precedente flash |
| `gemini-1.5-pro` | 2M | Oui | Oui | Fenetre de contexte la plus longue |
| `gemini-1.5-flash` | 1M | Oui | Oui | Generation precedente |

## Reference de la configuration

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `api_key` | string | optionnel | Cle API Google AI (`AIza...`) |
| `model` | string | `gemini-2.5-flash` | Modele par defaut a utiliser |

## Fonctionnalites

### Methodes d'authentification multiples

PRX resout les identifiants Gemini dans cet ordre de priorite :

| Priorite | Source | Fonctionnement |
|----------|--------|----------------|
| 1 | Cle API explicite dans la config | Envoyee comme parametre de requete `?key=` a l'API publique |
| 2 | Variable d'env `GEMINI_API_KEY` | Idem ci-dessus |
| 3 | Variable d'env `GOOGLE_API_KEY` | Idem ci-dessus |
| 4 | Token OAuth Gemini CLI | Envoye via `Authorization: Bearer` a l'API interne Code Assist |

### Integration OAuth Gemini CLI

Si vous vous etes authentifie avec le Gemini CLI (commande `gemini`), PRX automatiquement :

1. Lit `~/.gemini/oauth_creds.json`
2. Verifie l'expiration du token (ignore les tokens expires avec un avertissement)
3. Route les requetes vers l'API interne Code Assist de Google (`cloudcode-pa.googleapis.com`) en utilisant le format d'enveloppe approprie

Cela signifie que les utilisateurs existants du Gemini CLI peuvent utiliser PRX sans aucune configuration supplementaire.

### Fenetres de contexte longues

Les modeles Gemini prennent en charge des fenetres de contexte extremement longues (jusqu'a 2M de tokens pour Gemini 1.5 Pro). PRX definit `maxOutputTokens` a 8192 par defaut. L'historique complet de la conversation est envoye comme `contents` avec le mapping de roles approprie (`user`/`model`).

### Instructions systeme

Les prompts systeme sont envoyes en utilisant le champ natif `systemInstruction` de Gemini (et non comme un message ordinaire), assurant un traitement correct par le modele.

### Formatage automatique des noms de modeles

PRX ajoute automatiquement `models/` devant les noms de modeles quand necessaire. `gemini-2.5-flash` et `models/gemini-2.5-flash` fonctionnent tous les deux correctement.

## Alias du fournisseur

Les noms suivants resolvent tous vers le fournisseur Gemini :

- `gemini`
- `google`
- `google-gemini`

## Depannage

### "Gemini API key not found"

PRX n'a trouve aucune authentification. Options :

1. Definir la variable d'environnement `GEMINI_API_KEY`
2. Lancer le CLI `gemini` pour s'authentifier (les tokens seront reutilises automatiquement)
3. Obtenir une cle API depuis [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
4. Executer `prx onboard` pour configurer de maniere interactive

### "400 Bad Request: API key not valid" avec Gemini CLI

Cela se produit lorsque les tokens OAuth du Gemini CLI sont envoyes a l'endpoint de l'API publique. PRX gere cela en routant automatiquement les tokens OAuth vers l'endpoint interne `cloudcode-pa.googleapis.com`. Si vous voyez cette erreur, assurez-vous d'utiliser la derniere version de PRX.

### "Gemini CLI OAuth token expired"

Relancez le CLI `gemini` pour rafraichir votre token. PRX ne rafraichit pas automatiquement les tokens du Gemini CLI (contrairement aux tokens OAuth Anthropic).

### 403 Forbidden

Votre cle API n'a peut-etre pas l'API Generative Language activee. Allez dans la [Google Cloud Console](https://console.cloud.google.com/) et activez l'**API Generative Language** pour votre projet.
