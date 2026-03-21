---
title: 内置规则
description: PRX-WAF 内置 398 条 YAML 规则，覆盖 OWASP CRS、ModSecurity 社区规则和针对性 CVE 虚拟补丁。完整清单和分类详情。
---

# 内置规则

PRX-WAF 内置 398 条预构建规则，分为三个类别，另有 10+ 个编译到二进制中的检测器。它们共同提供了对 OWASP Top 10 和已知 CVE 漏洞利用的全面覆盖。

## OWASP Core Rule Set（310 条规则）

OWASP CRS 规则从 [OWASP ModSecurity Core Rule Set v4](https://github.com/coreruleset/coreruleset) 转换为 PRX-WAF 的原生 YAML 格式，覆盖最常见的 Web 攻击向量：

| 文件 | CRS ID | 规则数 | 类别 |
|------|--------|--------|------|
| `sqli.yaml` | 942xxx | ~87 | SQL 注入 |
| `xss.yaml` | 941xxx | ~41 | 跨站脚本 |
| `rce.yaml` | 932xxx | ~30 | 远程代码执行 |
| `lfi.yaml` | 930xxx | ~20 | 本地文件包含 |
| `rfi.yaml` | 931xxx | ~12 | 远程文件包含 |
| `php-injection.yaml` | 933xxx | ~18 | PHP 注入 |
| `java-injection.yaml` | 944xxx | ~15 | Java / 表达式语言注入 |
| `generic-attack.yaml` | 934xxx | ~12 | Node.js、SSI、HTTP 拆分 |
| `scanner-detection.yaml` | 913xxx | ~10 | 安全扫描器 UA 检测 |
| `protocol-enforcement.yaml` | 920xxx | ~15 | HTTP 协议合规性 |
| `protocol-attack.yaml` | 921xxx | ~10 | 请求走私、CRLF 注入 |
| `multipart-attack.yaml` | 922xxx | ~8 | Multipart 绕过 |
| `method-enforcement.yaml` | 911xxx | ~5 | HTTP 方法白名单 |
| `session-fixation.yaml` | 943xxx | ~6 | 会话固定 |
| `web-shells.yaml` | 955xxx | ~8 | WebShell 检测 |
| `response-*.yaml` | 950-956xxx | ~13 | 响应检查 |

### 词表数据文件

OWASP CRS 规则使用短语匹配（`pm_from_file`）对 `rules/owasp-crs/data/` 中的 20+ 个词表文件进行匹配：

- `scanners-user-agents.data` —— 已知扫描器 User-Agent 字符串
- `lfi-os-files.data` —— 敏感的操作系统文件路径
- `sql-errors.data` —— 数据库错误消息模式
- 以及更多

## ModSecurity 社区规则（46 条规则）

手工编写的规则，覆盖 OWASP CRS 未完全覆盖的威胁类别：

| 文件 | 规则数 | 类别 |
|------|--------|------|
| `ip-reputation.yaml` | ~15 | Bot/扫描器/代理 IP 检测 |
| `dos-protection.yaml` | ~12 | DoS 和异常请求模式 |
| `data-leakage.yaml` | ~10 | PII 和凭据泄露检测 |
| `response-checks.yaml` | ~9 | 响应体检查 |

## CVE 虚拟补丁（39 条规则）

针对高知名度 CVE 的检测规则。这些充当虚拟补丁，在漏洞利用到达应用之前将其拦截：

| 文件 | CVE 编号 | 说明 |
|------|----------|------|
| `2021-log4shell.yaml` | CVE-2021-44228, CVE-2021-45046 | Apache Log4j JNDI 查找 RCE |
| `2022-spring4shell.yaml` | CVE-2022-22965, CVE-2022-22963 | Spring Framework RCE |
| `2022-text4shell.yaml` | CVE-2022-42889 | Apache Commons Text RCE |
| `2023-moveit.yaml` | CVE-2023-34362, CVE-2023-36934 | MOVEit Transfer SQL 注入 |
| `2024-xz-backdoor.yaml` | CVE-2024-3094 | XZ Utils 后门检测 |
| `2024-recent.yaml` | 多个 | 2024 年高知名度 CVE |
| `2025-recent.yaml` | 多个 | 2025 年高知名度 CVE |

::: tip
CVE 补丁规则默认设置为偏执级别 1，这意味着它们在所有配置中都是激活的。由于它们针对特定的漏洞利用载荷，误报率极低。
:::

## 内置检测器

除 YAML 规则外，PRX-WAF 还包含编译到二进制中的检测器，运行在检测流水线的专用阶段中：

| 阶段 | 检测器 | 说明 |
|------|--------|------|
| 1-4 | IP 黑白名单 | 基于 CIDR 的 IP 过滤 |
| 5 | CC/DDoS 限速器 | 基于滑动窗口的 IP 限速 |
| 6 | 扫描器检测 | 漏洞扫描器指纹（Nmap、Nikto 等） |
| 7 | Bot 检测 | 恶意 Bot、AI 爬虫、无头浏览器 |
| 8 | SQL 注入 | libinjection + 正则模式 |
| 9 | XSS | libinjection + 正则模式 |
| 10 | RCE / 命令注入 | OS 命令注入模式 |
| 11 | 目录遍历 | 路径遍历（`../`）检测 |
| 14 | 敏感数据 | Aho-Corasick 多模式 PII/凭据检测 |
| 15 | 防盗链 | 基于 Referer 的每主机验证 |
| 16 | CrowdSec | Bouncer 决策 + AppSec 检查 |

## 更新规则

可使用自带工具从上游源同步规则：

```bash
# 检查更新
python rules/tools/sync.py --check

# 同步 OWASP CRS 到特定版本
python rules/tools/sync.py --source owasp-crs --output rules/owasp-crs/ --tag v4.10.0

# 同步到最新版
python rules/tools/sync.py --source owasp-crs --output rules/owasp-crs/

# 更新后热重载
prx-waf rules reload
```

## 规则统计

通过 CLI 查看当前规则统计：

```bash
prx-waf rules stats
```

示例输出：

```
Rule Statistics
===============
  OWASP CRS:    310 rules (21 files)
  ModSecurity:   46 rules (4 files)
  CVE Patches:   39 rules (7 files)
  Custom:         3 rules (1 file)
  ─────────────────────────
  Total:        398 rules (33 files)

  Enabled:      395
  Disabled:       3
  Paranoia 1:   280
  Paranoia 2:    78
  Paranoia 3:    30
  Paranoia 4:    10
```

## 下一步

- [自定义规则](./custom-rules) —— 编写自定义规则
- [YAML 语法](./yaml-syntax) —— 完整规则模式参考
- [规则引擎概述](./index) —— 流水线如何评估规则
