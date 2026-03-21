---
title: iMessage
description: macOS에서 PRX를 iMessage에 연결합니다
---

# iMessage

> 네이티브 iMessage 통합을 위해 macOS Messages 데이터베이스와 AppleScript 브릿지를 사용하여 PRX를 iMessage에 연결합니다.

## 사전 요구 사항

- **macOS 전용** -- iMessage 통합은 macOS가 필요합니다 (Monterey 12.0 이상 권장)
- Messages 앱에 로그인된 활성 iMessage 계정
- PRX 프로세스에 부여된 전체 디스크 접근 (Messages 데이터베이스 읽기용)

## 빠른 설정

### 1. 전체 디스크 접근 부여

1. **시스템 설정 > 개인정보 보호 및 보안 > 전체 디스크 접근**을 엽니다
2. 터미널 애플리케이션 또는 PRX 바이너리를 목록에 추가합니다
3. 터미널 또는 PRX 프로세스를 재시작합니다

### 2. 설정

```toml
[channels_config.imessage]
allowed_contacts = ["+1234567890", "user@icloud.com"]
```

### 3. 확인

```bash
prx channel doctor imessage
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `allowed_contacts` | `[String]` | *필수* | 허용된 iMessage 연락처: 전화번호(E.164) 또는 이메일 주소. 비어 있으면 = 모두 거부 |

## 기능

- **네이티브 macOS 통합** -- Messages SQLite 데이터베이스에서 직접 읽습니다
- **AppleScript 브릿지** -- `osascript`를 통해 안정적인 메시지 전달로 응답을 전송합니다
- **전화 및 이메일 연락처** -- 전화번호 또는 Apple ID 이메일 주소로 필터링합니다
- **최신 macOS 지원** -- macOS Ventura 이후에서 사용되는 `attributedBody` typedstream 형식을 처리합니다
- **폴링 기반** -- Messages 데이터베이스에서 새 메시지를 주기적으로 확인합니다

## 제한 사항

- **macOS 전용** -- Linux 또는 Windows에서는 사용할 수 없습니다
- `~/Library/Messages/chat.db` 읽기를 위해 전체 디스크 접근이 필요합니다
- Messages 앱이 실행 중이어야 합니다 (최소한 로그인 상태)
- 새 연락처와의 대화를 먼저 시작할 수 없습니다; 연락처에 기존 대화가 있어야 합니다
- 그룹 iMessage 채팅은 현재 지원되지 않습니다
- 폴링 간격으로 인해 푸시 기반 채널에 비해 약간의 지연이 있습니다
- AppleScript 기반 전송은 헤드리스(SSH 전용) macOS 환경에서 작동하지 않을 수 있습니다

## 문제 해결

### Messages 데이터베이스 읽기 "권한 거부"
- PRX 프로세스 또는 상위 터미널에 전체 디스크 접근이 부여되었는지 확인합니다
- macOS Ventura 이상에서 **시스템 설정 > 개인정보 보호 및 보안 > 전체 디스크 접근**을 확인합니다
- 권한 부여 후 터미널을 재시작합니다

### 메시지가 감지되지 않음
- Messages 앱이 Apple ID로 로그인되어 있는지 확인합니다
- 연락처가 `allowed_contacts`에 있는지 확인합니다 (E.164 형식의 전화번호 또는 이메일)
- 새 메시지가 감지되려면 폴링 사이클이 필요할 수 있습니다

### 응답이 전송되지 않음
- Messages 앱이 실행 중인지 확인합니다 (로그인 상태뿐만 아니라)
- AppleScript 전송은 GUI 접근이 필요합니다; SSH 전용 세션은 실패할 수 있습니다
- macOS Console.app에서 AppleScript 오류를 확인합니다
