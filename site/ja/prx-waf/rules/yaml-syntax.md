---
title: YAMLルール構文
description: "PRX-WAF YAMLルールフォーマットの完全リファレンス。スキーマ、フィールドリファレンス、オペレーターリファレンス、アクションリファレンス、注釈付きサンプル。"
---

# YAMLルール構文

このページはPRX-WAFが使用する完全なYAMLルールスキーマを文書化しています。すべてのルールファイルはこの構造に従います。

## ファイル構造

各YAMLルールファイルはトップレベルのメタデータセクションの後にルールのリストが続きます：

```yaml
version: "1.0"                     # Schema version (required)
description: "Short description"   # Human-readable label (required)
source: "OWASP CRS v4.25.0"       # Origin of the rules (optional)
license: "Apache-2.0"             # SPDX license identifier (optional)

rules:
  - <rule>
  - <rule>
```

## ルールスキーマ

`rules`リスト内の各ルールは以下のフィールドを持ちます：

```yaml
- id: "CRS-942100"              # Unique string ID (REQUIRED)
  name: "SQL injection attack"  # Short description (REQUIRED)
  category: "sqli"              # Category tag (REQUIRED)
  severity: "critical"          # Severity level (REQUIRED)
  paranoia: 1                   # Paranoia level 1-4 (optional, default: 1)
  field: "all"                  # Request field to inspect (REQUIRED)
  operator: "regex"             # Match operator (REQUIRED)
  value: "(?i)select.+from"     # Pattern or threshold (REQUIRED)
  action: "block"               # Action on match (REQUIRED)
  tags:                         # String tags (optional)
    - "owasp-crs"
    - "sqli"
  crs_id: 942100                # Original CRS numeric ID (optional)
  reference: "https://..."      # CVE or documentation link (optional)
```

### 必須フィールド

| フィールド | タイプ | 説明 |
|-------|------|-------------|
| `id` | `string` | すべてのルールファイルで一意な識別子。フォーマット：`<PREFIX>-<CATEGORY>-<NNN>` |
| `name` | `string` | 短い人間が読める説明（最大約120文字） |
| `category` | `string` | フィルタリングとレポートのためのカテゴリタグ |
| `severity` | `string` | 以下のいずれか：`critical`、`high`、`medium`、`low`、`info`、`notice`、`warning`、`error`、`unknown` |
| `field` | `string` | 検査するリクエストのどの部分か（フィールドリファレンス参照） |
| `operator` | `string` | 値をどのようにマッチするか（オペレーターリファレンス参照） |
| `value` | `string` | パターン、しきい値、またはワードリストファイル名 |
| `action` | `string` | ルールがマッチしたときに何をするか（アクションリファレンス参照） |

### オプションフィールド

| フィールド | タイプ | デフォルト | 説明 |
|-------|------|---------|-------------|
| `paranoia` | `integer` | `1` | パラノイアレベル1〜4 |
| `tags` | `string[]` | `[]` | フィルタリングとダッシュボード表示のためのタグ |
| `crs_id` | `integer` | -- | 元のOWASP CRS数値ID |
| `reference` | `string` | -- | CVE、OWASPの記事、または根拠へのURL |

## フィールドリファレンス

`field`の値はHTTPリクエストのどの部分を検査するかを決定します：

| フィールド | 検査対象 |
|-------|----------|
| `path` | リクエストURIパス（クエリ文字列なし） |
| `query` | クエリ文字列（すべてのパラメーター、デコード済み） |
| `body` | リクエストボディ（デコード済み） |
| `headers` | すべてのリクエストヘッダー（name: valueペア） |
| `user_agent` | User-Agentヘッダーのみ |
| `cookies` | リクエストクッキー |
| `method` | HTTPメソッド（GET、POST、PUTなど） |
| `content_type` | Content-Typeヘッダー |
| `content_length` | Content-Length値（数値比較用） |
| `path_length` | URIパスの長さ（数値比較用） |
| `query_arg_count` | クエリパラメーター数（数値比較用） |
| `all` | 上記すべてのフィールドを結合 |

## オペレーターリファレンス

`operator`の値は`value`が検査フィールドに対してどのようにマッチするかを決定します：

| オペレーター | 説明 | 値フォーマット |
|----------|-------------|--------------|
| `regex` | PCRE互換正規表現 | 正規表現パターン |
| `contains` | フィールドがリテラル文字列を含む | リテラル文字列 |
| `equals` | フィールドが値に完全一致（大文字小文字を区別） | リテラル文字列 |
| `not_in` | フィールド値がリストに含まれない | カンマ区切りリスト |
| `gt` | フィールド値（数値）がより大きい | 数値文字列 |
| `lt` | フィールド値（数値）がより小さい | 数値文字列 |
| `ge` | フィールド値（数値）が以上 | 数値文字列 |
| `le` | フィールド値（数値）が以下 | 数値文字列 |
| `detect_sqli` | libinjectionによるSQLインジェクション検出 | `"true"`または`""` |
| `detect_xss` | libinjectionによるXSS検出 | `"true"`または`""` |
| `pm_from_file` | ワードリストファイルに対するフレーズマッチ | `owasp-crs/data/`内のファイル名 |
| `pm` | インラインリストに対するフレーズマッチ | カンマ区切りフレーズ |

## アクションリファレンス

`action`の値はルールがマッチしたときに何が起こるかを決定します：

| アクション | 説明 |
|--------|-------------|
| `block` | 403 Forbiddenレスポンスでリクエストを拒否 |
| `log` | リクエストを許可するがマッチをログに記録（監視モード） |
| `allow` | リクエストを明示的に許可（他のルールを上書き） |
| `deny` | `block`のエイリアス |
| `redirect` | リクエストをリダイレクト（エンジン固有の設定） |
| `drop` | 接続をサイレントにドロップ |

::: tip
`action: block`に切り替える前に誤検知を監視するために、新しいルールは`action: log`で始めてください。
:::

## ID名前空間の規則

ルールIDは確立されたプレフィックス規則に従う必要があります：

| ディレクトリ | IDプレフィックス | サンプル |
|-----------|-----------|---------|
| `owasp-crs/` | `CRS-<number>` | `CRS-942100` |
| `modsecurity/` | `MODSEC-<CATEGORY>-<NNN>` | `MODSEC-IP-001` |
| `cve-patches/` | `CVE-<YEAR>-<SHORT>-<NNN>` | `CVE-2021-LOG4J-001` |
| `custom/` | `CUSTOM-<CATEGORY>-<NNN>` | `CUSTOM-API-001` |

## 完全なサンプル

```yaml
version: "1.0"
description: "Application-specific access control rules"
source: "custom"
license: "Apache-2.0"

rules:
  - id: "CUSTOM-API-001"
    name: "Block access to internal admin API"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/internal/"
    action: "block"
    tags: ["custom", "access-control"]

  - id: "CUSTOM-BOT-001"
    name: "Log suspicious automated tool user-agents"
    category: "scanner"
    severity: "medium"
    paranoia: 2
    field: "user_agent"
    operator: "regex"
    value: "(?i)(masscan|zgrab|python-requests/|go-http-client)"
    action: "log"
    tags: ["custom", "bot", "scanner"]

  - id: "CUSTOM-RATE-001"
    name: "Block requests with excessive query parameters"
    category: "dos"
    severity: "medium"
    paranoia: 1
    field: "query_arg_count"
    operator: "gt"
    value: "50"
    action: "block"
    tags: ["custom", "dos"]
```

## ルールの検証

デプロイ前にルールファイルを検証：

```bash
# Validate all rules
python rules/tools/validate.py rules/

# Validate a specific file
python rules/tools/validate.py rules/custom/myapp.yaml
```

バリデーターは以下をチェックします：
- 必須フィールドが存在する
- すべてのファイルで重複するルールIDがない
- severityとactionの値が有効
- パラノイアレベルが1〜4の範囲内
- 正規表現が正しくコンパイルされる
- 数値オペレーターが文字列値で使用されていない

## 次のステップ

- [内蔵ルール](./builtin-rules) -- OWASP CRSとCVEパッチルールを探索する
- [カスタムルール](./custom-rules) -- 独自のルールをステップバイステップで作成する
- [ルールエンジン概要](./index) -- 検出パイプラインがルールを処理する方法
