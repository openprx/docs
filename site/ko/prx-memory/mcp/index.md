---
title: MCP 통합
description: "PRX-Memory MCP 프로토콜 통합, 지원 도구, 리소스, 템플릿, 전송 모드."
---

# MCP 통합

PRX-Memory는 네이티브 MCP(Model Context Protocol) 서버로 구축되어 있습니다. 메모리 작업을 MCP 도구로, 거버넌스 스킬을 MCP 리소스로, 표준화된 메모리 인터랙션을 위한 페이로드 템플릿을 노출합니다.

## 전송 모드

### stdio

stdio 전송은 표준 입출력을 통해 통신하여 Claude Code, Codex, OpenClaw와 같은 MCP 클라이언트와의 직접 통합에 이상적입니다.

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

### HTTP

HTTP 전송은 추가 운영 엔드포인트가 있는 네트워크 접근 가능 서버를 제공합니다.

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

HTTP 전용 엔드포인트:

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /health` | 헬스 체크 |
| `GET /metrics` | Prometheus 메트릭 |
| `GET /metrics/summary` | JSON 메트릭 요약 |
| `POST /mcp/session/renew` | 스트리밍 세션 갱신 |

## MCP 클라이언트 설정

MCP 클라이언트의 설정 파일에 PRX-Memory를 추가합니다:

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/data/memory-db.json"
      }
    }
  }
}
```

::: tip
경로 해석 문제를 피하기 위해 `command`와 `PRX_MEMORY_DB` 모두 절대 경로를 사용하세요.
:::

## MCP 도구

PRX-Memory는 MCP `tools/call` 인터페이스를 통해 다음 도구를 노출합니다:

### 핵심 메모리 작업

| 도구 | 설명 |
|------|------|
| `memory_store` | 텍스트, 범위, 태그, 메타데이터가 있는 새 메모리 항목 저장 |
| `memory_recall` | 어휘, 벡터, 리랭크 검색을 사용하여 쿼리에 일치하는 메모리 회상 |
| `memory_update` | 기존 메모리 항목 업데이트 |
| `memory_forget` | ID로 메모리 항목 삭제 |

### 대량 작업

| 도구 | 설명 |
|------|------|
| `memory_export` | 모든 메모리를 이식 가능한 JSON 형식으로 내보내기 |
| `memory_import` | 내보내기에서 메모리 가져오기 |
| `memory_migrate` | 스토리지 백엔드 간 마이그레이션 |
| `memory_reembed` | 현재 임베딩 모델로 모든 메모리 재임베딩 |
| `memory_compact` | 스토리지 압축 및 최적화 |

### 진화

| 도구 | 설명 |
|------|------|
| `memory_evolve` | 훈련/홀드아웃 수락과 제약 게이팅을 사용하여 메모리 진화 |

### 스킬 검색

| 도구 | 설명 |
|------|------|
| `memory_skill_manifest` | 거버넌스 스킬에 대한 스킬 매니페스트 반환 |

## MCP 리소스

PRX-Memory는 거버넌스 스킬 패키지를 MCP 리소스로 노출합니다:

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/list", "params": {}}
```

특정 리소스 읽기:

```json
{"jsonrpc": "2.0", "id": 2, "method": "resources/read", "params": {"uri": "prx://skills/governance"}}
```

## 리소스 템플릿

페이로드 템플릿은 클라이언트가 표준화된 메모리 작업을 구성하는 데 도움을 줍니다:

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/templates/list", "params": {}}
```

템플릿을 사용하여 store 페이로드 생성:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "prx://templates/memory-store?text=Pitfall:+always+handle+errors&scope=global"
  }
}
```

## 스트리밍 세션

HTTP 전송은 스트리밍 응답을 위한 Server-Sent Events(SSE)를 지원합니다. 세션에는 설정 가능한 TTL이 있습니다:

```bash
PRX_MEMORY_STREAM_SESSION_TTL_MS=300000  # 5 minutes
```

만료 전에 세션 갱신:

```bash
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"
```

## 표준화 프로파일

PRX-Memory는 메모리 항목에 태그를 지정하고 유효성을 검사하는 방법을 제어하는 두 가지 표준화 프로파일을 지원합니다:

| 프로파일 | 설명 |
|---------|------|
| `zero-config` | 최소 제약 조건, 모든 태그와 범위를 허용 (기본값) |
| `governed` | 엄격한 태그 정규화, 비율 한도, 품질 제약 조건 |

```bash
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend
```

## 다음 단계

- [빠른 시작](../getting-started/quickstart) -- 첫 번째 저장 및 회상 작업
- [설정 레퍼런스](../configuration/) -- 모든 환경 변수
- [문제 해결](../troubleshooting/) -- 일반적인 MCP 문제
