---
title: 빠른 시작
description: "PRX-Email 설정, 첫 번째 계정 생성, 받은 편지함 동기화, 5분 안에 이메일 전송."
---

# 빠른 시작

이 가이드는 5분 이내에 처음부터 작동하는 이메일 설정까지 안내합니다. 가이드를 마치면 계정이 설정된 PRX-Email이 구성되고, 받은 편지함이 동기화되고, 테스트 이메일이 전송됩니다.

::: tip 사전 요구사항
Rust 1.85+ 설치가 필요합니다. 빌드 의존성은 [설치 가이드](./installation)를 참조하세요.
:::

## 1단계: 프로젝트에 PRX-Email 추가

새 Rust 프로젝트를 만들거나 기존 프로젝트에 추가합니다:

```bash
cargo new my-email-app
cd my-email-app
```

`Cargo.toml`에 의존성을 추가합니다:

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

## 2단계: 데이터베이스 초기화

PRX-Email은 모든 퍼시스턴스에 SQLite를 사용합니다. 스토어를 열고 마이그레이션을 실행합니다:

```rust
use prx_email::db::{EmailStore, EmailRepository, NewAccount};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // SQLite 데이터베이스 파일 열기 (또는 생성)
    let store = EmailStore::open("./email.db")?;

    // 모든 테이블을 생성하기 위해 마이그레이션 실행
    store.migrate()?;

    // 데이터베이스 작업을 위한 저장소 생성
    let repo = EmailRepository::new(&store);

    println!("Database initialized successfully.");
    Ok(())
}
```

데이터베이스는 기본적으로 WAL 모드, 외래 키 활성화, 5초 바쁨 타임아웃으로 생성됩니다.

## 3단계: 이메일 계정 생성

```rust
let now = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)?
    .as_secs() as i64;

let account_id = repo.create_account(&NewAccount {
    email: "you@example.com".to_string(),
    display_name: Some("Your Name".to_string()),
    now_ts: now,
})?;

println!("Created account ID: {}", account_id);
```

## 4단계: 전송 설정 및 플러그인 생성

```rust
use prx_email::plugin::{
    EmailPlugin, EmailTransportConfig, ImapConfig, SmtpConfig,
    AuthConfig, AttachmentPolicy,
};

let config = EmailTransportConfig {
    imap: ImapConfig {
        host: "imap.example.com".to_string(),
        port: 993,
        user: "you@example.com".to_string(),
        auth: AuthConfig {
            password: Some("your-app-password".to_string()),
            oauth_token: None,
        },
    },
    smtp: SmtpConfig {
        host: "smtp.example.com".to_string(),
        port: 465,
        user: "you@example.com".to_string(),
        auth: AuthConfig {
            password: Some("your-app-password".to_string()),
            oauth_token: None,
        },
    },
    attachment_store: None,
    attachment_policy: AttachmentPolicy::default(),
};

let plugin = EmailPlugin::new_with_config(repo, config);
```

## 5단계: 받은 편지함 동기화

```rust
use prx_email::plugin::SyncRequest;

let result = plugin.sync(SyncRequest {
    account_id,
    folder: Some("INBOX".to_string()),
    cursor: None,
    now_ts: now,
    max_messages: 50,
});

match result {
    Ok(()) => println!("Inbox synced successfully."),
    Err(e) => eprintln!("Sync failed: {:?}", e),
}
```

## 6단계: 메시지 목록 조회

```rust
use prx_email::plugin::ListMessagesRequest;

let messages = plugin.list(ListMessagesRequest {
    account_id,
    limit: 10,
})?;

for msg in &messages {
    println!(
        "[{}] {} - {}",
        msg.message_id,
        msg.sender.as_deref().unwrap_or("unknown"),
        msg.subject.as_deref().unwrap_or("(no subject)"),
    );
}
```

## 7단계: 이메일 전송

```rust
use prx_email::plugin::SendEmailRequest;

let response = plugin.send(SendEmailRequest {
    account_id,
    to: "recipient@example.com".to_string(),
    subject: "Hello from PRX-Email".to_string(),
    body_text: "This is a test email sent via PRX-Email.".to_string(),
    now_ts: now,
    attachment: None,
    failure_mode: None,
});

if response.ok {
    let result = response.data.as_ref().unwrap();
    println!("Sent! Outbox ID: {}, Status: {}", result.outbox_id, result.status);
} else {
    let error = response.error.as_ref().unwrap();
    eprintln!("Send failed: {:?} - {}", error.code, error.message);
}
```

## 8단계: 메트릭 확인

```rust
let metrics = plugin.metrics_snapshot();
println!("Sync attempts: {}", metrics.sync_attempts);
println!("Sync success:  {}", metrics.sync_success);
println!("Sync failures: {}", metrics.sync_failures);
println!("Send failures: {}", metrics.send_failures);
println!("Retry count:   {}", metrics.retry_count);
```

## 현재 구성된 내용

이 단계들을 완료하면 애플리케이션은 다음을 갖추게 됩니다:

| 컴포넌트 | 상태 |
|---------|------|
| SQLite 데이터베이스 | 전체 스키마로 초기화됨 |
| 이메일 계정 | 생성 및 설정됨 |
| IMAP 동기화 | 연결되어 메시지 페칭 중 |
| SMTP 아웃박스 | 원자적 전송 파이프라인으로 준비됨 |
| 메트릭 | 동기화 및 전송 작업 추적 중 |

## 일반 프로바이더 설정

| 프로바이더 | IMAP 호스트 | IMAP 포트 | SMTP 호스트 | SMTP 포트 | 인증 |
|---------|-----------|---------|-----------|---------|------|
| Gmail | `imap.gmail.com` | 993 | `smtp.gmail.com` | 465 | 앱 비밀번호 또는 OAuth |
| Outlook | `outlook.office365.com` | 993 | `smtp.office365.com` | 587 | OAuth (권장) |
| Yahoo | `imap.mail.yahoo.com` | 993 | `smtp.mail.yahoo.com` | 465 | 앱 비밀번호 |
| Fastmail | `imap.fastmail.com` | 993 | `smtp.fastmail.com` | 465 | 앱 비밀번호 |

::: warning Gmail
Gmail은 **앱 비밀번호** (2FA 활성화 필요) 또는 **OAuth 2.0**이 필요합니다. 일반 비밀번호는 IMAP/SMTP에서 작동하지 않습니다. 설정 지침은 [OAuth 가이드](../accounts/oauth)를 참조하세요.
:::

## 다음 단계

- [IMAP 설정](../accounts/imap) -- 고급 IMAP 설정 및 멀티 폴더 동기화
- [SMTP 설정](../accounts/smtp) -- 아웃박스 파이프라인, 재시도 로직, 첨부 파일 처리
- [OAuth 인증](../accounts/oauth) -- Gmail 및 Outlook을 위한 OAuth 설정
- [SQLite 스토리지](../storage/) -- 데이터베이스 튜닝 및 용량 계획
