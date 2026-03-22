---
title: Webhookアラート
description: PRX-SDでの脅威検出、隔離イベント、スキャン結果のWebhook通知の設定。
---

# Webhookアラート

PRX-SDは脅威が検出されたとき、ファイルが隔離されたとき、またはスキャンが完了したときにWebhookエンドポイントにリアルタイム通知を送信できます。WebhookはSlack、Discord、Microsoft Teams、PagerDuty、またはカスタムHTTPエンドポイントと統合できます。

## 使い方

```bash
sd webhook <SUBCOMMAND> [OPTIONS]
```

### サブコマンド

| サブコマンド | 説明 |
|------------|-------------|
| `add` | 新しいWebhookエンドポイントを登録 |
| `remove` | 登録済みWebhookを削除 |
| `list` | すべての登録済みWebhookを一覧表示 |
| `test` | Webhookにテスト通知を送信 |

## Webhookの追加

```bash
sd webhook add [OPTIONS] <URL>
```

| フラグ | ショート | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--format` | `-f` | `generic` | ペイロード形式：`slack`、`discord`、`teams`、`generic` |
| `--name` | `-n` | 自動 | このWebhookの人間が読める名前 |
| `--events` | `-e` | all | 通知するイベントのカンマ区切りリスト |
| `--secret` | `-s` | | ペイロード検証のためのHMAC-SHA256署名シークレット |
| `--min-severity` | | `suspicious` | トリガーする最小重大度：`suspicious`、`malicious` |

### サポートされるイベント

| イベント | 説明 |
|-------|-------------|
| `threat_detected` | 悪意のあるまたは疑わしいファイルが見つかった |
| `file_quarantined` | ファイルが隔離に移動された |
| `scan_completed` | スキャンジョブが終了した |
| `update_completed` | シグネチャ更新が完了した |
| `ransomware_alert` | ランサムウェアの動作が検出された |
| `daemon_status` | デーモンが開始、停止、またはエラーを検出した |

### 例

```bash
# Add a Slack webhook
sd webhook add --format slack --name "security-alerts" \
  "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"

# Add a Discord webhook
sd webhook add --format discord --name "av-alerts" \
  "https://discord.com/api/webhooks/1234567890/abcdefg"

# Add a generic webhook with HMAC signing
sd webhook add --format generic --secret "my-signing-secret" \
  --name "siem-ingest" "https://siem.example.com/api/v1/alerts"

# Add a webhook for malicious-only alerts
sd webhook add --format slack --min-severity malicious \
  --events threat_detected,ransomware_alert \
  "https://hooks.slack.com/services/T00000/B00000/CRITICAL"
```

## Webhookの一覧表示

```bash
sd webhook list
```

```
Registered Webhooks (3)

Name              Format    Events              Min Severity  URL
security-alerts   slack     all                 suspicious    https://hooks.slack.com/...XXXX
av-alerts         discord   all                 suspicious    https://discord.com/...defg
siem-ingest       generic   all                 suspicious    https://siem.example.com/...
```

## Webhookの削除

```bash
# Remove by name
sd webhook remove security-alerts

# Remove by URL
sd webhook remove "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
```

## Webhookのテスト

接続を確認するためにテスト通知を送信：

```bash
# Test a specific webhook
sd webhook test security-alerts

# Test all webhooks
sd webhook test --all
```

テストはサンプルの脅威検出ペイロードを送信するため、フォーマットと配信を確認できます。

## ペイロード形式

### Generic形式

デフォルトの`generic`形式はHTTP POSTでJSONペイロードを送信します：

```json
{
  "event": "threat_detected",
  "timestamp": "2026-03-21T10:15:32Z",
  "hostname": "web-server-01",
  "threat": {
    "file": "/tmp/payload.exe",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
    "size": 245760,
    "severity": "malicious",
    "detection": {
      "engine": "yara",
      "rule": "Win_Trojan_AgentTesla",
      "source": "neo23x0/signature-base"
    }
  },
  "action_taken": "quarantined",
  "quarantine_id": "a1b2c3d4"
}
```

Genericペイロードに含まれるヘッダー：

```
Content-Type: application/json
User-Agent: PRX-SD/1.0
X-PRX-SD-Event: threat_detected
X-PRX-SD-Signature: sha256=<HMAC signature>  (if secret configured)
```

### Slack形式

Slack Webhookは色分けされた重大度付きのフォーマットされたメッセージを受信します：

```json
{
  "attachments": [{
    "color": "#ff0000",
    "title": "Threat Detected: Win_Trojan_AgentTesla",
    "fields": [
      {"title": "File", "value": "/tmp/payload.exe", "short": false},
      {"title": "Severity", "value": "MALICIOUS", "short": true},
      {"title": "Action", "value": "Quarantined", "short": true},
      {"title": "Host", "value": "web-server-01", "short": true},
      {"title": "SHA-256", "value": "`e3b0c44298fc...`", "short": false}
    ],
    "ts": 1742554532
  }]
}
```

### Discord形式

Discord WebhookはEmbedsフォーマットを使用します：

```json
{
  "embeds": [{
    "title": "Threat Detected",
    "description": "**Win_Trojan_AgentTesla** found in `/tmp/payload.exe`",
    "color": 16711680,
    "fields": [
      {"name": "Severity", "value": "MALICIOUS", "inline": true},
      {"name": "Action", "value": "Quarantined", "inline": true},
      {"name": "Host", "value": "web-server-01", "inline": true}
    ],
    "timestamp": "2026-03-21T10:15:32Z"
  }]
}
```

## 設定ファイル

Webhookは`~/.prx-sd/config.toml`でも設定できます：

```toml
[[webhook]]
name = "security-alerts"
url = "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
format = "slack"
events = ["threat_detected", "ransomware_alert", "file_quarantined"]
min_severity = "suspicious"

[[webhook]]
name = "siem-ingest"
url = "https://siem.example.com/api/v1/alerts"
format = "generic"
secret = "my-hmac-secret"
events = ["threat_detected"]
min_severity = "malicious"
```

::: tip
Webhookシークレットは設定ファイルに暗号化されて保存されます。設定ファイルを直接編集するのではなく、`sd webhook add --secret`を使用して安全に設定してください。
:::

## リトライ動作

失敗したWebhook配信は指数バックオフでリトライされます：

| 試行 | 遅延 |
|---------|-------|
| 1回目のリトライ | 5秒 |
| 2回目のリトライ | 30秒 |
| 3回目のリトライ | 5分 |
| 4回目のリトライ | 30分 |
| （諦める） | 配信不能としてイベントをログ記録 |

## 次のステップ

- [メールアラート](./email) -- メール通知設定
- [スケジュールスキャン](./schedule) -- 定期スキャンジョブの設定
- [脅威対応](/ja/prx-sd/remediation/) -- 自動修復の設定
- [デーモン](/ja/prx-sd/realtime/daemon) -- アラート付きのバックグラウンド監視
