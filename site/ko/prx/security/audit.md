---
title: 감사 로깅
description: PRX의 모든 보안 관련 작업을 추적하기 위한 보안 감사 로깅 시스템입니다.
---

# 감사 로깅

PRX에는 모든 보안 관련 작업을 기록하는 내장 감사 로깅 시스템이 포함되어 있습니다. `AuditLogger`는 누가 무엇을 언제 했는지, 성공했는지 여부를 추적하여 컴플라이언스, 인시던트 대응, 포렌식 분석을 위한 변조 방지 추적 기록을 제공합니다.

## 개요

감사 시스템은 모든 보안에 민감한 작업에 대한 구조화된 이벤트를 캡처합니다:

- 인증 시도 (성공 및 실패)
- 권한 부여 결정 (허용 및 거부)
- 설정 변경
- 도구 실행 및 샌드박스 이벤트
- 메모리 접근 및 수정
- 채널 연결 및 연결 해제
- 진화 제안 및 적용
- 플러그인 생명주기 이벤트

모든 감사 이벤트에는 타임스탬프, 행위자 신원, 작업 설명, 대상 리소스, 결과가 포함됩니다.

## 감사 이벤트 구조

각 감사 이벤트는 다음 필드를 가진 구조화된 레코드입니다:

| 필드 | 타입 | 설명 |
|------|------|------|
| `timestamp` | `DateTime<Utc>` | 이벤트 발생 시점 (UTC, 나노초 정밀도) |
| `event_id` | `String` | 이벤트의 고유 식별자 (UUIDv7, 시간 순서) |
| `actor` | `Actor` | 작업을 수행한 주체 (사용자, 에이전트, 시스템 또는 플러그인) |
| `action` | `String` | 수행된 작업 (예: `auth.login`, `tool.execute`, `config.update`) |
| `target` | `String` | 작업 대상 리소스 (예: 세션 ID, 설정 키, 파일 경로) |
| `outcome` | `Outcome` | 결과: `success`, `failure` 또는 `denied` |
| `metadata` | `Map<String, Value>` | 추가 컨텍스트 (IP 주소, 거부 사유 등) |
| `session_id` | `Option<String>` | 연관된 에이전트 세션 (있는 경우) |
| `severity` | `Severity` | 이벤트 심각도: `info`, `warning`, `critical` |

### 행위자 유형

| 행위자 유형 | 설명 | 예시 |
|------------|------|------|
| `user` | 채널 또는 API 인증으로 식별된 사람 | `user:telegram:123456789` |
| `agent` | PRX 에이전트 자체 | `agent:default` |
| `system` | 내부 시스템 프로세스 (크론, 진화) | `system:evolution` |
| `plugin` | WASM 플러그인 | `plugin:my-plugin:v1.2.0` |

### 작업 카테고리

작업은 점 구분 네임스페이스 규칙을 따릅니다:

| 카테고리 | 작업 | 심각도 |
|---------|------|--------|
| `auth.*` | `auth.login`, `auth.logout`, `auth.token_refresh`, `auth.pairing` | info / warning |
| `authz.*` | `authz.allow`, `authz.deny`, `authz.policy_check` | info / warning |
| `config.*` | `config.update`, `config.reload`, `config.hot_reload` | warning |
| `tool.*` | `tool.execute`, `tool.sandbox_escape_attempt`, `tool.timeout` | info / critical |
| `memory.*` | `memory.store`, `memory.recall`, `memory.delete`, `memory.compact` | info |
| `channel.*` | `channel.connect`, `channel.disconnect`, `channel.error` | info / warning |
| `evolution.*` | `evolution.propose`, `evolution.apply`, `evolution.rollback` | warning / critical |
| `plugin.*` | `plugin.load`, `plugin.unload`, `plugin.error`, `plugin.permission_denied` | info / warning |
| `session.*` | `session.create`, `session.terminate`, `session.timeout` | info |

## 설정

```toml
[security.audit]
enabled = true
min_severity = "info"           # 기록할 최소 심각도: "info", "warning", "critical"

[security.audit.file]
enabled = true
path = "~/.local/share/openprx/audit.log"
format = "jsonl"                # "jsonl" 또는 "csv"
max_size_mb = 100               # 이 크기 초과 시 로테이션
max_files = 10                  # 최대 10개 로테이션 파일 유지
compress_rotated = true         # 로테이션된 파일 gzip 압축

[security.audit.database]
enabled = false
backend = "sqlite"              # "sqlite" 또는 "postgres"
path = "~/.local/share/openprx/audit.db"
retention_days = 90             # 90일 이상 된 이벤트 자동 삭제
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `true` | 감사 로깅 전역 활성화 또는 비활성화 |
| `min_severity` | `String` | `"info"` | 기록할 최소 심각도 레벨 |
| `file.enabled` | `bool` | `true` | 감사 이벤트를 로그 파일에 기록 |
| `file.path` | `String` | `"~/.local/share/openprx/audit.log"` | 감사 로그 파일 경로 |
| `file.format` | `String` | `"jsonl"` | 로그 포맷: `"jsonl"` (라인당 하나의 JSON 객체) 또는 `"csv"` |
| `file.max_size_mb` | `u64` | `100` | 로테이션 전 최대 파일 크기 (MB) |
| `file.max_files` | `u32` | `10` | 보관할 로테이션 파일 수 |
| `file.compress_rotated` | `bool` | `true` | 로테이션된 로그 파일을 gzip으로 압축 |
| `database.enabled` | `bool` | `false` | 감사 이벤트를 데이터베이스에 기록 |
| `database.backend` | `String` | `"sqlite"` | 데이터베이스 백엔드: `"sqlite"` 또는 `"postgres"` |
| `database.path` | `String` | `""` | 데이터베이스 경로 (SQLite) 또는 연결 URL (PostgreSQL) |
| `database.retention_days` | `u64` | `90` | N일 이상 된 이벤트 자동 삭제. 0 = 영구 보관 |

## 저장 백엔드

### 파일 (JSONL)

기본 백엔드는 라인당 하나의 JSON 객체를 로그 파일에 기록합니다. 이 포맷은 표준 로그 분석 도구 (jq, grep, Elasticsearch ingest)와 호환됩니다.

로그 항목 예시:

```json
{
  "timestamp": "2026-03-21T10:15:30.123456789Z",
  "event_id": "019520a8-1234-7000-8000-000000000001",
  "actor": {"type": "user", "id": "user:telegram:123456789"},
  "action": "tool.execute",
  "target": "shell:ls -la /tmp",
  "outcome": "success",
  "metadata": {"sandbox": "bubblewrap", "duration_ms": 45},
  "session_id": "sess_abc123",
  "severity": "info"
}
```

### 데이터베이스 (SQLite / PostgreSQL)

데이터베이스 백엔드는 효율적인 쿼리를 위해 `timestamp`, `actor`, `action`, `severity`에 인덱스가 있는 구조화된 테이블에 이벤트를 저장합니다.

## 감사 추적 쿼리

### CLI 쿼리

```bash
# 최근 감사 이벤트 보기
prx audit log --tail 50

# 작업 카테고리별 필터링
prx audit log --action "auth.*" --last 24h

# 심각도별 필터링
prx audit log --severity critical --last 7d

# 행위자별 필터링
prx audit log --actor "user:telegram:123456789"

# JSON으로 내보내기
prx audit log --last 30d --format json > audit_export.json
```

### 데이터베이스 쿼리

데이터베이스 백엔드를 사용하면 SQL로 직접 쿼리할 수 있습니다:

```sql
-- 최근 24시간의 실패한 인증 시도
SELECT * FROM audit_events
WHERE action LIKE 'auth.%'
  AND outcome = 'failure'
  AND timestamp > datetime('now', '-24 hours')
ORDER BY timestamp DESC;

-- 특정 사용자의 도구 실행
SELECT action, target, outcome, timestamp
FROM audit_events
WHERE actor_id = 'user:telegram:123456789'
  AND action LIKE 'tool.%'
ORDER BY timestamp DESC
LIMIT 100;

-- 심각한 이벤트 요약
SELECT action, COUNT(*) as count
FROM audit_events
WHERE severity = 'critical'
  AND timestamp > datetime('now', '-7 days')
GROUP BY action
ORDER BY count DESC;
```

## 컴플라이언스

감사 로깅 시스템은 컴플라이언스 요구 사항을 지원하도록 설계되었습니다:

- **불변성** -- 로그 파일은 추가 전용; 로테이션된 파일은 체크섬으로 무결성 검증 가능
- **완전성** -- 모든 보안 관련 작업이 기본적으로 `info` 레벨에서 로그됨
- **보존** -- 자동 로테이션 및 삭제가 포함된 설정 가능한 보존 기간
- **부인 방지** -- 모든 이벤트에 행위자 신원과 타임스탬프 포함
- **가용성** -- 이중 출력 (파일 + 데이터베이스)으로 하나의 백엔드가 실패해도 이벤트가 손실되지 않음

### 컴플라이언스를 위한 권장 설정

```toml
[security.audit]
enabled = true
min_severity = "info"

[security.audit.file]
enabled = true
format = "jsonl"
max_size_mb = 500
max_files = 50
compress_rotated = true

[security.audit.database]
enabled = true
backend = "postgres"
path = "postgresql://audit_user:password@localhost/prx_audit"
retention_days = 365
```

## 성능

감사 로거는 최소한의 오버헤드를 위해 설계되었습니다:

- 이벤트는 바운드 채널 (기본 용량: 10,000 이벤트)을 통해 비동기적으로 기록됩니다
- 파일 쓰기는 버퍼링되고 주기적으로 플러시됩니다 (1초마다 또는 100 이벤트마다)
- 데이터베이스 쓰기는 배치됩니다 (기본 배치 크기: 50 이벤트)
- 이벤트 채널이 가득 차면 경고 카운터와 함께 이벤트가 드롭됩니다 (메인 에이전트 루프를 차단하지 않음)

## 제한 사항

- 파일 백엔드는 내장 변조 감지를 제공하지 않습니다 (고보안 배포의 경우 외부 무결성 모니터링 고려)
- 플러그인 코드의 감사 이벤트는 호스트에 의해 로그됩니다; 플러그인은 감사 시스템을 우회할 수 없습니다
- CSV 포맷은 중첩 메타데이터 필드를 지원하지 않습니다 (완전한 충실도를 위해 JSONL 사용)
- 데이터베이스 보존 정리는 시간당 한 번 실행됩니다; 설정된 보존 기간을 약간 초과하여 이벤트가 유지될 수 있습니다

## 관련 페이지

- [보안 개요](./)
- [정책 엔진](./policy-engine) -- 감사 이벤트를 생성하는 권한 부여 결정
- [샌드박스](./sandbox) -- 도구 실행 격리
- [위협 모델](./threat-model) -- 보안 아키텍처와 신뢰 경계
