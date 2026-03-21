---
title: WhatsApp Web
description: 네이티브 Web 클라이언트(wa-rs)를 통해 PRX를 WhatsApp에 연결합니다
---

# WhatsApp Web

> 종단 간 암호화, QR 코드 또는 페어 코드 연결, 전체 미디어 지원을 갖춘 네이티브 Rust Web 클라이언트(wa-rs)를 사용하여 PRX를 WhatsApp에 연결합니다.

## 사전 요구 사항

- 활성 전화번호가 있는 WhatsApp 계정
- `whatsapp-web` 기능 플래그로 빌드된 PRX
- Meta Business API 계정이 필요하지 않습니다

## 빠른 설정

### 1. 기능 플래그 활성화

WhatsApp Web 지원으로 PRX를 빌드합니다:

```bash
cargo build --release --features whatsapp-web
```

### 2. 설정

```toml
[channels_config.whatsapp]
session_path = "~/.config/openprx/whatsapp-session.db"
allowed_numbers = ["+1234567890", "*"]
```

페어 코드 연결의 경우 (QR 코드 대신):

```toml
[channels_config.whatsapp]
session_path = "~/.config/openprx/whatsapp-session.db"
pair_phone = "15551234567"
allowed_numbers = ["*"]
```

### 3. 계정 연결

PRX를 시작합니다. 최초 실행 시 다음 중 하나가 표시됩니다:
- WhatsApp 모바일 앱으로 스캔할 **QR 코드**, 또는
- `pair_phone`이 설정된 경우 **페어 코드** (WhatsApp > 연결된 기기에서 코드를 입력)

### 4. 확인

```bash
prx channel doctor whatsapp
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `session_path` | `String` | *필수* | 세션 SQLite 데이터베이스 경로. 이 필드가 있으면 Web 모드가 선택됩니다 |
| `pair_phone` | `String` | `null` | 페어 코드 연결용 전화번호 (형식: 국가 코드 + 번호, 예: `"15551234567"`). 설정하지 않으면 QR 코드 페어링이 사용됩니다 |
| `pair_code` | `String` | `null` | 연결을 위한 사용자 지정 페어 코드. 비워두면 WhatsApp이 생성합니다 |
| `allowed_numbers` | `[String]` | `[]` | E.164 형식의 허용된 전화번호 (예: `"+1234567890"`). `"*"` = 모두 허용 |

## 기능

- **Meta Business API 불필요** -- WhatsApp Web 프로토콜을 사용하여 연결된 기기로 직접 연결합니다
- **종단 간 암호화** -- 공식 WhatsApp 클라이언트와 동일한 Signal Protocol로 메시지가 암호화됩니다
- **QR 코드 및 페어 코드 연결** -- WhatsApp 계정을 연결하는 두 가지 방법
- **영구 세션** -- 세션 상태가 로컬 SQLite 데이터베이스에 저장되어 재시작 시에도 유지됩니다
- **그룹 및 DM** -- 개인 채팅과 그룹 대화를 모두 지원합니다
- **미디어 메시지** -- 이미지, 문서 및 기타 미디어 유형을 처리합니다
- **음성 메모 지원** -- 수신 음성 메모를 전사(STT 구성 시)하고 선택적으로 음성 메모로 응답합니다(TTS 구성 시)
- **프레즌스 및 리액션** -- 타이핑 표시 및 메시지 리액션을 지원합니다

## 제한 사항

- 컴파일 시 `whatsapp-web` 기능 플래그가 필요합니다
- 전화번호당 하나의 연결된 기기 세션만 지원됩니다 (WhatsApp 제한)
- 장기간 사용하지 않으면 세션이 만료될 수 있으며 재연결이 필요합니다
- macOS, Linux, Windows WSL2만 지원됩니다 (PRX 자체와 동일)
- WhatsApp이 가끔 재인증을 요구할 수 있습니다

## 문제 해결

### QR 코드가 나타나지 않음
- `session_path`가 설정되어 있고 디렉터리가 쓰기 가능한지 확인합니다
- PRX가 `--features whatsapp-web`으로 빌드되었는지 확인합니다
- 세션 데이터베이스를 삭제하고 재시작하여 새 페어링을 강제합니다

### 세션 만료 또는 연결 해제
- 구성된 `session_path`의 세션 데이터베이스를 삭제합니다
- PRX를 재시작하여 새 QR 코드 또는 페어 코드 흐름을 트리거합니다

### 음성 메모가 전사되지 않음
- PRX 설정에서 `[transcription]` 섹션을 구성하여 STT를 활성화합니다
- 지원되는 STT 백엔드: OpenAI Whisper, Deepgram, AssemblyAI, Google STT

::: tip Cloud API 모드
Meta Business 계정이 있고 웹훅 기반 메시징을 선호하는 경우 [WhatsApp (Cloud API)](./whatsapp)를 참조하세요.
:::
