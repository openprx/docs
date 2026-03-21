---
title: Environment Variables
description: Environment variables for PRX configuration -- API keys, paths, and runtime overrides.
---

# Environment Variables

PRX reads environment variables for API keys, configuration paths, and runtime overrides. Environment variables take precedence over values in `config.toml` for security-sensitive fields like API keys.

## Configuration Paths

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENPRX_CONFIG_DIR` | `~/.openprx` | Override the configuration directory. PRX looks for `config.toml` and `config.d/` inside this directory |
| `OPENPRX_WORKSPACE` | `~/.openprx/workspace` | Override the workspace directory (memory, sessions, data) |

When `OPENPRX_CONFIG_DIR` is set, it takes precedence over `OPENPRX_WORKSPACE` and the active workspace marker.

Resolution order for the config directory:

1. `OPENPRX_CONFIG_DIR` (highest priority)
2. `OPENPRX_WORKSPACE`
3. Active workspace marker (`~/.openprx/active_workspace.toml`)
4. `~/.openprx/` (default)

## Provider API Keys

Each provider has a dedicated environment variable. PRX checks these before falling back to the `api_key` field in `config.toml`.

### Primary Providers

| Variable | Provider |
|----------|----------|
| `ANTHROPIC_API_KEY` | Anthropic (Claude) |
| `OPENAI_API_KEY` | OpenAI |
| `GEMINI_API_KEY` | Google Gemini |
| `GOOGLE_API_KEY` | Google Gemini (alternative) |
| `OPENROUTER_API_KEY` | OpenRouter |
| `OLLAMA_API_KEY` | Ollama (usually not needed) |
| `GLM_API_KEY` | Zhipu GLM |
| `ZAI_API_KEY` | Z.AI |
| `MINIMAX_API_KEY` | Minimax |
| `MOONSHOT_API_KEY` | Moonshot |
| `DASHSCOPE_API_KEY` | Alibaba Qwen (DashScope) |

### OAuth Tokens

Some providers support OAuth authentication in addition to (or instead of) API keys:

| Variable | Provider | Description |
|----------|----------|-------------|
| `ANTHROPIC_OAUTH_TOKEN` | Anthropic | Claude Code OAuth token |
| `CLAUDE_CODE_ACCESS_TOKEN` | Anthropic | Claude Code access token (alternative) |
| `CLAUDE_CODE_REFRESH_TOKEN` | Anthropic | Claude Code refresh token for auto-renewal |
| `MINIMAX_OAUTH_TOKEN` | Minimax | Minimax OAuth access token |
| `MINIMAX_OAUTH_REFRESH_TOKEN` | Minimax | Minimax OAuth refresh token |
| `MINIMAX_OAUTH_CLIENT_ID` | Minimax | OAuth client ID override |
| `MINIMAX_OAUTH_REGION` | Minimax | OAuth region (`global` or `cn`) |
| `QWEN_OAUTH_TOKEN` | Qwen | Qwen OAuth access token |
| `QWEN_OAUTH_REFRESH_TOKEN` | Qwen | Qwen OAuth refresh token |
| `QWEN_OAUTH_CLIENT_ID` | Qwen | Qwen OAuth client ID override |
| `QWEN_OAUTH_RESOURCE_URL` | Qwen | Qwen OAuth resource URL override |

### Compatible / Third-Party Providers

| Variable | Provider |
|----------|----------|
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

### Fallback

| Variable | Description |
|----------|-------------|
| `API_KEY` | Generic fallback used when no provider-specific variable is set |

## Tool and Channel Variables

| Variable | Description |
|----------|-------------|
| `BRAVE_API_KEY` | Brave Search API key (for `[web_search]` with `provider = "brave"`) |
| `GITHUB_TOKEN` | GitHub personal access token (used by skills and integrations) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Google Cloud ADC file path (Gemini via service account) |

## Runtime Variables

| Variable | Description |
|----------|-------------|
| `OPENPRX_VERSION` | Override the reported version string |
| `OPENPRX_AUTOSTART_CHANNELS` | Set to `"1"` to auto-start channel listeners on boot |
| `OPENPRX_EVOLUTION_CONFIG` | Override evolution configuration path |
| `OPENPRX_EVOLUTION_DEBUG_RAW` | Enable raw evolution debug logging |

## Variable Substitution in Config

PRX does **not** natively expand `${VAR_NAME}` syntax inside `config.toml`. However, you can achieve environment variable substitution through these approaches:

### 1. Use Environment Variables Directly

For API keys, PRX automatically checks the corresponding environment variable. You do not need to reference them in the config file:

```toml
# No api_key needed -- PRX checks ANTHROPIC_API_KEY automatically
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
```

### 2. Use a Shell Wrapper

Generate `config.toml` from a template using `envsubst` or similar:

```bash
envsubst < config.toml.template > ~/.openprx/config.toml
```

### 3. Use Split Config with Secrets

Keep secrets in a separate file that is generated from environment variables at deploy time:

```bash
# Generate secrets fragment
cat > ~/.openprx/config.d/secrets.toml << EOF
api_key = "$ANTHROPIC_API_KEY"

[channels_config.telegram]
bot_token = "$TELEGRAM_BOT_TOKEN"
EOF
```

## `.env` File Support

PRX does not load `.env` files automatically. If you need `.env` file support, use one of these approaches:

### With systemd

Add `EnvironmentFile` to your service unit:

```ini
[Service]
EnvironmentFile=/opt/openprx/.env
ExecStart=/usr/local/bin/openprx
```

### With a shell wrapper

Source the `.env` file before starting PRX:

```bash
#!/bin/bash
set -a
source /opt/openprx/.env
set +a
exec openprx
```

### With direnv

If you use [direnv](https://direnv.net/), place a `.envrc` file in your working directory:

```bash
# .envrc
export ANTHROPIC_API_KEY="sk-ant-..."
export TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
```

## Security Recommendations

- **Never commit API keys** to version control. Use environment variables or encrypted secrets.
- PRX's `[secrets]` subsystem encrypts sensitive fields in `config.toml` with ChaCha20-Poly1305. Enable it with `[secrets] encrypt = true` (enabled by default).
- The `.dockerignore` shipped with PRX excludes `.env` and `.env.*` files from container builds.
- Audit logs redact API keys and tokens automatically.
- When using `OPENPRX_CONFIG_DIR` to point to a shared directory, ensure proper file permissions (`chmod 600 config.toml`).
