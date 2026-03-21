---
title: 启发式分析
description: PRX-SD 启发式引擎对 PE、ELF、Mach-O、Office 和 PDF 文件执行文件类型感知的行为分析，以检测未知威胁。
---

# 启发式分析

启发式分析是 PRX-SD 检测流水线中的第三层。哈希匹配和 YARA 规则依赖于已知签名和模式，而启发式分析通过分析文件的**结构和行为属性**来检测前所未见的威胁——包括零日恶意软件、定制植入物和高度混淆的样本。

## 工作原理

PRX-SD 首先通过魔数检测识别文件类型，然后针对该文件格式执行一组专用的启发式检查。每个触发的检查会向累计评分中添加分值，最终评分决定检测结论。

### 评分机制

| 评分范围 | 结论 | 含义 |
|----------|------|------|
| 0 - 29 | **Clean** | 未发现显著的可疑指标 |
| 30 - 59 | **Suspicious** | 检测到某些异常；建议人工复查 |
| 60 - 100 | **Malicious** | 高置信度威胁；存在多个强指标 |

评分是累加的。仅有一个轻微异常（如稍高的熵值）的文件可能得分 15，而同时具有高熵值、可疑 API 导入和加壳特征的文件则可能得分 75+。

## PE（Windows 可执行文件）分析

PE 启发式针对 Windows 可执行文件（.exe、.dll、.scr、.sys）：

| 检查项 | 分值 | 说明 |
|--------|------|------|
| 高节熵值 | 10-25 | 熵值 > 7.0 的节表明存在加壳或加密 |
| 可疑 API 导入 | 5-20 | `VirtualAllocEx`、`WriteProcessMemory`、`CreateRemoteThread` 等 API |
| 已知加壳器签名 | 15-25 | 检测到 UPX、Themida、VMProtect、ASPack、PECompact 头 |
| 时间戳异常 | 5-10 | 编译时间戳在未来或 2000 年之前 |
| 节名异常 | 5-10 | 非标准节名（`.rsrc` 被替换、随机字符串） |
| 资源异常 | 5-15 | 资源中嵌入 PE 文件、加密的资源节 |
| 导入表异常 | 10-15 | 导入很少（加壳）或可疑的导入组合 |
| 数字签名 | -10 | 有效的 Authenticode 签名降低评分 |
| TLS 回调 | 10 | 反调试 TLS 回调条目 |
| 附加数据 | 5-10 | PE 结构之后存在大量附加数据 |

### PE 分析示例

```
Heuristic Analysis: updater.exe
Score: 72/100 [MALICIOUS]

Findings:
  [+25] Section '.text' entropy: 7.91 (likely packed or encrypted)
  [+15] Packer detected: UPX 3.96
  [+12] Suspicious API imports: VirtualAllocEx, WriteProcessMemory,
        CreateRemoteThread, NtUnmapViewOfSection
  [+10] Section name anomaly: '.UPX0', '.UPX1' (non-standard)
  [+10] Compilation timestamp: 2089-01-01 (future date)
```

## ELF（Linux 可执行文件）分析

ELF 启发式针对 Linux 二进制文件和共享库：

| 检查项 | 分值 | 说明 |
|--------|------|------|
| 高节熵值 | 10-25 | 熵值 > 7.0 的节 |
| LD_PRELOAD 引用 | 15-20 | 引用 `LD_PRELOAD` 或 `/etc/ld.so.preload` 的字符串 |
| Cron 持久化 | 10-15 | 引用 `/etc/crontab`、`/var/spool/cron`、cron 目录 |
| Systemd 持久化 | 10-15 | 引用 systemd 单元路径、`systemctl enable` |
| SSH 后门指标 | 15-20 | 修改 `authorized_keys` 路径、`sshd` 配置字符串 |
| 反调试 | 10-15 | `ptrace(PTRACE_TRACEME)`、`/proc/self/status` 检查 |
| 网络操作 | 5-10 | 创建原始套接字、可疑端口绑定 |
| 自删除 | 10 | 执行后 `unlink` 自身二进制路径 |
| 已剥离 + 高熵值 | 10 | 已剥离的高熵值二进制文件暗示加壳恶意软件 |
| `/dev/null` 重定向 | 5 | 将输出重定向到 `/dev/null`（守护进程行为） |

### ELF 分析示例

```
Heuristic Analysis: .cache/systemd-helper
Score: 65/100 [MALICIOUS]

Findings:
  [+20] LD_PRELOAD reference: /etc/ld.so.preload manipulation
  [+15] Cron persistence: writes to /var/spool/cron/root
  [+15] SSH backdoor: modifies /root/.ssh/authorized_keys
  [+10] Self-deletion: unlinks /tmp/.cache/systemd-helper
  [+5]  Network: creates raw socket
```

## Mach-O（macOS 可执行文件）分析

Mach-O 启发式针对 macOS 二进制文件、Bundle 和通用二进制文件：

| 检查项 | 分值 | 说明 |
|--------|------|------|
| 高节熵值 | 10-25 | 熵值 > 7.0 的节 |
| Dylib 注入 | 15-20 | `DYLD_INSERT_LIBRARIES` 引用、可疑的 dylib 加载 |
| LaunchAgent/Daemon 持久化 | 10-15 | 引用 `~/Library/LaunchAgents`、`/Library/LaunchDaemons` |
| Keychain 访问 | 10-15 | Keychain API 调用、`security` 命令使用 |
| Gatekeeper 绕过 | 10-15 | `xattr -d com.apple.quarantine` 字符串 |
| 隐私 TCC 绕过 | 10-15 | 引用 TCC 数据库、辅助功能 API 滥用 |
| 反分析 | 10 | `sysctl` 检测调试器、虚拟机检测字符串 |
| 代码签名异常 | 5-10 | 临时签名或未签名的二进制文件 |

### Mach-O 分析示例

```
Heuristic Analysis: com.apple.helper
Score: 55/100 [SUSPICIOUS]

Findings:
  [+20] Dylib injection: DYLD_INSERT_LIBRARIES manipulation
  [+15] LaunchAgent persistence: writes to ~/Library/LaunchAgents/
  [+10] Keychain access: SecKeychainFindGenericPassword calls
  [+10] Unsigned binary: no code signature present
```

## Office 文档分析

Office 启发式针对 Microsoft Office 格式（.doc、.docx、.xls、.xlsx、.ppt）：

| 检查项 | 分值 | 说明 |
|--------|------|------|
| 存在 VBA 宏 | 10-15 | 自动执行宏（`AutoOpen`、`Document_Open`、`Workbook_Open`） |
| 带 Shell 执行的宏 | 20-30 | 宏中调用 `Shell()`、`WScript.Shell`、`PowerShell` |
| DDE 字段 | 15-20 | 执行命令的动态数据交换字段 |
| 外部模板链接 | 10-15 | 通过 `attachedTemplate` 进行远程模板注入 |
| 混淆的 VBA | 10-20 | 高度混淆的宏代码（`Chr()`、字符串拼接滥用） |
| 嵌入的 OLE 对象 | 5-10 | 作为 OLE 对象嵌入的可执行文件或脚本 |
| 可疑元数据 | 5 | 作者字段中包含 Base64 字符串或异常模式 |

### Office 分析示例

```
Heuristic Analysis: Q3_Report.xlsm
Score: 60/100 [MALICIOUS]

Findings:
  [+15] VBA macro with AutoOpen trigger
  [+25] Macro executes: Shell("powershell -enc JABjAGwA...")
  [+10] Obfuscated VBA: 47 Chr() calls, string concatenation abuse
  [+10] External template: https://evil.example.com/template.dotm
```

## PDF 分析

PDF 启发式针对 PDF 文档：

| 检查项 | 分值 | 说明 |
|--------|------|------|
| 嵌入式 JavaScript | 15-25 | `/JS` 或 `/JavaScript` 操作中的 JavaScript |
| Launch 操作 | 20-25 | 执行系统命令的 `/Launch` 操作 |
| URI 操作 | 5-10 | 指向已知恶意模式的可疑 URI 操作 |
| 混淆流 | 10-15 | 多层编码（FlateDecode + ASCII85 + 十六进制） |
| 嵌入文件 | 5-10 | 作为附件嵌入的可执行文件 |
| 表单提交 | 5-10 | 向外部 URL 提交数据的表单 |
| 带 JavaScript 的 AcroForm | 15 | 包含嵌入式 JavaScript 的交互表单 |

### PDF 分析示例

```
Heuristic Analysis: shipping_label.pdf
Score: 45/100 [SUSPICIOUS]

Findings:
  [+20] Embedded JavaScript: 3 /JS actions found
  [+15] Obfuscated stream: triple-encoded FlateDecode chain
  [+10] Embedded file: invoice.exe (PE executable)
```

## 常见检测发现参考

下表列出了所有文件类型中最常触发的启发式检测项：

| 检测项 | 严重程度 | 文件类型 | 误报率 |
|--------|----------|----------|--------|
| 高熵节 | 中 | PE、ELF、Mach-O | 中低（游戏资源、压缩数据） |
| 加壳检测 | 高 | PE | 极低 |
| 自动执行宏 | 高 | Office | 低（部分合法宏） |
| LD_PRELOAD 操控 | 高 | ELF | 极低 |
| 嵌入式 JavaScript | 中高 | PDF | 低 |
| 可疑 API 导入 | 中 | PE | 中（安全工具会触发） |
| 自删除 | 高 | ELF | 极低 |

::: tip 降低误报
如果合法文件触发了启发式告警，你可以通过 SHA-256 哈希将其加入白名单：
```bash
sd allowlist add /path/to/legitimate/file
```
白名单中的文件会跳过启发式分析，但仍然会检查哈希和 YARA 数据库。
:::

## 下一步

- [支持的文件类型](./file-types) —— 完整的文件类型矩阵和魔数检测详情
- [YARA 规则](./yara-rules) —— 与启发式分析互补的基于模式的检测
- [哈希匹配](./hash-matching) —— 最快的检测层
- [检测引擎概览](./index) —— 所有检测层如何协同工作
