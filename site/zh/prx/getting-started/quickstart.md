---
title: 快速开始
description: 5 分钟从安装到与 PRX 进行第一次对话，覆盖安装、引导配置、启动守护进程、对话和接入消息渠道。
---

# 5 分钟快速开始

本指南带你在 5 分钟内完成从安装到与 PRX 进行第一次对话的全部流程。

## 前提

确保你已经准备好以下内容之一：

- 一个 LLM 提供商的 API Key（如 Anthropic、OpenAI 等）
- 或一个本地运行的 Ollama 实例

## 步骤 1: 安装 PRX

```bash
curl -fsSL https://get.openprx.dev | bash
```

安装完成后验证：

```bash
prx --version
# openprx 0.3.0
```

::: tip 其他安装方式
如果你偏好其他安装方式（cargo install、源码编译、Docker），请参阅 [安装指南](./installation)。
:::

## 步骤 2: 运行引导向导

PRX 提供交互式向导，帮助你完成初始配置：

```bash
prx onboard
```

向导会引导你：

1. 选择 LLM 提供商（如 Anthropic、OpenAI、Ollama 等）
2. 选择默认模型（如 `claude-sonnet-4-6`）
3. 输入 API Key
4. 配置网关端口（默认 `8300`）
5. 生成配置文件

如果你想跳过交互式向导，可以使用快速模式：

```bash
# 使用 Anthropic Claude
prx onboard --quick --provider anthropic --model claude-sonnet-4-6

# 使用本地 Ollama
prx onboard --quick --provider ollama --model llama3
```

完成后，配置文件会写入 `~/.config/openprx/openprx.toml`。

::: details 最小配置文件示例
```toml
[agent]
default_provider = "anthropic"
default_model = "claude-sonnet-4-6"

[providers.anthropic]
api_key_env = "ANTHROPIC_API_KEY"

[gateway]
host = "127.0.0.1"
port = 8300
```
:::

更多关于引导向导的细节，请参阅 [引导向导详解](./onboarding)。

## 步骤 3: 启动守护进程

PRX 以守护进程模式在后台运行，管理所有渠道连接、工具调用和 Agent 生命周期：

```bash
prx daemon
```

你会看到类似如下的启动输出：

```
 INFO  prx::daemon > PRX daemon starting...
 INFO  prx::gateway > Gateway listening on 127.0.0.1:8300
 INFO  prx::providers > Provider "anthropic" ready (claude-sonnet-4-6)
 INFO  prx::daemon > PRX daemon ready
```

::: tip 后台运行
在生产环境中，建议使用 systemd 服务管理 PRX：
```bash
prx service install
sudo systemctl enable --now prx
```
:::

## 步骤 4: 开始对话

守护进程启动后，打开一个新终端，使用 CLI 渠道与 PRX 对话：

```bash
prx chat
```

这会打开一个交互式终端界面。直接输入消息开始对话：

```
你: 你好，介绍一下你自己
PRX: 你好！我是 PRX，一个运行在你本地的 AI 助手。我可以帮助你执行各种任务，
     包括运行命令、搜索网页、管理文件、操作浏览器等。

     我目前接入了 Anthropic 的 Claude 模型，拥有 46 种以上的工具能力。
     需要我做什么？

你: 查看一下当前目录有什么文件
PRX: 我来查看一下...
     [调用 shell 工具: ls -la]
     当前目录包含以下文件：
     ...
```

按 `Ctrl+D` 或输入 `/quit` 退出对话。

## 步骤 5: 接入消息渠道

CLI 对话验证成功后，你可以接入真正的消息平台。以 Telegram 为例：

### 5.1 获取 Telegram Bot Token

1. 在 Telegram 中搜索 `@BotFather`
2. 发送 `/newbot` 创建新 bot
3. 记录返回的 Bot Token

### 5.2 配置渠道

编辑 `~/.config/openprx/openprx.toml`，添加 Telegram 渠道配置：

```toml
[channels.telegram]
enabled = true
token_env = "TELEGRAM_BOT_TOKEN"

# DM 策略：pairing 需要配对码才能使用
dm_policy = "pairing"
```

设置环境变量：

```bash
export TELEGRAM_BOT_TOKEN="你的Bot Token"
```

### 5.3 重启守护进程

```bash
# PRX 支持热重载，修改配置后会自动生效
# 如果没有自动生效，手动重启：
prx daemon restart
```

### 5.4 配对

启用 `pairing` 策略后，首次对话需要配对：

```bash
# 生成配对码
prx channel pair telegram

# 输出: 配对码: A3F7-K9X2
# 在 Telegram 中向 bot 发送: /pair A3F7-K9X2
```

配对成功后即可在 Telegram 中正常对话。

::: info 支持的渠道
PRX 支持 19 个消息渠道，包括 Telegram、Discord、Slack、WhatsApp、Signal、iMessage、Matrix、飞书、钉钉等。完整列表和配置方法请参阅 [消息渠道](../channels/)。
:::

## 步骤 6: 检查状态

随时可以检查 PRX 的运行状态：

```bash
prx status
```

输出示例：

```
PRX Status
──────────────────────────────────
  Daemon:     running (PID 12345, uptime 2h 15m)
  Gateway:    127.0.0.1:8300

  Providers:
    anthropic   ● ready    claude-sonnet-4-6

  Channels:
    cli         ● active
    telegram    ● active   @my_prx_bot

  Memory:
    backend     sqlite
    entries     128
    last sync   2 minutes ago

  Evolution:
    L1 memory   enabled    last run: 1h ago
    L2 prompt   enabled    last run: 6h ago
    L3 strategy disabled

  Plugins:      0 loaded
  Active chats: 1
──────────────────────────────────
```

其他有用的状态命令：

```bash
# 详细诊断（检查配置、连接、依赖）
prx doctor

# 查看实时日志
prx daemon logs --follow

# 查看活跃会话
prx chat list
```

## 下一步

你已经成功运行了 PRX 并完成了第一次对话。接下来可以：

- **[引导向导详解](./onboarding)** — 深入了解 `prx onboard` 的全部选项
- **[消息渠道](../channels/)** — 接入更多平台（Discord、Slack、飞书等）
- **[LLM 提供商](../providers/)** — 配置多个提供商，启用 LLM 路由
- **[工具](../tools/)** — 了解 46+ 内置工具的能力
- **[配置参考](../config/)** — 完整的配置项说明
- **[自进化](../self-evolution/)** — 让 PRX 自主进化，越用越好
