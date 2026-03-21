---
title: YARA 规则
description: PRX-SD 使用 YARA-X 扫描文件，匹配来自 8 个来源的 38,800+ 规则，包括社区仓库、商业级规则集和 64 条内置规则。
---

# YARA 规则

YARA 规则是 PRX-SD 检测流水线中的第二层。哈希匹配用于捕获已知恶意软件的精确副本，而 YARA 规则通过匹配文件内容中的字节序列、字符串和结构条件来检测恶意软件的**家族**、**变种**和**行为模式**。

PRX-SD 内置 38,800+ 条聚合自 8 个来源的 YARA 规则，并使用 **YARA-X** 引擎——YARA 的下一代 Rust 重写版本，提供更优的性能、安全性和兼容性。

## YARA-X 引擎

PRX-SD 使用 [YARA-X](https://github.com/VirusTotal/yara-x) 而非传统的 C 语言 YARA 库。主要优势：

| 特性 | YARA (C) | YARA-X (Rust) |
|------|----------|---------------|
| 语言 | C | Rust（内存安全） |
| 性能 | 良好 | 大规则集快 2-5 倍 |
| 规则兼容性 | 基准 | 完全向后兼容 + 新功能 |
| 线程安全 | 需要谨慎处理 | 设计上安全 |
| 模块支持 | 内置模块 | 模块化、可扩展 |

## 规则来源

PRX-SD 从 8 个来源聚合规则：

| 来源 | 规则数 | 内容 | 平台覆盖 |
|------|--------|------|----------|
| **内置规则** | 64 | 勒索软件、木马、后门、Rootkit、挖矿程序、Webshell | Linux + macOS + Windows |
| **Yara-Rules/rules**（GitHub） | 约 12,400 | Emotet、TrickBot、CobaltStrike、Mirai、LockBit | 跨平台 |
| **Neo23x0/signature-base** | 约 8,200 | APT29、Lazarus、加密挖矿、Webshell、勒索软件 | 跨平台 |
| **ReversingLabs YARA** | 约 9,500 | 木马、勒索软件、后门、黑客工具 | Windows + Linux |
| **ESET IOC** | 约 3,800 | Turla、Interception、高级持续性威胁 | 跨平台 |
| **InQuest** | 约 4,836 | OLE/DDE 恶意文档、宏载荷 | 跨平台 |
| **JPCERT/CC** | 约 500+ | 亚太地区定向攻击威胁 | 跨平台 |
| **自定义/导入** | 可变 | 用户自行提供的规则 | 任意 |

**总计：38,800+ 规则**（去重后）

## 内置规则

64 条内置规则编译在 PRX-SD 二进制文件中，即使没有下载外部规则集也始终可用。它们覆盖最常见的威胁类别：

| 类别 | 规则数 | 示例 |
|------|--------|------|
| 勒索软件 | 12 | WannaCry、LockBit、Conti、REvil、BlackCat、Ryuk |
| 木马 | 10 | Emotet、TrickBot、Dridex、QakBot |
| 后门 | 8 | Cobalt Strike Beacon、Metasploit Meterpreter、反向 Shell |
| Rootkit | 6 | Reptile、Diamorphine、Jynx2（Linux） |
| 加密挖矿 | 6 | XMRig、CGMiner、隐藏挖矿配置 |
| Webshell | 8 | China Chopper、WSO、B374K、PHP/ASP/JSP Shell |
| 远控木马 | 6 | njRAT、DarkComet、AsyncRAT、Quasar |
| 漏洞利用 | 4 | EternalBlue、PrintNightmare、Log4Shell 载荷 |
| 测试签名 | 4 | EICAR 测试文件变体 |

## 规则匹配过程

当文件到达第 2 层时，YARA-X 按以下流程处理：

1. **规则编译** —— 启动时，所有规则被编译为优化的内部表示。此过程仅执行一次并缓存在内存中。
2. **原子提取** —— YARA-X 从规则模式中提取短字节序列（原子）以构建搜索索引，实现快速预过滤。
3. **扫描** —— 文件内容与原子索引进行匹配。只有匹配到原子的规则才会被完整评估。
4. **条件求值** —— 对每个候选规则，评估完整条件（布尔逻辑、字符串计数、文件结构检查）。
5. **结果** —— 收集匹配的规则，文件被标记为 `MALICIOUS` 并在报告中附带规则名称。

### 性能

| 指标 | 数值 |
|------|------|
| 规则编译（38,800 条规则） | 约 2 秒（启动时一次性） |
| 单文件扫描耗时 | 平均约 0.3 毫秒 |
| 内存占用（编译后规则） | 约 150 MB |
| 吞吐量 | 每线程约 3,000 文件/秒 |

## 更新 YARA 规则

规则与哈希签名一起更新：

```bash
# 更新所有（哈希 + YARA 规则）
sd update

# 仅更新 YARA 规则
sd update --source yara
```

更新流程：

1. 从各来源下载规则归档
2. 使用 YARA-X 验证规则语法
3. 按名称和内容哈希去重
4. 编译合并后的规则集
5. 原子化替换当前活跃规则集

::: tip 零停机更新
规则更新是原子化的。新规则集在替换活跃规则集之前会完成编译和验证。如果编译失败（例如社区规则存在语法错误），现有规则集将保持不变。
:::

## 自定义规则

你可以将自己的 YARA 规则放入自定义规则目录，文件扩展名为 `.yar` 或 `.yara`：

```bash
# 默认自定义规则目录
~/.config/prx-sd/rules/
```

自定义规则示例：

```yara
rule custom_webshell_detector {
    meta:
        description = "Detects custom PHP webshell variant"
        author = "Security Team"
        severity = "high"

    strings:
        $eval = "eval(base64_decode(" ascii
        $system = "system($_" ascii
        $exec = "exec($_" ascii

    condition:
        filesize < 100KB and
        ($eval or $system or $exec)
}
```

添加自定义规则后，重新加载规则集：

```bash
sd reload-rules
```

或者重启监控守护进程以自动加载更改。

## 规则目录

| 目录 | 来源 | 更新方式 |
|------|------|----------|
| `~/.local/share/prx-sd/rules/builtin/` | 编译在二进制文件中 | 随版本更新 |
| `~/.local/share/prx-sd/rules/community/` | 从各来源下载 | 通过 `sd update` 更新 |
| `~/.config/prx-sd/rules/` | 用户自定义规则 | 手动管理，不会被覆盖 |

## 验证规则

查看当前加载的规则数量和来源：

```bash
sd info
```

```
YARA Rules
==========
Built-in:        64
Community:       38,736
Custom:          12
Total compiled:  38,812
Rule sources:    8
Last updated:    2026-03-21 10:00:00 UTC
```

列出匹配特定关键词的规则：

```bash
sd rules list --filter "ransomware"
```

## 下一步

- [启发式分析](./heuristics) —— 针对绕过签名的文件的行为检测
- [哈希匹配](./hash-matching) —— 最快的检测层
- [检测引擎概览](./index) —— 所有检测层如何协同工作
- [支持的文件类型](./file-types) —— YARA 规则针对的文件格式
