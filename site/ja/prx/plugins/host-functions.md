---
title: ホスト関数
description: PRX WASM プラグインが利用可能なホスト関数のリファレンス
---

# ホスト関数

ホスト関数は PRX が WASM プラグインに公開する API サーフェスです。HTTP リクエスト、ファイル操作、エージェント状態などのホスト機能への制御されたアクセスを提供します。

## 利用可能なホスト関数

### HTTP

| 関数 | 説明 | 権限 |
|----------|-------------|-----------|
| `http_request(method, url, headers, body)` | HTTP リクエストを実行 | `net.http` |
| `http_get(url)` | GET リクエストのショートハンド | `net.http` |
| `http_post(url, body)` | POST リクエストのショートハンド | `net.http` |

### ファイルシステム

| 関数 | 説明 | 権限 |
|----------|-------------|-----------|
| `fs_read(path)` | ファイルを読み取り | `fs.read` |
| `fs_write(path, data)` | ファイルに書き込み | `fs.write` |
| `fs_list(path)` | ディレクトリの内容を一覧表示 | `fs.read` |

### エージェント状態

| 関数 | 説明 | 権限 |
|----------|-------------|-----------|
| `memory_get(key)` | エージェントメモリから読み取り | `agent.memory.read` |
| `memory_set(key, value)` | エージェントメモリに書き込み | `agent.memory.write` |
| `config_get(key)` | プラグイン設定を読み取り | `agent.config` |

### ログ

| 関数 | 説明 | 権限 |
|----------|-------------|-----------|
| `log_info(msg)` | info レベルでログ記録 | 常に許可 |
| `log_warn(msg)` | warn レベルでログ記録 | 常に許可 |
| `log_error(msg)` | error レベルでログ記録 | 常に許可 |

## 権限マニフェスト

各プラグインはマニフェストで必要な権限を宣言します:

```toml
[permissions]
net.http = ["api.example.com"]
fs.read = ["/data/*"]
agent.memory.read = true
```

## 関連ページ

- [プラグインアーキテクチャ](./architecture)
- [PDK リファレンス](./pdk)
- [セキュリティサンドボックス](/ja/prx/security/sandbox)
