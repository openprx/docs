---
title: 문제 해결
description: 진단 도구와 FAQ를 포함한 PRX의 일반적인 문제와 해결 방법입니다.
---

# 문제 해결

이 섹션은 PRX 실행 시 발생하는 일반적인 문제와 해결 방법을 다룹니다.

## 빠른 진단

내장된 doctor 명령으로 종합적인 상태 점검을 실행합니다:

```bash
prx doctor
```

이 명령은 다음을 확인합니다:

- 설정 파일 유효성
- 프로바이더 연결 및 인증
- 시스템 의존성
- 디스크 공간 및 권한
- 활성 데몬 상태

## 일반적인 문제

### 데몬이 시작되지 않음

**증상**: `prx daemon`이 즉시 종료되거나 바인딩에 실패합니다.

**해결 방법**:
- 다른 인스턴스가 실행 중인지 확인: `prx daemon status`
- 포트가 사용 가능한지 확인: `ss -tlnp | grep 3120`
- 로그 확인: `prx daemon logs`
- 설정 검증: `prx config check`

### 프로바이더 인증 실패

**증상**: "Unauthorized" 또는 "Invalid API key" 오류 발생.

**해결 방법**:
- API 키 확인: `prx auth status`
- 재인증: `prx auth login <provider>`
- 환경 변수 확인: `env | grep API_KEY`

### 높은 메모리 사용량

**증상**: PRX 프로세스가 과도한 메모리를 소비합니다.

**해결 방법**:
- 동시 세션 수 줄이기: `[agent.limits] max_concurrent_sessions` 설정
- 메모리 정리 활성화: `prx memory compact`
- 장시간 실행 세션 확인: `prx session list`

### 도구 실행 멈춤

**증상**: 도구 실행 중 에이전트가 멈춘 것처럼 보입니다.

**해결 방법**:
- 샌드박스 설정 확인
- 도구 의존성이 설치되어 있는지 확인
- 타임아웃 설정: `[agent] session_timeout_secs = 300`
- 세션 취소: `prx session cancel <id>`

## 도움 받기

- 자세한 진단 절차는 [진단](./diagnostics) 페이지를 참조하세요
- GitHub에서 이슈 열기: `https://github.com/openprx/prx/issues`
- 실시간 도움을 위해 커뮤니티 Discord에 참여하세요

## 관련 페이지

- [진단](./diagnostics)
