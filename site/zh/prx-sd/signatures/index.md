---
title: 威胁情报概览
description: PRX-SD 签名数据库架构，涵盖哈希签名、YARA 规则、IOC 数据源和 ClamAV 集成。
---

# 威胁情报概览

PRX-SD 从多个开源和社区来源聚合威胁情报，统一存储到本地数据库中。这种多层次方案确保了广泛的覆盖面 -- 从已知恶意软件哈希到行为模式规则，再到网络失陷指标。

## 签名分类

PRX-SD 将威胁情报分为四大类：

| 分类 | 来源数 | 数量 | 查询速度 | 存储空间 |
|------|--------|------|----------|----------|
| **哈希签名** | 7 个 | 数百万条 SHA-256/MD5 | O(1) LMDB 查找 | 约 500 MB |
| **YARA 规则** | 8 个 | 38,800+ 条规则 | 模式匹配 | 约 15 MB |
| **IOC 数据源** | 5 个 | 585,000+ 个指标 | Trie / 哈希表 | 约 25 MB |
| **ClamAV 数据库** | 1 个 | 11,000,000+ 条签名 | ClamAV 引擎 | 约 300 MB |

### 哈希签名

最快的检测层。扫描时对每个文件计算哈希值，然后与本地 LMDB 数据库中已知的恶意文件哈希进行比对：

- **abuse.ch MalwareBazaar** -- 最近恶意软件样本的 SHA-256 哈希（48 小时滚动窗口）
- **abuse.ch URLhaus** -- 通过恶意 URL 分发的文件的 SHA-256 哈希
- **abuse.ch Feodo Tracker** -- 银行木马的 SHA-256 哈希（Emotet、Dridex、TrickBot）
- **abuse.ch ThreatFox** -- 社区提交的 SHA-256 IOC
- **abuse.ch SSL Blacklist** -- 恶意 SSL 证书的 SHA-1 指纹
- **VirusShare** -- 20,000,000+ 条 MD5 哈希（需使用 `--full` 更新）
- **内置黑名单** -- 硬编码的 EICAR 测试文件、WannaCry、NotPetya、Emotet 等哈希

### YARA 规则

通过代码模式、字符串和结构而非精确哈希来识别恶意软件的模式匹配规则。这能捕获恶意软件的变种和家族：

- **内置规则** -- 64 条精选规则，覆盖勒索软件、木马、后门、Rootkit、挖矿程序、Webshell
- **Yara-Rules/rules** -- 社区维护的规则，覆盖 Emotet、TrickBot、CobaltStrike、Mirai、LockBit
- **Neo23x0/signature-base** -- 高质量规则，覆盖 APT29、Lazarus、加密挖矿、Webshell
- **ReversingLabs YARA** -- 商业级开源规则，覆盖木马、勒索软件、后门
- **ESET IOC** -- APT 追踪规则，覆盖 Turla、Interception 等高级威胁
- **InQuest** -- 恶意文档专项规则（OLE、DDE 漏洞利用）
- **Elastic Security** -- Elastic 威胁研究团队的检测规则
- **Google GCTI** -- Google Cloud Threat Intelligence 的 YARA 规则

### IOC 数据源

用于检测与已知恶意基础设施连接的网络失陷指标：

- **IPsum** -- 聚合恶意 IP 信誉列表（多源评分）
- **FireHOL** -- 按威胁等级分类的精选 IP 黑名单
- **Emerging Threats** -- 从 Suricata/Snort 规则提取的 IP/域名 IOC
- **SANS ISC** -- 互联网风暴中心的每日可疑 IP 数据
- **URLhaus** -- 用于钓鱼和恶意软件分发的活跃恶意 URL

### ClamAV 数据库

可选集成 ClamAV 病毒数据库，提供最大规模的开源签名集：

- **main.cvd** -- 核心病毒签名
- **daily.cvd** -- 每日更新签名
- **bytecode.cvd** -- 字节码检测签名

## 数据目录结构

所有签名数据存储在 `~/.prx-sd/signatures/` 下：

```
~/.prx-sd/signatures/
  hashes/
    malware_bazaar.lmdb       # MalwareBazaar SHA-256
    urlhaus.lmdb              # URLhaus SHA-256
    feodo.lmdb                # Feodo Tracker SHA-256
    threatfox.lmdb            # ThreatFox IOCs
    virusshare.lmdb           # VirusShare MD5（仅 --full 模式）
    custom.lmdb               # 用户导入的哈希
  yara/
    builtin/                  # 内置规则（随二进制文件分发）
    community/                # 下载的社区规则
    custom/                   # 用户自定义规则
    compiled.yarc             # 预编译规则缓存
  ioc/
    ipsum.dat                 # IPsum IP 信誉
    firehol.dat               # FireHOL 黑名单
    et_compromised.dat        # Emerging Threats IP
    sans_isc.dat              # SANS ISC 可疑 IP
    urlhaus_urls.dat          # URLhaus 恶意 URL
  clamav/
    main.cvd                  # ClamAV 核心签名
    daily.cvd                 # ClamAV 每日更新
    bytecode.cvd              # ClamAV 字节码签名
  metadata.json               # 更新时间戳和版本信息
```

::: tip
使用 `sd info` 查看所有签名数据库的当前状态，包括来源数量、最后更新时间和磁盘占用。
:::

## 查询签名状态

```bash
sd info
```

```
PRX-SD Signature Database
  Hash signatures:    1,247,832 entries (7 sources)
  YARA rules:         38,847 rules (8 sources, 64 built-in)
  IOC indicators:     585,221 entries (5 sources)
  ClamAV signatures:  not installed
  Last updated:       2026-03-21 08:00:12 UTC
  Database version:   2026.0321.1
  Disk usage:         542 MB
```

## 后续步骤

- [更新签名](./update) -- 保持数据库为最新状态
- [签名来源](./sources) -- 每个来源的详细信息
- [导入哈希](./import) -- 添加自定义哈希黑名单
- [自定义 YARA 规则](./custom-rules) -- 编写和部署自定义规则
