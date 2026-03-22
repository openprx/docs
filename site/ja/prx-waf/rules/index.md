---
title: ルールエンジン概要
description: "PRX-WAFルールエンジンの仕組み。YAMLベースの宣言型ルール、複数のルールソース、パラノイアレベル、ホットリロード、16フェーズ検出パイプライン。"
---

# ルールエンジン

PRX-WAFは宣言型のYAMLベースのルールエンジンを使用してWebの攻撃を検出・ブロックします。ルールは何を検査するか、どのようにマッチするか、どのアクションを取るかを記述します。エンジンはすべての受信リクエストを16の順次検出フェーズにわたる有効な全ルールに対して評価します。

## ルールの仕組み

各ルールは4つの主要コンポーネントで構成されます：

1. **フィールド** -- リクエストのどの部分を検査するか（パス、クエリ、ボディ、ヘッダーなど）
2. **オペレーター** -- 値をどのようにマッチするか（regex、contains、detect_sqliなど）
3. **値** -- マッチするパターンまたはしきい値
4. **アクション** -- ルールがマッチしたときに何をするか（block、log、allow）

```yaml
- id: "CUSTOM-001"
  name: "Block admin path from external IPs"
  category: "access-control"
  severity: "high"
  field: "path"
  operator: "regex"
  value: "(?i)^/admin"
  action: "block"
```

## ルールソース

PRX-WAFには4カテゴリにわたる398ルールが付属しています：

| ソース | ファイル | ルール数 | 説明 |
|--------|-------|-------|-------------|
| OWASP CRS | 21 | 310 | OWASP ModSecurity Core Rule Set v4（YAMLに変換済み） |
| ModSecurity | 4 | 46 | IPレピュテーション、DoS、データ漏洩のコミュニティルール |
| CVEパッチ | 7 | 39 | Log4Shell、Spring4Shell、MOVEitなどの標的型仮想パッチ |
| カスタム | 1 | 3 | アプリケーション固有ルールのサンプルテンプレート |

さらに、PRX-WAFにはバイナリにコンパイルされた10以上の内蔵検出チェッカーが含まれています：

- SQLインジェクション（libinjection + regex）
- クロスサイトスクリプティング（libinjection + regex）
- リモートコード実行 / コマンドインジェクション
- ローカル/リモートファイルインクルード
- サーバーサイドリクエストフォージェリ（SSRF）
- パス/ディレクトリトラバーサル
- スキャナー検出（Nmap、Niktoなど）
- ボット検出（悪意のあるボット、AIクローラー、ヘッドレスブラウザ）
- プロトコル違反検出
- 機密語検出（Aho-Corasickマルチパターンマッチング）

## ルールフォーマット

PRX-WAFは3つのルールファイルフォーマットをサポートします：

| フォーマット | 拡張子 | 説明 |
|--------|-----------|-------------|
| YAML | `.yaml`、`.yml` | PRX-WAFネイティブフォーマット（推奨） |
| ModSecurity | `.conf` | SecRuleディレクティブ（基本サブセット：ARGS、REQUEST_HEADERS、REQUEST_URI、REQUEST_BODY） |
| JSON | `.json` | ルールオブジェクトのJSON配列 |

完全なスキーマリファレンスについては[YAML構文](./yaml-syntax)を参照してください。

## パラノイアレベル

各ルールはパラノイアレベル（1〜4）を宣言し、マッチの積極性を制御します。レベルが高いほど多くの攻撃を検出しますが、誤検知リスクも高まります。

| レベル | 名称 | 説明 | 誤検知リスク |
|-------|------|-------------|---------------------|
| 1 | デフォルト | 信頼性の高いルール、本番環境向け | 非常に低い |
| 2 | 推奨 | より広いカバレッジ、わずかな誤検知リスク | 低い |
| 3 | 積極的 | 広範なヒューリスティック、チューニングが必要 | 中程度 |
| 4 | 最大 | 推測的なパターンを含むすべて | 高い |

::: tip
本番環境ではパラノイアレベル1から始めてください。ログを監視し、除外をチューニングしてから段階的に高いレベルを有効化してください。
:::

## ホットリロード

PRX-WAFはファイルの変更について`rules/`ディレクトリを監視し、ファイルが作成、変更、または削除されると自動的にルールをリロードします。変更は設定されたデバウンスウィンドウ（デフォルト：500ms）内に有効になります。

手動でリロードをトリガーすることもできます：

```bash
# Via CLI
prx-waf rules reload

# Via SIGHUP (Unix only)
kill -HUP $(pgrep prx-waf)
```

ルールのリロードはアトミックです -- 新しいセットが完全にコンパイルされて準備ができるまで、古いルールセットがトラフィックを処理し続けます。

## ディレクトリレイアウト

```
rules/
├── owasp-crs/          # OWASP CRS v4 (21 files, 310 rules)
│   ├── sqli.yaml       # SQL injection (CRS 942xxx)
│   ├── xss.yaml        # Cross-site scripting (CRS 941xxx)
│   ├── rce.yaml        # Remote code execution (CRS 932xxx)
│   └── ...
├── modsecurity/        # ModSecurity community rules
├── cve-patches/        # CVE virtual patches (Log4Shell, Spring4Shell, etc.)
├── custom/             # Your application-specific rules
└── tools/              # Rule validation and sync utilities
```

## 次のステップ

- [YAML構文](./yaml-syntax) -- 完全なルールスキーマリファレンス
- [内蔵ルール](./builtin-rules) -- OWASP CRSとCVEパッチの詳細なカバレッジ
- [カスタムルール](./custom-rules) -- 独自の検出ルールを作成する
