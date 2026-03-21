---
title: エンベディングメモリバックエンド
description: RAG スタイルの検索のためのエンベディングを使用したベクトルベースのセマンティックメモリ
---

# エンベディングメモリバックエンド

エンベディングバックエンドは、メモリをベクトルエンベディングとして保存し、セマンティック類似度検索を可能にします。正確なキーワードが一致しなくても、文脈的に関連するメモリを見つけることができる最も強力なリコールメカニズムです。

## 概要

エンベディングバックエンドは:

- メモリテキストを密なベクトル表現に変換
- ローカルまたはリモートのベクトルデータベースにベクトルを保存
- 現在のクエリとのコサイン類似度でメモリを検索
- 複数のエンベディングプロバイダーをサポート（Ollama、OpenAI 等）

## 仕組み

1. メモリが保存されると、テキストがエンベディングモデルに送信される
2. 結果のベクトルが元のテキストと共に保存される
3. リコール時に、現在のコンテキストがエンベッドされ、保存されたベクトルと比較される
4. 最も類似度の高い Top-K のメモリが返される

## 設定

```toml
[memory]
backend = "embeddings"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768
top_k = 10
similarity_threshold = 0.5

[memory.embeddings.store]
type = "sqlite-vec"  # or "pgvector"
path = "~/.local/share/openprx/embeddings.db"
```

## サポートされるエンベディングプロバイダー

| プロバイダー | モデル | 次元数 |
|----------|-------|-----------|
| Ollama | nomic-embed-text | 768 |
| OpenAI | text-embedding-3-small | 1536 |
| OpenAI | text-embedding-3-large | 3072 |

## 関連ページ

- [メモリシステム概要](./)
- [SQLite バックエンド](./sqlite)
- [メモリハイジーン](./hygiene)
