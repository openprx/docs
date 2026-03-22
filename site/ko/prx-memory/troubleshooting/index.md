---
title: 문제 해결
description: "설정, 임베딩, 리랭킹, 스토리지, MCP 통합에 대한 일반적인 PRX-Memory 문제 및 해결책."
---

# 문제 해결

이 페이지는 PRX-Memory 실행 시 발생하는 일반적인 문제와 원인 및 해결 방법을 다룹니다.

## 설정 문제

### "PRX_EMBED_API_KEY is not configured"

**원인:** 원격 시맨틱 회상이 요청되었지만 임베딩 API 키가 설정되지 않았습니다.

**해결책:** 임베딩 프로바이더와 API 키를 설정하세요:

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_api_key
```

또는 프로바이더별 폴백 키를 사용하세요:

```bash
JINA_API_KEY=your_api_key
```

::: tip
시맨틱 검색이 필요하지 않은 경우 PRX-Memory는 임베딩 설정 없이 어휘 매칭만으로 작동합니다.
:::

### "Unsupported rerank provider"

**원인:** `PRX_RERANK_PROVIDER` 변수에 인식되지 않는 값이 있습니다.

**해결책:** 지원되는 값 중 하나를 사용하세요:

```bash
PRX_RERANK_PROVIDER=jina        # or cohere, pinecone, pinecone-compatible, none
```

### "Unsupported embed provider"

**원인:** `PRX_EMBED_PROVIDER` 변수에 인식되지 않는 값이 있습니다.

**해결책:** 지원되는 값 중 하나를 사용하세요:

```bash
PRX_EMBED_PROVIDER=openai-compatible  # or jina, gemini
```

## 세션 문제

### "session_expired"

**원인:** HTTP 스트리밍 세션이 갱신 없이 TTL을 초과했습니다.

**해결책:** 만료 전에 세션을 갱신하거나 TTL을 늘리세요:

```bash
# Renew the session
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"

# Or increase the TTL (default: 300000ms = 5 minutes)
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000
```

## 스토리지 문제

### 데이터베이스 파일을 찾을 수 없음

**원인:** `PRX_MEMORY_DB`에 지정된 경로가 존재하지 않거나 쓰기 권한이 없습니다.

**해결책:** 디렉토리가 존재하고 경로가 올바른지 확인하세요:

```bash
mkdir -p ./data
PRX_MEMORY_DB=./data/memory-db.json
```

::: tip
작업 디렉토리 변경으로 인한 문제를 피하기 위해 절대 경로를 사용하세요.
:::

### 대용량 JSON 데이터베이스 로딩 느림

**원인:** JSON 백엔드는 시작 시 전체 파일을 메모리에 로드합니다. 10,000개 이상의 항목이 있는 데이터베이스에서는 느릴 수 있습니다.

**해결책:** SQLite 백엔드로 마이그레이션하세요:

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

기존 데이터를 전송하기 위해 `memory_migrate` 도구를 사용하세요.

## 관찰 가능성 문제

### 메트릭 카디널리티 오버플로우 알림

**원인:** 회상 범위, 카테고리 또는 리랭크 프로바이더 차원에서 고유 레이블 값이 너무 많습니다.

**해결책:** 카디널리티 한도를 늘리거나 입력을 정규화하세요:

```bash
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_METRICS_MAX_RECALL_CATEGORY_LABELS=64
PRX_METRICS_MAX_RERANK_PROVIDER_LABELS=32
```

한도를 초과하면 새 레이블 값은 자동으로 제거되고 `prx_memory_metrics_label_overflow_total`에 계산됩니다.

### 알림 임계값이 너무 민감

**원인:** 기본 알림 임계값이 초기 배포 중에 오탐을 트리거할 수 있습니다.

**해결책:** 예상 오류율에 따라 임계값을 조정하세요:

```bash
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.10
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.30
```

## 빌드 문제

### LanceDB 기능을 사용할 수 없음

**원인:** 컴파일 시 `lancedb-backend` 기능이 활성화되지 않았습니다.

**해결책:** 기능 플래그를 사용하여 재빌드하세요:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

### Linux에서 컴파일 오류

**원인:** 네이티브 코드 빌드를 위한 시스템 의존성이 누락되었습니다.

**해결책:** 빌드 의존성을 설치하세요:

```bash
# Debian/Ubuntu
sudo apt install -y build-essential pkg-config libssl-dev

# Fedora
sudo dnf install -y gcc openssl-devel pkg-config
```

## 헬스 체크

서버가 올바르게 실행 중인지 확인하기 위해 HTTP 헬스 엔드포인트를 사용합니다:

```bash
curl -sS http://127.0.0.1:8787/health
```

운영 상태에 대한 메트릭 확인:

```bash
curl -sS http://127.0.0.1:8787/metrics/summary
```

## 검증 명령어

설치를 검증하기 위해 전체 검증 스위트를 실행합니다:

```bash
# Multi-client validation
./scripts/run_multi_client_validation.sh

# Soak test (60 seconds, 4 QPS)
./scripts/run_soak_http.sh 60 4
```

## 도움 받기

- **저장소:** [github.com/openprx/prx-memory](https://github.com/openprx/prx-memory)
- **이슈:** [github.com/openprx/prx-memory/issues](https://github.com/openprx/prx-memory/issues)
- **문서:** [docs/README.md](https://github.com/openprx/prx-memory/blob/main/docs/README.md)
