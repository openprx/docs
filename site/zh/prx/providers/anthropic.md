---
title: Anthropic (Claude)
description: 在 PRX 中配置 Anthropic 作为 LLM 提供商
---

# Anthropic (Claude)

> Anthropic 是 Claude 系列大语言模型的开发商，PRX 支持通过 API Key 和 OAuth（Claude Code 认证）两种方式接入。

## 前置条件

- 一个 [Anthropic Console](https://console.anthropic.com/) 账号
- API Key 或 Claude Code OAuth 认证
- PRX 守护进程已运行

## 快速配置

### 1. 获取 API Key

1. 登录 [Anthropic Console](https://console.anthropic.com/)
2. 进入 **API Keys** 页面
3. 点击 **Create Key** 生成新的 API Key

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中设置：

```toml
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
api_key = "sk-ant-api03-..."
```

也可以通过环境变量设置：

```bash
export ANTHROPIC_API_KEY="sk-ant-api03-..."
```

::: tip OAuth 认证
如果你使用 Claude Code，PRX 可以复用其 OAuth Token：
```toml
default_provider = "anthropic"
# api_key 留空，PRX 自动查找 ANTHROPIC_OAUTH_TOKEN
```
环境变量查找顺序：`ANTHROPIC_OAUTH_TOKEN` > `ANTHROPIC_API_KEY` > `API_KEY`
:::

### 3. 验证

```bash
prx status
# 应显示: Provider: anthropic (claude-sonnet-4-6) ● ready
```

## 可用模型

| 模型 | 上下文 | 视觉 | 工具调用 | 备注 |
|------|--------|------|----------|------|
| `claude-opus-4-6` | 200K | 是 | 是 | 最强推理模型 |
| `claude-sonnet-4-6` | 200K | 是 | 是 | 平衡性能与成本（推荐） |
| `claude-sonnet-4-20250514` | 200K | 是 | 是 | Sonnet 4 初始版本 |
| `claude-haiku-3-5-20241022` | 200K | 是 | 是 | 极速响应，低成本 |
| `claude-3-5-sonnet-20241022` | 200K | 是 | 是 | Claude 3.5 Sonnet |

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `default_provider` | String | `"openrouter"` | 设为 `"anthropic"` 选择此提供商 |
| `default_model` | String | - | 默认模型（如 `"anthropic/claude-sonnet-4-6"`） |
| `api_key` | String? | `null` | API Key（也可通过环境变量设置） |
| `default_temperature` | f64 | `0.7` | 生成温度（0.0-2.0） |

## 功能特性

- **流式输出** — 支持 SSE 流式传输，实时显示响应
- **视觉理解** — 支持图片输入，可分析截图、图表等
- **工具调用** — 原生支持 function calling
- **OAuth 集成** — 可复用 Claude Code 的 OAuth Token
- **自动重试** — 通过 ReliableProvider 自动处理速率限制和临时错误

## 故障排除

**401 Unauthorized**

- 检查 API Key 是否正确且未过期
- 确认 API Key 对应的组织有足够的额度

**429 Rate Limited**

- PRX 会自动重试并使用指数退避
- 配置 `[reliability]` 中的 `fallback_providers` 可在限速时切换到其他提供商

**模型不可用**

- 确认账号有权访问指定的模型（部分模型需要申请）
- 使用 `prx status` 检查当前配置
