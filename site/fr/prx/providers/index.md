---
title: Fournisseurs LLM
description: Apercu des 9+ fournisseurs LLM pris en charge par PRX, incluant la matrice de capacites, la configuration, les chaines de secours et le routage.
---

# Fournisseurs LLM

PRX se connecte aux grands modeles de langage via des **fournisseurs** -- des backends modulaires qui implementent le trait `Provider`. Chaque fournisseur gere l'authentification, le formatage des requetes, le streaming et la classification des erreurs pour une API LLM specifique.

PRX est livre avec 9 fournisseurs integres, un endpoint compatible OpenAI pour les services tiers, ainsi qu'une infrastructure de chaines de secours et de routage intelligent.

## Matrice de capacites

| Fournisseur | Modeles cles | Streaming | Vision | Outils | OAuth | Auto-heberge |
|-------------|-------------|-----------|--------|--------|-------|--------------|
| [Anthropic](/fr/prx/providers/anthropic) | Claude Opus 4, Claude Sonnet 4 | Oui | Oui | Oui | Oui (Claude Code) | Non |
| [OpenAI](/fr/prx/providers/openai) | GPT-4o, o1, o3 | Oui | Oui | Oui | Non | Non |
| [Google Gemini](/fr/prx/providers/google-gemini) | Gemini 2.0 Flash, Gemini 1.5 Pro | Oui | Oui | Oui | Oui (Gemini CLI) | Non |
| [OpenAI Codex](/fr/prx/providers/openai-codex) | Modeles Codex | Oui | Non | Oui | Oui | Non |
| [GitHub Copilot](/fr/prx/providers/github-copilot) | Modeles Copilot Chat | Oui | Non | Oui | Oui (Device Flow) | Non |
| [Ollama](/fr/prx/providers/ollama) | Llama 3, Mistral, Qwen, tout GGUF | Oui | Selon le modele | Oui | Non | Oui |
| [AWS Bedrock](/fr/prx/providers/aws-bedrock) | Claude, Titan, Llama | Oui | Selon le modele | Selon le modele | AWS IAM | Non |
| [GLM](/fr/prx/providers/glm) | GLM-4, Zhipu, Minimax, Moonshot, Qwen, Z.AI | Oui | Selon le modele | Selon le modele | Oui (Minimax/Qwen) | Non |
| [OpenRouter](/fr/prx/providers/openrouter) | 200+ modeles de multiples fournisseurs | Oui | Selon le modele | Selon le modele | Non | Non |
| [Compatible personnalise](/fr/prx/providers/custom-compatible) | Toute API compatible OpenAI | Oui | Selon l'endpoint | Selon l'endpoint | Non | Oui |

## Configuration rapide

Les fournisseurs sont configures dans `~/.config/openprx/config.toml` (ou `~/.openprx/config.toml`). Au minimum, definissez le fournisseur par defaut et fournissez une cle API :

```toml
# Select the default provider and model
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7

# API key (can also be set via ANTHROPIC_API_KEY env var)
api_key = "sk-ant-..."
```

Pour les fournisseurs auto-heberges comme Ollama, specifiez l'endpoint :

```toml
default_provider = "ollama"
default_model = "llama3:70b"
api_url = "http://localhost:11434"
```

Chaque fournisseur resout sa cle API dans cet ordre :

1. Le champ `api_key` dans `config.toml`
2. La variable d'environnement specifique au fournisseur (ex. `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`)
3. La variable d'environnement generique `API_KEY`

Consultez [Variables d'environnement](/fr/prx/config/environment) pour la liste complete des variables prises en charge.

## Chaines de secours avec ReliableProvider

PRX encapsule les appels aux fournisseurs dans une couche `ReliableProvider` qui offre :

- **Reessai automatique** avec backoff exponentiel pour les erreurs transitoires (5xx, 429 limites de debit, timeouts reseau)
- **Chaines de secours** -- lorsque le fournisseur principal echoue, les requetes sont automatiquement redirigees vers le fournisseur suivant dans la chaine
- **Detection des erreurs non retriables** -- les erreurs client comme les cles API invalides (401/403) et les modeles inconnus (404) echouent immediatement sans gaspiller de reessais

Configurez la fiabilite dans la section `[reliability]` :

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

Lorsque le fournisseur principal (ex. Anthropic) retourne une erreur transitoire, PRX reessaie jusqu'a `max_retries` fois avec backoff. Si tous les reessais sont epuises, il bascule vers le premier fournisseur de secours. La chaine de secours continue jusqu'a obtenir une reponse reussie ou jusqu'a epuisement de tous les fournisseurs.

### Classification des erreurs

Le ReliableProvider classifie les erreurs en deux categories :

- **Retriables** : HTTP 5xx, 429 (limite de debit), 408 (timeout), erreurs reseau
- **Non retriables** : HTTP 4xx (sauf 429/408), cles API invalides, modeles inconnus, reponses malformees

Les erreurs non retriables sautent les reessais et basculent immediatement vers le fournisseur suivant, evitant ainsi une latence inutile.

## Integration du routeur

Pour les configurations multi-modeles avancees, PRX prend en charge un routeur LLM heuristique qui selectionne le fournisseur et le modele optimaux par requete en fonction de :

- **Scoring de capacite** -- fait correspondre la complexite de la requete aux forces du modele
- **Classement Elo** -- suit les performances du modele dans le temps
- **Optimisation des couts** -- privilegie les modeles moins chers pour les requetes simples
- **Ponderation de la latence** -- prend en compte le temps de reponse
- **Routage semantique KNN** -- utilise les embeddings historiques des requetes pour un routage base sur la similarite
- **Escalade Automix** -- commence avec un modele economique et escalade vers un modele premium lorsque la confiance est faible

```toml
[router]
enabled = true
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
premium_model_id = "anthropic/claude-sonnet-4-6"
```

Consultez la [Configuration du routeur](/fr/prx/router/) pour tous les details.

## Pages des fournisseurs

- [Anthropic (Claude)](/fr/prx/providers/anthropic)
- [OpenAI](/fr/prx/providers/openai)
- [Google Gemini](/fr/prx/providers/google-gemini)
- [OpenAI Codex](/fr/prx/providers/openai-codex)
- [GitHub Copilot](/fr/prx/providers/github-copilot)
- [Ollama](/fr/prx/providers/ollama)
- [AWS Bedrock](/fr/prx/providers/aws-bedrock)
- [GLM (Zhipu / Minimax / Moonshot / Qwen / Z.AI)](/fr/prx/providers/glm)
- [OpenRouter](/fr/prx/providers/openrouter)
- [Endpoint compatible personnalise](/fr/prx/providers/custom-compatible)
