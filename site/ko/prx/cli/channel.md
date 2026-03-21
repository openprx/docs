---
title: prx channel
description: 메시징 채널 연결을 관리합니다 -- 목록, 추가, 제거, 시작, 채널 진단을 수행합니다.
---

# prx channel

PRX가 연결하는 메시징 채널을 관리합니다. 채널은 메시징 플랫폼(Telegram, Discord, Slack 등)과 PRX 에이전트 런타임 사이의 브릿지입니다.

## 사용법

```bash
prx channel <SUBCOMMAND> [OPTIONS]
```

## 하위 명령어

### `prx channel list`

구성된 모든 채널과 현재 상태를 나열합니다.

```bash
prx channel list [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--json` | `-j` | `false` | JSON으로 출력 |
| `--verbose` | `-v` | `false` | 상세 연결 정보 표시 |

**출력 예시:**

```
 Name         Type       Status      Uptime
 telegram-main  telegram   connected   3d 14h
 discord-dev    discord    connected   3d 14h
 slack-team     slack      error       --
 cli            cli        stopped     --
```

### `prx channel add`

대화형으로 또는 플래그를 사용하여 새 채널 구성을 추가합니다.

```bash
prx channel add [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--type` | `-t` | | 채널 유형 (예: `telegram`, `discord`, `slack`) |
| `--name` | `-n` | 자동 생성 | 채널의 표시 이름 |
| `--token` | | | 봇 토큰 또는 API 키 |
| `--enabled` | | `true` | 채널 즉시 활성화 |
| `--interactive` | `-i` | `true` | 대화형 마법사 사용 |

```bash
# 대화형 모드 (안내 프롬프트)
prx channel add

# 플래그를 사용한 비대화형 모드
prx channel add --type telegram --name my-bot --token "123456:ABC-DEF"
```

### `prx channel remove`

채널 구성을 제거합니다.

```bash
prx channel remove <NAME> [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--force` | `-f` | `false` | 확인 프롬프트 건너뛰기 |

```bash
prx channel remove slack-team
prx channel remove slack-team --force
```

### `prx channel start`

데몬을 재시작하지 않고 특정 채널을 시작(또는 재시작)합니다.

```bash
prx channel start <NAME>
```

```bash
# 오류가 발생한 채널 재시작
prx channel start slack-team
```

이 명령은 실행 중인 데몬에 제어 메시지를 보냅니다. 이 명령이 작동하려면 데몬이 실행 중이어야 합니다.

### `prx channel doctor`

채널 연결에 대한 진단을 실행합니다. 토큰 유효성, 네트워크 연결, 웹훅 URL, 권한을 확인합니다.

```bash
prx channel doctor [NAME]
```

`NAME`을 생략하면 모든 채널이 확인됩니다.

```bash
# 모든 채널 확인
prx channel doctor

# 특정 채널 확인
prx channel doctor telegram-main
```

**출력 예시:**

```
 telegram-main
   Token valid ...................... OK
   API reachable ................... OK
   Webhook URL configured ......... OK
   Bot permissions ................. OK (read, send, edit, delete)

 slack-team
   Token valid ...................... OK
   API reachable ................... FAIL (timeout after 5s)
   Suggestion: Check network connectivity or Slack API status
```

## 예시

```bash
# 전체 워크플로: 추가, 확인, 시작
prx channel add --type discord --name dev-server --token "MTIz..."
prx channel doctor dev-server
prx channel start dev-server

# 스크립팅을 위해 채널을 JSON으로 나열
prx channel list --json | jq '.[] | select(.status == "error")'
```

## 관련 문서

- [채널 개요](/ko/prx/channels/) -- 채널에 대한 상세 문서
- [prx daemon](./daemon) -- 채널 연결을 실행하는 데몬
- [prx doctor](./doctor) -- 채널을 포함한 전체 시스템 진단
