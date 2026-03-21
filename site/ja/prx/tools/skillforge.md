---
title: Skillforge
description: PRX エージェント機能を拡張するための自動スキル検出、評価、統合パイプライン。
---

# Skillforge

Skillforge は、外部ソースからの新しいスキル（ツール）の検出、評価、統合のための PRX の自動パイプラインです。すべてのツールを手動で設定する代わりに、Skillforge は GitHub リポジトリや Clawhub レジストリをスカウトし、検出されたスキルがエージェントのニーズに適合するかどうかを評価し、統合マニフェストを生成します -- すべて人間の介入なしに。

## 概要

Skillforge パイプラインは 3 つのステージで構成:

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   スカウト    │────▶│   評価       │────▶│  統合        │
│              │     │              │     │              │
│ GitHub、     │     │ フィットネス  │     │ マニフェスト  │
│ Clawhub     │     │ スコアリング、│     │ 生成、       │
│ からスキルを  │     │ セキュリティ  │     │ 設定注入     │
│ 検出         │     │ レビュー     │     │              │
└─────────────┘     └──────────────┘     └──────────────┘
```

| ステージ | トレイト | 責任 |
|-------|-------|----------------|
| **スカウト** | `Scout` | 設定されたソースから候補スキルを検出 |
| **評価** | `Evaluator` | 各候補をフィットネス、セキュリティ、互換性でスコアリング |
| **統合** | `Integrator` | マニフェストを生成し、ツールレジストリにスキルを登録 |

## アーキテクチャ

Skillforge は 3 つのコア非同期トレイト上に構築されています: `Scout`（`SearchCriteria` に一致する候補を検出）、`Evaluator`（候補をフィットネスとセキュリティでスコアリング）、`Integrator`（マニフェストを生成しスキルを登録）。各トレイトには複数の実装が可能で、パイプラインオーケストレーターはそれらを順番に実行し、各ステージで候補をフィルタリングします。

## 設定

```toml
[skillforge]
enabled = true

# 自動検出: 定期的に新しいスキルをスカウト。
auto_discover = false
discover_interval_hours = 24

# スキルを統合するための最小評価スコア（0.0-1.0）。
min_fitness_score = 0.7

# 検出されたスキルを統合する前に手動承認を要求。
require_approval = true

# 検出実行あたりの評価候補の最大数。
max_candidates = 20
```

### スカウトソース

Skillforge がスキルを探す場所を設定:

```toml
[skillforge.sources.github]
enabled = true

# 検索する GitHub リポジトリ。
# 組織/ユーザーパターンとトピックベースの検出をサポート。
search_topics = ["prx-skill", "mcp-server", "ai-tool"]
search_orgs = ["openprx", "modelcontextprotocol"]

# GitHub API 呼び出しのレート制限。
max_requests_per_hour = 30

# 高レート制限のための GitHub トークン（オプション）。
# token = "${GITHUB_TOKEN}"

[skillforge.sources.clawhub]
enabled = true

# Clawhub レジストリエンドポイント。
registry_url = "https://registry.clawhub.dev"

# 検索するカテゴリ。
categories = ["tools", "integrations", "automation"]
```

## スカウトステージ

スカウトは設定されたソースから候補スキルを検出します。各ソースは `Scout` トレイトを異なる方法で実装:

### GitHub スカウト

設定されたトピック、組織、検索クエリに一致する GitHub リポジトリを検索します。一致する各リポジトリについて、スカウトは以下を抽出:

- リポジトリメタデータ（名前、説明、スター数、最終更新日）
- README コンテンツ（機能分析用）
- マニフェストファイル（`prx-skill.toml`、`mcp.json`、`package.json`）
- ライセンス情報

### Clawhub スカウト

Clawhub レジストリ API に公開済みスキルをクエリ。Clawhub は以下を含む構造化メタデータを提供:

- スキル名、バージョン、説明
- 入出力スキーマ
- 依存関係の要件
- 互換性タグ（PRX バージョン、OS、ランタイム）

### 検索条件

```rust
pub struct SearchCriteria {
    /// 目的の機能を説明するキーワード。
    pub keywords: Vec<String>,

    /// 必要なランタイム: "native"、"docker"、"wasm"、または "any"。
    pub runtime: String,

    /// 最小リポジトリスター数（GitHub のみ）。
    pub min_stars: u32,

    /// 最終コミットからの最大経過日数。
    pub max_age_days: u32,

    /// 必要なライセンスタイプ（例: "MIT"、"Apache-2.0"）。
    pub licenses: Vec<String>,
}
```

## 評価ステージ

各候補は Evaluator を通過し、フィットネススコアとセキュリティ評価が生成されます:

### 評価基準

| 基準 | 重み | 説明 |
|-----------|--------|-------------|
| **関連性** | 30% | スキルが検索条件にどれだけ一致するか |
| **品質** | 25% | コード品質のシグナル: テスト、CI、ドキュメント |
| **セキュリティ** | 25% | ライセンス互換性、依存関係の脆弱性監査、安全でないパターンなし |
| **メンテナンス** | 10% | 最近のコミット、アクティブなメンテナー、Issue の応答時間 |
| **互換性** | 10% | PRX バージョン互換性、ランタイム要件の充足 |

### セキュリティチェック

Evaluator は自動セキュリティ分析を実行: ライセンス互換性スキャン、依存関係の脆弱性監査、危険なコードパターン検出（ネットワーク呼び出し、ファイルシステムアクセス、eval）、サンドボックス互換性の検証。

`Evaluation` 構造体には全体的な `fitness_score`（0.0-1.0）、基準ごとのスコア、`security_status`（`safe`/`caution`/`blocked`）、人間可読な要約、懸念事項リストが含まれます。

## 統合ステージ

評価しきい値を通過したスキルは統合ステージに入ります:

### マニフェスト生成

Integrator はスキルのインストールと登録方法を記述する `Manifest` を生成:

```toml
# 生成されたマニフェスト: ~/.local/share/openprx/skills/web-scraper/manifest.toml
[skill]
name = "web-scraper"
version = "1.2.0"
source = "github:example/web-scraper"
runtime = "docker"
fitness_score = 0.85
integrated_at = "2026-03-21T10:30:00Z"

[skill.tool]
name = "web_scrape"
description = "Scrape and extract structured data from web pages."

[skill.tool.parameters]
url = { type = "string", required = true, description = "URL to scrape" }
selector = { type = "string", required = false, description = "CSS selector" }
format = { type = "string", required = false, default = "text", description = "Output format" }

[skill.runtime]
image = "example/web-scraper:1.2.0"
network = "restricted"
timeout_secs = 30
```

### 登録

マニフェストが生成されると、スキルは PRX ツールレジストリに登録されます。`require_approval = true` の場合、マニフェストはレビュー用にステージングされます:

```bash
# 保留中のスキル統合をリスト
prx skillforge pending

# 保留中のスキルをレビュー
prx skillforge review web-scraper

# 統合を承認
prx skillforge approve web-scraper

# 統合を拒否
prx skillforge reject web-scraper --reason "Security concerns"
```

## CLI コマンド

```bash
# 検出実行を手動トリガー
prx skillforge discover

# 特定のキーワードで検出
prx skillforge discover --keywords "web scraping" "data extraction"

# 特定のリポジトリを評価
prx skillforge evaluate github:example/web-scraper

# すべての統合済みスキルをリスト
prx skillforge list

# スキルの詳細を表示
prx skillforge info web-scraper

# 統合済みスキルを削除
prx skillforge remove web-scraper

# すべての統合済みスキルを再評価（更新、セキュリティ問題のチェック）
prx skillforge audit
```

## 自己進化との統合

Skillforge は PRX の[自己進化パイプライン](/ja/prx/self-evolution/pipeline)と統合しています。エージェントが機能のギャップを特定すると、自動的に検出実行をトリガーし -- 一致するスキルのスカウト、評価、（承認された場合の）統合を次のターンのために行います。

## セキュリティに関する注意

- **承認ゲート** -- 本番環境では常に `require_approval = true` を設定。信頼されていないコードの自動統合はセキュリティリスク。
- **サンドボックス強制** -- 統合されたスキルは組み込みツールと同じサンドボックス制約内で実行。サンドボックスバックエンドの設定が必要。
- **ソースの信頼** -- 信頼するスカウトソースのみを有効化。パブリック GitHub 検索は悪意のあるリポジトリを返す可能性がある。
- **マニフェストレビュー** -- 承認前に生成されたマニフェストをレビュー。`runtime`、`network`、`timeout_secs` 設定を確認。
- **監査証跡** -- すべての Skillforge 操作はコンプライアンスレビュー用にアクティビティログに記録。

## 関連ページ

- [ツール概要](/ja/prx/tools/)
- [自己進化パイプライン](/ja/prx/self-evolution/pipeline)
- [セキュリティポリシーエンジン](/ja/prx/security/policy-engine)
- [ランタイムバックエンド](/ja/prx/agent/runtime-backends)
- [MCP 統合](/ja/prx/tools/mcp)
