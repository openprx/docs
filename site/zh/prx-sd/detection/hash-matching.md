---
title: 哈希匹配
description: PRX-SD 如何使用 LMDB 实现 O(1) 哈希查找，从 abuse.ch、VirusShare 和内置黑名单中匹配 SHA-256 和 MD5 数据库。
---

# 哈希匹配

哈希匹配是 PRX-SD 检测流水线中第一层也是最快的一层。对于每个被扫描的文件，PRX-SD 计算其加密哈希值，并在已知恶意哈希的本地数据库中进行查找。匹配意味着该文件与某个已知恶意软件样本完全一致（逐字节相同）。

## 工作原理

1. **哈希计算** —— PRX-SD 计算文件的 SHA-256 哈希值。对于 VirusShare 查找，还会同时计算 MD5 哈希值。
2. **LMDB 查找** —— 使用内存映射的 B+ 树在 LMDB 数据库中查找哈希值。平均查找时间为 O(1)。
3. **元数据检索** —— 如果匹配命中，返回关联的元数据（来源、恶意软件家族、首次发现日期）。
4. **检测结论** —— 哈希命中立即产生 `MALICIOUS` 结论，跳过剩余的检测层。

### 性能

| 操作 | 耗时 |
|------|------|
| SHA-256 计算（1 KB 文件） | 约 2 微秒 |
| SHA-256 计算（10 MB 文件） | 约 15 毫秒 |
| LMDB 查找 | 约 0.5 微秒 |
| 单文件总耗时（小文件，哈希命中） | 约 3 微秒 |

LMDB 使用内存映射文件，操作系统的页面缓存会将数据库中频繁访问的部分保留在 RAM 中。在内存充足的系统上，查找几乎没有额外开销。

## 支持的哈希类型

| 哈希类型 | 大小 | 用途 |
|----------|------|------|
| **SHA-256** | 256 位（64 个十六进制字符） | 所有查找的主要哈希。abuse.ch 数据源和内置黑名单使用。 |
| **MD5** | 128 位（32 个十六进制字符） | 用于兼容 VirusShare 数据库。仅在存在 VirusShare 数据时计算。 |

::: warning MD5 的局限性
MD5 在密码学上已被破解，容易受到碰撞攻击。PRX-SD 使用 MD5 仅是为了向后兼容 VirusShare 数据库。SHA-256 是所有其他来源的主要哈希。
:::

## 数据来源

PRX-SD 从多个威胁情报源聚合哈希签名：

| 来源 | 哈希类型 | 免费 | 内容 | 更新频率 |
|------|----------|------|------|----------|
| abuse.ch MalwareBazaar | SHA-256 | 是 | 最近 48 小时恶意软件样本 | 每 5 分钟 |
| abuse.ch URLhaus | SHA-256 | 是 | 恶意 URL 关联的恶意软件文件 | 每小时 |
| abuse.ch Feodo Tracker | SHA-256 | 是 | 银行木马（Emotet、Dridex、TrickBot） | 每 5 分钟 |
| abuse.ch ThreatFox | SHA-256 | 是 | 社区 IOC 共享平台 | 每小时 |
| VirusShare | MD5 | 是 | 20M+ 恶意软件哈希（历史） | 定期 |
| 内置黑名单 | SHA-256 | 内置 | EICAR、WannaCry、NotPetya、Emotet 等 | 随版本发布 |

### 总哈希覆盖

| 更新模式 | 哈希数量 | 数据库大小 |
|----------|----------|------------|
| 标准更新（`sd update`） | 约 28,000 SHA-256 | 约 5 MB |
| 完整更新（`sd update --full`） | 约 28,000 SHA-256 + 20M+ MD5 | 约 800 MB |

## 更新哈希数据库

### 标准更新

从所有 abuse.ch 数据源获取最新的 SHA-256 哈希：

```bash
sd update
```

这在 PRX-SD 首次安装时会自动执行，也可以通过 cron 或 `sd service` 进行定期更新。

### 完整更新

包含完整的 VirusShare MD5 数据库：

```bash
sd update --full
```

::: tip 何时使用完整模式
VirusShare 数据库包含 20M+ 追溯多年的历史 MD5 哈希。它适用于取证调查和全面扫描，但会增加约 800 MB 的数据库大小。日常防护使用标准更新即可。
:::

### 手动导入哈希

从文本文件导入自定义哈希列表（每行一个哈希）：

```bash
sd import my_hashes.txt
```

导入命令会根据字符串长度自动检测哈希类型（SHA-256 或 MD5）。你也可以指定元数据：

```bash
sd import my_hashes.txt --source "internal-ir" --family "custom-trojan"
```

## LMDB 数据库

PRX-SD 使用 [LMDB](http://www.lmdb.tech/doc/)（Lightning Memory-Mapped Database）存储哈希，选择它是因为其优秀的特性：

| 特性 | 优势 |
|------|------|
| 内存映射 I/O | 零拷贝读取，无序列化开销 |
| B+ 树结构 | O(1) 摊销查找 |
| ACID 事务 | 更新期间安全的并发读取 |
| 抗崩溃 | 写时复制防止数据损坏 |
| 紧凑存储 | 哈希键的高效存储 |

数据库默认存储在 `~/.local/share/prx-sd/signatures.lmdb`。路径可以自定义：

```toml
# ~/.config/prx-sd/config.toml
[database]
path = "/opt/prx-sd/signatures.lmdb"
```

## 查看数据库状态

查看当前哈希数据库的统计信息：

```bash
sd info
```

```
PRX-SD Signature Database
=========================
SHA-256 hashes:  28,428
MD5 hashes:      0 (run 'sd update --full' for VirusShare)
YARA rules:      38,800
Database path:   /home/user/.local/share/prx-sd/signatures.lmdb
Database size:   4.8 MB
Last updated:    2026-03-21 10:00:00 UTC
```

## 哈希匹配在流水线中的定位

哈希匹配被设计为第一道防线，原因如下：

- **速度** —— 每文件约 3 微秒，开销几乎可以忽略。100 万个干净文件可以在 3 秒内完成检查。
- **零误报** —— SHA-256 匹配是密码学保证，文件与已知恶意软件样本完全一致。
- **短路机制** —— 哈希命中时完全跳过 YARA 和启发式分析，节省大量处理时间。

哈希匹配的局限在于它只能检测已知样本的**精确副本**。修改哪怕一个字节都会产生不同的哈希值，从而绕过这一层。这就是为什么 YARA 和启发式层作为后续防线存在的原因。

## 下一步

- [YARA 规则](./yara-rules) —— 基于模式的检测，覆盖变种和家族
- [启发式分析](./heuristics) —— 针对未知威胁的行为检测
- [检测引擎概览](./index) —— 所有检测层如何协同工作
- [文件与目录扫描](../scanning/file-scan) —— 在实践中使用哈希匹配
