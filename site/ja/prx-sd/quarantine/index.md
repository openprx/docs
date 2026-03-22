---
title: 隔離管理
description: AES-256-GCM暗号化ボールトで隔離された脅威を管理し、ファイルを復元して隔離統計を確認します。
---

# 隔離管理

PRX-SDが脅威を検出すると、ファイルを暗号化された隔離ボールトに隔離できます。隔離されたファイルはAES-256-GCMで暗号化され、名前が変更されて安全なディレクトリに移動されるため、誤って実行することはできません。元のメタデータはすべてフォレンジック分析のために保持されます。

## 隔離の仕組み

```
脅威を検出
  1. ランダムなAES-256-GCMキーを生成
  2. ファイル内容を暗号化
  3. 暗号化されたblobをvault.binに保存
  4. メタデータ（元のパス、ハッシュ、検出情報）をJSONとして保存
  5. ディスクから元のファイルを削除
  6. 隔離イベントをログに記録
```

隔離ボールトは`~/.prx-sd/quarantine/`に保存されます：

```
~/.prx-sd/quarantine/
  vault.bin                    # 暗号化されたファイルストア（追記のみ）
  index.json                   # メタデータを持つ隔離インデックス
  entries/
    a1b2c3d4.json             # エントリごとのメタデータ
    e5f6g7h8.json
```

各隔離エントリには以下が含まれます：

```json
{
  "id": "a1b2c3d4",
  "original_path": "/tmp/payload.exe",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
  "file_size": 245760,
  "detection": {
    "engine": "yara",
    "rule": "Win_Trojan_AgentTesla",
    "severity": "malicious"
  },
  "quarantined_at": "2026-03-21T10:15:32Z",
  "vault_offset": 1048576,
  "vault_length": 245792
}
```

::: tip
隔離ボールトは認証付き暗号化（AES-256-GCM）を使用します。これにより、隔離されたマルウェアの誤った実行と証拠の改ざんの両方が防止されます。
:::

## 隔離されたファイルの一覧表示

```bash
sd quarantine list [OPTIONS]
```

| フラグ | ショート | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--json` | | `false` | JSONとして出力 |
| `--sort` | `-s` | `date` | 並べ替え：`date`、`name`、`size`、`severity` |
| `--filter` | `-f` | | 重大度でフィルタリング：`malicious`、`suspicious` |
| `--limit` | `-n` | すべて | 表示する最大エントリ数 |

### 例

```bash
sd quarantine list
```

```
Quarantine Vault (4 entries, 1.2 MB)

ID        Date                 Size     Severity   Detection              Original Path
a1b2c3d4  2026-03-21 10:15:32  240 KB   malicious  Win_Trojan_AgentTesla  /tmp/payload.exe
e5f6g7h8  2026-03-20 14:22:01  512 KB   malicious  Ransom_LockBit3       /home/user/doc.pdf.lockbit
c9d0e1f2  2026-03-19 09:45:18  32 KB    suspicious  Suspicious_Script     /var/www/upload/shell.php
b3a4c5d6  2026-03-18 16:30:55  384 KB   malicious  SHA256_Match          /tmp/dropper.bin
```

## ファイルの復元

隔離されたファイルを元の場所または指定したパスに復元：

```bash
sd quarantine restore <ID> [OPTIONS]
```

| フラグ | ショート | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--to` | `-t` | 元のパス | 別の場所に復元 |
| `--force` | `-f` | `false` | 宛先が存在する場合は上書き |

::: warning
隔離されたファイルを復元すると、既知の悪意のあるまたは疑わしいファイルがディスクに戻ります。ファイルが誤検知であることを確認した場合、または隔離された環境での分析が必要な場合にのみファイルを復元してください。
:::

### 例

```bash
# 元の場所に復元
sd quarantine restore a1b2c3d4

# 分析のために特定のディレクトリに復元
sd quarantine restore a1b2c3d4 --to /tmp/analysis/

# 宛先にファイルが存在する場合は強制上書き
sd quarantine restore a1b2c3d4 --to /tmp/analysis/ --force
```

## 隔離されたファイルの削除

隔離されたエントリを完全に削除：

```bash
# 単一エントリを削除
sd quarantine delete <ID>

# すべてのエントリを削除
sd quarantine delete-all

# 30日以上前のエントリを削除
sd quarantine delete --older-than 30d

# 特定の重大度のすべてのエントリを削除
sd quarantine delete --filter malicious
```

削除する際、暗号化されたデータはボールトから削除される前にゼロで上書きされます。

::: warning
削除は永続的です。暗号化されたファイルデータとメタデータは削除後に回復不可能です。削除する前にアーカイブのためにエントリをエクスポートすることを検討してください。
:::

## 隔離統計

隔離ボールトの集計統計を表示：

```bash
sd quarantine stats
```

```
Quarantine Statistics
  Total entries:       47
  Total size:          28.4 MB (encrypted)
  Oldest entry:        2026-02-15
  Newest entry:        2026-03-21

  By severity:
    Malicious:         31 (65.9%)
    Suspicious:        16 (34.1%)

  By detection engine:
    YARA rules:        22 (46.8%)
    Hash match:        15 (31.9%)
    Heuristic:          7 (14.9%)
    Ransomware:         3 (6.4%)

  Top detections:
    Win_Trojan_Agent    8 entries
    Ransom_LockBit3     5 entries
    SHA256_Match        5 entries
    Suspicious_Script   4 entries
```

## 自動隔離

スキャンまたは監視中に自動隔離を有効化：

```bash
# 自動隔離でスキャン
sd scan /tmp --auto-quarantine

# 自動隔離で監視
sd monitor --auto-quarantine /home /tmp

# 自動隔離でデーモン
sd daemon start --auto-quarantine
```

またはデフォルトポリシーとして設定：

```toml
[policy]
on_malicious = "quarantine"
on_suspicious = "report"
```

## 隔離データのエクスポート

レポートまたはSIEM統合のために隔離メタデータをエクスポート：

```bash
# すべてのメタデータをJSONとしてエクスポート
sd quarantine list --json > quarantine_report.json

# 統計をJSONとしてエクスポート
sd quarantine stats --json > quarantine_stats.json
```

## 次のステップ

- [脅威対応](/ja/prx-sd/remediation/) -- 隔離を超えた対応ポリシーの設定
- [ファイル監視](/ja/prx-sd/realtime/monitor) -- 自動隔離付きのリアルタイム保護
- [Webhookアラート](/ja/prx-sd/alerts/webhook) -- ファイルが隔離されたときに通知を受け取る
- [脅威インテリジェンス](/ja/prx-sd/signatures/) -- シグネチャデータベースの概要
