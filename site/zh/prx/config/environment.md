---
title: 环境变量
description: PRX 支持的环境变量：配置目录、API Key、提供商凭据。
---

# 环境变量

PRX 支持通过环境变量覆盖配置文件中的设置。环境变量的优先级高于 `config.toml` 中的对应值。

## 系统级环境变量

### 配置目录

| 环境变量 | 说明 | 示例 |
|----------|------|------|
| `OPENPRX_CONFIG_DIR` | 完全覆盖配置目录路径（config.toml 所在目录） | `/opt/prx/config` |
| `OPENPRX_WORKSPACE` | 指定工作区路径（workspace 子目录） | `/data/prx-workspace` |

**解析优先级（从高到低）：**

1. `OPENPRX_CONFIG_DIR` - 最高优先级，完全覆盖
2. `OPENPRX_WORKSPACE` - 指定工作区，配置目录自动推导
3. `active_workspace.toml` - 持久化的工作区切换标记
4. `~/.openprx/` - 默认位置

```bash
# 使用自定义配置目录
export OPENPRX_CONFIG_DIR="/opt/prx/config"

# 或指定工作区
export OPENPRX_WORKSPACE="/data/prx-workspace"
```

### 通用 API Key

| 环境变量 | 说明 |
|----------|------|
| `OPENPRX_API_KEY` | 覆盖 `config.toml` 中的 `api_key` 字段 |
| `API_KEY` | 备用 API Key 环境变量 |

## 提供商 API Key

每个提供商有对应的环境变量名称。设置后会覆盖 `config.toml` 中配置的 `api_key`：

### 云端提供商

| 环境变量 | 提供商 | 说明 |
|----------|--------|------|
| `ANTHROPIC_API_KEY` | Anthropic | Claude 系列模型（`sk-ant-...`） |
| `OPENAI_API_KEY` | OpenAI | GPT / o 系列模型（`sk-...`） |
| `GEMINI_API_KEY` | Google Gemini | Gemini 模型（`AIza...`） |
| `GOOGLE_API_KEY` | Google Gemini | `GEMINI_API_KEY` 的别名 |
| `OPENROUTER_API_KEY` | OpenRouter | OpenRouter 聚合路由 |
| `GLM_API_KEY` | 智谱 GLM | GLM-4 系列 |
| `AWS_ACCESS_KEY_ID` | AWS Bedrock | AWS IAM 凭据（配合 `AWS_SECRET_ACCESS_KEY`） |
| `AWS_SECRET_ACCESS_KEY` | AWS Bedrock | AWS IAM 密钥 |

### 第三方兼容提供商

| 环境变量 | 提供商 | 说明 |
|----------|--------|------|
| `GROQ_API_KEY` | Groq | Groq 推理加速 |
| `MISTRAL_API_KEY` | Mistral | Mistral AI |
| `DEEPSEEK_API_KEY` | DeepSeek | DeepSeek 系列 |
| `XAI_API_KEY` | xAI / Grok | Grok 系列（别名 `grok`） |
| `TOGETHER_API_KEY` | Together AI | Together 推理平台 |
| `FIREWORKS_API_KEY` | Fireworks AI | Fireworks 推理平台 |
| `PERPLEXITY_API_KEY` | Perplexity | Perplexity 搜索增强 |
| `COHERE_API_KEY` | Cohere | Cohere 系列 |
| `NVIDIA_API_KEY` | NVIDIA NIM | NVIDIA NIM 推理 |

### 中国区提供商

| 环境变量 | 提供商 | 说明 |
|----------|--------|------|
| `DASHSCOPE_API_KEY` | 通义千问 (Qwen) | 阿里云 DashScope |
| `MOONSHOT_API_KEY` | Moonshot / Kimi | Moonshot AI |
| `MINIMAX_API_KEY` | MiniMax | MiniMax 模型 |
| `QIANFAN_API_KEY` | 百度千帆 | 百度千帆平台 |
| `ZAI_API_KEY` | Z.AI (智谱编码) | 智谱编码平台 |

### 本地提供商

| 环境变量 | 提供商 | 说明 |
|----------|--------|------|
| `OLLAMA_API_KEY` | Ollama | 通常不需要设置（本地无认证） |
| `LLAMACPP_API_KEY` | llama.cpp | 通常不需要设置 |

### OAuth 相关

| 环境变量 | 说明 |
|----------|------|
| `CLAUDE_CODE_ACCESS_TOKEN` | Claude Code OAuth 访问令牌 |
| `CLAUDE_CODE_REFRESH_TOKEN` | Claude Code OAuth 刷新令牌 |
| `QWEN_OAUTH_TOKEN` | 通义千问 OAuth 令牌 |
| `QWEN_OAUTH_REFRESH_TOKEN` | 通义千问 OAuth 刷新令牌 |
| `QWEN_OAUTH_CLIENT_ID` | 通义千问 OAuth 客户端 ID |
| `MINIMAX_OAUTH_TOKEN` | MiniMax OAuth 令牌 |
| `MINIMAX_OAUTH_REFRESH_TOKEN` | MiniMax OAuth 刷新令牌 |
| `MINIMAX_OAUTH_REGION` | MiniMax OAuth 区域 |
| `MINIMAX_OAUTH_CLIENT_ID` | MiniMax OAuth 客户端 ID |

## 工具相关环境变量

| 环境变量 | 说明 |
|----------|------|
| `BRAVE_API_KEY` | Brave Search API Key（网页搜索使用） |
| `COMPOSIO_API_KEY` | Composio 集成 API Key |

## 在配置文件中使用环境变量

::: info 注意
PRX 当前版本不支持在 `config.toml` 中直接使用 `${VAR_NAME}` 语法进行变量替换。API Key 等敏感信息应通过以下方式管理：

1. **环境变量**（推荐）：设置对应的环境变量，PRX 自动读取
2. **加密存储**：启用 `secrets.encrypt = true`，PRX 自动加密配置文件中的敏感字段
3. **密钥管理器**：通过系统 keychain 或 vault 导出环境变量
:::

## .env 文件支持

你可以在 shell 配置中加载 `.env` 文件，或使用 systemd 服务的 `EnvironmentFile` 指令：

### Shell 方式

```bash
# ~/.openprx/.env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
BRAVE_API_KEY=BSA...
```

```bash
# 在 ~/.bashrc 或 ~/.zshrc 中加载
set -a
source ~/.openprx/.env
set +a
```

### systemd 服务方式

```ini
# /etc/systemd/system/prx.service
[Service]
EnvironmentFile=/etc/prx/env
ExecStart=/usr/local/bin/prx daemon
```

```bash
# /etc/prx/env
ANTHROPIC_API_KEY=sk-ant-...
OPENPRX_CONFIG_DIR=/opt/prx/config
```

### Docker / Podman 方式

```bash
podman run -d \
  --env-file ~/.openprx/.env \
  -v ~/.openprx:/home/prx/.openprx \
  openprx/prx:latest daemon
```

## 优先级总结

对于 API Key，优先级从高到低为：

```
环境变量 (如 ANTHROPIC_API_KEY)
  ↓ 如果为空
OPENPRX_API_KEY / API_KEY
  ↓ 如果为空
config.toml 中的 api_key 字段
```

对于配置目录：

```
OPENPRX_CONFIG_DIR
  ↓ 如果未设置
OPENPRX_WORKSPACE
  ↓ 如果未设置
active_workspace.toml 标记
  ↓ 如果不存在
~/.openprx/ (默认)
```

## 安全建议

::: warning 不要将 API Key 提交到版本控制
建议将 `.env` 文件添加到 `.gitignore`，并使用环境变量或加密存储管理敏感凭据。
:::

- 使用 `secrets.encrypt = true` 加密配置文件中的敏感字段
- 在 CI/CD 中使用 secrets manager（如 GitHub Secrets、Vault）注入环境变量
- 生产环境中限制 `config.toml` 的文件权限为 `600`
- 定期轮换 API Key
