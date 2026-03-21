# 故障排查

## 常见问题

### Webhook POST 返回 401 Unauthorized

**现象：** 所有 Webhook 请求都返回 HTTP 401。

**可能原因：**

1. **缺少签名请求头。** 请求必须携带 `X-Webhook-Signature` 或 `X-OpenPR-Signature` 请求头，格式为 `sha256={hex摘要}`。

2. **密钥不匹配。** HMAC-SHA256 摘要必须与 `security.webhook_secrets` 中的某个密钥匹配。检查发送端和接收端是否使用相同的密钥字符串。

3. **请求体被篡改。** 签名基于原始请求体计算。如果代理或中间件修改了请求体（如重新编码 JSON），签名将无法匹配。

**排查方法：**

```bash
# 启用调试级别日志
RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml

# 临时允许未签名请求以排除签名问题
# (config.toml)
[security]
allow_unsigned = true
```

### 事件被忽略 (not_bot_task)

**现象：** 响应为 `{"status": "ignored", "reason": "not_bot_task"}`。

**原因：** Webhook 负载中没有包含 `bot_context.is_bot_task = true`。OpenPR-Webhook 只处理明确标记为机器人任务的事件。

**解决方法：** 确保 OpenPR 平台配置了在 Webhook 负载中包含机器人上下文：

```json
{
  "event": "issue.updated",
  "bot_context": {
    "is_bot_task": true,
    "bot_name": "my-agent",
    "bot_agent_type": "cli"
  },
  "data": { ... }
}
```

### 找不到匹配代理

**现象：** 响应为 `{"status": "no_agent", "bot_name": "..."}`。

**原因：** 没有已配置的代理与负载中的 `bot_name` 或 `bot_agent_type` 匹配。

**解决方法：**

1. 检查是否有代理的 `id` 或 `name` 与 `bot_name` 值匹配
2. 检查代理的 `agent_type` 是否与 `bot_agent_type` 匹配
3. `name` 匹配不区分大小写，但 `id` 匹配是精确匹配

### CLI 代理返回 "disabled"

**现象：** CLI 分发返回 `"cli disabled by feature flag or safe mode"`。

**可能原因：**

1. `features.cli_enabled` 未设置为 `true`
2. 设置了 `OPENPR_WEBHOOK_SAFE_MODE` 环境变量

**解决方法：**

```toml
[features]
cli_enabled = true
```

并验证安全模式未激活：

```bash
echo $OPENPR_WEBHOOK_SAFE_MODE
# 应为空或未设置
```

### CLI 执行器 "not allowed"

**现象：** 错误信息 `"executor not allowed: {name}"`。

**原因：** CLI 代理配置中的 `executor` 字段值不在白名单中。

**允许的执行器：**
- `codex`
- `claude-code`
- `opencode`

其他任何值都会因安全原因被拒绝。

### 隧道连接失败

**现象：** 日志反复出现 `tunnel connect failed: ...`。

**可能原因：**

1. **无效 URL。** 隧道 URL 必须以 `wss://` 或 `ws://` 开头。
2. **网络问题。** 验证控制面服务器是否可达。
3. **认证失败。** 检查 `tunnel.auth_token` 是否正确。
4. **缺少必填字段。** `tunnel.agent_id` 和 `tunnel.auth_token` 都必须非空。

**排查方法：**

```bash
# 手动测试 WebSocket 连通性
# （需要 wscat 或 websocat 工具）
wscat -c wss://control.example.com/ws -H "Authorization: Bearer your-token"
```

### 隧道持续重连

**现象：** 日志循环出现 `tunnel disconnected, reconnecting in Ns`。

**正常行为：** 隧道会使用指数退避策略自动重连（上限为 `tunnel_reconnect_backoff_max_secs`）。检查控制面日志以确认断连原因。

**调优：**

```toml
[tunnel]
reconnect_secs = 3        # 基础重试间隔
heartbeat_secs = 20       # 保活间隔

[runtime]
tunnel_reconnect_backoff_max_secs = 120  # 最大退避时间
```

### 回调发送失败

**现象：** 日志出现 `start callback failed: ...` 或 `final callback failed: ...`。

**可能原因：**

1. **callback_enabled 为 false。** 回调需要 `features.callback_enabled = true`。
2. **无效的 callback_url。** 验证 URL 是否可达。
3. **认证失败。** 如回调端点要求认证，请设置 `callback_token`。
4. **超时。** 默认 HTTP 超时为 15 秒。可通过 `runtime.http_timeout_secs` 增大。

### OpenClaw/Custom 代理执行错误

**现象：** 响应包含 `exec_error: ...` 或 `error: ...`。

**可能原因：**

1. **找不到二进制文件。** 验证 `command` 路径存在且可执行。
2. **权限不足。** openpr-webhook 进程必须有执行权限。
3. **缺少依赖。** CLI 工具可能依赖其他程序或库。

**排查方法：**

```bash
# 手动测试命令
/usr/local/bin/openclaw --channel signal --target "+1234567890" --message "test"
```

## 诊断清单

1. **检查服务健康状态：**
   ```bash
   curl http://localhost:9000/health
   # 应返回：ok
   ```

2. **检查已加载的代理：**
   查看启动日志中的 `Loaded N agent(s)`。

3. **启用调试日志：**
   ```bash
   RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml
   ```

4. **手动验证签名：**
   ```bash
   echo -n '{"event":"test"}' | openssl dgst -sha256 -hmac "your-secret"
   ```

5. **使用未签名请求测试（仅限开发环境）：**
   ```toml
   [security]
   allow_unsigned = true
   ```

6. **检查安全模式状态：**
   ```bash
   # 如果已设置，隧道/CLI/回调将被强制禁用
   echo $OPENPR_WEBHOOK_SAFE_MODE
   ```

## 日志消息参考

| 日志级别 | 消息 | 含义 |
|----------|------|------|
| INFO | `Loaded N agent(s)` | 配置加载成功 |
| INFO | `openpr-webhook listening on ...` | 服务已启动 |
| INFO | `Received webhook event: ...` | 收到入站事件并已解析 |
| INFO | `Dispatching to agent: ...` | 匹配到代理，正在分发 |
| INFO | `tunnel connected: ...` | WSS 隧道已建立 |
| WARN | `Invalid webhook signature` | 签名验证失败 |
| WARN | `No agent for bot_name=...` | 未找到匹配的代理 |
| WARN | `tunnel disconnected, reconnecting` | 隧道连接断开 |
| WARN | `tunnel using insecure ws:// transport` | 未使用 TLS 加密 |
| ERROR | `tunnel connect failed: ...` | WebSocket 连接错误 |
| ERROR | `openclaw failed: ...` | OpenClaw 命令返回非零退出码 |
