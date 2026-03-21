---
title: Email
description: IMAP 및 SMTP를 통해 PRX를 이메일에 연결합니다
---

# Email

> 실시간 전달을 위한 IDLE 푸시 지원과 함께 수신용 IMAP과 발신용 SMTP를 사용하여 PRX를 모든 이메일 제공업체에 연결합니다.

## 사전 요구 사항

- IMAP 및 SMTP 접근이 활성화된 이메일 계정
- IMAP/SMTP 서버 호스트명 및 포트
- 이메일 자격 증명 (사용자명과 비밀번호 또는 앱 전용 비밀번호)

## 빠른 설정

### 1. IMAP 접근 활성화

대부분의 이메일 제공업체:
- **Gmail**: Gmail 설정 > 전달 및 POP/IMAP에서 IMAP을 활성화하고, [앱 비밀번호](https://myaccount.google.com/apppasswords)를 생성합니다
- **Outlook**: IMAP은 기본적으로 활성화되어 있습니다; 2FA가 활성화된 경우 앱 비밀번호를 사용합니다
- **자체 호스팅**: 메일 서버에서 IMAP이 활성화되어 있는지 확인합니다

### 2. 설정

```toml
[channels_config.email]
imap_host = "imap.gmail.com"
imap_port = 993
smtp_host = "smtp.gmail.com"
smtp_port = 465
username = "your-bot@gmail.com"
password = "your-app-password"
from_address = "your-bot@gmail.com"
allowed_senders = ["trusted-user@example.com"]
```

### 3. 확인

```bash
prx channel doctor email
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `imap_host` | `String` | *필수* | IMAP 서버 호스트명 (예: `"imap.gmail.com"`) |
| `imap_port` | `u16` | `993` | IMAP 서버 포트 (TLS의 경우 993) |
| `imap_folder` | `String` | `"INBOX"` | 새 메시지를 폴링할 IMAP 폴더 |
| `smtp_host` | `String` | *필수* | SMTP 서버 호스트명 (예: `"smtp.gmail.com"`) |
| `smtp_port` | `u16` | `465` | SMTP 서버 포트 (암시적 TLS의 경우 465, STARTTLS의 경우 587) |
| `smtp_tls` | `bool` | `true` | SMTP 연결에 TLS를 사용합니다 |
| `username` | `String` | *필수* | IMAP/SMTP 인증을 위한 이메일 사용자명 |
| `password` | `String` | *필수* | 이메일 비밀번호 또는 앱 전용 비밀번호 |
| `from_address` | `String` | *필수* | 발신 이메일의 보낸 사람 주소 |
| `idle_timeout_secs` | `u64` | `1740` | 재연결 전 IDLE 타임아웃 (초 단위, 기본값: RFC 2177에 따라 29분) |
| `allowed_senders` | `[String]` | `[]` | 허용된 발신자 주소 또는 도메인. 비어 있으면 = 모두 거부. `"*"` = 모두 허용 |
| `default_subject` | `String` | `"PRX Message"` | 발신 이메일의 기본 제목 |

## 기능

- **IMAP IDLE** -- 새 이메일에 대한 실시간 푸시 알림 (RFC 2177), 폴링 지연 없음
- **TLS 암호화** -- IMAP 및 SMTP 서버와의 연결이 TLS로 암호화됩니다
- **MIME 파싱** -- 멀티파트 이메일을 처리하고 텍스트 콘텐츠와 첨부 파일을 추출합니다
- **도메인 수준 필터링** -- 발신자 허용 목록에서 전체 도메인 (예: `"@company.com"`)을 허용합니다
- **자동 재연결** -- 29분 타임아웃 후 IDLE 연결을 재설정합니다
- **답장 스레딩** -- 적절한 `In-Reply-To` 헤더로 원본 이메일 스레드에 응답합니다

## 제한 사항

- 설정된 IMAP 폴더 (기본값: INBOX)의 이메일만 처리합니다
- HTML 이메일은 일반 텍스트로 처리됩니다 (HTML 태그가 제거됨)
- 메모리 제약에 따라 대용량 첨부 파일이 완전히 처리되지 않을 수 있습니다
- 일부 이메일 제공업체는 2FA가 활성화된 경우 앱 전용 비밀번호를 요구합니다
- IDLE 지원은 IMAP 서버에 따라 다릅니다; 대부분의 최신 서버는 지원합니다

## 문제 해결

### IMAP 서버에 연결할 수 없음
- `imap_host`와 `imap_port`가 제공업체에 맞는지 확인합니다
- 이메일 계정 설정에서 IMAP 접근이 활성화되어 있는지 확인합니다
- Gmail을 사용하는 경우 앱 비밀번호를 생성합니다 (2FA가 활성화되면 일반 비밀번호는 차단됨)
- TLS가 방화벽에 의해 차단되지 않는지 확인합니다

### 이메일이 감지되지 않음
- `imap_folder`가 올바른지 확인합니다 (기본값: `"INBOX"`)
- 발신자의 주소 또는 도메인이 `allowed_senders`에 있는지 확인합니다
- 일부 제공업체는 이메일이 IMAP에 나타나기까지 지연이 있을 수 있습니다

### 답장이 전송되지 않음
- `smtp_host`, `smtp_port`, `smtp_tls` 설정이 제공업체와 일치하는지 확인합니다
- SMTP 인증 자격 증명을 확인합니다 (IMAP과 동일한 `username`/`password` 또는 별도의 SMTP 자격 증명)
- SMTP 거부 이유 (예: SPF/DKIM 실패)에 대해 서버 로그를 검토합니다
