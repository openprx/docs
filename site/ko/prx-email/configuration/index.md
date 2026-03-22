---
title: 설정 레퍼런스
description: "전송 설정, 스토리지 옵션, 첨부 파일 정책, 환경 변수, 런타임 튜닝을 포함한 PRX-Email 설정의 완전한 레퍼런스."
---

# 설정 레퍼런스

이 페이지는 모든 PRX-Email 설정 옵션, 환경 변수, 런타임 설정의 완전한 레퍼런스입니다.

## 전송 설정

`EmailTransportConfig` 구조체는 IMAP 및 SMTP 연결을 모두 설정합니다:

```rust
use prx_email::plugin::{
    EmailTransportConfig, ImapConfig, SmtpConfig, AuthConfig,
    AttachmentPolicy, AttachmentStoreConfig,
};

let config = EmailTransportConfig {
    imap: ImapConfig { /* ... */ },
    smtp: SmtpConfig { /* ... */ },
    attachment_store: Some(AttachmentStoreConfig { /* ... */ }),
    attachment_policy: AttachmentPolicy::default(),
};
```

### IMAP 설정

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `imap.host` | `String` | (필수) | IMAP 서버 호스트명 |
| `imap.port` | `u16` | (필수) | IMAP 서버 포트 (일반적으로 993) |
| `imap.user` | `String` | (필수) | IMAP 사용자 이름 |
| `imap.auth.password` | `Option<String>` | `None` | LOGIN 인증을 위한 비밀번호 |
| `imap.auth.oauth_token` | `Option<String>` | `None` | XOAUTH2를 위한 OAuth 토큰 |

### SMTP 설정

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `smtp.host` | `String` | (필수) | SMTP 서버 호스트명 |
| `smtp.port` | `u16` | (필수) | SMTP 서버 포트 (465 또는 587) |
| `smtp.user` | `String` | (필수) | SMTP 사용자 이름 |
| `smtp.auth.password` | `Option<String>` | `None` | PLAIN/LOGIN을 위한 비밀번호 |
| `smtp.auth.oauth_token` | `Option<String>` | `None` | XOAUTH2를 위한 OAuth 토큰 |

### 유효성 검사 규칙

- `imap.host`와 `smtp.host`는 비어 있어서는 안 됩니다
- `imap.user`와 `smtp.user`는 비어 있어서는 안 됩니다
- 각 프로토콜에 대해 `password` 또는 `oauth_token` 중 정확히 하나만 설정해야 합니다
- `attachment_policy.max_size_bytes`는 0보다 커야 합니다
- `attachment_policy.allowed_content_types`는 비어 있어서는 안 됩니다

## 스토리지 설정

### StoreConfig

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enable_wal` | `bool` | `true` | WAL 저널 모드 활성화 |
| `busy_timeout_ms` | `u64` | `5000` | SQLite 바쁨 타임아웃 (밀리초) |
| `wal_autocheckpoint_pages` | `i64` | `1000` | 자동 체크포인트 간격 페이지 수 |
| `synchronous` | `SynchronousMode` | `Normal` | 동기화 모드: `Full`, `Normal`, 또는 `Off` |

### 적용되는 SQLite 프라그마

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;        -- enable_wal = true인 경우
PRAGMA synchronous = NORMAL;      -- synchronous 설정과 일치
PRAGMA wal_autocheckpoint = 1000; -- wal_autocheckpoint_pages와 일치
```

## 첨부 파일 정책

### AttachmentPolicy

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `max_size_bytes` | `usize` | `26,214,400` (25 MiB) | 최대 첨부 파일 크기 |
| `allowed_content_types` | `HashSet<String>` | 아래 참조 | 허용된 MIME 타입 |

### 기본 허용 MIME 타입

| MIME 타입 | 설명 |
|---------|------|
| `application/pdf` | PDF 문서 |
| `image/jpeg` | JPEG 이미지 |
| `image/png` | PNG 이미지 |
| `text/plain` | 일반 텍스트 파일 |
| `application/zip` | ZIP 아카이브 |

### AttachmentStoreConfig

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | (필수) | 첨부 파일 퍼시스턴스 활성화 |
| `dir` | `String` | (필수) | 저장된 첨부 파일을 위한 루트 디렉토리 |

::: warning 경로 안전성
첨부 파일 경로는 디렉토리 탐색 공격에 대해 유효성 검사됩니다. 심볼릭 링크 기반 탈출을 포함하여 설정된 `dir` 루트 외부로 해석되는 모든 경로는 거부됩니다.
:::

## 동기화 러너 설정

### SyncRunnerConfig

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `max_concurrency` | `usize` | `4` | 러너 틱당 최대 작업 수 |
| `base_backoff_seconds` | `i64` | `10` | 실패 시 초기 백오프 |
| `max_backoff_seconds` | `i64` | `300` | 최대 백오프 (5분) |

## 환경 변수

### OAuth 토큰 관리

| 변수 | 설명 |
|------|------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | IMAP OAuth 액세스 토큰 |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | SMTP OAuth 액세스 토큰 |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | IMAP 토큰 만료 (Unix 초) |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | SMTP 토큰 만료 (Unix 초) |

기본 접두사는 `PRX_EMAIL`입니다. 런타임에 이들을 로드하려면 `reload_auth_from_env("PRX_EMAIL")`을 사용합니다.

### WASM 플러그인

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PRX_EMAIL_ENABLE_REAL_NETWORK` | 미설정 (비활성화) | WASM 컨텍스트에서 실제 IMAP/SMTP를 활성화하려면 `1`로 설정 |

## API 제한

| 제한 | 값 | 설명 |
|------|------|------|
| 목록/검색 제한 최솟값 | 1 | 최소 `limit` 파라미터 |
| 목록/검색 제한 최댓값 | 500 | 최대 `limit` 파라미터 |
| 디버그 메시지 잘라내기 | 160자 | 프로바이더 디버그 메시지가 잘려남 |
| 메시지 스니펫 길이 | 120자 | 자동 생성 메시지 스니펫 |

## 오류 코드

| 코드 | 설명 |
|------|------|
| `Validation` | 입력 유효성 검사 실패 (빈 필드, 범위 벗어난 제한, 알 수 없는 기능) |
| `FeatureDisabled` | 기능 플래그로 인해 작업 차단됨 |
| `Network` | IMAP/SMTP 연결 또는 프로토콜 오류 |
| `Provider` | 이메일 프로바이더가 작업을 거부함 |
| `Storage` | SQLite 데이터베이스 오류 |

## 아웃박스 상수

| 상수 | 값 | 설명 |
|------|------|------|
| 백오프 기본값 | 5초 | 초기 재시도 백오프 |
| 백오프 공식 | `5 * 2^retries` | 지수적 증가 |
| 최대 재시도 | 무제한 | 백오프 증가로 제한됨 |
| 멱등성 키 | `outbox-{id}-{retries}` | 결정론적 Message-ID |

## 기능 플래그

| 플래그 | 설명 | 위험 수준 |
|--------|------|---------|
| `inbox_read` | 메시지 목록 조회 및 가져오기 | 낮음 |
| `inbox_search` | 쿼리로 메시지 검색 | 낮음 |
| `email_send` | 새 이메일 전송 | 중간 |
| `email_reply` | 기존 이메일에 답장 | 중간 |
| `outbox_retry` | 실패한 아웃박스 메시지 재시도 | 낮음 |

## 로깅

PRX-Email은 다음 형식으로 stderr에 구조화된 로그를 출력합니다:

```
[prx_email][structured] {"event":"...","account":...,"folder":...,"message_id":...,"run_id":...,"error_code":...}
[prx_email][debug] context | details
```

### 보안

- OAuth 토큰, 비밀번호, API 키는 **절대 로그에 기록되지 않습니다**
- 이메일 주소는 디버그 로그에서 수정됩니다 (예: `a***@example.com`)
- 프로바이더 디버그 메시지는 정화됩니다: 인증 헤더가 수정되고 출력이 160자로 잘립니다

## 다음 단계

- [설치](../getting-started/installation) -- PRX-Email 설정
- [계정 관리](../accounts/) -- 계정 및 기능 설정
- [문제 해결](../troubleshooting/) -- 설정 문제 해결
