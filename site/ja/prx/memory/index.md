---
title: メモリシステム
description: 永続的なエージェントコンテキストのための 5 つのストレージバックエンドを持つ PRX メモリシステムの概要
---

# メモリシステム

PRX は、エージェントが会話を跨いでコンテキストを永続化し呼び出すことを可能にする柔軟なメモリシステムを提供します。メモリシステムは 5 つのストレージバックエンドをサポートし、それぞれ異なるデプロイメントシナリオに最適化されています。

## 概要

メモリシステムは 3 つの主要な機能を提供します:

- **リコール** -- 各 LLM 呼び出しの前に、関連する過去のインタラクションやファクトを取得
- **ストア** -- 会話から抽出された重要な情報を永続化
- **コンパクション** -- コンテキスト制限内に収まるよう、古いメモリを要約・圧縮

## ストレージバックエンド

| バックエンド | 永続化 | 検索 | 最適な用途 |
|---------|------------|--------|----------|
| [Markdown](./markdown) | ファイルベース | フルテキスト grep | シングルユーザー CLI、バージョン管理されたメモリ |
| [SQLite](./sqlite) | ローカルデータベース | FTS5 全文検索 | ローカルデプロイメント、小規模チーム |
| [PostgreSQL](./postgres) | リモートデータベース | pg_trgm + FTS | マルチユーザーサーバーデプロイメント |
| [エンベディング](./embeddings) | ベクトルストア | セマンティック類似度 | RAG スタイルの検索、大規模知識ベース |
| インメモリ | なし（セッションのみ） | リニアスキャン | エフェメラルセッション、テスト |

## 設定

`config.toml` でメモリバックエンドを選択・設定します:

```toml
[memory]
backend = "sqlite"  # "markdown" | "sqlite" | "postgres" | "embeddings" | "memory"
max_recall_items = 20
recall_relevance_threshold = 0.3

[memory.sqlite]
path = "~/.local/share/openprx/memory.db"

[memory.postgres]
url = "postgresql://user:pass@localhost/prx"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768
```

## メモリライフサイクル

1. **抽出** -- 各会話ターンの後、システムが重要なファクトを抽出
2. **重複排除** -- 新しいファクトを既存のメモリと比較
3. **保存** -- 一意のファクトを設定されたバックエンドに永続化
4. **リコール** -- 各 LLM 呼び出しの前に、関連するメモリを取得
5. **ハイジーン** -- 定期的なメンテナンスで古いエントリを圧縮・剪定

## 関連ページ

- [Markdown バックエンド](./markdown)
- [SQLite バックエンド](./sqlite)
- [PostgreSQL バックエンド](./postgres)
- [エンベディングバックエンド](./embeddings)
- [メモリハイジーン](./hygiene)
