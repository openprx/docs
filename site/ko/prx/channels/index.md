---
title: 채널 개요
description: PRX는 19개 메시징 플랫폼에 연결됩니다. 모든 채널의 개요, 비교 매트릭스, 설정 패턴, DM 정책을 설명합니다.
---

# 채널

채널은 PRX를 외부 세계에 연결하는 메시징 플랫폼 통합입니다. 각 채널은 메시지 송수신, 미디어 처리, 타이핑 표시 관리, 상태 점검을 위한 통합 인터페이스를 구현합니다. PRX는 단일 데몬 프로세스에서 여러 채널을 동시에 실행할 수 있습니다.

## 지원되는 채널

PRX는 소비자 플랫폼, 엔터프라이즈 도구, 오픈 소스 프로토콜, 개발자 인터페이스에 걸쳐 19개 메시징 채널을 지원합니다.

### 채널 비교 매트릭스

| 채널 | DM | 그룹 | 미디어 | 음성 | E2EE | 플랫폼 | 상태 |
|------|:--:|:----:|:------:|:----:|:----:|--------|:----:|
| [Telegram](./telegram) | 예 | 예 | 예 | 아니오 | 아니오 | 크로스 플랫폼 | 안정 |
| [Discord](./discord) | 예 | 예 | 예 | 아니오 | 아니오 | 크로스 플랫폼 | 안정 |
| [Slack](./slack) | 예 | 예 | 예 | 아니오 | 아니오 | 크로스 플랫폼 | 안정 |
| [WhatsApp](./whatsapp) | 예 | 예 | 예 | 아니오 | 예 | Cloud API | 안정 |
| [WhatsApp Web](./whatsapp-web) | 예 | 예 | 예 | 아니오 | 예 | 멀티 디바이스 | 베타 |
| [Signal](./signal) | 예 | 예 | 예 | 아니오 | 예 | 크로스 플랫폼 | 안정 |
| [iMessage](./imessage) | 예 | 예 | 예 | 아니오 | 예 | macOS 전용 | 베타 |
| [Matrix](./matrix) | 예 | 예 | 예 | 아니오 | 예 | 페더레이션 | 안정 |
| [Email](./email) | 예 | 아니오 | 예 | 아니오 | 아니오 | IMAP/SMTP | 안정 |
| [Lark / Feishu](./lark) | 예 | 예 | 예 | 아니오 | 아니오 | 크로스 플랫폼 | 안정 |
| [DingTalk](./dingtalk) | 예 | 예 | 예 | 아니오 | 아니오 | 크로스 플랫폼 | 안정 |
| [QQ](./qq) | 예 | 예 | 예 | 아니오 | 아니오 | 크로스 플랫폼 | 베타 |
| [Mattermost](./mattermost) | 예 | 예 | 예 | 아니오 | 아니오 | 셀프 호스팅 | 안정 |
| [Nextcloud Talk](./nextcloud-talk) | 예 | 예 | 예 | 아니오 | 아니오 | 셀프 호스팅 | 베타 |
| [IRC](./irc) | 예 | 예 | 아니오 | 아니오 | 아니오 | 페더레이션 | 안정 |
| [LINQ](./linq) | 예 | 예 | 예 | 아니오 | 아니오 | 파트너 API | 알파 |
| [CLI](./cli) | 예 | 아니오 | 아니오 | 아니오 | 해당없음 | 터미널 | 안정 |
| Terminal | 예 | 아니오 | 아니오 | 아니오 | 해당없음 | 터미널 | 안정 |
| Wacli | 예 | 예 | 예 | 아니오 | 예 | JSON-RPC | 베타 |

**범례:**
- **안정** -- 프로덕션 준비 완료, 완전히 테스트됨
- **베타** -- 기능적이나 알려진 제한 사항 있음
- **알파** -- 실험적, API 변경 가능

## 공통 설정 패턴

모든 채널은 `~/.config/openprx/openprx.toml`의 `[channels]` 섹션에서 구성됩니다. 각 채널에는 플랫폼별 설정이 포함된 자체 하위 섹션이 있습니다.

### 기본 구조

```toml
[channels]
# 내장 CLI 채널 활성화 (기본값: true)
cli = true

# 메시지당 처리 타임아웃(초) (기본값: 300)
message_timeout_secs = 300

# ── Telegram ──────────────────────────────────────────────
[channels.telegram]
bot_token = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
allowed_users = ["alice", "bob"]
stream_mode = "edit"            # "edit" | "append" | "none"
mention_only = false

# ── Discord ───────────────────────────────────────────────
[channels.discord]
bot_token = "MTIzNDU2Nzg5.XXXXXX.XXXXXXXXXX"
guild_id = "1234567890"         # 선택 사항: 하나의 서버로 제한
allowed_users = []              # 비어 있으면 = 모두 허용
listen_to_bots = false
mention_only = false

# ── Slack ─────────────────────────────────────────────────
[channels.slack]
bot_token = "xoxb-..."
app_token = "xapp-..."
allowed_users = []
mention_only = true
```

### 채널별 예시

**Lark / Feishu:**

```toml
[channels.lark]
app_id = "cli_xxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = []
use_feishu = false              # Feishu(중국)은 true, Lark(국제)는 false
receive_mode = "websocket"      # "websocket" | "webhook"
mention_only = false
```

**Signal:**

```toml
[channels.signal]
phone_number = "+1234567890"
signal_cli_path = "/usr/local/bin/signal-cli"
allowed_users = ["+1987654321"]
```

**Matrix (E2EE 포함):**

```toml
[channels.matrix]
homeserver_url = "https://matrix.org"
username = "@prx-bot:matrix.org"
password = "secure-password"
allowed_users = ["@alice:matrix.org"]
```

**Email (IMAP/SMTP):**

```toml
[channels.email]
imap_host = "imap.gmail.com"
imap_port = 993
smtp_host = "smtp.gmail.com"
smtp_port = 587
username = "prx-bot@gmail.com"
password = "app-specific-password"
allowed_from = ["alice@example.com"]
```

**DingTalk:**

```toml
[channels.dingtalk]
app_key = "dingxxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxx"
robot_code = "dingxxxxxxxxx"
allowed_users = []
```

## DM 정책

PRX는 에이전트에게 다이렉트 메시지를 보낼 수 있는 사람을 세밀하게 제어할 수 있습니다. DM 정책은 채널별로 구성되며 수신 다이렉트 메시지가 처리되는 방식을 결정합니다.

### 정책 유형

| 정책 | 동작 |
|------|------|
| `pairing` | 발신자가 수락되기 전에 페어링 핸드셰이크가 필요합니다. 사용자는 인증을 위한 챌린지-응답 흐름을 완료해야 합니다. 향후 기능 -- 현재 `allowlist`로 대체됩니다. |
| `allowlist` | **(기본값)** 채널의 `allowed_users` 배열에 나열된 발신자만 에이전트와 상호작용할 수 있습니다. 목록에 없는 발신자의 메시지는 조용히 무시됩니다. |
| `open` | 모든 사용자가 에이전트에게 다이렉트 메시지를 보낼 수 있습니다. 프로덕션에서는 주의하여 사용하세요. |
| `disabled` | 모든 다이렉트 메시지가 무시됩니다. PRX가 그룹에서만 응답해야 할 때 유용합니다. |

### 설정

DM 정책은 채널 설정의 최상위에서 설정합니다:

```toml
[channels]
dm_policy = "allowlist"         # "pairing" | "allowlist" | "open" | "disabled"
```

각 채널의 `allowed_users` 배열이 해당 채널의 허용 목록입니다:

```toml
[channels.telegram]
bot_token = "..."
allowed_users = ["alice", "bob"]  # 이 사용자만 DM 가능
```

`dm_policy = "open"`인 경우 `allowed_users` 필드는 무시되고 모든 발신자가 수락됩니다.

## 그룹 정책

DM 정책과 유사하게 PRX는 에이전트가 참여하는 그룹 대화를 제어합니다:

| 정책 | 동작 |
|------|------|
| `allowlist` | **(기본값)** 채널의 그룹 허용 목록에 나열된 그룹만 모니터링됩니다. |
| `open` | 에이전트는 추가된 모든 그룹에서 응답합니다. |
| `disabled` | 모든 그룹 메시지가 무시됩니다. |

```toml
[channels]
group_policy = "allowlist"

[channels.telegram]
bot_token = "..."
# 그룹 허용 목록은 채널별로 구성됩니다
```

## 멘션 전용 모드

대부분의 채널은 `mention_only` 플래그를 지원합니다. 활성화되면 에이전트는 @멘션, 답장 또는 플랫폼별 트리거로 명시적으로 언급한 메시지에만 응답합니다. 그룹 채팅에서 에이전트가 모든 메시지에 응답하는 것을 방지하는 데 유용합니다.

```toml
[channels.discord]
bot_token = "..."
mention_only = true   # @멘션할 때만 응답
```

## 스트림 모드

일부 채널은 LLM 응답을 실시간으로 스트리밍하는 것을 지원합니다. `stream_mode` 설정은 스트리밍 출력이 표시되는 방식을 제어합니다:

| 모드 | 동작 |
|------|------|
| `edit` | 토큰이 도착하면 같은 메시지를 편집합니다 (Telegram, Discord) |
| `append` | 메시지에 새 텍스트를 추가합니다 |
| `none` | 전체 응답을 기다린 후 전송합니다 |

```toml
[channels.telegram]
bot_token = "..."
stream_mode = "edit"
draft_update_interval_ms = 1000   # 초안 업데이트 빈도(ms)
```

## 새 채널 추가

PRX 채널은 `Channel` 트레이트를 기반으로 합니다. 새 채널을 연결하려면:

1. `openprx.toml`에 채널 설정을 추가합니다
2. 데몬을 재시작합니다: `prx daemon`

또는 대화형 채널 마법사를 사용합니다:

```bash
prx channel add telegram
```

활성 채널을 나열하려면:

```bash
prx channel list
```

채널 연결 문제를 진단하려면:

```bash
prx channel doctor
```

## 채널 아키텍처

내부적으로 각 채널은:

1. 플랫폼에서 수신 메시지를 **수신**합니다 (폴링, 웹훅 또는 WebSocket을 통해)
2. DM/그룹 정책 및 허용 목록을 기반으로 메시지를 **필터링**합니다
3. 수락된 메시지를 처리를 위해 에이전트 루프로 **라우팅**합니다
4. 에이전트의 응답을 플랫폼 API를 통해 다시 **전송**합니다
5. 상태를 **보고**하고 지수 백오프로 자동 재연결합니다

모든 채널은 데몬 프로세스 내에서 동시에 실행되며, 에이전트 런타임, 메모리, 도구 하위 시스템을 공유합니다.

## 다음 단계

채널을 선택하여 구체적인 설정에 대해 알아보세요:

- [Telegram](./telegram) -- Bot API 통합
- [Discord](./discord) -- 슬래시 명령이 있는 봇
- [Slack](./slack) -- Socket Mode가 있는 Slack 앱
- [WhatsApp](./whatsapp) -- Cloud API 통합
- [Signal](./signal) -- Signal CLI 브릿지
- [Matrix](./matrix) -- E2EE가 포함된 페더레이션 채팅
- [Lark / Feishu](./lark) -- 엔터프라이즈 메시징
- [Email](./email) -- IMAP/SMTP 통합
