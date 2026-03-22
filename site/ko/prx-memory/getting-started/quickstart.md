---
title: 빠른 시작
description: "5분 만에 PRX-Memory를 stdio 또는 HTTP 전송으로 실행하고, 첫 번째 메모리를 저장하고, 시맨틱 검색으로 회상."
---

# 빠른 시작

이 가이드는 PRX-Memory 빌드, 데몬 실행, 첫 번째 저장 및 회상 작업 수행 과정을 안내합니다.

## 1. 데몬 빌드

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build -p prx-memory-mcp --bin prx-memoryd
```

## 2. 서버 시작

### 옵션 A: stdio 전송

MCP 클라이언트 직접 통합용:

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

### 옵션 B: HTTP 전송

헬스 체크 및 메트릭이 있는 네트워크 접근용:

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

서버가 실행 중인지 확인합니다:

```bash
curl -sS http://127.0.0.1:8787/health
```

## 3. MCP 클라이언트 설정

MCP 클라이언트 설정 파일에 PRX-Memory를 추가합니다. 예를 들어 Claude Code 또는 Codex에서:

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memory/target/release/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/prx-memory/data/memory-db.json"
      }
    }
  }
}
```

::: tip
`/path/to/prx-memory`를 저장소를 복제한 실제 경로로 교체하세요.
:::

## 4. 메모리 저장

MCP 클라이언트를 통하거나 JSON-RPC로 직접 `memory_store` 도구 호출을 전송합니다:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_store",
    "arguments": {
      "text": "Always use parameterized queries for SQL to prevent injection attacks",
      "scope": "global",
      "tags": ["security", "sql", "best-practice"]
    }
  }
}
```

## 5. 메모리 회상

`memory_recall`을 사용하여 관련 메모리를 검색합니다:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "memory_recall",
    "arguments": {
      "query": "SQL security best practices",
      "scope": "global",
      "limit": 5
    }
  }
}
```

시스템은 어휘 매칭, 중요도 점수, 최신성의 조합을 사용하여 관련성 순으로 메모리를 반환합니다.

## 6. 시맨틱 검색 활성화 (선택적)

벡터 기반 시맨틱 회상을 위해 임베딩 프로바이더를 설정합니다:

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_jina_api_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

임베딩이 활성화되면 회상 쿼리에서 어휘 매칭 외에 벡터 유사도를 사용하여 자연어 쿼리의 검색 품질이 크게 향상됩니다.

## 7. 리랭킹 활성화 (선택적)

검색 정밀도를 더욱 향상시키기 위해 리랭커를 추가합니다:

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_embed_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_RERANK_PROVIDER=cohere \
PRX_RERANK_API_KEY=your_cohere_key \
PRX_RERANK_MODEL=rerank-v3.5 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

## 사용 가능한 MCP 도구

| 도구 | 설명 |
|------|------|
| `memory_store` | 새 메모리 항목 저장 |
| `memory_recall` | 쿼리로 메모리 회상 |
| `memory_update` | 기존 메모리 업데이트 |
| `memory_forget` | 메모리 항목 삭제 |
| `memory_export` | 모든 메모리 내보내기 |
| `memory_import` | 내보내기에서 메모리 가져오기 |
| `memory_migrate` | 스토리지 형식 마이그레이션 |
| `memory_reembed` | 새 모델로 메모리 재임베딩 |
| `memory_compact` | 스토리지 압축 및 최적화 |
| `memory_evolve` | 홀드아웃 검증으로 메모리 진화 |
| `memory_skill_manifest` | 사용 가능한 스킬 검색 |

## 다음 단계

- [임베딩 엔진](../embedding/) -- 임베딩 프로바이더 및 배치 처리 탐색
- [리랭킹](../reranking/) -- 2단계 리랭킹 설정
- [스토리지 백엔드](../storage/) -- JSON과 SQLite 스토리지 선택
- [설정 레퍼런스](../configuration/) -- 모든 환경 변수
