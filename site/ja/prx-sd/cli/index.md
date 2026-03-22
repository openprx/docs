---
title: CLIコマンドリファレンス
description: "10カテゴリに整理された27のsd CLIサブコマンドすべての完全リファレンス。グローバルオプションとクイック使用例を含む。"
---

# CLIコマンドリファレンス

`sd`コマンドラインインターフェースは10カテゴリに整理された27のサブコマンドを提供します。このページはクイックリファレンスインデックスとして機能します。各コマンドは利用可能な詳細ドキュメントページへリンクしています。

## グローバルオプション

これらのフラグはすべてのサブコマンドに渡せます：

| フラグ | デフォルト | 説明 |
|------|---------|-------------|
| `--log-level <LEVEL>` | `warn` | ロギングの詳細度：`trace`、`debug`、`info`、`warn`、`error` |
| `--data-dir <PATH>` | `~/.prx-sd` | シグネチャ、隔離、設定、プラグインのベースデータディレクトリ |
| `--help` | -- | コマンドまたはサブコマンドのヘルプを表示 |
| `--version` | -- | エンジンバージョンを表示 |

```bash
# デバッグロギングを有効化
sd --log-level debug scan /tmp

# カスタムデータディレクトリを使用
sd --data-dir /opt/prx-sd scan /home
```

## スキャン

オンデマンドのファイルおよびシステムスキャン用コマンド。

| コマンド | 説明 |
|---------|-------------|
| `sd scan <PATH>` | ファイルまたはディレクトリの脅威スキャン |
| `sd scan-memory` | 実行中のプロセスメモリのスキャン（Linuxのみ、root必要） |
| `sd scan-usb [DEVICE]` | USB/リムーバブルデバイスのスキャン |
| `sd check-rootkit` | ルートキット指標のチェック（Linuxのみ） |

```bash
# ディレクトリを再帰的にスキャンして自動隔離
sd scan /home --auto-quarantine

# 自動化のためのJSON出力でスキャン
sd scan /tmp --json

# 4スレッドとHTMLレポートでスキャン
sd scan /var --threads 4 --report /tmp/report.html

# パターンを除外
sd scan /home --exclude "*.log" --exclude "/home/user/.cache"

# スキャンして自動修復（プロセスの強制終了、隔離、永続性のクリーンアップ）
sd scan /tmp --remediate

# プロセスメモリをスキャン
sudo sd scan-memory
sudo sd scan-memory --pid 1234

# USBデバイスをスキャン
sd scan-usb
sd scan-usb /dev/sdb1 --auto-quarantine

# ルートキットをチェック
sudo sd check-rootkit
sudo sd check-rootkit --json
```

## リアルタイム監視

継続的なファイルシステム監視とバックグラウンドデーモン操作のコマンド。

| コマンド | 説明 |
|---------|-------------|
| `sd monitor <PATHS...>` | リアルタイムファイルシステム監視を開始 |
| `sd daemon [PATHS...]` | 監視と自動更新でバックグラウンドデーモンとして実行 |

```bash
# /homeと/tmpの変更を監視
sd monitor /home /tmp

# ブロックモードで監視（fanotify、root必要）
sudo sd monitor /home --block

# デフォルトパス（/home、/tmp）でデーモンを実行
sd daemon

# カスタム更新間隔（2時間ごと）でデーモン
sd daemon /home /tmp /var --update-hours 2
```

## 隔離管理

AES-256-GCM暗号化隔離ボールトを管理するコマンド。

| コマンド | 説明 |
|---------|-------------|
| `sd quarantine list` | 隔離されたすべてのファイルを一覧表示 |
| `sd quarantine restore <ID>` | 隔離されたファイルを元の場所に復元 |
| `sd quarantine delete <ID>` | 隔離されたファイルを完全に削除 |
| `sd quarantine delete-all` | 隔離されたすべてのファイルを完全に削除 |
| `sd quarantine stats` | 隔離ボールトの統計を表示 |

```bash
# 隔離されたファイルを一覧表示
sd quarantine list

# IDの最初の8文字でファイルを復元
sd quarantine restore a1b2c3d4

# 代替パスに復元
sd quarantine restore a1b2c3d4 --to /tmp/recovered/

# 特定のエントリを削除
sd quarantine delete a1b2c3d4

# すべてのエントリを削除（確認プロンプトあり）
sd quarantine delete-all

# 確認なしですべてを削除
sd quarantine delete-all --yes

# 隔離統計を表示
sd quarantine stats
```

## シグネチャ管理

脅威シグネチャの更新とインポートのコマンド。

| コマンド | 説明 |
|---------|-------------|
| `sd update` | シグネチャデータベースの更新を確認して適用 |
| `sd import <FILE>` | ブロックリストファイルからハッシュシグネチャをインポート |
| `sd import-clamav <FILES...>` | ClamAVシグネチャファイル（.cvd、.hdb、.hsb）をインポート |
| `sd info` | エンジンバージョン、シグネチャステータス、システム情報を表示 |

```bash
# シグネチャを更新
sd update

# ダウンロードせずに更新を確認
sd update --check-only

# 強制再ダウンロード
sd update --force

# カスタムハッシュファイルをインポート
sd import /path/to/hashes.txt

# ClamAVシグネチャをインポート
sd import-clamav main.cvd daily.cvd

# エンジン情報を表示
sd info
```

## 設定

エンジン設定と修復ポリシーを管理するコマンド。

| コマンド | 説明 |
|---------|-------------|
| `sd config show` | 現在の設定を表示 |
| `sd config set <KEY> <VALUE>` | 設定値を設定 |
| `sd config reset` | 設定をデフォルトにリセット |
| `sd policy show` | 修復ポリシーを表示 |
| `sd policy set <KEY> <VALUE>` | 修復ポリシー値を設定 |
| `sd policy reset` | 修復ポリシーをデフォルトにリセット |

```bash
# 設定を表示
sd config show

# スキャンスレッドを設定
sd config set scan.threads 8

# デフォルトにリセット
sd config reset

# 修復ポリシーを表示
sd policy show
```

詳細については[設定概要](../configuration/)と[設定リファレンス](../configuration/reference)を参照してください。

## スケジュールスキャン

systemdタイマーまたはcronを通じた定期的なスケジュールスキャンを管理するコマンド。

| コマンド | 説明 |
|---------|-------------|
| `sd schedule add <PATH>` | 定期スケジュールスキャンを登録 |
| `sd schedule remove` | スケジュールスキャンを削除 |
| `sd schedule status` | 現在のスケジュールステータスを表示 |

```bash
# /homeの週次スキャンをスケジュール
sd schedule add /home --frequency weekly

# 日次スキャンをスケジュール
sd schedule add /var --frequency daily

# 利用可能な頻度: hourly、4h、12h、daily、weekly
sd schedule add /tmp --frequency 4h

# スケジュールを削除
sd schedule remove

# スケジュールステータスを確認
sd schedule status
```

## アラート＆Webhook

Webhookとメールを通じたアラート通知を設定するコマンド。

| コマンド | 説明 |
|---------|-------------|
| `sd webhook list` | 設定されたWebhookエンドポイントを一覧表示 |
| `sd webhook add <NAME> <URL>` | Webhookエンドポイントを追加 |
| `sd webhook remove <NAME>` | Webhookエンドポイントを削除 |
| `sd webhook test` | すべてのWebhookにテストアラートを送信 |
| `sd email-alert configure` | SMTPメールアラートを設定 |
| `sd email-alert test` | テストアラートメールを送信 |
| `sd email-alert send <NAME> <LEVEL> <PATH>` | カスタムアラートメールを送信 |

```bash
# Slack Webhookを追加
sd webhook add my-slack https://hooks.slack.com/services/... --format slack

# Discord Webhookを追加
sd webhook add my-discord https://discord.com/api/webhooks/... --format discord

# 汎用Webhookを追加
sd webhook add my-webhook https://example.com/webhook

# すべてのWebhookを一覧表示
sd webhook list

# すべてのWebhookをテスト
sd webhook test

# メールアラートを設定
sd email-alert configure

# メールアラートをテスト
sd email-alert test
```

## ネットワーク保護

DNSレベルの広告および悪意のあるドメインブロックのコマンド。

| コマンド | 説明 |
|---------|-------------|
| `sd adblock enable` | hostsファイルを通じたadblock保護を有効化 |
| `sd adblock disable` | adblock保護を無効化 |
| `sd adblock sync` | すべてのフィルターリストを再ダウンロード |
| `sd adblock stats` | adblockエンジン統計を表示 |
| `sd adblock check <URL>` | URLまたはドメインがブロックされているか確認 |
| `sd adblock log` | 最近のブロックされたエントリを表示 |
| `sd adblock add <NAME> <URL>` | カスタムフィルターリストを追加 |
| `sd adblock remove <NAME>` | フィルターリストを削除 |
| `sd dns-proxy` | フィルタリング付きのローカルDNSプロキシを起動 |

```bash
# adblockを有効化
sudo sd adblock enable

# DNSプロキシを起動
sudo sd dns-proxy --listen 127.0.0.1:53 --upstream 1.1.1.1:53
```

詳細については[Adblock](../network/adblock)と[DNSプロキシ](../network/dns-proxy)を参照してください。

## レポート

| コマンド | 説明 |
|---------|-------------|
| `sd report <OUTPUT>` | JSONスキャン結果からHTMLレポートを生成 |

```bash
# JSON出力でスキャン、次にHTMLレポートを生成
sd scan /home --json > results.json
sd report report.html --input results.json

# または--reportフラグを直接使用
sd scan /home --report /tmp/scan-report.html
```

## システム

エンジンメンテナンス、統合、セルフアップデートのコマンド。

| コマンド | 説明 |
|---------|-------------|
| `sd status` | デーモンステータスを表示（実行中/停止、PID、ブロックされた脅威） |
| `sd install-integration` | ファイルマネージャーの右クリックスキャン統合をインストール |
| `sd self-update` | エンジンバイナリの更新を確認して適用 |

```bash
# デーモンステータスを確認
sd status

# デスクトップ統合をインストール
sd install-integration

# エンジン更新を確認
sd self-update --check-only

# エンジン更新を適用
sd self-update
```

## コミュニティ

コミュニティ脅威インテリジェンス共有のコマンド。

| コマンド | 説明 |
|---------|-------------|
| `sd community status` | コミュニティ共有設定を表示 |
| `sd community enroll` | このマシンをコミュニティAPIに登録 |
| `sd community disable` | コミュニティ共有を無効化 |

```bash
# 登録ステータスを確認
sd community status

# コミュニティ共有に登録
sd community enroll

# 共有を無効化（認証情報は保持）
sd community disable
```

## 次のステップ

- [クイックスタートガイド](../getting-started/quickstart)から5分でスキャンを開始
- [設定](../configuration/)を探索してエンジンの動作をカスタマイズ
- 継続的な保護のために[リアルタイム監視](../realtime/)をセットアップ
- [検出エンジン](../detection/)パイプラインについて学ぶ
