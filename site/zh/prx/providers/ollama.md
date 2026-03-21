---
title: Ollama 本地部署
description: 在 PRX 中配置 Ollama 作为本地 LLM 提供商
---

# Ollama 本地部署

> 通过 Ollama 在本地运行开源大语言模型，数据完全不出本机，无需 API Key。

## 前置条件

- [Ollama](https://ollama.com/) 已安装并运行
- 至少一个已下载的模型
- PRX 守护进程已运行

## 快速配置

### 1. 安装 Ollama 并下载模型

```bash
# 安装 Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 下载模型
ollama pull llama3.2
ollama pull qwen2.5:14b
```

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中设置：

```toml
default_provider = "ollama"
default_model = "llama3.2"
api_url = "http://localhost:11434"
```

::: tip 远程 Ollama
如果 Ollama 运行在其他机器上：
```toml
api_url = "http://10.0.0.100:11434"
```
:::

### 3. 验证

```bash
prx status
```

## 可用模型

任何 Ollama 支持的模型均可使用。常见模型：

| 模型 | 参数量 | 上下文 | 视觉 | 工具调用 | 备注 |
|------|--------|--------|------|----------|------|
| `llama3.2` | 3B | 128K | 否 | 是 | Meta 最新轻量模型 |
| `llama3.2:70b` | 70B | 128K | 否 | 是 | 大参数版本 |
| `llama3.2-vision` | 11B | 128K | 是 | 是 | 视觉版本 |
| `qwen2.5:14b` | 14B | 128K | 否 | 是 | 阿里通义千问 |
| `qwen2.5-coder` | 7B | 128K | 否 | 是 | 代码专用 |
| `mistral` | 7B | 32K | 否 | 是 | Mistral AI |
| `mixtral:8x7b` | 47B | 32K | 否 | 是 | MoE 架构 |
| `deepseek-r1` | 7B | 128K | 否 | 是 | 推理模型 |
| `gemma2` | 9B | 8K | 否 | 是 | Google 开源 |
| `phi3` | 3.8B | 128K | 否 | 是 | Microsoft 小模型 |

使用 `ollama list` 查看已下载的模型。

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `default_provider` | String | - | 设为 `"ollama"` |
| `default_model` | String | - | 模型名称（如 `"llama3.2"`） |
| `api_url` | String? | `"http://localhost:11434"` | Ollama API 地址 |
| `api_key` | String? | `null` | 通常不需要（Ollama 默认无认证） |
| `default_temperature` | f64 | `0.7` | 生成温度 |

## 功能特性

- **完全本地** — 数据不出本机，无隐私顾虑
- **零成本** — 无 API 调用费用
- **离线可用** — 模型下载后无需网络连接
- **模型丰富** — 支持 Ollama 生态中所有 GGUF 格式模型
- **流式输出** — 支持流式传输
- **工具调用** — 部分模型支持 function calling

## 限制

- 运行速度取决于本机 GPU/CPU 性能
- 大模型（70B+）需要大量显存（建议 48GB+ VRAM）
- 工具调用能力取决于具体模型的训练数据
- 默认 `message_timeout_secs = 300`（本地模型较慢）

## 故障排除

**连接 Ollama 失败**

1. 确认 Ollama 正在运行：`ollama serve`
2. 检查端口 11434 是否被占用
3. 如果是远程 Ollama，确认 `OLLAMA_HOST` 环境变量设置正确

**响应速度很慢**

- 使用更小的模型（如 `llama3.2` 3B 而非 70B）
- 确认 GPU 加速已启用（`ollama ps` 查看）
- 减少上下文长度可以提升速度

**模型不支持工具调用**

- 部分旧模型不支持 function calling
- 推荐使用 `llama3.2`、`qwen2.5` 等较新模型
