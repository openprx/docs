---
title: 签名来源
description: PRX-SD 集成的每个威胁情报来源的详细信息，包括更新频率和覆盖范围。
---

# 签名来源

PRX-SD 从超过 20 个开源和社区来源聚合威胁情报。本页提供每个来源的详细信息，包括覆盖范围、更新频率和数据类型。

## abuse.ch 来源

abuse.ch 项目提供多个高质量、免费可用的威胁数据源：

| 来源 | 数据类型 | 内容 | 更新频率 | 许可证 |
|------|----------|------|----------|--------|
| **MalwareBazaar** | SHA-256 | 全球研究人员提交的恶意软件样本，48 小时滚动窗口。 | 每 5 分钟 | CC0 |
| **URLhaus** | SHA-256 | 通过分发恶意软件的 URL 关联的文件哈希，覆盖驱动下载、钓鱼载荷和漏洞利用工具包。 | 每小时 | CC0 |
| **Feodo Tracker** | SHA-256 | 银行木马和加载器：Emotet、Dridex、TrickBot、QakBot、BazarLoader、IcedID。 | 每 5 分钟 | CC0 |
| **ThreatFox** | SHA-256 | 社区提交的 IOC，覆盖多个恶意软件家族，包含文件哈希、域名和 IP。 | 每小时 | CC0 |
| **SSL Blacklist** | SHA-1（证书） | 僵尸网络 C2 服务器使用的 SSL 证书 SHA-1 指纹，用于网络 IOC 匹配。 | 每天 | CC0 |

::: tip
所有 abuse.ch 数据源无需注册或 API 密钥即可使用。PRX-SD 直接从公开 API 端点下载。
:::

## VirusShare

| 字段 | 详情 |
|------|------|
| **数据类型** | MD5 哈希 |
| **数量** | 20,000,000+ |
| **内容** | 最大的公开恶意软件哈希仓库之一。包含按编号列表文件组织的 MD5 哈希（VirusShare_00000.md5 到 VirusShare_00500+.md5）。 |
| **更新频率** | 定期添加新的列表文件 |
| **访问** | 免费（因下载量大需使用 `--full` 参数） |
| **许可证** | 非商业用途免费 |

::: warning
VirusShare 完整下载约 500 MB，导入需要较长时间。使用 `sd update --full` 包含该数据源，或使用 `sd update` 进行不含 VirusShare 的标准更新。
:::

## YARA 规则来源

| 来源 | 规则数量 | 关注领域 | 质量 |
|------|----------|----------|------|
| **内置规则** | 64 | 勒索软件、木马、后门、Rootkit、挖矿程序、Webshell，覆盖 Linux、macOS、Windows | PRX-SD 团队精选 |
| **Yara-Rules/rules** | 社区维护 | Emotet、TrickBot、CobaltStrike、Mirai、LockBit、APT | 社区维护 |
| **Neo23x0/signature-base** | 大量规则 | APT29、Lazarus Group、加密挖矿、Webshell、勒索软件家族 | 高质量，Florian Roth 维护 |
| **ReversingLabs YARA** | 商业级 | 木马、勒索软件、后门、黑客工具、漏洞利用 | 专业级，开源 |
| **Elastic Security** | 持续增长 | 覆盖 Windows、Linux、macOS 威胁的端点检测规则 | Elastic 威胁研究团队 |
| **Google GCTI** | 精选 | Google Cloud Threat Intelligence 的高置信度规则 | 极高质量 |
| **ESET IOC** | 精选 | APT 追踪：Turla、Interception、InvisiMole 等高级威胁 | APT 专项 |
| **InQuest** | 专项 | 恶意文档：OLE 漏洞利用、DDE 注入、宏恶意软件 | 文档专项 |

### YARA 规则分类

合并后的规则集覆盖以下恶意软件分类：

| 分类 | 示例家族 | 平台覆盖 |
|------|----------|----------|
| 勒索软件 | WannaCry、LockBit、Conti、REvil、Akira、BlackCat | Windows、Linux |
| 木马 | Emotet、TrickBot、QakBot、Agent Tesla、RedLine | Windows |
| 后门 | CobaltStrike、Metasploit、ShadowPad、PlugX | 跨平台 |
| Rootkit | Reptile、Diamorphine、Horse Pill | Linux |
| 挖矿程序 | XMRig、CCMiner 变种 | 跨平台 |
| Webshell | China Chopper、WSO、b374k、c99、r57 | 跨平台 |
| APT | APT29、Lazarus、Turla、Sandworm、OceanLotus | 跨平台 |
| 漏洞利用 | EternalBlue、PrintNightmare、Log4Shell 载荷 | 跨平台 |
| 黑客工具 | Mimikatz、Rubeus、BloodHound、Impacket | Windows |
| 文档类 | 恶意 Office 宏、PDF 漏洞利用、RTF 漏洞利用 | 跨平台 |

## IOC 数据源

| 来源 | 指标类型 | 数量 | 内容 | 更新频率 |
|------|----------|------|------|----------|
| **IPsum** | IP 地址 | 150,000+ | 聚合自 50+ 个黑名单的恶意 IP 信誉列表，多级评分（根据引用列表数量分为 1-8 级）。 | 每天 |
| **FireHOL** | IP 地址 | 200,000+ | 按威胁等级（level1 到 level4）分类的精选 IP 黑名单，级别越高准入标准越严格。 | 每 6 小时 |
| **Emerging Threats** | IP 地址 | 100,000+ | 从 Suricata 和 Snort IDS 规则中提取的 IP，覆盖僵尸网络 C2、扫描、暴力破解、漏洞利用。 | 每天 |
| **SANS ISC** | IP 地址 | 50,000+ | 来自互联网风暴中心 DShield 传感器网络的可疑 IP。 | 每天 |
| **URLhaus (URLs)** | URL | 85,000+ | 用于恶意软件分发、钓鱼和漏洞利用投递的活跃恶意 URL。 | 每小时 |

## ClamAV 数据库

| 字段 | 详情 |
|------|------|
| **数据类型** | 多格式签名（哈希、字节码、正则、逻辑） |
| **数量** | 11,000,000+ 条签名 |
| **文件** | `main.cvd`（核心）、`daily.cvd`（每日更新）、`bytecode.cvd`（字节码规则） |
| **内容** | 最大的开源病毒签名数据库，覆盖病毒、木马、蠕虫、钓鱼、PUA。 |
| **更新频率** | 每天多次 |
| **访问** | 通过 freshclam 或直接下载免费获取 |

启用 ClamAV 集成：

```bash
# 导入 ClamAV 数据库
sd import-clamav /var/lib/clamav/main.cvd
sd import-clamav /var/lib/clamav/daily.cvd
```

详见[导入哈希](./import)中的 ClamAV 导入说明。

## 来源配置

在 `config.toml` 中启用或禁用各个来源：

```toml
[signatures.sources]
malware_bazaar = true
urlhaus = true
feodo_tracker = true
threatfox = true
ssl_blacklist = true
virusshare = false          # 使用 sd update --full 启用
builtin_rules = true
yara_community = true
neo23x0 = true
reversinglabs = true
elastic = true
gcti = true
eset = true
inquest = true
ipsum = true
firehol = true
emerging_threats = true
sans_isc = true
clamav = false              # 导入 ClamAV 数据库后启用
```

## 后续步骤

- [更新签名](./update) -- 下载和更新所有来源
- [导入哈希](./import) -- 添加自定义哈希和 ClamAV 数据库
- [自定义 YARA 规则](./custom-rules) -- 编写自定义检测规则
- [威胁情报概览](./index) -- 架构和数据目录布局
