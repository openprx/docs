---
title: トラブルシューティング
description: "データベース接続、ルール読み込み、誤検知、クラスター同期、SSL証明書、パフォーマンスチューニングなど、PRX-WAFの一般的な問題の解決策。"
---

# トラブルシューティング

このページはPRX-WAFの実行中に発生する最も一般的な問題とその原因および解決策を説明します。

## データベース接続の失敗

**症状：** PRX-WAFが「connection refused」または「authentication failed」エラーで起動に失敗する。

**解決策：**

1. **PostgreSQLが実行中であることを確認：**

```bash
# Docker
docker compose ps postgres

# systemd
sudo systemctl status postgresql
```

2. **接続をテスト：**

```bash
psql "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

3. **TOMLコンフィグの接続文字列を確認：**

```toml
[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

4. **データベースが存在するがテーブルがない場合はマイグレーションを実行：**

```bash
prx-waf -c configs/default.toml migrate
```

## ルールが読み込まれない

**症状：** PRX-WAFは起動するがルールがアクティブでない。攻撃が検出されていない。

**解決策：**

1. **ルール統計を確認：**

```bash
prx-waf rules stats
```

出力が0ルールを示す場合、ルールディレクトリが空または誤設定されている可能性があります。

2. **設定内のルールディレクトリパスを確認：**

```toml
[rules]
dir = "rules/"
```

3. **ルールファイルを検証：**

```bash
python rules/tools/validate.py rules/
```

4. **YAMLシンタックスエラーを確認** -- 1つの不正なファイルがすべてのルールの読み込みを妨げる可能性があります：

```bash
# Validate one file at a time to find the problem
python rules/tools/validate.py rules/owasp-crs/sqli.yaml
```

5. **内蔵ルールが有効であることを確認：**

```toml
[rules]
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## ホットリロードが機能しない

**症状：** ルールファイルが変更されたが変更が反映されない。

**解決策：**

1. **ホットリロードが有効であることを確認：**

```toml
[rules]
hot_reload = true
reload_debounce_ms = 500
```

2. **手動でリロードをトリガー：**

```bash
prx-waf rules reload
```

3. **SIGHUPを送信：**

```bash
kill -HUP $(pgrep prx-waf)
```

4. **ファイルシステム監視の制限を確認**（Linux）：

```bash
cat /proc/sys/fs/inotify/max_user_watches
# If too low, increase:
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 誤検知

**症状：** 正当なリクエストがブロックされている（403 Forbidden）。

**解決策：**

1. **セキュリティイベントからブロッキングルールを特定：**

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/security-events
```

イベントの`rule_id`フィールドを確認。

2. **特定のルールを無効化：**

```bash
prx-waf rules disable CRS-942100
```

3. **パラノイアレベルを下げる。** パラノイア2以上で実行している場合、1に削減を試みます：

```toml
# In your rules config, only load paranoia level 1 rules
```

4. **監視のためにルールをログモードに切り替え**：

ルールファイルを編集して`action: "block"`を`action: "log"`に変更し、リロード：

```bash
prx-waf rules reload
```

5. **信頼されたソースのIPアローリストを追加：**

```bash
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'
```

::: tip
新しいルールをデプロイする際は、`action: block`に切り替える前に誤検知を監視するために`action: log`で始めてください。
:::

## SSL証明書の問題

**症状：** HTTPS接続の失敗、証明書エラー、またはLet's Encrypt更新の失敗。

**解決策：**

1. **管理UIの**SSL証明書**セクションで証明書ステータスを確認。**

2. **ACME HTTP-01チャレンジのためにポート80がインターネットからアクセス可能であることを確認。**

3. **手動証明書を使用している場合は証明書パスを確認：**

```toml
[http3]
cert_pem = "/etc/prx-waf/tls/cert.pem"
key_pem  = "/etc/prx-waf/tls/key.pem"
```

4. **証明書がドメインと一致することを確認：**

```bash
openssl x509 -in /etc/prx-waf/tls/cert.pem -text -noout | grep -A1 "Subject Alternative Name"
```

## クラスターノードが接続できない

**症状：** ワーカーノードがクラスターに参加できない。ステータスに「disconnected」ピアが表示される。

**解決策：**

1. **クラスターポート（デフォルト：UDP 16851）でネットワーク接続を確認：**

```bash
# From worker to main
nc -zuv node-a 16851
```

2. **ファイアウォールルールを確認** -- クラスター通信はUDPを使用：

```bash
sudo ufw allow 16851/udp
```

3. **証明書を確認** -- すべてのノードは同じCAで署名された証明書を使用する必要があります：

```bash
openssl verify -CAfile cluster-ca.pem node-b.pem
```

4. **ワーカーノードのシード設定を確認：**

```toml
[cluster]
seeds = ["node-a:16851"]   # Must resolve to the main node
```

5. **デバッグログでログを確認：**

```bash
prx-waf -c config.toml run 2>&1 | grep -i "cluster\|quic\|peer"
```

## メモリ使用量が多い

**症状：** PRX-WAFプロセスが予想以上のメモリを消費する。

**解決策：**

1. **レスポンスキャッシュサイズを削減：**

```toml
[cache]
max_size_mb = 128    # Reduce from default 256
```

2. **データベース接続プールを削減：**

```toml
[storage]
max_connections = 10   # Reduce from default 20
```

3. **ワーカースレッドを削減：**

```toml
[proxy]
worker_threads = 2    # Reduce from CPU count
```

4. **メモリ使用量を監視：**

```bash
ps aux | grep prx-waf
```

## CrowdSec接続の問題

**症状：** CrowdSec統合が「disconnected」を示すか、決定が読み込まれない。

**解決策：**

1. **LAPI接続をテスト：**

```bash
prx-waf crowdsec test
```

2. **APIキーを確認：**

```bash
# On the CrowdSec machine
cscli bouncers list
```

3. **LAPI URLを確認：**

```toml
[crowdsec]
lapi_url = "http://127.0.0.1:8080"
api_key  = "your-bouncer-key"
```

4. **LAPIが到達不能の場合のための安全なフォールバックアクションを設定：**

```toml
[crowdsec]
fallback_action = "log"    # Don't block when LAPI is down
```

## パフォーマンスチューニング

### レスポンスが遅い

1. **レスポンスキャッシングを有効化：**

```toml
[cache]
enabled = true
max_size_mb = 512
```

2. **ワーカースレッドを増加：**

```toml
[proxy]
worker_threads = 8
```

3. **データベース接続を増加：**

```toml
[storage]
max_connections = 50
```

### CPU使用率が高い

1. **アクティブなルール数を削減する。** 不要な場合はパラノイアレベル3〜4のルールを無効化する。

2. **未使用の検出フェーズを無効化する。** 例えば、CrowdSecを使用しない場合：

```toml
[crowdsec]
enabled = false
```

## ヘルプの取得

上記の解決策で問題が解決しない場合：

1. **既存のissueを確認：** [github.com/openprx/prx-waf/issues](https://github.com/openprx/prx-waf/issues)
2. 以下を含む**新しいissueを提出**：
   - PRX-WAFバージョン
   - オペレーティングシステムとカーネルバージョン
   - 設定ファイル（パスワードを伏せた状態）
   - 関連するログ出力
   - 再現手順

## 次のステップ

- [設定リファレンス](../configuration/reference) -- すべての設定を微調整する
- [ルールエンジン](../rules/) -- ルールの評価方法を理解する
- [クラスターモード](../cluster/) -- クラスター固有のトラブルシューティング
