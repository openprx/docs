---
title: 비용 추적
description: PRX에서 모든 LLM 프로바이더의 토큰 사용량, API 비용, 예산 알림을 추적합니다.
---

# 비용 추적

PRX에는 모든 LLM 프로바이더의 토큰 소비와 API 지출을 모니터링하는 내장 비용 추적 시스템이 포함되어 있습니다. `CostTracker`는 요청별, 세션별, 프로바이더별 사용량을 누적하여 에이전트가 API 리소스를 어떻게 소비하는지 완전한 가시성을 제공합니다.

## 개요

PRX의 모든 LLM 요청은 입력 토큰, 출력 토큰, 관련 비용을 포함하는 `TokenUsage` 레코드를 생성합니다. 이 레코드들은 `CostTracker`에 의해 집계되며 보고, 예산 적용, 이상 감지를 위해 조회할 수 있습니다.

```
LLM Request
    │
    ├── Provider returns usage metadata
    │   (input_tokens, output_tokens, cache hits)
    │
    ▼
TokenUsage record created
    │
    ├── Accumulated into CostTracker
    │   ├── Per-request breakdown
    │   ├── Per-session totals
    │   ├── Per-provider totals
    │   └── Per-model totals
    │
    ├── Budget check (if limits configured)
    │   ├── Under budget → continue
    │   └── Over budget → warning / hard stop
    │
    └── Written to observability pipeline
        (metrics, logs, tracing spans)
```

## 설정

`config.toml`에서 비용 추적을 활성화하고 설정합니다:

```toml
[cost]
enabled = true

# 표시용 통화 (계산에는 영향을 주지 않습니다).
currency = "USD"

# 누적된 비용을 영구 저장소에 플러시하는 주기.
flush_interval_secs = 60

# 재시작 간 비용 데이터를 유지합니다.
persist = true
persist_path = "~/.local/share/openprx/cost.db"
```

### 예산 한도

초과 비용을 방지하기 위해 지출 한도를 설정합니다:

```toml
[cost.budget]
# 모든 프로바이더의 일일 지출 한도.
daily_limit = 10.00

# 월간 지출 한도.
monthly_limit = 200.00

# 세션당 한도 (새 세션 시작 시 리셋).
session_limit = 2.00

# 한도 도달 시 조치: "warn" 또는 "stop".
# "warn"은 경고를 로그하지만 요청은 계속 허용합니다.
# "stop"은 기간이 리셋될 때까지 추가 LLM 요청을 차단합니다.
on_limit = "warn"
```

### 프로바이더별 한도

특정 프로바이더에 대한 예산 한도를 재정의합니다:

```toml
[cost.budget.providers.openai]
daily_limit = 5.00
monthly_limit = 100.00

[cost.budget.providers.anthropic]
daily_limit = 8.00
monthly_limit = 150.00
```

## TokenUsage 구조

각 LLM 요청은 `TokenUsage` 레코드를 생성합니다:

| 필드 | 타입 | 설명 |
|------|------|------|
| `input_tokens` | u64 | 프롬프트의 토큰 수 (시스템 + 사용자 + 컨텍스트) |
| `output_tokens` | u64 | 모델 응답의 토큰 수 |
| `cache_read_tokens` | u64 | 프로바이더 캐시에서 제공된 토큰 (Anthropic 프롬프트 캐싱) |
| `cache_write_tokens` | u64 | 프로바이더 캐시에 기록된 토큰 |
| `total_tokens` | u64 | `input_tokens + output_tokens` |
| `cost` | f64 | 설정된 통화로 추정된 비용 |
| `provider` | string | 프로바이더명 (예: "openai", "anthropic") |
| `model` | string | 모델 식별자 (예: "gpt-4o", "claude-sonnet-4-20250514") |
| `timestamp` | datetime | 요청이 이루어진 시점 |
| `session_id` | string | 요청을 생성한 에이전트 세션 |

## CostTracker

`CostTracker`는 모든 토큰 사용량의 중앙 집계 지점입니다. 프로바이더별, 모델별, 세션별 누적 합계와 일별 (자정 UTC에 리셋), 월별 (1일에 리셋) 합계를 유지합니다. 트래커는 스레드 안전하며 모든 LLM 응답 후에 업데이트됩니다.

## 가격 데이터

PRX는 주요 프로바이더와 모델에 대한 내장 가격표를 관리합니다. 가격은 백만 토큰당으로 정의됩니다:

| 프로바이더 | 모델 | 입력 (백만당) | 출력 (백만당) |
|-----------|------|--------------|--------------|
| OpenAI | gpt-4o | $2.50 | $10.00 |
| OpenAI | gpt-4o-mini | $0.15 | $0.60 |
| OpenAI | o3 | $10.00 | $40.00 |
| Anthropic | claude-sonnet-4-20250514 | $3.00 | $15.00 |
| Anthropic | claude-haiku-35-20241022 | $0.80 | $4.00 |
| Anthropic | claude-opus-4-20250514 | $15.00 | $75.00 |
| Google | gemini-2.0-flash | $0.075 | $0.30 |
| DeepSeek | deepseek-chat | $0.14 | $0.28 |

### 사용자 정의 가격

내장 테이블에 없는 모델의 가격을 재정의하거나 추가합니다:

```toml
[cost.pricing."openai/gpt-4o"]
input_per_million = 2.50
output_per_million = 10.00

[cost.pricing."custom/my-model"]
input_per_million = 1.00
output_per_million = 3.00
```

셀프 호스팅 모델 (Ollama, vLLM)에서 API 호출이 무료인 경우 가격을 0으로 설정합니다:

```toml
[cost.pricing."ollama/llama3"]
input_per_million = 0.0
output_per_million = 0.0
```

## 사용량 보고서

### CLI 명령어

```bash
# 현재 세션 비용 요약 보기
prx cost

# 일별 분석 보기
prx cost --period daily

# 프로바이더별 월간 분석 보기
prx cost --period monthly --group-by provider

# 특정 날짜 범위의 비용 보기
prx cost --from 2026-03-01 --to 2026-03-15

# CSV로 내보내기
prx cost --period monthly --format csv > costs.csv

# JSON으로 내보내기 (프로그래밍 방식 소비용)
prx cost --period daily --format json
```

### 출력 예시

```
PRX Cost Report (2026-03-21)
════════════════════════════════════════════════════
Provider     Model                   Tokens (in/out)    Cost
─────────────────────────────────────────────────────────────
anthropic    claude-sonnet-4-20250514      45.2K / 12.8K    $0.33
openai       gpt-4o                  22.1K / 8.4K     $0.14
openai       gpt-4o-mini              8.3K / 3.1K     $0.00
─────────────────────────────────────────────────────────────
Total                                75.6K / 24.3K    $0.47

Budget Status:
  Session: $0.47 / $2.00 (23.5%)
  Daily:   $3.82 / $10.00 (38.2%)
  Monthly: $42.15 / $200.00 (21.1%)
```

## 예산 알림

비용이 예산 한도에 근접하면 PRX는 `on_limit` 설정에 따라 조치를 취합니다:

| 임계값 | `on_limit = "warn"` | `on_limit = "stop"` |
|--------|--------------------|--------------------|
| 한도의 80% | 경고 로그 | 경고 로그 |
| 한도의 100% | 오류 로그, 계속 진행 | LLM 요청 차단, 사용자에게 알림 |
| 한도 리셋 (새 일/월) | 카운터 리셋 | 카운터 리셋, 요청 차단 해제 |

예산 알림은 관측성 이벤트로도 발생합니다. Prometheus 메트릭이 활성화되면 다음 게이지가 내보내집니다:

```
prx_cost_daily_total{currency="USD"} 3.82
prx_cost_monthly_total{currency="USD"} 42.15
prx_cost_session_total{currency="USD"} 0.47
prx_cost_budget_daily_remaining{currency="USD"} 6.18
prx_cost_budget_monthly_remaining{currency="USD"} 157.85
```

## 관측성과의 통합

비용 데이터는 PRX 관측성 스택과 통합됩니다:

- **Prometheus** -- 프로바이더/모델별 토큰 수와 비용 게이지
- **OpenTelemetry** -- `prx.tokens.input`, `prx.tokens.output`, `prx.cost` 스팬 속성
- **로그** -- 요청별 비용은 DEBUG 레벨, 예산 경고는 WARN 레벨로 로그

## 보안 참고

- 비용 데이터는 사용 패턴을 드러낼 수 있습니다. 다중 사용자 배포에서는 비용 보고서에 대한 접근을 제한하세요.
- 영구 비용 데이터베이스 (`cost.db`)에는 사용 이력이 포함됩니다. 백업 전략에 포함시키세요.
- 예산 한도는 로컬에서 적용됩니다. 프로바이더 측 지출 한도와 상호작용하지 않습니다. 심층 방어를 위해 양쪽 모두 설정하세요.

## 관련 페이지

- [관측성 개요](/ko/prx/observability/)
- [Prometheus 메트릭](/ko/prx/observability/prometheus)
- [OpenTelemetry](/ko/prx/observability/opentelemetry)
- [프로바이더 설정](/ko/prx/providers/)
