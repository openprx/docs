---
title: GitHub Copilot
description: 在 PRX 中配置 GitHub Copilot 作为 LLM 提供商
---

# GitHub Copilot

> 通过 GitHub Copilot Chat API 将 PRX 连接到 GitHub Copilot，使用 Device Flow OAuth 认证。

## 前置条件

- 有效的 GitHub Copilot 订阅（Individual、Business 或 Enterprise）
- GitHub 账号
- PRX 守护进程已运行

## 快速配置

### 1. 认证

GitHub Copilot 使用 Device Flow OAuth 认证：

```bash
prx auth login --provider copilot
```

按提示在浏览器中完成 GitHub 授权。

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中设置：

```toml
default_provider = "copilot"
default_model = "gpt-4o"
```

别名：`github-copilot`

### 3. 验证

```bash
prx status
```

## 可用模型

| 模型 | 上下文 | 视觉 | 工具调用 | 备注 |
|------|--------|------|----------|------|
| `gpt-4o` | 128K | 否 | 是 | Copilot Chat 默认模型 |
| `gpt-4` | 32K | 否 | 是 | GPT-4 基础版 |
| `gpt-3.5-turbo` | 16K | 否 | 是 | 轻量快速版 |

::: info
具体可用模型取决于你的 Copilot 订阅等级和 GitHub 的模型策略。
:::

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `default_provider` | String | - | 设为 `"copilot"` 或 `"github-copilot"` |
| `default_model` | String | - | 默认模型 |

## 功能特性

- **Device Flow OAuth** — 安全的浏览器授权流程，无需手动管理 Token
- **Copilot 订阅共用** — 使用已有的 Copilot 订阅，无需额外 API 费用
- **流式输出** — 支持 SSE 流式传输
- **工具调用** — 支持 function calling

## 限制

- 需要有效的 GitHub Copilot 订阅
- 可用模型受 GitHub 策略限制
- 速率限制取决于订阅等级
- OAuth Token 会定期过期，需要重新认证

## 故障排除

**OAuth 认证失败**

1. 确认 GitHub Copilot 订阅有效
2. 重新运行 `prx auth login --provider copilot`
3. 检查浏览器是否完成了授权流程

**Token 过期**

- PRX 会尝试自动刷新 Token
- 如果自动刷新失败，重新运行认证命令
