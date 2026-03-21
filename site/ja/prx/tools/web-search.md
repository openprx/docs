---
title: Web 検索
description: DuckDuckGo（無料、API キー不要）または Brave Search（API キー必要）を通じた Web 検索。設定可能な結果数制限とタイムアウト付き。
---

# Web 検索

`web_search_tool` は、PRX エージェントが Web で最新情報を検索できるようにします。2 つの検索プロバイダー -- DuckDuckGo（無料、API キー不要）と Brave Search（API キー必要） -- をサポートし、最近のイベントに関する質問への回答、ドキュメントの検索、トピックの調査に使用できる構造化された検索結果を返します。

Web 検索はフィーチャーゲートされており、設定で `web_search.enabled = true` が必要です。有効にすると、PRX は検索結果で見つかった URL からフルページコンテンツを抽出するための `web_fetch` ツールもオプションで登録します。

`web_search_tool` と `web_fetch` の組み合わせにより、エージェントは完全な Web リサーチパイプラインを利用できます: 関連ページを検索し、最も有望な結果からコンテンツを取得して抽出します。

## 設定

```toml
[web_search]
enabled = true
provider = "duckduckgo"      # "duckduckgo"（無料）または "brave"（API キー必要）
max_results = 5              # 検索あたりの最大結果数（1-10）
timeout_secs = 10            # リクエストタイムアウト（秒）

# Brave Search（API キー必要）
# provider = "brave"
# brave_api_key = "BSA-xxxxxxxxxxxx"

# Web fetch（ページコンテンツ抽出）
fetch_enabled = true         # web_fetch ツールを有効化
fetch_max_chars = 50000      # web_fetch が返す最大文字数
```

### プロバイダー比較

| 機能 | DuckDuckGo | Brave Search |
|---------|-----------|-------------|
| コスト | 無料 | 無料枠（月 2000 クエリ）、有料プランあり |
| API キー | 不要 | 必要（`brave_api_key`） |
| 結果品質 | 一般的なクエリに良好 | 高品質、より構造化 |
| レート制限 | 暗黙的（スロットリングの可能性あり） | 明示的（プランに基づく） |
| プライバシー | プライバシー重視 | プライバシー重視 |
| 構造化データ | 基本（タイトル、URL、スニペット） | リッチ（タイトル、URL、スニペット、追加説明） |

### プロバイダーの選択

- **DuckDuckGo** がデフォルトで、`enabled = true` 以外の設定なしですぐに動作します。ほとんどのユースケースに適しており、アカウントや API キーを必要としません。
- **Brave Search** はより高品質な結果とリッチなメタデータを提供します。検索品質が重要な場合や、信頼性の高いコンテンツ抽出のために `web_fetch` ツールが必要な場合に使用してください。

## 使用方法

### web_search_tool

検索ツールはタイトル、URL、スニペットを含む結果リストを返します:

```json
{
  "name": "web_search_tool",
  "arguments": {
    "query": "Rust async runtime comparison tokio vs async-std 2026",
    "max_results": 5
  }
}
```

**レスポンス例:**

```json
{
  "success": true,
  "output": "1. Comparing Tokio and async-std in 2026 - https://blog.example.com/rust-async\n   Snippet: A detailed comparison of the two main Rust async runtimes...\n\n2. Tokio documentation - https://docs.rs/tokio\n   Snippet: Tokio is an asynchronous runtime for Rust...\n\n..."
}
```

### web_fetch

検索で関連 URL を見つけた後、エージェントはコンテンツを取得して抽出できます:

```json
{
  "name": "web_fetch",
  "arguments": {
    "url": "https://blog.example.com/rust-async"
  }
}
```

`web_fetch` ツールの処理:

1. `browser.allowed_domains` に対して URL ドメインを検証
2. ページコンテンツを取得
3. 読みやすいテキストを抽出（HTML、スクリプト、スタイルを除去）
4. `fetch_max_chars` に切り詰め
5. 抽出されたコンテンツを返す

::: warning
`web_fetch` には `web_search.fetch_enabled = true` **および** `browser.allowed_domains` の設定が必要です。取得する URL は許可されたドメインの 1 つに一致する必要があります。
:::

## パラメーター

### web_search_tool パラメーター

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `query` | `string` | はい | -- | 検索クエリ文字列 |
| `max_results` | `integer` | いいえ | 設定値（`5`） | 返す結果の最大数（1-10） |

**戻り値:**

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `success` | `bool` | 検索が完了した場合 `true` |
| `output` | `string` | タイトル、URL、スニペットを含むフォーマット済み検索結果 |
| `error` | `string?` | 検索が失敗した場合のエラーメッセージ（タイムアウト、プロバイダーエラーなど） |

### web_fetch パラメーター

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `url` | `string` | はい | -- | コンテンツを取得して抽出する URL |

**戻り値:**

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `success` | `bool` | ページが取得され解析された場合 `true` |
| `output` | `string` | 抽出されたテキストコンテンツ、`fetch_max_chars` に切り詰め |
| `error` | `string?` | 取得が失敗した場合のエラーメッセージ（ドメイン不許可、タイムアウトなど） |

## 典型的なリサーチワークフロー

完全な Web リサーチワークフローは通常以下のパターン:

1. **検索**: エージェントが `web_search_tool` で関連ページを検索
2. **評価**: エージェントが検索スニペットをレビューして最も関連性の高い結果を特定
3. **取得**: エージェントが `web_fetch` で選択したページからフルコンテンツを抽出
4. **統合**: エージェントが複数のソースからの情報を組み合わせてレスポンスを作成

```
エージェントの思考: ユーザーが最新の Rust リリース機能について質問した。
  1. [web_search_tool] query="Rust 1.82 release features changelog"
  2. [結果をレビューして上位 2 URL を選択]
  3. [web_fetch] url="https://blog.rust-lang.org/2026/..."
  4. [web_fetch] url="https://releases.rs/docs/1.82.0/"
  5. [取得したコンテンツからレスポンスを統合]
```

## セキュリティ

### プロバイダー資格情報

- **DuckDuckGo**: 資格情報不要。クエリは DuckDuckGo の API エンドポイントに送信されます。
- **Brave Search**: `brave_api_key` は設定ファイルに保存されます。PRX の暗号化シークレットストアで保護してください:

```toml
[web_search]
brave_api_key = "enc:xxxxxxxxxxxxx"  # ChaCha20-Poly1305 で暗号化
```

### web_fetch のドメイン制限

`web_fetch` ツールは `browser.allowed_domains` リストを尊重します。これにより、エージェントが任意の URL からコンテンツを取得することを防ぎ、以下を防止します:

- Web ページ経由でエージェントを悪意のあるコンテンツ（プロンプトインジェクション）にさらすこと
- エージェントが内部 URL を取得した場合のサーバーサイドリクエストフォージェリ（SSRF）
- 攻撃者が制御するドメインへの DNS または HTTP リクエストを通じた情報漏洩

```toml
[browser]
allowed_domains = ["docs.rs", "crates.io", "github.com", "*.rust-lang.org"]
```

### タイムアウト保護

検索と取得の両操作には、遅い、または応答のないサーバーでのハングを防ぐための設定可能なタイムアウトがあります:

- `web_search.timeout_secs`（デフォルト: 10 秒） -- 検索クエリタイムアウト
- ネットワークレベルのタイムアウトは `web_fetch` にも適用

### コンテンツサイズ制限

`fetch_max_chars` 設定（デフォルト: 50,000 文字）は、非常に大きな Web ページによるメモリ枯渇を防ぎます。この制限を超えるコンテンツは切り詰められます。

### ポリシーエンジン

Web 検索ツールはセキュリティポリシーエンジンを通過します:

```toml
[security.tool_policy.tools]
web_search_tool = "allow"
web_fetch = "supervised"     # 取得前に承認を要求
```

## 関連

- [HTTP リクエスト](/ja/prx/tools/http-request) -- API へのプログラマティック HTTP リクエスト
- [ブラウザツール](/ja/prx/tools/browser) -- JavaScript の多いサイト向けフルブラウザオートメーション
- [設定リファレンス](/ja/prx/config/reference) -- `[web_search]` と `[browser]` フィールド
- [シークレット管理](/ja/prx/security/secrets) -- API キーの暗号化ストレージ
- [ツール概要](/ja/prx/tools/) -- 全ツールとレジストリシステム
