# 快速上手

本指南将引导你配置一个简单的 Webhook 转发代理，并通过模拟事件进行端到端测试。

## 第一步：创建配置文件

创建 `config.toml` 文件：

```toml
[server]
listen = "0.0.0.0:9000"

[security]
webhook_secrets = ["my-test-secret"]

[[agents]]
id = "echo-agent"
name = "Echo Agent"
agent_type = "webhook"

[agents.webhook]
url = "https://httpbin.org/post"
```

该配置：

- 监听 9000 端口
- 使用密钥 `my-test-secret` 进行 HMAC-SHA256 签名验证
- 将机器人事件转发到 httpbin.org 进行测试

## 第二步：启动服务

```bash
./target/release/openpr-webhook config.toml
```

你应当看到以下输出：

```
INFO openpr_webhook: Loaded 1 agent(s)
INFO openpr_webhook: tunnel subsystem disabled (feature flag or safe mode)
INFO openpr_webhook: openpr-webhook listening on 0.0.0.0:9000
```

## 第三步：发送测试事件

生成测试负载的 HMAC-SHA256 签名并发送：

```bash
# 测试负载
PAYLOAD='{"event":"issue.updated","bot_context":{"is_bot_task":true,"bot_name":"echo-agent","bot_agent_type":"webhook"},"data":{"issue":{"id":"42","key":"PROJ-42","title":"修复登录问题"}},"actor":{"name":"alice"},"project":{"name":"backend"}}'

# 计算 HMAC-SHA256 签名
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

# 发送 Webhook
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

预期响应：

```json
{
  "status": "dispatched",
  "agent": "echo-agent",
  "result": "webhook: 200 OK"
}
```

## 第四步：测试事件过滤

不包含 `bot_context.is_bot_task = true` 的事件会被静默忽略：

```bash
PAYLOAD='{"event":"issue.created","data":{"issue":{"id":"1"}}}'
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

响应：

```json
{
  "status": "ignored",
  "reason": "not_bot_task"
}
```

## 第五步：测试签名拒绝

无效签名返回 HTTP 401：

```bash
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=invalid" \
  -d '{"event":"test"}'
```

响应：`401 Unauthorized`

## 代理匹配逻辑

当收到 `is_bot_task = true` 的 Webhook 事件时，服务按以下逻辑匹配代理：

1. **按名称匹配** -- `bot_context.bot_name` 与代理的 `id` 精确匹配或与 `name` 不区分大小写匹配
2. **按类型回退** -- 如果名称不匹配，使用第一个 `agent_type` 与 `bot_context.bot_agent_type` 相同的代理

如果没有任何代理匹配，响应中会包含 `"status": "no_agent"`。

## 下一步

- [代理类型](../agents/index.md) -- 了解全部 5 种代理类型
- [执行器详解](../agents/executors.md) -- 深入了解每种执行器
- [配置参考](../configuration/index.md) -- 完整的 TOML 配置说明
