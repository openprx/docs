---
title: サポートされる埋め込みモデル
description: "PRX-Memoryがサポートする埋め込みモデル（OpenAI互換、Jina、Geminiプロバイダ）と設定の詳細。"
---

# サポートされる埋め込みモデル

PRX-Memoryは`prx-memory-embed`クレートの統一アダプタインターフェースを通じて3つの埋め込みプロバイダファミリーをサポートします。

## OpenAI互換

OpenAI埋め込みエンドポイント形式（`/v1/embeddings`）に従う任意のAPIが使用できます。OpenAI自体、Azure OpenAI、ローカル推論サーバーなどが含まれます。

```bash
PRX_EMBED_PROVIDER=openai-compatible
PRX_EMBED_API_KEY=your_openai_key
PRX_EMBED_MODEL=text-embedding-3-small
PRX_EMBED_BASE_URL=https://api.openai.com  # optional
```

| モデル | 次元数 | 備考 |
|-------|-------|------|
| `text-embedding-3-small` | 1536 | 品質とコストのバランスが良い |
| `text-embedding-3-large` | 3072 | 最高品質、高コスト |
| `text-embedding-ada-002` | 1536 | レガシーモデル |

::: tip ローカル推論
プライバシーに敏感なデプロイメントでは、`PRX_EMBED_BASE_URL`をオープンソース埋め込みモデルを実行するローカル推論サーバー（Ollama、vLLM、text-embeddings-inferenceなど）に向けてください。
:::

## Jina AI

Jinaは検索タスクに最適化された高品質な多言語埋め込みモデルを提供します。

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3
```

| モデル | 次元数 | 備考 |
|-------|-------|------|
| `jina-embeddings-v3` | 1024 | 最新の多言語モデル |
| `jina-embeddings-v2-base-en` | 768 | 英語最適化 |
| `jina-embeddings-v2-base-code` | 768 | コード最適化 |

::: info フォールバックキー
`PRX_EMBED_API_KEY`が設定されていない場合、システムはフォールバックとして`JINA_API_KEY`をチェックします。
:::

## Google Gemini

Gemini埋め込みモデルはGoogle AI APIを通じて利用できます。

```bash
PRX_EMBED_PROVIDER=gemini
PRX_EMBED_API_KEY=your_gemini_key
PRX_EMBED_MODEL=text-embedding-004
```

| モデル | 次元数 | 備考 |
|-------|-------|------|
| `text-embedding-004` | 768 | 現在推奨のモデル |
| `embedding-001` | 768 | レガシーモデル |

::: info フォールバックキー
`PRX_EMBED_API_KEY`が設定されていない場合、システムはフォールバックとして`GEMINI_API_KEY`をチェックします。
:::

## モデルの選び方

| 優先事項 | 推奨モデル | プロバイダ |
|---------|-----------|-----------|
| 最高品質 | `text-embedding-3-large` | OpenAI互換 |
| コード向け最適 | `jina-embeddings-v2-base-code` | Jina |
| 多言語 | `jina-embeddings-v3` | Jina |
| プライバシー/ローカル | `openai-compatible`経由の任意のローカルモデル | セルフホスト |
| コスト効率 | `text-embedding-3-small` | OpenAI互換 |

## モデルの切り替え

埋め込みモデルを切り替えると、既存のベクトルは新しいモデルのベクトル空間と互換性がなくなります。`memory_reembed`ツールを使用して新しいモデルですべての保存済みメモリを再埋め込みします：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_reembed",
    "arguments": {}
  }
}
```

::: warning
再埋め込みはすべての保存済みメモリに対してAPI呼び出しが必要です。大規模なデータベースでは、これには相当な時間とAPIコストがかかる場合があります。使用量の少ない時間帯に再埋め込みを計画してください。
:::

## 次のステップ

- [バッチ処理](./batch-processing) -- 効率的なバルク埋め込み
- [リランキングモデル](../reranking/models) -- 第2段階リランキングモデルオプション
- [設定リファレンス](../configuration/) -- すべての環境変数
