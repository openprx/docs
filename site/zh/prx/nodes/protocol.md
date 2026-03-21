---
title: 节点通信协议
description: PRX 节点间通信协议的技术规范。
---

# 节点通信协议

PRX 节点使用基于 TCP 的加密认证协议进行通信。本页描述线路格式和消息类型。

## 传输层

- **协议**：TCP + TLS 1.3（通过配对密钥的双向认证）
- **序列化**：长度前缀的 MessagePack 帧
- **压缩**：可选 LZ4 帧压缩

## 消息类型

| 类型 | 方向 | 描述 |
|------|------|------|
| `TaskRequest` | 控制器 -> 节点 | 分配任务给节点 |
| `TaskResult` | 节点 -> 控制器 | 返回任务执行结果 |
| `StatusQuery` | 控制器 -> 节点 | 请求节点状态 |
| `StatusReport` | 节点 -> 控制器 | 报告节点健康和容量 |
| `Heartbeat` | 双向 | 保活和延迟测量 |
| `Cancel` | 控制器 -> 节点 | 取消运行中的任务 |

## 配置

```toml
[node.protocol]
tls_version = "1.3"
compression = "lz4"  # "lz4" | "none"
max_frame_size_kb = 4096
heartbeat_interval_secs = 15
connection_timeout_secs = 10
```

## 连接生命周期

1. **连接** -- 建立 TCP 连接
2. **TLS 握手** -- 使用配对密钥的双向认证
3. **协议协商** -- 确认版本和压缩方式
4. **活跃** -- 交换消息
5. **优雅关闭** -- 发送断开消息并关闭

## 相关页面

- [节点概览](./)
- [节点配对](./pairing)
