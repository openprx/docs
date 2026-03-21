---
title: 自定义 YARA 规则
description: 为 PRX-SD 编写、测试和部署自定义 YARA 规则，检测针对特定环境的威胁。
---

# 自定义 YARA 规则

YARA 是一种专为恶意软件检测设计的模式匹配语言。PRX-SD 支持在内置规则和社区规则之外加载自定义 YARA 规则，让你可以针对特定的威胁场景创建检测逻辑。

## 规则文件位置

将自定义 YARA 规则放在 `~/.prx-sd/yara/` 目录下：

```
~/.prx-sd/yara/
  custom_ransomware.yar
  internal_threats.yar
  compliance_checks.yar
```

PRX-SD 在启动和签名更新时会加载该目录下所有 `.yar` 和 `.yara` 文件。规则会被编译为优化缓存（`compiled.yarc`）以提高扫描速度。

::: tip
支持子目录。可按类别组织规则以便于管理：
```
~/.prx-sd/yara/
  ransomware/
    lockbit_variant.yar
    custom_encryptor.yar
  webshells/
    internal_webshell.yar
  compliance/
    pii_detection.yar
```
:::

## YARA 规则语法

一条 YARA 规则由三个部分组成：**meta**（元信息）、**strings**（字符串）和 **condition**（条件）。

### 基本规则结构

```yara
rule Detect_CustomMalware : trojan
{
    meta:
        author = "Security Team"
        description = "Detects custom trojan used in targeted attack"
        severity = "high"
        date = "2026-03-21"
        reference = "https://internal.wiki/incident-2026-042"

    strings:
        $magic = { 4D 5A 90 00 }              // PE 头部（十六进制字节）
        $str1 = "cmd.exe /c" ascii nocase      // ASCII 字符串，不区分大小写
        $str2 = "powershell -enc" ascii nocase
        $str3 = "C:\\Users\\Public\\payload" wide  // UTF-16 字符串
        $mutex = "Global\\CustomMutex_12345"
        $regex = /https?:\/\/[a-z0-9]{8,12}\.onion/ // 正则表达式模式

    condition:
        $magic at 0 and
        (2 of ($str*)) and
        ($mutex or $regex)
}
```

### 关键语法元素

| 元素 | 语法 | 说明 |
|------|------|------|
| 十六进制字符串 | `{ 4D 5A ?? 00 }` | 带通配符（`??`）的字节模式 |
| 文本字符串 | `"text" ascii` | 纯 ASCII 字符串 |
| 宽字符字符串 | `"text" wide` | UTF-16LE 编码字符串 |
| 不区分大小写 | `"text" nocase` | 匹配时忽略大小写 |
| 正则表达式 | `/pattern/` | 正则表达式模式 |
| 标签 | `rule Name : tag1 tag2` | 分类标签 |
| 文件大小 | `filesize < 1MB` | 基于文件大小的条件 |
| 入口点 | `entrypoint` | PE/ELF 入口点偏移 |
| 指定偏移 | `$str at 0x100` | 字符串在指定偏移处 |
| 范围内 | `$str in (0..1024)` | 字符串在字节范围内 |
| 计数 | `#str > 3` | 字符串出现次数 |

### 严重级别

PRX-SD 读取 `severity` 元字段来确定威胁分类：

| 严重级别 | PRX-SD 判定 |
|----------|-------------|
| `critical` | MALICIOUS |
| `high` | MALICIOUS |
| `medium` | SUSPICIOUS |
| `low` | SUSPICIOUS |
| （未设置） | SUSPICIOUS |

## 规则示例

### 检测可疑脚本

```yara
rule Suspicious_PowerShell_Download : script
{
    meta:
        author = "Security Team"
        description = "PowerShell script downloading and executing remote content"
        severity = "high"

    strings:
        $dl1 = "Invoke-WebRequest" ascii nocase
        $dl2 = "Net.WebClient" ascii nocase
        $dl3 = "DownloadString" ascii nocase
        $dl4 = "DownloadFile" ascii nocase
        $exec1 = "Invoke-Expression" ascii nocase
        $exec2 = "iex(" ascii nocase
        $exec3 = "Start-Process" ascii nocase
        $enc = "-EncodedCommand" ascii nocase
        $bypass = "-ExecutionPolicy Bypass" ascii nocase

    condition:
        filesize < 5MB and
        (any of ($dl*)) and
        (any of ($exec*) or $enc or $bypass)
}
```

### 检测加密货币挖矿程序

```yara
rule Crypto_Miner_Strings : miner
{
    meta:
        author = "Security Team"
        description = "Detects cryptocurrency mining software"
        severity = "medium"

    strings:
        $pool1 = "stratum+tcp://" ascii
        $pool2 = "stratum+ssl://" ascii
        $pool3 = "pool.minexmr.com" ascii
        $pool4 = "xmrpool.eu" ascii
        $algo1 = "cryptonight" ascii nocase
        $algo2 = "randomx" ascii nocase
        $algo3 = "ethash" ascii nocase
        $wallet = /[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93}/ ascii  // Monero 地址

    condition:
        (any of ($pool*)) or
        ((any of ($algo*)) and $wallet)
}
```

### 检测 Webshell

```yara
rule PHP_Webshell_Generic : webshell
{
    meta:
        author = "Security Team"
        description = "Generic PHP webshell detection"
        severity = "critical"

    strings:
        $php = "<?php" ascii nocase
        $eval1 = "eval(" ascii nocase
        $eval2 = "assert(" ascii nocase
        $eval3 = "preg_replace" ascii nocase
        $input1 = "$_GET[" ascii
        $input2 = "$_POST[" ascii
        $input3 = "$_REQUEST[" ascii
        $input4 = "$_COOKIE[" ascii
        $cmd1 = "system(" ascii nocase
        $cmd2 = "passthru(" ascii nocase
        $cmd3 = "shell_exec(" ascii nocase
        $cmd4 = "exec(" ascii nocase
        $obf1 = "base64_decode" ascii nocase
        $obf2 = "str_rot13" ascii nocase
        $obf3 = "gzinflate" ascii nocase

    condition:
        $php and
        (any of ($eval*)) and
        (any of ($input*)) and
        (any of ($cmd*) or any of ($obf*))
}
```

## 测试规则

部署前验证你的规则：

```bash
# 编译检查规则文件（语法验证）
sd yara validate ~/.prx-sd/yara/custom_ransomware.yar

# 对指定文件测试规则
sd yara test ~/.prx-sd/yara/custom_ransomware.yar /path/to/sample

# 对样本目录测试所有自定义规则
sd yara test ~/.prx-sd/yara/ /path/to/samples/ --recursive

# 仅使用自定义规则进行试扫描
sd scan --yara-only --yara-path ~/.prx-sd/yara/ /path/to/test
```

::: warning
在部署到生产监控之前，务必使用一组已知的干净文件测试新规则，以检查是否存在误报。
:::

## 重新加载规则

添加或修改规则后，无需重启守护进程即可重新加载：

```bash
# 重新编译并加载规则
sd yara reload

# 如果以守护进程方式运行，发送 SIGHUP
kill -HUP $(cat ~/.prx-sd/sd.pid)
```

## 贡献规则

与 PRX-SD 社区分享你的规则：

1. Fork [prx-sd-signatures](https://github.com/OpenPRX/prx-sd-signatures) 仓库
2. 将规则添加到对应的分类目录下
3. 包含完整的 `meta` 字段（author、description、severity、reference）
4. 使用恶意样本和干净文件进行测试
5. 提交 Pull Request 并附上用于验证的样本哈希

## 后续步骤

- [签名来源](./sources) -- 社区和第三方 YARA 规则来源
- [导入哈希](./import) -- 添加基于哈希的黑名单
- [更新签名](./update) -- 保持所有规则为最新状态
- [威胁情报概览](./index) -- 完整的签名架构
