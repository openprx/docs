---
title: Sub-agents
description: PRX가 병렬 태스크 실행을 위해 자식 에이전트를 생성하는 방법, 동시성 제한 및 깊이 제어를 포함합니다.
---

# Sub-agents

PRX는 실행 중인 에이전트 세션 내에서 서브 에이전트(자식 에이전트)를 생성할 수 있습니다. 이를 통해 부모 에이전트가 동시에 실행되는 전문화된 자식에게 작업을 위임하는 병렬 태스크 분해가 가능합니다.

## 개요

서브 에이전트는 다음과 같은 경량 에이전트 인스턴스입니다:

- 부모의 프로바이더 설정 및 자격 증명을 공유합니다
- 자체 대화 기록과 메모리 범위를 가집니다
- 부모의 샌드박스 정책 내에서 실행됩니다
- 완료 시 결과를 부모에게 보고합니다

## 생성 모델

부모 에이전트는 내장 `spawn_agent` 도구를 통해 서브 에이전트를 생성할 수 있습니다. 각 자식은 다음을 받습니다:

- 태스크 설명 (시스템 프롬프트 오버라이드)
- 허용된 도구의 선택적 세트 (부모 도구의 하위 집합)
- 최대 턴 예산

```
Parent Agent
  ├── Sub-agent 1 (research task)
  ├── Sub-agent 2 (code generation)
  └── Sub-agent 3 (validation)
```

## 동시성 제한

리소스 고갈을 방지하기 위해 PRX는 동시성 제한을 적용합니다:

```toml
[agent.subagents]
max_concurrent = 4
max_depth = 3
max_total_spawns = 20
child_timeout_secs = 300
```

- **max_concurrent** -- 동시에 실행되는 자식 에이전트의 최대 수
- **max_depth** -- 최대 중첩 깊이 (서브 에이전트가 서브 에이전트를 생성)
- **max_total_spawns** -- 루트 세션당 총 생성 예산
- **child_timeout_secs** -- 개별 자식 실행의 타임아웃

## 깊이 제어

각 서브 에이전트는 깊이 수준을 추적합니다. 최대 깊이에 도달하면 `spawn_agent` 도구가 자식의 사용 가능한 도구에서 제거되어 추가 중첩을 방지합니다.

## 결과 집계

모든 자식이 완료되면 결과가 수집되어 부모 에이전트에게 도구 호출 결과로 제시됩니다. 부모는 출력을 종합하여 최종 응답을 만들 수 있습니다.

## 관련 페이지

- [Agent Runtime](./runtime) -- 아키텍처 개요
- [Agent Loop](./loop) -- 핵심 실행 주기
- [Session Worker](./session-worker) -- 프로세스 격리
