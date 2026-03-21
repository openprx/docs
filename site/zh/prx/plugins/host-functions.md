---
title: 宿主函数
description: PRX WASM 插件可用的宿主函数参考。
---

# 宿主函数

宿主函数是 PRX 向 WASM 插件暴露的 API 接口。它们提供对 HTTP 请求、文件操作和 Agent 状态等宿主能力的受控访问。

## 可用宿主函数

### HTTP

| 函数 | 描述 | 权限 |
|------|------|------|
| `http_request(method, url, headers, body)` | 发起 HTTP 请求 | `net.http` |
| `http_get(url)` | GET 请求简写 | `net.http` |
| `http_post(url, body)` | POST 请求简写 | `net.http` |

### 文件系统

| 函数 | 描述 | 权限 |
|------|------|------|
| `fs_read(path)` | 读取文件 | `fs.read` |
| `fs_write(path, data)` | 写入文件 | `fs.write` |
| `fs_list(path)` | 列出目录内容 | `fs.read` |

### Agent 状态

| 函数 | 描述 | 权限 |
|------|------|------|
| `memory_get(key)` | 从 Agent 记忆读取 | `agent.memory.read` |
| `memory_set(key, value)` | 写入 Agent 记忆 | `agent.memory.write` |
| `config_get(key)` | 读取插件配置 | `agent.config` |

### 日志

| 函数 | 描述 | 权限 |
|------|------|------|
| `log_info(msg)` | Info 级别日志 | 始终允许 |
| `log_warn(msg)` | Warn 级别日志 | 始终允许 |
| `log_error(msg)` | Error 级别日志 | 始终允许 |

## 权限清单

每个插件在其清单中声明所需的权限：

```toml
[permissions]
net.http = ["api.example.com"]
fs.read = ["/data/*"]
agent.memory.read = true
```

## 相关页面

- [插件架构](./architecture)
- [PDK 参考](./pdk)
- [安全沙箱](/zh/prx/security/sandbox)
