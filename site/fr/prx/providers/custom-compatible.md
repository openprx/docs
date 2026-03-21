---
title: Compatible personnalise
description: Configurer tout endpoint API compatible OpenAI comme fournisseur LLM dans PRX
---

# Compatible personnalise

> Connectez PRX a toute API LLM qui suit le format OpenAI Chat Completions. Fonctionne avec LiteLLM, vLLM, Groq, Mistral, xAI, Venice, Vercel AI, Cloudflare AI, HuggingFace Inference et tout autre service compatible OpenAI.

## Prerequis

- Une API LLM en cours d'execution qui implemente le format OpenAI Chat Completions (`/v1/chat/completions` ou `/chat/completions`)
- Une cle API (si requise par le service)

## Configuration rapide

### 1. Identifier votre endpoint

Determinez l'URL de base et la methode d'authentification de votre API. Par exemple :

- Groq : `https://api.groq.com/openai/v1`
- Mistral : `https://api.mistral.ai/v1`
- xAI : `https://api.x.ai/v1`
- vLLM local : `http://localhost:8000/v1`
- Proxy LiteLLM : `http://localhost:4000`

### 2. Configurer

```toml
[default]
provider = "compatible"
model = "your-model-name"

[providers.compatible]
api_key = "${YOUR_API_KEY}"
api_url = "https://api.your-provider.com/v1"
```

### 3. Verifier

```bash
prx doctor models
```

## Fournisseurs compatibles integres

PRX inclut des alias preconfigures pour les services populaires compatibles OpenAI :

| Nom du fournisseur | Alias | URL de base | Style d'auth |
|-------------------|-------|-------------|--------------|
| Venice | `venice` | `https://api.venice.ai` | Bearer |
| Vercel AI | `vercel`, `vercel-ai` | `https://api.vercel.ai` | Bearer |
| Cloudflare AI | `cloudflare`, `cloudflare-ai` | `https://gateway.ai.cloudflare.com/v1` | Bearer |
| Groq | `groq` | `https://api.groq.com/openai/v1` | Bearer |
| Mistral | `mistral` | `https://api.mistral.ai/v1` | Bearer |
| xAI | `xai`, `grok` | `https://api.x.ai/v1` | Bearer |
| Qianfan | `qianfan`, `baidu` | `https://aip.baidubce.com` | Bearer |
| Synthetic | `synthetic` | `https://api.synthetic.com` | Bearer |
| OpenCode Zen | `opencode`, `opencode-zen` | `https://opencode.ai/zen/v1` | Bearer |
| LiteLLM | `litellm`, `lite-llm` | configurable | Bearer |
| vLLM | `vllm`, `v-llm` | configurable | Bearer |
| HuggingFace | `huggingface`, `hf` | configurable | Bearer |

## Reference de la configuration

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `api_key` | string | optionnel | Cle d'authentification API |
| `api_url` | string | requis | URL de base de l'endpoint API |
| `model` | string | requis | Nom/ID du modele a utiliser |
| `auth_style` | string | `"bearer"` | Style d'en-tete d'authentification (voir ci-dessous) |

### Styles d'authentification

| Style | Format d'en-tete | Utilisation |
|-------|-----------------|-------------|
| `bearer` | `Authorization: Bearer <key>` | La plupart des fournisseurs (defaut) |
| `x-api-key` | `x-api-key: <key>` | Certains fournisseurs chinois |
| `custom` | Nom d'en-tete personnalise | Cas speciaux |

## Fonctionnalites

### Detection automatique d'endpoint

PRX ajoute automatiquement `/chat/completions` a votre URL de base. Vous n'avez pas besoin d'inclure le chemin de l'endpoint :

```toml
# Correct - PRX appends /chat/completions
api_url = "https://api.groq.com/openai/v1"

# Also correct - explicit path works too
api_url = "https://api.groq.com/openai/v1/chat/completions"
```

### Repli sur l'API Responses

Pour les fournisseurs qui prennent en charge la plus recente API Responses d'OpenAI, PRX peut basculer vers `/v1/responses` lorsque `/v1/chat/completions` retourne un 404. Cela est active par defaut mais peut etre desactive pour les fournisseurs qui ne le prennent pas en charge (ex. GLM/Zhipu).

### Appel d'outils natif

Les outils sont envoyes au format standard d'appel de fonctions d'OpenAI :

```json
{
  "type": "function",
  "function": {
    "name": "tool_name",
    "description": "Tool description",
    "parameters": { "type": "object", "properties": {...} }
  }
}
```

Le fournisseur prend en charge `tool_choice: "auto"` et deserialise correctement les reponses `tool_calls` structurees.

### Prise en charge de la vision

Pour les modeles compatibles vision, les images integrees dans les messages sous forme de marqueurs `[IMAGE:data:image/png;base64,...]` sont automatiquement converties au format vision OpenAI avec des blocs de contenu `image_url`.

### Prise en charge du streaming

Le fournisseur compatible prend en charge le streaming SSE pour la livraison de tokens en temps reel. Les evenements de flux sont analyses de maniere incrementale avec prise en charge de :
- Morceaux de texte `delta.content`
- `delta.tool_calls` pour la construction incrementale d'appels d'outils
- Detection du marqueur `[DONE]`
- Gestion gracieuse des timeouts

### Fusion des messages systeme

Certains fournisseurs (ex. MiniMax) rejettent les messages `role: system`. PRX peut automatiquement fusionner le contenu du message systeme dans le premier message utilisateur. Cela est active par defaut pour les fournisseurs connus comme incompatibles.

### Mode HTTP/1.1 force

Certains fournisseurs (notamment DashScope/Qwen) necessitent HTTP/1.1 au lieu de HTTP/2. PRX detecte automatiquement ces endpoints et force HTTP/1.1 pour la fiabilite de connexion.

### Repli sur le contenu de raisonnement

Pour les modeles de raisonnement qui retournent leur sortie dans `reasoning_content` au lieu de `content`, PRX bascule automatiquement pour extraire le texte de raisonnement.

## Configuration avancee

### Serveur LLM local (vLLM, llama.cpp, etc.)

```toml
[default]
provider = "compatible"
model = "meta-llama/Llama-3.1-8B-Instruct"

[providers.compatible]
api_url = "http://localhost:8000/v1"
# No api_key needed for local servers
```

### Proxy LiteLLM

```toml
[default]
provider = "litellm"
model = "gpt-4o"

[providers.litellm]
api_key = "${LITELLM_API_KEY}"
api_url = "http://localhost:4000"
```

### Fournisseurs personnalises multiples

Utilisez le routeur de modeles pour configurer plusieurs fournisseurs compatibles :

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[[model_routes]]
pattern = "groq/*"
provider = "compatible"
api_url = "https://api.groq.com/openai/v1"
api_key = "${GROQ_API_KEY}"

[[model_routes]]
pattern = "mistral/*"
provider = "compatible"
api_url = "https://api.mistral.ai/v1"
api_key = "${MISTRAL_API_KEY}"
```

## Depannage

### Connexion refusee

Assurez-vous que l'endpoint API est accessible :
```bash
curl -v https://api.your-provider.com/v1/models
```

### 401 Unauthorized

- Verifiez que votre cle API est correcte
- Verifiez que le style d'authentification correspond a votre fournisseur (Bearer vs x-api-key)
- Certains fournisseurs necessitent des en-tetes supplementaires ; utilisez un alias de fournisseur nomme si disponible

### "role: system" rejete

Si votre fournisseur ne prend pas en charge les messages systeme, PRX devrait gerer cela automatiquement pour les fournisseurs connus. Pour les endpoints personnalises, c'est une limitation du fournisseur. Solution de contournement : incluez les instructions systeme dans le premier message utilisateur.

### Le streaming ne fonctionne pas

Toutes les API compatibles OpenAI ne prennent pas en charge le streaming. Si le streaming echoue, PRX bascule automatiquement en mode non-streaming.

### Modele non trouve

Verifiez le nom/ID exact du modele attendu par votre fournisseur. Differents fournisseurs utilisent differentes conventions de nommage :
- Groq : `llama-3.3-70b-versatile`
- Mistral : `mistral-large-latest`
- xAI : `grok-2`

Consultez la documentation de votre fournisseur pour les identifiants de modeles corrects.
