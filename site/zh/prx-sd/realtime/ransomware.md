---
title: 勒索软件防护
description: 基于熵值分析、扩展名监控和批量加密检测的行为级勒索软件防护。
---

# 勒索软件防护

PRX-SD 内置了专门的 `RansomwareDetector` 引擎，可实时识别勒索软件行为。与依赖已知样本的签名检测不同，勒索软件检测器采用行为启发式分析，能够在零日勒索软件完成加密之前将其拦截。

## 工作原理

勒索软件检测器作为实时监控的一部分运行，通过分析文件系统事件来识别活跃加密行为的模式。检测基于三个维度进行：

### 1. 批量加密检测

检测器跟踪每个进程和每个目录的文件修改频率。当单个进程在短时间窗口内修改了异常大量的文件时，会触发告警。

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `batch_threshold` | `20` | 触发检测的文件修改次数阈值 |
| `batch_window_secs` | `10` | 批量计数的时间窗口（秒） |
| `min_files_affected` | `5` | 触发告警的最少受影响文件数 |

```toml
[ransomware]
enabled = true
batch_threshold = 20
batch_window_secs = 10
min_files_affected = 5
```

### 2. 扩展名变更监控

勒索软件通常在加密后将文件重命名为新的扩展名。检测器监视大规模扩展名变更，特别是已知的勒索软件扩展名：

```
.encrypted, .enc, .locked, .crypto, .crypt, .crypted,
.ransomware, .ransom, .rans, .pay, .pay2key,
.locky, .zepto, .cerber, .cerber3, .dharma, .wallet,
.onion, .wncry, .wcry, .wannacry, .petya, .notpetya,
.ryuk, .conti, .lockbit, .revil, .sodinokibi,
.maze, .egregor, .darkside, .blackmatter, .hive,
.deadbolt, .akira, .alphv, .blackcat, .royal,
.rhysida, .medusa, .bianlian, .clop, .8base
```

::: warning
仅靠扩展名监控是不够的 -- 高级勒索软件可能使用随机或看似合法的扩展名。PRX-SD 将扩展名变更与熵值分析相结合，以实现可靠检测。
:::

### 3. 高熵值检测

加密文件具有接近最大值的 Shannon 熵（字节级分析接近 8.0）。检测器比较文件修改前后的熵值变化：

| 指标 | 阈值 | 含义 |
|------|------|------|
| 文件熵值 | > 7.8 | 文件内容很可能是加密或压缩数据 |
| 熵值变化量 | > 3.0 | 文件从低熵变为高熵（加密行为） |
| 文件头熵值 | > 7.5 | 前 4KB 为高熵（原始魔数字节被破坏） |

当一个文件在修改后熵值显著跳升，且该文件之前是已知文档类型（PDF、DOCX、图片），这是加密行为的强力指标。

## 检测评分

每个检测维度为勒索软件综合评分贡献分数：

| 信号 | 权重 | 说明 |
|------|------|------|
| 批量文件修改 | 40 | 单个进程快速修改大量文件 |
| 扩展名变更为已知勒索软件扩展名 | 30 | 文件被重命名为勒索软件扩展名 |
| 扩展名变更为未知扩展名 | 15 | 文件被重命名为异常的新扩展名 |
| 高熵值变化量 | 25 | 文件熵值急剧上升 |
| 高绝对熵值 | 10 | 文件熵值接近最大值 |
| 勒索信创建 | 35 | 检测到匹配勒索信模式的文件 |
| 卷影副本删除 | 50 | 尝试删除卷影副本 |

综合评分超过 **60** 触发 `MALICIOUS`（恶意）判定，**30-59** 之间产生 `SUSPICIOUS`（可疑）告警。

## 勒索信检测

检测器监视匹配常见勒索信模式的文件创建行为：

```
README_RESTORE_FILES.txt, HOW_TO_DECRYPT.txt,
DECRYPT_INSTRUCTIONS.html, YOUR_FILES_ARE_ENCRYPTED.txt,
RECOVER_YOUR_FILES.txt, !README!.txt, _readme.txt,
HELP_DECRYPT.html, RANSOM_NOTE.txt, #DECRYPT#.txt
```

::: tip
勒索信检测基于文件名模式匹配，不要求勒索信文件本身是恶意的。只要创建了匹配这些模式的文件，结合其他信号，即可为勒索软件评分贡献分数。
:::

## 自动响应

检测到勒索软件时，响应取决于配置的策略：

| 动作 | 说明 |
|------|------|
| **Alert** | 记录事件并发送通知（webhook、邮件） |
| **Block** | 拒绝文件操作（仅限 Linux fanotify 阻止模式） |
| **Kill** | 终止违规进程 |
| **Quarantine** | 将受影响文件移入加密隔离区 |
| **Isolate** | 阻断该机器的所有网络访问（紧急措施） |

在 `config.toml` 中配置响应策略：

```toml
[ransomware.response]
on_detection = "kill"           # alert | block | kill | quarantine | isolate
quarantine_affected = true      # 将被修改的文件作为证据隔离
notify_webhook = true           # 发送 webhook 通知
notify_email = true             # 发送邮件告警
snapshot_process_tree = true    # 捕获进程树用于取证
```

## 配置

完整的勒索软件检测器配置：

```toml
[ransomware]
enabled = true
batch_threshold = 20
batch_window_secs = 10
min_files_affected = 5
entropy_threshold = 7.8
entropy_delta_threshold = 3.0
score_threshold_malicious = 60
score_threshold_suspicious = 30

# 以更高灵敏度保护的目录
protected_dirs = [
    "~/Documents",
    "~/Pictures",
    "~/Desktop",
    "/var/www",
]

# 免于监控的进程（如备份软件）
exempt_processes = [
    "borgbackup",
    "restic",
    "rsync",
]

[ransomware.response]
on_detection = "kill"
quarantine_affected = true
notify_webhook = true
notify_email = false
```

## 示例

```bash
# 启动带勒索软件防护的监控
sd monitor --auto-quarantine /home

# 守护进程模式下勒索软件检测器默认启用
sd daemon start

# 查看勒索软件检测器状态
sd status --verbose
```

## 后续步骤

- [文件监控](./monitor) -- 配置实时监控
- [守护进程](./daemon) -- 作为后台服务运行
- [威胁响应](/zh/prx-sd/remediation/) -- 完整的修复策略配置
- [Webhook 告警](/zh/prx-sd/alerts/webhook) -- 获取即时通知
