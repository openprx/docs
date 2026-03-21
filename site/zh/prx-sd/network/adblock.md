---
title: 广告与恶意域名拦截
description: 使用 sd adblock 命令在 DNS 层面拦截广告、追踪器和恶意域名。支持多种过滤列表、自定义规则和持久化日志。
---

# 广告与恶意域名拦截

PRX-SD 内置了广告拦截引擎，通过向系统 hosts 文件（Linux/macOS 为 `/etc/hosts`，Windows 为 `C:\Windows\System32\drivers\etc\hosts`）写入条目，在 DNS 层面拦截广告、追踪器和已知恶意域名。过滤列表存储在 `~/.prx-sd/adblock/` 目录下，同时支持 Adblock Plus (ABP) 语法和 hosts 文件格式。

## 工作原理

启用广告拦截后，PRX-SD 会：

1. 下载已配置的过滤列表（EasyList、abuse.ch URLhaus 等）
2. 解析 ABP 规则（`||domain.com^`）和 hosts 条目（`0.0.0.0 domain.com`）
3. 将所有被拦截的域名写入系统 hosts 文件，指向 `0.0.0.0`
4. 将每个被拦截的域名查询记录到 `~/.prx-sd/adblock/blocked_log.jsonl`

::: tip
如需完整的 DNS 级过滤与上游转发功能，可将广告拦截与 [DNS 代理](./dns-proxy)结合使用。DNS 代理将广告拦截规则、IOC 域名源和自定义黑名单整合在一个解析器中。
:::

## 命令

### 启用防护

下载过滤列表并通过 hosts 文件安装 DNS 拦截。需要 root/管理员权限。

```bash
sudo sd adblock enable
```

输出：

```
>>> Enabling adblock protection...
  Loaded 4 lists (128432 rules)
success: Adblock enabled: 95211 domains blocked via /etc/hosts
  Lists: ["easylist", "easyprivacy", "urlhaus-domains", "malware-domains"]
  Log: /home/user/.prx-sd/adblock/blocked_log.jsonl
```

### 禁用防护

从 hosts 文件中移除所有 PRX-SD 条目。凭据和缓存的列表会被保留。

```bash
sudo sd adblock disable
```

### 同步过滤列表

强制重新下载所有已配置的过滤列表。如果广告拦截当前已启用，hosts 文件会自动使用最新规则更新。

```bash
sudo sd adblock sync
```

### 查看统计信息

显示当前状态、已加载的列表、规则数量和拦截日志大小。

```bash
sd adblock stats
```

输出：

```
Adblock Engine Statistics
  Status:        ENABLED
  Lists loaded:  4
  Total rules:   128432
  Cache dir:     /home/user/.prx-sd/adblock
  Last sync:     2026-03-20T14:30:00Z
  Blocked log:   1842 entries

  - easylist
  - easyprivacy
  - urlhaus-domains
  - malware-domains
```

### 检查 URL 或域名

测试特定 URL 或域名是否被当前过滤列表拦截。

```bash
sd adblock check ads.example.com
sd adblock check https://tracker.analytics.io/pixel.js
```

如果域名未包含协议前缀，PRX-SD 会自动添加 `https://`。

输出：

```
BLOCKED ads.example.com -> Ads
```

或：

```
ALLOWED docs.example.com
```

### 查看拦截日志

显示持久化 JSONL 日志中的最近拦截记录。`--count` 参数控制显示条数（默认：50）。

```bash
sd adblock log
sd adblock log --count 100
```

每条日志包含时间戳、域名、URL、分类和来源。

### 添加自定义过滤列表

通过名称和 URL 添加第三方或自定义过滤列表。`--category` 参数用于分类（默认：`unknown`）。

可用分类：`ads`、`tracking`、`malware`、`social`。

```bash
sd adblock add my-blocklist https://example.com/blocklist.txt --category malware
```

### 移除过滤列表

按名称移除之前添加的过滤列表。

```bash
sd adblock remove my-blocklist
```

## 默认过滤列表

PRX-SD 内置以下过滤源：

| 列表 | 分类 | 说明 |
|------|------|------|
| EasyList | 广告 | 社区维护的广告过滤列表 |
| EasyPrivacy | 追踪 | 追踪器和浏览器指纹防护 |
| URLhaus Domains | 恶意软件 | abuse.ch 恶意 URL 域名 |
| Malware Domains | 恶意软件 | 已知恶意软件分发域名 |

## 过滤列表格式

自定义列表可以使用 Adblock Plus (ABP) 语法或 hosts 文件格式：

**ABP 格式：**

```
||ads.example.com^
||tracker.analytics.io^
```

**Hosts 格式：**

```
0.0.0.0 ads.example.com
127.0.0.1 tracker.analytics.io
```

以 `!`、`#` 或 `[` 开头的行被视为注释并忽略。

## 数据目录结构

```
~/.prx-sd/adblock/
  enabled           # 标志文件（广告拦截启用时存在）
  config.json       # 源列表配置
  blocked_log.jsonl # 持久化拦截日志
  lists/            # 缓存的过滤列表文件
```

::: warning
启用和禁用广告拦截会修改系统 hosts 文件。请始终使用 `sd adblock disable` 来清除条目，而不要手动编辑 hosts 文件。此命令需要 root/管理员权限。
:::

## 使用示例

**完整配置流程：**

```bash
# 使用默认列表启用
sudo sd adblock enable

# 添加自定义恶意软件黑名单
sd adblock add threatfox-domains https://threatfox.abuse.ch/export/hostfile/ --category malware

# 重新同步以下载新列表
sudo sd adblock sync

# 验证已知恶意域名已被拦截
sd adblock check malware-c2.example.com

# 查看统计信息
sd adblock stats

# 查看最近的拦截记录
sd adblock log --count 20
```

**禁用并清理：**

```bash
sudo sd adblock disable
```

## 后续步骤

- 设置 [DNS 代理](./dns-proxy) 以获得完整的 DNS 级过滤与上游转发功能
- 配置 [Webhook 告警](../alerts/) 以在域名被拦截时收到通知
- 查阅 [CLI 参考](../cli/) 获取完整命令列表
