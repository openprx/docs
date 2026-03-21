---
title: OAuth 认证
description: 为 PRX-Email 设置 OAuth 2.0 XOAUTH2 认证，支持 Gmail 和 Outlook。令牌生命周期管理、刷新提供者和热重载。
---

# OAuth 认证

PRX-Email 通过 XOAUTH2 机制支持 IMAP 和 SMTP 的 OAuth 2.0 认证。这是 Outlook/Office 365 的必要条件，也是 Gmail 的推荐方式。插件提供令牌过期追踪、可插拔刷新提供者和基于环境变量的热重载。

## XOAUTH2 工作原理

XOAUTH2 用 OAuth 访问令牌替代传统密码认证。客户端在 IMAP AUTHENTICATE 或 SMTP AUTH 期间发送特定格式的字符串：

```
user=<email>\x01auth=Bearer <access_token>\x01\x01
```

设置 `auth.oauth_token` 后 PRX-Email 自动处理此过程。

## Gmail OAuth 设置

### 1. 创建 Google Cloud 凭据

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目或选择现有项目
3. 启用 Gmail API
4. 创建 OAuth 2.0 凭据（桌面应用类型）
5. 记录**客户端 ID** 和**客户端密钥**

### 2. 获取访问令牌

使用 Google OAuth Playground 或自己的 OAuth 流程获取具有以下范围的访问令牌：

- `https://mail.google.com/`（完整 IMAP/SMTP 访问）

### 3. 配置 PRX-Email

```rust
use prx_email::plugin::{AuthConfig, ImapConfig, SmtpConfig};

let auth = AuthConfig {
    password: None,
    oauth_token: Some("ya29.your-access-token-here".to_string()),
};

let imap = ImapConfig {
    host: "imap.gmail.com".to_string(),
    port: 993,
    user: "you@gmail.com".to_string(),
    auth: auth.clone(),
};

let smtp = SmtpConfig {
    host: "smtp.gmail.com".to_string(),
    port: 465,
    user: "you@gmail.com".to_string(),
    auth,
};
```

## Outlook OAuth 设置

PRX-Email 包含一个 Outlook/Office 365 OAuth 引导脚本，处理完整的授权码流程。

### 1. 注册 Azure 应用

1. 前往 [Azure 门户应用注册](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. 注册新应用
3. 设置重定向 URI（如 `http://localhost:53682/callback`）
4. 记录**应用（客户端）ID** 和**目录（租户）ID**
5. 在 API 权限中添加：
   - `offline_access`
   - `https://outlook.office.com/IMAP.AccessAsUser.All`
   - `https://outlook.office.com/SMTP.Send`

### 2. 运行引导脚本

```bash
cd /path/to/prx_email
chmod +x scripts/outlook_oauth_bootstrap.sh

CLIENT_ID='your-azure-client-id' \
TENANT='your-tenant-id-or-common' \
REDIRECT_URI='http://localhost:53682/callback' \
./scripts/outlook_oauth_bootstrap.sh
```

脚本将：
1. 打印授权 URL——在浏览器中打开
2. 等待你粘贴回调 URL 或授权码
3. 用授权码换取访问令牌和刷新令牌
4. 保存令牌到 `./outlook_oauth.local.env`，权限为 `chmod 600`

### 脚本选项

| 参数 | 说明 |
|------|------|
| `--output <file>` | 自定义输出路径（默认：`./outlook_oauth.local.env`） |
| `--dry-run` | 只打印授权 URL 然后退出 |
| `-h`, `--help` | 显示使用帮助 |

### 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `CLIENT_ID` | 是 | Azure 应用客户端 ID |
| `TENANT` | 是 | 租户 ID，或 `common`/`organizations`/`consumers` |
| `REDIRECT_URI` | 是 | 在 Azure 应用中注册的重定向 URI |
| `SCOPE` | 否 | 自定义范围（默认：IMAP + SMTP + offline_access） |

::: warning 安全
永远不要提交生成的令牌文件。将 `*.local.env` 添加到 `.gitignore`。
:::

## 令牌生命周期管理

### 过期追踪

PRX-Email 按协议（IMAP/SMTP）追踪 OAuth 令牌过期时间戳：

```rust
// 通过环境变量设置过期时间
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800000000");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800000000");
```

每次操作前，插件检查令牌是否在 60 秒内过期。如果是，尝试刷新。

### 可插拔刷新提供者

实现 `OAuthRefreshProvider` trait 处理自动令牌刷新：

```rust
use prx_email::plugin::{
    OAuthRefreshProvider, RefreshedOAuthToken, ApiError, ErrorCode,
};

struct MyRefreshProvider {
    client_id: String,
    client_secret: String,
    refresh_token: String,
}

impl OAuthRefreshProvider for MyRefreshProvider {
    fn refresh_token(
        &self,
        protocol: &str,
        user: &str,
        current_token: &str,
    ) -> Result<RefreshedOAuthToken, ApiError> {
        // 调用 OAuth 提供商的令牌端点
        // 返回新的访问令牌和可选的过期时间
        Ok(RefreshedOAuthToken {
            token: "new-access-token".to_string(),
            expires_at: Some(now + 3600),
        })
    }
}
```

创建插件时附加提供者：

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(MyRefreshProvider {
        client_id: "...".to_string(),
        client_secret: "...".to_string(),
        refresh_token: "...".to_string(),
    }));
```

### 环境变量热重载

运行时重载 OAuth 令牌，无需重启：

```rust
// 在环境中设置新令牌
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-imap-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-smtp-token");
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800003600");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800003600");

// 触发重载
plugin.reload_auth_from_env("PRX_EMAIL");
```

`reload_auth_from_env` 方法读取给定前缀的环境变量，更新 IMAP/SMTP OAuth 令牌和过期时间戳。加载 OAuth 令牌时会清除对应的密码，以维护"二选一"的认证不变量。

### 完整配置重载

进行完整的传输重配置：

```rust
plugin.reload_config(new_transport_config)?;
```

这会验证新配置并原子性地替换整个传输配置。

## OAuth 环境变量

| 变量 | 说明 |
|------|------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | IMAP OAuth 访问令牌 |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | SMTP OAuth 访问令牌 |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | IMAP 令牌过期时间（Unix 秒） |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | SMTP 令牌过期时间（Unix 秒） |

默认前缀为 `PRX_EMAIL`。使用 `reload_auth_from_env("PRX_EMAIL")` 在运行时加载。

## 安全最佳实践

1. **永不记录令牌。** PRX-Email 清理调试消息并编辑认证相关内容。
2. **使用刷新令牌。** 访问令牌会过期；生产环境务必实现刷新提供者。
3. **安全存储令牌。** 使用文件权限（`chmod 600`），永不将令牌文件提交到版本控制。
4. **定期轮换令牌。** 即使有自动刷新，也应定期验证令牌正在轮换。

## 后续步骤

- [账户管理](./index) —— 管理账户和功能标志
- [配置参考](../configuration/) —— 所有环境变量和设置
- [故障排除](../troubleshooting/) —— OAuth 相关错误排查
