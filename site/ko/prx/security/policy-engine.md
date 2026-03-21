---
title: 정책 엔진
description: PRX에서 에이전트 도구 접근 및 데이터 흐름을 제어하기 위한 선언적 보안 정책 엔진입니다.
---

# 정책 엔진

정책 엔진은 에이전트가 사용할 수 있는 도구, 접근할 수 있는 파일, 수행할 수 있는 네트워크 요청을 제어하는 선언적 규칙 시스템입니다. 정책은 모든 도구 호출 전에 평가됩니다.

## 개요

정책은 조건과 작업이 있는 규칙으로 정의됩니다:

- **허용 규칙** -- 특정 작업을 명시적으로 허용
- **거부 규칙** -- 특정 작업을 명시적으로 차단
- **기본 동작** -- 어떤 규칙도 매칭되지 않을 때 적용 (기본적으로 거부)

## 정책 포맷

```toml
[security.policy]
default_action = "deny"

[[security.policy.rules]]
name = "allow-read-workspace"
action = "allow"
tools = ["fs_read"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "block-sensitive-dirs"
action = "deny"
tools = ["fs_read", "fs_write"]
paths = ["/etc/**", "/root/**", "**/.ssh/**"]

[[security.policy.rules]]
name = "allow-http-approved-domains"
action = "allow"
tools = ["http_request"]
domains = ["api.github.com", "api.openai.com"]
```

## 규칙 평가

규칙은 순서대로 평가됩니다. 첫 번째 매칭 규칙이 동작을 결정합니다. 어떤 규칙도 매칭되지 않으면 기본 동작이 적용됩니다.

## 내장 정책

PRX는 다음과 같은 합리적인 기본 정책을 포함합니다:

- 시스템 디렉터리와 민감한 파일에 대한 접근 차단
- 파괴적 작업에 대한 명시적 승인 필요
- 네트워크 요청 레이트 리밋
- 감사를 위한 모든 도구 실행 로그

## 관련 페이지

- [보안 개요](./)
- [샌드박스](./sandbox)
- [위협 모델](./threat-model)
