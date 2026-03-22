---
title: 계정 관리
description: "PRX-Email에서 이메일 계정 생성, 설정, 관리. 독립적인 IMAP/SMTP 설정이 있는 멀티 계정 설정을 지원합니다."
---

# 계정 관리

PRX-Email은 여러 이메일 계정을 지원하며, 각 계정은 자체 IMAP 및 SMTP 설정, 인증 자격 증명, 기능 플래그를 가집니다. 계정은 SQLite 데이터베이스에 저장되고 고유한 `account_id`로 식별됩니다.

## 계정 생성

`EmailRepository`를 사용하여 새 계정을 생성합니다:

```rust
use prx_email::db::{EmailRepository, NewAccount};

let account_id = repo.create_account(&NewAccount {
    email: "alice@example.com".to_string(),
    display_name: Some("Alice".to_string()),
    now_ts: current_timestamp(),
})?;
```

### 계정 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `i64` | 자동 생성된 기본 키 |
| `email` | `String` | 이메일 주소 (IMAP/SMTP 사용자로 사용됨) |
| `display_name` | `Option<String>` | 계정의 사람이 읽기 쉬운 이름 |
| `created_at` | `i64` | 생성 시간의 Unix 타임스탬프 |
| `updated_at` | `i64` | 마지막 업데이트 시간의 Unix 타임스탬프 |

## 계정 조회

```rust
let account = repo.get_account(account_id)?;
if let Some(acct) = account {
    println!("Email: {}", acct.email);
    println!("Name: {}", acct.display_name.unwrap_or_default());
}
```

## 멀티 계정 설정

각 계정은 자체적으로 독립적으로 작동합니다:

- **IMAP 연결** -- 별도의 서버, 포트, 자격 증명
- **SMTP 연결** -- 별도의 서버, 포트, 자격 증명
- **폴더** -- 계정별로 동기화된 폴더 목록
- **동기화 상태** -- 계정/폴더 쌍별 커서 추적
- **기능 플래그** -- 독립적인 기능 활성화
- **아웃박스** -- 메시지별 추적이 있는 별도의 전송 대기열

```rust
// 계정 1: OAuth가 있는 Gmail
let gmail_id = repo.create_account(&NewAccount {
    email: "alice@gmail.com".to_string(),
    display_name: Some("Alice (Gmail)".to_string()),
    now_ts: now,
})?;

// 계정 2: 비밀번호가 있는 업무용 이메일
let work_id = repo.create_account(&NewAccount {
    email: "alice@company.com".to_string(),
    display_name: Some("Alice (Work)".to_string()),
    now_ts: now,
})?;
```

## 기능 플래그

PRX-Email은 계정별로 어떤 기능이 활성화되는지 제어하기 위해 기능 플래그를 사용합니다. 새 기능의 단계적 롤아웃을 지원합니다.

### 사용 가능한 기능 플래그

| 플래그 | 설명 |
|--------|------|
| `inbox_read` | 메시지 목록 조회 및 읽기 허용 |
| `inbox_search` | 메시지 검색 허용 |
| `email_send` | 새 이메일 전송 허용 |
| `email_reply` | 이메일 답장 허용 |
| `outbox_retry` | 실패한 아웃박스 메시지 재시도 허용 |

### 기능 플래그 관리

```rust
// 특정 계정에 대해 기능 활성화
plugin.set_account_feature(account_id, "email_send", true, now)?;

// 기능 비활성화
plugin.set_account_feature(account_id, "email_send", false, now)?;

// 모든 계정의 전역 기본값 설정
plugin.set_feature_default("inbox_read", true, now)?;

// 기능이 활성화되어 있는지 확인
let enabled = plugin.is_feature_enabled(account_id, "email_send")?;
```

### 퍼센트 기반 롤아웃

계정의 일정 비율로 기능을 롤아웃합니다:

```rust
// 계정의 50%에 email_send 활성화
let enabled = plugin.apply_percentage_rollout(
    account_id,
    "email_send",
    50,  // percentage
    now,
)?;
println!("Feature enabled for this account: {}", enabled);
```

롤아웃은 `account_id % 100`을 사용하여 계정을 버킷에 결정론적으로 할당하여 재시작 시에도 일관된 동작을 보장합니다.

## 폴더 관리

폴더는 IMAP 동기화 중에 자동으로 생성되거나 수동으로 생성할 수 있습니다:

```rust
use prx_email::db::NewFolder;

let folder_id = repo.create_folder(&NewFolder {
    account_id,
    name: "INBOX".to_string(),
    path: "INBOX".to_string(),
    now_ts: now,
})?;
```

### 폴더 목록 조회

```rust
let folders = repo.list_folders(account_id)?;
for folder in &folders {
    println!("{}: {} ({})", folder.id, folder.name, folder.path);
}
```

## 다음 단계

- [IMAP 설정](./imap) -- IMAP 서버 연결 설정
- [SMTP 설정](./smtp) -- SMTP 전송 파이프라인 설정
- [OAuth 인증](./oauth) -- Gmail 및 Outlook을 위한 OAuth 설정
