---
title: Anthropic
description: Configurer Anthropic Claude comme fournisseur LLM dans PRX
---

# Anthropic

> Accedez aux modeles Claude (Opus, Sonnet, Haiku) via l'API Anthropic Messages avec appel d'outils natif, vision, mise en cache des prompts et rafraichissement automatique des tokens OAuth.

## Prerequis

- Une cle API Anthropic depuis [console.anthropic.com](https://console.anthropic.com/), **ou**
- Un token OAuth Claude Code (detecte automatiquement depuis `~/.claude/.credentials.json`)

## Configuration rapide

### 1. Obtenir une cle API

1. Inscrivez-vous sur [console.anthropic.com](https://console.anthropic.com/)
2. Naviguez vers **API Keys** dans le tableau de bord
3. Cliquez sur **Create Key** et copiez la cle (commence par `sk-ant-`)

### 2. Configurer

```toml
[default]
provider = "anthropic"
model = "claude-sonnet-4-20250514"

[providers.anthropic]
api_key = "${ANTHROPIC_API_KEY}"
```

Ou definissez la variable d'environnement :

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Verifier

```bash
prx doctor models
```

## Modeles disponibles

| Modele | Contexte | Vision | Outils | Notes |
|--------|----------|--------|--------|-------|
| `claude-opus-4-20250514` | 200K | Oui | Oui | Le plus performant, ideal pour le raisonnement complexe |
| `claude-sonnet-4-20250514` | 200K | Oui | Oui | Meilleur equilibre vitesse/capacite |
| `claude-haiku-3-5-20241022` | 200K | Oui | Oui | Le plus rapide, le plus economique |
| `claude-sonnet-4-6` | 200K | Oui | Oui | Derniere version Sonnet |
| `claude-opus-4-6` | 200K | Oui | Oui | Derniere version Opus |

## Reference de la configuration

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `api_key` | string | requis | Cle API Anthropic (`sk-ant-...`) ou token OAuth |
| `api_url` | string | `https://api.anthropic.com` | URL de base personnalisee (pour les proxys) |
| `model` | string | `claude-sonnet-4-20250514` | Modele par defaut a utiliser |

## Fonctionnalites

### Appel d'outils natif

PRX envoie les definitions d'outils dans le format natif d'Anthropic avec `input_schema`, evitant la conversion avec perte du format OpenAI vers Anthropic. Les resultats d'outils sont correctement encapsules dans des blocs de contenu `tool_result`.

### Vision (analyse d'images)

Les images integrees dans les messages sous forme de marqueurs `[IMAGE:data:image/png;base64,...]` sont automatiquement converties en blocs de contenu `image` natifs d'Anthropic avec les champs `media_type` et `source_type` appropries. Les images jusqu'a 20 Mo sont prises en charge (un avertissement est journalise pour les charges utiles depassant cette taille).

### Mise en cache des prompts

PRX applique automatiquement la mise en cache ephemere des prompts d'Anthropic pour reduire les couts et la latence :

- Les **prompts systeme** de plus de ~1024 tokens (3 Ko) recoivent un bloc `cache_control`
- Les **conversations** avec plus de 4 messages non-systeme ont le dernier message mis en cache
- Les **definitions d'outils** ont le dernier outil marque avec `cache_control: ephemeral`

Aucune configuration n'est requise ; la mise en cache est appliquee de maniere transparente.

### Rafraichissement automatique des tokens OAuth

Lors de l'utilisation des identifiants Claude Code, PRX automatiquement :

1. Detecte les tokens OAuth en cache depuis `~/.claude/.credentials.json`
2. Rafraichit proactivement les tokens 90 secondes avant expiration
3. Reessaie sur les reponses 401 avec un token rafraichi
4. Persiste les identifiants rafraichis sur le disque

Cela signifie que `prx` peut reutiliser une connexion Claude Code existante sans aucune configuration supplementaire.

### Integration Claude Code

PRX reconnait les sources d'authentification Anthropic suivantes :

| Source | Detection |
|--------|-----------|
| Cle API directe | Prefixe `sk-ant-api-...`, envoyee via l'en-tete `x-api-key` |
| Token OAuth setup | Prefixe `sk-ant-oat01-...`, envoye via `Authorization: Bearer` avec l'en-tete `anthropic-beta` |
| Identifiant en cache Claude Code | `~/.claude/.credentials.json` avec `access_token` + `refresh_token` |
| Variable d'environnement | `ANTHROPIC_API_KEY` |

### URL de base personnalisee

Pour router via un proxy ou un endpoint alternatif :

```toml
[providers.anthropic]
api_key = "${ANTHROPIC_API_KEY}"
api_url = "https://my-proxy.example.com"
```

## Alias du fournisseur

Les noms suivants resolvent tous vers le fournisseur Anthropic :

- `anthropic`
- `claude-code`
- `claude-cli`

## Depannage

### "Anthropic credentials not set"

PRX n'a trouve aucune authentification. Assurez-vous que l'un des elements suivants est configure :

1. La variable d'environnement `ANTHROPIC_API_KEY`
2. `api_key` dans `config.toml` sous `[providers.anthropic]`
3. Un fichier `~/.claude/.credentials.json` valide provenant de Claude Code

### 401 Unauthorized

- **Cle API** : Verifiez qu'elle commence par `sk-ant-api-` et qu'elle n'est pas expiree
- **Token OAuth** : Executez `prx auth login --provider anthropic` pour vous reauthentifier, ou redemarrez Claude Code pour rafraichir le token
- **Probleme de proxy** : Si vous utilisez une `api_url` personnalisee, confirmez que le proxy transmet correctement l'en-tete `x-api-key` ou `Authorization`

### Charge d'image trop volumineuse

Anthropic recommande des images de moins de 20 Mo en forme encodee base64. Redimensionnez ou compressez les images volumineuses avant envoi.

### La mise en cache des prompts ne fonctionne pas

La mise en cache est automatique mais necessite :
- Un prompt systeme > 3 Ko pour declencher la mise en cache au niveau systeme
- Plus de 4 messages non-systeme pour declencher la mise en cache de conversation
- La version d'API `2023-06-01` (definie automatiquement par PRX)
