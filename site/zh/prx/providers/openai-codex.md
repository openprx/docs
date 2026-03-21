---
title: OpenAI Codex
description: 在 PRX 中配置 OpenAI Codex 作为 LLM 提供商
---

# OpenAI Codex

> 接入 OpenAI Codex 系列代码生成模型，通过 OAuth 认证方式连接。

## 前置条件

- OpenAI Codex 账号和 OAuth 认证
- PRX 守护进程已运行

## 快速配置

### 1. 获取凭证

OpenAI Codex 使用 OAuth 认证流程：

```bash
# PRX 支持自动 OAuth 设备流认证
prx auth login --provider openai-codex
```

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中设置：

```toml
default_provider = "openai-codex"
default_model = "codex-mini"
```

别名：`openai_codex`、`codex`

### 3. 验证

```bash
prx status
```

## 可用模型

| 模型 | 上下文 | 视觉 | 工具调用 | 备注 |
|------|--------|------|----------|------|
| `codex-mini` | 200K | 否 | 是 | 轻量代码模型 |
| `codex` | 200K | 否 | 是 | 标准代码模型 |

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `default_provider` | String | - | 设为 `"openai-codex"` 或 `"codex"` |
| `default_model` | String | - | 默认模型 |
| `api_key` | String? | `null` | OAuth Token（通常由 `prx auth login` 自动管理） |

## 功能特性

- **代码优化** — 专为代码生成和理解优化的模型
- **OAuth 认证** — 使用 OAuth 设备流，无需手动管理 API Key
- **工具调用** — 支持 function calling
- **流式输出** — 支持 SSE 流式传输

## 故障排除

**OAuth 认证失败**

- 重新运行 `prx auth login --provider openai-codex`
- 确认 OAuth Token 未过期

**模型不可用**

- 确认账号有权限访问 Codex 模型
- 检查 PRX 版本是否支持当前 Codex API
