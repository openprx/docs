---
title: OAuth2 流程
description: PRX 支持的 OAuth2 认证流程，用于 LLM 提供商授权。
---

# OAuth2 流程

PRX 为支持基于浏览器认证的提供商实现了 OAuth2 授权流程。这允许用户无需手动管理 API 密钥即可完成认证。

## 支持的流程

### 授权码流程

用于 Anthropic（Claude Code）、Google Gemini CLI 和 Minimax：

1. PRX 打开浏览器到提供商的授权 URL
2. 用户授予权限
3. 提供商重定向到 PRX 的本地回调服务器
4. PRX 用授权码交换访问令牌和刷新令牌
5. 令牌被安全存储以供后续使用

### 设备码流程

用于 GitHub Copilot：

1. PRX 向提供商请求设备码
2. 用户访问 URL 并输入设备码
3. PRX 轮询授权完成状态
4. 授权完成后，接收并存储令牌

## 令牌管理

PRX 自动处理：

- 令牌缓存以避免重复授权
- 访问令牌过期时的刷新令牌轮换
- 令牌的安全存储（静态加密）

## 配置

```toml
[auth.oauth2]
redirect_port = 8400
token_cache_path = "~/.local/share/openprx/tokens"
auto_refresh = true
```

## CLI 命令

```bash
prx auth login anthropic    # 启动 Anthropic 的 OAuth2 流程
prx auth login copilot      # 启动 Copilot 的设备码流程
prx auth status              # 显示所有提供商的认证状态
prx auth logout anthropic   # 撤销 Anthropic 的令牌
```

## 相关页面

- [认证概览](./)
- [提供商配置文件](./profiles)
