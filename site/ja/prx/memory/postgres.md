---
title: PostgreSQL メモリバックエンド
description: マルチユーザーサーバーデプロイメントのための PostgreSQL を使用したリモートデータベースメモリストレージ
---

# PostgreSQL メモリバックエンド

PostgreSQL バックエンドは、リモート PostgreSQL データベースにメモリを保存し、複数のユーザーやエージェントインスタンス間でのメモリ共有を可能にします。サーバーデプロイメントに推奨されるバックエンドです。

## 概要

PostgreSQL バックエンドは以下を提供します:

- 複数の PRX インスタンス間でのメモリ共有
- `tsvector` と `pg_trgm` による全文検索
- マルチテナント分離のための行レベルセキュリティ
- 大規模デプロイメントのための水平スケーラビリティ

## 設定

```toml
[memory]
backend = "postgres"

[memory.postgres]
url = "postgresql://prx:password@localhost:5432/prx_memory"
max_connections = 5
schema = "memory"
```

## マルチユーザー分離

複数のユーザーが PostgreSQL メモリバックエンドを共有する場合、各ユーザーのメモリはユーザー ID で分離されます。バックエンドは SQL インジェクションを防ぐために、すべての操作にパラメータ化クエリを使用します。

## マイグレーション

PostgreSQL バックエンドには、起動時に実行される自動スキーママイグレーションが含まれています。手動のマイグレーション手順は不要です。

## 関連ページ

- [メモリシステム概要](./)
- [SQLite バックエンド](./sqlite) -- ローカルデプロイメント向け
- [メモリハイジーン](./hygiene)
