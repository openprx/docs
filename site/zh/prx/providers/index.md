---
title: LLM 提供商概述
description: PRX 支持的 9 个 LLM 提供商及其能力矩阵、故障转移链与路由集成。
---

# LLM 提供商

**提供商** 是 PRX 连接到大语言模型推理后端的抽象层。每个提供商实现统一的 `Provider` trait，通过工厂模式注册，PRX 在运行时根据配置动态创建对应实例。

PRX 目前支持 **9 个原生提供商** 和一个 **OpenAI 兼容适配器**（可对接任意兼容端点），共计覆盖数百个模型。

## 能力矩阵

| 提供商 | 代表模型 | 流式输出 | 视觉理解 | 工具调用 | OAuth 支持 | 自托管 |
|--------|----------|:--------:|:--------:|:--------:|:----------:|:------:|
| [Anthropic (Claude)](/zh/prx/providers/anthropic) | claude-sonnet-4-6, claude-opus-4 | 是 | 是 | 原生 | 是 (Claude Code) | 否 |
| [OpenAI](/zh/prx/providers/openai) | gpt-4o, o3 | 是 | 是 | 原生 | 否 | 否 |
| [Google Gemini](/zh/prx/providers/google-gemini) | gemini-2.5-pro, gemini-2.5-flash | 是 | 是 | 原生 | 是 | 否 |
| [OpenAI Codex](/zh/prx/providers/openai-codex) | codex-mini | 是 | 是 | 原生 | 否 | 否 |
| [GitHub Copilot](/zh/prx/providers/github-copilot) | gpt-4o (via Copilot) | 是 | 是 | 原生 | 是 | 否 |
| [Ollama](/zh/prx/providers/ollama) | llama3, qwen2.5, deepseek | 是 | 是 | 原生 | 否 | 是 |
| [AWS Bedrock](/zh/prx/providers/aws-bedrock) | claude-3.5-sonnet, titan | 是 | 是 | 原生 | 否 | 否 |
| [GLM (智谱)](/zh/prx/providers/glm) | glm-4, glm-4-flash | 是 | 是 | 原生 | 否 | 否 |
| [OpenRouter](/zh/prx/providers/openrouter) | 聚合 300+ 模型 | 是 | 是 | 原生 | 否 | 否 |
| [自定义兼容](/zh/prx/providers/custom-compatible) | 任意 OpenAI 兼容端点 | 是 | 自动检测 | 原生 | 否 | 视端点 |

::: tip 所有提供商均支持原生工具调用
PRX 的 `ProviderCapabilities` 结构体统一声明 `native_tool_calling` 和 `vision` 能力。所有内置提供商均已实现原生工具调用支持。
:::

## 快速配置

在 `~/.openprx/config.toml` 中设置默认提供商和模型：

```toml
# 默认提供商与模型
default_provider = "anthropic"
default_model = "claude-sonnet-4-6"
default_temperature = 0.7
api_key = "sk-ant-..."
```

也可以通过环境变量覆盖 API Key（优先级高于配置文件）：

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
export GEMINI_API_KEY="AIza..."
```

使用引导向导完成交互式配置：

```bash
prx onboard
```

## 故障转移链 (ReliableProvider)

PRX 通过 `ReliableProvider` 包装器实现多提供商故障转移链。当主提供商请求失败时，自动切换到备用提供商，支持自动重试和指数退避。

**错误分类机制：**

- **可重试错误**：HTTP 429（限速）、408（超时）、5xx（服务端错误）、网络连接中断
- **不可重试错误**：HTTP 4xx（认证失败、模型不存在、请求格式错误）

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

当配置了 `fallback_providers` 时，PRX 会按顺序尝试备用提供商，直到请求成功或所有提供商均已耗尽。

**工作流程：**

```
请求 → 主提供商 (anthropic)
         │ 失败 (可重试)
         ↓
       重试 (指数退避)
         │ 仍然失败
         ↓
       备用提供商 1 (openai)
         │ 失败
         ↓
       备用提供商 2 (gemini)
         │ 成功
         ↓
       返回结果
```

## 路由集成

`ReliableProvider` 与 [LLM 路由器](/zh/prx/router/) 深度集成。路由器根据任务类型、模型能力、成本和延迟等维度，智能选择最优的提供商和模型组合。

```toml
[router]
enabled = true
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
```

路由器支持三种模式：

- **启发式路由**：基于加权评分（能力、成本、延迟、Elo 评分）选择模型
- **KNN 路由**：基于历史查询的语义相似度投票
- **Automix**：从低成本模型开始，根据置信度自适应升级

详见 [LLM 路由概述](/zh/prx/router/)。

## 各提供商专页

- [Anthropic (Claude)](/zh/prx/providers/anthropic) - Claude 系列模型，原生工具调用
- [OpenAI](/zh/prx/providers/openai) - GPT-4o / o3 系列
- [Google Gemini](/zh/prx/providers/google-gemini) - Gemini 2.5 Pro/Flash，支持 API Key 和 OAuth
- [OpenAI Codex](/zh/prx/providers/openai-codex) - Codex 推理模型
- [GitHub Copilot](/zh/prx/providers/github-copilot) - 通过 Copilot OAuth 接入 GPT-4o
- [Ollama](/zh/prx/providers/ollama) - 本地自托管，零 API Key
- [AWS Bedrock](/zh/prx/providers/aws-bedrock) - AWS 托管，IAM 认证
- [GLM (智谱)](/zh/prx/providers/glm) - 智谱 GLM-4 系列，支持国际/国内端点
- [OpenRouter](/zh/prx/providers/openrouter) - 聚合路由，统一接入 300+ 模型
- [自定义兼容](/zh/prx/providers/custom-compatible) - 对接任意 OpenAI 兼容端点

## 扩展新提供商

要添加新的提供商，需要：

1. 在 `src/providers/` 下创建新子模块
2. 实现 `Provider` trait（`capabilities`、`chat`、`stream` 等方法）
3. 在 `create_provider_with_url` 工厂函数中注册

详见项目 `AGENTS.md` 第 7.1 节。
