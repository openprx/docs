---
title: 沙箱
description: 用于隔离 PRX 工具执行的沙箱后端。
---

# 沙箱

PRX 沙箱为工具执行提供进程和文件系统隔离。当 Agent 调用运行外部命令的工具时，沙箱确保命令在受限环境中运行。

## 沙箱后端

PRX 支持多种沙箱后端：

| 后端 | 平台 | 隔离级别 | 开销 |
|------|------|---------|------|
| **Docker** | Linux, macOS | 完整容器 | 高 |
| **Bubblewrap** | Linux | 命名空间 + seccomp | 低 |
| **Firejail** | Linux | 命名空间 + seccomp | 低 |
| **Landlock** | Linux (5.13+) | 内核 LSM | 极低 |
| **None** | 全平台 | 无隔离 | 无 |

## 配置

```toml
[security.sandbox]
backend = "bubblewrap"

[security.sandbox.docker]
image = "prx-sandbox:latest"
network = "none"
memory_limit = "256m"
cpu_limit = "1.0"

[security.sandbox.bubblewrap]
allow_network = false
writable_paths = ["/tmp"]
readonly_paths = ["/usr", "/lib"]
```

## 工作原理

1. Agent 请求工具调用（例如 shell 命令执行）
2. 策略引擎检查调用是否被允许
3. 沙箱使用配置的后端包装执行
4. 工具以受限的文件系统和网络访问运行
5. 结果被捕获并返回给 Agent

## 相关页面

- [安全概览](./)
- [策略引擎](./policy-engine)
- [会话 Worker](/zh/prx/agent/session-worker)
