---
title: OpenRouter
description: 在 PRX 中配置 OpenRouter 作为 LLM 提供商
---

# OpenRouter

> OpenRouter 是一个统一的 LLM 网关，提供 200+ 模型的统一 API 接入，一个 Key 访问所有主流提供商。

## 前置条件

- 一个 [OpenRouter](https://openrouter.ai/) 账号
- API Key
- PRX 守护进程已运行

## 快速配置

### 1. 获取 API Key

1. 登录 [OpenRouter](https://openrouter.ai/)
2. 进入 **API Keys** 页面
3. 创建新的 API Key

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中设置：

```toml
default_provider = "openrouter"
default_model = "anthropic/claude-sonnet-4-6"
api_key = "sk-or-..."
```

也可以通过环境变量设置：

```bash
export OPENROUTER_API_KEY="sk-or-..."
```

### 3. 验证

```bash
prx status
```

## 可用模型

OpenRouter 聚合了 200+ 模型，以下为常用模型示例：

| 模型 | 提供商 | 上下文 | 视觉 | 工具调用 | 备注 |
|------|--------|--------|------|----------|------|
| `anthropic/claude-sonnet-4-6` | Anthropic | 200K | 是 | 是 | Claude Sonnet 4 |
| `anthropic/claude-opus-4-6` | Anthropic | 200K | 是 | 是 | Claude Opus 4 |
| `openai/gpt-4o` | OpenAI | 128K | 是 | 是 | GPT-4o |
| `google/gemini-2.5-flash` | Google | 1M | 是 | 是 | Gemini 2.5 Flash |
| `meta-llama/llama-3.3-70b-instruct` | Meta | 128K | 否 | 是 | Llama 3.3 70B |
| `deepseek/deepseek-r1` | DeepSeek | 128K | 否 | 是 | DeepSeek R1 |
| `mistralai/mistral-large` | Mistral | 128K | 否 | 是 | Mistral Large |

完整模型列表请访问 [openrouter.ai/models](https://openrouter.ai/models)。

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `default_provider` | String | `"openrouter"` | PRX 的默认提供商就是 OpenRouter |
| `default_model` | String | - | 模型 ID（格式 `provider/model`） |
| `api_key` | String? | `null` | OpenRouter API Key |
| `default_temperature` | f64 | `0.7` | 生成温度 |

## 功能特性

- **统一接入** — 一个 API Key 访问 200+ 模型
- **自动路由** — OpenRouter 自动选择最优的底层提供商
- **成本透明** — 每个模型的定价清晰可见
- **流式输出** — 支持 SSE 流式传输
- **Fallback** — OpenRouter 自身有故障转移机制
- **PRX 默认提供商** — OpenRouter 是 PRX 的默认提供商

## 限制

- 相比直接调用提供商 API，可能有轻微延迟增加
- 价格包含 OpenRouter 的服务费
- 部分模型的高级功能（如 Anthropic 的 caching）可能不完全支持

## 故障排除

**API Key 无效**

- 确认 Key 以 `sk-or-` 开头
- 检查账号余额

**模型不可用**

- 确认模型 ID 格式正确（`provider/model-name`）
- 访问 [openrouter.ai/models](https://openrouter.ai/models) 查看最新可用模型
