---
title: OpenAI
description: 在 PRX 中配置 OpenAI 作为 LLM 提供商
---

# OpenAI

> 接入 OpenAI 的 GPT、o 系列模型，支持流式输出、视觉理解和工具调用。

## 前置条件

- 一个 [OpenAI Platform](https://platform.openai.com/) 账号
- API Key
- PRX 守护进程已运行

## 快速配置

### 1. 获取 API Key

1. 登录 [OpenAI Platform](https://platform.openai.com/)
2. 进入 **API Keys** 页面
3. 点击 **Create new secret key**

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中设置：

```toml
default_provider = "openai"
default_model = "gpt-4o"
api_key = "sk-..."
```

也可以通过环境变量设置：

```bash
export OPENAI_API_KEY="sk-..."
```

### 3. 验证

```bash
prx status
```

## 可用模型

| 模型 | 上下文 | 视觉 | 工具调用 | 备注 |
|------|--------|------|----------|------|
| `gpt-4o` | 128K | 是 | 是 | 多模态旗舰模型 |
| `gpt-4o-mini` | 128K | 是 | 是 | 轻量快速版 |
| `o3` | 200K | 是 | 是 | 推理模型 |
| `o3-mini` | 200K | 否 | 是 | 推理模型轻量版 |
| `o1` | 200K | 是 | 是 | 推理模型（上一代） |
| `o1-mini` | 128K | 否 | 是 | 推理模型轻量版（上一代） |
| `gpt-4-turbo` | 128K | 是 | 是 | GPT-4 Turbo |

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `default_provider` | String | - | 设为 `"openai"` 选择此提供商 |
| `default_model` | String | - | 默认模型（如 `"gpt-4o"`） |
| `api_key` | String? | `null` | API Key（也可通过 `OPENAI_API_KEY` 环境变量设置） |
| `api_url` | String? | `null` | 自定义 API 端点 URL（用于代理或兼容端点） |
| `default_temperature` | f64 | `0.7` | 生成温度（0.0-2.0） |

## 功能特性

- **流式输出** — SSE 流式传输
- **视觉理解** — GPT-4o 系列支持图片输入
- **工具调用** — 原生 function calling 支持
- **推理模型** — o 系列提供增强推理能力

## 故障排除

**401 Unauthorized**

- 确认 API Key 正确
- 检查账号余额是否充足

**模型响应缓慢**

- o 系列推理模型本身需要更多处理时间
- 检查是否触发了速率限制
- 考虑配置 fallback provider 提高可用性
