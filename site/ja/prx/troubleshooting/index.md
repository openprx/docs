---
title: トラブルシューティング
description: 診断ツールと FAQ を含む PRX の一般的な問題と解決策
---

# トラブルシューティング

このセクションでは PRX の実行時に発生する一般的な問題とその解決方法を説明します。

## クイック診断

組み込みの doctor コマンドで包括的なヘルスチェックを実行:

```bash
prx doctor
```

チェック内容:

- 設定ファイルの妥当性
- プロバイダーの接続性と認証
- システム依存関係
- ディスク容量とパーミッション
- アクティブなデーモンの状態

## 一般的な問題

### デーモンが起動しない

**症状**: `prx daemon` が即座に終了するかバインドに失敗する。

**解決策**:
- 別のインスタンスが実行中でないか確認: `prx daemon status`
- ポートが利用可能か確認: `ss -tlnp | grep 3120`
- ログを確認: `prx daemon logs`
- 設定を検証: `prx config check`

### プロバイダー認証が失敗する

**症状**: 「Unauthorized」または「Invalid API key」エラー。

**解決策**:
- API キーを確認: `prx auth status`
- 再認証: `prx auth login <provider>`
- 環境変数を確認: `env | grep API_KEY`

### メモリ使用量が高い

**症状**: PRX プロセスが過剰なメモリを消費。

**解決策**:
- 同時セッション数を削減: `[agent.limits] max_concurrent_sessions` を設定
- メモリハイジーンを有効化: `prx memory compact`
- 長時間実行中のセッションを確認: `prx session list`

### ツール実行がハングする

**症状**: ツール実行中にエージェントが停止したように見える。

**解決策**:
- サンドボックス設定を確認
- ツールの依存関係がインストールされていることを確認
- タイムアウトを設定: `[agent] session_timeout_secs = 300`
- セッションをキャンセル: `prx session cancel <id>`

## ヘルプの取得

- 詳細な診断手順は [診断](./diagnostics) ページを確認
- GitHub で Issue を開く: `https://github.com/openprx/prx/issues`
- リアルタイムヘルプはコミュニティ Discord に参加

## 関連ページ

- [診断](./diagnostics)
