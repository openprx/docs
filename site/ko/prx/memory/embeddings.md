---
title: Embeddings 메모리 백엔드
description: RAG 스타일 검색을 위한 임베딩을 사용하는 벡터 기반 시맨틱 메모리입니다.
---

# Embeddings 메모리 백엔드

Embeddings 백엔드는 메모리를 벡터 임베딩으로 저장하여 시맨틱 유사도 검색을 가능하게 합니다. 이는 정확한 키워드가 일치하지 않더라도 에이전트가 문맥적으로 관련된 메모리를 찾을 수 있는 가장 강력한 리콜 메커니즘입니다.

## 개요

Embeddings 백엔드는:

- 메모리 텍스트를 밀집 벡터 표현으로 변환합니다
- 벡터를 로컬 또는 원격 벡터 데이터베이스에 저장합니다
- 현재 쿼리와의 코사인 유사도로 메모리를 검색합니다
- 여러 임베딩 프로바이더를 지원합니다 (Ollama, OpenAI 등)

## 작동 방식

1. 메모리가 저장되면 텍스트가 임베딩 모델에 전송됩니다
2. 결과 벡터가 원본 텍스트와 함께 저장됩니다
3. 리콜 시 현재 컨텍스트가 임베딩되어 저장된 벡터와 비교됩니다
4. 가장 유사한 Top-K 메모리가 반환됩니다

## 설정

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

## 지원되는 임베딩 프로바이더

| 프로바이더 | 모델 | 차원 |
|-----------|------|------|
| Ollama | nomic-embed-text | 768 |
| OpenAI | text-embedding-3-small | 1536 |
| OpenAI | text-embedding-3-large | 3072 |

## 관련 페이지

- [메모리 시스템 개요](./)
- [SQLite 백엔드](./sqlite)
- [메모리 정리](./hygiene)
