---
title: 故障排除
description: PRX-Email 常见问题解决方案，包括 OAuth 错误、IMAP 同步失败、SMTP 发送问题、SQLite 错误和 WASM 插件问题。
---

# 故障排除

本页涵盖运行 PRX-Email 时最常遇到的问题及其原因和解决方案。

## OAuth 令牌过期

**症状：** 操作失败，错误码为 `Provider`，消息提及令牌过期。

**可能原因：**
- OAuth 访问令牌已过期且未配置刷新提供者
- `*_OAUTH_EXPIRES_AT` 环境变量包含过时的时间戳
- 刷新提供者返回错误

**解决方案：**

1. **验证令牌过期时间戳：**

```bash
echo $PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT
echo $PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT
# 这些应该是未来的 Unix 时间戳
```

2. **手动从环境重载令牌：**

```rust
// 设置新令牌
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-token");

// 重载
plugin.reload_auth_from_env("PRX_EMAIL");
```

3. **实现刷新提供者** 用于自动令牌续期：

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(my_refresh_provider));
```

4. **重新运行 Outlook 引导脚本** 获取新令牌：

```bash
CLIENT_ID='...' TENANT='...' REDIRECT_URI='...' \
./scripts/outlook_oauth_bootstrap.sh
```

::: tip
PRX-Email 在令牌过期前 60 秒尝试刷新。如果令牌过期速度快于同步间隔，请确保已连接刷新提供者。
:::

## IMAP 同步失败

**症状：** `sync()` 返回 `Network` 错误，或同步调度器报告失败。

**可能原因：**
- IMAP 服务器主机名或端口不正确
- 网络连接问题
- 认证失败（密码错误或 OAuth 令牌过期）
- IMAP 服务器限速

**解决方案：**

1. **验证与 IMAP 服务器的连通性：**

```bash
openssl s_client -connect imap.example.com:993 -quiet
```

2. **检查传输配置：**

```rust
// 确保主机和端口正确
println!("IMAP 主机: {}", config.imap.host);
println!("IMAP 端口: {}", config.imap.port);
```

3. **验证认证模式：**

```rust
// 必须恰好设置一个
assert!(config.imap.auth.password.is_some() ^ config.imap.auth.oauth_token.is_some());
```

4. **检查同步调度器退避状态。** 反复失败后调度器应用指数退避。临时使用远未来的 `now_ts` 重置：

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &config);
```

5. **检查结构化日志** 获取详细错误信息：

```bash
grep "prx_email.*sync" /path/to/logs
```

## SMTP 发送失败

**症状：** `send()` 返回 `ok: false` 的 `ApiResponse`，带 `Network` 或 `Provider` 错误。

**可能原因：**
- SMTP 服务器主机名或端口不正确
- 认证失败
- 收件人地址被提供商拒绝
- 限速或发送配额超限

**解决方案：**

1. **检查发件箱状态：**

```rust
let outbox = plugin.get_outbox(outbox_id)?;
if let Some(msg) = outbox {
    println!("状态: {}", msg.status);
    println!("重试: {}", msg.retries);
    println!("最后错误: {:?}", msg.last_error);
    println!("下次尝试: {}", msg.next_attempt_at);
}
```

2. **验证 SMTP 配置：**

```rust
println!("认证: password={}, oauth={}",
    config.smtp.auth.password.is_some(),
    config.smtp.auth.oauth_token.is_some());
```

3. **检查验证错误。** 发送 API 拒绝：
   - 空的 `to`、`subject` 或 `body_text`
   - 禁用的 `email_send` 功能标志
   - 无效的邮件地址

## 发件箱卡在"sending"状态

**症状：** 发件箱记录的 `status = 'sending'` 但进程在完成前崩溃。

**原因：** 进程在认领发件箱记录后但完成之前崩溃。

**解决方案：** 通过 SQL 手动恢复卡住的记录：

```sql
-- 识别卡住的行（阈值：15分钟）
SELECT id, account_id, updated_at
FROM outbox
WHERE status = 'sending' AND updated_at < strftime('%s','now') - 900;

-- 恢复为 failed 并调度重试
UPDATE outbox
SET status = 'failed',
    last_error = 'recovered_from_stuck_sending',
    next_attempt_at = strftime('%s','now') + 30,
    updated_at = strftime('%s','now')
WHERE status = 'sending' AND updated_at < strftime('%s','now') - 900;
```

## 附件被拒绝

**症状：** 发送失败，提示"附件超过大小限制"或"附件内容类型不允许"。

**解决方案：**

1. **检查附件策略：**

```rust
let policy = &config.attachment_policy;
println!("最大大小: {} 字节", policy.max_size_bytes);
println!("允许的类型: {:?}", policy.allowed_content_types);
```

2. **验证文件大小** 在限制内（默认：25 MiB）。

3. **添加 MIME 类型** 到允许列表（如果安全）：

```rust
policy.allowed_content_types.insert("application/vnd.ms-excel".to_string());
```

4. **对于基于路径的附件**，确保文件路径在配置的附件存储根目录下。包含 `../` 或解析到根目录外的符号链接的路径会被拒绝。

## 功能禁用错误

**症状：** 操作返回 `FeatureDisabled` 错误码。

**原因：** 请求操作的功能标志未为该账户启用。

**解决方案：**

```rust
// 检查当前状态
let enabled = plugin.is_feature_enabled(account_id, "email_send")?;
println!("email_send 已启用: {}", enabled);

// 启用功能
plugin.set_account_feature(account_id, "email_send", true, now)?;

// 或设置全局默认值
plugin.set_feature_default("email_send", true, now)?;
```

## SQLite 数据库错误

**症状：** 操作失败，错误码为 `Storage`。

**可能原因：**
- 数据库文件被另一个进程锁定
- 磁盘已满
- 数据库文件损坏
- 迁移未运行

**解决方案：**

1. **运行迁移：**

```rust
let store = EmailStore::open("./email.db")?;
store.migrate()?;
```

2. **检查数据库锁。** 同一时间只能有一个写连接。增加忙等待超时：

```rust
let config = StoreConfig {
    busy_timeout_ms: 30_000, // 30 秒
    ..StoreConfig::default()
};
```

3. **检查磁盘空间：**

```bash
df -h .
```

4. **修复或重建**（如果数据库损坏）：

```bash
# 备份现有数据库
cp email.db email.db.bak

# 检查完整性
sqlite3 email.db "PRAGMA integrity_check;"

# 如果损坏，导出并重新导入
sqlite3 email.db ".dump" | sqlite3 email_new.db
```

## WASM 插件问题

### 网络防护错误

**症状：** WASM 托管的邮件操作返回 `EMAIL_NETWORK_GUARD` 错误。

**原因：** 网络安全开关未启用。

**解决方案：**

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### 宿主能力不可用

**症状：** 操作返回 `EMAIL_HOST_CAPABILITY_UNAVAILABLE`。

**原因：** 宿主运行时未提供邮件能力。这发生在 WASM 上下文外运行时。

**解决方案：** 确保 PRX 运行时已配置为向插件提供邮件主机调用。

## 同步调度器持续跳过作业

**症状：** 同步调度器报告 `attempted: 0`，即使已配置作业。

**原因：** 所有作业因之前的失败处于退避中。

**解决方案：**

1. **检查失败退避状态**，查看结构化日志。
2. **验证网络可达性** 和 IMAP 认证正确性后再重新运行。
3. **重置退避**，使用远未来的时间戳：

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &default_config);
```

## 发送失败率高

**症状：** 指标显示 `send_failures` 计数很高。

**解决方案：**

1. **检查结构化日志**，按 `run_id` 和 `error_code` 过滤：

```bash
grep "prx_email.*send_failed" /path/to/logs
```

2. **检查 SMTP 认证模式。** 确保恰好设置了 password 或 oauth_token 之一。

3. **验证提供商可用性** 后再启用广泛灰度。

4. **检查指标：**

```rust
let metrics = plugin.metrics_snapshot();
println!("发送失败: {}", metrics.send_failures);
println!("重试次数: {}", metrics.retry_count);
```

## 获取帮助

如果以上方案都无法解决问题：

1. **查看现有 issue：** [github.com/openprx/prx_email/issues](https://github.com/openprx/prx_email/issues)
2. **提交新 issue** 并附上：
   - PRX-Email 版本（查看 `Cargo.toml`）
   - Rust 工具链版本（`rustc --version`）
   - 相关结构化日志输出
   - 复现步骤

## 后续步骤

- [配置参考](../configuration/) —— 审查所有设置
- [OAuth 认证](../accounts/oauth) —— 解决 OAuth 相关问题
- [SQLite 存储](../storage/) —— 数据库维护和恢复
