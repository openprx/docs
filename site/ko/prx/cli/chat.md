---
title: prx chat
description: 스트리밍 응답, 기록 탐색, 멀티라인 입력을 지원하는 풍부한 터미널 채팅입니다.
---

# prx chat

터미널에서 스트리밍 응답, 대화 기록, 전체 도구 접근이 가능한 대화형 채팅 세션을 시작합니다.

## 사용법

```bash
prx chat [OPTIONS]
```

## 옵션

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--provider` | `-P` | 설정 기본값 | 사용할 LLM 프로바이더 (예: `anthropic`, `openai`, `ollama`) |
| `--model` | `-m` | 프로바이더 기본값 | 모델 식별자 (예: `claude-sonnet-4-20250514`, `gpt-4o`) |
| `--system` | `-s` | | 사용자 지정 시스템 프롬프트 (설정 재정의) |
| `--session` | `-S` | 새 세션 | 이름이 지정된 세션 재개 |
| `--no-tools` | | `false` | 이 세션에서 도구 사용 비활성화 |
| `--no-memory` | | `false` | 메모리 읽기 및 쓰기 비활성화 |
| `--no-stream` | | `false` | 스트리밍 대신 전체 응답 대기 |
| `--max-turns` | | 무제한 | 자동 종료까지 최대 대화 턴 수 |
| `--temperature` | `-t` | 프로바이더 기본값 | 샘플링 온도 (0.0 - 2.0) |

## 대화형 컨트롤

채팅 세션 내에서 다음 키보드 단축키를 사용할 수 있습니다:

| 키 | 동작 |
|----|------|
| `Enter` | 메시지 전송 |
| `Shift+Enter` 또는 `\` 후 `Enter` | 줄 바꿈 (멀티라인 입력) |
| `Up` / `Down` | 메시지 기록 탐색 |
| `Ctrl+C` | 현재 생성 취소 |
| `Ctrl+D` | 채팅 세션 종료 |
| `Ctrl+L` | 화면 지우기 |

## 슬래시 명령어

채팅 입력에서 직접 이 명령어를 입력할 수 있습니다:

| 명령어 | 설명 |
|--------|------|
| `/help` | 사용 가능한 명령어 표시 |
| `/model <name>` | 세션 중 모델 전환 |
| `/provider <name>` | 세션 중 프로바이더 전환 |
| `/system <prompt>` | 시스템 프롬프트 업데이트 |
| `/clear` | 대화 기록 초기화 |
| `/save [name]` | 현재 세션 저장 |
| `/load <name>` | 저장된 세션 불러오기 |
| `/sessions` | 저장된 세션 목록 |
| `/tools` | 사용 가능한 도구 목록 |
| `/exit` | 채팅 종료 |

## 예시

```bash
# 기본 설정으로 시작
prx chat

# 특정 모델 사용
prx chat --provider anthropic --model claude-sonnet-4-20250514

# 이전 세션 재개
prx chat --session project-planning

# 로컬 모델로 빠른 질문
prx chat --provider ollama --model llama3

# 10턴으로 제한 (스크립트 워크플로에 유용)
prx chat --max-turns 10
```

## 세션 관리

채팅 세션은 종료 시 자동으로 저장됩니다. 각 세션은 다음을 기록합니다:

- 대화 메시지 (사용자 + 어시스턴트)
- 도구 호출 및 결과
- 사용된 프로바이더 및 모델
- 타임스탬프 및 지속 시간

세션은 PRX 데이터 디렉터리(기본값: `~/.local/share/prx/sessions/`)에 저장됩니다.

```bash
# 모든 세션 목록
prx chat --session ""  # 빈 이름은 세션을 나열합니다

# 이름으로 재개
prx chat --session my-project
```

## 멀티라인 입력

긴 프롬프트의 경우 멀티라인 모드를 사용합니다. `Shift+Enter`를 눌러 전송하지 않고 줄 바꿈을 삽입합니다. 프롬프트 표시가 `>`에서 `...`로 변경되어 멀티라인 모드임을 나타냅니다.

또는 파일에서 입력을 파이프할 수 있습니다:

```bash
# 채팅은 여전히 대화형으로 열리며, 파일 내용이 첫 번째 메시지로 사용됩니다
prx chat < prompt.txt
```

## 프로바이더 및 모델 재정의

`--provider`와 `--model` 플래그는 세션 기간 동안 설정 파일의 기본값을 재정의합니다. 슬래시 명령어를 사용하여 세션 중에 전환할 수도 있습니다.

```bash
# OpenAI로 시작하고 대화 중에 Anthropic으로 전환
prx chat --provider openai
# 채팅 중: /provider anthropic
# 채팅 중: /model claude-sonnet-4-20250514
```

## 관련 문서

- [prx agent](./agent) -- 비대화형 단일 턴 모드
- [프로바이더 개요](/ko/prx/providers/) -- 지원되는 LLM 프로바이더
- [메모리 개요](/ko/prx/memory/) -- 대화에서 메모리가 작동하는 방식
- [도구 개요](/ko/prx/tools/) -- 채팅 중 사용 가능한 도구
