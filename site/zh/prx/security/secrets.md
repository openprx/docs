---
title: 密钥管理
description: PRX 中 API 密钥和凭证的安全存储与访问控制。
---

# 密钥管理

PRX 为 API 密钥、令牌和凭证等敏感数据提供安全存储。密钥在静态时加密，并通过受控 API 访问。

## 概述

密钥系统：

- 使用 AES-256-GCM 静态加密密钥
- 从主密码或系统密钥环派生加密密钥
- 为工具执行提供环境变量注入
- 支持密钥轮换和过期

## 存储

密钥存储在加密文件 `~/.local/share/openprx/secrets.enc` 中。加密密钥来源于：

1. 系统密钥环（首选，可用时）
2. 主密码（交互式提示）
3. 环境变量 `PRX_MASTER_KEY`（用于自动化）

## 配置

```toml
[security.secrets]
store_path = "~/.local/share/openprx/secrets.enc"
key_derivation = "argon2id"
auto_rotate_days = 90
```

## CLI 命令

```bash
prx secret set OPENAI_API_KEY      # 设置密钥（提示输入值）
prx secret get OPENAI_API_KEY      # 获取密钥
prx secret list                    # 列出密钥名称（不显示值）
prx secret delete OPENAI_API_KEY   # 删除密钥
prx secret rotate                  # 轮换主密钥
```

## 相关页面

- [安全概览](./)
- [认证](/zh/prx/auth/)
