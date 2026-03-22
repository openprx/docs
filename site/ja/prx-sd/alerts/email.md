---
title: メールアラート
description: PRX-SDでの脅威検出とスキャン結果のメール通知設定。
---

# メールアラート

PRX-SDは脅威が検出されたとき、スキャンが完了したとき、または重大なイベントが発生したときにメール通知を送信できます。メールアラートはWebhookを補完し、メールが主要なコミュニケーションチャネルである環境や、オンコール担当者に連絡するために役立ちます。

## 使い方

```bash
sd email-alert <SUBCOMMAND> [OPTIONS]
```

### サブコマンド

| サブコマンド | 説明 |
|------------|-------------|
| `configure` | SMTPサーバーと受信者設定をセットアップ |
| `test` | 設定を確認するためのテストメールを送信 |
| `send` | アラートメールを手動で送信 |
| `status` | 現在のメール設定状態を表示 |

## メールの設定

### インタラクティブセットアップ

```bash
sd email-alert configure
```

インタラクティブウィザードが以下を尋ねます：

```
SMTP Server: smtp.gmail.com
SMTP Port [587]: 587
Use TLS [yes]: yes
Username: alerts@example.com
Password: ********
From Address [alerts@example.com]: prx-sd@example.com
From Name [PRX-SD]: PRX-SD Scanner
Recipients (comma-separated): security@example.com, oncall@example.com
Min Severity [suspicious]: malicious
```

### コマンドライン設定

```bash
sd email-alert configure \
  --smtp-server smtp.gmail.com \
  --smtp-port 587 \
  --tls true \
  --username alerts@example.com \
  --password "app-password-here" \
  --from "prx-sd@example.com" \
  --from-name "PRX-SD Scanner" \
  --to "security@example.com,oncall@example.com" \
  --min-severity malicious
```

### 設定ファイル

メール設定は`~/.prx-sd/config.toml`に保存されます：

```toml
[email]
enabled = true
min_severity = "malicious"    # suspicious | malicious
events = ["threat_detected", "ransomware_alert", "scan_completed"]

[email.smtp]
server = "smtp.gmail.com"
port = 587
tls = true
username = "alerts@example.com"
# Password stored encrypted - use 'sd email-alert configure' to set

[email.message]
from_address = "prx-sd@example.com"
from_name = "PRX-SD Scanner"
recipients = ["security@example.com", "oncall@example.com"]
subject_prefix = "[PRX-SD]"
```

::: tip
Gmailの場合、アカウントのパスワードではなくアプリパスワードを使用してください。Googleアカウント > セキュリティ > 2段階認証プロセス > アプリパスワードから生成できます。
:::

## メールのテスト

設定を確認するためにテストメールを送信：

```bash
sd email-alert test
```

```
Sending test email to security@example.com, oncall@example.com...
  SMTP connection:  OK (smtp.gmail.com:587, TLS)
  Authentication:   OK
  Delivery:         OK (Message-ID: <prx-sd-test-a1b2c3@example.com>)

Test email sent successfully.
```

## 手動アラートの送信

アラートメールを手動でトリガー（統合のテストや調査結果の転送に便利）：

```bash
# Send alert about a specific file
sd email-alert send --file /tmp/suspicious_file --severity malicious \
  --message "Found during incident response investigation"

# Send a scan summary
sd email-alert send --scan-report /tmp/scan-results.json
```

## メール内容

### 脅威検出メール

```
Subject: [PRX-SD] MALICIOUS: Win_Trojan_AgentTesla detected on web-server-01

PRX-SD Threat Detection Alert
==============================

Host:       web-server-01
Timestamp:  2026-03-21 10:15:32 UTC
Severity:   MALICIOUS

File:       /tmp/payload.exe
SHA-256:    e3b0c44298fc1c149afbf4c8996fb924...
Size:       240 KB
Type:       PE32 executable (GUI) Intel 80386, for MS Windows

Detection:  Win_Trojan_AgentTesla
Engine:     YARA (neo23x0/signature-base)

Action Taken: Quarantined (ID: a1b2c3d4)

---
PRX-SD Antivirus Engine | https://openprx.dev/prx-sd
```

### スキャンサマリーメール

```
Subject: [PRX-SD] Scan Complete: 3 threats found in /home

PRX-SD Scan Report
===================

Host:           web-server-01
Scan Path:      /home
Started:        2026-03-21 10:00:00 UTC
Completed:      2026-03-21 10:12:45 UTC
Duration:       12 minutes 45 seconds

Files Scanned:  45,231
Threats Found:  3

Detections:
  1. /home/user/downloads/crack.exe
     Severity: MALICIOUS | Detection: Win_Trojan_Agent
     Action: Quarantined

  2. /home/user/.cache/tmp/loader.sh
     Severity: MALICIOUS | Detection: Linux_Backdoor_Generic
     Action: Quarantined

  3. /home/user/scripts/util.py
     Severity: SUSPICIOUS | Detection: Heuristic_HighEntropy
     Action: Reported

---
PRX-SD Antivirus Engine | https://openprx.dev/prx-sd
```

## サポートされるイベント

| イベント | デフォルト含まれる | 説明 |
|-------|-----------------|-------------|
| `threat_detected` | はい | 悪意のあるまたは疑わしいファイルが見つかった |
| `ransomware_alert` | はい | ランサムウェアの動作が検出された |
| `scan_completed` | いいえ | スキャンジョブが終了（脅威が見つかった場合のみ） |
| `update_completed` | いいえ | シグネチャ更新が完了した |
| `update_failed` | はい | シグネチャ更新が失敗した |
| `daemon_error` | はい | デーモンが重大なエラーを検出した |

メールをトリガーするイベントを設定：

```toml
[email]
events = ["threat_detected", "ransomware_alert", "daemon_error"]
```

## レート制限

大規模なアウトブレイク時のメール洪水を防ぐため：

```toml
[email.rate_limit]
max_per_hour = 10            # Maximum emails per hour
digest_mode = true           # Batch multiple alerts into a single email
digest_interval_mins = 15    # Digest batch window
```

`digest_mode`が有効な場合、ダイジストウィンドウ内のアラートは個別通知ではなく1通のサマリーメールにまとめられます。

## ステータスの確認

```bash
sd email-alert status
```

```
Email Alert Status
  Enabled:      true
  SMTP Server:  smtp.gmail.com:587 (TLS)
  From:         prx-sd@example.com
  Recipients:   security@example.com, oncall@example.com
  Min Severity: malicious
  Events:       threat_detected, ransomware_alert, daemon_error
  Last Sent:    2026-03-21 10:15:32 UTC
  Emails Today: 2
```

## 次のステップ

- [Webhookアラート](./webhook) -- リアルタイムWebhook通知
- [スケジュールスキャン](./schedule) -- 定期スキャンの自動化
- [脅威対応](/ja/prx-sd/remediation/) -- 自動修復ポリシー
- [デーモン](/ja/prx-sd/realtime/daemon) -- アラート付きのバックグラウンド保護
