---
title: 프로바이더 프로필
description: PRX에서 여러 프로바이더 계정을 관리하기 위한 명명된 인증 프로필입니다.
---

# 프로바이더 프로필

프로바이더 프로필을 사용하면 동일한 프로바이더에 대해 여러 인증 컨텍스트를 설정할 수 있습니다. 이는 개인용과 업무용으로 별도의 계정이 있거나 개발용과 프로덕션용 API 키를 전환할 때 유용합니다.

## 개요

프로필은 다음을 포함하는 명명된 설정입니다:

- 프로바이더 식별자
- 인증 자격 증명 (API 키 또는 OAuth2 토큰)
- 모델 선호도
- 속도 제한 오버라이드

## 설정

```toml
[[auth.profiles]]
name = "personal"
provider = "anthropic"
api_key = "sk-ant-personal-..."
default_model = "claude-haiku"

[[auth.profiles]]
name = "work"
provider = "anthropic"
api_key = "sk-ant-work-..."
default_model = "claude-sonnet-4-6"
```

## 프로필 전환

```bash
# 특정 프로필 사용
prx chat --profile work

# 기본 프로필 설정
prx auth set-default work

# 프로필 목록
prx auth profiles
```

## 환경 변수

프로필은 자격 증명에 환경 변수를 참조할 수 있습니다:

```toml
[[auth.profiles]]
name = "ci"
provider = "anthropic"
api_key = "${ANTHROPIC_API_KEY}"
```

## 관련 페이지

- [인증 개요](./)
- [OAuth2 흐름](./oauth2)
- [시크릿 관리](/ko/prx/security/secrets)
