---
title: Umgebungsvariablen
description: Umgebungsvariablen für die PRX-Konfiguration -- API-Schlüssel, Pfade und Laufzeitüberschreibungen.
---

# Umgebungsvariablen

PRX liest Umgebungsvariablen für API-Schlüssel, Konfigurationspfade und Laufzeitüberschreibungen. Umgebungsvariablen haben Vorrang vor Werten in `config.toml` für sicherheitskritische Felder wie API-Schlüssel.

## Konfigurationspfade

| Variable | Standard | Beschreibung |
|----------|----------|-------------|
| `OPENPRX_CONFIG_DIR` | `~/.openprx` | Konfigurationsverzeichnis überschreiben. PRX sucht `config.toml` und `config.d/` in diesem Verzeichnis |
| `OPENPRX_WORKSPACE` | `~/.openprx/workspace` | Workspace-Verzeichnis überschreiben (Gedächtnis, Sitzungen, Daten) |

Wenn `OPENPRX_CONFIG_DIR` gesetzt ist, hat es Vorrang vor `OPENPRX_WORKSPACE` und dem aktiven Workspace-Marker.

Auflösungsreihenfolge für das Konfigurationsverzeichnis:

1. `OPENPRX_CONFIG_DIR` (höchste Priorität)
2. `OPENPRX_WORKSPACE`
3. Aktiver Workspace-Marker (`~/.openprx/active_workspace.toml`)
4. `~/.openprx/` (Standard)

## Anbieter-API-Schlüssel

Jeder Anbieter hat eine dedizierte Umgebungsvariable. PRX prüft diese, bevor auf das Feld `api_key` in `config.toml` zurückgegriffen wird.

### Primäre Anbieter

| Variable | Anbieter |
|----------|----------|
| `ANTHROPIC_API_KEY` | Anthropic (Claude) |
| `OPENAI_API_KEY` | OpenAI |
| `GEMINI_API_KEY` | Google Gemini |
| `GOOGLE_API_KEY` | Google Gemini (Alternative) |
| `OPENROUTER_API_KEY` | OpenRouter |
| `OLLAMA_API_KEY` | Ollama (normalerweise nicht benötigt) |
| `GLM_API_KEY` | Zhipu GLM |
| `ZAI_API_KEY` | Z.AI |
| `MINIMAX_API_KEY` | Minimax |
| `MOONSHOT_API_KEY` | Moonshot |
| `DASHSCOPE_API_KEY` | Alibaba Qwen (DashScope) |

### OAuth-Token

Einige Anbieter unterstützen zusätzlich zu (oder anstelle von) API-Schlüsseln die OAuth-Authentifizierung:

| Variable | Anbieter | Beschreibung |
|----------|----------|-------------|
| `ANTHROPIC_OAUTH_TOKEN` | Anthropic | Claude Code OAuth-Token |
| `CLAUDE_CODE_ACCESS_TOKEN` | Anthropic | Claude Code Access-Token (Alternative) |
| `CLAUDE_CODE_REFRESH_TOKEN` | Anthropic | Claude Code Refresh-Token für automatische Erneuerung |
| `MINIMAX_OAUTH_TOKEN` | Minimax | Minimax OAuth Access-Token |
| `MINIMAX_OAUTH_REFRESH_TOKEN` | Minimax | Minimax OAuth Refresh-Token |
| `MINIMAX_OAUTH_CLIENT_ID` | Minimax | OAuth-Client-ID-Überschreibung |
| `MINIMAX_OAUTH_REGION` | Minimax | OAuth-Region (`global` oder `cn`) |
| `QWEN_OAUTH_TOKEN` | Qwen | Qwen OAuth Access-Token |
| `QWEN_OAUTH_REFRESH_TOKEN` | Qwen | Qwen OAuth Refresh-Token |
| `QWEN_OAUTH_CLIENT_ID` | Qwen | Qwen OAuth-Client-ID-Überschreibung |
| `QWEN_OAUTH_RESOURCE_URL` | Qwen | Qwen OAuth-Ressourcen-URL-Überschreibung |

### Kompatible / Drittanbieter

| Variable | Anbieter |
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
| `LLAMACPP_API_KEY` | llama.cpp Server |
| `KIMI_CODE_API_KEY` | Kimi Code (Moonshot) |
| `QIANFAN_API_KEY` | Baidu Qianfan |
| `CLOUDFLARE_API_KEY` | Cloudflare AI |
| `VERCEL_API_KEY` | Vercel AI |

### Fallback

| Variable | Beschreibung |
|----------|-------------|
| `API_KEY` | Generischer Fallback, der verwendet wird, wenn keine anbieterspezifische Variable gesetzt ist |

## Werkzeug- und Kanalvariablen

| Variable | Beschreibung |
|----------|-------------|
| `BRAVE_API_KEY` | Brave Search API-Schlüssel (für `[web_search]` mit `provider = "brave"`) |
| `GITHUB_TOKEN` | GitHub Personal Access Token (wird von Skills und Integrationen verwendet) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Google Cloud ADC-Dateipfad (Gemini über Dienstkonto) |

## Laufzeitvariablen

| Variable | Beschreibung |
|----------|-------------|
| `OPENPRX_VERSION` | Gemeldete Versionszeichenkette überschreiben |
| `OPENPRX_AUTOSTART_CHANNELS` | Auf `"1"` setzen, um Kanal-Listener beim Start automatisch zu starten |
| `OPENPRX_EVOLUTION_CONFIG` | Pfad der Entwicklungskonfiguration überschreiben |
| `OPENPRX_EVOLUTION_DEBUG_RAW` | Rohes Entwicklungs-Debug-Logging aktivieren |

## Variablensubstitution in der Konfiguration

PRX expandiert die Syntax `${VAR_NAME}` innerhalb von `config.toml` **nicht** nativ. Sie können jedoch Umgebungsvariablen-Substitution über folgende Ansätze erreichen:

### 1. Umgebungsvariablen direkt verwenden

Für API-Schlüssel prüft PRX automatisch die entsprechende Umgebungsvariable. Sie müssen sie nicht in der Konfigurationsdatei referenzieren:

```toml
# Kein api_key nötig -- PRX prüft ANTHROPIC_API_KEY automatisch
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
```

### 2. Shell-Wrapper verwenden

Generieren Sie `config.toml` aus einer Vorlage mit `envsubst` oder ähnlichem:

```bash
envsubst < config.toml.template > ~/.openprx/config.toml
```

### 3. Aufgeteilte Konfiguration mit Secrets verwenden

Halten Sie Secrets in einer separaten Datei, die bei der Bereitstellung aus Umgebungsvariablen generiert wird:

```bash
# Secrets-Fragment generieren
cat > ~/.openprx/config.d/secrets.toml << EOF
api_key = "$ANTHROPIC_API_KEY"

[channels_config.telegram]
bot_token = "$TELEGRAM_BOT_TOKEN"
EOF
```

## `.env`-Dateiunterstützung

PRX lädt `.env`-Dateien nicht automatisch. Wenn Sie `.env`-Dateiunterstützung benötigen, verwenden Sie einen dieser Ansätze:

### Mit systemd

Fügen Sie `EnvironmentFile` zu Ihrer Service-Unit hinzu:

```ini
[Service]
EnvironmentFile=/opt/openprx/.env
ExecStart=/usr/local/bin/openprx
```

### Mit einem Shell-Wrapper

Sourcen Sie die `.env`-Datei, bevor Sie PRX starten:

```bash
#!/bin/bash
set -a
source /opt/openprx/.env
set +a
exec openprx
```

### Mit direnv

Wenn Sie [direnv](https://direnv.net/) verwenden, platzieren Sie eine `.envrc`-Datei in Ihrem Arbeitsverzeichnis:

```bash
# .envrc
export ANTHROPIC_API_KEY="sk-ant-..."
export TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
```

## Sicherheitsempfehlungen

- **Committen Sie niemals API-Schlüssel** in die Versionskontrolle. Verwenden Sie Umgebungsvariablen oder verschlüsselte Secrets.
- Das `[secrets]`-Subsystem von PRX verschlüsselt sensible Felder in `config.toml` mit ChaCha20-Poly1305. Aktivieren Sie es mit `[secrets] encrypt = true` (standardmäßig aktiviert).
- Die mit PRX ausgelieferte `.dockerignore` schließt `.env`- und `.env.*`-Dateien aus Container-Builds aus.
- Audit-Logs schwärzen API-Schlüssel und Token automatisch.
- Wenn Sie `OPENPRX_CONFIG_DIR` auf ein gemeinsames Verzeichnis verweisen, stellen Sie korrekte Dateiberechtigungen sicher (`chmod 600 config.toml`).
