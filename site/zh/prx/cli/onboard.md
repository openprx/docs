---
title: prx onboard — 安装引导向导
description: 初始化 OpenPRX 工作区和配置，提供快速设置、交互式向导和渠道修复三种模式。
---

# prx onboard

初始化 OpenPRX 工作区和配置。首次安装后运行此命令完成基础设置。提供三种模式：

- **快速设置**（默认） — 传入 API Key 等参数，自动生成配置文件
- **交互式向导** (`--interactive`) — 逐步引导完成全部配置
- **渠道修复** (`--channels-only`) — 仅重新配置消息渠道

## 用法

```bash
prx onboard [OPTIONS]
```

## 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--interactive` | — | `false` | 运行完整交互式向导 |
| `--channels-only` | — | `false` | 仅重新配置渠道（快速修复流程） |
| `--api-key <KEY>` | — | — | API Key（快速模式，`--interactive` 时忽略） |
| `--provider <NAME>` | — | `openrouter` | 提供商名称（快速模式） |
| `--model <ID>` | — | — | 模型 ID 覆盖（快速模式） |
| `--memory <BACKEND>` | — | `sqlite` | 记忆后端：sqlite/lucid/markdown/none（快速模式） |

## 示例

### 快速设置（推荐首次使用）

```bash
prx onboard --api-key sk-xxxx --provider openrouter
```

使用 OpenRouter 作为提供商，自动生成配置文件并完成初始化。

### 指定模型和记忆后端

```bash
prx onboard --api-key sk-xxxx --provider anthropic --model claude-sonnet-4-20250514 --memory sqlite
```

### 完整交互式向导

```bash
prx onboard --interactive
```

向导会逐步引导你完成：

1. 选择 LLM 提供商并配置 API Key
2. 选择默认模型
3. 配置记忆后端
4. 配置消息渠道（Telegram/Discord/Slack 等）
5. 设置安全参数

### 渠道修复

```bash
prx onboard --channels-only
```

仅重新运行渠道配置流程，不修改提供商和其他设置。适用于渠道 Token 过期或需要添加新渠道的场景。

## 互斥约束

- `--interactive` 和 `--channels-only` 不可同时使用
- `--channels-only` 不接受 `--api-key`、`--provider`、`--model`、`--memory` 参数

## 自动启动渠道

设置环境变量 `OPENPRX_AUTOSTART_CHANNELS=1` 后，onboard 完成时会自动启动所有已配置的渠道，无需再手动运行 `prx channel start`。

```bash
OPENPRX_AUTOSTART_CHANNELS=1 prx onboard --api-key sk-xxxx
```

## 配置文件位置

onboard 完成后，配置文件默认写入 `~/.openprx/config.toml`。可通过全局选项 `--config-dir` 或环境变量 `OPENPRX_CONFIG_DIR` 修改。

## 相关链接

- [安装指南](../getting-started/installation) — 安装 PRX 二进制
- [快速开始](../getting-started/quickstart) — 从零到对话
- [prx config](./config) — 配置管理
- [prx channel](./channel) — 渠道管理
