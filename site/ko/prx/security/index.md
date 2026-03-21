---
title: 보안
description: 정책 엔진, 샌드박스, 시크릿 관리, 위협 모델을 포함한 PRX 보안 모델 개요입니다.
---

# 보안

보안은 PRX의 근본적인 관심사입니다. 자율 에이전트 프레임워크로서 PRX는 에이전트가 수행할 수 있는 작업, 접근할 수 있는 데이터, 외부 시스템과 상호작용하는 방식을 신중하게 제어해야 합니다.

## 보안 레이어

PRX는 여러 보안 레이어를 통해 심층 방어를 구현합니다:

| 레이어 | 컴포넌트 | 목적 |
|--------|---------|------|
| 정책 | [정책 엔진](./policy-engine) | 도구 접근 및 데이터 흐름에 대한 선언적 규칙 |
| 격리 | [샌드박스](./sandbox) | 도구 실행을 위한 프로세스/컨테이너 격리 |
| 인증 | [페어링](./pairing) | 디바이스 페어링 및 신원 확인 |
| 시크릿 | [시크릿 관리](./secrets) | API 키 및 자격 증명의 안전한 저장 |

## 설정

```toml
[security]
sandbox_backend = "bubblewrap"  # "docker" | "firejail" | "bubblewrap" | "landlock" | "none"
require_tool_approval = true
max_tool_calls_per_turn = 10

[security.policy]
default_action = "deny"
```

## 위협 모델

PRX의 [위협 모델](./threat-model)은 적대적 입력, 프롬프트 인젝션, 도구 남용, 데이터 유출을 주요 위협 벡터로 고려합니다.

## 관련 페이지

- [정책 엔진](./policy-engine)
- [페어링](./pairing)
- [샌드박스](./sandbox)
- [시크릿 관리](./secrets)
- [위협 모델](./threat-model)
