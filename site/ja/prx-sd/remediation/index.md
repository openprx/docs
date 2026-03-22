---
title: 脅威対応
description: 対応ポリシー、永続性のクリーンアップ、ネットワーク隔離による自動脅威修復の設定。
---

# 脅威対応

PRX-SDの修復エンジンは単純な検出を超えた自動脅威対応を提供します。脅威が識別されると、設定されたポリシーに応じてログ記録からネットワーク完全隔離まで段階的なアクションを取ることができます。

## 対応タイプ

| アクション | 説明 | 可逆性 | root必要 |
|--------|-------------|-----------|--------------|
| **報告** | 検出をログに記録して続行。ファイルに対してアクションなし。 | N/A | いいえ |
| **隔離** | ファイルを暗号化して隔離ボールトに移動。 | はい | いいえ |
| **ブロック** | fanotify経由のファイルアクセス/実行を拒否（Linuxリアルタイムのみ）。 | はい | はい |
| **強制終了** | 悪意のあるファイルを作成またはそれを使用しているプロセスを終了。 | いいえ | はい |
| **クリーン** | 元のファイルを保持しながら悪意のある内容を削除（例：Officeドキュメントからのマクロ削除）。 | 部分的 | いいえ |
| **削除** | ディスクから悪意のあるファイルを完全に削除。 | いいえ | いいえ |
| **隔離（ネットワーク）** | ファイアウォールルールを使用してマシンのすべてのネットワークアクセスをブロック。 | はい | はい |
| **ブロックリスト** | 将来のスキャンのためにファイルハッシュをローカルブロックリストに追加。 | はい | いいえ |

## ポリシー設定

### sd policyコマンドの使用

```bash
# 現在のポリシーを表示
sd policy show

# 悪意ある検出のポリシーを設定
sd policy set on_malicious quarantine

# 疑わしい検出のポリシーを設定
sd policy set on_suspicious report

# デフォルトにリセット
sd policy reset
```

### 出力例

```bash
sd policy show
```

```
Threat Response Policy
  on_malicious:    quarantine
  on_suspicious:   report
  blocklist_auto:  true
  notify_webhook:  true
  notify_email:    false
  clean_persistence: true
  network_isolate:   false
```

### 設定ファイル

`~/.prx-sd/config.toml`にポリシーを設定：

```toml
[policy]
on_malicious = "quarantine"     # report | quarantine | block | kill | clean | delete
on_suspicious = "report"        # report | quarantine | block
blocklist_auto = true           # 悪意のあるハッシュをローカルブロックリストに自動追加
clean_persistence = true        # 悪意ある検出時に永続化メカニズムを削除
network_isolate = false         # 重大な脅威のためのネットワーク隔離を有効化

[policy.notify]
webhook = true
email = false

[policy.escalation]
# 同じ脅威が再度現れた場合に強力なアクションにエスカレーション
enabled = true
max_reappearances = 3
escalate_to = "delete"
```

::: tip
`on_malicious`と`on_suspicious`のポリシーは異なるアクションセットを受け入れます。`kill`と`delete`などの破壊的なアクションは`on_malicious`のみで利用可能です。
:::

## 永続性のクリーンアップ

`clean_persistence`が有効な場合、PRX-SDはマルウェアがインストールした可能性のある永続化メカニズムをスキャンして削除します。これは脅威を隔離または削除した後に自動的に実行されます。

### Linuxの永続化ポイント

| 場所 | 技術 | クリーンアップアクション |
|----------|-----------|----------------|
| `/etc/cron.d/`、`/var/spool/cron/` | cronジョブ | 悪意のあるcronエントリを削除 |
| `/etc/systemd/system/` | systemdサービス | 悪意のあるユニットを無効化して削除 |
| `~/.config/systemd/user/` | ユーザーsystemdサービス | 無効化して削除 |
| `~/.bashrc`、`~/.profile` | シェルRC注入 | 注入された行を削除 |
| `~/.ssh/authorized_keys` | SSHバックドアキー | 不正なキーを削除 |
| `/etc/ld.so.preload` | LD_PRELOADハイジャック | 悪意のあるプリロードエントリを削除 |
| `/etc/init.d/` | SysV initスクリプト | 悪意のあるスクリプトを削除 |

### macOSの永続化ポイント

| 場所 | 技術 | クリーンアップアクション |
|----------|-----------|----------------|
| `~/Library/LaunchAgents/` | LaunchAgentのplists | アンロードして削除 |
| `/Library/LaunchDaemons/` | LaunchDaemonのplists | アンロードして削除 |
| `~/Library/Application Support/` | ログインアイテム | 悪意のあるアイテムを削除 |
| `/Library/StartupItems/` | スタートアップアイテム | 削除 |
| `~/.zshrc`、`~/.bash_profile` | シェルRC注入 | 注入された行を削除 |
| キーチェーン | キーチェーンの悪用 | アラート（自動クリーンアップなし） |

### Windowsの永続化ポイント

| 場所 | 技術 | クリーンアップアクション |
|----------|-----------|----------------|
| `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` | レジストリRunキー | 悪意のある値を削除 |
| `HKLM\SYSTEM\CurrentControlSet\Services` | 悪意のあるサービス | 停止、無効化、削除 |
| `Startup`フォルダー | スタートアップショートカット | 悪意のあるショートカットを削除 |
| タスクスケジューラー | スケジュールされたタスク | 悪意のあるタスクを削除 |
| WMIサブスクリプション | WMIイベントコンシューマー | 悪意のあるサブスクリプションを削除 |

::: warning
永続性のクリーンアップはシステム設定ファイルとレジストリエントリを変更します。各操作後に`~/.prx-sd/remediation.log`のクリーンアップログを確認して、悪意のあるエントリのみが削除されたことを確認してください。
:::

## ネットワーク隔離

重大な脅威（アクティブなランサムウェア、データ漏洩）に対して、PRX-SDはマシンをネットワークから隔離できます：

### Linux（iptables）

```bash
# 隔離時にPRX-SDがこれらのルールを自動的に追加
 iptables -I OUTPUT -j DROP
iptables -I INPUT -j DROP
iptables -I OUTPUT -d 127.0.0.1 -j ACCEPT
iptables -I INPUT -s 127.0.0.1 -j ACCEPT
```

### macOS（pf）

```bash
# PRX-SDがpfルールを設定
echo "block all" | pfctl -f -
echo "pass on lo0" | pfctl -f -
pfctl -e
```

隔離を解除：

```bash
sd isolate lift
```

::: warning
ネットワーク隔離はSSHを含むすべてのネットワークトラフィックをブロックします。自動ネットワーク隔離を有効にする前に、物理的またはアウトオブバンドのコンソールアクセスがあることを確認してください。
:::

## 修復ログ

すべての修復アクションは`~/.prx-sd/remediation.log`にログ記録されます：

```json
{
  "timestamp": "2026-03-21T10:15:32Z",
  "threat_id": "a1b2c3d4",
  "file": "/tmp/payload.exe",
  "detection": "Win_Trojan_AgentTesla",
  "severity": "malicious",
  "actions_taken": [
    {"action": "quarantine", "status": "success"},
    {"action": "blocklist", "status": "success"},
    {"action": "clean_persistence", "status": "success", "items_removed": 2}
  ]
}
```

## 例

```bash
# サーバーのための攻撃的なポリシーを設定
sd policy set on_malicious kill
sd policy set on_suspicious quarantine

# ワークステーションのための保守的なポリシーを設定
sd policy set on_malicious quarantine
sd policy set on_suspicious report

# 明示的な修復でスキャン
sd scan /tmp --on-malicious delete --on-suspicious quarantine

# ネットワーク隔離を確認して解除
sd isolate status
sd isolate lift

# 修復履歴を表示
sd remediation log --last 50
sd remediation log --json > remediation_export.json
```

## 次のステップ

- [隔離管理](/ja/prx-sd/quarantine/) -- 隔離されたファイルの管理
- [ランサムウェア保護](/ja/prx-sd/realtime/ransomware) -- 特殊なランサムウェア対応
- [Webhookアラート](/ja/prx-sd/alerts/webhook) -- 修復アクションの通知
- [メールアラート](/ja/prx-sd/alerts/email) -- 脅威のメール通知
