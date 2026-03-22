---
title: カスタムルール
description: "PRX-WAF用のカスタム検出ルールを作成。アクセス制御、ボットブロッキング、レート制限、アプリケーション固有の保護のサンプルを含むステップバイステップガイド。"
---

# カスタムルール

PRX-WAFでは特定のアプリケーションに合わせたカスタム検出ルールを簡単に作成できます。カスタムルールはYAMLで作成され、`rules/custom/`ディレクトリに配置します。

## はじめに

1. `rules/custom/`に新しいYAMLファイルを作成：

```bash
cp rules/custom/example.yaml rules/custom/myapp.yaml
```

2. [YAMLルールスキーマ](./yaml-syntax)に従ってファイルを編集。

3. デプロイ前に検証：

```bash
python rules/tools/validate.py rules/custom/myapp.yaml
```

4. ルールは自動的にホットリロードされます。または手動でリロードをトリガー：

```bash
prx-waf rules reload
```

## サンプル：内部パスへのアクセスをブロック

内部APIエンドポイントへの外部アクセスを防止：

```yaml
version: "1.0"
description: "Block access to internal paths"

rules:
  - id: "CUSTOM-ACCESS-001"
    name: "Block internal API endpoints"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/(internal|_debug|_profiler|actuator)/"
    action: "block"
    tags: ["custom", "access-control"]
```

## サンプル：不審なUser-Agentを検出

監視のために自動化ツールからのリクエストをログ：

```yaml
  - id: "CUSTOM-BOT-001"
    name: "Log suspicious automated tool user-agents"
    category: "scanner"
    severity: "medium"
    paranoia: 2
    field: "user_agent"
    operator: "regex"
    value: "(?i)(masscan|zgrab|python-requests/|go-http-client|curl/)"
    action: "log"
    tags: ["custom", "bot", "scanner"]
```

## サンプル：クエリパラメーターによるレート制限

過剰なクエリパラメーターを持つリクエストをブロック（DoS攻撃に一般的）：

```yaml
  - id: "CUSTOM-DOS-001"
    name: "Block excessive query parameters"
    category: "dos"
    severity: "medium"
    paranoia: 1
    field: "query_arg_count"
    operator: "gt"
    value: "50"
    action: "block"
    tags: ["custom", "dos"]
```

## サンプル：特定のファイル拡張子をブロック

バックアップや設定ファイルへのアクセスを防止：

```yaml
  - id: "CUSTOM-FILE-001"
    name: "Block access to backup and config files"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)\\.(bak|backup|old|orig|sql|tar|gz|zip|7z|rar|conf|env|ini|log)$"
    action: "block"
    tags: ["custom", "access-control", "file-extension"]
```

## サンプル：クレデンシャルスタッフィングを検出

高速なログイン試行を検出（内蔵レートリミッターと組み合わせて有効）：

```yaml
  - id: "CUSTOM-AUTH-001"
    name: "Log login endpoint access for monitoring"
    category: "access-control"
    severity: "low"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/(api/)?(login|signin|authenticate|auth/token)"
    action: "log"
    tags: ["custom", "authentication", "monitoring"]
```

## サンプル：CVE仮想パッチ

特定の脆弱性に対する即時仮想パッチを作成：

```yaml
  - id: "CUSTOM-CVE-001"
    name: "Virtual patch for MyApp RCE (CVE-2026-XXXXX)"
    category: "rce"
    severity: "critical"
    paranoia: 1
    field: "body"
    operator: "regex"
    value: "(?i)\\$\\{jndi:(ldap|rmi|dns)://[^}]+\\}"
    action: "block"
    tags: ["custom", "cve", "rce"]
    reference: "https://nvd.nist.gov/vuln/detail/CVE-2026-XXXXX"
```

## 複雑なロジックにRhaiスクリプトを使用

パターンマッチング以上のことを必要とするルールには、PRX-WAFはフェーズ12でRhaiスクリプティングをサポートします：

```rhai
// rules/custom/scripts/geo-block.rhai
// Block requests from specific countries during maintenance
fn check(ctx) {
    let path = ctx.path;
    let country = ctx.geo_country;

    if path.starts_with("/maintenance") && country != "US" {
        return block("Maintenance mode: US-only access");
    }

    allow()
}
```

::: info
Rhaiスクリプトはサンドボックス化された環境で実行されます。ファイルシステム、ネットワーク、またはリクエストコンテキスト外のシステムリソースにアクセスできません。
:::

## ベストプラクティス

1. **`action: log`から始める** -- 早期に誤検知を捕捉するためにブロックする前に監視する。

2. **特定のregexアンカーを使用** -- 誤検知を引き起こす部分マッチを防ぐために`^`と`$`を使用する。

3. **適切なパラノイアレベルを設定** -- ルールが正当なトラフィックにマッチする可能性がある場合、レベル1でブロックする代わりにパラノイアを2または3に設定する。

4. **非キャプチャグループを使用** -- 明確さとパフォーマンスのために`(...)`の代わりに`(?:...)`を使用する。

5. **説明的なタグを追加** -- タグは管理UIに表示され、セキュリティイベントのフィルタリングに役立つ。

6. **参照を含める** -- 関連するCVE、OWASPの記事、または内部ドキュメントへのリンクを持つ`reference`URLを追加する。

7. **正規表現をテスト** -- デプロイ前に正規表現パターンを検証：

```bash
python3 -c "import re; re.compile('your_pattern')"
```

8. **デプロイ前に検証** -- 常にバリデーターを実行：

```bash
python rules/tools/validate.py rules/custom/
```

## CLIでインポート

ファイルやURLからCLIを使用してルールをインポートすることもできます：

```bash
# Import from a local file
prx-waf rules import /path/to/rules.yaml

# Import from a URL
prx-waf rules import https://example.com/rules/custom.yaml

# Validate a rule file
prx-waf rules validate /path/to/rules.yaml
```

## ModSecurityルールのインポート

既存のModSecurity `.conf`ルールをPRX-WAF YAMLフォーマットに変換：

```bash
python rules/tools/modsec2yaml.py input.conf output.yaml
```

::: warning
ModSecurityコンバーターはSecRuleディレクティブの基本サブセット（ARGS、REQUEST_HEADERS、REQUEST_URI、REQUEST_BODY）をサポートしています。チェーンまたはLuaスクリプトを使用する複雑なModSecurityルールはサポートされておらず、手動で書き直す必要があります。
:::

## 次のステップ

- [YAML構文](./yaml-syntax) -- 完全なルールスキーマリファレンス
- [内蔵ルール](./builtin-rules) -- 新しいルールを作成する前に既存ルールを確認する
- [ルールエンジン概要](./index) -- パイプラインでルールがどのように評価されるかを理解する
