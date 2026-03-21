---
title: イベントバス
description: PRX のトピックベース pub/sub、ワイルドカードサブスクリプション、配信保証を持つプラグイン間イベントバス
---

# イベントバス

PRX イベントバスは、トピックベースのパブリッシュ/サブスクライブメカニズムを通じて、プラグインとホストシステム間の通信を可能にします。プラグインはイベントの発行、トピックへのサブスクライブ、ライフサイクルイベントへの反応が可能で、コンポーネント間の直接的な結合なしに実現されます。

## 概要

イベントバスは以下を提供します:

- **トピックベースのルーティング** -- イベントは階層的なトピックに発行され、一致するサブスクライバーに配信
- **ワイルドカードサブスクリプション** -- glob スタイルパターンでトピックサブツリー全体にサブスクライブ
- **ペイロード制限** -- リソース悪用防止のため、イベントペイロードは最大 64 KB
- **再帰保護** -- 無限ループ防止のため、イベントトリガーイベントの深さは最大 8 レベル
- **最大一回配信** -- イベントは永続化やリトライなしでサブスクライバーに配信

## トピック構造

トピックは `prx.` 名前空間の下で、階層的なドット区切りの命名規則に従います:

```
prx.<category>.<event>
```

### 組み込みトピック

| トピック | 発行元 | 説明 |
|-------|-------------|-------------|
| `prx.lifecycle.started` | ホスト | PRX が起動し、すべてのコンポーネントが初期化された |
| `prx.lifecycle.stopping` | ホスト | PRX がシャットダウン中。プラグインはクリーンアップすべき |
| `prx.lifecycle.config_reloaded` | ホスト | 設定がホットリロードされた |
| `prx.session.created` | ホスト | 新しいエージェントセッションが作成された |
| `prx.session.terminated` | ホスト | エージェントセッションが終了した |
| `prx.session.message` | ホスト | セッションでメッセージが送受信された |
| `prx.channel.connected` | ホスト | チャネルが接続を確立した |
| `prx.channel.disconnected` | ホスト | チャネルが接続を失った |
| `prx.channel.error` | ホスト | チャネルでエラーが発生した |
| `prx.tool.before_execute` | ホスト | ツールが実行される直前（インターセプト可能） |
| `prx.tool.after_execute` | ホスト | ツールの実行が完了した |
| `prx.plugin.loaded` | ホスト | プラグインがロードされた |
| `prx.plugin.unloaded` | ホスト | プラグインがアンロードされた |
| `prx.evolution.proposed` | ホスト | 自己進化の提案が生成された |
| `prx.evolution.applied` | ホスト | 自己進化の変更が適用された |
| `prx.evolution.rolled_back` | ホスト | 自己進化の変更がロールバックされた |
| `prx.memory.stored` | ホスト | メモリエントリが保存された |
| `prx.memory.recalled` | ホスト | コンテキストのためにメモリがリコールされた |
| `prx.cron.tick` | ホスト | cron ハートビートが発生した |

### カスタムトピック

プラグインは独自の名前空間でカスタムトピックに発行できます:

```
prx.plugin.<plugin_name>.<event>
```

例えば、天気プラグインは以下を発行する可能性があります:

```
prx.plugin.weather.forecast_updated
prx.plugin.weather.alert_issued
```

## サブスクリプションパターン

### 完全一致

特定の単一トピックにサブスクライブ:

```rust
event_bus.subscribe("prx.session.created", handler);
```

### ワイルドカードマッチ

`*`（単一レベル）または `**`（複数レベル）を使用してサブツリーの全トピックにサブスクライブ:

```rust
// すべてのセッションイベント
event_bus.subscribe("prx.session.*", handler);

// すべてのライフサイクルイベント
event_bus.subscribe("prx.lifecycle.*", handler);

// 特定プラグインのすべてのイベント
event_bus.subscribe("prx.plugin.weather.*", handler);

// すべてのイベント（慎重に使用）
event_bus.subscribe("prx.**", handler);
```

| パターン | マッチする | マッチしない |
|---------|---------|---------------|
| `prx.session.*` | `prx.session.created`、`prx.session.terminated` | `prx.session.message.sent` |
| `prx.session.**` | `prx.session.created`、`prx.session.message.sent` | `prx.channel.connected` |
| `prx.*.connected` | `prx.channel.connected` | `prx.channel.error` |
| `prx.**` | `prx.` 配下のすべて | `prx.` 名前空間外のトピック |

## イベント構造

各イベントは以下を含みます:

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `topic` | `String` | 完全なトピックパス（例: `prx.session.created`） |
| `payload` | `Vec<u8>` | シリアライズされたイベントデータ（慣例により JSON、最大 64 KB） |
| `source` | `String` | 発行者の ID（例: `host`、`plugin:weather`） |
| `timestamp` | `u64` | Unix タイムスタンプ（ミリ秒） |
| `correlation_id` | `Option<String>` | 関連イベントのトレース用オプション ID |

### ペイロードフォーマット

ペイロードは慣例により JSON としてシリアライズされます。各トピックは独自のペイロードスキーマを定義します。例えば:

**`prx.session.created`:**

```json
{
  "session_id": "sess_abc123",
  "channel": "telegram",
  "user_id": "user:telegram:123456789"
}
```

**`prx.tool.after_execute`:**

```json
{
  "session_id": "sess_abc123",
  "tool_name": "shell",
  "command": "ls -la /tmp",
  "duration_ms": 45,
  "success": true
}
```

## 設定

```toml
[plugins.event_bus]
enabled = true
max_payload_bytes = 65536           # 64 KB
max_recursion_depth = 8             # 無限イベントループ防止
max_subscribers_per_topic = 64      # トピックあたりのサブスクライバー制限
channel_capacity = 1024             # 内部イベントキュー容量
delivery_timeout_ms = 5000          # 低速サブスクライバーのタイムアウト
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | イベントバスの有効化/無効化 |
| `max_payload_bytes` | `usize` | `65536` | 最大イベントペイロードサイズ（64 KB） |
| `max_recursion_depth` | `u8` | `8` | イベントトリガーチェーンの最大深度 |
| `max_subscribers_per_topic` | `usize` | `64` | 完全一致トピックあたりの最大サブスクライバー数 |
| `channel_capacity` | `usize` | `1024` | イベントキューの有界チャネル容量 |
| `delivery_timeout_ms` | `u64` | `5000` | サブスクライバーがイベントを処理する最大待機時間 |

## プラグインでのイベントバスの使用

### PDK（プラグイン開発キット）

PRX PDK は WASM プラグイン内でのイベントバス操作のためのヘルパー関数を提供します:

```rust
use prx_pdk::event_bus;

// イベントにサブスクライブ
event_bus::subscribe("prx.session.created", |event| {
    let payload: SessionCreated = serde_json::from_slice(&event.payload)?;
    log::info!("New session: {}", payload.session_id);
    Ok(())
})?;

// イベントを発行
let payload = serde_json::to_vec(&MyEvent { data: "hello" })?;
event_bus::publish("prx.plugin.my_plugin.my_event", &payload)?;
```

### プラグインマニフェストでのサブスクリプション宣言

プラグインはマニフェストファイルでサブスクリプションを宣言します:

```toml
# plugin.toml
[plugin]
name = "my-plugin"
version = "1.0.0"

[permissions]
event_bus_subscribe = [
    "prx.session.*",
    "prx.tool.after_execute",
]
event_bus_publish = [
    "prx.plugin.my_plugin.*",
]
```

ホストはこれらの権限宣言を適用します。プラグインは宣言された権限の範囲外のトピックにサブスクライブまたは発行することはできません。

## 配信保証

イベントバスは**最大一回**配信を提供します:

- イベントはすべての一致するサブスクライバーに非同期でディスパッチされる
- サブスクライバーが低速または無応答の場合、`delivery_timeout_ms` 後にイベントはドロップされる
- 内部イベントキューが満杯（`channel_capacity` 到達）の場合、新しいイベントは警告と共にドロップされる
- 永続化、リトライ、確認応答のメカニズムはない

保証された配信が必要なユースケースでは、Webhook システムまたは外部メッセージキューの使用を検討してください。

## 再帰保護

イベントハンドラが別のイベントを発行すると、チェーンが作成されます。イベントバスは再帰深度を追跡し、`max_recursion_depth` を適用します:

```
prx.session.created           <- depth 0
  -> handler publishes prx.plugin.audit.session_log    <- depth 1
    -> handler publishes prx.plugin.metrics.counter     <- depth 2
      -> ...
```

深度が制限を超えると、イベントはドロップされ警告がログに記録されます:

```
WARN event_bus: Recursion depth 8 exceeded for topic prx.plugin.metrics.counter, event dropped
```

## ツール実行のインターセプト

`prx.tool.before_execute` イベントはインターセプトをサポートします。サブスクライバーは実行前にツール呼び出しを変更またはキャンセルできます:

```rust
event_bus::subscribe("prx.tool.before_execute", |event| {
    let mut payload: ToolBeforeExecute = serde_json::from_slice(&event.payload)?;

    // 危険なコマンドをブロック
    if payload.tool_name == "shell" && payload.args.contains("rm -rf") {
        return Err(EventBusError::Rejected("Dangerous command blocked".into()));
    }

    Ok(())
})?;
```

いずれかのサブスクライバーがエラーを返すと、ツールの実行はキャンセルされ、エラーがエージェントに報告されます。

## モニタリング

### CLI

```bash
# 最近のイベントバスアクティビティを表示
prx events --tail 50

# トピックパターンでフィルタ
prx events --topic "prx.session.*"

# イベントペイロードを表示
prx events --verbose

# サブスクライバー数を表示
prx events stats
```

### メトリクス

イベントバスは Prometheus メトリクスを公開します:

| メトリクス | タイプ | 説明 |
|--------|------|-------------|
| `prx_event_bus_published_total` | Counter | トピック別の発行イベント総数 |
| `prx_event_bus_delivered_total` | Counter | サブスクライバーに配信されたイベント総数 |
| `prx_event_bus_dropped_total` | Counter | ドロップされたイベント数（キュー満杯、タイムアウト、再帰） |
| `prx_event_bus_delivery_duration_seconds` | Histogram | サブスクライバーへのイベント配信時間 |
| `prx_event_bus_subscribers` | Gauge | トピック別の現在のサブスクライバー数 |

## 制限事項

- 最大一回配信のため、キューが満杯またはサブスクライバーが低速な場合にイベントが失われる可能性
- イベントバスは PRX プロセスにローカル。ノード間でイベントは分散されない
- ペイロードサイズは 64 KB に制限。大きなデータはエンベッドではなく ID で参照すべき
- ワイルドカードサブスクリプション（特に `prx.**`）は大きな負荷を発生させる可能性。慎重に使用
- プラグインのイベントハンドラは WASM サンドボックスで実行され、ファイルシステムやネットワークに直接アクセスできない
- イベントの順序はベストエフォート。高負荷時にサブスクライバーはイベントを順序どおりに受信しない可能性

## 関連ページ

- [プラグインシステム概要](./)
- [プラグインアーキテクチャ](./architecture) -- WASM ランタイムとホスト-ゲスト境界
- [開発者ガイド](./developer-guide) -- PDK でのプラグイン構築
- [ホスト関数](./host-functions) -- プラグインが利用可能なホスト関数
- [Webhook](../gateway/webhooks) -- 外部システムへの保証された配信
