---
title: Google Gemini
description: 在 PRX 中配置 Google Gemini 作为 LLM 提供商
---

# Google Gemini

> 接入 Google 的 Gemini 系列多模态模型，支持 API Key 和 Gemini CLI OAuth 两种认证方式。

## 前置条件

- 一个 [Google AI Studio](https://aistudio.google.com/) 账号
- Gemini API Key 或 Gemini CLI OAuth Token
- PRX 守护进程已运行

## 快速配置

### 1. 获取 API Key

1. 登录 [Google AI Studio](https://aistudio.google.com/)
2. 点击 **Get API Key** 生成密钥

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中设置：

```toml
default_provider = "gemini"
default_model = "gemini-2.0-flash"
api_key = "AIza..."
```

也可以通过环境变量设置：

```bash
export GEMINI_API_KEY="AIza..."
```

::: tip Gemini CLI OAuth
如果你使用 Gemini CLI，PRX 会自动从 `~/.gemini/` 目录读取 OAuth 凭证。
:::

### 3. 验证

```bash
prx status
```

## 可用模型

| 模型 | 上下文 | 视觉 | 工具调用 | 备注 |
|------|--------|------|----------|------|
| `gemini-2.5-pro` | 1M | 是 | 是 | 最强 Gemini 模型 |
| `gemini-2.5-flash` | 1M | 是 | 是 | 平衡性能（推荐） |
| `gemini-2.0-flash` | 1M | 是 | 是 | 极速响应 |
| `gemini-2.0-flash-lite` | 1M | 是 | 是 | 轻量版本 |
| `gemini-1.5-pro` | 2M | 是 | 是 | 超长上下文 |
| `gemini-1.5-flash` | 1M | 是 | 是 | 上一代快速模型 |

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `default_provider` | String | - | 设为 `"gemini"` 或 `"google"` 或 `"google-gemini"` |
| `default_model` | String | - | 默认模型（如 `"gemini-2.0-flash"`） |
| `api_key` | String? | `null` | API Key（也可通过 `GEMINI_API_KEY` 环境变量设置） |
| `default_temperature` | f64 | `0.7` | 生成温度 |

## 功能特性

- **超长上下文** — Gemini 1.5 Pro 支持最高 200 万 Token 上下文
- **多模态** — 支持文本、图片、音频、视频输入
- **工具调用** — 原生 function calling 支持
- **OAuth 集成** — 可复用 Gemini CLI 的 OAuth 凭证
- **免费额度** — Google AI Studio 提供免费 API 调用额度

## 故障排除

**API Key 无效**

- 确认密钥以 `AIza` 开头
- 检查是否在 Google Cloud Console 中启用了 Gemini API

**地区限制**

- 部分地区可能无法直接访问 Gemini API
- 可通过 `[proxy]` 配置代理访问
