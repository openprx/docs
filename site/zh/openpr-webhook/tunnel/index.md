# WSS 隧道

WSS 隧道（Phase B）提供从 OpenPR-Webhook 到控制面服务器的持久 WebSocket 连接。与等待入站 HTTP Webhook 不同，隧道允许控制面通过持久连接主动推送任务到代理。

当 Webhook 服务运行在 NAT 或防火墙后方、无法接收入站 HTTP 请求时，隧道模式尤为实用。

## 工作原理

```
控制面 (wss://...)
    ^         |
    |         | task.dispatch
    |         v
+-------------------+
| openpr-webhook    |
|   隧道客户端      |
|                   |
| task.ack  ------->|
| heartbeat ------->|
| task.result ----->|
+-------------------+
    |
    v
  CLI 代理 (codex / claude-code / opencode)
```

1. OpenPR-Webhook 向控制面 URL 建立 WebSocket 连接
2. 通过 `Authorization` 请求头中的 Bearer Token 进行认证
3. 定期发送心跳消息保持连接活跃
4. 接收来自控制面的 `task.dispatch` 消息
5. 立即回复 `task.ack` 确认接收
6. 通过 CLI 代理异步执行任务
7. 执行完成后发送 `task.result` 返回结果

## 启用隧道

隧道需要同时满足以下**两个**条件：

1. 特性标志：`features.tunnel_enabled = true`
2. 隧道配置：`tunnel.enabled = true`

两个条件必须同时为 true，且不能设置 `OPENPR_WEBHOOK_SAFE_MODE` 环境变量。

```toml
[features]
tunnel_enabled = true
cli_enabled = true  # 通常需要配合使用以执行任务

[tunnel]
enabled = true
url = "wss://control.example.com/ws/agent"
agent_id = "my-webhook-agent"
auth_token = "your-bearer-token"
reconnect_secs = 3
heartbeat_secs = 20
```

## 消息信封格式

所有隧道消息使用标准信封格式：

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "heartbeat",
  "ts": 1711234567,
  "agent_id": "my-webhook-agent",
  "payload": { "alive": true },
  "sig": "sha256=abc123..."
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | String (UUID) | 唯一消息标识符 |
| `type` | String | 消息类型（见下文） |
| `ts` | Integer | Unix 时间戳（秒） |
| `agent_id` | String | 发送方代理 ID |
| `payload` | Object | 类型相关的负载数据 |
| `sig` | String（可选） | 信封的 HMAC-SHA256 签名 |

## 消息类型

### 出站消息（代理到控制面）

| 类型 | 触发时机 | 负载内容 |
|------|----------|----------|
| `heartbeat` | 每隔 N 秒 | `{"alive": true}` |
| `task.ack` | 收到任务后立即回复 | `{"run_id": "...", "issue_id": "...", "status": "accepted"}` |
| `task.result` | 任务执行完成后 | `{"run_id": "...", "issue_id": "...", "status": "success/failed", "summary": "..."}` |
| `error` | 协议错误时 | `{"reason": "invalid_json/missing_signature/bad_signature", "msg_id": "..."}` |

### 入站消息（控制面到代理）

| 类型 | 用途 | 负载内容 |
|------|------|----------|
| `task.dispatch` | 向此代理下发任务 | `{"run_id": "...", "issue_id": "...", "agent": "...", "body": {...}}` |

## 任务下发流程

```
控制面                           openpr-webhook
    |                                 |
    |--- task.dispatch ------------->|
    |                                 |--- task.ack（立即回复）
    |<--- task.ack ------------------|
    |                                 |
    |                                 |--- 运行 CLI 代理
    |                                 |    （异步执行，最长 timeout 时间）
    |                                 |
    |<--- task.result ---------------|--- task.result
    |                                 |
```

`task.dispatch` 负载字段说明：

| 字段 | 类型 | 说明 |
|------|------|------|
| `run_id` | String | 唯一运行标识符（缺省时自动生成） |
| `issue_id` | String | 待处理的工单 ID |
| `agent` | String（可选） | 目标代理 ID（缺省时使用第一个 `cli` 类型代理） |
| `body` | Object | 传递给分发器的完整 Webhook 负载 |

## HMAC 信封签名

配置 `tunnel.hmac_secret` 后，所有出站信封都会被签名：

1. 将信封序列化为 JSON，其中 `sig` 字段设为 `null`
2. 使用密钥对 JSON 字节计算 HMAC-SHA256
3. 将签名以 `sha256={hex}` 格式设置到 `sig` 字段

对于入站消息，如果设置了 `tunnel.require_inbound_sig = true`，则任何没有有效签名的消息都会被拒绝，并回复 `error` 信封。

```toml
[tunnel]
hmac_secret = "与控制面共享的密钥"
require_inbound_sig = true
```

## 重连行为

隧道客户端在断开连接后会自动重连：

- 初始重试延迟：`reconnect_secs`（默认：3 秒）
- 退避策略：每次连续失败后延迟翻倍
- 最大退避时间：`runtime.tunnel_reconnect_backoff_max_secs`（默认：60 秒）
- 成功连接后重置为基础延迟

## 并发控制

通过隧道执行的 CLI 任务受 `runtime.cli_max_concurrency` 限制：

```toml
[runtime]
cli_max_concurrency = 2  # 允许 2 个并发 CLI 任务（默认：1）
```

超出并发限制的任务会等待信号量许可。这可以防止多个任务快速连续下发时造成机器过载。

## 配置参考

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `tunnel.enabled` | `false` | 启用/禁用隧道 |
| `tunnel.url` | -- | WebSocket URL（`wss://` 或 `ws://`） |
| `tunnel.agent_id` | `openpr-webhook` | 代理标识符 |
| `tunnel.auth_token` | -- | Bearer 认证令牌 |
| `tunnel.reconnect_secs` | `3` | 基础重连间隔 |
| `tunnel.heartbeat_secs` | `20` | 心跳间隔（最小 3 秒） |
| `tunnel.hmac_secret` | -- | HMAC-SHA256 签名密钥 |
| `tunnel.require_inbound_sig` | `false` | 拒绝未签名的入站消息 |

## 安全注意事项

- 生产环境务必使用 `wss://`。使用 `ws://` 时服务会输出警告日志。
- `auth_token` 在 WebSocket 升级时作为 HTTP 请求头发送；请确保使用 TLS 加密传输。
- 建议同时启用 `require_inbound_sig` 和 `hmac_secret`，防止伪造的任务下发。
