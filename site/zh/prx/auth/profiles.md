---
title: 提供商配置文件
description: 用于管理 PRX 中多个提供商账户的命名认证配置文件。
---

# 提供商配置文件

提供商配置文件允许你为同一提供商配置多个认证上下文。这在你有个人和工作的独立账户，或在开发和生产 API 密钥之间切换时非常有用。

## 概述

配置文件是一个命名配置，包含：

- 提供商标识
- 认证凭证（API 密钥或 OAuth2 令牌）
- 模型偏好
- 速率限制覆盖

## 配置

```toml
[[auth.profiles]]
name = "personal"
provider = "anthropic"
api_key = "sk-ant-personal-..."
default_model = "claude-haiku"

[[auth.profiles]]
name = "work"
provider = "anthropic"
api_key = "sk-ant-work-..."
default_model = "claude-sonnet-4-6"
```

## 切换配置文件

```bash
# 使用特定配置文件
prx chat --profile work

# 设置默认配置文件
prx auth set-default work

# 列出配置文件
prx auth profiles
```

## 环境变量

配置文件可以引用环境变量作为凭证：

```toml
[[auth.profiles]]
name = "ci"
provider = "anthropic"
api_key = "${ANTHROPIC_API_KEY}"
```

## 相关页面

- [认证概览](./)
- [OAuth2 流程](./oauth2)
- [密钥管理](/zh/prx/security/secrets)
