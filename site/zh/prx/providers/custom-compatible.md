---
title: 自定义兼容端点
description: 在 PRX 中配置任何 OpenAI 兼容 API 端点
---

# 自定义兼容端点

> 将任何兼容 OpenAI API 协议的端点接入 PRX，包括 LM Studio、vLLM、llama.cpp、LiteLLM、自建 API 代理等。

## 前置条件

- 一个运行中的 OpenAI 兼容 API 端点
- PRX 守护进程已运行

## 快速配置

### 1. 确认端点

确保你的 API 端点支持 `/v1/chat/completions` 路由。

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中设置：

```toml
default_provider = "compatible"
default_model = "your-model-name"
api_url = "http://localhost:8080/v1"
api_key = "your-api-key"
```

### 3. 验证

```bash
prx status
```

## 常见兼容端点

### LM Studio

```toml
default_provider = "lmstudio"
default_model = "local-model"
api_url = "http://localhost:1234/v1"
```

别名：`lm-studio`

### llama.cpp server

```toml
default_provider = "llamacpp"
default_model = "default"
api_url = "http://localhost:8080/v1"
```

别名：`llama.cpp`

### vLLM

```toml
default_provider = "vllm"
default_model = "meta-llama/Llama-3-8b-instruct"
api_url = "http://localhost:8000/v1"
```

### LiteLLM

```toml
default_provider = "litellm"
default_model = "gpt-4"
api_url = "http://localhost:4000/v1"
api_key = "your-litellm-key"
```

别名：`lite-llm`

### Hugging Face Inference Endpoints

```toml
default_provider = "huggingface"
default_model = "tgi"
api_url = "https://xxxx.endpoints.huggingface.cloud/v1"
api_key = "hf_..."
```

环境变量：`HF_TOKEN` 或 `HUGGINGFACE_API_KEY`

### 自定义代理

```toml
default_provider = "compatible"
default_model = "custom-model"
api_url = "https://your-proxy.example.com/v1"
api_key = "your-key"
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `default_provider` | String | - | 提供商名称（见各节） |
| `default_model` | String | - | 模型名称（取决于端点） |
| `api_url` | String | 必填 | API 端点 URL（需包含 `/v1`） |
| `api_key` | String? | `null` | API Key（如果端点需要认证） |
| `default_temperature` | f64 | `0.7` | 生成温度 |

## 可用模型

| 模型 | 上下文 | 视觉 | 工具调用 | 备注 |
|------|--------|------|----------|------|
| 取决于端点 | 取决于端点 | 取决于端点 | 取决于端点 | 由端点后端决定 |

## 功能特性

- **通用兼容** — 支持任何 OpenAI API 兼容端点
- **自托管** — 适合完全自托管、数据不出内网的场景
- **灵活配置** — 支持自定义 URL、认证方式
- **流式输出** — 如果端点支持 SSE 则自动启用
- **工具调用** — 如果端点支持 function calling 则自动启用

## 限制

- 功能支持完全取决于底层端点的实现
- 部分端点可能不支持流式输出或工具调用
- 错误格式可能与标准 OpenAI API 不同

## 故障排除

**连接失败**

1. 确认端点 URL 正确且可达
2. 确认 URL 包含 `/v1` 路径
3. 检查端点日志

**响应格式错误**

- 确认端点完全兼容 OpenAI Chat Completions API
- 某些端点（如旧版 llama.cpp）可能需要更新到最新版本

**工具调用不生效**

- 确认端点和底层模型支持 function calling
- 检查是否需要在端点配置中启用工具调用
