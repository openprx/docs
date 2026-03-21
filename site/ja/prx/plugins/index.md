---
title: プラグインシステム
description: エージェント機能を拡張するための PRX WASM ベースプラグインシステムの概要
---

# プラグインシステム

PRX は、コアコードベースを変更することなくエージェント機能を拡張できる WebAssembly（WASM）プラグインシステムをサポートしています。プラグインはホスト関数への制御されたアクセスを持つサンドボックス化された WASM ランタイムで実行されます。

## 概要

プラグインシステムは以下を提供します:

- **サンドボックス実行** -- プラグインはメモリ分離された WASM で実行
- **ホスト関数 API** -- HTTP、ファイルシステム、エージェント状態への制御されたアクセス
- **ホットリロード** -- デーモンを再起動せずにプラグインをロード・アンロード
- **マルチ言語サポート** -- Rust、Go、C、または WASM にコンパイルできる任意の言語でプラグインを作成

## プラグインタイプ

| タイプ | 説明 | 例 |
|------|-------------|---------|
| **ツールプラグイン** | エージェントに新しいツールを追加 | カスタム API 統合 |
| **チャネルプラグイン** | 新しいメッセージングチャネルを追加 | カスタムチャットプラットフォーム |
| **フィルタープラグイン** | メッセージの前処理/後処理 | コンテンツモデレーション |
| **プロバイダープラグイン** | 新しい LLM プロバイダーを追加 | カスタムモデルエンドポイント |

## クイックスタート

```bash
# URL からプラグインをインストール
prx plugin install https://example.com/my-plugin.wasm

# インストール済みプラグインを一覧表示
prx plugin list

# プラグインの有効化/無効化
prx plugin enable my-plugin
prx plugin disable my-plugin
```

## 設定

```toml
[plugins]
enabled = true
directory = "~/.local/share/openprx/plugins"
max_memory_mb = 64
max_execution_time_ms = 5000

[[plugins.registry]]
name = "my-plugin"
path = "~/.local/share/openprx/plugins/my-plugin.wasm"
enabled = true
```

## 関連ページ

- [アーキテクチャ](./architecture)
- [開発者ガイド](./developer-guide)
- [ホスト関数](./host-functions)
- [PDK（プラグイン開発キット）](./pdk)
- [プラグインの例](./examples)
