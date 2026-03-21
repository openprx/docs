---
title: 会话 Worker
description: PRX 的进程隔离会话执行，用于故障容错和资源控制。
---

# 会话 Worker

会话 Worker 为 Agent 会话提供进程级隔离。PRX 可以生成专用的 Worker 进程来包含故障并在操作系统级别强制执行资源限制，而不是在单个进程中运行所有会话。

## 设计动机

进程隔离提供多项优势：

- **故障隔离** -- 一个会话的崩溃不会影响其他会话
- **资源限制** -- 通过 cgroups 或操作系统机制强制执行每会话的内存和 CPU 限制
- **安全边界** -- 不同信任级别的会话在独立的地址空间中运行
- **优雅降级** -- 主进程可以重启失败的 Worker

## 架构

```
┌──────────────┐
│   主进程      │
│  （监督者）   │
│               │
│  ┌──────────┐ │    ┌─────────────┐
│  │  会话 A  ├─┼───►│ Worker 进程 │
│  └──────────┘ │    └─────────────┘
│  ┌──────────┐ │    ┌─────────────┐
│  │  会话 B  ├─┼───►│ Worker 进程 │
│  └──────────┘ │    └─────────────┘
└──────────────┘
```

主进程充当监督者，通过 IPC（Unix 域套接字或管道）与 Worker 通信。

## 通信协议

Worker 通过 IPC 通道使用长度前缀的 JSON 协议与监督者通信：

1. **生成** -- 监督者向 Worker 发送会话配置
2. **消息** -- 用户/Agent 消息的双向流
3. **心跳** -- 定期健康检查
4. **关闭** -- 优雅终止信号

## 配置

```toml
[agent.worker]
enabled = false
ipc_socket_dir = "/tmp/prx-workers"
heartbeat_interval_secs = 10
max_restart_attempts = 3
```

## 资源限制

在 Linux 上运行时，会话 Worker 可以应用基于 cgroup 的资源限制：

```toml
[agent.worker.limits]
memory_limit_mb = 256
cpu_shares = 512
```

## 相关页面

- [Agent 运行时](./runtime) -- 架构概览
- [Agent 循环](./loop) -- 核心执行周期
- [安全沙箱](/zh/prx/security/sandbox) -- 沙箱后端
