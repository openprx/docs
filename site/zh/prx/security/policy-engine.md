---
title: 策略引擎
description: 用于控制 Agent 工具访问和数据流的声明式安全策略引擎。
---

# 策略引擎

策略引擎是一个声明式规则系统，控制 Agent 可以使用的工具、访问的文件和发起的网络请求。策略在每次工具调用前进行评估。

## 概述

策略定义为带条件和动作的规则：

- **允许规则** -- 显式允许特定操作
- **拒绝规则** -- 显式阻止特定操作
- **默认动作** -- 无规则匹配时应用（默认拒绝）

## 策略格式

```toml
[security.policy]
default_action = "deny"

[[security.policy.rules]]
name = "allow-read-workspace"
action = "allow"
tools = ["fs_read"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "block-sensitive-dirs"
action = "deny"
tools = ["fs_read", "fs_write"]
paths = ["/etc/**", "/root/**", "**/.ssh/**"]

[[security.policy.rules]]
name = "allow-http-approved-domains"
action = "allow"
tools = ["http_request"]
domains = ["api.github.com", "api.openai.com"]
```

## 规则评估

规则按顺序评估。第一个匹配的规则决定动作。如果没有规则匹配，则应用默认动作。

## 内置策略

PRX 附带合理的默认策略：

- 阻止访问系统目录和敏感文件
- 破坏性操作需要显式批准
- 对网络请求进行速率限制
- 记录所有工具执行以供审计

## 相关页面

- [安全概览](./)
- [沙箱](./sandbox)
- [威胁模型](./threat-model)
