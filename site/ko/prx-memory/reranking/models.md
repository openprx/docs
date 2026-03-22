---
title: 리랭킹 모델
description: "PRX-Memory가 지원하는 리랭킹 모델. Jina, Cohere, Pinecone 프로바이더 포함."
---

# 리랭킹 모델

PRX-Memory는 `prx-memory-rerank` 크레이트를 통해 여러 리랭킹 프로바이더를 지원합니다. 각 프로바이더는 동일한 어댑터 트레이트를 구현하여 원활한 전환을 허용합니다.

## Jina AI

Jina는 다국어 지원이 있는 크로스 인코더 리랭킹 모델을 제공합니다.

```bash
PRX_RERANK_PROVIDER=jina
PRX_RERANK_API_KEY=your_jina_key
PRX_RERANK_MODEL=jina-reranker-v2-base-multilingual
```

| 모델 | 참고 |
|------|------|
| `jina-reranker-v2-base-multilingual` | 다국어 크로스 인코더 |
| `jina-reranker-v1-base-en` | 영어 최적화 |

::: info
Jina 리랭킹은 Jina 임베딩과 동일한 API 키를 사용할 수 있습니다. `JINA_API_KEY`를 한 번 설정하면 두 가지 모두 지원됩니다.
:::

## Cohere

Cohere는 Rerank API를 통해 고품질 리랭킹을 제공합니다.

```bash
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

| 모델 | 참고 |
|------|------|
| `rerank-v3.5` | 최신 모델, 최고 품질 |
| `rerank-english-v3.0` | 영어 최적화 |
| `rerank-multilingual-v3.0` | 다국어 지원 |

## Pinecone

Pinecone은 추론 API의 일부로 리랭킹을 제공합니다.

```bash
PRX_RERANK_PROVIDER=pinecone
PRX_RERANK_API_KEY=your_pinecone_key
PRX_RERANK_MODEL=bge-reranker-v2-m3
```

커스텀 Pinecone 호환 엔드포인트의 경우:

```bash
PRX_RERANK_PROVIDER=pinecone-compatible
PRX_RERANK_API_KEY=your_key
PRX_RERANK_ENDPOINT=https://your-endpoint.example.com
PRX_RERANK_API_VERSION=2025-01
```

## 리랭커 선택

| 우선순위 | 권장 프로바이더 | 모델 |
|---------|--------------|------|
| 최고 품질 | Cohere | `rerank-v3.5` |
| 다국어 | Jina | `jina-reranker-v2-base-multilingual` |
| Pinecone과 통합 | Pinecone | `bge-reranker-v2-m3` |
| 리랭킹 필요 없음 | -- | `PRX_RERANK_PROVIDER=none` |

## 임베딩과 리랭킹 결합

일반적인 고품질 설정은 Jina 임베딩과 Cohere 리랭킹을 조합합니다:

```bash
# Embedding
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# Reranking
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

이 설정은 광범위한 검색을 위해 Jina의 빠른 다국어 임베딩을 활용하고 최종 정렬에는 Cohere의 고정밀 리랭커를 사용합니다.

## 다음 단계

- [임베딩 모델](../embedding/models) -- 1단계 임베딩 모델 옵션
- [설정 레퍼런스](../configuration/) -- 모든 환경 변수
