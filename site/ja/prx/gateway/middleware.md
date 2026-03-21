---
title: ミドルウェア
description: 認証、レート制限、CORS、ログのためのゲートウェイミドルウェアスタック
---

# ミドルウェア

PRX ゲートウェイは、認証、レート制限、CORS、リクエストログなどの横断的関心事を処理するためのコンポーザブルなミドルウェアスタックを使用します。

## ミドルウェアスタック

リクエストはミドルウェアスタックを順番に通過します:

1. **リクエストログ** -- タイミング情報付きで受信リクエストをログに記録
2. **CORS** -- クロスオリジンリソース共有ヘッダーを処理
3. **認証** -- ベアラートークンまたは API キーを検証
4. **レート制限** -- クライアントごとのリクエスト制限を適用
5. **リクエストルーティング** -- 適切なハンドラにディスパッチ

## 認証ミドルウェア

```toml
[gateway.auth]
enabled = true
method = "bearer"  # "bearer" | "api_key" | "none"
token_secret = "your-secret-key"
```

## レート制限

```toml
[gateway.rate_limit]
enabled = true
requests_per_minute = 60
burst_size = 10
```

## CORS

```toml
[gateway.cors]
allowed_origins = ["https://app.example.com"]
allowed_methods = ["GET", "POST", "PUT", "DELETE"]
allowed_headers = ["Authorization", "Content-Type"]
max_age_secs = 86400
```

## リクエストログ

すべての API リクエストはメソッド、パス、ステータスコード、レスポンス時間と共にログに記録されます。ログレベルは設定可能です:

```toml
[gateway.logging]
level = "info"  # "debug" | "info" | "warn" | "error"
format = "json"  # "json" | "pretty"
```

## 関連ページ

- [ゲートウェイ概要](./)
- [HTTP API](./http-api)
- [セキュリティ](/ja/prx/security/)
