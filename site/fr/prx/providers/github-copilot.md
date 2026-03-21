---
title: GitHub Copilot
description: Configurer GitHub Copilot comme fournisseur LLM dans PRX
---

# GitHub Copilot

> Accedez aux modeles GitHub Copilot Chat via l'API Copilot avec authentification automatique par flux de code d'appareil OAuth et gestion des tokens.

## Prerequis

- Un compte GitHub avec un abonnement actif **Copilot Individual**, **Copilot Business** ou **Copilot Enterprise**
- Optionnellement, un token d'acces personnel GitHub (sinon, la connexion interactive par flux de code d'appareil est utilisee)

## Configuration rapide

### 1. S'authentifier

A la premiere utilisation, PRX vous demandera de vous authentifier via le flux de code d'appareil de GitHub :

```
GitHub Copilot authentication is required.
Visit: https://github.com/login/device
Code: XXXX-XXXX
Waiting for authorization...
```

Alternativement, fournissez un token GitHub directement :

```bash
export GITHUB_TOKEN="ghp_..."
```

### 2. Configurer

```toml
[default]
provider = "copilot"
model = "gpt-4o"
```

### 3. Verifier

```bash
prx doctor models
```

## Modeles disponibles

GitHub Copilot fournit l'acces a un ensemble selectionne de modeles. Les modeles disponibles dependent de votre niveau d'abonnement Copilot :

| Modele | Contexte | Vision | Outils | Notes |
|--------|----------|--------|--------|-------|
| `gpt-4o` | 128K | Oui | Oui | Modele Copilot par defaut |
| `gpt-4o-mini` | 128K | Oui | Oui | Plus rapide, economique |
| `claude-sonnet-4` | 200K | Oui | Oui | Disponible sur Copilot Enterprise |
| `o3-mini` | 128K | Non | Oui | Modele de raisonnement |

La disponibilite des modeles peut varier selon votre abonnement GitHub Copilot et les offres de modeles actuelles de GitHub.

## Reference de la configuration

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `api_key` | string | optionnel | Token d'acces personnel GitHub (`ghp_...` ou `gho_...`) |
| `model` | string | `gpt-4o` | Modele par defaut a utiliser |

## Fonctionnalites

### Authentification sans configuration

Le fournisseur Copilot implemente le meme flux de code d'appareil OAuth utilise par l'extension Copilot de VS Code :

1. **Demande de code d'appareil** : PRX demande un code d'appareil a GitHub
2. **Autorisation utilisateur** : Vous visitez `github.com/login/device` et entrez le code
3. **Echange de token** : Le token OAuth GitHub est echange contre une cle API Copilot a duree de vie courte
4. **Mise en cache automatique** : Les tokens sont mis en cache dans `~/.config/openprx/copilot/` avec des permissions de fichier securisees (0600)
5. **Rafraichissement automatique** : Les cles API Copilot expirees sont automatiquement reechangees sans reauthentification

### Stockage securise des tokens

Les tokens sont stockes avec une securite stricte :
- Repertoire : `~/.config/openprx/copilot/` avec permissions 0700
- Fichiers : `access-token` et `api-key.json` avec permissions 0600
- Sur les plateformes non-Unix, la creation de fichiers standard est utilisee

### Endpoint API dynamique

La reponse de la cle API Copilot inclut un champ `endpoints.api` qui specifie l'endpoint API reel. PRX respecte cette valeur, avec un repli vers `https://api.githubcopilot.com` lorsqu'aucun endpoint n'est specifie.

### Appel d'outils natif

Les outils sont envoyes au format compatible OpenAI via l'API Copilot Chat Completions (`/chat/completions`). Le fournisseur prend en charge `tool_choice: "auto"` pour la selection automatique des outils.

### En-tetes d'editeur

Les requetes incluent les en-tetes d'identification d'editeur Copilot standard :
- `Editor-Version: vscode/1.85.1`
- `Editor-Plugin-Version: copilot/1.155.0`
- `User-Agent: GithubCopilot/1.155.0`

## Depannage

### "Failed to get Copilot API key (401/403)"

Votre token OAuth GitHub est peut-etre expire ou votre abonnement Copilot est inactif :
- Assurez-vous que votre compte GitHub a un abonnement Copilot actif
- PRX efface automatiquement le token d'acces en cache lors d'un 401/403 et redemandera la connexion par flux de code d'appareil

### "Timed out waiting for GitHub authorization"

Le flux de code d'appareil a un timeout de 15 minutes. S'il expire :
- Relancez votre commande PRX pour obtenir un nouveau code
- Assurez-vous de visiter la bonne URL et d'entrer le code exact affiche

### "GitHub device authorization expired"

Le code d'appareil a expire. Relancez simplement votre commande pour demarrer un nouveau flux d'autorisation.

### Modeles non disponibles

Les modeles disponibles dependent de votre niveau d'abonnement Copilot :
- **Copilot Individual** : GPT-4o, GPT-4o-mini
- **Copilot Business/Enterprise** : Peut inclure des modeles supplementaires comme Claude

Verifiez votre abonnement sur [github.com/settings/copilot](https://github.com/settings/copilot).

### Limitation de debit

GitHub Copilot a ses propres limites de debit separees d'OpenAI. Si vous rencontrez une limitation de debit, envisagez d'utiliser `fallback_providers` dans votre configuration PRX pour basculer vers un autre fournisseur.
