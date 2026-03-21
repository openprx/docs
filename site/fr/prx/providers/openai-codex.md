---
title: OpenAI Codex
description: Configurer OpenAI Codex (flux OAuth2 GitHub Copilot) comme fournisseur LLM dans PRX
---

# OpenAI Codex

> Accedez aux modeles Codex d'OpenAI via l'API ChatGPT Responses en utilisant le flux d'authentification OAuth2 de GitHub Copilot. Fournit l'acces aux modeles GPT-5.x Codex avec capacites de raisonnement et appel d'outils natif.

## Prerequis

- Un abonnement ChatGPT Plus, Team ou Enterprise
- Un token OAuth2 Codex CLI ou GitHub Copilot existant, **ou** la volonte d'executer le flux `prx auth login`

## Configuration rapide

### 1. S'authentifier

```bash
prx auth login --provider openai-codex
```

Cela initie le flux de code d'appareil GitHub OAuth et stocke les tokens dans `~/.openprx/`.

### 2. Configurer

```toml
[default]
provider = "openai-codex"
model = "gpt-5.3-codex"
```

### 3. Verifier

```bash
prx doctor models
```

## Modeles disponibles

| Modele | Contexte | Vision | Outils | Notes |
|--------|----------|--------|--------|-------|
| `gpt-5.3-codex` | 128K | Oui | Oui | Dernier modele Codex, capacite maximale |
| `gpt-5.2-codex` | 128K | Oui | Oui | Generation precedente Codex |
| `gpt-5.1-codex` | 128K | Oui | Oui | Version stable Codex |
| `gpt-5.1-codex-mini` | 128K | Oui | Oui | Variante Codex plus petite et rapide |
| `gpt-5-codex` | 128K | Oui | Oui | Premiere generation Codex 5 |
| `o3` | 128K | Oui | Oui | Modele de raisonnement OpenAI |
| `o4-mini` | 128K | Oui | Oui | Modele de raisonnement compact |

## Reference de la configuration

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `model` | string | `gpt-5.3-codex` | Modele Codex par defaut a utiliser |

Aucune cle API n'est necessaire dans la configuration. L'authentification est geree via le flux OAuth stocke dans `~/.openprx/`.

## Fonctionnalites

### API Responses

Contrairement au fournisseur OpenAI standard qui utilise l'API Chat Completions, le fournisseur Codex utilise la plus recente API Responses (`/codex/responses`) avec :

- Streaming SSE avec evenements de texte delta en temps reel
- Elements de sortie `function_call` structures pour l'utilisation d'outils
- Controle de l'effort de raisonnement (`minimal` / `low` / `medium` / `high` / `xhigh`)
- Resumes de raisonnement dans les metadonnees de reponse

### Effort de raisonnement automatique

PRX ajuste automatiquement l'effort de raisonnement en fonction du modele :

| Modele | `minimal` | `xhigh` |
|--------|-----------|---------|
| `gpt-5.2-codex` / `gpt-5.3-codex` | Limite a `low` | Autorise |
| `gpt-5.1` | Autorise | Limite a `high` |
| `gpt-5.1-codex-mini` | Limite a `medium` | Limite a `high` |

Remplacez avec la variable d'environnement `ZEROCLAW_CODEX_REASONING_EFFORT`.

### Appel d'outils natif

Les definitions d'outils sont envoyees au format de l'API Responses avec `type: "function"`, `name`, `description` et `parameters`. Les noms d'outils contenant des points (ex. `email.execute`) sont automatiquement assainis en underscores (`email_execute`) avec un mapping inverse pour restaurer les noms originaux dans les resultats.

### Gestion des tokens OAuth2

PRX gere le cycle de vie OAuth2 complet :

1. **Connexion** : `prx auth login --provider openai-codex` initie le flux de code d'appareil
2. **Stockage des tokens** : Les tokens sont stockes chiffres dans `~/.openprx/`
3. **Rafraichissement automatique** : Les tokens d'acces expires sont automatiquement rafraichis en utilisant le token de rafraichissement stocke
4. **Import Codex CLI** : Si vous avez une installation Codex CLI existante, PRX peut importer ses tokens automatiquement

### Gestion du streaming

Le fournisseur gere les flux SSE avec :
- Timeout d'inactivite (45 secondes par defaut, configurable via `ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS`)
- Taille de reponse maximale (4 Mo)
- Gestion gracieuse des marqueurs `[DONE]` et des evenements de reponse terminaux
- Detection automatique du type de contenu (SSE vs JSON)

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `ZEROCLAW_CODEX_REASONING_EFFORT` | Remplacer l'effort de raisonnement (`minimal` / `low` / `medium` / `high` / `xhigh`) |
| `ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS` | Timeout d'inactivite du flux en secondes (defaut : 45, minimum : 5) |

## Depannage

### "OpenAI Codex auth profile not found"

Executez `prx auth login --provider openai-codex` pour vous authentifier. Cela necessite un abonnement ChatGPT.

### "OpenAI Codex account id not found"

Le token JWT ne contient pas d'ID de compte. Reauthentifiez-vous avec `prx auth login --provider openai-codex`.

### Erreurs de timeout du flux

Si vous voyez `provider_response_timeout kind=stream_idle_timeout`, le modele met trop de temps a repondre. Options :
- Augmenter le timeout : `export ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS=120`
- Utiliser un modele plus rapide comme `gpt-5.1-codex-mini`

### Erreur "payload_too_large"

La reponse a depasse 4 Mo. Cela indique generalement une reponse de modele inhabituellement volumineuse. Essayez de decouper votre requete en parties plus petites.
