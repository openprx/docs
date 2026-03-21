---
title: 认证
description: PRX 认证系统概览，包括 OAuth2 流程和提供商配置文件。
---

# 认证

PRX 支持多种认证机制，用于 LLM 提供商、API 访问和节点间通信。认证系统处理 OAuth2 流程、API 密钥管理和特定提供商的认证。

## 概述

PRX 中的认证在多个层级运作：

| 层级 | 机制 | 用途 |
|------|------|------|
| 提供商认证 | OAuth2 / API 密钥 | 向 LLM 提供商认证 |
| 网关认证 | Bearer Token | 认证 API 客户端 |
| 节点认证 | Ed25519 配对 | 认证分布式节点 |

## 提供商认证

每个 LLM 提供商有其自己的认证方式：

- **API 密钥** -- 在请求头中传递的静态密钥（大多数提供商）
- **OAuth2** -- 基于浏览器的授权流程（Anthropic、Google、GitHub Copilot）
- **AWS IAM** -- Bedrock 的基于角色的认证

## 配置

```toml
[auth]
default_method = "api_key"

[auth.oauth2]
redirect_port = 8400
token_cache_path = "~/.local/share/openprx/tokens"
```

## 相关页面

- [OAuth2 流程](./oauth2)
- [提供商配置文件](./profiles)
- [密钥管理](/zh/prx/security/secrets)
