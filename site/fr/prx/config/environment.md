---
title: Variables d'environnement
description: Variables d'environnement pour la configuration PRX -- cles API, chemins et surcharges d'execution.
---

# Variables d'environnement

PRX lit les variables d'environnement pour les cles API, les chemins de configuration et les surcharges d'execution. Les variables d'environnement prennent le pas sur les valeurs de `config.toml` pour les champs sensibles en termes de securite comme les cles API.

## Chemins de configuration

| Variable | Defaut | Description |
|----------|--------|-------------|
| `OPENPRX_CONFIG_DIR` | `~/.openprx` | Surcharger le repertoire de configuration. PRX cherche `config.toml` et `config.d/` dans ce repertoire |
| `OPENPRX_WORKSPACE` | `~/.openprx/workspace` | Surcharger le repertoire de l'espace de travail (memoire, sessions, donnees) |

Lorsque `OPENPRX_CONFIG_DIR` est defini, il a la priorite sur `OPENPRX_WORKSPACE` et le marqueur d'espace de travail actif.

Ordre de resolution du repertoire de configuration :

1. `OPENPRX_CONFIG_DIR` (priorite la plus elevee)
2. `OPENPRX_WORKSPACE`
3. Marqueur d'espace de travail actif (`~/.openprx/active_workspace.toml`)
4. `~/.openprx/` (par defaut)

## Cles API des fournisseurs

Chaque fournisseur dispose d'une variable d'environnement dediee. PRX verifie celles-ci avant de se rabattre sur le champ `api_key` dans `config.toml`.

### Fournisseurs principaux

| Variable | Fournisseur |
|----------|------------|
| `ANTHROPIC_API_KEY` | Anthropic (Claude) |
| `OPENAI_API_KEY` | OpenAI |
| `GEMINI_API_KEY` | Google Gemini |
| `GOOGLE_API_KEY` | Google Gemini (alternative) |
| `OPENROUTER_API_KEY` | OpenRouter |
| `OLLAMA_API_KEY` | Ollama (generalement pas necessaire) |
| `GLM_API_KEY` | Zhipu GLM |
| `ZAI_API_KEY` | Z.AI |
| `MINIMAX_API_KEY` | Minimax |
| `MOONSHOT_API_KEY` | Moonshot |
| `DASHSCOPE_API_KEY` | Alibaba Qwen (DashScope) |

### Tokens OAuth

Certains fournisseurs prennent en charge l'authentification OAuth en plus de (ou a la place de) cles API :

| Variable | Fournisseur | Description |
|----------|------------|-------------|
| `ANTHROPIC_OAUTH_TOKEN` | Anthropic | Token OAuth Claude Code |
| `CLAUDE_CODE_ACCESS_TOKEN` | Anthropic | Token d'acces Claude Code (alternative) |
| `CLAUDE_CODE_REFRESH_TOKEN` | Anthropic | Token de rafraichissement Claude Code pour le renouvellement automatique |
| `MINIMAX_OAUTH_TOKEN` | Minimax | Token d'acces OAuth Minimax |
| `MINIMAX_OAUTH_REFRESH_TOKEN` | Minimax | Token de rafraichissement OAuth Minimax |
| `MINIMAX_OAUTH_CLIENT_ID` | Minimax | Surcharge de l'ID client OAuth |
| `MINIMAX_OAUTH_REGION` | Minimax | Region OAuth (`global` ou `cn`) |
| `QWEN_OAUTH_TOKEN` | Qwen | Token d'acces OAuth Qwen |
| `QWEN_OAUTH_REFRESH_TOKEN` | Qwen | Token de rafraichissement OAuth Qwen |
| `QWEN_OAUTH_CLIENT_ID` | Qwen | Surcharge de l'ID client OAuth Qwen |
| `QWEN_OAUTH_RESOURCE_URL` | Qwen | Surcharge de l'URL de ressource OAuth Qwen |

### Fournisseurs compatibles / tiers

| Variable | Fournisseur |
|----------|------------|
| `GROQ_API_KEY` | Groq |
| `MISTRAL_API_KEY` | Mistral |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `XAI_API_KEY` | xAI (Grok) |
| `TOGETHER_API_KEY` | Together AI |
| `FIREWORKS_API_KEY` | Fireworks AI |
| `PERPLEXITY_API_KEY` | Perplexity |
| `COHERE_API_KEY` | Cohere |
| `NVIDIA_API_KEY` | NVIDIA NIM |
| `VENICE_API_KEY` | Venice |
| `LLAMACPP_API_KEY` | llama.cpp server |
| `KIMI_CODE_API_KEY` | Kimi Code (Moonshot) |
| `QIANFAN_API_KEY` | Baidu Qianfan |
| `CLOUDFLARE_API_KEY` | Cloudflare AI |
| `VERCEL_API_KEY` | Vercel AI |

### Alternative generique

| Variable | Description |
|----------|-------------|
| `API_KEY` | Alternative generique utilisee lorsqu'aucune variable specifique au fournisseur n'est definie |

## Variables d'outils et de canaux

| Variable | Description |
|----------|-------------|
| `BRAVE_API_KEY` | Cle API Brave Search (pour `[web_search]` avec `provider = "brave"`) |
| `GITHUB_TOKEN` | Token d'acces personnel GitHub (utilise par les competences et les integrations) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Chemin du fichier ADC Google Cloud (Gemini via compte de service) |

## Variables d'execution

| Variable | Description |
|----------|-------------|
| `OPENPRX_VERSION` | Surcharger la chaine de version rapportee |
| `OPENPRX_AUTOSTART_CHANNELS` | Definir a `"1"` pour demarrer automatiquement les listeners de canaux au boot |
| `OPENPRX_EVOLUTION_CONFIG` | Surcharger le chemin de configuration de l'evolution |
| `OPENPRX_EVOLUTION_DEBUG_RAW` | Activer la journalisation de debogage brute de l'evolution |

## Substitution de variables dans la configuration

PRX ne prend **pas** en charge nativement la syntaxe `${VAR_NAME}` dans `config.toml`. Cependant, vous pouvez obtenir la substitution de variables d'environnement par ces approches :

### 1. Utiliser directement les variables d'environnement

Pour les cles API, PRX verifie automatiquement la variable d'environnement correspondante. Vous n'avez pas besoin de les referencer dans le fichier de configuration :

```toml
# Pas besoin de api_key -- PRX verifie ANTHROPIC_API_KEY automatiquement
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
```

### 2. Utiliser un wrapper shell

Generer `config.toml` depuis un modele en utilisant `envsubst` ou similaire :

```bash
envsubst < config.toml.template > ~/.openprx/config.toml
```

### 3. Utiliser la configuration scindee avec les secrets

Gardez les secrets dans un fichier separe qui est genere depuis les variables d'environnement au moment du deploiement :

```bash
# Generer le fragment de secrets
cat > ~/.openprx/config.d/secrets.toml << EOF
api_key = "$ANTHROPIC_API_KEY"

[channels_config.telegram]
bot_token = "$TELEGRAM_BOT_TOKEN"
EOF
```

## Support du fichier `.env`

PRX ne charge pas automatiquement les fichiers `.env`. Si vous avez besoin du support `.env`, utilisez l'une de ces approches :

### Avec systemd

Ajoutez `EnvironmentFile` a votre unite de service :

```ini
[Service]
EnvironmentFile=/opt/openprx/.env
ExecStart=/usr/local/bin/openprx
```

### Avec un wrapper shell

Sourcez le fichier `.env` avant de demarrer PRX :

```bash
#!/bin/bash
set -a
source /opt/openprx/.env
set +a
exec openprx
```

### Avec direnv

Si vous utilisez [direnv](https://direnv.net/), placez un fichier `.envrc` dans votre repertoire de travail :

```bash
# .envrc
export ANTHROPIC_API_KEY="sk-ant-..."
export TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
```

## Recommandations de securite

- **Ne commitez jamais les cles API** dans le controle de version. Utilisez des variables d'environnement ou des secrets chiffres.
- Le sous-systeme `[secrets]` de PRX chiffre les champs sensibles dans `config.toml` avec ChaCha20-Poly1305. Activez-le avec `[secrets] encrypt = true` (active par defaut).
- Le `.dockerignore` fourni avec PRX exclut les fichiers `.env` et `.env.*` des builds de conteneurs.
- Les journaux d'audit masquent automatiquement les cles API et les tokens.
- Lors de l'utilisation de `OPENPRX_CONFIG_DIR` pour pointer vers un repertoire partage, assurez-vous des permissions de fichier appropriees (`chmod 600 config.toml`).
