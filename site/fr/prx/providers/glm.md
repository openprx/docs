---
title: GLM (Zhipu AI)
description: Configurer GLM et les fournisseurs d'IA chinois associes (Minimax, Moonshot, Qwen, Z.AI) dans PRX
---

# GLM (Zhipu AI)

> Accedez aux modeles Zhipu GLM et a une famille de fournisseurs d'IA chinois via une configuration unifiee. Inclut des alias pour Minimax, Moonshot (Kimi), Qwen (DashScope) et Z.AI.

## Prerequis

- Une cle API Zhipu AI depuis [open.bigmodel.cn](https://open.bigmodel.cn/) (pour les modeles GLM), **ou**
- Des cles API pour le fournisseur specifique que vous souhaitez utiliser (Minimax, Moonshot, Qwen, etc.)

## Configuration rapide

### 1. Obtenir une cle API

1. Inscrivez-vous sur [open.bigmodel.cn](https://open.bigmodel.cn/)
2. Naviguez vers la section API Keys
3. Creez une nouvelle cle (format : `id.secret`)

### 2. Configurer

```toml
[default]
provider = "glm"
model = "glm-4-plus"

[providers.glm]
api_key = "${GLM_API_KEY}"
```

Ou definissez la variable d'environnement :

```bash
export GLM_API_KEY="abc123.secretXYZ"
```

### 3. Verifier

```bash
prx doctor models
```

## Modeles disponibles

### Modeles GLM

| Modele | Contexte | Vision | Outils | Notes |
|--------|----------|--------|--------|-------|
| `glm-4-plus` | 128K | Oui | Oui | Modele GLM le plus performant |
| `glm-4` | 128K | Oui | Oui | GLM-4 standard |
| `glm-4-flash` | 128K | Oui | Oui | Rapide et economique |
| `glm-4v` | 128K | Oui | Oui | Optimise pour la vision |

### Fournisseurs en alias

PRX prend egalement en charge ces fournisseurs en tant qu'alias routant via l'interface compatible OpenAI :

| Fournisseur | Noms d'alias | URL de base | Modeles cles |
|-------------|-------------|-------------|--------------|
| **Minimax** | `minimax`, `minimax-intl`, `minimax-cn` | `api.minimax.io/v1` (intl), `api.minimaxi.com/v1` (CN) | `MiniMax-Text-01`, `abab6.5s` |
| **Moonshot** | `moonshot`, `kimi`, `moonshot-intl`, `kimi-cn` | `api.moonshot.ai/v1` (intl), `api.moonshot.cn/v1` (CN) | `moonshot-v1-128k`, `moonshot-v1-32k` |
| **Qwen** | `qwen`, `dashscope`, `qwen-intl`, `qwen-us` | `dashscope.aliyuncs.com` (CN), `dashscope-intl.aliyuncs.com` (intl) | `qwen-max`, `qwen-plus`, `qwen-turbo` |
| **Z.AI** | `zai`, `z.ai`, `zai-cn` | `api.z.ai/api/coding/paas/v4` (global), `open.bigmodel.cn/api/coding/paas/v4` (CN) | Modeles de code Z.AI |

## Reference de la configuration

### GLM (fournisseur natif)

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `api_key` | string | requis | Cle API GLM au format `id.secret` |
| `model` | string | requis | Nom du modele GLM |

### Fournisseurs en alias (compatibles OpenAI)

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `api_key` | string | requis | Cle API specifique au fournisseur |
| `api_url` | string | auto-detecte | Remplacer l'URL de base par defaut |
| `model` | string | requis | Nom du modele |

## Fonctionnalites

### Authentification JWT

GLM utilise une authentification basee sur JWT plutot que de simples cles API. PRX automatiquement :

1. Separe la cle API en composants `id` et `secret`
2. Genere un token JWT avec :
   - En-tete : `{"alg":"HS256","typ":"JWT","sign_type":"SIGN"}`
   - Payload : `{"api_key":"<id>","exp":<expiry_ms>,"timestamp":<now_ms>}`
   - Signature : HMAC-SHA256 avec la cle secrete
3. Met en cache le JWT pendant 3 minutes (le token expire a 3,5 minutes)
4. L'envoie en tant que `Authorization: Bearer <jwt>`

### Endpoints regionaux

La plupart des fournisseurs en alias offrent des endpoints internationaux et pour la Chine continentale :

```toml
# International (default for most)
provider = "moonshot-intl"

# China mainland
provider = "moonshot-cn"

# Explicit regional variants
provider = "qwen-us"      # US region
provider = "qwen-intl"    # International
provider = "qwen-cn"      # China mainland
```

### Prise en charge OAuth Minimax

Minimax prend en charge l'authentification par token OAuth :

```bash
export MINIMAX_OAUTH_TOKEN="..."
export MINIMAX_OAUTH_REFRESH_TOKEN="..."
```

Definissez `provider = "minimax-oauth"` ou `provider = "minimax-oauth-cn"` pour utiliser OAuth au lieu de l'authentification par cle API.

### Modes OAuth et code Qwen

Qwen offre des modes d'acces supplementaires :

- **Qwen OAuth** : `provider = "qwen-oauth"` ou `provider = "qwen-code"` pour l'acces base sur OAuth
- **Qwen Coding** : `provider = "qwen-coding"` ou `provider = "dashscope-coding"` pour l'endpoint API specialise code

## Reference des alias de fournisseurs

| Alias | Resout vers | Endpoint |
|-------|-------------|----------|
| `glm`, `zhipu`, `glm-global`, `zhipu-global` | GLM (global) | `api.z.ai/api/paas/v4` |
| `glm-cn`, `zhipu-cn`, `bigmodel` | GLM (CN) | `open.bigmodel.cn/api/paas/v4` |
| `minimax`, `minimax-intl`, `minimax-global` | MiniMax (intl) | `api.minimax.io/v1` |
| `minimax-cn`, `minimaxi` | MiniMax (CN) | `api.minimaxi.com/v1` |
| `moonshot`, `kimi`, `moonshot-cn`, `kimi-cn` | Moonshot (CN) | `api.moonshot.cn/v1` |
| `moonshot-intl`, `kimi-intl`, `kimi-global` | Moonshot (intl) | `api.moonshot.ai/v1` |
| `qwen`, `dashscope`, `qwen-cn` | Qwen (CN) | `dashscope.aliyuncs.com` |
| `qwen-intl`, `dashscope-intl` | Qwen (intl) | `dashscope-intl.aliyuncs.com` |
| `qwen-us`, `dashscope-us` | Qwen (US) | `dashscope-us.aliyuncs.com` |
| `zai`, `z.ai` | Z.AI (global) | `api.z.ai/api/coding/paas/v4` |
| `zai-cn`, `z.ai-cn` | Z.AI (CN) | `open.bigmodel.cn/api/coding/paas/v4` |

## Depannage

### "GLM API key not set or invalid format"

La cle API GLM doit etre au format `id.secret` (contient exactement un point). Verifiez le format de votre cle :
```
abc123.secretXYZ  # correct
abc123secretXYZ   # incorrect - point manquant
```

### Echec de generation JWT

Assurez-vous que l'horloge systeme est precise. Les tokens JWT incluent un horodatage et expirent apres 3,5 minutes.

### MiniMax "role: system" rejete

MiniMax n'accepte pas les messages `role: system`. PRX fusionne automatiquement le contenu du message systeme dans le premier message utilisateur lors de l'utilisation des fournisseurs MiniMax.

### Timeout Qwen/DashScope

L'API DashScope de Qwen necessite HTTP/1.1 (et non HTTP/2). PRX force automatiquement HTTP/1.1 pour les endpoints DashScope. Si vous rencontrez des timeouts, assurez-vous que votre reseau autorise les connexions HTTP/1.1.

### Erreurs d'endpoints regionaux

Si vous obtenez des erreurs de connexion, essayez de basculer entre les endpoints regionaux :
- Utilisateurs en Chine : Utilisez les variantes `*-cn`
- Utilisateurs internationaux : Utilisez les variantes `*-intl` ou de base
- Utilisateurs aux US : Essayez `qwen-us` pour Qwen
