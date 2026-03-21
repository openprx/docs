---
title: 智谱 GLM / MiniMax / 月之暗面 / 通义千问
description: 在 PRX 中配置中国大陆 LLM 提供商
---

# 智谱 GLM / MiniMax / 月之暗面 / 通义千问

> PRX 支持多个中国大陆的 LLM 提供商，包括智谱 GLM、MiniMax、月之暗面（Moonshot/Kimi）、通义千问（DashScope）和 Z.AI，均通过 OpenAI 兼容协议接入。

## 智谱 GLM

### 前置条件

- 一个 [智谱 AI 开放平台](https://open.bigmodel.cn/) 账号
- API Key

### 配置

```toml
default_provider = "glm"
default_model = "glm-4-plus"
api_key = "your-glm-api-key"
```

```bash
export GLM_API_KEY="your-glm-api-key"
```

别名：`zhipu`

### 可用模型

| 模型 | 上下文 | 视觉 | 工具调用 | 备注 |
|------|--------|------|----------|------|
| `glm-4-plus` | 128K | 否 | 是 | 旗舰模型 |
| `glm-4` | 128K | 否 | 是 | 标准版 |
| `glm-4-flash` | 128K | 否 | 是 | 快速版 |
| `glm-4v-plus` | 8K | 是 | 是 | 视觉旗舰 |
| `glm-4v` | 8K | 是 | 是 | 视觉标准 |

---

## MiniMax

### 前置条件

- 一个 [MiniMax 开放平台](https://www.minimaxi.com/) 账号
- API Key 或 OAuth Token

### 配置

```toml
default_provider = "minimax"
default_model = "abab6.5s-chat"
api_key = "your-minimax-api-key"
```

```bash
export MINIMAX_API_KEY="your-minimax-api-key"
# 或 OAuth 模式
export MINIMAX_OAUTH_TOKEN="your-oauth-token"
```

别名：`minimax-intl`、`minimax-io`、`minimax-global`、`minimax-cn`、`minimaxi`、`minimax-oauth`

### 可用模型

| 模型 | 上下文 | 视觉 | 工具调用 | 备注 |
|------|--------|------|----------|------|
| `abab6.5s-chat` | 245K | 否 | 是 | 旗舰对话模型 |
| `abab6.5-chat` | 8K | 否 | 是 | 标准版 |
| `abab5.5-chat` | 16K | 否 | 是 | 轻量版 |

---

## 月之暗面 (Moonshot / Kimi)

### 前置条件

- 一个 [Moonshot AI 平台](https://platform.moonshot.cn/) 账号
- API Key

### 配置

```toml
default_provider = "moonshot"
default_model = "moonshot-v1-128k"
api_key = "your-moonshot-api-key"
```

```bash
export MOONSHOT_API_KEY="your-moonshot-api-key"
```

别名：`kimi`

### 可用模型

| 模型 | 上下文 | 视觉 | 工具调用 | 备注 |
|------|--------|------|----------|------|
| `moonshot-v1-128k` | 128K | 否 | 是 | 超长上下文 |
| `moonshot-v1-32k` | 32K | 否 | 是 | 标准版 |
| `moonshot-v1-8k` | 8K | 否 | 是 | 轻量版 |

---

## 通义千问 (DashScope / Qwen)

### 前置条件

- 一个 [阿里云 DashScope 平台](https://dashscope.aliyun.com/) 账号
- API Key

### 配置

```toml
default_provider = "qwen"
default_model = "qwen-max"
api_key = "your-dashscope-api-key"
```

```bash
export DASHSCOPE_API_KEY="your-dashscope-api-key"
```

别名：`dashscope`、`qwen-intl`、`dashscope-intl`、`qwen-code`、`qwen-oauth`

### 可用模型

| 模型 | 上下文 | 视觉 | 工具调用 | 备注 |
|------|--------|------|----------|------|
| `qwen-max` | 32K | 否 | 是 | 旗舰模型 |
| `qwen-plus` | 128K | 否 | 是 | 增强版 |
| `qwen-turbo` | 128K | 否 | 是 | 极速版 |
| `qwen-vl-max` | 32K | 是 | 是 | 视觉旗舰 |
| `qwen2.5-coder-32b` | 128K | 否 | 是 | 代码专用 |

---

## Z.AI

### 配置

```toml
default_provider = "zai"
api_key = "your-zai-api-key"
```

```bash
export ZAI_API_KEY="your-zai-api-key"
```

别名：`z.ai`

---

## 通用配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `default_provider` | String | - | 提供商名称（见各节别名） |
| `default_model` | String | - | 模型名称 |
| `api_key` | String? | `null` | API Key（也可通过环境变量设置） |
| `api_url` | String? | `null` | 自定义 API 端点 |
| `default_temperature` | f64 | `0.7` | 生成温度 |

## 功能特性

- **OpenAI 兼容协议** — 所有提供商均通过 OpenAI 兼容 API 接入
- **流式输出** — 支持 SSE 流式传输
- **工具调用** — 主流模型均支持 function calling
- **中国大陆直连** — 无需代理即可访问

## 故障排除

**API 调用失败**

1. 确认 API Key 正确且账号有余额
2. 检查网络连接（是否能访问对应的 API 端点）
3. 部分模型需要在控制台中单独启用
