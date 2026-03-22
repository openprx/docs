---
title: 内蔵ルール
description: "PRX-WAFにはOWASP CRS、ModSecurityコミュニティルール、標的型CVE仮想パッチをカバーする398のYAMLルールが付属。完全なインベントリとカテゴリ別内訳。"
---

# 内蔵ルール

PRX-WAFには3つのカテゴリにわたる398の事前構築ルールと、バイナリにコンパイルされた10以上の検出チェッカーが付属しています。これらを組み合わせることで、OWASPトップ10と既知のCVEエクスプロイトの包括的なカバレッジを提供します。

## OWASP Core Rule Set（310ルール）

OWASP CRSルールは[OWASP ModSecurity Core Rule Set v4](https://github.com/coreruleset/coreruleset)からPRX-WAFのネイティブYAMLフォーマットに変換されています。最も一般的なWebの攻撃ベクターをカバーしています：

| ファイル | CRS ID | ルール数 | カテゴリ |
|------|---------|-------|----------|
| `sqli.yaml` | 942xxx | 約87 | SQLインジェクション |
| `xss.yaml` | 941xxx | 約41 | クロスサイトスクリプティング |
| `rce.yaml` | 932xxx | 約30 | リモートコード実行 |
| `lfi.yaml` | 930xxx | 約20 | ローカルファイルインクルード |
| `rfi.yaml` | 931xxx | 約12 | リモートファイルインクルード |
| `php-injection.yaml` | 933xxx | 約18 | PHPインジェクション |
| `java-injection.yaml` | 944xxx | 約15 | Java / Expression Languageインジェクション |
| `generic-attack.yaml` | 934xxx | 約12 | Node.js、SSI、HTTPスプリッティング |
| `scanner-detection.yaml` | 913xxx | 約10 | セキュリティスキャナーUA検出 |
| `protocol-enforcement.yaml` | 920xxx | 約15 | HTTPプロトコル準拠 |
| `protocol-attack.yaml` | 921xxx | 約10 | リクエストスマグリング、CRLFインジェクション |
| `multipart-attack.yaml` | 922xxx | 約8 | マルチパートバイパス |
| `method-enforcement.yaml` | 911xxx | 約5 | HTTPメソッドアローリスト |
| `session-fixation.yaml` | 943xxx | 約6 | セッション固定 |
| `web-shells.yaml` | 955xxx | 約8 | Webシェル検出 |
| `response-*.yaml` | 950〜956xxx | 約13 | レスポンス検査 |

### ワードリストデータファイル

OWASP CRSルールは`rules/owasp-crs/data/`に保存された20以上のワードリストファイルに対してフレーズマッチ（`pm_from_file`）を使用します：

- `scanners-user-agents.data` -- 既知のスキャナーユーザーエージェント文字列
- `lfi-os-files.data` -- 機密OSファイルパス
- `sql-errors.data` -- データベースエラーメッセージパターン
- その他多数

## ModSecurityコミュニティルール（46ルール）

OWASP CRSで完全にカバーされていない脅威カテゴリのための手作りルール：

| ファイル | ルール数 | カテゴリ |
|------|-------|----------|
| `ip-reputation.yaml` | 約15 | ボット/スキャナー/プロキシIP検出 |
| `dos-protection.yaml` | 約12 | DoSと異常なリクエストパターン |
| `data-leakage.yaml` | 約10 | PIIと認証情報漏洩検出 |
| `response-checks.yaml` | 約9 | レスポンスボディ検査 |

## CVE仮想パッチ（39ルール）

高プロファイルCVEの標的型検出ルール。これらは仮想パッチとして機能し、エクスプロイトの試みが脆弱なアプリケーションに到達する前にブロックします：

| ファイル | CVE | 説明 |
|------|--------|-------------|
| `2021-log4shell.yaml` | CVE-2021-44228、CVE-2021-45046 | Apache Log4j JNDIルックアップによるRCE |
| `2022-spring4shell.yaml` | CVE-2022-22965、CVE-2022-22963 | Spring Framework RCE |
| `2022-text4shell.yaml` | CVE-2022-42889 | Apache Commons Text RCE |
| `2023-moveit.yaml` | CVE-2023-34362、CVE-2023-36934 | MOVEit Transfer SQLインジェクション |
| `2024-xz-backdoor.yaml` | CVE-2024-3094 | XZ Utilsバックドア検出 |
| `2024-recent.yaml` | 複数 | 2024年の高プロファイルCVE |
| `2025-recent.yaml` | 複数 | 2025年の高プロファイルCVE |

::: tip
CVEパッチルールはデフォルトでパラノイアレベル1に設定されており、すべての設定でアクティブです。特定のエクスプロイトペイロードを標的とするため、誤検知率が非常に低いです。
:::

## 内蔵検出チェッカー

YAMLルールに加えて、PRX-WAFにはバイナリにコンパイルされた検出チェッカーが含まれています。これらは検出パイプラインの専用フェーズで実行されます：

| フェーズ | チェッカー | 説明 |
|-------|---------|-------------|
| 1〜4 | IPアローリスト/ブロックリスト | CIDRベースのIPフィルタリング |
| 5 | CC/DDoSレートリミッター | IPごとのスライディングウィンドウレート制限 |
| 6 | スキャナー検出 | 脆弱性スキャナーフィンガープリント（Nmap、Niktoなど） |
| 7 | ボット検出 | 悪意のあるボット、AIクローラー、ヘッドレスブラウザ |
| 8 | SQLインジェクション | libinjection + regexパターン |
| 9 | XSS | libinjection + regexパターン |
| 10 | RCE / コマンドインジェクション | OSコマンドインジェクションパターン |
| 11 | ディレクトリトラバーサル | パストラバーサル（`../`）検出 |
| 14 | 機密データ | Aho-Corasickマルチパターン PII/認証情報検出 |
| 15 | アンチホットリンク | ホストごとのRefererベース検証 |
| 16 | CrowdSec | バウンサー決定 + AppSec検査 |

## ルールの更新

付属ツールを使用して上流ソースからルールを同期できます：

```bash
# Check for updates
python rules/tools/sync.py --check

# Sync OWASP CRS to a specific release
python rules/tools/sync.py --source owasp-crs --output rules/owasp-crs/ --tag v4.10.0

# Sync to latest
python rules/tools/sync.py --source owasp-crs --output rules/owasp-crs/

# Hot-reload after updating
prx-waf rules reload
```

## ルール統計

CLIで現在のルール統計を表示：

```bash
prx-waf rules stats
```

出力例：

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

## 次のステップ

- [カスタムルール](./custom-rules) -- 独自のルールを作成する
- [YAML構文](./yaml-syntax) -- 完全なルールスキーマリファレンス
- [ルールエンジン概要](./index) -- パイプラインがルールを評価する方法
