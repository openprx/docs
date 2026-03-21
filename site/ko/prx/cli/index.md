---
title: CLI 레퍼런스
description: prx 명령줄 인터페이스의 전체 레퍼런스입니다.
---

# CLI 레퍼런스

`prx` 바이너리는 모든 PRX 작업의 단일 진입점입니다 -- 대화형 채팅, 데몬 관리, 채널 관리, 시스템 진단 등을 수행합니다.

## 전역 플래그

이 플래그는 모든 하위 명령에서 사용할 수 있습니다.

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--config` | `-c` | `~/.config/prx/config.toml` | 설정 파일 경로 |
| `--log-level` | `-l` | `info` | 로그 상세도: `trace`, `debug`, `info`, `warn`, `error` |
| `--no-color` | | `false` | 색상 출력 비활성화 |
| `--quiet` | `-q` | `false` | 비필수 출력 억제 |
| `--help` | `-h` | | 도움말 정보 출력 |
| `--version` | `-V` | | 버전 출력 |

## 명령어

| 명령어 | 설명 |
|--------|------|
| [`prx agent`](./agent) | 단일 턴 LLM 상호작용 (파이프 친화적) |
| [`prx chat`](./chat) | 스트리밍 및 기록을 포함한 풍부한 터미널 채팅 |
| [`prx daemon`](./daemon) | 전체 PRX 런타임 시작 (게이트웨이 + 채널 + 크론 + 진화) |
| [`prx gateway`](./gateway) | 독립형 HTTP/WebSocket 게이트웨이 서버 |
| [`prx onboard`](./onboard) | 대화형 설정 마법사 |
| [`prx channel`](./channel) | 채널 관리 (목록, 추가, 제거, 시작, 진단) |
| [`prx cron`](./cron) | 크론 작업 관리 (목록, 추가, 제거, 일시 중지, 재개) |
| [`prx evolution`](./evolution) | 자기 진화 작업 (상태, 기록, 설정, 트리거) |
| [`prx auth`](./auth) | OAuth 프로필 관리 (로그인, 갱신, 로그아웃) |
| [`prx config`](./config) | 설정 작업 (스키마, 분할, 병합, 가져오기, 설정) |
| [`prx doctor`](./doctor) | 시스템 진단 (데몬 상태, 채널 상태, 모델 가용성) |
| [`prx service`](./service) | systemd/OpenRC 서비스 관리 (설치, 시작, 중지, 상태) |
| [`prx skills`](./skills) | 스킬 관리 (목록, 설치, 제거) |
| `prx status` | 시스템 상태 대시보드 |
| `prx models refresh` | 프로바이더 모델 카탈로그 새로 고침 |
| `prx providers` | 지원되는 모든 LLM 프로바이더 목록 |
| `prx completions` | 셸 자동 완성 생성 (bash, zsh, fish) |

## 빠른 예시

```bash
# 최초 설정
prx onboard

# 대화형 채팅 시작
prx chat

# 단일 턴 질의 (스크립트 가능)
echo "Summarize this file" | prx agent -f report.pdf

# 모든 서비스와 함께 데몬 시작
prx daemon

# 시스템 상태 점검
prx doctor
```

## 셸 자동 완성

셸에 맞는 자동 완성을 생성하여 프로필에 추가합니다:

```bash
# Bash
prx completions bash > ~/.local/share/bash-completion/completions/prx

# Zsh
prx completions zsh > ~/.zfunc/_prx

# Fish
prx completions fish > ~/.config/fish/completions/prx.fish
```

## 환경 변수

PRX는 다음 환경 변수를 인식합니다 (설정 파일 값을 재정의합니다):

| 변수 | 설명 |
|------|------|
| `PRX_CONFIG` | 설정 파일 경로 (`--config`과 동일) |
| `PRX_LOG` | 로그 수준 (`--log-level`과 동일) |
| `PRX_DATA_DIR` | 데이터 디렉터리 (기본값: `~/.local/share/prx`) |
| `ANTHROPIC_API_KEY` | Anthropic 프로바이더 API 키 |
| `OPENAI_API_KEY` | OpenAI 프로바이더 API 키 |
| `GOOGLE_API_KEY` | Google Gemini 프로바이더 API 키 |

## 관련 문서

- [설정 개요](/ko/prx/config/) -- 설정 파일 형식 및 옵션
- [시작하기](/ko/prx/getting-started/installation) -- 설치 안내
- [문제 해결](/ko/prx/troubleshooting/) -- 자주 발생하는 오류 및 해결 방법
