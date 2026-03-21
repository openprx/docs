---
title: OpenAI
description: Configurer OpenAI comme fournisseur LLM dans PRX
---

# OpenAI

> Accedez aux modeles GPT via l'API OpenAI Chat Completions avec appel de fonctions natif, vision et prise en charge des modeles de raisonnement.

## Prerequis

- Une cle API OpenAI depuis [platform.openai.com](https://platform.openai.com/)

## Configuration rapide

### 1. Obtenir une cle API

1. Inscrivez-vous sur [platform.openai.com](https://platform.openai.com/)
2. Naviguez vers **API Keys** dans la barre laterale gauche
3. Cliquez sur **Create new secret key** et copiez-la (commence par `sk-`)

### 2. Configurer

```toml
[default]
provider = "openai"
model = "gpt-4o"

[providers.openai]
api_key = "${OPENAI_API_KEY}"
```

Ou definissez la variable d'environnement :

```bash
export OPENAI_API_KEY="sk-..."
```

### 3. Verifier

```bash
prx doctor models
```

## Modeles disponibles

| Modele | Contexte | Vision | Outils | Notes |
|--------|----------|--------|--------|-------|
| `gpt-4o` | 128K | Oui | Oui | Meilleur modele generaliste |
| `gpt-4o-mini` | 128K | Oui | Oui | Plus petit, plus rapide, moins cher |
| `gpt-4-turbo` | 128K | Oui | Oui | Generation precedente phare |
| `o3` | 128K | Oui | Oui | Modele de raisonnement |
| `o4-mini` | 128K | Oui | Oui | Modele de raisonnement compact |
| `gpt-4` | 8K | Non | Oui | GPT-4 original |

## Reference de la configuration

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `api_key` | string | requis | Cle API OpenAI (`sk-...`) |
| `api_url` | string | `https://api.openai.com/v1` | URL de base personnalisee |
| `model` | string | `gpt-4o` | Modele par defaut a utiliser |

## Fonctionnalites

### Appel de fonctions natif

PRX envoie les outils dans le format natif `function` d'OpenAI. Les definitions d'outils incluent `name`, `description` et `parameters` (JSON Schema). Le fournisseur prend en charge `tool_choice: "auto"` pour la selection automatique des outils.

### Vision

Les modeles compatibles vision (GPT-4o, GPT-4o-mini) peuvent analyser les images incluses dans la conversation. Les images sont envoyees en ligne via le format de message standard.

### Prise en charge des modeles de raisonnement

Pour les modeles de raisonnement (o1, o3, o4-mini), PRX gere automatiquement le repli vers `reasoning_content`. Lorsque le modele retourne sa sortie dans `reasoning_content` au lieu de `content`, PRX extrait le texte de raisonnement de maniere transparente.

### Conversations multi-tours

L'historique complet de la conversation est preserve et envoye a l'API, incluant les prompts systeme, les messages utilisateur, les reponses de l'assistant et les paires appel/resultat d'outils dans le format structure natif d'OpenAI.

### URL de base personnalisee

Pour utiliser un proxy, Azure OpenAI ou tout endpoint compatible OpenAI :

```toml
[providers.openai]
api_key = "${OPENAI_API_KEY}"
api_url = "https://my-proxy.example.com/v1"
```

### Prechauffage de connexion

Au demarrage, PRX envoie une requete legere `GET /models` pour etablir le pooling de connexions TLS et HTTP/2, reduisant la latence de la premiere requete reelle.

## Depannage

### "OpenAI API key not set"

Definissez la variable d'environnement `OPENAI_API_KEY` ou ajoutez `api_key` a `[providers.openai]` dans votre `config.toml`.

### 429 Rate Limit

OpenAI impose des limites de tokens et de requetes par minute. Solutions :
- Attendre et reessayer (PRX gere cela automatiquement avec le wrapper de fournisseur fiable)
- Mettre a niveau votre abonnement OpenAI pour des limites plus elevees
- Utiliser `fallback_providers` pour basculer vers un autre fournisseur lors de la limitation de debit

### Reponse vide des modeles de raisonnement

Si vous utilisez o1/o3/o4-mini et obtenez des reponses vides, c'est un comportement attendu lorsque la sortie du modele est entierement dans `reasoning_content`. PRX bascule automatiquement vers `reasoning_content` lorsque `content` est vide.
