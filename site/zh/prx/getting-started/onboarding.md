---
title: 引导向导
description: 详解 prx onboard 引导向导的工作流程、交互模式、快速模式和生成的配置文件。
---

# 引导向导

`prx onboard` 是 PRX 的交互式配置向导，帮助你在首次使用时完成所有必要的初始化设置。本文详细说明向导的每个步骤、可用选项以及生成的配置内容。

## 向导做了什么

`prx onboard` 完成以下工作：

1. **配置 LLM 提供商** — 选择提供商、模型，设置 API Key
2. **配置网关** — 设置 HTTP/WebSocket 监听地址和端口
3. **初始化记忆后端** — 选择并初始化记忆存储（默认 SQLite）
4. **创建数据目录** — 初始化 `~/.local/share/openprx/` 下的数据结构
5. **生成配置文件** — 写入 `~/.config/openprx/openprx.toml`
6. **运行连通性检查** — 验证 API Key 有效、模型可用

## 交互模式

默认运行方式，适合首次使用：

```bash
prx onboard
```

向导会逐步引导你完成配置：

```
Welcome to PRX! Let's get you set up.

? Select your LLM provider:
  > Anthropic (Claude)
    OpenAI (GPT)
    Google (Gemini)
    Ollama (Local)
    AWS Bedrock
    GitHub Copilot
    GLM (Zhipu)
    OpenRouter
    Custom Compatible

? Select default model:
  > claude-sonnet-4-6
    claude-opus-4-6
    claude-haiku-3-5

? Enter your Anthropic API Key:
  > sk-ant-api03-****

  ✓ API Key validated successfully

? Gateway listen address [127.0.0.1]:
  >

? Gateway port [8300]:
  >

? Memory backend:
  > SQLite (recommended)
    PostgreSQL
    Markdown (file-based)

  ✓ Configuration written to ~/.config/openprx/openprx.toml
  ✓ Data directory initialized at ~/.local/share/openprx/
  ✓ Memory backend (sqlite) ready

All done! Run `prx daemon` to start, then `prx chat` to talk.
```

## 快速模式

跳过交互式提示，通过命令行参数直接配置：

```bash
# Anthropic Claude
prx onboard --quick \
  --provider anthropic \
  --model claude-sonnet-4-6

# 需要先设置环境变量
export ANTHROPIC_API_KEY="sk-ant-api03-..."
```

```bash
# OpenAI GPT
prx onboard --quick \
  --provider openai \
  --model gpt-4o

export OPENAI_API_KEY="sk-..."
```

```bash
# 本地 Ollama（无需 API Key）
prx onboard --quick \
  --provider ollama \
  --model llama3 \
  --ollama-url http://localhost:11434
```

```bash
# 自定义兼容端点
prx onboard --quick \
  --provider custom-compatible \
  --model my-model \
  --base-url https://my-llm.example.com/v1

export CUSTOM_API_KEY="..."
```

### 快速模式可用参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--quick` | 启用快速模式，跳过交互 | - |
| `--provider <name>` | LLM 提供商名称 | 必填 |
| `--model <name>` | 默认模型 | 必填 |
| `--gateway-host <host>` | 网关监听地址 | `127.0.0.1` |
| `--gateway-port <port>` | 网关监听端口 | `8300` |
| `--memory-backend <type>` | 记忆后端 (`sqlite`/`postgres`/`markdown`) | `sqlite` |
| `--ollama-url <url>` | Ollama 服务地址 | `http://localhost:11434` |
| `--base-url <url>` | 自定义兼容端点 URL | - |
| `--data-dir <path>` | 数据目录 | `~/.local/share/openprx` |
| `--config-dir <path>` | 配置目录 | `~/.config/openprx` |

## 配置文件位置

引导向导生成的主配置文件位于：

```
~/.config/openprx/openprx.toml
```

完整的目录结构：

```
~/.config/openprx/
├── openprx.toml           # 主配置文件
├── channels/              # 渠道专属配置（可选）
│   ├── telegram.toml
│   └── discord.toml
└── policies/              # 策略规则（可选）
    └── default.toml

~/.local/share/openprx/
├── memory/                # 记忆数据
│   └── memory.db          # SQLite 记忆数据库
├── plugins/               # WASM 插件
├── evolution/             # 自进化数据
│   ├── prompts/
│   └── strategies/
├── secrets.enc            # 加密密钥存储 (ChaCha20)
└── logs/                  # 日志
```

## 生成的配置文件详解

以下是一个典型的 `prx onboard` 生成的配置文件：

```toml
# ~/.config/openprx/openprx.toml
# 由 prx onboard 生成

# ─── Agent 核心配置 ─────────────────────────
[agent]
# 默认使用的 LLM 提供商
default_provider = "anthropic"
# 默认模型
default_model = "claude-sonnet-4-6"
# 系统提示词（留空使用内置默认值）
system_prompt = ""
# 安全自治等级: supervised | approved | autonomous | jailbroken
autonomy_level = "supervised"

# ─── LLM 提供商 ────────────────────────────
[providers.anthropic]
# API Key 通过环境变量引用（不明文存储）
api_key_env = "ANTHROPIC_API_KEY"
# 可用模型列表
models = [
  "claude-sonnet-4-6",
  "claude-opus-4-6",
  "claude-haiku-3-5",
]
# 请求超时（秒）
timeout_secs = 120
# 最大重试次数
max_retries = 3

# ─── 网关 ──────────────────────────────────
[gateway]
host = "127.0.0.1"
port = 8300
# 是否启用 CORS
cors = false

# ─── 记忆 ──────────────────────────────────
[memory]
# 后端类型: sqlite | postgres | markdown
backend = "sqlite"
# SQLite 数据库路径
sqlite_path = "~/.local/share/openprx/memory/memory.db"

# ─── 自进化 ────────────────────────────────
[evolution]
# 是否启用自进化
enabled = true
# L1 记忆进化
l1_memory = true
# L2 提示词进化
l2_prompt = true
# L3 策略进化（默认关闭，需手动启用）
l3_strategy = false

# ─── 安全 ──────────────────────────────────
[security]
# 沙箱后端: docker | firejail | bubblewrap | landlock | none
sandbox = "none"
# 工具执行是否需要确认（supervised 模式下生效）
require_confirmation = true

# ─── 日志 ──────────────────────────────────
[logging]
# 日志级别: trace | debug | info | warn | error
level = "info"
# 日志文件路径（留空输出到 stderr）
file = ""
```

::: warning API Key 安全
配置文件中使用 `api_key_env` 引用环境变量，而不是直接写入 API Key 明文。你需要在 shell 配置文件（如 `~/.bashrc`、`~/.zshrc`）中 export 对应的环境变量。

也可以使用 PRX 的加密密钥存储：
```bash
prx config set-secret anthropic_api_key "sk-ant-api03-..."
```
然后在配置中使用 `api_key_secret = "anthropic_api_key"` 代替 `api_key_env`。
:::

## 验证配置

完成引导后，使用 `prx doctor` 全面检查配置和环境：

```bash
prx doctor
```

输出示例：

```
PRX Doctor — System Diagnostics
────────────────────────────────

Configuration
  ✓ Config file found at ~/.config/openprx/openprx.toml
  ✓ Config syntax valid
  ✓ Data directory exists

Providers
  ✓ anthropic: API key present
  ✓ anthropic: connection OK (claude-sonnet-4-6)

Memory
  ✓ sqlite backend: initialized
  ✓ database writable

Channels
  ○ No channels configured (add in openprx.toml)

Security
  ✓ Secrets store initialized
  ○ Sandbox: none (consider enabling for production)

System
  ✓ Disk space: 45 GB available
  ✓ Memory: 3.2 GB available

Result: 8 passed, 0 failed, 2 informational
```

## 重新运行向导

如果需要修改配置，可以随时重新运行：

```bash
# 重新运行（会提示是否覆盖已有配置）
prx onboard

# 强制覆盖（不提示）
prx onboard --force

# 仅添加新的提供商（不修改其他配置）
prx onboard --add-provider openai
```

## 多提供商配置

你可以配置多个 LLM 提供商，并通过 LLM 路由器自动选择最优模型：

```toml
[agent]
default_provider = "anthropic"
default_model = "claude-sonnet-4-6"

[providers.anthropic]
api_key_env = "ANTHROPIC_API_KEY"
models = ["claude-sonnet-4-6", "claude-opus-4-6", "claude-haiku-3-5"]

[providers.openai]
api_key_env = "OPENAI_API_KEY"
models = ["gpt-4o", "gpt-4o-mini"]

[providers.ollama]
base_url = "http://localhost:11434"
models = ["llama3", "codellama"]

# 启用 LLM 路由器
[router]
enabled = true
# 路由策略: heuristic | knn | automix
strategy = "heuristic"
# 回退提供商
fallback_provider = "ollama"
```

## 下一步

- **[快速开始](./quickstart)** — 启动 PRX 并进行第一次对话
- **[配置参考](../config/)** — 查看完整的配置项说明
- **[LLM 提供商](../providers/)** — 各提供商的详细配置文档
- **[安全](../security/)** — 了解沙箱、策略引擎和密钥管理
