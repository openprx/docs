---
title: 安全
description: PRX 安全模型概览，涵盖策略引擎、沙箱、密钥管理和威胁模型。
---

# 安全

安全是 PRX 的基础关注点。作为自主 Agent 框架，PRX 必须仔细控制 Agent 可以执行的操作、访问的数据以及与外部系统的交互方式。

## 安全层

PRX 通过多个安全层实现纵深防御：

| 层级 | 组件 | 用途 |
|------|------|------|
| 策略 | [策略引擎](./policy-engine) | 工具访问和数据流的声明式规则 |
| 隔离 | [沙箱](./sandbox) | 工具执行的进程/容器隔离 |
| 认证 | [设备配对](./pairing) | 设备配对和身份验证 |
| 密钥 | [密钥管理](./secrets) | API 密钥和凭证的安全存储 |

## 配置

```toml
[security]
sandbox_backend = "bubblewrap"  # "docker" | "firejail" | "bubblewrap" | "landlock" | "none"
require_tool_approval = true
max_tool_calls_per_turn = 10

[security.policy]
default_action = "deny"
```

## 威胁模型

PRX 的[威胁模型](./threat-model)将对抗性输入、提示注入、工具滥用和数据泄露视为主要威胁向量。

## 相关页面

- [策略引擎](./policy-engine)
- [设备配对](./pairing)
- [沙箱](./sandbox)
- [密钥管理](./secrets)
- [威胁模型](./threat-model)
