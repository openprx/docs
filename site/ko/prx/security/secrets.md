---
title: 시크릿 관리
description: PRX의 API 키 및 자격 증명에 대한 안전한 저장 및 접근 제어입니다.
---

# 시크릿 관리

PRX는 API 키, 토큰, 자격 증명과 같은 민감한 데이터에 대한 안전한 저장을 제공합니다. 시크릿은 저장 시 암호화되며 제어된 API를 통해 접근됩니다.

## 개요

시크릿 시스템:

- AES-256-GCM을 사용하여 저장 시 시크릿 암호화
- 마스터 비밀번호 또는 시스템 키링에서 암호화 키 파생
- 도구 실행을 위한 환경 변수 주입 제공
- 시크릿 로테이션 및 만료 지원

## 저장

시크릿은 `~/.local/share/openprx/secrets.enc`에 암호화된 파일로 저장됩니다. 암호화 키는 다음에서 파생됩니다:

1. 시스템 키링 (사용 가능한 경우 선호)
2. 마스터 비밀번호 (대화형 프롬프트)
3. 환경 변수 `PRX_MASTER_KEY` (자동화용)

## 설정

```toml
[security.secrets]
store_path = "~/.local/share/openprx/secrets.enc"
key_derivation = "argon2id"
auto_rotate_days = 90
```

## CLI 명령어

```bash
prx secret set OPENAI_API_KEY      # 시크릿 설정 (값 입력 프롬프트)
prx secret get OPENAI_API_KEY      # 시크릿 조회
prx secret list                    # 시크릿 이름 목록 (값은 제외)
prx secret delete OPENAI_API_KEY   # 시크릿 삭제
prx secret rotate                  # 마스터 키 로테이션
```

## 관련 페이지

- [보안 개요](./)
- [인증](/ko/prx/auth/)
