---
title: CLI 参考
description: PRX 命令行工具完整参考手册，涵盖所有子命令、全局选项和用法示例。
---

# CLI 参考

`prx` 是 OpenPRX 的唯一入口二进制，所有功能均通过子命令暴露。

## 全局选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--config-dir <PATH>` | — | `~/.openprx` | 指定配置目录，覆盖默认路径 |
| `--version` | `-V` | — | 显示版本号并退出 |
| `--help` | `-h` | — | 显示帮助信息 |

`--config-dir` 为全局选项，可放在任何子命令之前：

```bash
prx --config-dir /etc/openprx daemon
```

## 命令总览

### 交互与对话

| 命令 | 说明 | 文档 |
|------|------|------|
| [`prx agent`](./agent) | 启动 Agent 循环，支持交互式会话和单轮查询 | [详情](./agent) |
| [`prx chat`](./chat) | 富终端对话，流式输出 + 会话历史管理 | [详情](./chat) |

### 运行时

| 命令 | 说明 | 文档 |
|------|------|------|
| [`prx daemon`](./daemon) | 启动完整守护进程：网关 + 渠道 + 心跳 + 调度 | [详情](./daemon) |
| [`prx gateway`](./gateway) | 启动独立 HTTP/WebSocket 网关 | [详情](./gateway) |
| [`prx service`](./service) | 管理 OS 系统服务（systemd/launchd/OpenRC） | [详情](./service) |
| `prx status` | 显示系统状态（版本、提供商、渠道、安全配置等） | 见下文 |

### 渠道与调度

| 命令 | 说明 | 文档 |
|------|------|------|
| [`prx channel`](./channel) | 管理消息渠道（添加/删除/列出/诊断/启动） | [详情](./channel) |
| [`prx cron`](./cron) | 管理定时任务（cron/一次性/固定间隔） | [详情](./cron) |

### 自进化

| 命令 | 说明 | 文档 |
|------|------|------|
| [`prx evolution`](./evolution) | 自进化仪表盘和操作（状态/历史/配置/触发） | [详情](./evolution) |

### 认证与配置

| 命令 | 说明 | 文档 |
|------|------|------|
| [`prx auth`](./auth) | 管理 OAuth/Token 认证配置 | [详情](./auth) |
| [`prx config`](./config) | 配置操作（Schema 导出/拆分/合并） | [详情](./config) |
| [`prx onboard`](./onboard) | 安装引导向导（快速设置/交互式向导/渠道修复） | [详情](./onboard) |

### 诊断与技能

| 命令 | 说明 | 文档 |
|------|------|------|
| [`prx doctor`](./doctor) | 运行诊断检查（系统环境/模型可用性） | [详情](./doctor) |
| [`prx skills`](./skills) | 管理用户自定义技能（安装/列出/删除） | [详情](./skills) |

### 其他

| 命令 | 说明 |
|------|------|
| `prx providers` | 列出所有支持的 LLM 提供商 |
| `prx models refresh` | 刷新并缓存提供商模型目录 |
| `prx integrations info <NAME>` | 查看集成详情 |
| `prx migrate openclaw` | 从 OpenClaw 迁移数据 |
| `prx completions <SHELL>` | 生成 Shell 补全脚本（bash/zsh/fish/powershell/elvish） |

## prx status

显示当前 OpenPRX 实例的完整状态，包括版本、工作区路径、提供商、模型、可观测性后端、自治级别、运行时、心跳、记忆后端和渠道配置情况。

```bash
prx status
```

输出示例：

```
OpenPRX Status

Version:     0.2.1
Workspace:   /home/user/.openprx/workspace
Config:      /home/user/.openprx/config.toml

Provider:      openrouter
   Model:         (default)
Observability:  otlp
Autonomy:      Supervised
Runtime:       tokio

Heartbeat:      every 60min
Memory:         sqlite (auto-save: on)

Security:
  Workspace only:    true
  Allowed commands:  git, ls, cat, grep
  Max actions/hour:  100
  Max cost/day:      $5.00

Channels:
  CLI:      always
  Telegram  configured
  Discord   not configured
  Slack     not configured
```

## prx completions

生成 Shell 自动补全脚本，支持 Bash、Zsh、Fish、PowerShell 和 Elvish。

```bash
# Bash — 即时加载
source <(prx completions bash)

# Bash — 持久化
prx completions bash > ~/.local/share/bash-completion/completions/prx

# Zsh
prx completions zsh > ~/.zfunc/_prx

# Fish
prx completions fish > ~/.config/fish/completions/prx.fish

# PowerShell
prx completions powershell >> $PROFILE
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `OPENPRX_CONFIG_DIR` | 等效于 `--config-dir`，指定配置目录 |
| `OPENPRX_EVOLUTION_CONFIG` | 覆盖自进化配置文件路径 |
| `OPENPRX_AUTOSTART_CHANNELS` | 设为 `1` 时，onboard 完成后自动启动渠道 |
| `RUST_LOG` | 控制日志级别，默认 `info`，支持 `debug`/`trace`/模块级过滤 |

## 相关链接

- [安装指南](../getting-started/installation)
- [快速开始](../getting-started/quickstart)
- [配置参考](../config/)
- [消息渠道](../channels/)
