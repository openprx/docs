---
title: prx doctor
description: 데몬 상태, 채널 상태, 모델 가용성을 확인하기 위한 시스템 진단을 실행합니다.
---

# prx doctor

PRX 설치에 대한 종합 진단을 실행합니다. 설정 유효성, 데몬 연결, 채널 상태, 프로바이더 API 접근, 모델 가용성을 확인합니다.

## 사용법

```bash
prx doctor [SUBCOMMAND] [OPTIONS]
```

## 옵션

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--config` | `-c` | `~/.config/prx/config.toml` | 설정 파일 경로 |
| `--json` | `-j` | `false` | JSON으로 출력 |
| `--verbose` | `-v` | `false` | 상세 점검 출력 표시 |
| `--fix` | | `false` | 일반적인 문제 자동 수정 시도 |

## 하위 명령어

### `prx doctor` (하위 명령어 없음)

모든 진단 점검을 실행합니다.

```bash
prx doctor
```

**출력 예시:**

```
 PRX Doctor
 ══════════════════════════════════════════

 Configuration
   Config file exists ............... OK
   Config file valid ................ OK
   Data directory writable .......... OK

 Daemon
   Daemon running ................... OK (PID 12345)
   Gateway reachable ................ OK (127.0.0.1:3120)
   Uptime ........................... 3d 14h 22m

 Providers
   anthropic ....................... OK (claude-sonnet-4-20250514)
   ollama .......................... OK (llama3, 2 models)
   openai .......................... WARN (key not configured)

 Channels
   telegram-main ................... OK (connected)
   discord-dev ..................... OK (connected)
   slack-team ...................... FAIL (auth error)

 Memory
   Backend (sqlite) ................ OK
   Entries ......................... 1,247

 Evolution
   Engine .......................... OK (running)
   Last L1 cycle ................... 2h ago

 Summary: 10 passed, 1 warning, 1 failure
```

### `prx doctor models`

모든 구성된 프로바이더에서 모델 가용성을 확인합니다.

```bash
prx doctor models [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--provider` | `-P` | 전체 | 특정 프로바이더만 확인 |

```bash
# 모든 프로바이더 모델 확인
prx doctor models

# Ollama 모델만 확인
prx doctor models --provider ollama
```

**출력 예시:**

```
 Provider     Model                        Status    Latency
 anthropic    claude-sonnet-4-20250514              OK        245ms
 anthropic    claude-haiku-4-20250514               OK        189ms
 ollama       llama3                       OK        12ms
 ollama       codellama                    OK        15ms
 openai       gpt-4o                       SKIP (no key)
```

## 진단 점검 항목

doctor가 실행하는 점검 항목:

| 범주 | 점검 | 설명 |
|------|------|------|
| 설정 | 파일 존재 여부 | 예상 경로에 설정 파일이 있는지 확인 |
| 설정 | 유효한 구문 | TOML이 오류 없이 파싱되는지 확인 |
| 설정 | 스키마 유효 | 모든 값이 예상 유형 및 범위와 일치하는지 확인 |
| 데몬 | 프로세스 실행 중 | 데몬 PID가 활성 상태인지 확인 |
| 데몬 | 게이트웨이 접근 가능 | HTTP 상태 엔드포인트가 응답하는지 확인 |
| 프로바이더 | API 키 설정 | 필수 API 키가 구성되어 있는지 확인 |
| 프로바이더 | API 접근 가능 | 프로바이더 API가 테스트 요청에 응답하는지 확인 |
| 채널 | 토큰 유효 | 채널 봇 토큰이 수락되는지 확인 |
| 채널 | 연결됨 | 채널이 활성 연결 상태인지 확인 |
| 메모리 | 백엔드 사용 가능 | 메모리 저장소에 접근 가능한지 확인 |
| 진화 | 엔진 실행 중 | 진화 엔진이 활성 상태인지 확인 |

## 자동 수정

`--fix` 플래그는 일반적인 문제를 자동으로 해결하려고 시도합니다:

- 누락된 데이터 디렉터리 생성
- 만료된 OAuth 토큰 갱신
- 연결 해제된 채널 재시작
- 잘못된 캐시 항목 제거

```bash
prx doctor --fix
```

## 관련 문서

- [prx daemon](./daemon) -- 데몬이 실행 중이 아닌 경우 시작
- [prx channel doctor](./channel) -- 상세 채널 진단
- [문제 해결](/ko/prx/troubleshooting/) -- 자주 발생하는 오류 및 해결 방법
- [진단 가이드](/ko/prx/troubleshooting/diagnostics) -- 심층 진단
