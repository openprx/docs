---
title: 远程节点工具
description: PRX 的 nodes 工具支持分布式节点间的通信和管理，实现多设备协同的 Agent 网络。
---

# 远程节点工具

`nodes` 工具使 PRX Agent 能够与分布式部署中的远程节点进行通信和管理。在 PRX 的架构中，多个 PRX 实例可以组成一个节点网络——运行在不同设备（服务器、笔记本、树莓派等）上的 PRX 实例通过安全的点对点协议互相连接，形成一个协同的 Agent 网络。

通过 `nodes` 工具，主节点的 Agent 可以查询远程节点的状态、向远程节点发送任务、获取远程执行结果，以及管理节点的连接和配对。这使得 Agent 的能力可以跨设备延伸——例如在本地笔记本上向远程服务器发送编译任务，或从远程监控节点获取系统状态。

`nodes` 工具在 `all_tools()` 模式下始终可用。实际使用前需要完成节点配对（pairing）流程。

## 配置

在 `config.toml` 中配置节点通信：

```toml
[nodes]
enabled = true

# 本节点信息
node_id = "laptop-01"        # 本节点唯一标识
display_name = "工作笔记本"    # 显示名称
listen_port = 9090            # 监听端口

# 已配对的远程节点
[[nodes.peers]]
node_id = "server-01"
display_name = "构建服务器"
address = "192.168.1.100:9090"
public_key = "ed25519:base64encodedkey..."

[[nodes.peers]]
node_id = "monitor-01"
display_name = "监控节点"
address = "192.168.1.200:9090"
public_key = "ed25519:base64encodedkey..."

# 通信安全
[nodes.security]
encryption = "noise"          # Noise 协议加密
auth_method = "mutual_tls"    # 双向 TLS 认证
heartbeat_interval_secs = 30  # 心跳间隔
connection_timeout_secs = 10  # 连接超时
```

工具策略控制：

```toml
[security.tool_policy.tools]
nodes = "supervised"    # 远程操作建议监督
```

## 使用方法

### 列出已连接节点

```json
{
  "tool": "nodes",
  "arguments": {
    "action": "list"
  }
}
```

返回：

```json
{
  "nodes": [
    {
      "node_id": "server-01",
      "display_name": "构建服务器",
      "status": "online",
      "last_seen": "2024-01-15T10:30:00Z",
      "latency_ms": 12,
      "capabilities": ["shell", "file_read", "file_write"]
    },
    {
      "node_id": "monitor-01",
      "display_name": "监控节点",
      "status": "offline",
      "last_seen": "2024-01-15T09:45:00Z"
    }
  ]
}
```

### 查询节点状态

```json
{
  "tool": "nodes",
  "arguments": {
    "action": "status",
    "node_id": "server-01"
  }
}
```

返回：

```json
{
  "node_id": "server-01",
  "status": "online",
  "uptime": "3d 12h 45m",
  "system": {
    "os": "Linux 6.1",
    "cpu_usage": 23.5,
    "memory_usage": 45.2,
    "disk_usage": 67.8
  },
  "agent": {
    "version": "1.2.0",
    "active_sessions": 2,
    "tools_available": 42
  }
}
```

### 向远程节点发送任务

```json
{
  "tool": "nodes",
  "arguments": {
    "action": "execute",
    "node_id": "server-01",
    "task": {
      "tool": "shell",
      "arguments": {
        "command": "cargo build --release"
      }
    },
    "timeout": 600
  }
}
```

### 从远程节点获取文件

```json
{
  "tool": "nodes",
  "arguments": {
    "action": "fetch_file",
    "node_id": "server-01",
    "remote_path": "/home/user/project/target/release/app",
    "local_path": "/tmp/app"
  }
}
```

### 向远程节点发送文件

```json
{
  "tool": "nodes",
  "arguments": {
    "action": "send_file",
    "node_id": "server-01",
    "local_path": "/home/user/config.toml",
    "remote_path": "/home/user/project/config.toml"
  }
}
```

### 节点配对

```json
{
  "tool": "nodes",
  "arguments": {
    "action": "pair",
    "address": "192.168.1.100:9090",
    "pairing_code": "ABC-123-XYZ"
  }
}
```

## 参数

### 通用参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型（见下表） |

### 操作类型及参数

| 操作 | 说明 | 额外参数 |
|------|------|----------|
| `list` | 列出所有已配对节点 | 无 |
| `status` | 查询节点详细状态 | `node_id` |
| `execute` | 在远程节点执行任务 | `node_id`、`task`、`timeout` |
| `fetch_file` | 从远程节点下载文件 | `node_id`、`remote_path`、`local_path` |
| `send_file` | 向远程节点上传文件 | `node_id`、`local_path`、`remote_path` |
| `pair` | 与新节点建立配对 | `address`、`pairing_code` |
| `unpair` | 解除节点配对 | `node_id` |
| `ping` | 测试节点连通性 | `node_id` |

### execute 参数详情

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `node_id` | string | 是 | — | 目标节点 ID |
| `task` | object | 是 | — | 要执行的工具调用（包含 `tool` 和 `arguments`） |
| `timeout` | integer | 否 | `300` | 远程执行超时秒数 |
| `async` | boolean | 否 | `false` | 是否异步执行（立即返回任务 ID） |

### 文件传输参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `node_id` | string | 是 | 目标节点 ID |
| `remote_path` | string | 是 | 远程节点上的文件路径 |
| `local_path` | string | 是 | 本地文件路径 |

## 节点网络架构

### 网络拓扑

PRX 节点网络采用去中心化的 mesh 拓扑：

```
  笔记本 (laptop-01)
    │     ╲
    │      ╲
    │       ╲
  服务器 (server-01) ──── 监控节点 (monitor-01)
    │
    │
  树莓派 (rpi-01)
```

每个节点可以直接与任何其他已配对的节点通信，无需中心服务器。

### 配对流程

节点配对使用一次性配对码进行身份验证：

1. 节点 A 生成配对码（`prx nodes pair --generate`）
2. 配对码通过安全渠道（面对面、加密消息等）传递给节点 B
3. 节点 B 使用配对码发起配对请求
4. 双方交换公钥，建立加密通信信道
5. 配对完成，配对码作废

### 通信协议

节点间通信使用 Noise Protocol Framework 加密：

- **密钥协商**: Noise_XX 模式（双向认证）
- **加密算法**: ChaCha20-Poly1305
- **密钥类型**: Ed25519
- **传输层**: TCP + 心跳保活

## 安全性

### 认证和加密

所有节点间通信都经过端到端加密：

| 层次 | 机制 | 说明 |
|------|------|------|
| 身份验证 | Ed25519 公钥 | 配对时交换并固化 |
| 传输加密 | Noise Protocol | ChaCha20-Poly1305 |
| 心跳检测 | 定期 ping | 检测节点离线 |
| 重放保护 | 序列号 + 时间戳 | 防止消息重放攻击 |

### 远程执行安全

远程执行继承目标节点的安全策略：

- 远程 `shell` 命令受目标节点的沙箱配置约束
- 远程 `file_read`/`file_write` 受目标节点的路径验证约束
- 目标节点可以拒绝来自特定节点的特定工具调用

### 文件传输安全

文件传输需注意：

- 传输过程全程加密
- 目标路径受节点本地安全策略约束
- 大文件传输支持分块和断点续传
- 传输完成后进行完整性校验（SHA-256）

### 网络隔离建议

在生产环境中，建议：

```toml
[nodes.security]
# 仅允许特定 IP 范围
allowed_networks = ["192.168.1.0/24", "10.0.0.0/8"]

# 限制可远程执行的工具
allowed_remote_tools = ["shell", "file_read", "git_operations"]
```

## 相关文档

- [工具概览](/zh/prx/tools/) — 所有工具的分类参考
- [节点系统](/zh/prx/nodes/) — 分布式节点架构概览
- [节点配对](/zh/prx/nodes/pairing/) — 配对流程详解
- [节点协议](/zh/prx/nodes/protocol/) — 通信协议规范
- [安全策略](/zh/prx/security/policy-engine/) — 工具策略管道详解
