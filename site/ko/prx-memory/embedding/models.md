---
title: 지원 임베딩 모델
description: "PRX-Memory가 지원하는 임베딩 모델. OpenAI 호환, Jina, Gemini 프로바이더 설정 세부 정보 포함."
---

# 지원 임베딩 모델

PRX-Memory는 세 가지 임베딩 프로바이더 패밀리를 지원합니다. 각 프로바이더는 `prx-memory-embed` 크레이트의 통합 어댑터 인터페이스를 통해 연결됩니다.

## OpenAI 호환

OpenAI 임베딩 엔드포인트 형식(`/v1/embeddings`)을 따르는 모든 API를 사용할 수 있습니다. OpenAI 자체, Azure OpenAI, 로컬 추론 서버를 포함합니다.

```bash
PRX_EMBED_PROVIDER=openai-compatible
PRX_EMBED_API_KEY=your_openai_key
PRX_EMBED_MODEL=text-embedding-3-small
PRX_EMBED_BASE_URL=https://api.openai.com  # optional
```

| 모델 | 차원 | 참고 |
|------|------|------|
| `text-embedding-3-small` | 1536 | 품질과 비용의 좋은 균형 |
| `text-embedding-3-large` | 3072 | 최고 품질, 높은 비용 |
| `text-embedding-ada-002` | 1536 | 레거시 모델 |

::: tip 로컬 추론
개인 정보 보호가 민감한 배포의 경우 `PRX_EMBED_BASE_URL`을 오픈소스 임베딩 모델을 실행하는 로컬 추론 서버(예: Ollama, vLLM, text-embeddings-inference를 통해)로 지정하세요.
:::

## Jina AI

Jina는 검색 작업에 최적화된 고품질 다국어 임베딩 모델을 제공합니다.

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3
```

| 모델 | 차원 | 참고 |
|------|------|------|
| `jina-embeddings-v3` | 1024 | 최신 다국어 모델 |
| `jina-embeddings-v2-base-en` | 768 | 영어 최적화 |
| `jina-embeddings-v2-base-code` | 768 | 코드 최적화 |

::: info 폴백 키
`PRX_EMBED_API_KEY`가 설정되지 않으면 시스템은 폴백으로 `JINA_API_KEY`를 확인합니다.
:::

## Google Gemini

Gemini 임베딩 모델은 Google AI API를 통해 사용 가능합니다.

```bash
PRX_EMBED_PROVIDER=gemini
PRX_EMBED_API_KEY=your_gemini_key
PRX_EMBED_MODEL=text-embedding-004
```

| 모델 | 차원 | 참고 |
|------|------|------|
| `text-embedding-004` | 768 | 현재 권장 모델 |
| `embedding-001` | 768 | 레거시 모델 |

::: info 폴백 키
`PRX_EMBED_API_KEY`가 설정되지 않으면 시스템은 폴백으로 `GEMINI_API_KEY`를 확인합니다.
:::

## 모델 선택

| 우선순위 | 권장 모델 | 프로바이더 |
|---------|----------|-----------|
| 최고 품질 | `text-embedding-3-large` | OpenAI 호환 |
| 코드에 최적 | `jina-embeddings-v2-base-code` | Jina |
| 다국어 | `jina-embeddings-v3` | Jina |
| 개인 정보 보호 / 로컬 | 로컬 모델 (`openai-compatible`을 통해) | 자체 호스팅 |
| 비용 효율 | `text-embedding-3-small` | OpenAI 호환 |

## 모델 전환

임베딩 모델을 전환할 때 기존 벡터는 새 모델의 벡터 공간과 호환되지 않습니다. `memory_reembed` 도구를 사용하여 새 모델로 저장된 모든 메모리를 재임베딩합니다:

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
재임베딩은 저장된 모든 메모리에 대해 API 호출이 필요합니다. 대용량 데이터베이스의 경우 상당한 시간이 걸리고 API 비용이 발생할 수 있습니다. 사용량이 적은 시간에 재임베딩을 계획하세요.
:::

## 다음 단계

- [배치 처리](./batch-processing) -- 효율적인 대량 임베딩
- [리랭킹 모델](../reranking/models) -- 2단계 리랭킹 모델 옵션
- [설정 레퍼런스](../configuration/) -- 모든 환경 변수
