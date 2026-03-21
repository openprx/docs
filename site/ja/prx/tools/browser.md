---
title: ブラウザツール
description: Web ナビゲーション、フォーム操作、スクリーンショット、ドメイン制限ブラウジングのためのプラガブルバックエンドによるフルブラウザオートメーション。
---

# ブラウザツール

ブラウザツールは、PRX エージェントにフル Web オートメーション機能を提供します -- ページナビゲーション、フォーム入力、要素クリック、コンテンツ抽出、スクリーンショットキャプチャ。3 つのオートメーションエンジンをサポートするプラガブルバックエンドアーキテクチャを使用し、無制限の Web アクセスを防ぐためにドメイン制限を強制します。

ブラウザツールはフィーチャーゲートされており、設定で `browser.enabled = true` が必要です。有効にすると、PRX はツールレジストリに `browser` と `browser_open` を登録します。ブラウザツールは複雑な複数ステップの Web ワークフローをサポートし、`browser_open` は URL を開いてコンテンツを抽出するためのシンプルなインターフェースを提供します。

PRX には、ビジュアルタスク用のブラウザツールを補完するビジョン関連ツール（`screenshot`、`image`、`image_info`）も含まれています。ブラウザツールでキャプチャしたスクリーンショットは、ビジュアル推論のためにビジョン対応 LLM に渡すことができます。

## 設定

```toml
[browser]
enabled = true
backend = "agent_browser"       # "agent_browser" | "rust_native" | "computer_use"
allowed_domains = ["github.com", "docs.rs", "*.openprx.dev", "stackoverflow.com"]
session_name = "default"        # 永続状態のための名前付きブラウザセッション
```

### バックエンドオプション

| バックエンド | 説明 | 依存関係 | 最適な用途 |
|---------|------------|-------------|----------|
| `agent_browser` | 外部ヘッドレスブラウザツールの `agent-browser` CLI を呼び出す | PATH 上の `agent-browser` バイナリ | 一般的な Web オートメーション、JavaScript の多いサイト |
| `rust_native` | ヘッドレス Chrome/Chromium を使用する組み込み Rust ブラウザ実装 | Chromium がインストール済み | 軽量オートメーション、外部依存なし |
| `computer_use` | フルデスクトップ操作のための computer-use サイドカー | Anthropic computer-use サイドカー | OS レベルのインタラクション、複雑な GUI ワークフロー |

### ドメイン制限

`allowed_domains` リストはブラウザがアクセスできるドメインを制御します。ドメインマッチングは以下をサポート:

- **完全一致**: `"github.com"` は `github.com` のみにマッチ
- **サブドメインワイルドカード**: `"*.openprx.dev"` は `docs.openprx.dev`、`api.openprx.dev` などにマッチ
- **ワイルドカードなし**: 空のリストはすべてのブラウザナビゲーションをブロック

```toml
[browser]
allowed_domains = [
  "github.com",
  "*.github.com",
  "docs.rs",
  "crates.io",
  "stackoverflow.com",
  "*.openprx.dev"
]
```

## 使用方法

### browser ツール

メインの `browser` ツールは複雑な Web ワークフローのための複数のアクションをサポート:

**URL に移動:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "navigate",
    "url": "https://github.com/openprx/prx"
  }
}
```

**フォームフィールドに入力:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "fill",
    "selector": "#search-input",
    "value": "PRX documentation"
  }
}
```

**要素をクリック:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "click",
    "selector": "button[type='submit']"
  }
}
```

**スクリーンショットを撮影:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "screenshot"
  }
}
```

**ページコンテンツを抽出:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "content"
  }
}
```

### browser_open ツール

URL を開いてコンテンツを返すシンプル化されたツール:

```json
{
  "name": "browser_open",
  "arguments": {
    "url": "https://docs.rs/tokio/latest/tokio/"
  }
}
```

### マルチステップワークフローの例

典型的なリサーチワークフローでは複数のブラウザアクションを連鎖:

1. 検索エンジンに移動
2. 検索ボックスにクエリを入力
3. 検索ボタンをクリック
4. ページから結果を抽出
5. 関連する結果に移動
6. 詳細コンテンツを抽出
7. 視覚参照用にスクリーンショットを撮影

## パラメーター

### browser パラメーター

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `action` | `string` | はい | -- | 実行するアクション: `"navigate"`、`"fill"`、`"click"`、`"screenshot"`、`"content"`、`"scroll"`、`"wait"`、`"back"`、`"forward"` |
| `url` | `string` | 条件付き | -- | 移動先の URL（`"navigate"` アクションで必須） |
| `selector` | `string` | 条件付き | -- | ターゲット要素の CSS セレクター（`"fill"`、`"click"` で必須） |
| `value` | `string` | 条件付き | -- | 入力する値（`"fill"` アクションで必須） |
| `timeout_ms` | `integer` | いいえ | `30000` | アクション完了の最大待ち時間 |

### browser_open パラメーター

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `url` | `string` | はい | -- | 開いてコンテンツを抽出する URL |

### ビジョンツールパラメーター

**screenshot:**

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `target` | `string` | いいえ | `"screen"` | キャプチャ対象: `"screen"` またはウィンドウ識別子 |

**image:**

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `action` | `string` | はい | -- | 画像操作: `"resize"`、`"crop"`、`"convert"` |
| `path` | `string` | はい | -- | 画像ファイルのパス |

**image_info:**

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `path` | `string` | はい | -- | 検査する画像ファイルのパス |

## バックエンドの詳細

### agent-browser

`agent_browser` バックエンドは外部の `agent-browser` CLI ツールに委任し、ヘッドレス Chrome ベースのオートメーション環境を提供します。通信は JSON-RPC メッセージを使用した stdio で行われます。

利点:
- 完全な JavaScript 実行
- Cookie とセッションの永続性
- 拡張機能のサポート

### rust_native

`rust_native` バックエンドは Rust バインディングを使用してローカルの Chromium/Chrome インストールを直接制御します。Chrome DevTools Protocol（CDP）で通信します。

利点:
- 外部バイナリ依存なし（Chromium を除く）
- サブプロセス起動よりも低レイテンシ
- PRX 内部とのより緊密な統合

### computer_use

`computer_use` バックエンドは Anthropic の computer-use サイドカーを活用し、マウス移動、キーボード入力、画面キャプチャを含む OS レベルのインタラクションを実行します。ブラウザオートメーションを超えてフルデスクトップ制御を提供します。

利点:
- ブラウザだけでなくネイティブアプリケーションとインタラクション可能
- 複雑な GUI ワークフローをサポート
- ポップアップ、ファイルダイアログ、システムプロンプトを処理

## セキュリティ

### ドメインホワイトリスト

ブラウザツールは厳格なドメインホワイトリストを強制します。任意の URL に移動する前に:

1. URL がパースされ、ホスト名が抽出される
2. ホスト名が `allowed_domains` に対してチェックされる
3. 一致が見つからない場合、ナビゲーションがブロックされエラーが返される

これにより、エージェントが任意の Web サイトにアクセスすることを防ぎ、悪意のあるコンテンツへの露出や認証済みセッションでの意図しないアクションのトリガーを防止します。

### セッション分離

ブラウザセッションは名前によって分離されます。異なるエージェントセッションやサブエージェントは、状態の漏洩（Cookie、localStorage、セッションデータ）を防ぐために別々のブラウザコンテキストを使用できます。

### コンテンツ抽出制限

ページコンテンツの抽出は、過度に大きなページによるメモリ枯渇を防ぐために `web_search.fetch_max_chars` 制限の対象です。

### ポリシーエンジン

ブラウザツールの呼び出しはセキュリティポリシーエンジンを通過します。ツールを完全に拒否するか、ナビゲーションごとに承認を要求する supervised にできます:

```toml
[security.tool_policy.tools]
browser = "supervised"
browser_open = "allow"
```

### 資格情報の安全性

ブラウザツールはブラウザセッションに資格情報や認証トークンを注入しません。エージェントが Web サイトで認証する必要がある場合、ブラウザツールを使用してログインフォームに明示的に入力する必要があり、これは監視ポリシーの対象です。

## 関連

- [Web 検索](/ja/prx/tools/web-search) -- ブラウザオートメーションなしで Web を検索
- [HTTP リクエスト](/ja/prx/tools/http-request) -- API へのプログラマティック HTTP リクエスト
- [シェル実行](/ja/prx/tools/shell) -- CLI ベースの Web インタラクション（curl、wget）の代替
- [セキュリティサンドボックス](/ja/prx/security/sandbox) -- ツール実行のプロセス分離
- [設定リファレンス](/ja/prx/config/reference) -- `[browser]` 設定フィールド
- [ツール概要](/ja/prx/tools/) -- 全ツールとレジストリシステム
