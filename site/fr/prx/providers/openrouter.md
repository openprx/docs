---
title: OpenRouter
description: Configurer OpenRouter comme fournisseur LLM dans PRX
---

# OpenRouter

> Accedez a plus de 200 modeles de multiples fournisseurs (OpenAI, Anthropic, Google, Meta, Mistral et plus) via une seule cle API et une interface unifiee.

## Prerequis

- Une cle API OpenRouter depuis [openrouter.ai](https://openrouter.ai/)

## Configuration rapide

### 1. Obtenir une cle API

1. Inscrivez-vous sur [openrouter.ai](https://openrouter.ai/)
2. Allez dans **Keys** dans votre tableau de bord
3. Cliquez sur **Create Key** et copiez-la (commence par `sk-or-`)

### 2. Configurer

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[providers.openrouter]
api_key = "${OPENROUTER_API_KEY}"
```

Ou definissez la variable d'environnement :

```bash
export OPENROUTER_API_KEY="sk-or-..."
```

### 3. Verifier

```bash
prx doctor models
```

## Modeles disponibles

OpenRouter fournit l'acces a des centaines de modeles. Quelques options populaires :

| Modele | Fournisseur | Contexte | Vision | Outils | Notes |
|--------|-------------|----------|--------|--------|-------|
| `anthropic/claude-sonnet-4` | Anthropic | 200K | Oui | Oui | Claude Sonnet 4 |
| `anthropic/claude-opus-4` | Anthropic | 200K | Oui | Oui | Claude Opus 4 |
| `openai/gpt-4o` | OpenAI | 128K | Oui | Oui | GPT-4o |
| `openai/o3` | OpenAI | 128K | Oui | Oui | Modele de raisonnement |
| `google/gemini-2.5-pro` | Google | 1M | Oui | Oui | Gemini Pro |
| `google/gemini-2.5-flash` | Google | 1M | Oui | Oui | Gemini Flash |
| `meta-llama/llama-3.1-405b-instruct` | Meta | 128K | Non | Oui | Plus grand modele ouvert |
| `deepseek/deepseek-chat` | DeepSeek | 128K | Non | Oui | DeepSeek V3 |
| `mistralai/mistral-large` | Mistral | 128K | Non | Oui | Mistral Large |
| `x-ai/grok-2` | xAI | 128K | Non | Oui | Grok 2 |

Parcourez la liste complete des modeles sur [openrouter.ai/models](https://openrouter.ai/models).

## Reference de la configuration

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `api_key` | string | requis | Cle API OpenRouter (`sk-or-...`) |
| `model` | string | requis | ID du modele au format `fournisseur/modele` |

## Fonctionnalites

### Acces multi-fournisseur unifie

Avec une seule cle API OpenRouter, vous pouvez acceder aux modeles d'OpenAI, Anthropic, Google, Meta, Mistral, Cohere et bien d'autres. Cela elimine le besoin de gerer plusieurs cles API.

### API compatible OpenAI

OpenRouter expose une API Chat Completions compatible OpenAI a `https://openrouter.ai/api/v1/chat/completions`. PRX envoie les requetes avec :

- `Authorization: Bearer <key>` pour l'authentification
- `HTTP-Referer: https://github.com/theonlyhennygod/openprx` pour l'identification de l'application
- `X-Title: OpenPRX` pour l'attribution du nom de l'application

### Appel d'outils natif

Les outils sont envoyes au format natif d'appel de fonctions d'OpenAI. Le fournisseur prend en charge `tool_choice: "auto"` et gere correctement les reponses structurees d'appels d'outils incluant le mapping `tool_call_id` pour les interactions multi-tours.

### Historique de conversation multi-tours

L'historique complet de la conversation est preserve avec un formatage structure correct :
- Les messages assistant avec des appels d'outils sont serialises avec des tableaux `tool_calls`
- Les messages de resultats d'outils incluent des references `tool_call_id`
- Les messages systeme, utilisateur et assistant sont transmis directement

### Prechauffage de connexion

Au demarrage, PRX envoie une requete legere a `https://openrouter.ai/api/v1/auth/key` pour verifier la cle API et etablir le pooling de connexions TLS/HTTP2.

### Routage de modeles

OpenRouter prend en charge le routage de modeles et le basculement au niveau de l'API. Vous pouvez aussi utiliser le `fallback_providers` integre de PRX pour un basculement cote client :

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[reliability]
fallback_providers = ["openai"]
```

## Fournisseur par defaut

OpenRouter est le fournisseur par defaut de PRX. Si aucun `provider` n'est specifie dans votre configuration, PRX utilise OpenRouter par defaut.

## Depannage

### "OpenRouter API key not set"

Definissez la variable d'environnement `OPENROUTER_API_KEY` ou ajoutez `api_key` sous `[providers.openrouter]` dans votre `config.toml`. Vous pouvez aussi executer `prx onboard` pour une configuration interactive.

### 402 Payment Required

Votre compte OpenRouter a un solde insuffisant. Ajoutez des credits sur [openrouter.ai/credits](https://openrouter.ai/credits).

### Erreurs specifiques au modele

Differents modeles sur OpenRouter ont des capacites et des limites de debit differentes. Si un modele specifique retourne des erreurs :
- Verifiez si le modele prend en charge l'appel d'outils (tous ne le font pas)
- Verifiez que le modele n'est pas deprecie sur OpenRouter
- Essayez une variante de modele differente

### Reponses lentes

OpenRouter route vers le fournisseur sous-jacent. Le temps de reponse depend de :
- La charge actuelle du fournisseur de modeles
- Votre distance geographique par rapport au fournisseur
- La taille du modele et la longueur du contexte

Envisagez d'utiliser `fallback_providers` pour basculer vers une connexion directe au fournisseur si OpenRouter est lent.

### Limitation de debit

OpenRouter a ses propres limites de debit en plus des limites du fournisseur sous-jacent. En cas de limitation :
- Verifiez votre utilisation sur [openrouter.ai/usage](https://openrouter.ai/usage)
- Mettez a niveau votre abonnement pour des limites plus elevees
- Utilisez le wrapper de fournisseur fiable de PRX pour un reessai automatique avec backoff
