---
title: 节点配对
description: 如何将 PRX 节点与控制器配对以实现安全的分布式执行。
---

# 节点配对

在节点接收控制器的任务之前，它们必须进行配对。配对通过加密身份验证建立相互信任。

## 配对流程

1. 以配对模式启动节点：`prx node pair`
2. 节点显示配对码（6 位 PIN）
3. 在控制器上发起配对：`prx pair add --address <node-ip>:3121`
4. 按提示输入配对码
5. 双方交换并验证 Ed25519 公钥

## 配置

```toml
[node.pairing]
auto_accept = false
pairing_timeout_secs = 120
max_paired_controllers = 3
```

## 管理节点

```bash
# 在控制器上
prx node list              # 列出配对节点
prx node status <node-id>  # 检查节点状态
prx node unpair <node-id>  # 移除节点配对

# 在节点上
prx node pair              # 进入配对模式
prx node info              # 显示节点身份
```

## 相关页面

- [节点概览](./)
- [通信协议](./protocol)
- [设备配对](/zh/prx/security/pairing)
