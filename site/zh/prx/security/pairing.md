---
title: 设备配对
description: PRX Agent 认证的设备配对和身份验证。
---

# 设备配对

PRX 使用设备配对模型来认证 Agent 实例并在节点之间建立信任。配对确保只有授权设备可以连接和控制 Agent。

## 概述

配对流程：

1. 生成唯一的设备身份（Ed25519 密钥对）
2. 在控制器和 Agent 之间交换公钥
3. 通过挑战-响应协议验证身份
4. 建立加密通信通道

## 配对流程

```
控制器                        Agent
    │                           │
    │──── 配对请求 ────────────►│
    │                           │
    │◄─── 挑战 ────────────────│
    │                           │
    │──── 签名响应 ────────────►│
    │                           │
    │◄─── 配对确认 ────────────│
```

## 配置

```toml
[security.pairing]
require_pairing = true
max_paired_devices = 5
challenge_timeout_secs = 30
```

## 管理配对设备

```bash
prx pair list          # 列出配对设备
prx pair add           # 开始配对流程
prx pair remove <id>   # 移除配对设备
prx pair revoke-all    # 撤销所有配对
```

## 相关页面

- [安全概览](./)
- [节点](/zh/prx/nodes/)
- [密钥管理](./secrets)
