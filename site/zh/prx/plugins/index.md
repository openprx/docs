---
title: 插件系统
description: PRX 基于 WASM 的插件系统概览，用于扩展 Agent 能力。
---

# 插件系统

PRX 支持基于 WebAssembly (WASM) 的插件系统，允许在不修改核心代码的情况下扩展 Agent 能力。插件在沙箱化的 WASM 运行时中运行，对宿主函数有受控的访问权限。

## 概述

插件系统提供：

- **沙箱执行** -- 插件在内存隔离的 WASM 中运行
- **宿主函数 API** -- 对 HTTP、文件系统和 Agent 状态的受控访问
- **热重载** -- 无需重启守护进程即可加载和卸载插件
- **多语言支持** -- 使用 Rust、Go、C 或任何可编译为 WASM 的语言编写插件

## 插件类型

| 类型 | 描述 | 示例 |
|------|------|------|
| **工具插件** | 为 Agent 添加新工具 | 自定义 API 集成 |
| **渠道插件** | 添加新的消息渠道 | 自定义聊天平台 |
| **过滤器插件** | 消息的前/后处理 | 内容审核 |
| **提供商插件** | 添加新的 LLM 提供商 | 自定义模型端点 |

## 快速开始

```bash
# 从 URL 安装插件
prx plugin install https://example.com/my-plugin.wasm

# 列出已安装的插件
prx plugin list

# 启用/禁用插件
prx plugin enable my-plugin
prx plugin disable my-plugin
```

## 配置

```toml
[plugins]
enabled = true
directory = "~/.local/share/openprx/plugins"
max_memory_mb = 64
max_execution_time_ms = 5000

[[plugins.registry]]
name = "my-plugin"
path = "~/.local/share/openprx/plugins/my-plugin.wasm"
enabled = true
```

## 相关页面

- [架构](./architecture)
- [开发者指南](./developer-guide)
- [宿主函数](./host-functions)
- [PDK（插件开发工具包）](./pdk)
- [示例](./examples)
