---
title: 빠른 시작
description: 5분 만에 PRX를 실행합니다. 설치하고, LLM 프로바이더를 구성하고, 데몬을 시작하고, 대화를 시작합니다.
---

# 빠른 시작

이 가이드는 제로에서 실행 중인 PRX 에이전트까지 5분 이내에 도달할 수 있도록 안내합니다.

## 1단계: PRX 설치

최신 릴리스를 설치합니다:

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

설치를 확인합니다:

```bash
prx --version
```

::: tip
대체 방법(Cargo, 소스 빌드, Docker)은 [설치 가이드](./installation)를 참조하세요.
:::

## 2단계: 온보딩 마법사 실행

온보딩 마법사가 대화형으로 LLM 프로바이더, API 키, 초기 설정을 구성합니다:

```bash
prx onboard
```

마법사가 안내하는 항목:

1. **프로바이더 선택** -- Anthropic, OpenAI, Ollama, OpenRouter 등
2. **API 키 입력** -- 설정 파일에 안전하게 저장됨
3. **기본 모델 선택** -- 마법사가 프로바이더에서 사용 가능한 모델을 가져옵니다
4. **메모리 백엔드 설정** -- Markdown (기본), SQLite 또는 PostgreSQL

마법사가 완료되면 설정이 `~/.config/openprx/openprx.toml`에 저장됩니다.

::: info 빠른 설정
프로바이더와 모델을 이미 알고 있다면 대화형 마법사를 건너뛸 수 있습니다:

```bash
prx onboard --provider anthropic --api-key sk-ant-... --model claude-sonnet-4-20250514
```

모든 옵션은 [온보딩 마법사](./onboarding)를 참조하세요.
:::

## 3단계: 데몬 시작

PRX 데몬을 백그라운드에서 시작합니다. 데몬은 에이전트 런타임, 게이트웨이 API, 구성된 모든 채널을 관리합니다:

```bash
prx daemon
```

기본적으로 데몬은 `127.0.0.1:3120`에서 수신 대기합니다. 호스트와 포트를 사용자 지정할 수 있습니다:

```bash
prx daemon --host 0.0.0.0 --port 8080
```

::: tip 서비스로 실행
프로덕션 배포의 경우 PRX를 시스템 서비스로 설치하여 부팅 시 자동으로 시작되도록 합니다:

```bash
prx service install
```

이 명령은 systemd 유닛(Linux) 또는 launchd plist(macOS)를 생성합니다. 자세한 내용은 [prx service](../cli/service)를 참조하세요.
:::

## 4단계: PRX와 대화

터미널에서 직접 대화형 채팅 세션을 엽니다:

```bash
prx chat
```

이 명령은 실행 중인 데몬에 연결하고 구성된 LLM과 대화할 수 있는 REPL을 엽니다. 메시지를 입력하고 Enter를 누르세요:

```
You: What can you help me with?
PRX: I can help you with a wide range of tasks...
```

단일 세션에 대해 프로바이더와 모델을 지정할 수도 있습니다:

```bash
prx chat --provider ollama --model llama3.2
```

`Ctrl+C`를 누르거나 `/quit`을 입력하여 채팅을 종료합니다.

## 5단계: 채널 연결

PRX는 19개 메시징 채널을 지원합니다. 채널을 연결하려면 `~/.config/openprx/openprx.toml` 파일에 구성을 추가하세요.

예를 들어 Telegram 봇을 연결하려면:

```toml
[channels.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["your_telegram_username"]
```

그런 다음 데몬을 재시작하여 새 채널을 적용합니다:

```bash
prx daemon
```

또는 채널 관리 명령을 사용합니다:

```bash
prx channel add telegram
```

지원되는 플랫폼의 전체 목록과 구성은 [채널 개요](../channels/)를 참조하세요.

## 6단계: 상태 확인

PRX 인스턴스의 현재 상태를 확인합니다:

```bash
prx status
```

표시되는 정보:

- **버전** 및 바이너리 경로
- **워크스페이스** 디렉터리
- **설정** 파일 위치
- **프로바이더** 및 사용 중인 모델
- **활성 채널** 및 연결 상태
- **메모리 백엔드** 및 통계
- **가동 시간** 및 리소스 사용량

출력 예시:

```
PRX Status

Version:     0.3.0
Workspace:   /home/user/.local/share/openprx
Config:      /home/user/.config/openprx/openprx.toml
Provider:    anthropic (claude-sonnet-4-20250514)
Memory:      markdown (/home/user/.local/share/openprx/memory)
Channels:    telegram (connected), cli (active)
Gateway:     http://127.0.0.1:3120
Uptime:      2h 15m
```

## 다음은?

PRX가 실행 중이니 나머지 문서를 살펴보세요:

| 주제 | 설명 |
|------|------|
| [온보딩 마법사](./onboarding) | 모든 온보딩 옵션 상세 설명 |
| [채널](../channels/) | Telegram, Discord, Slack 및 16개 이상의 플랫폼 연결 |
| [프로바이더](../providers/) | LLM 프로바이더 구성 및 전환 |
| [도구](../tools/) | 46개 이상의 내장 도구 탐색 |
| [자기 진화](../self-evolution/) | L1/L2/L3 진화 시스템 소개 |
| [설정](../config/) | 모든 옵션이 포함된 전체 설정 레퍼런스 |
| [CLI 레퍼런스](../cli/) | 전체 명령어 레퍼런스 |
