---
title: 플러그인 시스템
description: 에이전트 기능을 확장하기 위한 PRX의 WASM 기반 플러그인 시스템 개요입니다.
---

# 플러그인 시스템

PRX는 코어 코드베이스를 수정하지 않고 에이전트 기능을 확장할 수 있는 WebAssembly (WASM) 플러그인 시스템을 지원합니다. 플러그인은 호스트 함수에 대한 제어된 접근 권한을 가진 샌드박스 WASM 런타임에서 실행됩니다.

## 개요

플러그인 시스템은 다음을 제공합니다:

- **샌드박스 실행** -- 플러그인은 메모리 격리가 적용된 WASM에서 실행
- **호스트 함수 API** -- HTTP, 파일시스템, 에이전트 상태에 대한 제어된 접근
- **핫 리로딩** -- 데몬 재시작 없이 플러그인 로드 및 언로드
- **다중 언어 지원** -- Rust, Go, C 또는 WASM으로 컴파일되는 모든 언어로 플러그인 작성

## 플러그인 유형

| 유형 | 설명 | 예시 |
|------|------|------|
| **도구 플러그인** | 에이전트에 새 도구 추가 | 사용자 정의 API 통합 |
| **채널 플러그인** | 새 메시징 채널 추가 | 사용자 정의 채팅 플랫폼 |
| **필터 플러그인** | 메시지 전/후 처리 | 콘텐츠 모더레이션 |
| **프로바이더 플러그인** | 새 LLM 프로바이더 추가 | 사용자 정의 모델 엔드포인트 |

## 빠른 시작

```bash
# URL에서 플러그인 설치
prx plugin install https://example.com/my-plugin.wasm

# 설치된 플러그인 목록
prx plugin list

# 플러그인 활성화/비활성화
prx plugin enable my-plugin
prx plugin disable my-plugin
```

## 설정

```toml
[plugins]
enabled = true
directory = "~/.local/share/openprx/plugins"
max_memory_mb = 64
max_execution_time_ms = 5000

[[plugins.registry]]
name = "my-plugin"
path = "~/.local/share/openprx/plugins/my-plugin.wasm"
enabled = true
```

## 관련 페이지

- [아키텍처](./architecture)
- [개발자 가이드](./developer-guide)
- [호스트 함수](./host-functions)
- [PDK (플러그인 개발 키트)](./pdk)
- [예제](./examples)
