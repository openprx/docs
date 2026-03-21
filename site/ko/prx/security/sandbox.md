---
title: 샌드박스
description: PRX에서 도구 실행을 격리하기 위한 샌드박스 백엔드입니다.
---

# 샌드박스

PRX 샌드박스는 도구 실행을 위한 프로세스 및 파일시스템 격리를 제공합니다. 에이전트가 외부 명령을 실행하는 도구를 호출하면 샌드박스는 명령이 제한된 환경에서 실행되도록 합니다.

## 샌드박스 백엔드

PRX는 여러 샌드박스 백엔드를 지원합니다:

| 백엔드 | 플랫폼 | 격리 수준 | 오버헤드 |
|--------|--------|----------|---------|
| **Docker** | Linux, macOS | 전체 컨테이너 | 높음 |
| **Bubblewrap** | Linux | 네임스페이스 + seccomp | 낮음 |
| **Firejail** | Linux | 네임스페이스 + seccomp | 낮음 |
| **Landlock** | Linux (5.13+) | 커널 LSM | 최소 |
| **None** | 모두 | 격리 없음 | 없음 |

## 설정

```toml
[security.sandbox]
backend = "bubblewrap"

[security.sandbox.docker]
image = "prx-sandbox:latest"
network = "none"
memory_limit = "256m"
cpu_limit = "1.0"

[security.sandbox.bubblewrap]
allow_network = false
writable_paths = ["/tmp"]
readonly_paths = ["/usr", "/lib"]
```

## 작동 방식

1. 에이전트가 도구 호출을 요청합니다 (예: 셸 명령 실행)
2. 정책 엔진이 호출 허용 여부를 확인합니다
3. 샌드박스가 설정된 백엔드로 실행을 래핑합니다
4. 도구가 제한된 파일시스템 및 네트워크 접근으로 실행됩니다
5. 결과가 캡처되어 에이전트에 반환됩니다

## 관련 페이지

- [보안 개요](./)
- [정책 엔진](./policy-engine)
- [세션 워커](/ko/prx/agent/session-worker)
