---
title: prx agent
description: スクリプトやパイプに対応したシングルターン LLM インタラクション。
---

# prx agent

シングルターンの LLM インタラクションを実行します。エージェントは 1 つのプロンプトを処理し、レスポンスを返して終了します。スクリプト、パイプ、他のツールとの統合向けに設計されています。

## 使い方

```bash
prx agent [OPTIONS] [PROMPT]
```

`PROMPT` を省略すると、stdin から入力を読み取ります。

## オプション

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--provider` | `-P` | 設定のデフォルト | 使用する LLM プロバイダー |
| `--model` | `-m` | プロバイダーのデフォルト | モデル識別子 |
| `--system` | `-s` | | カスタムシステムプロンプト |
| `--file` | `-f` | | プロンプトコンテキストにファイルを添付 |
| `--no-tools` | | `false` | ツールの使用を無効化 |
| `--no-memory` | | `false` | メモリの読み書きを無効化 |
| `--json` | `-j` | `false` | 生の JSON レスポンスを出力 |
| `--temperature` | `-t` | プロバイダーのデフォルト | サンプリング温度（0.0 - 2.0） |
| `--max-tokens` | | プロバイダーのデフォルト | レスポンスの最大トークン数 |
| `--timeout` | | `120` | タイムアウト（秒） |

## 使用例

```bash
# 簡単な質問
prx agent "What is the capital of France?"

# 分析のためにコンテンツをパイプ
cat error.log | prx agent "Summarize these errors"

# ファイルを添付
prx agent -f report.pdf "Summarize the key findings"

# 特定のモデルを使用
prx agent -P anthropic -m claude-sonnet-4-20250514 "Explain quantum entanglement"

# スクリプト用の JSON 出力
prx agent --json "List 5 programming languages" | jq '.content'

# 他のコマンドとの連携
git diff HEAD~1 | prx agent "Write a commit message for this diff"
```

## stdin と引数

プロンプトは位置引数または stdin で指定できます。両方が存在する場合は連結されます（stdin のコンテンツが先、引数が指示として続く）。

```bash
# 引数のみ
prx agent "Hello"

# stdin のみ
echo "Hello" | prx agent

# 両方: stdin がコンテキスト、引数が指示
cat data.csv | prx agent "Find anomalies in this dataset"
```

## ファイル添付

`--file` フラグはプロンプトコンテキストにファイルの内容を追加します。複数のファイルを添付できます：

```bash
prx agent -f src/main.rs -f src/lib.rs "Review this code for bugs"
```

サポートされるファイルタイプには、テキストファイル、PDF、画像（ビジョン対応モデルの場合）、一般的なドキュメント形式が含まれます。

## 終了コード

| コード | 意味 |
|------|---------|
| `0` | 成功 |
| `1` | 一般エラー（無効な設定、ネットワーク障害） |
| `2` | タイムアウト超過 |
| `3` | プロバイダーエラー（レート制限、認証失敗） |

## 関連ドキュメント

- [prx chat](./chat) -- 対話型マルチターンチャット
- [プロバイダーの概要](/ja/prx/providers/) -- サポートされている LLM プロバイダー
- [ツールの概要](/ja/prx/tools/) -- エージェント実行中に使用可能なツール
