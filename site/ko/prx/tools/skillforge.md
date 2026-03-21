---
title: Skillforge
description: PRX 에이전트 기능을 확장하기 위한 자동화된 스킬 검색, 평가, 통합 파이프라인입니다.
---

# Skillforge

Skillforge는 외부 소스에서 새로운 스킬(도구)을 검색, 평가, 통합하기 위한 PRX의 자동화된 파이프라인입니다. 모든 도구를 수동으로 설정하는 대신, Skillforge가 GitHub 리포지토리와 Clawhub 레지스트리를 탐색하고, 검색된 스킬이 에이전트의 필요에 맞는지 평가하며, 통합 매니페스트를 생성할 수 있습니다 -- 모두 사람의 개입 없이.

## 개요

Skillforge 파이프라인은 세 단계로 구성됩니다:

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Scout      │────▶│   Evaluate   │────▶│  Integrate   │
│              │     │              │     │              │
│ Discover     │     │ Fitness      │     │ Manifest     │
│ skills from  │     │ scoring,     │     │ generation,  │
│ GitHub,      │     │ security     │     │ config       │
│ Clawhub      │     │ review       │     │ injection    │
└─────────────┘     └──────────────┘     └──────────────┘
```

| 단계 | 트레이트 | 책임 |
|------|---------|------|
| **Scout** | `Scout` | 설정된 소스에서 후보 스킬 검색 |
| **Evaluate** | `Evaluator` | 적합도, 보안, 호환성에 대해 각 후보 점수 산정 |
| **Integrate** | `Integrator` | 매니페스트 생성 및 도구 레지스트리에 스킬 등록 |

## 아키텍처

Skillforge는 세 가지 핵심 비동기 트레이트로 구성됩니다: `Scout` (`SearchCriteria`에 매칭되는 후보 검색), `Evaluator` (적합도와 보안에 대해 후보 점수 산정), `Integrator` (매니페스트 생성 및 스킬 등록). 각 트레이트는 여러 구현을 가질 수 있으며, 파이프라인 오케스트레이터가 이들을 순서대로 실행하면서 각 단계에서 후보를 필터링합니다.

## 설정

```toml
[skillforge]
enabled = true

# 자동 검색: 주기적으로 새 스킬을 탐색.
auto_discover = false
discover_interval_hours = 24

# 스킬이 통합되기 위한 최소 평가 점수 (0.0-1.0).
min_fitness_score = 0.7

# 검색된 스킬 통합 전 수동 승인 필요.
require_approval = true

# 검색 실행당 평가할 최대 후보 수.
max_candidates = 20
```

### Scout 소스

Skillforge가 스킬을 검색하는 위치를 설정합니다:

```toml
[skillforge.sources.github]
enabled = true

# 검색할 GitHub 리포지토리.
# org/user 패턴 및 토픽 기반 검색 지원.
search_topics = ["prx-skill", "mcp-server", "ai-tool"]
search_orgs = ["openprx", "modelcontextprotocol"]

# GitHub API 호출 레이트 리밋.
max_requests_per_hour = 30

# 더 높은 레이트 리밋을 위한 GitHub 토큰 (선택).
# token = "${GITHUB_TOKEN}"

[skillforge.sources.clawhub]
enabled = true

# Clawhub 레지스트리 엔드포인트.
registry_url = "https://registry.clawhub.dev"

# 검색할 카테고리.
categories = ["tools", "integrations", "automation"]
```

## Scout 단계

Scout는 설정된 소스에서 후보 스킬을 검색합니다. 각 소스는 `Scout` 트레이트를 다르게 구현합니다:

### GitHub Scout

설정된 토픽, 조직, 검색 쿼리에 매칭되는 GitHub 리포지토리를 검색합니다. 매칭되는 각 리포지토리에서 scout가 추출하는 것:

- 리포지토리 메타데이터 (이름, 설명, 별, 마지막 업데이트)
- README 내용 (기능 분석용)
- 매니페스트 파일 (`prx-skill.toml`, `mcp.json`, `package.json`)
- 라이선스 정보

### Clawhub Scout

발행된 스킬을 위해 Clawhub 레지스트리 API를 쿼리합니다. Clawhub는 다음을 포함하는 구조화된 메타데이터를 제공합니다:

- 스킬 이름, 버전, 설명
- 입출력 스키마
- 의존성 요구사항
- 호환성 태그 (PRX 버전, OS, 런타임)

### 검색 기준

```rust
pub struct SearchCriteria {
    /// 원하는 기능을 설명하는 키워드.
    pub keywords: Vec<String>,

    /// 필수 런타임: "native", "docker", "wasm", 또는 "any".
    pub runtime: String,

    /// 최소 리포지토리 별 수 (GitHub만).
    pub min_stars: u32,

    /// 마지막 커밋의 최대 경과 일수.
    pub max_age_days: u32,

    /// 필수 라이선스 유형 (예: "MIT", "Apache-2.0").
    pub licenses: Vec<String>,
}
```

## Evaluate 단계

각 후보가 Evaluator를 통과하여 적합도 점수와 보안 평가를 생성합니다:

### 평가 기준

| 기준 | 가중치 | 설명 |
|------|--------|------|
| **관련성** | 30% | 스킬이 검색 기준에 얼마나 잘 매칭되는지 |
| **품질** | 25% | 코드 품질 신호: 테스트, CI, 문서 |
| **보안** | 25% | 라이선스 호환성, 의존성 감사, 안전하지 않은 패턴 없음 |
| **유지보수** | 10% | 최근 커밋, 활성 메인테이너, 이슈 응답 시간 |
| **호환성** | 10% | PRX 버전 호환성, 런타임 요구사항 충족 |

### 보안 검사

Evaluator는 자동 보안 분석을 수행합니다: 라이선스 호환성 스캔, 의존성 취약성 감사, 위험한 코드 패턴 감지(네트워크 호출, 파일시스템 접근, eval), 샌드박스 호환성 검증.

`Evaluation` 구조체는 전체 `fitness_score` (0.0-1.0), 기준별 점수, `security_status` (`safe`/`caution`/`blocked`), 사람이 읽을 수 있는 요약, 우려 사항 목록을 포함합니다.

## Integrate 단계

평가 임계값을 통과한 스킬이 통합 단계에 진입합니다:

### 매니페스트 생성

Integrator가 스킬을 설치하고 등록하는 방법을 설명하는 `Manifest`를 생성합니다:

```toml
# 생성된 매니페스트: ~/.local/share/openprx/skills/web-scraper/manifest.toml
[skill]
name = "web-scraper"
version = "1.2.0"
source = "github:example/web-scraper"
runtime = "docker"
fitness_score = 0.85
integrated_at = "2026-03-21T10:30:00Z"

[skill.tool]
name = "web_scrape"
description = "Scrape and extract structured data from web pages."

[skill.tool.parameters]
url = { type = "string", required = true, description = "URL to scrape" }
selector = { type = "string", required = false, description = "CSS selector" }
format = { type = "string", required = false, default = "text", description = "Output format" }

[skill.runtime]
image = "example/web-scraper:1.2.0"
network = "restricted"
timeout_secs = 30
```

### 등록

매니페스트가 생성되면 스킬이 PRX 도구 레지스트리에 등록됩니다. `require_approval = true`이면 매니페스트가 검토를 위해 대기됩니다:

```bash
# 대기 중인 스킬 통합 나열
prx skillforge pending

# 대기 중인 스킬 검토
prx skillforge review web-scraper

# 통합 승인
prx skillforge approve web-scraper

# 통합 거부
prx skillforge reject web-scraper --reason "Security concerns"
```

## CLI 명령

```bash
# 수동으로 검색 실행 트리거
prx skillforge discover

# 특정 키워드로 검색
prx skillforge discover --keywords "web scraping" "data extraction"

# 특정 리포지토리 평가
prx skillforge evaluate github:example/web-scraper

# 통합된 모든 스킬 나열
prx skillforge list

# 스킬 상세 표시
prx skillforge info web-scraper

# 통합된 스킬 제거
prx skillforge remove web-scraper

# 통합된 모든 스킬 재평가 (업데이트, 보안 이슈 확인)
prx skillforge audit
```

## 자기 진화와의 통합

Skillforge는 PRX의 [자기 진화 파이프라인](/ko/prx/self-evolution/)과 통합됩니다. 에이전트가 기능 격차를 식별하면 자동으로 검색 실행을 트리거하여 -- 탐색, 평가, (승인되면) 다음 턴을 위한 매칭 스킬 통합을 수행할 수 있습니다.

## 보안 참고

- **승인 게이트** -- 프로덕션에서는 항상 `require_approval = true`로 설정하세요. 신뢰할 수 없는 코드의 자동 통합은 보안 위험입니다.
- **샌드박스 강제** -- 통합된 스킬은 내장 도구와 동일한 샌드박스 제약 내에서 실행됩니다. 샌드박스 백엔드가 설정되어 있어야 합니다.
- **소스 신뢰** -- 신뢰하는 scout 소스만 활성화하세요. 공개 GitHub 검색은 악성 리포지토리를 반환할 수 있습니다.
- **매니페스트 검토** -- 승인 전에 생성된 매니페스트를 검토하세요. `runtime`, `network`, `timeout_secs` 설정을 확인하세요.
- **감사 추적** -- 모든 Skillforge 작업이 컴플라이언스 검토를 위해 활동 로그에 기록됩니다.

## 관련 페이지

- [도구 개요](/ko/prx/tools/)
- [자기 진화 파이프라인](/ko/prx/self-evolution/pipeline)
- [보안 정책 엔진](/ko/prx/security/policy-engine)
- [런타임 백엔드](/ko/prx/agent/runtime-backends)
- [MCP 통합](/ko/prx/tools/mcp)
