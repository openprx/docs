---
title: prx auth — 认证管理
description: 管理 OpenPRX 提供商的 OAuth 和 Token 认证配置文件。
---

# prx auth

管理提供商的认证配置文件（auth profiles）。支持 OAuth 设备码流程、浏览器回调流程和手动 Token 粘贴。每个提供商可以有多个认证配置文件，通过 `use` 切换活跃配置。

## 用法

```bash
prx auth <COMMAND>
```

## 子命令

| 子命令 | 说明 |
|--------|------|
| `login` | 启动 OAuth 登录流程 |
| `paste-redirect` | 粘贴 OAuth 回调 URL 完成登录 |
| `paste-token` | 粘贴 API Token 或授权令牌 |
| `setup-token` | 交互式粘贴令牌（`paste-token` 的别名） |
| `refresh` | 刷新 OAuth 访问令牌 |
| `logout` | 删除认证配置文件 |
| `use` | 切换活跃的认证配置文件 |
| `list` | 列出所有认证配置文件 |
| `status` | 显示认证状态和令牌过期信息 |

## prx auth login

启动 OAuth 登录流程。目前支持 OpenAI Codex 提供商。

```bash
prx auth login --provider <PROVIDER> [OPTIONS]
```

### 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--provider <NAME>` | — | **必填** | 提供商名称（目前仅支持 `openai-codex`） |
| `--profile <NAME>` | — | `default` | 认证配置文件名称 |
| `--device-code` | — | `false` | 使用 OAuth 设备码流程（无需浏览器回调） |

### 示例

#### 浏览器回调流程（默认）

```bash
prx auth login --provider openai-codex
```

命令会：
1. 生成 PKCE 授权 URL 并打印
2. 在 `http://localhost:1455/auth/callback` 等待回调
3. 交换授权码为访问令牌
4. 保存并激活配置文件

#### 设备码流程

```bash
prx auth login --provider openai-codex --device-code
```

适合无法接收回调的环境（如 SSH 远程终端）。命令会显示设备码和验证 URL，在浏览器中完成授权后自动获取令牌。

#### 指定配置文件名称

```bash
prx auth login --provider openai-codex --profile work
```

## prx auth paste-redirect

当浏览器回调捕获失败时，手动粘贴重定向 URL 或授权码完成 OAuth 流程。

```bash
prx auth paste-redirect --provider <PROVIDER> [OPTIONS]
```

### 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--provider <NAME>` | — | **必填** | 提供商名称 |
| `--profile <NAME>` | — | `default` | 配置文件名称 |
| `--input <URL_OR_CODE>` | — | — | 重定向 URL 或授权码（省略时交互式输入） |

### 示例

```bash
prx auth paste-redirect --provider openai-codex --input "http://localhost:1455/auth/callback?code=abc123&state=xyz"
```

## prx auth paste-token

直接粘贴 API Token 或授权令牌。适用于不使用 OAuth 的提供商（如 Anthropic）。

```bash
prx auth paste-token --provider <PROVIDER> [OPTIONS]
```

### 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--provider <NAME>` | — | **必填** | 提供商名称 |
| `--profile <NAME>` | — | `default` | 配置文件名称 |
| `--token <VALUE>` | — | — | Token 值（省略时交互式隐藏输入） |
| `--auth-kind <KIND>` | — | 自动检测 | 认证类型：`authorization` 或 `api-key` |

### 示例

```bash
# 交互式输入（推荐，Token 不会出现在 shell 历史中）
prx auth paste-token --provider anthropic

# 直接传入
prx auth paste-token --provider anthropic --token sk-ant-xxxx
```

## prx auth setup-token

`paste-token` 的别名，默认使用 `authorization` 类型。适合 Anthropic 订阅认证场景。

```bash
prx auth setup-token --provider <PROVIDER> [OPTIONS]
```

### 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--provider <NAME>` | — | **必填** | 提供商名称 |
| `--profile <NAME>` | — | `default` | 配置文件名称 |

## prx auth refresh

使用 refresh token 刷新访问令牌。

```bash
prx auth refresh --provider <PROVIDER> [OPTIONS]
```

### 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--provider <NAME>` | — | **必填** | 提供商名称（目前仅支持 `openai-codex`） |
| `--profile <NAME>` | — | — | 配置文件名称或 ID |

### 示例

```bash
prx auth refresh --provider openai-codex
prx auth refresh --provider openai-codex --profile work
```

## prx auth logout

删除指定的认证配置文件。

```bash
prx auth logout --provider <PROVIDER> [OPTIONS]
```

### 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--provider <NAME>` | — | **必填** | 提供商名称 |
| `--profile <NAME>` | — | `default` | 配置文件名称 |

### 示例

```bash
prx auth logout --provider openai-codex
prx auth logout --provider anthropic --profile work
```

## prx auth use

切换某个提供商的活跃认证配置文件。

```bash
prx auth use --provider <PROVIDER> --profile <NAME>
```

### 示例

```bash
prx auth use --provider openai-codex --profile work
```

## prx auth list

列出所有认证配置文件。活跃的配置文件前会显示 `*` 标记。

```bash
prx auth list
```

## prx auth status

显示所有认证配置文件的详细状态，包括认证类型、账户 ID 和令牌过期时间。

```bash
prx auth status
```

## 安全说明

- 认证令牌使用 ChaCha20 加密存储在本地，文件权限设为 `0600`（仅所有者可读写）
- 交互式输入令牌时使用密码模式，输入不会回显在终端
- 建议避免在命令行中直接传入 `--token` 参数，因为 Token 会记录在 shell 历史中

## 相关链接

- [LLM 提供商](../providers/) — 支持的提供商列表
- [安全](../security/) — 密钥管理与加密
- [prx onboard](./onboard) — 安装向导（含认证配置）
